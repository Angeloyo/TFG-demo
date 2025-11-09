#!/bin/bash
set -e

echo "⏳ Esperando a que MongoDB esté disponible..."
until python -c "from pymongo import MongoClient; MongoClient('${MONGO_DEMO_URL}', serverSelectionTimeoutMS=2000).admin.command('ping')" 2>/dev/null; do
  echo "MongoDB no disponible, reintentando..."
  sleep 2
done
echo "✅ MongoDB disponible"

echo "🔍 Verificando si la base de datos tiene datos..."
PATIENT_COUNT=$(python -c "from pymongo import MongoClient; print(MongoClient('${MONGO_DEMO_URL}')['mimic_iv_demo']['hosp_patients'].count_documents({}))" 2>/dev/null || echo "0")

if [ "$PATIENT_COUNT" -eq "0" ]; then
  echo "📥 Base de datos vacía. Iniciando importación de datos..."

  cd /workspace

  echo "[1/6] Importando dataset MIMIC-IV demo..."
  python scripts/demo/import_mimic_demo.py

  echo "[2/6] Importando equivalencias ICD..."
  python scripts/demo/import_equivalencias.py

  echo "[3/6] Construyendo conteos de diagnósticos..."
  python scripts/demo/build_diag_counts_by_code.py

  echo "[4/6] Construyendo conteos de prescripciones..."
  python scripts/demo/build_prescription_counts_by_route.py

  echo "[5/6] Construyendo aristas de transferencias..."
  python scripts/demo/build_transfer_edges_chord.py

  echo "[6/6] Calculando estadísticas del dashboard..."
  python scripts/demo/calculate_categorized_dashboard_stats.py

  echo "✅ Importación completada exitosamente"
else
  echo "✅ Base de datos ya inicializada ($PATIENT_COUNT pacientes encontrados)"
fi

echo "🚀 Iniciando servidor FastAPI en puerto 8000..."
cd /app
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
