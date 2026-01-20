# Setup Local - Passo a Passo

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- FFmpeg (opcional para dev, obrigatório para compressão)

## 1. Iniciar MySQL

```bash
cd /home/victor/relatorios
docker compose up -d
```

Verificar se está rodando:
```bash
docker compose logs -f mysql
# Aguardar: "ready for connections. Version: '8.0.x'"
```

**Porta:** 3307 (evitar conflito com MySQL local)

## 2. Instalar Dependências

### Backend
```bash
cd /home/victor/relatorios/backend
npm install
```

### Frontend
```bash
cd /home/victor/relatorios/frontend
npm install
```

### Root (concurrently)
```bash
cd /home/victor/relatorios
npm install
```

## 3. Configurar Ambiente

### Backend (.env)
```env
# Database (MySQL Docker na porta 3307)
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=relatorios
DB_USER=relatorios
DB_PASSWORD=relatorios123

# JWT
JWT_SECRET=pix-filmes-jwt-secret-dev-2024
JWT_EXPIRES_IN=7d

# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Para criar tabelas na primeira execução
DB_FORCE_SYNC=true
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## 4. Iniciar Servidores

### Opção A: Separadamente (recomendado para debug)
```bash
# Terminal 1 - Backend
cd /home/victor/relatorios/backend
npm run dev

# Terminal 2 - Frontend
cd /home/victor/relatorios/frontend
npm run dev
```

### Opção B: Juntos
```bash
cd /home/victor/relatorios
npm run dev
```

## 5. Acessar Aplicação

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Health Check | http://localhost:3001/api/health |

## 6. Login Inicial

Após a primeira execução com `DB_FORCE_SYNC=true`:

- **Email:** admin@pixfilmes.com
- **Senha:** admin123

**Importante:** Após criar as tabelas, mude `DB_FORCE_SYNC=false` para evitar perda de dados.

## Comandos Úteis

```bash
# Ver logs do MySQL
docker compose logs -f mysql

# Parar MySQL
docker compose down

# Resetar banco (apaga dados!)
docker compose down -v
docker compose up -d

# Ver containers rodando
docker ps
```

## Troubleshooting

### Erro de conexão com MySQL
```bash
# Verificar se container está rodando
docker ps | grep mysql

# Ver logs de erro
docker compose logs mysql
```

### Porta 3307 em uso
```bash
# Verificar o que está usando
ss -tlnp | grep 3307
```

### FFmpeg não encontrado
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# Verificar instalação
ffmpeg -version
```
