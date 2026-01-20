# Estrutura do Projeto

```
/home/victor/relatorios/
│
├── docs/                          # Documentação
│   ├── 00-INDICE.md
│   ├── 01-VISAO-GERAL.md
│   ├── 02-STATUS-DESENVOLVIMENTO.md
│   ├── 03-SETUP-LOCAL.md
│   ├── 04-ESTRUTURA-PROJETO.md    # Este arquivo
│   ├── 05-API-ENDPOINTS.md
│   ├── 06-MODELOS-DADOS.md
│   ├── 07-REGRAS-NEGOCIO.md
│   └── 08-DEPLOY-PRODUCAO.md
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts        # Configuração Sequelize
│   │   │
│   │   ├── models/
│   │   │   ├── index.ts           # Export de todos models
│   │   │   ├── User.ts            # Usuários
│   │   │   ├── Setting.ts         # Configurações
│   │   │   ├── Professional.ts    # Profissionais/Editores
│   │   │   ├── Video.ts           # Vídeos (com versões)
│   │   │   ├── DownloadLog.ts     # Logs de download
│   │   │   └── NotificationRecipient.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT + autorização
│   │   │   └── upload.ts          # Multer config
│   │   │
│   │   ├── services/
│   │   │   ├── ffmpeg.service.ts  # Análise/compressão
│   │   │   ├── report.service.ts  # Cálculos de relatório
│   │   │   ├── pdf.service.ts     # Geração PDF
│   │   │   └── notification.service.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── index.ts           # Router principal
│   │   │   ├── auth.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── professionals.routes.ts
│   │   │   ├── settings.routes.ts
│   │   │   ├── videos.routes.ts
│   │   │   ├── reports.routes.ts
│   │   │   ├── logs.routes.ts
│   │   │   └── notifications.routes.ts
│   │   │
│   │   └── app.ts                 # Entry point Express
│   │
│   ├── uploads/                   # Arquivos de vídeo
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   ├── .gitignore
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── index.ts
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Header.tsx
│   │   │   │
│   │   │   └── ui/
│   │   │       ├── index.ts
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── Modal.tsx
│   │   │
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Upload.tsx
│   │   │   ├── Videos.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── admin/
│   │   │       ├── Users.tsx
│   │   │       ├── Professionals.tsx
│   │   │       └── Settings.tsx
│   │   │
│   │   ├── services/
│   │   │   └── api.ts             # Axios config
│   │   │
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript types
│   │   │
│   │   ├── utils/
│   │   │   └── formatters.ts
│   │   │
│   │   ├── App.tsx                # Router principal
│   │   ├── main.tsx               # Entry point
│   │   └── index.css              # Tailwind imports
│   │
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── nginx.conf                 # Config para container
│   ├── .env
│   ├── .gitignore
│   └── Dockerfile
│
├── nginx/
│   └── nginx.conf                 # Reverse proxy produção
│
├── docker-compose.yml             # Dev (MySQL porta 3307)
├── docker-compose.prod.yml        # Produção completa
├── package.json                   # Root scripts
├── .env.example
├── .gitignore
├── CLAUDE.md                      # Instruções para AI
└── PROJETO_COMPLETO.md            # Especificação original
```

## Descrição das Pastas Principais

### `/backend/src/models`
Modelos Sequelize que representam as tabelas do banco. Cada model define campos, validações e relacionamentos.

### `/backend/src/routes`
Endpoints da API organizados por domínio. Cada arquivo contém rotas relacionadas (GET, POST, PUT, DELETE).

### `/backend/src/services`
Lógica de negócio complexa separada dos controllers. FFmpeg, relatórios, PDF, notificações.

### `/backend/src/middleware`
Funções que interceptam requests: autenticação JWT, upload de arquivos, rate limiting.

### `/frontend/src/components`
Componentes React reutilizáveis. Layout (estrutura) e UI (elementos visuais).

### `/frontend/src/pages`
Páginas da aplicação, cada uma corresponde a uma rota.

### `/frontend/src/contexts`
React Contexts para estado global: autenticação e tema.
