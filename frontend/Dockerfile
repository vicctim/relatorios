# Dockerfile otimizado para produção com multi-stage build

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
RUN npm ci

# Copiar código fonte
COPY . .

# Build arguments para variáveis de ambiente
ARG VITE_API_URL
ARG VITE_SHARE_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SHARE_URL=${VITE_SHARE_URL}

# Garantir que NODE_ENV está definido como production
ENV NODE_ENV=production

# Build da aplicação
RUN npm run build

# Stage 2: Production com Nginx
FROM nginx:alpine

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar favicon se existir na pasta public do builder
# Usar script shell temporário para verificar e copiar
RUN --mount=from=builder,source=/app/public,target=/tmp/public \
    if [ -f /tmp/public/favicon.svg ]; then \
      cp /tmp/public/favicon.svg /usr/share/nginx/html/favicon.svg && \
      echo "Favicon copiado com sucesso"; \
    else \
      echo "Favicon não encontrado, continuando sem ele"; \
    fi

# Expor porta
EXPOSE 80

# Health check (usar curl que é mais confiável no Alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
