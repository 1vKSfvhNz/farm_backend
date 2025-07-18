from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import joinedload, Session
from models import get_db_session
from models.elevage.bovin import Bovin, Velage, StatutReproductionBovinEnum, TypeProductionBovinEnum
from models.elevage import Animal, ProductionLait, ControleLaitier, Evenement
from machine_learning.prediction.elevage.bovin import BovinProductionPredictor, BovinHealthMonitor
from enums import AlertSeverity
from enums.elevage import StatutAnimalEnum, AlerteType

class BovinAnalysis:
    """
    Classe principale pour l'analyse des données bovines et la génération d'alertes.
    Version améliorée avec :
    - Meilleure gestion des erreurs
    - Optimisation des requêtes SQL
    - Ajout de nouvelles analyses
    """
    
    def __init__(self, db_session: Optional[Session] = None):
        self.db = db_session if db_session else get_db_session()
        self.production_predictor = BovinProductionPredictor()
        self.health_monitor = BovinHealthMonitor()
        
    def generate_alerts(self, animal_id: Optional[int] = None, days: int = 7) -> List[Dict]:
        """
        Génère toutes les alertes pour l'élevage bovin ou un animal spécifique.
        
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
                alerts.extend(self._check_milk_production(animal, days))
                alerts.extend(self._check_nutrition(animal, days))
            else:
                # Analyse pour tout l'élevage avec optimisation des requêtes
                bovins = self.db.query(Bovin).options(
                    joinedload(Bovin.race),
                    joinedload(Bovin.pesees),
                    joinedload(Bovin.productions_lait),
                    joinedload(Bovin.controles_laitiers)
                ).all()
                
                for bovin in bovins:
                    alerts.extend(self._check_animal_health(bovin, days))
                    alerts.extend(self._check_reproduction(bovin, days))
                    alerts.extend(self._check_milk_production(bovin, days))
                    alerts.extend(self._check_nutrition(bovin, days))
                
                alerts.extend(self._check_global_issues())
                alerts.extend(self._check_calving_issues())
                alerts.extend(self._check_model_performance())
            
            # Trier les alertes par sévérité (critique en premier)
            return sorted(alerts, key=lambda x: AlertSeverity[x['severity']].value, reverse=True)
        
        except Exception as e:
            # En cas d'erreur, retourner une alerte système
            return [{
                'type': AlerteType.SYSTEME,
                'severity': AlertSeverity.CRITICAL.name,
                'title': "Erreur d'analyse",
                'message': f"Une erreur est survenue lors de l'analyse: {str(e)}",
                'date': datetime.now()
            }]
    
    def _get_animal_with_relations(self, animal_id: int) -> Optional[Bovin]:
        """Récupère un bovin avec ses relations de manière optimisée."""
        return self.db.query(Bovin).options(
            joinedload(Bovin.race),
            joinedload(Bovin.pesees),
            joinedload(Bovin.productions_lait),
            joinedload(Bovin.controles_laitiers),
            joinedload(Bovin.velages)
        ).get(animal_id)
    
    def _check_animal_health(self, animal: Bovin, days: int) -> List[Dict]:
        """Vérifie les problèmes de santé de l'animal avec des seuils configurables."""
        alerts = []
        threshold_date = datetime.now() - timedelta(days=days)
        
        # Vérification du poids avec des seuils configurables
        if animal.pesees and animal.race and hasattr(animal.race, 'poids_standard'):
            latest_weight = max(animal.pesees, key=lambda p: p.date_pesee).poids if animal.pesees else None
            if latest_weight and animal.race.poids_standard:
                poids_min = animal.race.poids_standard * 0.8  # 20% en dessous
                poids_max = animal.race.poids_standard * 1.2  # 20% au dessus
                
                if latest_weight < poids_min:
                    alerts.append({
                        'type': AlerteType.SANTE,
                        'severity': AlertSeverity.MEDIUM.name,
                        'title': f"Poids anormalement bas - {animal.numero_identification}",
                        'message': f"Le poids actuel ({latest_weight}kg) est inférieur de 20% au standard de la race ({animal.race.poids_standard}kg)",
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
                        'message': f"Le poids actuel ({latest_weight}kg) est supérieur de 20% au standard de la race ({animal.race.poids_standard}kg)",
                        'animal_id': animal.id,
                        'date': datetime.now(),
                        'suggestions': [
                            "Adapter la ration énergétique",
                            "Vérifier l'accès aux pâturages"
                        ]
                    })
        
        # Vérification des taux cellulaires avec seuil configurable
        scc_threshold = 200000  # cellules/ml
        high_scc = self.db.query(ControleLaitier).filter(
            and_(
                ControleLaitier.animal_id == animal.id,
                ControleLaitier.date_controle >= threshold_date,
                ControleLaitier.cellules_somatiques > scc_threshold
            )
        ).first()
        
        if high_scc:
            alerts.append({
                'type': AlerteType.SANTE,
                'severity': AlertSeverity.HIGH.name,
                'title': f"Mastite potentielle - {animal.numero_identification}",
                'message': f"Taux élevé de cellules somatiques ({high_scc.cellules_somatiques}) détecté",
                'animal_id': animal.id,
                'date': high_scc.date_controle,
                'suggestions': [
                    "Contrôle vétérinaire recommandé",
                    "Test de CMT pour confirmation",
                    "Adapter le protocole de traite"
                ]
            })
        
        return alerts
    
    def _check_reproduction(self, animal: Bovin, days: int) -> List[Dict]:
        """Vérifie les problèmes liés à la reproduction."""
        alerts = []
        threshold_date = datetime.now() - timedelta(days=days)
        
        # Vêlage imminent (14 jours avant la date prévue)
        if animal.statut_reproduction == StatutReproductionBovinEnum.PLEINE:
            if animal.date_mise_bas and (animal.date_mise_bas - datetime.now().date()).days < 14:
                alerts.append({
                    'type': AlerteType.REPRODUCTION,
                    'severity': AlertSeverity.LOW.name,
                    'title': f"Vêlage imminent - {animal.numero_identification}",
                    'message': f"Vêlage prévu dans {(animal.date_mise_bas - datetime.now().date()).days} jours",
                    'animal_id': animal.id,
                    'date': datetime.now(),
                    'suggestions': [
                        "Préparer le box de vêlage",
                        "Surveiller les signes de mise bas"
                    ]
                })
        
        # Chaleurs non exploitées
        heat_events = self.db.query(Evenement).filter(
            and_(
                Evenement.animal_id == animal.id,
                Evenement.type_evenement == 'Chaleur',
                Evenement.date_evenement >= threshold_date,
                ~Evenement.description.ilike('%insémination%')
            )
        ).all()
        
        for event in heat_events:
            alerts.append({
                'type': AlerteType.REPRODUCTION,
                'severity': AlertSeverity.MEDIUM.name,
                'title': f"Chaleur non exploitée - {animal.numero_identification}",
                'message': "Chaleur détectée mais non exploitée",
                'animal_id': animal.id,
                'date': event.date_evenement,
                'suggestions': [
                    "Planifier une insémination pour le prochain cycle",
                    "Vérifier la fertilité du taureau"
                ]
            })
        
        return alerts
    
    def _check_milk_production(self, animal: Bovin, days: int) -> List[Dict]:
        """Vérifie les problèmes liés à la production laitière."""
        alerts = []
        
        if animal.type_production in [TypeProductionBovinEnum.LAITIERE, TypeProductionBovinEnum.MIXTE]:
            prod_data = self._get_production_data(animal.id, days)
            if len(prod_data) >= 5:  # Minimum 5 enregistrements pour analyse
                current_prod = prod_data[-1]['production_jour']
                avg_prod = sum(p['production_jour'] for p in prod_data[:-1]) / (len(prod_data) - 1)
                
                # Seuil de baisse de production configurable (30%)
                if current_prod < avg_prod * 0.7:
                    alerts.append({
                        'type': AlerteType.PRODUCTION,
                        'severity': AlertSeverity.MEDIUM.name,
                        'title': f"Baisse de production - {animal.numero_identification}",
                        'message': f"Production actuelle: {current_prod:.1f}L/j vs moyenne: {avg_prod:.1f}L/j",
                        'animal_id': animal.id,
                        'date': datetime.now(),
                        'suggestions': [
                            "Vérifier l'état de santé",
                            "Analyser la ration alimentaire",
                            "Contrôler les conditions de logement"
                        ]
                    })
        
        return alerts
    
    def _check_nutrition(self, animal: Bovin, days: int) -> List[Dict]:
        """Vérifie les problèmes nutritionnels avec des seuils configurables."""
        alerts = []
        threshold_date = datetime.now() - timedelta(days=days)
        
        # Seuils nutritionnels configurables
        taux_butyreux_min = 3.5  # %
        taux_proteine_min = 3.0  # %
        
        nutrition_records = self.db.query(ControleLaitier).filter(
            and_(
                ControleLaitier.animal_id == animal.id,
                ControleLaitier.date_controle >= threshold_date,
                or_(
                    ControleLaitier.taux_butyreux < taux_butyreux_min,
                    ControleLaitier.taux_proteine < taux_proteine_min
                )
            )
        ).all()
        
        for record in nutrition_records:
            alerts.append({
                'type': AlerteType.ALIMENTATION,
                'severity': AlertSeverity.MEDIUM.name,
                'title': f"Problème nutritionnel - {animal.numero_identification}",
                'message': f"Taux butyreux/protéique bas ({record.taux_butyreux:.1f}%/{record.taux_proteine:.1f}%)",
                'animal_id': animal.id,
                'date': record.date_controle,
                'suggestions': [
                    "Réviser la ration énergétique et protéique",
                    "Vérifier l'apport en fibres",
                    "Contrôler l'équilibre minéral"
                ]
            })
        
        return alerts
    
    def _check_global_issues(self) -> List[Dict]:
        """Vérifie les problèmes globaux de l'élevage."""
        alerts = []
        
        # Seuil de mortalité configurable
        mortalite_seuil = 3  # animaux sur 30 jours
        
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
                'message': f"{dead_animals} bovins morts dans les 30 derniers jours",
                'date': datetime.now(),
                'suggestions': [
                    "Enquête épidémiologique urgente",
                    "Revue des protocoles sanitaires",
                    "Contrôle vétérinaire global"
                ]
            })
        
        # Seuil de production laitière faible configurable
        seuil_production_faible = 15  # L/j moyen
        
        # Vérification de la production moyenne
        avg_milk = self.db.query(func.avg(ProductionLait.quantite)).filter(
            ProductionLait.date_production >= datetime.now() - timedelta(days=30)
        ).scalar()
        
        if avg_milk and avg_milk < seuil_production_faible:
            alerts.append({
                'type': AlerteType.PRODUCTION,
                'severity': AlertSeverity.MEDIUM.name,
                'title': "Productivité laitière faible",
                'message': f"Production moyenne seulement {avg_milk:.1f}L/j par vache",
                'date': datetime.now(),
                'suggestions': [
                    "Analyser la ration alimentaire",
                    "Vérifier la qualité des fourrages",
                    "Contrôler les conditions de traite"
                ]
            })
        
        return alerts
    
    def _check_calving_issues(self) -> List[Dict]:
        """Vérifie les problèmes liés aux vêlages."""
        alerts = []
        
        # Seuil de difficulté de vêlage configurable
        difficulte_seuil = 4  # 4-5 = difficile
        
        # Vêlages difficiles récents
        difficult_calvings = self.db.query(Velage).options(
            joinedload(Velage.mere)
        ).filter(
            and_(
                Velage.date_velage >= datetime.now() - timedelta(days=30),
                Velage.facilite_velage >= difficulte_seuil
            )
        ).all()
        
        for calving in difficult_calvings:
            alerts.append({
                'type': AlerteType.REPRODUCTION,
                'severity': AlertSeverity.HIGH.name,
                'title': f"Vêlage difficile - {calving.mere.numero_identification}",
                'message': f"Vêlage noté {calving.facilite_velage}/5 (5 = très difficile)",
                'animal_id': calving.mere_id,
                'date': calving.date_velage,
                'suggestions': [
                    "Surveillance accrue pour le prochain vêlage",
                    "Bilan vétérinaire post-partum",
                    "Adapter l'alimentation en fin de gestation"
                ]
            })
        
        return alerts
    
    def _check_model_performance(self) -> List[Dict]:
        """Vérifie la performance des modèles de prédiction."""
        alerts = []
        try:
            performance = self.production_predictor.get_performance_metrics()
            
            # Seuil de performance R² configurable
            r2_seuil = 0.6
            
            if performance and performance.r2 < r2_seuil:
                alerts.append({
                    'type': AlerteType.SYSTEME,
                    'severity': AlertSeverity.MEDIUM.name,
                    'title': "Performance modèle faible",
                    'message': f"Le modèle de prédiction a une performance faible (R²={performance.r2:.2f})",
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
    
    def _get_production_data(self, animal_id: int, days: int = 30) -> List[Dict]:
        """Récupère les données de production pour un animal."""
        threshold_date = datetime.now() - timedelta(days=days)
        
        records = self.db.query(ProductionLait).filter(
            and_(
                ProductionLait.animal_id == animal_id,
                ProductionLait.date_production >= threshold_date
            )
        ).order_by(ProductionLait.date_production).all()
        
        return [{
            'date': r.date_production,
            'production_jour': r.quantite,
            'debit_moyen': r.debit_moyen
        } for r in records]
    
    def get_animal_summary(self, animal_id: int) -> Dict:
        """Génère un rapport complet pour un animal spécifique."""
        animal = self._get_animal_with_relations(animal_id)
        if not animal:
            return None
            
        latest_weight = max(animal.pesees, key=lambda p: p.date_pesee).poids if animal.pesees else None
            
        summary = {
            'identification': animal.numero_identification,
            'type_production': animal.type_production.value,
            'statut_reproduction': animal.statut_reproduction.value if animal.statut_reproduction else None,
            'age': (datetime.now().date() - animal.date_naissance).days if animal.date_naissance else None,
            'nombre_velages': animal.nombre_velages,
            'production_305j': animal.production_lait_305j,
            'poids_actuel': latest_weight,
            'alerts': self.generate_alerts(animal_id=animal_id),
            'recommendations': self._generate_recommendations(animal)
        }
        
        return summary
    
    def _generate_recommendations(self, animal: Bovin) -> List[str]:
        """Génère des recommandations spécifiques pour un animal."""
        recommendations = []
        
        if animal.statut_reproduction == StatutReproductionBovinEnum.PLEINE:
            if animal.date_mise_bas and (animal.date_mise_bas - datetime.now().date()).days < 30:
                recommendations.append("Adapter la ration pour le tarissement")
        
        if animal.type_production in [TypeProductionBovinEnum.LAITIERE, TypeProductionBovinEnum.MIXTE]:
            if animal.production_lait_305j and animal.production_lait_305j < 6000:  # kg
                recommendations.append("Évaluer le potentiel génétique et l'alimentation")
        
        return recommendations

# Exemple d'utilisation
if __name__ == "__main__":
    analyzer = BovinAnalysis()
    
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