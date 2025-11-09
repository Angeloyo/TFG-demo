from fastapi import APIRouter, HTTPException
from app.utils.mongo import get_db

router = APIRouter()

@router.get("/diagnosis-icicle")
def get_diagnosis_icicle(min_count: int = 50):
    """
    Datos para Icicle de diagnósticos ICD.
    Lee de la colección preagregada diag_counts_by_code (conteos por icd_code)
    y agrupa por chapter / super_section / section usando icd_equivalencias.

    min_count: umbral mínimo de frecuencia para incluir nodos (default: 50)
    """
    try:
        db = get_db()

        # Agregación desde la colección preagregada de conteos por icd_code
        pipeline = [
            {"$project": {"icd_code": 1, "count": 1}},
            {
                "$lookup": {
                    "from": "icd_equivalencias",
                    "localField": "icd_code",
                    "foreignField": "icd_code",
                    "as": "equiv"
                }
            },
            {"$unwind": "$equiv"},
            {
                "$match": {
                    "equiv.chapter_name": {"$exists": True, "$ne": None, "$type": "string"},
                    "equiv.super_section_name": {"$type": ["string", "null"]},
                    "equiv.section_name": {"$type": ["string", "null"]}
                }
            },
            {
                "$group": {
                    "_id": {
                        "chapter": "$equiv.chapter_name",
                        "super_section": "$equiv.super_section_name",
                        "section": "$equiv.section_name"
                    },
                    "count": {"$sum": "$count"}
                }
            },
            {"$match": {"count": {"$gte": min_count}}},
            {"$sort": {"count": -1}}
        ]

        result = list(db["diag_counts_by_code"].aggregate(pipeline))
        
        # Construir jerarquía anidada para D3
        chapters = {}
        
        for item in result:
            hierarchy = item["_id"]
            chapter = hierarchy["chapter"]
            super_section = hierarchy.get("super_section") if hierarchy.get("super_section") not in [None, ""] else None
            section = hierarchy.get("section") if hierarchy.get("section") not in [None, ""] else None
            count = item["count"]
            
            # Nivel 1: Chapter
            if chapter not in chapters:
                chapters[chapter] = {
                    "name": chapter,
                    "children": {},
                    "value": 0
                }
            
            chapters[chapter]["value"] += count
            
            # Nivel 2: Super-section (si existe)
            if super_section and super_section != chapter:
                if super_section not in chapters[chapter]["children"]:
                    chapters[chapter]["children"][super_section] = {
                        "name": super_section,
                        "children": {},
                        "value": 0
                    }
                chapters[chapter]["children"][super_section]["value"] += count
                
                # Nivel 3: Section (si existe)
                if section and section != super_section:
                    if section not in chapters[chapter]["children"][super_section]["children"]:
                        chapters[chapter]["children"][super_section]["children"][section] = {
                            "name": section,
                            "value": 0
                        }
                    chapters[chapter]["children"][super_section]["children"][section]["value"] += count
            # Si no hay super_section o section, simplemente acumulamos en el nivel existente
        
        # Convertir diccionarios a listas para D3
        def dict_to_list(node):
            if isinstance(node.get("children"), dict):
                node["children"] = [dict_to_list(child) for child in node["children"].values()]
            return node
        
        data = {
            "name": "Diagnósticos",
            "children": [dict_to_list(chapter) for chapter in chapters.values()]
        }
        
        return {"data": data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
