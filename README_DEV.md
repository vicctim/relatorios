# 🚀 Guia de Desenvolvimento - Sistema de Relatórios Pix Filmes

## ⚙️ Configuração do Ambiente

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- WSL 2 (Ubuntu/Debian)

### Iniciar Ambiente de Desenvolvimento

#### 1. Iniciar MySQL
```bash
docker-compose up -d mysql
```

Aguarde até o MySQL ficar saudável (cerca de 10 segundos).

#### 2. Iniciar Backend
```bash
cd backend
export DB_HOST=localhost
export DB_PORT=3307
export DB_NAME=relatorios
export DB_USER=relatorios
export DB_PASSWORD=relatorios123
export JWT_SECRET=dev-secret-change-in-production-min-32-chars
export NODE_ENV=development
npm run dev
```

O backend estará disponível em: `http://localhost:3001`

#### 3. Iniciar Frontend
```bash
cd frontend
npm run dev
```

O frontend estará disponível em: `http://localhost:3000`

### 🔑 Credenciais Padrão

**Admin:**
- Email: `admin@pixfilmes.com`
- Senha: `admin123`

## 🛠️ Tecnologias

### Backend
- **Runtime:** Node.js com TypeScript
- **Hot Reload:** `ts-node-dev` (compatível com WSL)
- **Framework:** Express.js
- **ORM:** Sequelize
- **Database:** MySQL 8.0

### Frontend
- **Build Tool:** Webpack 5 (compatível com WSL)
- **Hot Reload:** Webpack Dev Server com React Refresh
- **Framework:** React 18
- **Styling:** Tailwind CSS
- **TypeScript:** Sim

## 📝 Notas Importantes

### Por que Webpack ao invés de Vite?
- Vite tem problemas conhecidos com WSL e arquivos montados do Windows
- Webpack Dev Server funciona perfeitamente no WSL
- Hot reload funciona em tempo real sem rebuild completo

### Por que ts-node-dev ao invés de tsx?
- `tsx watch` usa esbuild que tem problemas com WSL
- `ts-node-dev` é mais estável em ambientes WSL
- Hot reload funciona corretamente

## 🔧 Troubleshooting

### Backend não inicia
1. Verifique se MySQL está rodando: `docker-compose ps`
2. Verifique as variáveis de ambiente
3. Verifique os logs: `docker-compose logs mysql`

### Frontend não carrega
1. Verifique se o backend está rodando na porta 3001
2. Verifique o console do navegador para erros
3. Limpe o cache: `rm -rf frontend/node_modules/.cache`

### Erro 500 no login
1. Verifique se o banco de dados foi inicializado
2. Verifique se o usuário admin foi criado
3. Verifique os logs do backend

## 📦 Scripts Disponíveis

### Backend
- `npm run dev` - Inicia em modo desenvolvimento com hot reload
- `npm run build` - Compila TypeScript para JavaScript
- `npm run start` - Inicia versão compilada (produção)
- `npm run migrate` - Executa migrações do banco
- `npm run seed` - Popula banco com dados iniciais

### Frontend
- `npm run dev` - Inicia webpack dev server com hot reload
- `npm run build` - Compila para produção
- `npm run preview` - Preview da build de produção

## 🌐 Endpoints da API

- `GET /api/health` - Health check
- `GET /api/settings/public` - Configurações públicas
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Usuário atual

## 🔒 Segurança em Desenvolvimento

⚠️ **ATENÇÃO:** As credenciais e secrets padrão são apenas para desenvolvimento. 
Nunca use em produção!

Para produção, configure:
- `JWT_SECRET` forte (mínimo 32 caracteres)
- Senhas de banco de dados seguras
- Variáveis de ambiente adequadas
