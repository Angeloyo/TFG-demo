from fastapi import APIRouter, HTTPException, Response
from app.utils.mongo import get_db
import math

router = APIRouter(prefix="/api/patients", tags=["patients"])

def clean_data(obj):
    """Limpia valores NaN, null y ObjectId de los datos"""
    if isinstance(obj, dict):
        cleaned = {}
        for key, value in obj.items():
            if key == "_id":  # Excluir _id de MongoDB
                continue
            cleaned_value = clean_data(value)
            if cleaned_value is not None:  # Solo incluir valores válidos
                cleaned[key] = cleaned_value
        return cleaned
    elif isinstance(obj, list):
        return [clean_data(item) for item in obj if clean_data(item) is not None]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None  # Convertir NaN/Inf a None
        return obj
    elif obj == "NaN" or obj == "nan":
        return None  # Convertir strings NaN a None
    else:
        return obj

@router.head("/{subject_id}/exists")
def patient_exists_head(subject_id: int):
    """Comprueba si existe un paciente por subject_id (HEAD 200/404)."""
    db = get_db()
    exists = db["hosp_patients"].find_one({"subject_id": subject_id}, {"_id": 1}) is not None
    if not exists:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return Response(status_code=200)

@router.get("/{subject_id}")
def get_patient(subject_id: int):
    """Obtiene información completa de un paciente"""
    db = get_db()
    
    # Buscar datos básicos del paciente
    patient = db["hosp_patients"].find_one({"subject_id": subject_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    
    # Buscar historial de ingresos (ordenado de más reciente a más antiguo)
    admissions = list(
        db["hosp_admissions"]
        .find({"subject_id": subject_id})
        .sort("admittime", -1)
    )
    
    # Buscar diagnósticos con descripciones
    diagnoses_pipeline = [
        {"$match": {"subject_id": subject_id}},
        {"$lookup": {
            "from": "hosp_d_icd_diagnoses",
            "let": {"code": "$icd_code", "version": "$icd_version"},
            "pipeline": [
                {"$match": {"$expr": {"$and": [
                    {"$eq": [{"$toString": "$icd_code"}, "$$code"]},
                    {"$eq": ["$icd_version", "$$version"]}
                ]}}}
            ],
            "as": "description"
        }},
        {"$addFields": {
            "description": {"$arrayElemAt": ["$description.long_title", 0]}
        }},
        {"$sort": {"hadm_id": 1, "seq_num": 1}}
    ]
    
    diagnoses = list(db["hosp_diagnoses_icd"].aggregate(diagnoses_pipeline))
    
    # Buscar procedimientos con descripciones
    procedures_pipeline = [
        {"$match": {"subject_id": subject_id}},
        {"$lookup": {
            "from": "hosp_d_icd_procedures",
            "let": {"code": "$icd_code", "version": "$icd_version"},
            "pipeline": [
                {"$match": {"$expr": {"$and": [
                    {"$eq": [{"$toString": "$icd_code"}, "$$code"]},
                    {"$eq": ["$icd_version", "$$version"]}
                ]}}}
            ],
            "as": "description"
        }},
        {"$addFields": {
            "description": {"$arrayElemAt": ["$description.long_title", 0]}
        }},
        {"$sort": {"hadm_id": 1, "chartdate": -1, "seq_num": 1}}
    ]
    procedures = list(db["hosp_procedures_icd"].aggregate(procedures_pipeline))
    
    # Obtener todos los eventos de laboratorio del paciente y anidarlos por ingreso (hadm_id)
    labevents_pipeline = [
        {"$match": {"subject_id": subject_id}},
        {"$lookup": {
            "from": "hosp_d_labitems",
            "localField": "itemid",
            "foreignField": "itemid",
            "as": "item"
        }},
        {"$addFields": {
            "label": {"$arrayElemAt": ["$item.label", 0]},
            "fluid": {"$arrayElemAt": ["$item.fluid", 0]},
            "category": {"$arrayElemAt": ["$item.category", 0]}
        }},
        {"$project": {"item": 0}},
        {"$sort": {"charttime": -1}}
    ]
    labevents = list(db["hosp_labevents"].aggregate(labevents_pipeline))

    # Mapear labevents por hadm_id
    hadm_to_labs = {}
    for ev in labevents:
        key = ev.get("hadm_id")
        if key is None:
            continue
        hadm_to_labs.setdefault(key, []).append(ev)

    # Enriquecer admisiones con labevents
    enriched_admissions = []
    for admission in admissions:
        adm = dict(admission)
        adm["labevents"] = hadm_to_labs.get(adm.get("hadm_id"), [])
        enriched_admissions.append(adm)

    # Limpiar todos los datos
    clean_patient = clean_data(patient)
    clean_admissions = [clean_data(admission) for admission in enriched_admissions]
    clean_diagnoses = [clean_data(diagnosis) for diagnosis in diagnoses]
    clean_procedures = [clean_data(procedure) for procedure in procedures]
    
    return {
        "patient": clean_patient,
        "admissions": clean_admissions,
        "diagnoses": clean_diagnoses,
        "procedures": clean_procedures,
    }

@router.get("/")
def list_patients(limit: int = 10):
    """Lista los primeros pacientes disponibles"""
    db = get_db()
    
    patients = list(db["hosp_patients"].find({}).limit(limit))
    
    # Limpiar datos
    clean_patients = [clean_data(patient) for patient in patients]
    
    return {
        "patients": clean_patients,
        "count": len(clean_patients)
    } 