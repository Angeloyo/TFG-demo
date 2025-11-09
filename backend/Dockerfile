# Dockerfile para backend FastAPI

FROM python:3.13-slim

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias desde backend/
COPY backend/requirements.txt .

# Instalar dependencias del backend + scripts de importación
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir pandas tqdm

# Copiar el código de la aplicación desde backend/
COPY backend/ .

# Copiar scripts y datos desde el contexto raíz
COPY scripts /workspace/scripts
COPY data /data

# Dar permisos al entrypoint (está en /app/entrypoint.sh)
RUN chmod +x /app/entrypoint.sh

# Exponer puerto de FastAPI
EXPOSE 8000

# Usar entrypoint en lugar de CMD
ENTRYPOINT ["/app/entrypoint.sh"]
