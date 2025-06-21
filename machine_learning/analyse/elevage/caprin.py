from datetime import datetime, timedelta
from typing import List, Dict, Optional, Union
from sqlalchemy import and_, or_, func, select
from sqlalchemy.orm import joinedload, Session
from sqlalchemy.ext.asyncio import AsyncSession
from models import get_db_session
from models.elevage.caprin import Caprin, ControleLaitierCaprin
from models.elevage import Animal, ProductionLait, Evenement
from machine_learning.prediction.elevage.caprin import CaprinProductionPredictor
from enums import AlertSeverity
from enums.elevage import StatutAnimalEnum, AlerteType, TypeProductionCaprinOvinEnum
from dataclasses import dataclass
import pandas as pd
import numpy as np

@dataclass
class CaprinAlert:
    """Structure pour représenter une alerte caprine"""
    type: AlerteType
    severity: AlertSeverity
    title: str
    message: str
    caprin_id: int = None
    date: datetime = datetime.now()
    suggestions: List[str] = None
    
    def to_dict(self) -> Dict:
        """Convertit l'alerte en dictionnaire pour l'export"""
        return {
            'type': self.type.value,
            'severity': self.severity.name,
            'title': self.title,
            'message': self.message,
            'caprin_id': self.caprin_id,
            'date': self.date.isoformat(),
            'suggestions': self.suggestions or []
        }

