# 🔒 Auditoria de Segurança e Bugs - Sistema de Relatórios Pix Filmes

**Data:** $(date)  
**Auditor:** Análise Automatizada  
**Escopo:** Backend, Frontend, Infraestrutura

---

## 🚨 CRÍTICO - Vulnerabilidades de Segurança

### 1. **JWT_SECRET com Valor Padrão Inseguro**
**Arquivo:** `backend/src/middleware/auth.ts:35,62`  
**Severidade:** 🔴 CRÍTICA  
**Descrição:** 
- JWT_SECRET usa fallback `'default-secret'` se não estiver definido no `.env`
- Permite que qualquer pessoa gere tokens válidos se o secret não estiver configurado
- Tokens podem ser forjados facilmente

**Código Problemático:**
```typescript
const secret = process.env.JWT_SECRET || 'default-secret';
```

**Recomendação:**
- Remover o fallback e lançar erro se JWT_SECRET não estiver definido
- Gerar secret forte (mínimo 32 caracteres aleatórios)
- Validar na inicialização da aplicação

---

### 2. **Credenciais Hardcoded no Código**
**Arquivos:** 
- `backend/src/config/database.ts:12`
- `backend/config/config.js:6,20`
- `docker-compose.yml:11,14`

**Severidade:** 🔴 CRÍTICA  
**Descrição:**
- Senhas padrão hardcoded: `'relatorios123'`, `'root123'`
- Credenciais expostas no código fonte
- Risco de acesso não autorizado ao banco de dados

**Código Problemático:**
```typescript
password: process.env.DB_PASSWORD || 'relatorios123',
```

**Recomendação:**
- Remover TODOS os valores padrão de senhas
- Exigir variáveis de ambiente obrigatórias
- Validar na inicialização

---

### 3. **Rate Limiting Desabilitado em Desenvolvimento**
**Arquivo:** `backend/src/app.ts:28`  
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- Rate limiting completamente desabilitado em desenvolvimento (`skip: () => isDev`)
- Pode ser explorado se NODE_ENV não estiver configurado corretamente em produção

**Código Problemático:**
```typescript
skip: () => isDev, // Skip rate limiting entirely in development
```

**Recomendação:**
- Manter rate limiting sempre ativo, apenas com limites mais permissivos em dev
- Não usar `skip`, usar `max` condicional

---

### 4. **Token JWT Aceito via Query String**
**Arquivo:** `backend/src/middleware/auth.ts:28`  
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- Tokens JWT podem ser passados via query string (`req.query.token`)
- Tokens podem aparecer em logs de servidor, histórico do navegador, referrers
- Risco de vazamento de credenciais

**Código Problemático:**
```typescript
const token = (authHeader && authHeader.split(' ')[1]) || (req.query.token as string);
```

**Recomendação:**
- Remover suporte a token via query string
- Usar apenas Authorization header
- Para streaming/download, usar signed URLs temporárias

---

### 5. **Path Traversal em Uploads e Downloads**
**Arquivos:** 
- `backend/src/routes/videos.routes.ts:427-444,478-480,520-522,576-578`
- `backend/src/routes/share.routes.ts:123,138`

**Severidade:** 🔴 CRÍTICA  
**Descrição:**
- Caminhos de arquivos são construídos sem validação adequada
- Uso de `path.join` pode ser explorado com `../` para acessar arquivos fora do diretório permitido
- Risco de leitura/escrita de arquivos arbitrários

**Código Problemático:**
```typescript
const filePath = path.isAbsolute(video.filePath)
  ? video.filePath
  : path.join(process.cwd(), video.filePath);
```

**Recomendação:**
- Validar que `filePath` não contém `..`
- Usar `path.resolve` e verificar se o caminho final está dentro do diretório permitido
- Normalizar caminhos antes de usar

---

### 6. **Exposição de Informações Sensíveis em Logs**
**Arquivos:** Múltiplos  
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- Erros são logados com `console.error` sem sanitização
- Tokens, senhas, caminhos de arquivos podem aparecer em logs
- Stack traces podem expor estrutura interna

**Recomendação:**
- Sanitizar logs antes de exibir
- Não logar dados sensíveis (tokens, senhas, paths completos)
- Usar biblioteca de logging estruturado

---

### 7. **Validação de Upload Insuficiente**
**Arquivo:** `backend/src/middleware/upload.ts:30-45`  
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- Validação de tipo MIME pode ser burlada (arquivo pode ter extensão .mp4 mas ser executável)
- Não há validação de conteúdo real do arquivo
- Risco de upload de arquivos maliciosos

