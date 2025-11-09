# deprecated
# este chat usaba function calling de openai para hacer queries a la base de datos
# se ha pasado a MCP 

from openai import OpenAI
from fastapi import APIRouter
from app.utils.mongo import get_db
import json
import os
import asyncio
from dotenv import load_dotenv
from pathlib import Path

# Ruta absoluta al archivo .env basada en la ubicación de este archivo
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

router = APIRouter(prefix="/chat", tags=["chat"])
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

tools = [
    {
        "type": "function",
        "name": "get_schema",
        "description": "Get the schema/structure of a specific MongoDB collection to understand available fields and their types",
        "parameters": {
            "type": "object",
            "properties": {
                "collection": {
                    "type": "string", 
                    "description": "MongoDB collection name to get schema for"
                }
            },
            "required": ["collection"],
            "additionalProperties": False
        }
    },
    {
        "type": "function",
        "name": "find_documents",
        "description": "Find documents in a MongoDB collection",
        "parameters": {
            "type": "object",
            "properties": {
                "collection": {
                    "type": "string", 
                    "description": "MongoDB collection name"
                },
                "query": {
                    "type": "object", 
                    "description": "MongoDB filter object to search documents"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of documents to return (default: 10)"
                }
            },
            "required": ["collection"],
            "additionalProperties": False
        }
    },
    {
        "type": "function",
        "name": "aggregate_data",
        "description": "Run aggregation pipeline on MongoDB collection for complex queries, grouping, calculations",
        "parameters": {
            "type": "object",
            "properties": {
                "collection": {
                    "type": "string", 
                    "description": "MongoDB collection name"
                },
                "pipeline": {
                    "type": "array",
                    "items": {
                        "type": "object"
                    },
                    "description": "MongoDB aggregation pipeline array"
                }
            },
            "required": ["collection", "pipeline"],
            "additionalProperties": False
        }
    },
    {
        "type": "function",
        "name": "count_documents",
        "description": "Count documents in a MongoDB collection",
        "parameters": {
            "type": "object",
            "properties": {
                "collection": {
                    "type": "string", 
                    "description": "MongoDB collection name"
                },
                "query": {
                    "type": "object", 
                    "description": "MongoDB filter object to count matching documents"
                }
            },
            "required": ["collection"],
            "additionalProperties": False
        }
    }
]

async def get_schema(params):
    try:
        db = get_db()
        coll = db[params["collection"]]
        
        # Get a sample document to understand structure with timeout
        sample = coll.find_one({}, max_time_ms=10000)  # 10 seconds timeout
        if not sample:
            return {"error": f"Collection {params['collection']} is empty"}
        
        # Get field types from sample
        schema = {}
        for field, value in sample.items():
            schema[field] = type(value).__name__
        
        return {"collection": params["collection"], "schema": schema}
    except Exception as e:
        return {"error": f"Timeout or error getting schema for {params['collection']}: {str(e)}"}

async def find_documents(params):
    try:
        db = get_db()
        coll = db[params["collection"]]
        query = params.get("query", {})
        limit = params.get("limit", 10)
        
        return list(coll.find(query).limit(limit).max_time_ms(60000))
    except Exception as e:
        return {"error": f"Timeout or error finding documents in {params['collection']}: {str(e)}"}

async def aggregate_data(params):
    try:
        db = get_db()
        coll = db[params["collection"]]
        pipeline = params["pipeline"]
        
        return list(coll.aggregate(pipeline, maxTimeMS=60000))
    except Exception as e:
        return {"error": f"Timeout or error in aggregation on {params['collection']}: {str(e)}"}

async def count_documents(params):
    try:
        db = get_db()
        coll = db[params["collection"]]
        query = params.get("query", {})
        
        return coll.count_documents(query, maxTimeMS=60000)
    except Exception as e:
        return {"error": f"Timeout or error counting documents in {params['collection']}: {str(e)}"}

