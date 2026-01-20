#!/bin/bash

# Versão simples que mostra logs lado a lado

set -e

PROJECT_DIR="/mnt/v/_VICTOR/Site/Pix Filmes/relatorios"
cd "$PROJECT_DIR"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

cleanup() {
    echo -e "\n${YELLOW}🛑 Parando...${NC}"
    pkill -f "ts-node-dev" 2>/dev/null || true
    pkill -f "webpack-dev-server" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar MySQL se necessário
if ! docker-compose ps mysql | grep -q "healthy"; then
    docker-compose up -d mysql
    sleep 10
fi

# Variáveis de ambiente
export DB_HOST=127.0.0.1 DB_PORT=3307 DB_NAME=relatorios DB_USER=relatorios DB_PASSWORD=relatorios123
export JWT_SECRET=dev-secret-change-in-production-min-32-chars NODE_ENV=development

# Limpar logs
> backend.log
> frontend.log

echo -e "${BLUE}🚀 Iniciando com watch de erros...${NC}\n"

# Iniciar backend
cd backend && npm run dev >> ../backend.log 2>&1 & cd ..
echo -e "${GREEN}✅ Backend iniciado${NC}"

# Iniciar frontend  
cd frontend && npm run dev >> ../frontend.log 2>&1 & cd ..
echo -e "${GREEN}✅ Frontend iniciado${NC}\n"

sleep 3

echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}🌐 Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}🔧 Backend:  http://localhost:3001${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${YELLOW}💡 Pressione Ctrl+C para parar${NC}\n"

# Mostrar logs com cores
tail -f backend.log frontend.log 2>/dev/null | while IFS= read -r line; do
    # Backend logs
    if [[ $line == *"backend"* ]] || [[ $line == *"BACKEND"* ]]; then
        if [[ $line == *"error"* ]] || [[ $line == *"Error"* ]] || [[ $line == *"ERROR"* ]] || [[ $line == *"failed"* ]]; then
            echo -e "${RED}[BACKEND] $line${NC}"
        elif [[ $line == *"warn"* ]] || [[ $line == *"Warn"* ]]; then
            echo -e "${YELLOW}[BACKEND] $line${NC}"
        else
            echo -e "${BLUE}[BACKEND] $line${NC}"
        fi
    # Frontend logs
    elif [[ $line == *"frontend"* ]] || [[ $line == *"webpack"* ]] || [[ $line == *"FRONTEND"* ]]; then
        if [[ $line == *"error"* ]] || [[ $line == *"Error"* ]] || [[ $line == *"ERROR"* ]] || [[ $line == *"failed"* ]]; then
            echo -e "${RED}[FRONTEND] $line${NC}"
        elif [[ $line == *"warn"* ]] || [[ $line == *"Warn"* ]]; then
            echo -e "${YELLOW}[FRONTEND] $line${NC}"
        else
            echo -e "${GREEN}[FRONTEND] $line${NC}"
        fi
    # Erros gerais
    elif [[ $line == *"error"* ]] || [[ $line == *"Error"* ]] || [[ $line == *"ERROR"* ]]; then
        echo -e "${RED}$line${NC}"
    # Warnings
    elif [[ $line == *"warn"* ]] || [[ $line == *"Warn"* ]]; then
        echo -e "${YELLOW}$line${NC}"
    # Logs normais
    else
        echo "$line"
    fi
done
