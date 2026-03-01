# 🔍 Análise Completa do Código - Sistema de Relatórios Pix Filmes

**Data:** 2026-01-21  
**Modo:** PLAN (Correções F-006, F-008, F-009, F-010, F-011, F-014, F-015 implementadas)  
**Ambiente:** Windows + WSL 2, Docker Desktop, MySQL 8.0

---

## A) MAPA DO REPOSITÓRIO

### Stack Tecnológico
- **Backend:** Node.js 20 + Express + TypeScript + Sequelize (MySQL)
- **Frontend:** React 18 + TypeScript + Webpack 5 + Tailwind CSS
- **Database:** MySQL 8.0 (Docker container)
- **Autenticação:** JWT
- **Upload/Processamento:** Multer + FFmpeg
- **Relatórios:** PDF via Puppeteer

### Módulos Principais

#### Backend (`backend/src/`)
- **Models:** Video, User, Professional, ShareLink, ExportedReport, Setting
- **Routes:** auth, videos, reports, professionals, users, share, settings, logs, notifications
- **Services:** 
  - `report.service.ts` - Lógica de relatórios mensais/por período
  - `ffmpeg.service.ts` - Processamento de vídeo (análise, compressão, thumbnails)
  - `pdf.service.ts` - Geração de PDFs
  - `notification.service.ts` - Notificações (email/WhatsApp)
- **Middleware:** auth (JWT), upload (Multer)

#### Frontend (`frontend/src/`)
- **Pages:** Upload, Videos, Reports, Dashboard, Login, Shares, PublicShare, Admin (Users, Professionals, Settings)
- **Components:** Layout (Header, Sidebar, MainLayout), ShareModal, UI (Modal, DateInput, LoadingSpinner)
- **Contexts:** AuthContext, ThemeContext
- **Services:** api.ts (Axios client)

### Pipeline de Upload
1. **Frontend:** `Upload.tsx` → Dropzone → Formulário de metadados
2. **API:** `POST /api/videos` → `uploadVideo.single('video')` → `ffmpegService.processUploadedVideo()`
3. **Processamento:** Análise de metadados → Compressão (se necessário) → Geração de thumbnail
4. **Persistência:** `Video.create()` → Notificações em background

### Pipeline de Relatórios
1. **Frontend:** `Reports.tsx` → Seleção de mês/ano ou período
2. **API:** `GET /api/reports/:year/:month` → `reportService.getMonthlyReport()`
3. **Cálculo:** 
   - Busca vídeos pais (`parentId: null`) no período
   - Inclui versões (`parentId !== null`)
   - Calcula duração: `customDurationSeconds` ou padrão (100% pai, 50% versão)
   - Filtra apenas vídeos com `includeInReport = true`
4. **Agregação:** Por profissional → Totais → PDF (opcional)

---

## B) LISTA DE FINDINGS

### F-001: JWT_SECRET com Valor Padrão Inseguro
**Severidade:** 🔴 **CRITICAL**  
**Categoria:** Security  
**Localização:** `backend/src/middleware/auth.ts:35,62`  
**Sintoma:** Se `JWT_SECRET` não estiver definido, usa `'default-secret'`, permitindo forjar tokens  
**Causa Raiz:** Fallback inseguro para facilitar desenvolvimento  
**Abordagem de Correção:** Remover fallback, validar na inicialização, lançar erro se ausente  
**Teste:** Verificar que app não inicia sem `JWT_SECRET` definido

---

### F-002: Credenciais Hardcoded no Código
**Severidade:** 🔴 **CRITICAL**  
**Categoria:** Security  
**Localização:** 
- `backend/src/config/database.ts:12` (`'relatorios123'`)
- `backend/src/middleware/auth.ts:35,62` (`'default-secret'`)
- `docker-compose.yml:11,14` (`'root123'`, `'relatorios123'`)
- Múltiplos scripts e docs  
**Sintoma:** Senhas expostas no código fonte, risco de acesso não autorizado ao DB  
**Causa Raiz:** Conveniência de desenvolvimento sem remoção posterior  
**Abordagem de Correção:** Remover todos os fallbacks, exigir variáveis de ambiente obrigatórias, validar na inicialização  
**Teste:** Verificar que app não inicia sem credenciais definidas

---

### F-003: Path Traversal em Uploads/Downloads
**Severidade:** 🔴 **CRITICAL**  
**Categoria:** Security  
**Localização:** 
- `backend/src/routes/videos.routes.ts:440-443,491-493,533-535,589-591`
- `backend/src/routes/share.routes.ts` (downloads)  
**Sintoma:** Caminhos de arquivo construídos sem validação adequada, risco de acesso a arquivos fora do diretório permitido  
**Código Problemático:**
```typescript
const filePath = path.isAbsolute(video.filePath)
  ? video.filePath
  : path.join(process.cwd(), video.filePath);
```
**Causa Raiz:** Falta de validação de `..` e normalização de caminhos  
**Abordagem de Correção:** Validar que caminho final está dentro do diretório permitido, normalizar com `path.resolve` e verificar prefixo  
**Teste:** Tentar acessar `../../../etc/passwd` via `filePath` manipulado

