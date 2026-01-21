# Guia de Configuração para WSL (Windows Subsystem for Linux)

## Problemas Corrigidos

✅ Removido Vite (incompatível) e configurado 100% Webpack
✅ Configurado hot-reload com polling para WSL
✅ Ajustado tsconfig.json para Webpack
✅ Corrigido Dockerfile para usar REACT_APP_API_URL
✅ Configurado watchOptions com usePolling para detecção de mudanças

## Pré-requisitos WSL

1. **Instalar Node.js no WSL:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Deve mostrar v20.x
```

2. **Instalar Docker Desktop com suporte WSL2:**
   - Abra Docker Desktop
   - Settings → General → Use WSL 2 based engine (marcado)
   - Settings → Resources → WSL Integration → Habilite sua distro

## Instalação e Desenvolvimento

### 1. Clone e Instale Dependências

```bash
# No WSL terminal
cd /mnt/v/_VICTOR/Site/Pix\ Filmes/relatorios

# Instalar todas as dependências
npm run install:all
```

### 2. Iniciar Banco de Dados

```bash
# Iniciar MySQL com Docker
npm run start:mysql

# Aguardar MySQL estar pronto (10-15 segundos)
# Executar migrations
cd backend && npm run migrate
cd ..
```

### 3. Desenvolvimento com Hot-Reload

**Opção A - Servidores Separados (Recomendado para WSL):**

```bash
# Terminal 1 - Backend
npm run start:backend

# Terminal 2 - Frontend (em nova aba/janela)
npm run start:frontend
```

**Opção B - Script Unificado:**

```bash
npm run dev
# Logs salvos em: backend.log e frontend.log
```

### 4. Acessar Aplicação

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Acesso via Windows: http://localhost:3000 (funciona!)

## Hot-Reload Configurado

O Webpack está configurado com polling para WSL:

```javascript
watchOptions: {
  poll: 1000,              // Verifica mudanças a cada 1 segundo
  aggregateTimeout: 300,   // Aguarda 300ms antes de rebuildar
  ignored: /node_modules/,
}
```

**Teste o Hot-Reload:**
1. Abra `frontend/src/App.tsx`
2. Altere algum texto
3. Salve (Ctrl+S)
4. O browser deve recarregar automaticamente em ~1-2 segundos

## Build para Produção

### Build Local

```bash
# Build backend + frontend
npm run build:all

# OU individual
npm run build:backend
npm run build:frontend
```

### Build com Docker

```bash
# Criar arquivo .env primeiro
cp .env.example .env
# Edite o .env com suas configurações

# Build e deploy
docker-compose -f docker-compose.prod.yml up -d --build
```

## Variáveis de Ambiente

### Desenvolvimento Local

Backend usa variáveis inline no package.json:
```bash
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=relatorios
DB_USER=relatorios
DB_PASSWORD=relatorios123
JWT_SECRET=dev-secret-change-in-production-min-32-chars
```

Frontend detecta automaticamente `localhost:3001` para API.

### Produção Docker

Crie `.env` baseado em `.env.example`:
```bash
DB_PASSWORD=sua-senha-segura
JWT_SECRET=sua-chave-jwt-muito-segura-minimo-32-caracteres
REACT_APP_API_URL=https://seu-dominio.com/api
```

## Troubleshooting WSL

### Hot-Reload não funciona

```bash
# Verifique se está usando usePolling
grep -A5 "watchOptions" frontend/webpack.config.js

# Deve mostrar: poll: 1000
```

### Erro "ENOSPC: System limit for file watchers"

```bash
# Aumentar limite de watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Porta já em uso

```bash
# Encontrar processo na porta 3000 ou 3001
sudo lsof -i :3000
sudo lsof -i :3001

# Matar processo
kill -9 <PID>
```

### MySQL não conecta

```bash
# Verificar se container está rodando
docker ps | grep mysql

# Ver logs
docker logs relatorios-mysql

# Reiniciar
docker-compose restart mysql
```

## Estrutura do Projeto

```
relatorios/
├── backend/              # Node.js + Express + TypeScript
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── frontend/             # React 18 + Webpack + TypeScript
│   ├── src/
│   ├── webpack.config.js # ✅ Configurado para WSL
│   ├── .babelrc
│   └── package.json
├── docker-compose.yml    # MySQL para dev local
├── docker-compose.prod.yml # Full stack production
└── package.json          # Scripts root
```

## Comandos Úteis

```bash
# Ver logs em tempo real
npm run logs:backend
npm run logs:frontend

# Parar todos os containers
docker-compose down

# Limpar volumes (⚠️ apaga dados)
docker-compose down -v

# Rebuild completo
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate
```

## Performance Tips WSL

1. **Mantenha arquivos no sistema WSL2** (`~/projects` ao invés de `/mnt/c/`)
   - 2-5x mais rápido para I/O
   - Melhor para node_modules

2. **Se precisar usar /mnt/**, habilite metadata:
   ```bash
   # /etc/wsl.conf
   [automount]
   options = "metadata"
   ```

3. **Use terminal nativo do WSL** (não CMD/PowerShell)

## Próximos Passos

1. ✅ Hot-reload funcionando
2. ✅ Build production configurado
3. 📋 Testar deploy em servidor
4. 📋 Configurar CI/CD
5. 📋 Setup SSL com Let's Encrypt
