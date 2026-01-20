# 🎯 Setup Completo do Projeto - Guia Passo a Passo

## 📋 Visão Geral

Este guia vai te ajudar a configurar todo o ambiente de desenvolvimento e produção do Sistema de Relatórios Pix Filmes.

## 🖥️ Ambiente de Desenvolvimento (Windows + WSL)

### 1. Verificar Pré-requisitos

```bash
# Verificar WSL
wsl --version

# Verificar Docker Desktop
docker --version

# Verificar Node.js no WSL
wsl node --version
```

### 2. Configurar Git e GitHub

```bash
# No WSL, dentro do projeto
npm run setup:git
```

Isso vai:
- ✅ Configurar Git com suas credenciais
- ✅ Inicializar repositório (se necessário)
- ✅ Configurar remote GitHub
- ✅ Configurar hooks automáticos
- ✅ Criar .gitignore e README.md

**Próximo passo:** Crie o repositório no GitHub:
1. Acesse: https://github.com/new
2. Nome: `relatorios`
3. Visibilidade: **Private**
4. Não inicialize com README (já temos)
5. Clique em **Create repository**

Depois, envie o código:
```bash
git push -u origin main
```

### 3. Instalar Dependências

```bash
npm run install:all
```

### 4. Iniciar Desenvolvimento

```bash
npm run dev
```

Isso vai:
- ✅ Verificar Docker
- ✅ Iniciar MySQL no Docker
- ✅ Iniciar Backend (porta 3001)
- ✅ Iniciar Frontend (porta 3000)
- ✅ Mostrar logs em tempo real

**Acesse:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api

**Login:**
- Email: `admin@pixfilmes.com`
- Senha: `admin123`

## 🐳 Ambiente de Produção (VPS)

### 1. Preparar VPS

Veja **[DEPLOY_COMPLETO.md](DEPLOY_COMPLETO.md)** para guia detalhado.

**Resumo:**
1. Instalar Docker Standalone
2. Instalar Portainer
3. Instalar Nginx Proxy Manager
4. Clonar repositório
5. Configurar `.env`
6. Deploy via Portainer
7. Configurar SSL no NPM

## 📝 Versionamento Automático

### Como Funciona

O projeto está configurado com **Git hooks automáticos**:

**Pre-commit:**
- ✅ Valida TypeScript (backend e frontend)
- ✅ Impede commit se houver erros

**Post-commit:**
- ✅ Atualiza CHANGELOG.md automaticamente
- ✅ Envia para GitHub automaticamente

### Workflow de Desenvolvimento

```bash
# 1. Fazer mudanças no código
# 2. Adicionar ao stage
git add .

# 3. Commitar (hooks executam automaticamente)
git commit -m "feat: adiciona nova funcionalidade"

# O que acontece:
# ✅ Validação pré-commit
# ✅ Atualização do CHANGELOG.md
# ✅ Push automático para GitHub
```

## 🔧 Comandos Úteis

### Desenvolvimento

```bash
npm run dev              # Inicia tudo com logs
npm run stop             # Para tudo
npm run logs:backend     # Ver logs do backend
npm run logs:frontend    # Ver logs do frontend
```

### Build

```bash
npm run build:all        # Build completo
npm run build:backend    # Apenas backend
npm run build:frontend   # Apenas frontend
```

### Git

```bash
npm run setup:git        # Configurar Git/GitHub
git status               # Ver status
git log                  # Ver histórico
```

## 📚 Documentação

- **[README.md](README.md)** - Visão geral
- **[QUICK_START.md](QUICK_START.md)** - Início rápido
- **[COMANDOS_NPM.md](COMANDOS_NPM.md)** - Todos os comandos
- **[DEPLOY_COMPLETO.md](DEPLOY_COMPLETO.md)** - Deploy em produção
- **[AUDITORIA_SEGURANCA.md](AUDITORIA_SEGURANCA.md)** - Segurança
- **[docs/](docs/)** - Documentação técnica

## 🐛 Troubleshooting

### WSL não detectado

```bash
# Verificar
cat /proc/version | grep -i microsoft

# Se não aparecer, você pode estar rodando Linux nativo
# Os scripts ainda funcionam, mas alguns recursos podem variar
```

### Docker não conecta

```bash
# Verificar se Docker Desktop está rodando no Windows
# No WSL:
docker ps

# Se der erro, inicie Docker Desktop no Windows
```

### Porta já em uso

```bash
# Verificar
lsof -i :3000
lsof -i :3001

# Matar processo
kill -9 <PID>

# Ou usar o script
npm run stop
```

### MySQL não conecta

```bash
# Verificar container
docker ps | grep mysql

# Ver logs
docker logs relatorios-mysql

# Reiniciar
docker-compose restart mysql
```

## ✅ Checklist de Setup

### Desenvolvimento
- [ ] WSL 2 instalado
- [ ] Docker Desktop instalado e rodando
- [ ] Node.js 20+ no WSL
- [ ] Git configurado
- [ ] Repositório GitHub criado
- [ ] Dependências instaladas (`npm run install:all`)
- [ ] Projeto rodando (`npm run dev`)
- [ ] Login funcionando

### Produção
- [ ] VPS configurada
- [ ] Docker Standalone instalado
- [ ] Portainer instalado
- [ ] NPM instalado
- [ ] Rede `npm_default` criada
- [ ] Repositório clonado na VPS
- [ ] `.env` configurado
- [ ] Stack deployada
- [ ] SSL configurado
- [ ] Domínio funcionando

## 🎉 Pronto para Desenvolver!

Agora você tem:
- ✅ Ambiente de desenvolvimento completo
- ✅ Hot reload funcionando
- ✅ Logs em tempo real
- ✅ Versionamento automático
- ✅ Pronto para deploy em produção

**Bom desenvolvimento! 🚀**
