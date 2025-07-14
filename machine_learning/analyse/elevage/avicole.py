# avicole_analysis.py
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import pandas as pd
from dataclasses import dataclass

# Import des modèles existants
from models.elevage.avicole import (
    LotAvicole,
    ControlePonteLot,
    PerformanceLotAvicole,
    PeseeLotAvicole,
    TypeProductionAvicoleEnum
)
from machine_learning.prediction.elevage.avicole import AvicolePredictor
from enums import AlertSeverity

@dataclass
class AvicoleAlert:
    title: str
    description: str
    severity: AlertSeverity
    recommendation: str
    related_data: Optional[Dict] = None

class AvicoleAnalyzer:
    def __init__(self, async_db_session: AsyncSession):
        self.async_db_session = async_db_session
        self.predictor = AvicolePredictor(async_db_session)
    
    async def analyze_farm(self) -> List[AvicoleAlert]:
        """Analyse complète de l'élevage et retourne toutes les alertes"""
        alerts = []
        
        # Charger les données nécessaires
        lots, controles_ponte, performances, pesees = await self._load_data()
        
        # Analyse de la ponte
        alerts.extend(await self._analyze_ponte(lots, controles_ponte))
        
        # Analyse de la croissance
        alerts.extend(await self._analyze_croissance(lots, performances))
        
        # Analyse des conditions d'élevage
        alerts.extend(await self._analyze_conditions(lots))
        
        # Analyse des pesées
        alerts.extend(await self._analyze_pesees(lots, pesees))
        
        return alerts
    
    async def _load_data(self):
        """Charge les données nécessaires depuis la base de données"""
        async with self.async_db_session() as session:
            # Charger les lots avicoles
            lots_result = await session.execute(select(LotAvicole))
            lots = lots_result.scalars().all()
            
            # Charger les contrôles de ponte
            controles_ponte_result = await session.execute(select(ControlePonteLot))
            controles_ponte = controles_ponte_result.scalars().all()
            
            # Charger les performances
            performances_result = await session.execute(select(PerformanceLotAvicole))
            performances = performances_result.scalars().all()
            
            # Charger les pesées
            pesees_result = await session.execute(select(PeseeLotAvicole))
            pesees = pesees_result.scalars().all()
            
        return lots, controles_ponte, performances, pesees
    
    async def _analyze_ponte(self, lots: List[LotAvicole], controles: List[ControlePonteLot]) -> List[AvicoleAlert]:
        """Analyse les performances de ponte"""
        alerts = []
        
        if not controles:
            return alerts
            
        # Convertir en DataFrame pour analyse
        controles_df = pd.DataFrame([{
            'lot_id': c.lot_id,
            'date_controle': c.date_controle,
            'nombre_oeufs': c.nombre_oeufs,
            'taux_ponte': c.taux_ponte,
            'taux_casses': c.taux_casses,
            'taux_sales': c.taux_sales
        } for c in controles])
        
        # Calculer les statistiques par lot
        stats = controles_df.groupby('lot_id').agg({
            'taux_ponte': ['mean', 'std'],
            'nombre_oeufs': ['mean', 'sum'],
            'taux_casses': 'mean',
            'taux_sales': 'mean'
        })
        
        # Identifier les problèmes
        for lot_id, row in stats.iterrows():
            lot = next((l for l in lots if l.id == lot_id), None)
            if not lot:
                continue
                
            # Alerte pour taux de ponte faible
            if row[('taux_ponte', 'mean')] < 60:  # Seuil à ajuster
                alerts.append(AvicoleAlert(
                    title=f"Taux de ponte faible dans le lot {lot.identifiant_lot}",
                    description=f"Le taux de ponte moyen est de {row[('taux_ponte', 'mean')]:.1f}%, ce qui est en dessous des normes attendues.",
                    severity=AlertSeverity.HIGH,
                    recommendation="Vérifier l'alimentation, la santé des volailles et les conditions d'élevage.",
                    related_data={
                        'lot_id': lot_id,
                        'identifiant_lot': lot.identifiant_lot,
                        'type_volaille': lot.type_volaille.name,
                        'taux_ponte': row[('taux_ponte', 'mean')]
                    }
                ))
            
            # Alerte pour taux de casses élevé
            if row[('taux_casses', 'mean')] > 5:  # Seuil à ajuster
                alerts.append(AvicoleAlert(
                    title=f"Taux de casses élevé dans le lot {lot.identifiant_lot}",
                    description=f"Le taux de casses moyen est de {row[('taux_casses', 'mean')]:.1f}%, ce qui est au-dessus des normes.",
                    severity=AlertSeverity.MEDIUM,
                    recommendation="Inspecter les systèmes de collecte et de manipulation des œufs.",
                    related_data={
                        'lot_id': lot_id,
                        'taux_casses': row[('taux_casses', 'mean')]
                    }
                ))
        
        return alerts
    
    async def _analyze_croissance(self, lots: List[LotAvicole], performances: List[PerformanceLotAvicole]) -> List[AvicoleAlert]:
        """Analyse les performances de croissance"""
        alerts = []
        
        if not performances:
            return alerts
            
        performances_df = pd.DataFrame([{
            'lot_id': p.lot_id,
            'date_controle': p.date_controle,
            'poids_moyen': p.poids_moyen,
            'gain_moyen_journalier': p.gain_moyen_journalier,
            'indice_consommation': p.indice_consommation,
            'taux_mortalite': p.taux_mortalite,
            'uniformite': p.uniformite
        } for p in performances])
        
        # Calculer les indicateurs clés
        stats = performances_df.groupby('lot_id').agg({
            'poids_moyen': ['mean', 'std'],
            'gain_moyen_journalier': 'mean',
            'indice_consommation': 'mean',
            'taux_mortalite': 'mean',
            'uniformite': 'mean'
        })
        
        for lot_id, row in stats.iterrows():
            lot = next((l for l in lots if l.id == lot_id), None)
            if not lot:
                continue
                
            # Normes différentes selon le type de production
            if lot.type_production == TypeProductionAvicoleEnum.VIANDE:
                # Alerte pour gain journalier insuffisant
                if row[('gain_moyen_journalier', 'mean')] < 45:  # g/jour pour poulets de chair
                    alerts.append(AvicoleAlert(
                        title=f"Croissance lente dans le lot {lot.identifiant_lot}",
                        description=f"Le gain moyen journalier est de {row[('gain_moyen_journalier', 'mean')]:.1f}g/jour, en dessous des attentes.",
                        severity=AlertSeverity.MEDIUM,
                        recommendation="Vérifier la qualité et la quantité d'aliment.",
                        related_data={
                            'lot_id': lot_id,
                            'gain_journalier': row[('gain_moyen_journalier', 'mean')],
                            'type_production': lot.type_production.name
                        }
                    ))
                
                # Alerte pour indice de consommation élevé
                if row[('indice_consommation', 'mean')] > 1.8:
                    alerts.append(AvicoleAlert(
                        title=f"Efficacité alimentaire faible dans le lot {lot.identifiant_lot}",
                        description=f"L'indice de consommation est de {row[('indice_consommation', 'mean')]:.2f}.",
                        severity=AlertSeverity.HIGH,
                        recommendation="Réévaluer la formulation des rations.",
                        related_data={
                            'lot_id': lot_id,
                            'indice_consommation': row[('indice_consommation', 'mean')]
                        }
                    ))
            
            # Alerte pour mortalité élevée
            if row[('taux_mortalite', 'mean')] > 3:  # %
                alerts.append(AvicoleAlert(
                    title=f"Mortalité élevée dans le lot {lot.identifiant_lot}",
                    description=f"Le taux de mortalité est de {row[('taux_mortalite', 'mean')]:.1f}%.",
                    severity=AlertSeverity.CRITICAL,
                    recommendation="Examiner immédiatement les causes possibles.",
                    related_data={
                        'lot_id': lot_id,
                        'taux_mortalite': row[('taux_mortalite', 'mean')]
                    }
                ))
        
        return alerts
    
    async def _analyze_conditions(self, lots: List[LotAvicole]) -> List[AvicoleAlert]:
        """Analyse les conditions d'élevage"""
        alerts = []
        
        for lot in lots:
            # Vérifier si le lot est en retard pour la réforme
            if lot.date_reforme and lot.date_reforme < datetime.now().date():
                alerts.append(AvicoleAlert(
                    title=f"Lot {lot.identifiant_lot} en retard pour la réforme",
                    description=f"La date de réforme prévue était le {lot.date_reforme}.",
                    severity=AlertSeverity.MEDIUM,
                    recommendation="Planifier la réforme du lot dès que possible.",
                    related_data={
                        'lot_id': lot.id,
                        'date_reforme': lot.date_reforme.isoformat(),
                        'effectif_actuel': lot.effectif_actuel
                    }
                ))
            
            # Vérifier la durée d'élevage
            if lot.date_mise_en_place:
                days_in_production = (datetime.now().date() - lot.date_mise_en_place).days
                max_days = 70 if lot.type_production == TypeProductionAvicoleEnum.VIANDE else 365
                
                if days_in_production > max_days:
                    alerts.append(AvicoleAlert(
                        title=f"Durée d'élevage anormale pour le lot {lot.identifiant_lot}",
                        description=f"Le lot est en élevage depuis {days_in_production} jours.",
                        severity=AlertSeverity.HIGH,
                        recommendation="Évaluer la nécessité de réformer le lot.",
                        related_data={
                            'lot_id': lot.id,
                            'jours_en_elevage': days_in_production,
                            'type_production': lot.type_production.name
                        }
                    ))
        
        return alerts
    
    async def _analyze_pesees(self, lots: List[LotAvicole], pesees: List[PeseeLotAvicole]) -> List[AvicoleAlert]:
        """Analyse les données de pesée"""
        alerts = []
        
        if not pesees:
            return alerts
            
        pesees_df = pd.DataFrame([{
            'lot_id': p.lot_id,
            'date_pesee': p.date_pesee,
            'poids_moyen': p.poids_moyen,
            'poids_total': p.poids_total
        } for p in pesees])
        
        # Calculer les tendances de poids
        stats = pesees_df.groupby('lot_id').agg({
            'poids_moyen': ['mean', 'std', 'last'],
            'poids_total': ['mean', 'std', 'last']
        })
        
        for lot_id, row in stats.iterrows():
            lot = next((l for l in lots if l.id == lot_id), None)
            if not lot:
                continue
                
            # Alerte pour variation de poids importante
            if row[('poids_moyen', 'std')] > 0.5:  # kg, seuil à ajuster
                alerts.append(AvicoleAlert(
                    title=f"Variation de poids importante dans le lot {lot.identifiant_lot}",
                    description=f"L'écart-type du poids moyen est de {row[('poids_moyen', 'std')]:.2f}kg.",
                    severity=AlertSeverity.MEDIUM,
                    recommendation="Vérifier l'uniformité du lot et les conditions d'alimentation.",
                    related_data={
                        'lot_id': lot_id,
                        'ecart_type_poids': row[('poids_moyen', 'std')]
                    }
                ))
        
        return alerts