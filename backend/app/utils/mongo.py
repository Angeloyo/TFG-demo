import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

def get_db(demo: bool = None):
    """
    Devuelve una conexión a la base de datos MIMIC-IV.
    demo=True conecta al dataset reducido.
    demo=False conecta al dataset completo.
    Si no se especifica, usa la variable USE_DEMO del .env
    """
    if demo is None:
        demo = os.getenv("USE_DEMO", "false").lower() == "true"
    
    if demo:
        mongo_url = os.getenv("MONGO_DEMO_URL")
        db_name = "mimic_iv_demo"
    else:
        mongo_url = os.getenv("MONGO_FULL_URL")
        db_name = "mimic_iv_full"
    
    client = MongoClient(mongo_url)
    db = client[db_name]
    
    return db