from fastapi import APIRouter, HTTPException
from app.utils.mongo import get_db

router = APIRouter()

@router.get("/icu-stay-duration")
def get_icu_stay_duration():
    """
    Obtiene la estancia promedio en días por unidad de UCI.
    Incluye todos los datos sin filtros para máxima precisión.
    """
    try:
        # Conectar a la base de datos completa
        db = get_db()
        
        # Agregación para calcular estancia promedio por unidad UCI
        pipeline = [
            {
                "$match": {
                    "los": {"$type": "number", "$gte": 0},  # Solo números positivos válidos
                    "first_careunit": {"$exists": True, "$ne": None, "$ne": ""}  # Solo con unidad válida
                }
            },
            {
                "$group": {
                    "_id": "$first_careunit",
                    "avg_stay_days": {"$avg": "$los"},
                    "total_stays": {"$sum": 1},
                    "min_stay": {"$min": "$los"},
                    "max_stay": {"$max": "$los"}
                }
            },
            {
                "$sort": {"avg_stay_days": -1}  # Ordenar por estancia promedio descendente
            },
            {
                "$project": {
                    "_id": 0,
                    "careunit": "$_id",
                    "avg_stay_days": {"$round": ["$avg_stay_days", 2]},
                    "total_stays": 1,
                    "min_stay": {"$round": ["$min_stay", 2]},
                    "max_stay": {"$round": ["$max_stay", 2]}
                }
            }
        ]
        
        # Ejecutar agregación
        result = list(db["icu_icustays"].aggregate(pipeline))
        
        return {
            "data": result,
            "total_units": len(result),
            "description": "Estancia promedio en dias por unidad de UCI (todos los datos)"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al obtener datos de estancia UCI: {str(e)}"
        ) 