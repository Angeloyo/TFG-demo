"""
Script para construir/actualizar la colección preagregada con el
conteo total de diagnósticos por icd_code: diag_counts_by_code

Uso:
  python scripts/build_diag_counts_by_code.py
"""

from time import perf_counter
from pymongo import MongoClient


def get_database():
    """Conecta a la BD full (puerto 27018 como en otros scripts)."""
    client = MongoClient("mongodb://localhost:27018/")
    return client["mimic_iv_full"]


def build_counts(db):
    """Construye/actualiza diag_counts_by_code usando $merge (idempotente)."""
    print("Reconstruyendo diag_counts_by_code con $out...")

    pipeline = [
        {"$project": {"_id": 0, "icd_code": 1}},
        {"$match": {"icd_code": {"$type": "string", "$ne": ""}}},
        {"$group": {"_id": "$icd_code", "count": {"$sum": 1}}},
        {"$project": {"_id": 0, "icd_code": "$_id", "count": 1}},
        {"$out": "diag_counts_by_code"},
    ]

    start = perf_counter()
    db["hosp_diagnoses_icd"].aggregate(pipeline, allowDiskUse=True)
    elapsed = perf_counter() - start
    print(f"diag_counts_by_code actualizado en {elapsed:.1f}s")


def main():
    print("=== Construyendo diag_counts_by_code ===")
    db = get_database()
    build_counts(db)

    # Métricas rápidas de validación
    total = db["diag_counts_by_code"].estimated_document_count()
    print(f"Documentos en diag_counts_by_code: {total}")
    print("=== Completado ===")


if __name__ == "__main__":
    main()


