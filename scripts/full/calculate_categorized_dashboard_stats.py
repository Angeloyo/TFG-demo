"""
Script para calcular estadísticas categorizadas del dashboard.
"""

from pymongo import MongoClient
from datetime import datetime, timezone

def get_database():
    """Conectar a la BD full"""
    client = MongoClient("mongodb://localhost:27018/")
    return client["mimic_iv_full"]

def calculate_stats(db):
    """Calcular todas las estadísticas por categorías"""
    print("Calculando estadísticas categorizadas...")
    
    # DEMOGRÁFICOS & ADMISIONES
    total_patients = db["hosp_patients"].count_documents({})
    total_admissions = db["hosp_admissions"].count_documents({})
    deaths = db["hosp_admissions"].count_documents({"hospital_expire_flag": 1})
    mortality_rate = round((deaths / total_admissions) * 100, 2)
    
    # UCI
    total_icu_stays = db["icu_icustays"].count_documents({})
    icu_mortality = list(db["icu_icustays"].aggregate([
        {"$lookup": {"from": "hosp_admissions", "localField": "hadm_id", "foreignField": "hadm_id", "as": "admission"}},
        {"$unwind": "$admission"},
        {"$group": {"_id": None, "icu_deaths": {"$sum": {"$cond": [{"$eq": ["$admission.hospital_expire_flag", 1]}, 1, 0]}}}}
    ]))[0]
    icu_mortality_rate = round((icu_mortality["icu_deaths"] / total_icu_stays) * 100, 1)
    
    avg_icu_stay = list(db["icu_icustays"].aggregate([
        {"$match": {"los": {"$type": "number", "$gte": 0}}},
        {"$group": {"_id": None, "avg_stay": {"$avg": "$los"}}}
    ]))[0]["avg_stay"]
    avg_icu_stay = round(avg_icu_stay, 1)
    
    # LABORATORIO & MEDICAMENTOS
    total_lab_tests = db["hosp_labevents"].estimated_document_count()
    total_prescriptions = db["hosp_prescriptions"].count_documents({})
    avg_tests_per_patient = round(total_lab_tests / total_patients)
    
    # DIAGNÓSTICOS & PROCEDIMIENTOS  
    total_diagnoses = db["hosp_diagnoses_icd"].count_documents({})
    total_procedures = db["hosp_procedures_icd"].count_documents({})
    avg_diagnoses_per_patient = round(total_diagnoses / total_patients, 1)
    
    # FLUJOS HOSPITALARIOS
    transfers_data = list(db["hosp_transfers"].aggregate([
        {"$match": {"eventtype": "transfer"}},
        {"$group": {"_id": "$hadm_id"}},
        {"$count": "admissions_with_transfers"}
    ]))[0]
    transfer_rate = round((transfers_data["admissions_with_transfers"] / total_admissions) * 100, 1)
    
    avg_moves = list(db["hosp_transfers"].aggregate([
        {"$group": {"_id": "$hadm_id", "total_moves": {"$sum": 1}}},
        {"$group": {"_id": None, "avg_moves": {"$avg": "$total_moves"}}}
    ]))[0]["avg_moves"]
    avg_moves_per_admission = round(avg_moves, 1)
    
    most_common_dest = list(db["hosp_transfers"].aggregate([
        {"$match": {"eventtype": "transfer"}},
        {"$group": {"_id": "$careunit", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]))[0]["_id"]
    
    return {
        "demograficos_admisiones": {
            "total_patients": total_patients,
            "total_admissions": total_admissions,
            "mortality_rate": mortality_rate
        },
        "icu": {
            "total_icu_stays": total_icu_stays,
            "icu_mortality_rate": icu_mortality_rate,
            "avg_icu_stay": avg_icu_stay
        },
        "laboratorio": {
            "total_lab_tests": total_lab_tests,
            "total_prescriptions": total_prescriptions,
            "avg_tests_per_patient": avg_tests_per_patient
        },
        "diagnosticos": {
            "total_diagnoses": total_diagnoses,
            "total_procedures": total_procedures,
            "avg_diagnoses_per_patient": avg_diagnoses_per_patient
        },
        "flujos": {
            "transfer_rate": transfer_rate,
            "avg_moves_per_admission": avg_moves_per_admission,
            "most_common_destination": most_common_dest
        }
    }

def save_stats(db, stats):
    """Guardar estadísticas categorizadas"""
    document = {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "categories": stats
    }
    
    db["dashboard_stats_categorized"].update_one(
        {"_id": "main"},
        {"$set": document},
        upsert=True
    )
    print("Estadísticas categorizadas guardadas en dashboard_stats_categorized")

def main():
    """Función principal"""
    print("=== Calculando estadísticas categorizadas ===")
    
    db = get_database()
    stats = calculate_stats(db)
    save_stats(db, stats)
    
    print("=== Completado ===")
    for category, data in stats.items():
        print(f"{category}: {len(data)} métricas")

if __name__ == "__main__":
    main() 