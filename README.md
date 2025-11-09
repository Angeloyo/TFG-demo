# MIMIC-IV Clinical Data Visualization Platform

**Trabajo de Fin de Grado - Ángel Sánchez Guerrero**

Plataforma web interactiva para la visualización y análisis de datos clínicos del dataset MIMIC-IV (Medical Information Mart for Intensive Care). Permite explorar datos de pacientes, ingresos hospitalarios, diagnósticos, procedimientos, medicamentos y eventos de laboratorio a través de dashboards, gráficos interactivos y un chat con IA.

## Características principales

- **Dashboard con estadísticas**: Métricas categorizadas sobre demográficos, UCI, laboratorio, diagnósticos y flujos hospitalarios
- **Perfiles de pacientes**: Vista detallada con historial médico completo y resumen generado por IA
- **Visualizaciones interactivas**: Gráficos D3.js (population pyramid, heatmaps, icicle, sunburst, chord)
- **Chat con IA**: Consultas en lenguaje natural sobre la base de datos usando OpenAI + MCP
- **Búsqueda de pacientes**: Interfaz para explorar el dataset

## Stack tecnológico

- **Frontend**: Next.js 15.3, React 19, TypeScript, TailwindCSS, D3.js
- **Backend**: FastAPI (Python), PyMongo, FastMCP
- **Base de datos**: MongoDB 8.0
- **IA**: OpenAI API

## Configuración y ejecución

```bash
# 1. Clonar repositorio
git clone https://github.com/Angeloyo/TFG-demo
cd TFG-demo

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu OPENAI_API_KEY (opcional, necesario solo para chat y resúmenes)

# 3. Levantar servicios con Docker
docker-compose up -d
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **MongoDB**: localhost:27017

## Estructura del proyecto

```
TFG-demo/
├── backend/              # API FastAPI
│   ├── app/
│   │   ├── main.py      # Punto de entrada
│   │   ├── routes/      # Endpoints (patients, dashboard, charts, chat, summary)
│   │   └── utils/       # MongoDB y MCP server
│   └── requirements.txt
├── frontend/            # Aplicación Next.js
│   └── src/
│       ├── app/         # Pages (dashboard, chat, patient, charts)
│       ├── components/  # Componentes React
│       └── types/       # Definiciones TypeScript
├── scripts/             # Scripts de importación de datos
├── data/               # Archivos CSV del MIMIC-IV
└── docker-compose.yml
```


## Licencia

El código de este proyecto está bajo licencia MIT. El dataset MIMIC-IV tiene su propia licencia (ver `data/mimic-iv-clinical-database-demo-2.2/LICENSE.txt`).