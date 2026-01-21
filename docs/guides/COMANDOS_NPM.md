# 📋 Comandos NPM Disponíveis

## 🚀 Desenvolvimento

### `npm run dev` ou `npm run dev:watch`
**Inicia tudo com watch de erros em tempo real**
- ✅ Inicia MySQL (se necessário)
- ✅ Inicia Backend com logs
- ✅ Inicia Frontend com logs  
- ✅ Mostra todos os logs/erros em tempo real
- ✅ Pressione `Ctrl+C` para parar tudo

**Ideal para:** Desenvolvimento diário, ver erros em tempo real

---

### `npm run dev:start`
**Inicia tudo sem watch (em background)**
- ✅ Inicia tudo automaticamente
- ✅ Processos rodam em background
- ✅ Não mostra logs (use `npm run logs:*` para ver)

**Ideal para:** Quando você já tem outro terminal para logs

---

## 🛑 Parar

### `npm run stop`
**Para todos os processos**
- ✅ Para Backend
- ✅ Para Frontend
- ✅ Opcional: Para MySQL

---

## 📊 Logs

### `npm run logs:backend`
**Ver logs do backend em tempo real**
```bash
tail -f backend.log
```

### `npm run logs:frontend`
**Ver logs do frontend em tempo real**
```bash
tail -f frontend.log
```

---

## 🔧 Serviços Individuais

### `npm run start:mysql`
**Iniciar apenas MySQL**
```bash
docker-compose up -d mysql
```

### `npm run start:backend`
**Iniciar apenas Backend**
```bash
cd backend && npm run dev
```

### `npm run start:frontend`
**Iniciar apenas Frontend**
```bash
cd frontend && npm run dev
```

---

## 🏗️ Build

### `npm run build:backend`
**Build do backend para produção**
```bash
cd backend && npm run build
```

### `npm run build:frontend`
**Build do frontend para produção**
```bash
cd frontend && npm run build
```

### `npm run build:all`
**Build de tudo**
```bash
npm run build:backend && npm run build:frontend
```

---

## 📦 Instalação

### `npm run install:all`
**Instalar dependências de tudo**
```bash
cd backend && npm install && cd ../frontend && npm install
```

---

## 🎯 Recomendação

**Para desenvolvimento diário:**
```bash
npm run dev
```

Isso vai:
1. ✅ Iniciar tudo automaticamente
2. ✅ Mostrar todos os logs/erros em tempo real
3. ✅ Hot reload funcionando
4. ✅ Fácil de parar com Ctrl+C

**Para ver apenas logs específicos:**
```bash
# Terminal 1: Iniciar tudo
npm run dev:start

# Terminal 2: Ver logs do backend
npm run logs:backend

# Terminal 3: Ver logs do frontend  
npm run logs:frontend
```

---

## 💡 Dicas

- Use `npm run dev` para ver erros em tempo real
- Use `npm run dev:start` se preferir logs separados
- Logs são salvos em `backend.log` e `frontend.log`
- PIDs são salvos em `backend.pid` e `frontend.pid`