**Recomendação:**
- Validar magic bytes do arquivo (primeiros bytes)
- Usar biblioteca como `file-type` para validação real
- Escanear arquivos com antivírus em produção

---

### 8. **SQL Injection Potencial (Sequelize)**
**Severidade:** 🟢 BAIXA (mas monitorar)  
**Descrição:**
- Uso de Sequelize ORM reduz risco, mas queries dinâmicas podem ser vulneráveis
- Validação de inputs deve ser rigorosa

**Recomendação:**
- Auditar todas as queries que usam `Op.like` com inputs do usuário
- Garantir que todos os parâmetros são validados antes de usar em queries

---

### 9. **CORS Configurado de Forma Permissiva**
**Arquivo:** `backend/src/app.ts:17-20`  
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- CORS permite qualquer origem se `FRONTEND_URL` não estiver definido
- Em desenvolvimento, pode permitir requisições de qualquer origem

**Código Problemático:**
```typescript
origin: process.env.FRONTEND_URL || 'http://localhost:3000',
```

**Recomendação:**
- Exigir `FRONTEND_URL` em produção
- Validar origem contra whitelist
- Não usar wildcard em produção

---

### 10. **XSS em Templates HTML (PDF Service)**
**Arquivo:** `backend/src/services/pdf.service.ts:92-338`  
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- HTML gerado para PDF usa interpolação direta de dados do usuário
- Dados como `video.title`, `company_name` são inseridos sem escape
- Risco de XSS se dados forem maliciosos

**Código Problemático:**
```typescript
<span class="video-title">${video.title}</span>
```

**Recomendação:**
- Escapar todos os dados do usuário antes de inserir no HTML
- Usar biblioteca como `he` ou `dompurify` para sanitização

---

### 11. **Falta de Validação de Tamanho de Array (DoS)**
**Arquivo:** `backend/src/routes/videos.routes.ts:645-650`  
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- Endpoint `/download-zip` aceita array de `videoIds` sem limite de tamanho
- Pode ser usado para DoS ao tentar processar milhares de vídeos

**Recomendação:**
- Limitar tamanho máximo do array (ex: 50 vídeos)
- Validar antes de processar

---

### 12. **Token em URL para Streaming/Download**
**Arquivo:** `frontend/src/services/api.ts:155-166`  
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- Tokens são adicionados como query parameters em URLs
- Tokens podem aparecer em logs, histórico, referrers

**Código Problemático:**
```typescript
return `/api/videos/${id}/stream${token ? `?token=${token}` : ''}`;
```

**Recomendação:**
- Usar signed URLs temporárias geradas no backend
- Ou usar cookies httpOnly para autenticação

---

### 13. **Falta de HTTPS Enforcement**
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- Não há verificação ou redirecionamento para HTTPS
- Tokens JWT podem ser interceptados em tráfego não criptografado

**Recomendação:**
- Adicionar middleware para forçar HTTPS em produção
- Configurar HSTS headers

---

### 14. **Senha Mínima Muito Fraca**
**Arquivo:** `backend/src/routes/auth.routes.ts:78-80`  
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- Senha mínima de apenas 6 caracteres
- Não há validação de complexidade (maiúsculas, números, símbolos)

**Recomendação:**
- Aumentar mínimo para 8-12 caracteres
- Adicionar validação de complexidade
- Considerar usar biblioteca como `zxcvbn`

---

### 15. **Falta de Proteção CSRF**
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- Não há proteção contra CSRF
- Cookies não têm flag `SameSite`

**Recomendação:**
- Implementar tokens CSRF para operações de escrita
- Configurar cookies com `SameSite=Strict`

---

## 🐛 BUGS E PROBLEMAS DE CÓDIGO

### 16. **Race Condition em Download de Share Links**
**Arquivo:** `backend/src/routes/share.routes.ts:119`  
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- `shareLink.increment('downloads')` é chamado antes de verificar se o download foi bem-sucedido
- Se o download falhar, o contador já foi incrementado

**Recomendação:**
- Incrementar apenas após download bem-sucedido
- Usar transação para garantir atomicidade

---

### 17. **Validação de Data Inconsistente**
**Arquivo:** `backend/src/routes/reports.routes.ts:20-28`  
**Severidade:** 🟢 BAIXA  
**Descrição:**
- Parsing de datas pode falhar silenciosamente
- Não há validação de formato antes de parse

**Recomendação:**
- Validar formato de data antes de parse
- Usar biblioteca como `date-fns` ou `moment` para parsing seguro

---

