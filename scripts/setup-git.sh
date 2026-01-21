#!/bin/bash

# Script para configurar Git e GitHub automaticamente

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Configurando Git e GitHub...${NC}\n"

# 1. Verificar se Git está instalado
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}❌ Git não está instalado. Instale primeiro.${NC}"
    exit 1
fi

# 2. Configurar Git (se não estiver configurado)
if [ -z "$(git config user.name)" ]; then
    echo -e "${YELLOW}Configurando Git...${NC}"
    git config --global user.name "Victor Samuel"
    git config --global user.email "victorsamuel@outlook.com"
    echo -e "${GREEN}✅ Git configurado${NC}"
fi

# 3. Inicializar repositório (se não existir)
if [ ! -d .git ]; then
    echo -e "${YELLOW}Inicializando repositório Git...${NC}"
    git init
    git branch -M main
    echo -e "${GREEN}✅ Repositório inicializado${NC}"
fi

# 4. Configurar remote (se não existir)
if ! git remote get-url origin &> /dev/null; then
    echo -e "${YELLOW}Configurando remote GitHub...${NC}"
    git remote add origin git@github.com:vicctim/relatorios.git 2>/dev/null || {
        echo -e "${YELLOW}Remote já existe ou erro ao adicionar.${NC}"
    }
    echo -e "${GREEN}✅ Remote configurado${NC}"
else
    echo -e "${GREEN}✅ Remote já configurado${NC}"
fi

# 5. Tornar hooks executáveis
echo -e "${YELLOW}Configurando hooks Git...${NC}"
chmod +x .git/hooks/pre-commit 2>/dev/null || true
chmod +x .git/hooks/post-commit 2>/dev/null || true
echo -e "${GREEN}✅ Hooks configurados${NC}"

# 6. Criar .gitignore se não existir
if [ ! -f .gitignore ]; then
    echo -e "${YELLOW}Criando .gitignore...${NC}"
    cat > .gitignore << 'EOF'
node_modules/
.env
.env.local
.env.production
*.log
.DS_Store
dist/
backend/dist/
frontend/dist/
backend.pid
frontend.pid
backend.log
frontend.log
*.pid
uploads/
.vscode/
.idea/
*.swp
*.swo
*~
EOF
    echo -e "${GREEN}✅ .gitignore criado${NC}"
fi

# 7. Criar README.md se não existir
if [ ! -f README.md ]; then
    echo -e "${YELLOW}Criando README.md...${NC}"
    cat > README.md << 'EOF'
# Sistema de Relatórios de Vídeos - Pix Filmes

Sistema completo para gerenciamento e relatórios de vídeos.

## 🚀 Início Rápido

```bash
npm run dev
```

## 📚 Documentação

Veja a pasta `docs/` para documentação completa.

## 🔧 Desenvolvimento

```bash
# Instalar dependências
npm run install:all

# Iniciar desenvolvimento
npm run dev

# Parar tudo
npm run stop
```

## 📝 Licença

Proprietário - Pix Filmes
EOF
    echo -e "${GREEN}✅ README.md criado${NC}"
fi

# 8. Fazer commit inicial (se houver mudanças)
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo -e "${YELLOW}Fazendo commit inicial...${NC}"
    git add .
    git commit -m "chore: configuração inicial do projeto" || {
        echo -e "${YELLOW}Nenhuma mudança para commitar${NC}"
    }
    echo -e "${GREEN}✅ Commit inicial criado${NC}"
fi

# 9. Instruções finais
echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Git configurado com sucesso!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo -e "📝 Próximos passos:"
echo ""
echo -e "1. Crie o repositório no GitHub:"
echo -e "   ${BLUE}https://github.com/new${NC}"
echo -e "   Nome: ${YELLOW}relatorios${NC}"
echo -e "   Visibilidade: ${YELLOW}Private${NC}"
echo ""
echo -e "2. Configure SSH key (se ainda não tiver):"
echo -e "   ${BLUE}https://docs.github.com/en/authentication/connecting-to-github-with-ssh${NC}"
echo ""
echo -e "3. Envie o código:"
echo -e "   ${YELLOW}git push -u origin main${NC}"
echo ""
echo -e "4. Os hooks automáticos vão:"
echo -e "   ✅ Validar código antes de commitar"
echo -e "   ✅ Documentar mudanças no CHANGELOG.md"
echo -e "   ✅ Enviar automaticamente para GitHub após commit"
echo ""
