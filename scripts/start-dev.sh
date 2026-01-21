#!/bin/bash

# Script para iniciar backend e frontend em desenvolvimento

set -e

# Diretório do projeto (detecta automaticamente)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

echo "🚀 Iniciando ambiente de desenvolvimento..."

# Verificar se MySQL está rodando
echo "📦 Verificando MySQL..."
docker-compose ps mysql | grep -q "healthy" || {
    echo "⚠️  MySQL não está rodando. Iniciando..."
    docker-compose up -d mysql
    echo "⏳ Aguardando MySQL ficar saudável..."
    sleep 10
}

# Iniciar backend
echo "🔧 Iniciando Backend..."
cd backend
export DB_HOST=localhost
export DB_PORT=3307
export DB_NAME=relatorios
export DB_USER=relatorios
export DB_PASSWORD=relatorios123
export JWT_SECRET=dev-secret-change-in-production-min-32-chars
export NODE_ENV=development
npm run dev &
BACKEND_PID=$!
cd ..

# Aguardar backend iniciar
sleep 5

# Iniciar frontend
echo "🎨 Iniciando Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Ambiente iniciado!"
echo "📝 Backend PID: $BACKEND_PID"
echo "📝 Frontend PID: $FRONTEND_PID"
echo ""
echo "Para parar, execute: kill $BACKEND_PID $FRONTEND_PID"

wait
