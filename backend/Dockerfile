# Dockerfile otimizado para produção
FROM node:20-slim AS base

# Instalar dependências do sistema (FFmpeg, Chromium para Puppeteer)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Configurar Puppeteer para usar Chromium do sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Stage 1: Dependencies
FROM base AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build
FROM base AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production
FROM base AS production
WORKDIR /app

# Copiar dependências e build
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json

# Copiar script de entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Criar diretórios necessários
RUN mkdir -p uploads/videos uploads/logos uploads/temp uploads/thumbnails uploads/reports

# Usuário não-root para segurança
# Verificar se o usuário já existe (pode existir na imagem base)
RUN (id -u 1000 > /dev/null 2>&1 && echo "User 1000 already exists") || useradd -m -u 1000 appuser || true
RUN chown -R 1000:1000 /app
USER 1000

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Iniciar aplicação via entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]
