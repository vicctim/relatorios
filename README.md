# 🎬 Sistema de Relatórios de Vídeos - Pix Filmes

Sistema completo para gerenciamento, relatórios e compartilhamento de vídeos profissionais.

## 🚀 Início Rápido

### Pré-requisitos
- **Windows 11** com **WSL 2** (Ubuntu/Debian)
- **Docker Desktop** instalado e rodando
- **Node.js 20+** no WSL
- **Git** configurado

### Instalação e Execução

```bash
# 1. Instalar dependências
npm run install:all

# 2. Iniciar ambiente de desenvolvimento (tudo automático)
npm run dev
```

> 📚 **Documentação completa**: Consulte a pasta [`docs/`](./docs/) para guias detalhados, notas de desenvolvimento e documentação de deploy.

Isso vai:
- ✅ Verificar e iniciar MySQL no Docker
- ✅ Iniciar Backend na porta 3001
- ✅ Iniciar Frontend na porta 3000
- ✅ Mostrar logs em tempo real com cores
- ✅ Hot reload funcionando

### Acessar

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

### Login Padrão

- **Email:** `admin@pixfilmes.com`
- **Senha:** `admin123`

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login!

## 📚 Documentação Completa

- **[docs/guides/QUICK_START.md](docs/guides/QUICK_START.md)** - Guia rápido de uso
- **[docs/guides/COMANDOS_NPM.md](docs/guides/COMANDOS_NPM.md)** - Todos os comandos disponíveis
- **[docs/](docs/)** - Documentação técnica completa
- **[docs/notes/AUDITORIA_SEGURANCA.md](docs/notes/AUDITORIA_SEGURANCA.md)** - Análise de segurança
- **[docs/deploy/](docs/deploy/)** - Documentação de deploy e infraestrutura

## 🛠️ Comandos Principais

```bash
# Desenvolvimento
npm run dev              # Inicia tudo com logs em tempo real
npm run stop             # Para todos os processos

# Build
npm run build:all        # Build de produção

# Git
npm run setup:git        # Configurar Git e GitHub

# Logs
npm run logs:backend     # Ver logs do backend
npm run logs:frontend    # Ver logs do frontend
```

## 🏗️ Estrutura do Projeto

```
relatorios/
├── backend/              # API Node.js + Express + TypeScript
│   ├── src/
│   │   ├── models/       # Modelos Sequelize
│   │   ├── routes/       # Rotas da API
│   │   ├── middleware/   # Autenticação, upload, etc
│   │   └── services/      # Serviços (PDF, notificações, etc)
│   └── Dockerfile
├── frontend/             # React 18 + Webpack + TypeScript
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/        # Páginas
│   │   └── contexts/     # Contextos (Auth, Theme)
│   └── Dockerfile
├── docker-compose.yml    # Desenvolvimento (MySQL apenas)
├── docker-compose.portainer.yml  # Produção (Portainer)
└── docs/                 # Documentação
```

## 🐳 Deploy em Produção

### VPS com Docker Standalone + Portainer + NPM

1. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Edite .env com valores de produção
   ```

2. **Criar rede do NPM (se não existir):**
   ```bash
   docker network create npm_default
   ```

3. **Deploy via Portainer:**
   - Acesse Portainer
   - Vá em **Stacks** → **Add stack**
   - Nome: `relatorios`
   - Upload: `docker-compose.portainer.yml`
   - Environment: Carregue o `.env`
   - Deploy!

4. **Configurar Nginx Proxy Manager:**
   - Adicione Proxy Host
   - Domain: `relatorio.pixfilmes.com`
   - Forward: `relatorios-frontend:80`
   - SSL: Let's Encrypt

Veja **[DEPLOY.md](DEPLOY.md)** para guia completo.

## 🔒 Segurança

- ✅ JWT Authentication
- ✅ Bcrypt password hashing
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Validação de uploads
- ✅ Input sanitization

⚠️ **Veja [AUDITORIA_SEGURANCA.md](AUDITORIA_SEGURANCA.md) para lista completa de melhorias recomendadas.**

## 📝 Versionamento

O projeto está configurado com:
- ✅ Git hooks automáticos
- ✅ Validação pré-commit
- ✅ Documentação automática (CHANGELOG.md)
- ✅ Push automático para GitHub

**Configurar Git:**
```bash
npm run setup:git
```

## 🧪 Tecnologias

### Backend
- Node.js 20
- Express.js
- TypeScript
- Sequelize (MySQL)
- JWT Authentication
- Puppeteer (PDF)
- FFmpeg (vídeos)

### Frontend
- React 18
- TypeScript
- Webpack 5
- Tailwind CSS
- React Router
- Axios

## 📄 Licença

Proprietário - Pix Filmes © 2024

## 👤 Autor

**Victor Samuel**
- GitHub: [@vicctim](https://github.com/vicctim)
- Email: victorsamuel@outlook.com
- Site: victorsamuel.com.br

---

**Desenvolvido com ❤️ para Pix Filmes**
