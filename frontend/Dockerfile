# Dockerfile para frontend

FROM node:22-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Recibir variable de entorno
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Construir la aplicación para producción
RUN npm run build

# Exponer puerto de Next.js
EXPOSE 3000

# Ejecutar en modo desarrollo
#CMD ["npm", "run", "dev"]

# Ejecutar en modo producción
CMD ["npm", "run", "start"]
