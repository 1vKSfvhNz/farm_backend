# piscicole_alertes.py
from datetime import datetime, timedelta
from typing import List, Optional
from dataclasses import dataclass
from models import get_db_session
from models.elevage.piscicole import ControleEau, Poisson, BassinPiscicole, RecoltePoisson
from enums import AlertSeverity
from enums.elevage import AlerteType

@dataclass
class AlertePiscicole:
    """Classe représentant une alerte piscicole"""
    type: AlerteType
    severite: AlertSeverity
    titre: str
    description: str
    bassin_id: Optional[int] = None
    date_detection: datetime = datetime.now()
    recommandations: List[str] = None
    parametres_concernes: List[str] = None

    def __post_init__(self):
        if self.recommandations is None:
            self.recommandations = []
        if self.parametres_concernes is None:
            self.parametres_concernes = []

class AnalyseurPiscicole:
    """Analyse les données piscicoles et génère des alertes"""
    
    def __init__(self):
        self.seuils = {
            'temperature': {
                'EAU_DOUCE': {'min': 20, 'max': 28},
                'EAU_SAUMATRE': {'min': 22, 'max': 30},
                'EAU_MARINE': {'min': 18, 'max': 26}
            },
            'ph': {'min': 6.5, 'max': 8.5},
            'oxygene_dissous': {'min': 5.0},  # mg/L
            'ammoniac': {'max': 0.05},  # mg/L
            'nitrites': {'max': 0.1},  # mg/L
            'densite_poissons': {'max': 20}  # kg/m3
        }
    
    def analyser_bassins(self) -> List[AlertePiscicole]:
        """Analyse tous les bassins et retourne les alertes"""
        with get_db_session() as session:
            bassins = session.query(BassinPiscicole).all()
            alertes = []
            
            for bassin in bassins:
                alertes.extend(self.analyser_bassin(bassin))
                
            return alertes
    
    def analyser_bassin(self, bassin: BassinPiscicole) -> List[AlertePiscicole]:
        """Analyse un bassin spécifique et retourne les alertes"""
        alertes = []
        
        # 1. Analyse des contrôles d'eau récents
        alertes.extend(self.analyser_qualite_eau(bassin))
        
        # 2. Analyse des poissons et mortalité
        alertes.extend(self.analyser_sante_poissons(bassin))
        
        # 3. Analyse de la production
        alertes.extend(self.analyser_production(bassin))
        
        # 4. Analyse de la densité
        alertes.extend(self.analyser_densite(bassin))
        
        return alertes
    
    def analyser_qualite_eau(self, bassin: BassinPiscicole) -> List[AlertePiscicole]:
        """Analyse la qualité de l'eau du bassin"""
        alertes = []
        dernier_controle = self._get_dernier_controle_eau(bassin.id)
        
        if not dernier_controle:
            return []
        
        # Vérification des paramètres critiques
        type_milieu = bassin.type_milieu.name
        
        # Température
        temp_seuils = self.seuils['temperature'].get(type_milieu)
        if temp_seuils:
            if dernier_controle.temperature < temp_seuils['min']:
                alertes.append(self._creer_alerte(
                    AlerteType.ENVIRONNEMENT,
                    AlertSeverity.HIGH,
                    "Température trop basse",
                    f"La température de l'eau ({dernier_controle.temperature}°C) est en dessous du seuil minimum ({temp_seuils['min']}°C)",
                    bassin.id,
                    ["Augmenter le chauffage", "Vérifier l'isolation"],
                    ["temperature"]
                ))
            elif dernier_controle.temperature > temp_seuils['max']:
                alertes.append(self._creer_alerte(
                    AlerteType.ENVIRONNEMENT,
                    AlertSeverity.HIGH,
                    "Température trop élevée",
                    f"La température de l'eau ({dernier_controle.temperature}°C) est au-dessus du seuil maximum ({temp_seuils['max']}°C)",
                    bassin.id,
                    ["Augmenter l'aération", "Ombrer le bassin", "Renouveler l'eau"],
                    ["temperature"]
                ))
        
        # pH
        if dernier_controle.ph < self.seuils['ph']['min']:
            alertes.append(self._creer_alerte(
                AlerteType.ENVIRONNEMENT,
                AlertSeverity.MEDIUM,
                "pH trop bas",
                f"Le pH de l'eau ({dernier_controle.ph}) est en dessous du seuil minimum ({self.seuils['ph']['min']})",
                bassin.id,
                ["Ajouter un tampon pH+"],
                ["ph"]
            ))
        elif dernier_controle.ph > self.seuils['ph']['max']:
            alertes.append(self._creer_alerte(
                AlerteType.ENVIRONNEMENT,
                AlertSeverity.MEDIUM,
                "pH trop élevé",
                f"Le pH de l'eau ({dernier_controle.ph}) est au-dessus du seuil maximum ({self.seuils['ph']['max']})",
                bassin.id,
                ["Ajouter un tampon pH-", "Renouveler partiellement l'eau"],
                ["ph"]
            ))
        
        # Oxygène dissous
        if dernier_controle.oxygene_dissous < self.seuils['oxygene_dissous']['min']:
            alertes.append(self._creer_alerte(
                AlerteType.ENVIRONNEMENT,
                AlertSeverity.CRITICAL,
                "Manque d'oxygène",
                f"L'oxygène dissous ({dernier_controle.oxygene_dissous} mg/L) est en dessous du seuil critique",
                bassin.id,
                ["Augmenter l'aération", "Réduire la densité de poissons", "Vérifier le système d'oxygénation"],
                ["oxygene_dissous"]
            ))
        
        return alertes
    
    def analyser_sante_poissons(self, bassin: BassinPiscicole) -> List[AlertePiscicole]:
        """Analyse la santé des poissons dans le bassin"""
        alertes = []
        with get_db_session() as session:
            # Vérifier les mortalités récentes
            mortalites = session.query(Poisson).filter(
                Poisson.bassin_id == bassin.id,
                Poisson.statut == "Mort",
                Poisson.date_deces >= datetime.now() - timedelta(days=7)
            ).count()
            
            if mortalites > 5:  # Plus de 5 morts en une semaine
                alertes.append(self._creer_alerte(
                    AlerteType.SANTE,
                    AlertSeverity.HIGH,
                    "Mortalité élevée",
                    f"{mortalites} poissons morts dans les 7 derniers jours",
                    bassin.id,
                    ["Contrôler la qualité de l'eau", "Isoler les poissons malades", "Consulter un spécialiste"],
                    ["mortalite"]
                ))
            
            # Vérifier le comportement des poissons (à implémenter avec des observations)
            
        return alertes
    
    def analyser_production(self, bassin: BassinPiscicole) -> List[AlertePiscicole]:
        """Analyse les performances de production"""
        alertes = []
        with get_db_session() as session:
            recoltes = session.query(RecoltePoisson).filter(
                RecoltePoisson.bassin_id == bassin.id
            ).order_by(RecoltePoisson.date_recolte.desc()).first()
            
            if recoltes and recoltes.taux_survie < 80:
                alertes.append(self._creer_alerte(
                    AlerteType.PRODUCTION,
                    AlertSeverity.MEDIUM,
                    "Taux de survie faible",
                    f"Taux de survie de seulement {recoltes.taux_survie}% lors de la dernière récolte",
                    bassin.id,
                    ["Analyser les causes de mortalité", "Optimiser les conditions d'élevage"],
                    ["taux_survie"]
                ))
        
        return alertes
    
    def analyser_densite(self, bassin: BassinPiscicole) -> List[AlertePiscicole]:
        """Analyse la densité de poissons dans le bassin"""
        alertes = []
        with get_db_session() as session:
            nb_poissons = session.query(Poisson).filter(
                Poisson.bassin_id == bassin.id,
                Poisson.statut != "Mort"
            ).count()
            
            if bassin.volume and nb_poissons > 0:
                densite = nb_poissons / bassin.volume
                if densite > self.seuils['densite_poissons']['max']:
                    alertes.append(self._creer_alerte(
                        AlerteType.ENVIRONNEMENT,
                        AlertSeverity.HIGH,
                        "Densité trop élevée",
                        f"La densité de poissons ({densite:.1f} poissons/m3) dépasse le seuil recommandé",
                        bassin.id,
                        ["Réduire le nombre de poissons", "Augmenter le volume d'eau"],
                        ["densite"]
                    ))
        
        return alertes
    
    def _get_dernier_controle_eau(self, bassin_id: int) -> Optional[ControleEau]:
        """Récupère le dernier contrôle d'eau pour un bassin"""
        with get_db_session() as session:
            return session.query(ControleEau).filter(
                ControleEau.bassin_id == bassin_id
            ).order_by(ControleEau.date_controle.desc()).first()
    
    def _creer_alerte(
        self,
        type_alerte: AlerteType,
        severite: AlertSeverity,
        titre: str,
        description: str,
        bassin_id: int,
        recommandations: List[str],
        parametres: List[str]
    ) -> AlertePiscicole:
        """Crée une alerte standardisée"""
        return AlertePiscicole(
            type=type_alerte,
            severite=severite,
            titre=titre,
            description=description,
            bassin_id=bassin_id,
            recommandations=recommandations,
            parametres_concernes=parametres
        )

# Exemple d'utilisation
if __name__ == "__main__":
    analyseur = AnalyseurPiscicole()
    alertes = analyseur.analyser_bassins()
    
    print(f"\n{len(alertes)} alertes détectées:")
    for alerte in alertes:
        print(f"\n[{alerte.severite.value}] {alerte.titre} (Bassin {alerte.bassin_id or 'N/A'})")
        print(f"Type: {alerte.type.value}")
        print(f"Description: {alerte.description}")
        print("Recommandations:")
        for reco in alerte.recommandations:
            print(f"- {reco}")