from fastapi import APIRouter, HTTPException
from app.utils.mongo import get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats():
    """
    Obtiene las estadísticas del dashboard categorizadas desde la colección pre-calculada.
    Súper rápido porque lee datos ya calculados.
    """
    # Conectar a la base de datos completa
    db = get_db()
    
    # Leer estadísticas categorizadas pre-calculadas
    cached_stats = db["dashboard_stats_categorized"].find_one({"_id": "main"})
    
    if cached_stats and "categories" in cached_stats:
        # Devolver estadísticas categorizadas
        return {
            "categories": cached_stats["categories"],
            "last_updated": cached_stats["last_updated"]
        }
    else:
        # Fallback: error si no existen
        raise HTTPException(
            status_code=503, 
            detail="Estadísticas categorizadas no disponibles. Ejecuta calculate_categorized_dashboard_stats.py primero."
        )