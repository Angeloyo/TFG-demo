"""
Script para construir por primera (y única) vez la colección preagregada con el
conteo de prescripciones por vía (route) y fármaco (drug):
prescription_counts_by_route.

Nota: si la colección ya existe con datos, el script ABORTA y no realiza cambios.

BD: DEMO

Uso:
  python scripts/demo/build_prescription_counts_by_route.py
"""

import os
from time import perf_counter
from pymongo import MongoClient


def get_database():
    """Conecta a la BD demo usando variable de entorno."""
    mongo_url = os.getenv("MONGO_DEMO_URL", "mongodb://localhost:27017/")
    client = MongoClient(mongo_url)
    return client["mimic_iv_demo"]


def build_counts(db):
    """Construye/actualiza prescription_counts_by_route de forma idempotente."""
    print("Construyendo prescription_counts_by_route con $out...")

    pipeline = [
        # Agrupar por pareja (route, drug) y contar ocurrencias
        {"$group": {
            "_id": {"route": "$route", "drug": "$drug"},
            "count": {"$sum": 1}
        }},
        # Ordenar dentro de cada route por count descendente
        {"$sort": {"_id.route": 1, "count": -1}},
        # Reagrupar por route acumulando el array de drugs con su count y el total
        {"$group": {
            "_id": "$_id.route",
            "total": {"$sum": "$count"},
            "drugs": {"$push": {"drug": "$_id.drug", "count": "$count"}}
        }},
        # Escribir salida materializada (reemplaza por completo la colección)
        {"$out": "prescription_counts_by_route"},
    ]

    start = perf_counter()
    db["hosp_prescriptions"].aggregate(pipeline, allowDiskUse=True)
    elapsed = perf_counter() - start
    print(f"prescription_counts_by_route actualizado en {elapsed:.1f}s")


def main():
    print("=== Construyendo prescription_counts_by_route (BD DEMO) ===")
    db = get_database()

    # Si la colección existe y ya tiene datos, abortar para no sobreescribir
    if "prescription_counts_by_route" in db.list_collection_names():
        existing_docs = db["prescription_counts_by_route"].estimated_document_count()
        if existing_docs and existing_docs > 0:
            print("La colección 'prescription_counts_by_route' ya existe con datos.")
            print("Abortando sin realizar cambios (ejecución única).")
            print("=== Abortado ===")
            return

    build_counts(db)

    # Métricas rápidas de validación
    total_routes = db["prescription_counts_by_route"].estimated_document_count()
    print(f"Documentos (routes) en prescription_counts_by_route: {total_routes}")
    print("=== Completado ===")


if __name__ == "__main__":
    main()
