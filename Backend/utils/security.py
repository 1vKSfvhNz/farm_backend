from os import getenv
from datetime import datetime, timedelta
from random import choice
from string import ascii_letters, digits
from typing import Optional

import jwt
from argon2 import PasswordHasher
from jwt import ExpiredSignatureError, PyJWTError, DecodeError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv

load_dotenv()

ph = PasswordHasher()
SECRET_KEY = getenv('SECRET_KEY')
ALGORITHM = getenv('ALGORITHM')
ACCESS_KEY = getenv('ACCESS_KEY')
ACCESS_TOKEN_EXPIRE_HOURS = int(getenv('ACCESS_TOKEN_EXPIRE_HOURS'))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# ✅ Fonction pour générer un token JWT
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM), expire

# Ajoutez cette fonction dans utils/security.py
def get_current_client(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        id: str = payload.get("id")
        if email is None:
            raise ValueError("Invalid token - missing sub claim")
        return {"email": email, "id": id}
    except DecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou mal formé.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ExpiredSignatureError:
        raise ValueError("Token expired")
    except PyJWTError as e:
        raise ValueError(f"Invalid token: {str(e)}")

def get_current_manager(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        phone: str = payload.get("sub")
        id: str = payload.get("id")
        if phone is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide (claim sub manquant)",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {"phone": phone, "id": id}
    except DecodeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou mal formé.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Le token a expiré.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token invalide : {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
def get_current_user_from_token(token: str) -> dict:
    try:
        # Décodage du token avec vérification stricte
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extraction et vérification des claims
        email: str = payload.get("sub")
        user_id: int = payload.get("id")
        
        # Vérification plus stricte
        if not email:
            raise ValueError("Token invalide - champ 'sub' (email) manquant")
        if user_id is None:  # Permettre 0 comme ID valide
            raise ValueError("Token invalide - champ 'id' manquant")
                    
        return {"email": email, "id": user_id}
        
    except ExpiredSignatureError:
        print("DEBUG - Token expiré")
        raise ValueError("Token expiré")
    except PyJWTError as e:
        print(f"DEBUG - Erreur PyJWT: {str(e)}")
        raise ValueError(f"Token invalide: {str(e)}")
    except Exception as e:
        print(f"DEBUG - Erreur inattendue: {str(e)}")
        raise ValueError(f"Erreur de validation du token: {str(e)}")

# ✅ 
def gen_passw(init: str='', length: int=16) -> str:
    caracteres = ascii_letters  # Lettres majuscules et minuscules
    return init + ''.join(choice(caracteres) for _ in range(length))

def gen_code(length: int=6) -> str:
    dg = digits  # Chiffres
    return ''.join(choice(dg) for _ in range(length))

#✅ Hasher le mot de passe
def hash_passw(password: str) -> str:
    return ph.hash(password)

#✅ Vérifier un mot de passe
def verify_passw(password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, password)
    except:
        return False