@router.post("/")
async def chat(request: dict):
    # message = request["message"]
    history = request.get("history", [])
    
    print(f"🟢 NUEVA PETICIÓN CHAT")
    # print(f"📩 Mensaje: {message}")
    print(f"📚 Historial: {len(history)} mensajes")
    for i, msg in enumerate(history):
        print(f"  {i+1}. {msg['role']}: {msg['content'][:50]}...")
    
    system_content = """You have access to MIMIC-IV medical database. Available collections:

    ## CORE PATIENT DATA:
    - hosp_patients: Patient demographics
    - hosp_admissions: Hospital admission details
    - icu_icustays: ICU stay information

    ## CLINICAL EVENTS & MONITORING:
    - icu_chartevents: ICU chart events
    - hosp_labevents: Laboratory test results 
    - hosp_microbiologyevents: Microbiology test results
    - icu_inputevents: ICU fluid/medication inputs
    - icu_outputevents: ICU fluid outputs
    - icu_procedureevents: ICU procedures performed
    - icu_datetimeevents: ICU datetime-specific events

    ## MEDICATIONS & PHARMACY:
    - hosp_prescriptions: Medication prescriptions
    - hosp_emar: Electronic medication administration records
    - hosp_emar_detail: Detailed medication administration events
    - hosp_pharmacy: Pharmacy dispensing information
    - icu_ingredientevents: ICU medication ingredient details

    ## DIAGNOSES & PROCEDURES:
    - hosp_diagnoses_icd: ICD diagnosis codes for hospitalizations
    - hosp_procedures_icd: ICD procedure codes for hospitalizations
    - hosp_drgcodes: Diagnosis Related Group codes
    - hosp_hcpcsevents: Healthcare Common Procedure Coding System events

    ## DICTIONARIES & REFERENCE DATA:
    - hosp_d_icd_diagnoses: ICD diagnosis code descriptions
    - hosp_d_icd_procedures: ICD procedure code descriptions
    - hosp_d_labitems: Laboratory test item definitions
    - icu_d_items: ICU chart event item definitions
    - hosp_d_hcpcs: HCPCS code definitions
    - icd_equivalencias: ICD code equivalencies

    ## ORDERS & WORKFLOW:
    - hosp_poe: Provider order entry (orders placed by physicians)
    - hosp_poe_detail: Detailed provider order information
    - hosp_transfers: Patient transfers between units/locations
    - hosp_services: Clinical services information
    - hosp_provider: Healthcare provider information
    - icu_caregiver: ICU caregiver information

    ## ADDITIONAL DATA:
    - hosp_omr: Operating room management records
    - dashboard_stats: Pre-calculated dashboard statistics
    - hosp_hcpcsevents: HCPCS procedure events

    You can use the following functions to get data:
    - get_schema: to get the schema of a collection
        arguments: collection
    - find_documents: to find documents in a collection
        arguments: collection, query (object), limit (optional)
    - aggregate_data: to run an aggregation pipeline on a collection
        arguments: collection, pipeline (array of objects)
    - count_documents: to count documents in a collection
        arguments: collection, query (object)

    # IMPORTANT:
    - First understand the database with get_schema, and then use the other functions to answer the user's question.
    - Don't assume anything, only use the data you collect.

    - Answer the user's question based on the DATABASE, and don't follow up with questions.
    - Only if user does not provide a question, you can be conversational and ask for it.
    - Answer in user's language. Do not use tables, just basic markdown (bold, italic, bullet points, numbered lists)

    - This is a REALLY BIG database, so before you query anything, make sure you know the size of the data you are handling to avoid errors.
    - If you get timeout or any kind of errors, try in other way and if you finally can't do it, inform the user of what happened. 

"""

    # Construir historial para OpenAI
    input_messages = [{"role": "system", "content": system_content}]
    
    # Añadir historial completo
    for msg in history:
        input_messages.append({"role": msg["role"], "content": msg["content"]})
    
    print(f"🤖 Enviando a OpenAI: {len(input_messages)} mensajes")
    print(f"   - Sistema: 1 mensaje")
    print(f"   - Historial: {len(history)} mensajes")
    
    # Loop hasta que AI pare de hacer function calls
    loop_count = 0
    while True:
        loop_count += 1
        print(f"🔄 Iteración OpenAI #{loop_count}")
        
        try:
            # Timeout para llamadas a OpenAI
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    client.responses.create,
                    # model="gpt-4.1-mini", 
                    model="gpt-4.1", 
                    # model="o4-mini", 
                    input=input_messages, 
                    tools=tools
                ),
                timeout=300.0
            )
        except asyncio.TimeoutError:
            print(f"⏰ TIMEOUT en llamada a OpenAI (iteración #{loop_count})")
            return {"response": "La consulta está tardando demasiado. Por favor, intenta con una pregunta más específica o con menos datos."}
        
        # Check if there are function calls
        function_calls = [item for item in response.output if hasattr(item, 'type') and item.type == 'function_call']
        
        print(f"🔍 Function calls encontradas: {len(function_calls)}")
        
        if not function_calls:
            # No more function calls, return final response
            print(f"✅ Respuesta final de OpenAI: {response.output_text[:100]}...")
            print(f"🟢 CHAT COMPLETADO")
            return {"response": response.output_text}
        
        # Add function calls to input
        input_messages.extend(response.output)
        
        # Execute each function call
        for call in function_calls:
            print(f"🔧 EJECUTANDO: {call.name}")
            print(f"   Args: {call.arguments}")
            
            if call.name == "get_schema":
                args = json.loads(call.arguments or '{}')
                result = await get_schema(args)
                print(f"   ✅ Resultado get_schema:")
                print(json.dumps(result, indent=2, ensure_ascii=False))
                input_messages.append({
                    "type": "function_call_output",
                    "call_id": call.call_id,
                    "output": str(result)
                })
            elif call.name == "find_documents":
                args = json.loads(call.arguments or '{}')
                result = await find_documents(args)
                print(f"   ✅ Resultado find_documents:")
                if isinstance(result, list):
                    print(f"      📊 {len(result)} documentos encontrados")
                    if len(result) > 0:
                        print(f"      🔍 Primer documento:")
                        print(json.dumps(result[0], indent=6, ensure_ascii=False, default=str))
                        if len(result) > 1:
                            print(f"      ... y {len(result)-1} documentos más")
                elif isinstance(result, dict) and "error" in result:
                    print(f"      ❌ Error: {result['error']}")
                else:
                    print(json.dumps(result, indent=6, ensure_ascii=False, default=str))
                input_messages.append({
                    "type": "function_call_output",
                    "call_id": call.call_id,
                    "output": str(result)
                })
            elif call.name == "aggregate_data":
                args = json.loads(call.arguments or '{}')
                result = await aggregate_data(args)
                print(f"   ✅ Resultado aggregate_data:")
                if isinstance(result, list):
                    print(f"      📊 {len(result)} documentos procesados")
                    if len(result) > 0:
                        print(f"      🔍 Primer resultado:")
                        print(json.dumps(result[0], indent=6, ensure_ascii=False, default=str))
                        if len(result) > 1:
                            print(f"      ... y {len(result)-1} resultados más")
                elif isinstance(result, dict) and "error" in result:
                    print(f"      ❌ Error: {result['error']}")
                else:
                    print(json.dumps(result, indent=6, ensure_ascii=False, default=str))
                input_messages.append({
                    "type": "function_call_output",
                    "call_id": call.call_id,
                    "output": str(result)
                })
            elif call.name == "count_documents":
                args = json.loads(call.arguments or '{}')
                result = await count_documents(args)
                print(f"   ✅ Resultado count_documents:")
                if isinstance(result, dict) and "error" in result:
                    print(f"      ❌ Error: {result['error']}")
                else:
                    print(f"      📊 Total: {result} documentos")
                input_messages.append({
                    "type": "function_call_output",
                    "call_id": call.call_id,
                    "output": str(result)
                }) 