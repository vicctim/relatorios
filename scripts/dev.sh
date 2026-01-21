#!/bin/bash

# Script profissional de desenvolvimento com logs em tempo real
# Otimizado para WSL2 + Docker Desktop (Windows)

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Diretório do projeto (detecta automaticamente)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# Funções auxiliares
log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✅${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠️${NC} $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; }
log_step() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${CYAN}▶${NC} $1"; echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }

# Cleanup ao sair
cleanup() {
    log_warning "Parando processos..."
    pkill -f "ts-node-dev.*app.ts" 2>/dev/null || true
    pkill -f "webpack-dev-server" 2>/dev/null || true
    rm -f backend.pid frontend.pid
    log_success "Processos parados"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Verificar se está no WSL
if [ -f /proc/version ] && grep -qi microsoft /proc/version; then
    log_success "WSL detectado"
else
    log_warning "Não está rodando no WSL - alguns recursos podem não funcionar"
fi

# 1. Verificar Docker
log_step "Verificando Docker"
if ! command -v docker &> /dev/null; then
    log_error "Docker não encontrado. Instale o Docker Desktop."
    exit 1
fi

if ! docker info &> /dev/null; then
    log_error "Docker não está rodando. Inicie o Docker Desktop."
    exit 1
fi
log_success "Docker está rodando"

# 2. Iniciar MySQL
log_step "Configurando MySQL"
if docker ps --format '{{.Names}}' | grep -q "^relatorios-mysql$"; then
    if docker inspect relatorios-mysql --format '{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; then
        log_success "MySQL já está rodando e saudável"
    else
        log_warning "MySQL está rodando mas não está saudável. Reiniciando..."
        docker-compose restart mysql
        sleep 5
    fi
else
    log_info "Iniciando MySQL..."
    docker-compose up -d mysql
    
    log_info "Aguardando MySQL ficar saudável..."
    for i in {1..30}; do
        if docker inspect relatorios-mysql --format '{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; then
            log_success "MySQL está saudável"
            break
        fi
        sleep 1
        echo -n "."
    done
    echo ""
fi

# 3. Variáveis de ambiente
export DB_HOST=127.0.0.1
export DB_PORT=3307
export DB_NAME=relatorios
export DB_USER=relatorios
export DB_PASSWORD=relatorios123
export JWT_SECRET=dev-secret-change-in-production-min-32-chars-$(date +%s)
export NODE_ENV=development
export PORT=3001

# 4. Verificar dependências
log_step "Verificando dependências"
if [ ! -d "backend/node_modules" ]; then
    log_warning "Dependências do backend não instaladas. Instalando..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    log_warning "Dependências do frontend não instaladas. Instalando..."
    cd frontend && npm install && cd ..
fi
log_success "Dependências verificadas"

# 5. Limpar logs antigos
> backend.log
> frontend.log

# 6. Iniciar Backend
log_step "Iniciando Backend"
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_warning "Porta 3001 já está em uso. Parando processo anterior..."
    lsof -ti :3001 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
cd ..

log_info "Backend iniciado (PID: $BACKEND_PID)"
log_info "Aguardando backend ficar pronto..."

for i in {1..40}; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "Backend está respondendo em http://localhost:3001"
        break
    fi
    sleep 1
    if [ $((i % 5)) -eq 0 ]; then
        echo -n "."
    fi
done
echo ""

# 7. Iniciar Frontend
log_step "Iniciando Frontend"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_warning "Porta 3000 já está em uso. Parando processo anterior..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
cd ..

log_info "Frontend iniciado (PID: $FRONTEND_PID)"
sleep 3

# 8. Resumo
log_step "Ambiente de Desenvolvimento"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Ambiente iniciado com sucesso!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}🌐 Frontend:${NC}  http://localhost:3000"
echo -e "  ${CYAN}🔧 Backend:${NC}   http://localhost:3001"
echo -e "  ${CYAN}📊 Health:${NC}    http://localhost:3001/api/health"
echo ""
echo -e "  ${CYAN}🔑 Login:${NC}"
echo -e "     Email: ${YELLOW}admin@pixfilmes.com${NC}"
echo -e "     Senha: ${YELLOW}admin123${NC}"
echo ""
echo -e "  ${CYAN}📝 Logs em tempo real:${NC}"
echo -e "     Backend:  ${YELLOW}tail -f backend.log${NC}"
echo -e "     Frontend: ${YELLOW}tail -f frontend.log${NC}"
echo ""
echo -e "  ${CYAN}🛑 Para parar:${NC} ${RED}Ctrl+C${NC} ou ${RED}npm run stop${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""

# 9. Mostrar logs em tempo real com cores
log_step "Logs em Tempo Real (Ctrl+C para parar)"

tail -f backend.log frontend.log 2>/dev/null | while IFS= read -r line; do
    # Backend logs
    if [[ $line == *"backend"* ]] || [[ $line == *"Server running"* ]] || [[ $line == *"Database"* ]] || [[ $line == *"Executing"* ]]; then
        if [[ $line == *"error"* ]] || [[ $line == *"Error"* ]] || [[ $line == *"ERROR"* ]] || [[ $line == *"failed"* ]] || [[ $line == *"Failed"* ]]; then
            echo -e "${RED}[BACKEND]${NC} $line"
        elif [[ $line == *"warn"* ]] || [[ $line == *"Warn"* ]] || [[ $line == *"WARN"* ]]; then
            echo -e "${YELLOW}[BACKEND]${NC} $line"
        else
            echo -e "${BLUE}[BACKEND]${NC} $line"
        fi
    # Frontend logs
    elif [[ $line == *"webpack"* ]] || [[ $line == *"compiled"* ]] || [[ $line == *"WARNING"* ]] || [[ $line == *"ERROR"* ]]; then
        if [[ $line == *"error"* ]] || [[ $line == *"Error"* ]] || [[ $line == *"ERROR"* ]] || [[ $line == *"failed"* ]]; then
            echo -e "${RED}[FRONTEND]${NC} $line"
        elif [[ $line == *"WARNING"* ]] || [[ $line == *"warn"* ]]; then
            echo -e "${YELLOW}[FRONTEND]${NC} $line"
        else
            echo -e "${GREEN}[FRONTEND]${NC} $line"
        fi
    # Erros gerais
    elif [[ $line == *"error"* ]] || [[ $line == *"Error"* ]] || [[ $line == *"ERROR"* ]]; then
        echo -e "${RED}$line${NC}"
    # Warnings
    elif [[ $line == *"warn"* ]] || [[ $line == *"Warn"* ]] || [[ $line == *"WARNING"* ]]; then
        echo -e "${YELLOW}$line${NC}"
    # Logs normais
    else
        echo "$line"
    fi
done