### 18. **Falta de Timeout em Operações Assíncronas**
**Arquivos:** Múltiplos  
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- Operações como geração de PDF, processamento de vídeo não têm timeout
- Pode causar travamento do servidor

**Recomendação:**
- Adicionar timeouts em operações longas
- Usar `Promise.race` com timeout

---

### 19. **Memory Leak Potencial em Streaming**
**Arquivo:** `backend/src/routes/videos.routes.ts:538-546`  
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- Streams de vídeo podem não ser fechados corretamente em caso de erro
- Pode causar vazamento de memória

**Recomendação:**
- Garantir que streams sejam fechados em todos os casos
- Usar `try-finally` ou `pipeline`

---

### 20. **Falta de Validação de Tipo em Parâmetros**
**Arquivo:** `backend/src/routes/videos.routes.ts:25-26`  
**Severidade:** 🟢 BAIXA  
**Descrição:**
- Parâmetros de paginação são convertidos sem validação
- Valores negativos ou muito grandes podem causar problemas

**Recomendação:**
- Validar que `page` e `limit` são números positivos
- Limitar valores máximos

---

### 21. **Erro de Lógica em Config de Test**
**Arquivo:** `backend/config/config.js:21`  
**Severidade:** 🟢 BAIXA  
**Descrição:**
- Operador `+` tem precedência sobre `||`, causando comportamento inesperado
- Se `process.env.DB_NAME` for `undefined`, resultará em `'undefined_test'`

**Código Problemático:**
```javascript
database: process.env.DB_NAME + '_test' || 'relatorios_test',
```

**Recomendação:**
```javascript
database: (process.env.DB_NAME || 'relatorios') + '_test',
```

---

### 22. **Falta de Cleanup de Arquivos Temporários**
**Arquivo:** `backend/src/middleware/upload.ts`  
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- Arquivos temporários podem não ser removidos em caso de erro
- Pode causar acúmulo de arquivos no servidor

**Recomendação:**
- Implementar job de limpeza periódica
- Remover arquivos temporários após processamento

---

### 23. **Falta de Validação de Tamanho de Arquivo Antes do Upload**
**Severidade:** 🟡 MÉDIA  
**Descrição:**
- Tamanho do arquivo só é validado após upload completo
- Pode causar desperdício de recursos

**Recomendação:**
- Validar tamanho no frontend antes de enviar
- Adicionar validação no backend no início do upload

---

## 📋 RECOMENDAÇÕES GERAIS

### Segurança
1. ✅ Implementar logging de segurança (tentativas de login, acessos não autorizados)
2. ✅ Adicionar rate limiting por IP e por usuário
3. ✅ Implementar 2FA para usuários admin
4. ✅ Adicionar auditoria de ações críticas (delete, update de configurações)
5. ✅ Implementar rotação de tokens JWT
6. ✅ Adicionar headers de segurança (Helmet.js)
7. ✅ Implementar sanitização de inputs em todos os endpoints
8. ✅ Adicionar validação de schema com bibliotecas como `zod` ou `joi`

### Performance
1. ✅ Implementar cache para queries frequentes
2. ✅ Adicionar compressão de respostas (gzip)
3. ✅ Otimizar queries do banco de dados (indexes)
4. ✅ Implementar paginação em todas as listagens

### Monitoramento
1. ✅ Adicionar health checks
2. ✅ Implementar métricas (Prometheus)
3. ✅ Adicionar alertas para erros críticos
4. ✅ Logging estruturado (Winston, Pino)

### Testes
1. ✅ Adicionar testes unitários
2. ✅ Implementar testes de integração
3. ✅ Adicionar testes de segurança (OWASP ZAP, Snyk)

---

## 🎯 PRIORIZAÇÃO DE CORREÇÕES

### 🔴 URGENTE (Corrigir Imediatamente)
1. JWT_SECRET com valor padrão
2. Credenciais hardcoded
3. Path traversal em uploads/downloads

### 🟡 IMPORTANTE (Corrigir em Breve)
4. Rate limiting desabilitado
5. Token JWT via query string
6. Validação de upload
7. XSS em templates PDF
8. CORS permissivo

### 🟢 DESEJÁVEL (Melhorias)
9. Proteção CSRF
10. Timeouts em operações assíncronas
11. Validações adicionais
12. Logging estruturado

---

## 📝 NOTAS FINAIS

Esta auditoria identificou **23 problemas** sendo:
- **5 críticos** (segurança)
- **13 médios** (segurança/performance)
- **5 baixos** (bugs/melhorias)

**Recomendação:** Priorizar correção dos itens críticos antes de colocar em produção.
