#!/bin/bash

# Script para parar todo o ambiente de desenvolvimento

set -e

# Diretório do projeto (detecta automaticamente)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

echo "🛑 Parando ambiente de desenvolvimento..."

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Parar Frontend
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}🛑 Parando Frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
        rm frontend.pid
        echo -e "${GREEN}✅ Frontend parado${NC}"
    fi
fi

# Parar processos na porta 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}🛑 Parando processo na porta 3000...${NC}"
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
fi

# Parar Backend
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}🛑 Parando Backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        rm backend.pid
        echo -e "${GREEN}✅ Backend parado${NC}"
    fi
fi

# Parar processos na porta 3001
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}🛑 Parando processo na porta 3001...${NC}"
    lsof -ti :3001 | xargs kill -9 2>/dev/null || true
fi

# Parar processos ts-node-dev
pkill -f "ts-node-dev" 2>/dev/null || true

# Parar processos webpack
pkill -f "webpack-dev-server" 2>/dev/null || true

echo -e "${GREEN}✅ Todos os processos foram parados${NC}"

# Opcional: parar MySQL também
read -p "Deseja parar o MySQL também? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}🛑 Parando MySQL...${NC}"
    docker-compose stop mysql
    echo -e "${GREEN}✅ MySQL parado${NC}"
fi
