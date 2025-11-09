from fastapi import APIRouter, HTTPException
from app.utils.mongo import get_db

router = APIRouter()

@router.get("/age-distribution")
def get_age_distribution(detailed: bool = False):
    """
    Obtiene la distribución de pacientes por grupos de edad y género.
    detailed=True: Por edad específica (18, 19, 20...)
    detailed=False: Por rangos (18-30, 30-50...)
    """
    try:
        # Conectar a la base de datos completa
        db = get_db()
        
        if detailed:
            # Agregación detallada: por edad específica
            pipeline = [
                {
                    "$match": {
                        "anchor_age": {"$type": "number", "$gte": 18, "$lte": 90},  # Rango médicamente relevante
                        "gender": {"$in": ["M", "F"]}
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "age": "$anchor_age",
                            "gender": "$gender"
                        },
                        "count": {"$sum": 1}
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "age_group": {"$toString": "$_id.age"},  # Edad como string para consistencia
                        "gender": "$_id.gender",
                        "count": 1
                    }
                },
                {
                    "$sort": {"age_group": 1, "gender": 1}
                }
            ]
            
            # Ejecutar y formatear
            result = list(db["hosp_patients"].aggregate(pipeline))
            formatted_result = result  # Ya está en el formato correcto
            
        else:
            # Agregación por rangos (comportamiento original)
            pipeline = [
                {
                    "$match": {
                        "anchor_age": {"$type": "number", "$gte": 0},  # Solo edades válidas
                        "gender": {"$in": ["M", "F"]}  # Solo géneros válidos
                    }
                },
                {
                    "$bucket": {
                        "groupBy": "$anchor_age",
                        "boundaries": [0, 18, 30, 50, 65, 80, 100],
                        "default": "Other",
                        "output": {
                            "patients": {
                                "$push": {
                                    "gender": "$gender"
                                }
                            }
                        }
                    }
                },
                {
                    "$unwind": "$patients"
                },
                {
                    "$group": {
                        "_id": {
                            "age_group": "$_id",
                            "gender": "$patients.gender"
                        },
                        "count": {"$sum": 1}
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "age_group": "$_id.age_group",
                        "gender": "$_id.gender", 
                        "count": 1
                    }
                },
                {
                    "$sort": {"age_group": 1, "gender": 1}
                }
            ]
            
            # Ejecutar agregación
            result = list(db["hosp_patients"].aggregate(pipeline))
            
            # Convertir buckets numéricos a labels legibles
            age_labels = {
                0: "0-18",
                18: "18-30", 
                30: "30-50",
                50: "50-65",
                65: "65-80",
                80: "80+"
            }
            
            # Aplicar labels y formatear para population pyramid
            formatted_result = []
            for item in result:
                if item["age_group"] != "Other":  # Excluir outliers
                    formatted_result.append({
                        "age_group": age_labels.get(item["age_group"], str(item["age_group"])),
                        "gender": item["gender"],
                        "count": item["count"]
                    })
        
        return {
            "data": formatted_result,
            "total_records": sum(item["count"] for item in formatted_result),
            "description": f"Distribución de pacientes por {'edad específica' if detailed else 'rangos de edad'} y género",
            "detailed": detailed
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al obtener distribución por edad: {str(e)}"
        ) 