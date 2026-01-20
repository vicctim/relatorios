#!/bin/bash

# Script para iniciar todo o ambiente de desenvolvimento automaticamente

set -e

PROJECT_DIR="/mnt/v/_VICTOR/Site/Pix Filmes/relatorios"
cd "$PROJECT_DIR"

echo "🚀 Iniciando ambiente de desenvolvimento completo..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para verificar se porta está em uso
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# 1. Verificar e iniciar MySQL
echo -e "${YELLOW}📦 Verificando MySQL...${NC}"
if docker-compose ps mysql | grep -q "healthy"; then
    echo -e "${GREEN}✅ MySQL já está rodando${NC}"
else
    echo -e "${YELLOW}⚠️  MySQL não está rodando. Iniciando...${NC}"
    docker-compose up -d mysql
    echo -e "${YELLOW}⏳ Aguardando MySQL ficar saudável...${NC}"
    for i in {1..30}; do
        if docker-compose ps mysql | grep -q "healthy"; then
            echo -e "${GREEN}✅ MySQL está saudável${NC}"
            break
        fi
        sleep 1
        echo -n "."
    done
    echo ""
fi

# 2. Configurar variáveis de ambiente do backend
export DB_HOST=127.0.0.1
export DB_PORT=3307
export DB_NAME=relatorios
export DB_USER=relatorios
export DB_PASSWORD=relatorios123
export JWT_SECRET=dev-secret-change-in-production-min-32-chars
export NODE_ENV=development

# 3. Verificar e iniciar Backend
echo -e "${YELLOW}🔧 Verificando Backend...${NC}"
if check_port 3001; then
    echo -e "${GREEN}✅ Backend já está rodando na porta 3001${NC}"
else
    echo -e "${YELLOW}🚀 Iniciando Backend...${NC}"
    cd backend
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    cd ..
    
    # Aguardar backend iniciar
    echo -e "${YELLOW}⏳ Aguardando backend iniciar (pode levar até 30 segundos)...${NC}"
    BACKEND_READY=false
    for i in {1..40}; do
        if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend está rodando em http://localhost:3001${NC}"
            BACKEND_READY=true
            break
        fi
        sleep 1
        if [ $((i % 5)) -eq 0 ]; then
            echo -n "."
        fi
    done
    if [ "$BACKEND_READY" = false ]; then
        echo -e "${RED}⚠️  Backend não respondeu. Verifique os logs: tail -f backend.log${NC}"
        echo -e "${YELLOW}💡 O backend pode estar ainda inicializando. Aguarde alguns segundos.${NC}"
    fi
    echo ""
fi

# 4. Verificar e iniciar Frontend
echo -e "${YELLOW}🎨 Verificando Frontend...${NC}"
if check_port 3000; then
    echo -e "${GREEN}✅ Frontend já está rodando na porta 3000${NC}"
else
    echo -e "${YELLOW}🚀 Iniciando Frontend...${NC}"
    cd frontend
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    cd ..
    
    # Aguardar frontend iniciar
    echo -e "${YELLOW}⏳ Aguardando frontend iniciar...${NC}"
    sleep 5
    echo -e "${GREEN}✅ Frontend está rodando em http://localhost:3000${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Ambiente de desenvolvimento iniciado!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "🌐 Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "🔧 Backend:  ${GREEN}http://localhost:3001${NC}"
echo -e "📊 Health:   ${GREEN}http://localhost:3001/api/health${NC}"
echo ""
echo -e "🔑 Credenciais:"
echo -e "   Email: ${YELLOW}admin@pixfilmes.com${NC}"
echo -e "   Senha: ${YELLOW}admin123${NC}"
echo ""
echo -e "📝 Logs:"
echo -e "   Backend:  ${YELLOW}tail -f backend.log${NC}"
echo -e "   Frontend: ${YELLOW}tail -f frontend.log${NC}"
echo ""
echo -e "🛑 Para parar tudo: ${RED}./stop-all.sh${NC}"
echo ""
