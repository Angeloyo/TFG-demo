"""
Script para construir (una única vez) la colección preagregada con el
conteo de transiciones dirigidas entre nodos hospitalarios para un
Directed Chord:

Salida: transfer_edges_chord con documentos { from, to, count }.

Reglas:
- Nodo sintético inicial: "Admissions".
- Para eventos discharge -> nodo "Discharge".
- Para ED/admit/transfer -> usar careunit.
- Ignorar careunit "UNKNOWN" (salvo discharge que se mapea a "Discharge").
- Colapsar repeticiones consecutivas de la misma unidad por episodio.
- Construir aristas como pares consecutivos de la secuencia extendida
  ["Admissions", unidades..., ("Discharge" si existe)].

Uso:
  python scripts/build_transfer_edges_chord.py
"""

from time import perf_counter
from pymongo import MongoClient
from pymongo.errors import OperationFailure


def get_database():
    """Conecta a la BD full (puerto 27018 como en otros scripts)."""
    client = MongoClient("mongodb://localhost:27018/")
    return client["mimic_iv_full"]


def build_edges(db):
    """Construye/actualiza transfer_edges_chord iterando por cursor (sin pipelines pesados)."""
    print("Construyendo transfer_edges_chord iterando por cursor...")

    try:
        db["hosp_transfers"].create_index([("hadm_id", 1), ("intime", 1)])
    except OperationFailure:
        pass

    start = perf_counter()

    counts: dict[tuple[str, str], int] = {}

    current_hadm: int | None = None
    prev_node: str | None = None

    cursor = db["hosp_transfers"].find(
        {}, {"hadm_id": 1, "eventtype": 1, "careunit": 1, "intime": 1}
    ).sort([("hadm_id", 1), ("intime", 1)])

    for doc in cursor:
        hadm_id = doc.get("hadm_id")
        eventtype = doc.get("eventtype")
        careunit = doc.get("careunit")

        if hadm_id != current_hadm:
            current_hadm = hadm_id
            prev_node = "Admissions"

        if eventtype == "discharge":
            node = "Discharge"
        elif eventtype == "ED":
            node = "Emergency Department"
        else:
            node = careunit

        if not node or node == "UNKNOWN":
            continue

        if prev_node == node:
            continue

        key = (prev_node, node)
        counts[key] = counts.get(key, 0) + 1
        prev_node = node

    if not counts:
        print("No se generaron aristas. Abortando inserción.")
        return

    docs = [{"from": k[0], "to": k[1], "count": v} for k, v in counts.items()]

    if "transfer_edges_chord" in db.list_collection_names():
        db["transfer_edges_chord"].drop()

    if docs:
        db["transfer_edges_chord"].insert_many(docs, ordered=False)

    elapsed = perf_counter() - start
    print(f"transfer_edges_chord creado con {len(docs)} aristas en {elapsed:.1f}s")


def main():
    print("=== Construyendo transfer_edges_chord ===")
    db = get_database()

    # Si la colección existe y ya tiene datos, abortar para no sobreescribir
    if "transfer_edges_chord" in db.list_collection_names():
        existing_docs = db["transfer_edges_chord"].estimated_document_count()
        if existing_docs and existing_docs > 0:
            print("La colección 'transfer_edges_chord' ya existe con datos.")
            print("Abortando sin realizar cambios (ejecución única).")
            print("=== Abortado ===")
            return

    build_edges(db)

    # Métricas rápidas
    total_edges = db["transfer_edges_chord"].estimated_document_count()
    print(f"Documentos (edges) en transfer_edges_chord: {total_edges}")
    print("=== Completado ===")


if __name__ == "__main__":
    main()


