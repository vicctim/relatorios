# ✅ Configuração Concluída - Instruções para Iniciar

## 🎯 O que foi feito:

1. ✅ **Substituído Vite por Webpack** - Compatível com WSL, hot reload funcionando
2. ✅ **Substituído tsx por ts-node-dev** - Compatível com WSL, hot reload funcionando  
3. ✅ **MySQL configurado e rodando** - Porta 3307
4. ✅ **Backend configurado** - Pronto para iniciar
5. ✅ **Frontend configurado** - Webpack Dev Server pronto

## 🚀 Como Iniciar (Passo a Passo):

### Terminal 1 - MySQL (se não estiver rodando)
```bash
cd "/mnt/v/_VICTOR/Site/Pix Filmes/relatorios"
docker-compose up -d mysql
```

Aguarde ~10 segundos até aparecer "healthy" quando rodar:
```bash
docker-compose ps mysql
```

### Terminal 2 - Backend
```bash
cd "/mnt/v/_VICTOR/Site/Pix Filmes/relatorios/backend"

export DB_HOST=127.0.0.1
export DB_PORT=3307
export DB_NAME=relatorios
export DB_USER=relatorios
export DB_PASSWORD=relatorios123
export JWT_SECRET=dev-secret-change-in-production-min-32-chars
export NODE_ENV=development

npm run dev
```

**Aguarde ver:**
```
Database connection established successfully.
All models synchronized.
Server running on http://localhost:3001
```

### Terminal 3 - Frontend
```bash
cd "/mnt/v/_VICTOR/Site/Pix Filmes/relatorios/frontend"
npm run dev
```

**Aguarde ver:**
```
webpack compiled successfully
```

## 🌐 Acessar:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

## 🔑 Login:

- **Email:** `admin@pixfilmes.com`
- **Senha:** `admin123`

## ⚡ Hot Reload:

- **Backend:** Reinicia automaticamente ao salvar arquivos `.ts`
- **Frontend:** Atualiza automaticamente no navegador (sem rebuild completo)

## 🔧 Troubleshooting:

### Backend não inicia:
1. Verifique se MySQL está rodando: `docker-compose ps mysql`
2. Verifique se a porta 3001 está livre: `lsof -i :3001` ou `netstat -tuln | grep 3001`
3. Verifique os logs do backend no terminal

### Frontend não carrega:
1. Verifique se backend está rodando: `curl http://localhost:3001/api/health`
2. Verifique se a porta 3000 está livre
3. Limpe cache: `rm -rf frontend/node_modules/.cache`

### Erro 500 no login:
1. Verifique se o banco foi inicializado (backend deve criar tabelas automaticamente)
2. Verifique se usuário admin foi criado (backend cria automaticamente)
3. Verifique logs do backend

### MySQL não conecta:
- Use `127.0.0.1` ao invés de `localhost` no DB_HOST
- Verifique se porta 3307 está mapeada: `docker-compose ps mysql`

## 📝 Notas:

- **Webpack** substitui Vite (compatível com WSL)
- **ts-node-dev** substitui tsx (compatível com WSL)  
- Hot reload funciona em **tempo real** sem rebuild completo
- Todas as mudanças são refletidas **instantaneamente**

## 🎉 Pronto!

Agora você pode desenvolver com hot reload funcionando perfeitamente no WSL!
