from fastapi import APIRouter, HTTPException
from app.utils.mongo import get_db
import math

router = APIRouter()


@router.get("/medications-sunburst")
def get_medications_sunburst():
    """
    Devuelve datos preagregados para sunburst de medicamentos por vía (route).
    Lee de la colección `prescription_counts_by_route`.
    """
    try:
        db = get_db()

        cursor = db["prescription_counts_by_route"].find(
            {}, {"_id": 1, "total": 1, "drugs": 1}
        )
        docs = list(cursor)

        def to_safe_int(value):
            try:
                if isinstance(value, (int,)):
                    return int(value)
                if isinstance(value, float):
                    return int(value) if math.isfinite(value) else 0
                return int(value)
            except Exception:
                return 0

        def to_safe_str(value):
            try:
                if value is None:
                    return "Unknown"
                return str(value)
            except Exception:
                return "Unknown"

        data = []
        for doc in docs:
            route = to_safe_str(doc.get("_id"))
            total = to_safe_int(doc.get("total"))
            raw_drugs = doc.get("drugs", []) or []
            drugs = []
            for d in raw_drugs:
                name = to_safe_str(d.get("drug"))
                count = to_safe_int(d.get("count"))
                drugs.append({"drug": name, "count": count})
            data.append({"route": route, "total": total, "drugs": drugs})

        return {
            "data": data,
            "total_routes": len(data),
            "description": "Prescripciones agrupadas por via",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