---

### F-004: Token JWT Aceito via Query String
**Severidade:** 🟡 **HIGH**  
**Categoria:** Security  
**Localização:** `backend/src/middleware/auth.ts:28`  
**Sintoma:** Tokens podem aparecer em logs, histórico do navegador, referrers  
**Código Problemático:**
```typescript
const token = (authHeader && authHeader.split(' ')[1]) || (req.query.token as string);
```
**Causa Raiz:** Conveniência para streaming/download sem autenticação adequada  
**Abordagem de Correção:** Remover suporte a query string, usar apenas Authorization header; para streaming, implementar signed URLs temporárias  
**Teste:** Verificar que token via `?token=xxx` não funciona mais

---

### F-005: Rate Limiting Desabilitado em Desenvolvimento
**Severidade:** 🟡 **MEDIUM**  
**Categoria:** Security  
**Localização:** `backend/src/app.ts:28`  
**Sintoma:** Se `NODE_ENV` não estiver configurado corretamente em produção, rate limiting pode estar desabilitado  
**Código Problemático:**
```typescript
skip: () => isDev, // Skip rate limiting entirely in development
```
**Causa Raiz:** Conveniência de desenvolvimento  
**Abordagem de Correção:** Manter rate limiting sempre ativo, usar `max` condicional (1000 dev, 100 prod) ao invés de `skip`  
**Teste:** Verificar que rate limiting funciona mesmo em dev (com limite alto)

---

### F-007: CORS Configurado de Forma Permissiva
**Severidade:** 🟡 **MEDIUM**  
**Categoria:** Security  
**Localização:** `backend/src/app.ts:17-20`  
**Sintoma:** Se `FRONTEND_URL` não estiver definido, permite qualquer origem  
**Código Problemático:**
```typescript
origin: process.env.FRONTEND_URL || 'http://localhost:3000',
```
**Causa Raiz:** Fallback para desenvolvimento  
**Abordagem de Correção:** Exigir `FRONTEND_URL` em produção, validar contra whitelist  
**Teste:** Verificar que requisições de origem não autorizada são bloqueadas

---

### F-012: Exposição de Informações Sensíveis em Logs
**Severidade:** 🟡 **MEDIUM**  
**Categoria:** Security  
**Localização:** Múltiplos arquivos com `console.error()`  
**Sintoma:** Tokens, senhas, caminhos completos podem aparecer em logs  
**Causa Raiz:** Logging sem sanitização  
**Abordagem de Correção:** Sanitizar logs, não logar dados sensíveis, usar biblioteca de logging estruturado  
**Teste:** Verificar logs após erro de autenticação (não deve mostrar token)

---

### F-013: XSS Potencial em PDF Service
**Severidade:** 🟡 **MEDIUM**  
**Categoria:** Security  
**Localização:** `backend/src/services/pdf.service.ts` (interpolação direta de dados do usuário em HTML)  
**Sintoma:** Se dados como `video.title` contiverem HTML malicioso, pode ser executado no contexto do PDF  
**Causa Raiz:** Dados inseridos sem escape no HTML do PDF  
**Abordagem de Correção:** Escapar HTML de todos os dados do usuário antes de inserir no template  
**Teste:** Criar vídeo com título contendo `<script>alert('XSS')</script>` → verificar que não executa

---

## C) QUICK WINS VS RISKY FIXES

### ✅ Quick Wins (Baixo Risco, Alto Impacto)
- **F-001, F-002:** Remover fallbacks de credenciais (segurança crítica, mudança simples)

### ⚠️ Risky Fixes (Requerem Testes Extensivos)
- **F-003:** Path traversal (pode quebrar downloads legítimos se validação for muito restritiva)
- **F-004:** Remover token via query string (pode quebrar streaming/download se não implementar signed URLs)
- **F-005:** Rate limiting sempre ativo (pode afetar desenvolvimento se limite for muito baixo)

### 🔧 Medium Risk (Requerem Cuidado)
- **F-007:** CORS mais restritivo (pode quebrar frontend se URL não estiver correta)
- **F-012:** Sanitização de logs (pode dificultar debug se sanitização for muito agressiva)
- **F-013:** Escape de HTML no PDF (pode quebrar formatação se escape for incorreto)

---

## D) MENU DE ESCOLHA DE CORREÇÕES

Selecione os números das correções que deseja implementar (ex: "1,2,5,11"):

1. **F-001** (Critical) — Remover fallback de JWT_SECRET
2. **F-002** (Critical) — Remover credenciais hardcoded
3. **F-003** (Critical) — Corrigir path traversal
4. **F-004** (High) — Remover token JWT via query string
5. **F-005** (Medium) — Rate limiting sempre ativo
6. **F-007** (Medium) — CORS mais restritivo
7. **F-012** (Medium) — Sanitizar logs
8. **F-013** (Medium) — Escape HTML no PDF

**Indique também:**
- [ ] Apenas correções "safe" (quick wins)
- [ ] Incluir correções "risky" também
- [ ] Apenas a feature F-011 + correções críticas de segurança

---

**Aguardando sua seleção para prosseguir com a implementação...**
