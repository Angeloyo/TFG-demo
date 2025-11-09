import os
import pandas as pd
from pymongo import MongoClient
from tqdm import tqdm

# Conectar con MongoDB dentro del contenedor de Docker
client = MongoClient("mongodb://localhost:27018/")
db = client["mimic_iv_full"]  # Nombre de la base de datos

# Ruta del dataset
dataset_path = "/home/angel/Documents/github/TFG-Angel-Sanchez/DB_SRC/mimic-iv-3.1"

# Función para importar CSVs a MongoDB por chunks
def import_csv_to_mongo(folder_path, subfolder):
    full_path = os.path.join(folder_path, subfolder)
    if not os.path.exists(full_path):
        return

    files = [f for f in os.listdir(full_path) if f.endswith(".csv.gz")]
    
    for file in tqdm(files, desc=f"Archivos de {subfolder}"):
        collection_name = f"{subfolder}_{file.replace('.csv.gz', '')}"
        file_path = os.path.join(full_path, file)
        
        print(f"\n📁 Procesando: {file}")
        
        # Leer en chunks para no sobrecargar memoria
        chunk_size = 10000
        chunk_count = 0
        
        try:
            for chunk in tqdm(pd.read_csv(file_path, chunksize=chunk_size), 
                            desc=f"Chunks de {file}", 
                            unit="chunk"):
                chunk_count += 1
                # Insertar chunk en MongoDB
                records = chunk.to_dict(orient="records")
                db[collection_name].insert_many(records)
                
                # Información de progreso
                print(f"  ✅ Chunk {chunk_count}: {len(records)} registros insertados")
                
        except Exception as e:
            print(f"❌ Error procesando {file}: {e}")
            continue
            
        print(f"✅ Completado: {file} - Total chunks procesados: {chunk_count}")

# Importar las carpetas principales
import_csv_to_mongo(dataset_path, "hosp")
import_csv_to_mongo(dataset_path, "icu")

print("Importación completada en MongoDB.")
