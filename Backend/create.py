import requests
from pydantic import BaseModel

# Modèles Pydantic pour correspondre à l'API
class UserBase(BaseModel):
    username: str
    phone: str

class UserManagerCreate(UserBase):
    key: str  # Clé d'accès spéciale
    code: str  # Mot de passe/code

ACCESS_KEY='rcrEdqzXTXlA9KJkO9PI31eMF1wSPqZekr5yxi0HXngSl94WVXgvOlg2CJp3s3JXQlJaMC23bg2XiCsbZqKkNzCxl4DL6XfhflQ8iKpwy63NWL5u5vfe9l1RFl0kh4r2'

# URL de votre API (à adapter)
API_URL = "http://192.168.11.116:8000/api/v1/managers/create"

def create_manager(manager_data: UserManagerCreate):
    """
    Envoie une requête POST pour créer un nouveau manager
    
    Args:
        manager_data (UserManagerCreate): Données du manager à créer
    """
    try:
        response = requests.post(
            API_URL,
            json=manager_data.model_dump(),
            headers={"Content-Type": "application/json"}
        )
        
        response.raise_for_status()  # Lève une exception pour les codes 4XX/5XX
        
        print("Manager créé avec succès!")
        print("Réponse:", response.json())
        
    except requests.exceptions.RequestException as e:
        print(f"Erreur lors de la création du manager: {e}")
        if hasattr(e, 'response') and e.response:
            print("Détails de l'erreur:", e.response.json())

# Exemple d'utilisation
if __name__ == "__main__":
    new_manager = UserManagerCreate(
        username="Ozias Belemsobgo",
        phone="+22675945338",
        key=ACCESS_KEY,  # À remplacer par votre clé valide
        code="467920"   # Code/mot de passe
    )
    
    create_manager(new_manager)