from fastapi import APIRouter, HTTPException, Query
from app.utils.mongo import get_db

router = APIRouter()

@router.get("/admission-heatmap")
def get_admission_heatmap(
    filter_midnight: bool = Query(True, description="Filter out midnight records (00:00:00)"),
    view_type: str = Query("hourly", description="View type: 'hourly' or 'monthly'")
):
    try:
        db = get_db()
        
        pipeline = []
        
        # Añadir filtro de medianoche solo si se solicita
        if filter_midnight:
            pipeline.append({
                "$match": {
                    "admittime": {"$not": {"$regex": "00:00:00$"}}
                }
            })
        
        pipeline.append({
            "$addFields": {
                "admitdate": {"$dateFromString": {"dateString": "$admittime"}}
            }
        })
        
        # Para vista mensual, filtrar el 29 de febrero (año bisiesto distorsiona la escala)
        if view_type == "monthly":
            pipeline.append({
                "$match": {
                    "$expr": {
                        "$not": {
                            "$and": [
                                {"$eq": [{"$month": "$admitdate"}, 2]},
                                {"$eq": [{"$dayOfMonth": "$admitdate"}, 29]}
                            ]
                        }
                    }
                }
            })
        
        # Configurar agrupación según el tipo de vista
        if view_type == "monthly":
            pipeline.extend([
                {
                    "$group": {
                        "_id": {
                            "month": {"$month": "$admitdate"},
                            "dayOfMonth": {"$dayOfMonth": "$admitdate"}
                        },
                        "count": {"$sum": 1}
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "month": "$_id.month",
                        "dayOfMonth": "$_id.dayOfMonth",
                        "count": 1
                    }
                }
            ])
        else:  # hourly (default)
            pipeline.extend([
                {
                    "$group": {
                        "_id": {
                            "hour": {"$hour": "$admitdate"},
                            "dayOfWeek": {"$dayOfWeek": "$admitdate"}
                        },
                        "count": {"$sum": 1}
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "hour": "$_id.hour",
                        "dayOfWeek": "$_id.dayOfWeek",
                        "count": 1
                    }
                }
            ])
        
        result = list(db["hosp_admissions"].aggregate(pipeline))
        
        return {"data": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 