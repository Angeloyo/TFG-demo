"""
Script para importar equivalencias ICD a la BD FULL

Uso:
  python scripts/full/import_equivalencias.py
"""

import pandas as pd
from pymongo import MongoClient

# Conexión a la base de datos full
client = MongoClient("mongodb://localhost:27018/")
db = client["mimic_iv_full"]

# Ruta del archivo CSV (relativa desde la raíz del proyecto)
csv_path = "icd_con_equivalencia_ic10_extended.csv"

def importar_equivalencias():
    """Importa las equivalencias ICD a la base de datos full"""
    
    print("📁 Cargando archivo de equivalencias ICD...")
    
    try:
        # Cargar todas las columnas del CSV
        df_equiv = pd.read_csv(csv_path)
        
        print(f"✅ Cargadas {len(df_equiv)} equivalencias ICD")
        
        # Convertir a lista de documentos
        records = df_equiv.to_dict(orient="records")
        
        # Importar a base de datos completa
        print("📥 Importando a base de datos completa...")
        
        # Borrar colección existente si existe
        db.drop_collection("icd_equivalencias")
        
        # Insertar datos
        db["icd_equivalencias"].insert_many(records)
        print(f"✅ Importadas {len(records)} equivalencias a BD completa")
        
        print("\n🎉 Importación completada exitosamente")
        
    except Exception as e:
        print(f"❌ Error durante la importación: {e}")

if __name__ == "__main__":
    importar_equivalencias()
