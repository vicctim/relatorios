# ⚡ Início Rápido - Tudo Automático

## 🚀 Iniciar Tudo (Um Comando)

```bash
npm run dev
```

Ou diretamente:

```bash
./start-all.sh
```

**Isso vai:**
1. ✅ Verificar e iniciar MySQL (se necessário)
2. ✅ Iniciar Backend na porta 3001
3. ✅ Iniciar Frontend na porta 3000
4. ✅ Aguardar tudo ficar pronto

## 🛑 Parar Tudo

```bash
npm run stop
```

Ou:

```bash
./stop-all.sh
```

## 📝 Ver Logs em Tempo Real

**Backend:**
```bash
npm run logs:backend
# ou
tail -f backend.log
```

**Frontend:**
```bash
npm run logs:frontend
# ou
tail -f frontend.log
```

## 🌐 Acessar

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

## 🔑 Login

- **Email:** `admin@pixfilmes.com`
- **Senha:** `admin123`

## ⚡ Hot Reload

- ✅ **Backend:** Reinicia automaticamente ao salvar arquivos `.ts`
- ✅ **Frontend:** Atualiza automaticamente no navegador (sem rebuild)

## 🔧 Comandos Disponíveis

```bash
# Iniciar tudo
npm run dev

# Parar tudo
npm run stop

# Iniciar apenas MySQL
npm run start:mysql

# Iniciar apenas Backend
npm run start:backend

# Iniciar apenas Frontend
npm run start:frontend

# Build de produção
npm run build:all

# Instalar dependências
npm run install:all

# Ver logs
npm run logs:backend
npm run logs:frontend
```

## 🐛 Troubleshooting

### Backend não inicia
```bash
# Ver logs
tail -f backend.log

# Verificar MySQL
docker-compose ps mysql

# Verificar porta
lsof -i :3001
```

### Frontend não inicia
```bash
# Ver logs
tail -f frontend.log

# Limpar cache
rm -rf frontend/node_modules/.cache
```

### Porta já em uso
```bash
# Parar tudo primeiro
./stop-all.sh

# Ou matar processo manualmente
lsof -ti :3000 | xargs kill -9
lsof -ti :3001 | xargs kill -9
```

## ✅ Pronto!

Agora é só desenvolver! Todas as mudanças são refletidas automaticamente. 🎉
