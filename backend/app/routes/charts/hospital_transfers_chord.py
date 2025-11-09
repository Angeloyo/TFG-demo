from fastapi import APIRouter, HTTPException
from app.utils.mongo import get_db

router = APIRouter()


@router.get("/hospital-transfers-chord")
def get_hospital_transfers_chord():
    try:
        db = get_db()
        cursor = db["transfer_edges_chord"].find({}, {"_id": 0, "from": 1, "to": 1, "count": 1})
        edges = list(cursor)

        if not edges:
            return {"nodes": [], "links": []}

        names = set()
        for e in edges:
            names.add(e["from"])  
            names.add(e["to"])    

        nodes = sorted(names)
        links = [{"source": e["from"], "target": e["to"], "value": e["count"]} for e in edges]

        return {"nodes": nodes, "links": links}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


