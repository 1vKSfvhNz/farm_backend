from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy import and_
from sqlalchemy.orm import joinedload, Session
from models import get_db_session
from models.elevage.ovin import Ovin, MiseBasOvin
from models.elevage import Animal, Evenement
from enums import AlertSeverity, SexeEnum
from enums.elevage import AlerteType, StatutAnimalEnum
from machine_learning.prediction.elevage.ovin import OvinProductionPredictor

class OvinAnalysis:
    """
    Classe principale pour l'analyse des données ovines et la génération d'alertes.
    Version améliorée avec :
    - Meilleure gestion des erreurs
    - Optimisation des requêtes SQL
    - Alertes plus détaillées avec suggestions
    - Analyse globale de l'élevage
    """
    
    def __init__(self, db_session: Optional[Session] = None):
        self.db = db_session if db_session else get_db_session()
        self.production_predictor = OvinProductionPredictor(db_session=self.db)
        
    def generate_alerts(self, animal_id: Optional[int] = None, days: int = 30) -> List[Dict]:
        """
        Génère toutes les alertes pour l'élevage ovin ou un animal spécifique.
        
        Args:
            animal_id: ID de l'animal à analyser (optionnel)
            days: Nombre de jours à analyser en arrière
            
        Returns:
            Liste de dictionnaires contenant les alertes triées par sévérité
        """
        alerts = []
        
        try:
            if animal_id:
                animal = self._get_animal_with_relations(animal_id)
                if not animal:
                    return []
                
                alerts.extend(self._check_animal_health(animal, days))
                alerts.extend(self._check_reproduction(animal, days))
            else:
                # Analyse pour tout l'élevage avec optimisation des requêtes
                ovins = self.db.query(Ovin).options(
                    joinedload(Ovin.race),
                    joinedload(Ovin.pesees),
                ).all()
                
                for ovin in ovins:
                    alerts.extend(self._check_animal_health(ovin, days))
                    alerts.extend(self._check_reproduction(ovin, days))
                
                alerts.extend(self._check_global_issues())
                alerts.extend(self._check_lambing_issues())
                alerts.extend(self._check_model_performance())
            
            # Trier les alertes par sévérité (critique en premier)
            severity_order = {AlertSeverity.CRITICAL: 0, AlertSeverity.HIGH: 1, 
                            AlertSeverity.MEDIUM: 2, AlertSeverity.LOW: 3}
            return sorted(alerts, key=lambda x: severity_order[AlertSeverity[x['severity']]])
        
        except Exception as e:
            # En cas d'erreur, retourner une alerte système
            return [{
                'type': AlerteType.SYSTEME,
                'severity': AlertSeverity.CRITICAL.name,
                'title': "Erreur d'analyse",
                'message': f"Une erreur est survenue lors de l'analyse: {str(e)}",
                'date': datetime.now()
            }]
    
    def _get_animal_with_relations(self, animal_id: int) -> Optional[Ovin]:
        """Récupère un ovin avec ses relations de manière optimisée."""
        return self.db.query(Ovin).options(
            joinedload(Ovin.race),
            joinedload(Ovin.pesees)
        ).get(animal_id)
    
    def _check_animal_health(self, animal: Ovin, days: int) -> List[Dict]:
        """Vérifie les problèmes de santé de l'animal avec des seuils configurables."""
        alerts = []
        threshold_date = datetime.now() - timedelta(days=days)
        
        # Vérification du poids avec des seuils configurables
        if animal.pesees and animal.race and animal.race.caracteristiques:
            latest_weight = max(animal.pesees, key=lambda p: p.date_pesee).poids if animal.pesees else None
            poids_standard = animal.race.caracteristiques.get('poids_standard')
            
            if latest_weight and poids_standard:
                poids_min = poids_standard * 0.8  # 20% en dessous
                poids_max = poids_standard * 1.2  # 20% au dessus
                
                if latest_weight < poids_min:
                    alerts.append({
                        'type': AlerteType.SANTE,
                        'severity': AlertSeverity.MEDIUM.name,
                        'title': f"Poids anormalement bas - {animal.numero_identification}",
                        'message': f"Le poids actuel ({latest_weight}kg) est inférieur de 20% au standard de la race ({poids_standard}kg)",
                        'animal_id': animal.id,
                        'date': datetime.now(),
                        'suggestions': [
                            "Vérifier la ration alimentaire",
                            "Contrôler la présence de parasites",
                            "Examen vétérinaire recommandé"
                        ]
                    })
                elif latest_weight > poids_max:
                    alerts.append({
                        'type': AlerteType.SANTE,
                        'severity': AlertSeverity.LOW.name,
                        'title': f"Poids anormalement élevé - {animal.numero_identification}",
                        'message': f"Le poids actuel ({latest_weight}kg) est supérieur de 20% au standard de la race ({poids_standard}kg)",
                        'animal_id': animal.id,
                        'date': datetime.now(),
                        'suggestions': [
                            "Adapter la ration énergétique",
                            "Vérifier l'accès aux pâturages"
                        ]
                    })
        
        # Vérification des événements de santé récents
        last_health_event = self.db.query(Evenement).filter(
            and_(
                Evenement.animal_id == animal.id,
                Evenement.type_evenement.in_(["Vaccination", "Traitement", "Maladie"]),
                Evenement.date_evenement >= threshold_date
            )
        ).order_by(Evenement.date_evenement.desc()).first()
        
        if not last_health_event or (datetime.now() - last_health_event.date_evenement).days > 180:
            last_event_type = last_health_event.type_evenement if last_health_event else "aucun"
            alerts.append({
                'type': AlerteType.SANTE,
                'severity': AlertSeverity.MEDIUM.name,
                'title': f"Contrôle sanitaire nécessaire - {animal.numero_identification}",
                'message': f"Aucun contrôle sanitaire depuis plus de 6 mois (dernier: {last_event_type})",
                'animal_id': animal.id,
                'date': datetime.now(),
                'suggestions': [
                    "Planifier une visite vétérinaire",
                    "Mettre à jour les vaccinations",
                    "Contrôler les parasites internes/externes"
                ]
            })
        
        return alerts
    
    def _check_reproduction(self, animal: Ovin, days: int) -> List[Dict]:
        """Vérifie les problèmes liés à la reproduction."""
        alerts = []
        threshold_date = datetime.now() - timedelta(days=days)
        
        if animal.sexe == SexeEnum.FEMELLE:
            # Vérification des mises bas
            last_lambing = self.db.query(MiseBasOvin).filter(
                MiseBasOvin.mere_id == animal.id
            ).order_by(MiseBasOvin.date_mise_bas.desc()).first()
            
            if last_lambing:
                # Vérification de l'intervalle entre mises bas
                days_since_lambing = (datetime.now().date() - last_lambing.date_mise_bas).days
                if days_since_lambing > 400:
                    alerts.append({
                        'type': AlerteType.REPRODUCTION,
                        'severity': AlertSeverity.MEDIUM.name,
                        'title': f"Intervalle long entre mises bas - {animal.numero_identification}",
                        'message': f"Plus de 400 jours depuis la dernière mise bas (le {last_lambing.date_mise_bas})",
                        'animal_id': animal.id,
                        'date': datetime.now(),
                        'suggestions': [
                            "Vérifier la fertilité de la brebis",
                            "Contrôler la nutrition en période de reproduction",
                            "Considérer un examen vétérinaire"
                        ]
                    })
                
                # Vérification de la productivité
                if last_lambing.nombre_agneaux == 0:
                    alerts.append({
                        'type': AlerteType.REPRODUCTION,
                        'severity': AlertSeverity.HIGH.name,
                        'title': f"Problème de reproduction - {animal.numero_identification}",
                        'message': "Aucun agneau lors de la dernière mise bas",
                        'animal_id': animal.id,
                        'date': datetime.now(),
                        'suggestions': [
                            "Évaluation de la fertilité",
                            "Vérifier la gestion de la reproduction",
                            "Considérer la réforme si le problème persiste"
                        ]
                    })
            
            # Pour les brebis en âge de reproduire mais sans mise bas
            if animal.date_naissance:
                age = (datetime.now().date() - animal.date_naissance).days / 365.25
                if 1.5 < age < 8 and not last_lambing:
                    alerts.append({
                        'type': AlerteType.REPRODUCTION,
                        'severity': AlertSeverity.MEDIUM.name,
                        'title': f"Brebis non mise bas - {animal.numero_identification}",
                        'message': f"Brebis de {age:.1f} ans sans mise bas enregistrée",
                        'animal_id': animal.id,
                        'date': datetime.now(),
                        'suggestions': [
                            "Vérifier la participation aux campagnes de reproduction",
                            "Contrôler l'état corporel",
                            "Évaluer la fertilité"
                        ]
                    })
        
        return alerts
    
    def _check_global_issues(self) -> List[Dict]:
        """Vérifie les problèmes globaux de l'élevage."""
        alerts = []
        
        # Seuil de mortalité configurable
        mortalite_seuil = 5  # animaux sur 30 jours
        
        # Vérification de la mortalité
        dead_animals = self.db.query(Animal).filter(
            Animal.statut == StatutAnimalEnum.MORT,
            Animal.date_deces >= datetime.now().date() - timedelta(days=30)
        ).count()
        
        if dead_animals > mortalite_seuil:
            alerts.append({
                'type': AlerteType.SANTE,
                'severity': AlertSeverity.CRITICAL.name,
                'title': "Taux de mortalité élevé",
                'message': f"{dead_animals} ovins morts dans les 30 derniers jours",
                'date': datetime.now(),
                'suggestions': [
                    "Enquête épidémiologique urgente",
                    "Revue des protocoles sanitaires",
                    "Contrôle vétérinaire global"
                ]
            })
        
        return alerts
    
    def _check_lambing_issues(self) -> List[Dict]:
        """Vérifie les problèmes liés aux mises bas."""
        alerts = []
        
        # Mises bas difficiles récentes (plus de 24h de travail)
        difficult_lambings = self.db.query(MiseBasOvin).options(
            joinedload(MiseBasOvin.mere)
        ).filter(
            and_(
                MiseBasOvin.date_mise_bas >= datetime.now() - timedelta(days=30),
            )
        ).all()
        
        for lambing in difficult_lambings:
            alerts.append({
                'type': AlerteType.REPRODUCTION,
                'severity': AlertSeverity.HIGH.name,
                'title': f"Mise bas difficile - {lambing.mere.numero_identification}",
                'animal_id': lambing.mere_id,
                'date': lambing.date_mise_bas,
                'suggestions': [
                    "Surveillance accrue pour la prochaine mise bas",
                    "Bilan vétérinaire post-partum",
                    "Adapter l'alimentation en fin de gestation"
                ]
            })
        
        return alerts
    
    def _check_model_performance(self) -> List[Dict]:
        """Vérifie la performance des modèles de prédiction."""
        alerts = []
        try:
            # Vérification de la performance du modèle de production de laine
            if self.production_predictor.models.get('production_laine'):
                perf = self.production_predictor.model_performance.get('production_laine')
                if perf and perf.r2 < 0.6:
                    alerts.append({
                        'type': AlerteType.SYSTEME,
                        'severity': AlertSeverity.MEDIUM.name,
                        'title': "Performance modèle faible",
                        'message': f"Le modèle de prédiction a une performance faible (R²={perf.r2:.2f})",
                        'date': datetime.now(),
                        'suggestions': [
                            "Vérifier la qualité des données d'entrée",
                            "Enrichir le jeu de données",
                            "Ré-entraîner le modèle avec de nouveaux paramètres"
                        ]
                    })
        except Exception as e:
            alerts.append({
                'type': AlerteType.SYSTEME,
                'severity': AlertSeverity.HIGH.name,
                'title': "Erreur de modèle",
                'message': f"Impossible d'évaluer la performance du modèle: {str(e)}",
                'date': datetime.now()
            })
        
        return alerts
    
    def get_animal_summary(self, animal_id: int) -> Dict:
        """Génère un rapport complet pour un animal spécifique."""
        animal = self._get_animal_with_relations(animal_id)
        if not animal:
            return None
            
        latest_weight = max(animal.pesees, key=lambda p: p.date_pesee).poids if animal.pesees else None
            
        summary = {
            'identification': animal.numero_identification,
            'type_production': animal.type_production.value if animal.type_production else None,
            'age': (datetime.now().date() - animal.date_naissance).days if animal.date_naissance else None,
            'poids_actuel': latest_weight,
            'alerts': self.generate_alerts(animal_id=animal_id),
            'recommendations': self._generate_recommendations(animal)
        }
        
        return summary
    
    def _generate_recommendations(self, animal: Ovin) -> List[str]:
        """Génère des recommandations spécifiques pour un animal."""
        recommendations = []
        
        # Recommandations basées sur la reproduction
        if animal.sexe == SexeEnum.FEMELLE and animal.date_naissance:
            age = (datetime.now().date() - animal.date_naissance).days / 365.25
            last_lambing = self.db.query(MiseBasOvin).filter(
                MiseBasOvin.mere_id == animal.id
            ).order_by(MiseBasOvin.date_mise_bas.desc()).first()
            
            if 1.5 < age < 8 and not last_lambing:
                recommendations.append("Inclure dans la prochaine campagne de reproduction")
            elif last_lambing and last_lambing.nombre_agneaux == 0:
                recommendations.append("Évaluer la fertilité avant la prochaine reproduction")
        
        return recommendations

# Exemple d'utilisation
if __name__ == "__main__":
    analyzer = OvinAnalysis()
    
    # Exemple 1: Alertes pour tout l'élevage
    print("=== Alertes pour tout l'élevage ===")
    all_alerts = analyzer.generate_alerts()
    for alert in all_alerts[:5]:  # Afficher les 5 premières alertes
        print(f"[{alert['severity']}] {alert['title']}: {alert['message']}")
    
    # Exemple 2: Rapport pour un animal spécifique
    print("\n=== Rapport pour un animal spécifique ===")
    animal_id = 1  # Remplacer par un ID existant
    summary = analyzer.get_animal_summary(animal_id)
    if summary:
        print(f"Rapport pour {summary['identification']}:")
        print(f"Âge: {summary['age']} jours")
        print(f"Poids actuel: {summary['poids_actuel']} kg")
        print(f"Nombre d'alertes: {len(summary['alerts'])}")
        print("Recommandations:", ", ".join(summary['recommendations']))