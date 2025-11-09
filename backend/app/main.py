from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.patients import router as patients_router
from app.routes.dashboard import router as dashboard_router
from app.routes.charts.router import router as charts_router
from app.routes.chat import router as chat_router
from app.routes.summary import router as summary_router
from app.utils.mcp import mcp

mcp_app = mcp.http_app(path="/")


app = FastAPI(
    title="MIMIC-IV Analytics API",
    description="API para visualización de datos clínicos MIMIC-IV",
    version="1.0.0",
    lifespan=mcp_app.lifespan
)

app.mount("/mcp", mcp_app)

# Incluir routers
app.include_router(patients_router)
app.include_router(dashboard_router)
app.include_router(charts_router)
app.include_router(chat_router)
app.include_router(summary_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "MIMIC-IV Analytics API"}

@app.get("/health")
def health():
    return {"status": "healthy"}
