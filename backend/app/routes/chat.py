from openai import OpenAI
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import os
import asyncio
from dotenv import load_dotenv

# Cargar variables de entorno desde .env en la raíz del proyecto
load_dotenv()

router = APIRouter(prefix="/chat", tags=["chat"])
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@router.post("/")
async def chat(request: dict):
    history = request.get("history", [])
    
    print(f"🟢 NUEVA PETICION CHAT (MCP)")
    print(f"📚 Historial: {len(history)} mensajes")
    for i, msg in enumerate(history):
        print(f"  {i+1}. {msg['role']}: {msg['content'][:50]}...")
    
    system_content = """You have access to MIMIC-IV medical database through MCP tools. Available collections:

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

    # IMPORTANT:
    - First understand the database structure using available MCP tools
    - Don't assume anything, only use the data you collect
    - Answer the user's question based on the DATABASE, don't follow up with questions
    - Only if user does not provide a question, you can be conversational and ask for it
    - Answer in user's language. Do not use tables, just basic markdown (bold, italic, bullet points, numbered lists)
    - This is a REALLY BIG database, so be careful with query sizes to avoid timeouts
    - If you get timeout or any errors, try alternative approaches and inform the user

"""

    # Construir historial para OpenAI
    input_messages = [{"role": "system", "content": system_content}]
    
    # Anadir historial completo
    for msg in history:
        input_messages.append({"role": msg["role"], "content": msg["content"]})
    
    print(f"🤖 Enviando a OpenAI con MCP: {len(input_messages)} mensajes")
    print(f"   - Sistema: 1 mensaje")
    print(f"   - Historial: {len(history)} mensajes")
    
    # Configurar MCP tools
    mcp_tools = [
        {
            "type": "mcp",
            "server_label": "mimic-iv-mcp-server",
            "server_url": "https://tfg-api.angeloyo.com/mcp/",
            "require_approval": "never"
        }
    ]
    
    # Streaming con keep-alives para evitar timeouts del proxy (Cloudflare Tunnel)
    import json

    async def stream():
        print("⏳ Iniciando procesamiento con keep-alive")
        task = asyncio.create_task(asyncio.to_thread(
            client.responses.create,
            model="gpt-4.1",
            # model="gpt-5",
            input=input_messages,
            tools=mcp_tools
        ))
        try:
            while not task.done():
                # Enviar un pequeño keep-alive para que la conexión no esté idle
                yield b" \n"
                await asyncio.sleep(10)

            response = await task
            print(f"✅ Respuesta MCP de OpenAI: {response}")
            print(f"🟢 CHAT COMPLETADO")
            payload = {"response": response.output_text}
            yield json.dumps(payload).encode("utf-8")
        except asyncio.TimeoutError:
            print(f"⏰ TIMEOUT en llamada a OpenAI con MCP")
            payload = {"response": "La consulta esta tardando demasiado. Por favor, intenta con una pregunta mas especifica o con menos datos."}
            yield json.dumps(payload).encode("utf-8")
        except Exception as e:
            print(f"❌ Error en chat: {str(e)}")
            payload = {"response": f"Error al procesar la consulta con MCP: {str(e)}"}
            yield json.dumps(payload).encode("utf-8")

    return StreamingResponse(stream(), media_type="application/json", headers={"Cache-Control": "no-cache"})