class CaprinAnalysis:
    """
    Classe principale pour l'analyse des données caprines et la génération d'alertes.
    Version améliorée avec :
    - Meilleure gestion des erreurs
    - Optimisation des requêtes SQL
    - Ajout de nouvelles analyses spécifiques aux caprins
    """
    
    def __init__(self, db_session: Optional[Union[Session, AsyncSession]] = None):
        self.db = db_session if db_session else get_db_session()
        self.is_async = isinstance(db_session, AsyncSession) if db_session else False
        self.production_predictor = CaprinProductionPredictor()
        
    async def generate_alerts(self, caprin_id: Optional[int] = None, days: int = 7) -> List[Dict]:
        """
        Génère toutes les alertes pour l'élevage caprin ou un animal spécifique.
        
        Args:
            caprin_id: ID du caprin à analyser (optionnel)
            days: Nombre de jours à analyser en arrière
            
        Returns:
            Liste de dictionnaires contenant les alertes triées par sévérité
        """
        alerts = []
        
        try:
            if caprin_id:
                caprin = await self._get_caprin_with_relations(caprin_id)
                if not caprin:
                    return []
                
                alerts.extend(await self._check_caprin_health(caprin, days))
                alerts.extend(await self._check_reproduction(caprin, days))
                alerts.extend(await self._check_milk_production(caprin, days))
                alerts.extend(await self._check_nutrition(caprin, days))
            else:
                # Analyse pour tout l'élevage avec optimisation des requêtes
                if self.is_async:
                    caprins = await self.db.execute(
                        select(Caprin).options(
                            joinedload(Caprin.animal).joinedload(Animal.race),
                            joinedload(Caprin.animal).joinedload(Animal.pesees),
                            joinedload(Caprin.controles_laitiers)
                        )
                    )
                    caprins = caprins.scalars().all()
                else:
                    caprins = self.db.query(Caprin).options(
                        joinedload(Caprin.animal).joinedload(Animal.race),
                        joinedload(Caprin.animal).joinedload(Animal.pesees),
                        joinedload(Caprin.controles_laitiers)
                    ).all()
                
                for caprin in caprins:
                    alerts.extend(await self._check_caprin_health(caprin, days))
                    alerts.extend(await self._check_reproduction(caprin, days))
                    alerts.extend(await self._check_milk_production(caprin, days))
                    alerts.extend(await self._check_nutrition(caprin, days))
                
                alerts.extend(await self._check_global_issues())
                alerts.extend(await self._check_kidding_issues())
                alerts.extend(await self._check_model_performance())
            
            # Trier les alertes par sévérité (critique en premier)
            return sorted([alert.to_dict() for alert in alerts], 
                         key=lambda x: AlertSeverity[x['severity']].value, reverse=True)
        
        except Exception as e:
            # En cas d'erreur, retourner une alerte système
            return [CaprinAlert(
                type=AlerteType.SYSTEME,
                severity=AlertSeverity.CRITICAL,
                title="Erreur d'analyse",
                message=f"Une erreur est survenue lors de l'analyse: {str(e)}",
                suggestions=["Vérifier les logs pour plus de détails"]
            ).to_dict()]
    
    async def _get_caprin_with_relations(self, caprin_id: int) -> Optional[Caprin]:
        """Récupère un caprin avec ses relations de manière optimisée."""
        if self.is_async:
            result = await self.db.execute(
                select(Caprin).options(
                    joinedload(Caprin.animal).joinedload(Animal.race),
                    joinedload(Caprin.animal).joinedload(Animal.pesees),
                    joinedload(Caprin.controles_laitiers),
                    joinedload(Caprin.animal).joinedload(Animal.evenements)
                )).where(Caprin.id == caprin_id)
            return result.scalar()
        else:
            return self.db.query(Caprin).options(
                joinedload(Caprin.animal).joinedload(Animal.race),
                joinedload(Caprin.animal).joinedload(Animal.pesees),
                joinedload(Caprin.controles_laitiers),
                joinedload(Caprin.animal).joinedload(Animal.evenements)
            ).get(caprin_id)
    
    async def _check_caprin_health(self, caprin: Caprin, days: int) -> List[CaprinAlert]:
        """Vérifie les problèmes de santé du caprin avec des seuils configurables."""
        alerts = []
        threshold_date = datetime.now() - timedelta(days=days)
        
        # Vérification du poids avec des seuils configurables
        if caprin.animal.pesees and caprin.animal.race:
            latest_weight = max(caprin.animal.pesees, key=lambda p: p.date_pesee).poids if caprin.animal.pesees else None
            if latest_weight and hasattr(caprin.animal.race, 'poids_standard'):
                poids_min = caprin.animal.race.poids_standard * 0.8  # 20% en dessous
                poids_max = caprin.animal.race.poids_standard * 1.2  # 20% au dessus
                
                if latest_weight < poids_min:
                    alerts.append(CaprinAlert(
                        type=AlerteType.SANTE,
                        severity=AlertSeverity.MEDIUM,
                        title=f"Poids anormalement bas - {caprin.animal.numero_identification}",
                        message=f"Le poids actuel ({latest_weight}kg) est inférieur de 20% au standard de la race ({caprin.animal.race.poids_standard}kg)",
                        caprin_id=caprin.id,
                        suggestions=[
                            "Vérifier la ration alimentaire",
                            "Contrôler la présence de parasites",
                            "Examen vétérinaire recommandé"
                        ]
                    ))
                elif latest_weight > poids_max:
                    alerts.append(CaprinAlert(
                        type=AlerteType.SANTE,
                        severity=AlertSeverity.LOW,
                        title=f"Poids anormalement élevé - {caprin.animal.numero_identification}",
                        message=f"Le poids actuel ({latest_weight}kg) est supérieur de 20% au standard de la race ({caprin.animal.race.poids_standard}kg)",
                        caprin_id=caprin.id,
                        suggestions=[
                            "Adapter la ration énergétique",
                            "Vérifier l'accès aux pâturages"
                        ]
                    ))
        
        # Vérification des taux cellulaires avec seuil configurable (plus sensible pour les caprins)
        scc_threshold = 1000000  # cellules/ml (seuil plus élevé que pour les bovins)
        
        if self.is_async:
            high_scc = await self.db.execute(
                select(ControleLaitierCaprin).where(
                    and_(
                        ControleLaitierCaprin.caprin_id == caprin.id,
                        ControleLaitierCaprin.date_controle >= threshold_date,
                        ControleLaitierCaprin.cellules_somatiques > scc_threshold
                    )
                )).limit(1)
            high_scc = high_scc.scalar()
        else:
            high_scc = self.db.query(ControleLaitierCaprin).filter(
                and_(
                    ControleLaitierCaprin.caprin_id == caprin.id,
                    ControleLaitierCaprin.date_controle >= threshold_date,
                    ControleLaitierCaprin.cellules_somatiques > scc_threshold
                )
            ).first()
        
        if high_scc:
            alerts.append(CaprinAlert(
                type=AlerteType.SANTE,
                severity=AlertSeverity.HIGH,
                title=f"Mammite potentielle - {caprin.animal.numero_identification}",
                message=f"Taux élevé de cellules somatiques ({high_scc.cellules_somatiques}) détecté",
                caprin_id=caprin.id,
                date=high_scc.date_controle,
                suggestions=[
                    "Contrôle vétérinaire recommandé",
                    "Adapter le protocole de traite",
                    "Vérifier l'hygiène de la traite"
                ]
            ))
        
        return alerts
    
    async def _check_reproduction(self, caprin: Caprin, days: int) -> List[CaprinAlert]:
        """Vérifie les problèmes liés à la reproduction."""
        alerts = []
        threshold_date = datetime.now() - timedelta(days=days)
        
        # Mise bas imminente (10 jours avant la date prévue)
        if caprin.animal.sexe == "Femelle" and caprin.animal.date_mise_bas and \
           (caprin.animal.date_mise_bas - datetime.now().date()).days < 10:
            alerts.append(CaprinAlert(
                type=AlerteType.REPRODUCTION,
                severity=AlertSeverity.LOW,
                title=f"Mise bas imminente - {caprin.animal.numero_identification}",
                message=f"Mise bas prévue dans {(caprin.animal.date_mise_bas - datetime.now().date()).days} jours",
                caprin_id=caprin.id,
                suggestions=[
                    "Préparer le box de mise bas",
                    "Surveiller les signes de mise bas"
                ]
            ))
        
        # Intervalle entre mises bas trop long (>14 mois)
        if caprin.animal.sexe == "Femelle" and caprin.animal.date_naissance and \
           (datetime.now().date() - caprin.animal.date_naissance).days > 300:  # >10 mois
            
            if self.is_async:
                last_kidding = await self.db.execute(
                    select(Evenement).where(
                        and_(
                            Evenement.animal_id == caprin.animal.id,
                            Evenement.type_evenement == "Mise bas"
                        )
                    ).order_by(Evenement.date_evenement.desc())).limit(1)
                last_kidding = last_kidding.scalar()
            else:
                last_kidding = self.db.query(Evenement).filter(
                    and_(
                        Evenement.animal_id == caprin.animal.id,
                        Evenement.type_evenement == "Mise bas"
                    )
                ).order_by(Evenement.date_evenement.desc()).first()
            
            if last_kidding and (datetime.now().date() - last_kidding.date_evenement.date()).days > 420:  # >14 mois
                alerts.append(CaprinAlert(
                    type=AlerteType.REPRODUCTION,
                    severity=AlertSeverity.MEDIUM,
                    title=f"Intervalle entre mises bas trop long - {caprin.animal.numero_identification}",
                    message=f"Pas de mise bas depuis {(datetime.now().date() - last_kidding.date_evenement.date()).days} jours",
                    caprin_id=caprin.id,
                    suggestions=[
                        "Vérifier la fertilité",
                        "Planifier une saillie ou insémination"
                    ]
                ))
        
        return alerts
    
    async def _check_milk_production(self, caprin: Caprin, days: int) -> List[CaprinAlert]:
        """Vérifie les problèmes liés à la production laitière."""
        alerts = []
        
        if caprin.type_production in [TypeProductionCaprinOvinEnum.LAITIERE, TypeProductionCaprinOvinEnum.MIXTE]:
            prod_data = await self._get_production_data(caprin.id, days)
            if len(prod_data) >= 3:  # Minimum 3 enregistrements pour analyse
                current_prod = prod_data[-1]['production_jour']
                avg_prod = sum(p['production_jour'] for p in prod_data[:-1]) / (len(prod_data) - 1)
                
                # Seuil de baisse de production configurable (25% pour les caprins)
                if current_prod < avg_prod * 0.75:
                    alerts.append(CaprinAlert(
                        type=AlerteType.PRODUCTION,
                        severity=AlertSeverity.MEDIUM,
                        title=f"Baisse de production - {caprin.animal.numero_identification}",
                        message=f"Production actuelle: {current_prod:.1f}L/j vs moyenne: {avg_prod:.1f}L/j",
                        caprin_id=caprin.id,
                        suggestions=[
                            "Vérifier l'état de santé",
                            "Analyser la ration alimentaire",
                            "Contrôler les conditions de traite"
                        ]
                    ))
        
        return alerts
    
    async def _check_nutrition(self, caprin: Caprin, days: int) -> List[CaprinAlert]:
        """Vérifie les problèmes nutritionnels avec des seuils configurables."""
        alerts = []
        threshold_date = datetime.now() - timedelta(days=days)
        
        # Seuils nutritionnels spécifiques aux caprins
        taux_butyreux_min = 3.0  # %
        taux_proteine_min = 2.8  # %
        
        if self.is_async:
            nutrition_records = await self.db.execute(
                select(ControleLaitierCaprin).where(
                    and_(
                        ControleLaitierCaprin.caprin_id == caprin.id,
                        ControleLaitierCaprin.date_controle >= threshold_date,
                        or_(
                            ControleLaitierCaprin.taux_matiere_grasse < taux_butyreux_min,
                            ControleLaitierCaprin.taux_proteine < taux_proteine_min
                        )
                    )
                )
            )
            nutrition_records = nutrition_records.scalars().all()
        else:
            nutrition_records = self.db.query(ControleLaitierCaprin).filter(
                and_(
                    ControleLaitierCaprin.caprin_id == caprin.id,
                    ControleLaitierCaprin.date_controle >= threshold_date,
                    or_(
                        ControleLaitierCaprin.taux_matiere_grasse < taux_butyreux_min,
                        ControleLaitierCaprin.taux_proteine < taux_proteine_min
                    )
                )
            ).all()
        
        for record in nutrition_records:
            alerts.append(CaprinAlert(
                type=AlerteType.ALIMENTATION,
                severity=AlertSeverity.MEDIUM,
                title=f"Problème nutritionnel - {caprin.animal.numero_identification}",
                message=f"Taux butyreux/protéique bas ({record.taux_matiere_grasse:.1f}%/{record.taux_proteine:.1f}%)",
                caprin_id=caprin.id,
                date=record.date_controle,
                suggestions=[
                    "Réviser la ration énergétique et protéique",
                    "Vérifier l'apport en fibres",
                    "Contrôler l'équilibre minéral"
                ]
            ))
        
        return alerts
    
    async def _check_global_issues(self) -> List[CaprinAlert]:
        """Vérifie les problèmes globaux de l'élevage caprin."""
        alerts = []
        
        # Seuil de mortalité configurable
        mortalite_seuil = 2  # animaux sur 30 jours
        
        # Vérification de la mortalité
        if self.is_async:
            dead_animals = await self.db.execute(
                select(func.count()).select_from(Animal).where(
                    and_(
                        Animal.statut == StatutAnimalEnum.MORT,
                        Animal.date_deces >= datetime.now().date() - timedelta(days=30)
                    )
                )
            )
            dead_animals = dead_animals.scalar()
        else:
            dead_animals = self.db.query(func.count(Animal.id)).filter(
                and_(
                    Animal.statut == StatutAnimalEnum.MORT,
                    Animal.date_deces >= datetime.now().date() - timedelta(days=30)
                )
            ).scalar()
        
        if dead_animals > mortalite_seuil:
            alerts.append(CaprinAlert(
                type=AlerteType.SANTE,
                severity=AlertSeverity.CRITICAL,
                title="Taux de mortalité élevé",
                message=f"{dead_animals} caprins morts dans les 30 derniers jours",
                suggestions=[
                    "Enquête épidémiologique urgente",
                    "Revue des protocoles sanitaires",
                    "Contrôle vétérinaire global"
                ]
            ))
        
        # Seuil de production laitière faible configurable (spécifique caprins)
        seuil_production_faible = 2.5  # L/j moyen
        
        # Vérification de la production moyenne
        if self.is_async:
            avg_milk = await self.db.execute(
                select(func.avg(ProductionLait.quantite)).where(
                    ProductionLait.date_production >= datetime.now() - timedelta(days=30)
                )
            )
            avg_milk = avg_milk.scalar()
        else:
            avg_milk = self.db.query(func.avg(ProductionLait.quantite)).filter(
                ProductionLait.date_production >= datetime.now() - timedelta(days=30)
            ).scalar()
        
        if avg_milk and avg_milk < seuil_production_faible:
            alerts.append(CaprinAlert(
                type=AlerteType.PRODUCTION,
                severity=AlertSeverity.MEDIUM,
                title="Productivité laitière faible",
                message=f"Production moyenne seulement {avg_milk:.1f}L/j par chèvre",
                suggestions=[
                    "Analyser la ration alimentaire",
                    "Vérifier la qualité des fourrages",
                    "Contrôler les conditions de traite"
                ]
            ))
        
        return alerts
    
    async def _check_kidding_issues(self) -> List[CaprinAlert]:
        """Vérifie les problèmes liés aux mises bas."""
        alerts = []
        
        # Mises bas difficiles récentes
        if self.is_async:
            difficult_kiddings = await self.db.execute(
                select(Evenement).where(
                    and_(
                        Evenement.type_evenement == "Mise bas",
                        Evenement.date_evenement >= datetime.now() - timedelta(days=30),
                        Evenement.description.ilike('%difficile%')
                    )
                )).options(joinedload(Evenement.animal))
            difficult_kiddings = difficult_kiddings.scalars().all()
        else:
            difficult_kiddings = self.db.query(Evenement).filter(
                and_(
                    Evenement.type_evenement == "Mise bas",
                    Evenement.date_evenement >= datetime.now() - timedelta(days=30),
                    Evenement.description.ilike('%difficile%')
                )
            ).options(joinedload(Evenement.animal)).all()
        
        for kidding in difficult_kiddings:
            alerts.append(CaprinAlert(
                type=AlerteType.REPRODUCTION,
                severity=AlertSeverity.HIGH,
                title=f"Mise bas difficile - {kidding.animal.numero_identification}",
                message="Mise bas signalée comme difficile dans les notes",
                caprin_id=kidding.animal_id,
                date=kidding.date_evenement,
                suggestions=[
                    "Surveillance accrue pour la prochaine mise bas",
                    "Bilan vétérinaire post-partum",
                    "Adapter l'alimentation en fin de gestation"
                ]
            ))
        
        return alerts
    
    async def _check_model_performance(self) -> List[CaprinAlert]:
        """Vérifie la performance des modèles de prédiction."""
        alerts = []
        try:
            performance = self.production_predictor.get_performance_metrics()
            
            # Seuil de performance R² configurable
            r2_seuil = 0.5  # Moins strict que pour les bovins
            
            if performance and performance.r2 < r2_seuil:
                alerts.append(CaprinAlert(
                    type=AlerteType.SYSTEME,
                    severity=AlertSeverity.MEDIUM,
                    title="Performance modèle faible",
                    message=f"Le modèle de prédiction a une performance faible (R²={performance.r2:.2f})",
                    suggestions=[
                        "Vérifier la qualité des données d'entrée",
                        "Enrichir le jeu de données",
                        "Ré-entraîner le modèle avec de nouveaux paramètres"
                    ]
                ))
        except Exception as e:
            alerts.append(CaprinAlert(
                type=AlerteType.SYSTEME,
                severity=AlertSeverity.HIGH,
                title="Erreur de modèle",
                message=f"Impossible d'évaluer la performance du modèle: {str(e)}",
                suggestions=["Contacter le support technique"]
            ))
        
        return alerts
    
    async def _get_production_data(self, caprin_id: int, days: int = 30) -> List[Dict]:
        """Récupère les données de production pour un caprin."""
        threshold_date = datetime.now() - timedelta(days=days)
        
        if self.is_async:
            records = await self.db.execute(
                select(ProductionLait).where(
                    and_(
                        ProductionLait.animal_id == caprin_id,
                        ProductionLait.date_production >= threshold_date
                    )
                )).order_by(ProductionLait.date_production)
            records = records.scalars().all()
        else:
            records = self.db.query(ProductionLait).filter(
                and_(
                    ProductionLait.animal_id == caprin_id,
                    ProductionLait.date_production >= threshold_date
                )
            ).order_by(ProductionLait.date_production).all()
        
        return [{
            'date': r.date_production,
            'production_jour': r.quantite,
            'debit_moyen': r.debit_moyen
        } for r in records]
    
    async def get_caprin_summary(self, caprin_id: int) -> Dict:
        """Génère un rapport complet pour un caprin spécifique."""
        caprin = await self._get_caprin_with_relations(caprin_id)
        if not caprin:
            return None
            
        latest_weight = max(caprin.animal.pesees, key=lambda p: p.date_pesee).poids if caprin.animal.pesees else None
            
        summary = {
            'identification': caprin.animal.numero_identification,
            'type_production': caprin.type_production.value if caprin.type_production else None,
            'age': (datetime.now().date() - caprin.animal.date_naissance).days if caprin.animal.date_naissance else None,
            'periode_lactation': caprin.periode_lactation,
            'production_moyenne': await self._calculate_average_production(caprin_id),
            'poids_actuel': latest_weight,
            'alerts': await self.generate_alerts(caprin_id=caprin_id),
            'recommendations': await self._generate_recommendations(caprin)
        }
        
        return summary
    
    async def _calculate_average_production(self, caprin_id: int) -> float:
        """Calcule la production moyenne sur les 30 derniers jours."""
        prod_data = await self._get_production_data(caprin_id, 30)
        if not prod_data:
            return None
        return sum(p['production_jour'] for p in prod_data) / len(prod_data)
    
    async def _generate_recommendations(self, caprin: Caprin) -> List[str]:
        """Génère des recommandations spécifiques pour un caprin."""
        recommendations = []
        
        # Recommandations basées sur la production
        avg_prod = await self._calculate_average_production(caprin.id)
        if avg_prod and avg_prod < 2.0:  # Seuil spécifique aux caprins
            recommendations.append("Évaluer le potentiel génétique et l'alimentation")
        
        # Recommandations basées sur la santé
        if caprin.controles_laitiers:
            latest_control = max(caprin.controles_laitiers, key=lambda c: c.date_controle)
            if latest_control.cellules_somatiques > 1000000:
                recommendations.append("Contrôle vétérinaire pour risque de mammite")
        
        return recommendations

# Exemple d'utilisation
if __name__ == "__main__":
    import asyncio
    
    async def main():
        analyzer = CaprinAnalysis()
        
        # Exemple 1: Alertes pour tout l'élevage
        print("=== Alertes pour tout l'élevage ===")
        all_alerts = await analyzer.generate_alerts()
        for alert in all_alerts[:5]:  # Afficher les 5 premières alertes
            print(f"[{alert['severity']}] {alert['title']}: {alert['message']}")
        
        # Exemple 2: Rapport pour un animal spécifique
        print("\n=== Rapport pour un animal spécifique ===")
        caprin_id = 1  # Remplacer par un ID existant
        summary = await analyzer.get_caprin_summary(caprin_id)
        if summary:
            print(f"Rapport pour {summary['identification']}:")
            print(f"Âge: {summary['age']} jours")
            print(f"Poids actuel: {summary['poids_actuel']} kg")
            print(f"Production moyenne: {summary['production_moyenne']:.1f} L/j")
            print(f"Nombre d'alertes: {len(summary['alerts'])}")
            print("Recommandations:", ", ".join(summary['recommendations']))
    
    asyncio.run(main())