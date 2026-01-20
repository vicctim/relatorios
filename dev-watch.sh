#!/bin/bash

# Script para iniciar tudo com watch de logs em tempo real

set -e

PROJECT_DIR="/mnt/v/_VICTOR/Site/Pix Filmes/relatorios"
cd "$PROJECT_DIR"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função para limpar processos ao sair
cleanup() {
    echo -e "\n${YELLOW}🛑 Parando processos...${NC}"
    pkill -f "ts-node-dev" 2>/dev/null || true
    pkill -f "webpack-dev-server" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "${BLUE}🚀 Iniciando ambiente com watch de logs...${NC}\n"

# 1. Verificar e iniciar MySQL
echo -e "${YELLOW}📦 Verificando MySQL...${NC}"
if ! docker-compose ps mysql | grep -q "healthy"; then
    echo -e "${YELLOW}⚠️  Iniciando MySQL...${NC}"
    docker-compose up -d mysql
    echo -e "${YELLOW}⏳ Aguardando MySQL...${NC}"
    for i in {1..30}; do
        if docker-compose ps mysql | grep -q "healthy"; then
            break
        fi
        sleep 1
    done
fi
echo -e "${GREEN}✅ MySQL OK${NC}\n"

# 2. Configurar variáveis de ambiente
export DB_HOST=127.0.0.1
export DB_PORT=3307
export DB_NAME=relatorios
export DB_USER=relatorios
export DB_PASSWORD=relatorios123
export JWT_SECRET=dev-secret-change-in-production-min-32-chars
export NODE_ENV=development

# 3. Limpar logs antigos
> backend.log
> frontend.log

# 4. Iniciar Backend em background com logs
echo -e "${YELLOW}🔧 Iniciando Backend...${NC}"
cd backend
npm run dev >> ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✅ Backend iniciado (PID: $BACKEND_PID)${NC}\n"

# 5. Iniciar Frontend em background com logs
echo -e "${YELLOW}🎨 Iniciando Frontend...${NC}"
cd frontend
npm run dev >> ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✅ Frontend iniciado (PID: $FRONTEND_PID)${NC}\n"

# Aguardar um pouco para os serviços iniciarem
sleep 3

echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Ambiente iniciado!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "🌐 Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "🔧 Backend:  ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "🔑 Login: ${YELLOW}admin@pixfilmes.com${NC} / ${YELLOW}admin123${NC}"
echo ""
echo -e "${BLUE}📊 Assistindo logs em tempo real...${NC}"
echo -e "${YELLOW}💡 Pressione Ctrl+C para parar tudo${NC}"
echo ""

# Usar multitail se disponível, senão usar tail simples
if command -v multitail &> /dev/null; then
    multitail -s 2 \
        -cT ansi backend.log \
        -cT ansi frontend.log
else
    # Fallback: usar tail com cores
    tail -f backend.log frontend.log 2>/dev/null | while IFS= read -r line; do
        if [[ $line == *"backend.log"* ]]; then
            echo -e "${BLUE}[BACKEND]${NC} $line"
        elif [[ $line == *"frontend.log"* ]]; then
            echo -e "${GREEN}[FRONTEND]${NC} $line"
        else
            # Detectar tipo de log
            if [[ $line == *"error"* ]] || [[ $line == *"Error"* ]] || [[ $line == *"ERROR"* ]]; then
                echo -e "${RED}$line${NC}"
            elif [[ $line == *"warn"* ]] || [[ $line == *"Warn"* ]] || [[ $line == *"WARN"* ]]; then
                echo -e "${YELLOW}$line${NC}"
            else
                echo "$line"
            fi
        fi
    done
fi
