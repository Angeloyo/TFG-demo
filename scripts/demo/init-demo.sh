#!/bin/bash
# Script de inicialización para la base de datos demo
# Ejecuta todos los scripts de importación y pre-agregación en orden

set -e  # Salir si algún comando falla

echo "================================"
echo "Inicializando base de datos DEMO"
echo "================================"

# Esperar a que MongoDB esté listo
echo "⏳ Esperando a que MongoDB esté disponible..."
until mongosh --host mongodb --port 27017 --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
  echo "MongoDB no está listo, esperando..."
  sleep 2
done
echo "✅ MongoDB está disponible"

# Cambiar al directorio raíz del proyecto
cd /workspace

# 1. Importar dataset demo
echo ""
echo "📥 [1/6] Importando dataset MIMIC-IV demo..."
python scripts/demo/import_mimic_demo.py

# 2. Importar equivalencias ICD
echo ""
echo "📥 [2/6] Importando equivalencias ICD..."
python scripts/demo/import_equivalencias.py

# 3. Construir conteos de diagnósticos
echo ""
echo "🔧 [3/6] Construyendo conteos de diagnósticos..."
python scripts/demo/build_diag_counts_by_code.py

# 4. Construir conteos de prescripciones
echo ""
echo "🔧 [4/6] Construyendo conteos de prescripciones..."
python scripts/demo/build_prescription_counts_by_route.py

# 5. Construir aristas de transferencias
echo ""
echo "🔧 [5/6] Construyendo aristas de transferencias..."
python scripts/demo/build_transfer_edges_chord.py

# 6. Calcular estadísticas del dashboard
echo ""
echo "📊 [6/6] Calculando estadísticas del dashboard..."
python scripts/demo/calculate_categorized_dashboard_stats.py

echo ""
echo "================================"
echo "✅ Inicialización completada"
echo "================================"
