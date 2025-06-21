from json import load
from logging import basicConfig, ERROR

# URLs et chemins
BASE_URL = "https://"

# Configuration du logger
basicConfig(level=ERROR)

def get_error_key(category, subcategory, error_type=None):
    """Fonction utilitaire pour obtenir les clés d'erreur"""
    if error_type:
        return f"{category}.{subcategory}.{error_type}"
    return f"{category}.{subcategory}"
