from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from lifespan import lifespan
from models import engine, Base

import api.users.managers.managers as managers
import api.users.managers.devices as devices_managers
import api.users.clients.clients as clients
import api.users.clients.devices as devices_clients
import api.users.clients.active_notifications as active_notifications

import api.agricole.concombre as concombre
import api.agricole.salade as salade
import api.agricole.oignon as oignon
import api.agricole.mais as mais

import api.elevage as elevage
import api.elevage.avicole as avicole
import api.elevage.bovin as bovin
import api.elevage.caprin as caprin
import api.elevage.ovin as ovin
import api.elevage.piscicole as piscicole

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Erreur lors de la création des tables de la base de données: {str(e)}")
    raise

# Initialisation de l'app FastAPI
app = FastAPI(
    title="Mon API FastAPI",
    description="Un point d'entrée simple pour FastAPI",
    version="1.0.0",
    lifespan=lifespan
)

# Configuration du CORS (autoriser certaines origines seulement)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Remplacer par vos origines autorisées
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route principale
@app.get("/")
async def read_root():
    return {"message": "Bienvenue sur l'API FastAPI principale 🚀"}

# Route avec un paramètre dynamique
@app.get("/hello/{name}")
async def greet(name: str):
    return {"message": f"Bonjour, {name}!"}

# Ajouter les routeurs des différents modules
app.include_router(managers.router)
app.include_router(devices_managers.router)
app.include_router(clients.router)
app.include_router(devices_clients.router)
app.include_router(active_notifications.router)

app.include_router(elevage.router)
app.include_router(avicole.router)
app.include_router(bovin.router)
app.include_router(caprin.router)
app.include_router(ovin.router)
app.include_router(piscicole.router)

# Ajouter les routeurs des modules agricoles
# app.include_router(concombre.router)
# app.include_router(salade.router)
# app.include_router(oignon.router)
# app.include_router(mais.router)
    
# Gestion des erreurs personnalisées
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": "Données de requête invalides", "errors": exc.errors()},
    )

@app.exception_handler(404)
async def not_found_exception_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"message": "Ressource non trouvée"}
    )