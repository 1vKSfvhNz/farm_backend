from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum as SqlEnum
from sqlalchemy.orm import relationship
from models import Base
from models.elevage import Animal, TypeElevage
from enums.elevage import TypeProductionCaprinOvinEnum

class Caprin(Animal):
    __tablename__ = 'caprins'
    
    id = Column(Integer, ForeignKey('animaux.id'), primary_key=True)
    type_production = Column(SqlEnum(TypeProductionCaprinOvinEnum))
    periode_lactation = Column(Integer)  # Jours depuis la mise bas
    production_lait_cumulee = Column(Float)  # Litres depuis mise bas
    taux_matiere_grasse_moyen = Column(Float)  # %
    taux_proteine_moyen = Column(Float)  # %
    aptitudes_fromagere = Column(String(50))  # Notes aptitudes fromagères
    
    __mapper_args__ = {
        'polymorphic_identity': TypeElevage.CAPRIN
    }

class ControleLaitierCaprin(Base):
    __tablename__ = 'controles_laitiers_caprin'
    
    id = Column(Integer, primary_key=True)
    caprin_id = Column(Integer, ForeignKey('caprins.id'), nullable=False)
    date_controle = Column(Date, nullable=False)
    production_journaliere = Column(Float)  # litres
    taux_matiere_grasse = Column(Float)  # %
    taux_proteine = Column(Float)  # %
    taux_lactose = Column(Float)  # %
    densite = Column(Float)
    ph = Column(Float)
    
    caprin = relationship("Caprin")
