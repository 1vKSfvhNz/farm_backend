import requests

# Constantes
API_URL = "http://192.168.11.104:8000/create_manager"  # change selon ton URL réelle
ACCESS_KEY = "rcrEdqzXTXlA9KJkO9PI31eMF1wSPqZekr5yxi0HXngSl94WVXgvOlg2CJp3s3JXQlJaMC23bg2XiCsbZqKkNzCxl4DL6XfhflQ8iKpwy63NWL5u5vfe9l1RFl0kh4r2"

def send_user_manager_data(username: str, phone: str, code: str):
    payload = {
        "username": username,
        "phone": phone,
        "key": ACCESS_KEY,
        "code": code
    }
    
    response = requests.post(API_URL, json=payload)
    
    if response.status_code == 200:
        print("✅ Manager créé avec succès :", response.json())
    else:
        print("❌ Échec :", response.status_code, response.text)

send_user_manager_data('Ozias', '+22661506121', '6121')