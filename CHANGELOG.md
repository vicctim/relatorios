# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [2026-01-21] - Implementações de Segurança e Features

**Autor:** Victor Samuel

### Features
- **F-011:** Adicionada flag "Incluir no Relatório" (includeInReport)
  - Checkbox no formulário de upload (default: true)
  - Campo editável na página de vídeos
  - Relatórios filtram apenas vídeos com includeInReport=true
  - Versões herdam o flag do vídeo pai
  - Migration criada para adicionar coluna ao banco

### Correções de Segurança
- **F-006:** Validação de magic bytes em uploads
  - Verifica primeiros bytes do arquivo para garantir que é realmente um vídeo
  - Suporta MP4, MOV e AVI
  - Previne upload de arquivos maliciosos disfarçados como vídeo

### Correções de Integridade de Dados
- **F-008:** Validação requestDate <= completionDate
  - Backend valida que data de conclusão não é anterior à solicitação
- **F-009:** Validação customDurationSeconds >= 0
  - Impede valores negativos que quebrariam cálculos
- **F-010:** Correção do cálculo de duração no dashboard
  - Usa getCalculatedDuration() para considerar customDurationSeconds

### Melhorias de UX
- **F-014:** Validação de tamanho de arquivo no frontend
  - Erro imediato antes do upload para arquivos > 500MB
- **F-015:** Melhor cleanup de arquivos temporários
  - Remove arquivos órfãos em caso de erro durante processamento

### Melhorias na Página de Vídeos
- Versões sempre aninhadas abaixo do original (sem necessidade de clique)
- Ícones de ação com cores uniformes para melhor harmonia visual
- Ícones específicos por resolução:
  - 1080x1920 (9x16) → Smartphone
  - 1920x1080 (16x9) → TV
  - Outros formatos → Play (vídeo)

## [2026-01-20 12:32:52] - cbd9812

**Autor:** Victor Samuel

chore: configuraÃ§Ã£o inicial do projeto

- Backend Node.js + Express + TypeScript
- Frontend React + Webpack + TypeScript
- Docker configurado para desenvolvimento e produÃ§Ã£o
- Scripts de desenvolvimento otimizados para WSL
- DocumentaÃ§Ã£o completa
- Hooks Git para versionamento automÃ¡tico

## [2026-01-20 22:38:08] - 24d8ad7

**Autor:** Victor Samuel

fix: corrigir cÃ¡lculos de duraÃ§Ã£o, PDF e organizaÃ§Ã£o do projeto

- Corrigir salvamento de customDurationSeconds para versÃµes
- Usar customDurationSeconds nos cÃ¡lculos de relatÃ³rios
- Adicionar coluna Profissional no PDF
- Mostrar versÃµes abaixo do tÃ­tulo no PDF
- Arredondar duraÃ§Ãµes fracionadas na exibiÃ§Ã£o
- Trocar ordem dos cards Limite e Restante
- Mostrar x vÃ­deos + x versÃµes no preview do modal
- Corrigir parsing de datas (timezone UTC para local)
- Organizar scripts e documentaÃ§Ã£o em pastas
- Corrigir caminhos relativos nos scripts
- Suprimir erros do Watchpack no WSL
- Corrigir configuraÃ§Ã£o do Webpack (remover regex de ignored)

## [2026-01-22 22:42:16] - 7c9dd57

**Autor:** Victor Samuel

feat: implementar correÃ§Ãµes de seguranÃ§a, integridade e feature includeInReport

- F-006: ValidaÃ§Ã£o de magic bytes em uploads
- F-008: ValidaÃ§Ã£o requestDate <= completionDate
- F-009: ValidaÃ§Ã£o customDurationSeconds >= 0
- F-010: CorreÃ§Ã£o cÃ¡lculo de duraÃ§Ã£o no dashboard
- F-011: Feature flag 'Incluir no RelatÃ³rio' (includeInReport)
- F-014: ValidaÃ§Ã£o de tamanho no frontend
- F-015: Melhor cleanup de arquivos temporÃ¡rios
- Melhorias UX: versÃµes aninhadas, Ã­cones uniformes, Ã­cones por resoluÃ§Ã£o

## [2026-01-22 22:43:24] - 45207dd

**Autor:** Victor Samuel

docs: adicionar guia de deploy VPS e script de migrations automÃ¡ticas

- Criado DEPLOY_VPS.md com instruÃ§Ãµes completas
- Adicionado docker-entrypoint.sh para executar migrations opcionalmente
- Atualizado Dockerfile do backend com entrypoint
- Atualizado docker-compose.portainer.yml com variÃ¡vel RUN_MIGRATIONS

## [2026-01-22 22:43:43] - da6b628

**Autor:** Victor Samuel

docs: adicionar resumo de deploy

## [2026-01-22 22:47:58] - 23df6c8

**Autor:** Victor Samuel

ci: adicionar GitHub Actions para build e push de imagens Docker

- Workflow para build automÃ¡tico de backend e frontend
- PublicaÃ§Ã£o no GitHub Container Registry (ghcr.io)
- Suporte para tags semÃ¢nticas e builds por commit
- docker-compose.registry.yml para usar imagens prÃ©-buildadas
- DocumentaÃ§Ã£o completa de CI/CD em docs/CI_CD.md
- Atualizado DEPLOY_VPS.md com opÃ§Ã£o de usar CI/CD

## [2026-01-22 22:48:10] - f8bcf8f

**Autor:** Victor Samuel

docs: adicionar resumo rÃ¡pido de CI/CD

## [2026-01-22 22:54:10] - 53e5c48

**Autor:** Victor Samuel

fix: corrigir erros de TypeScript no build do frontend

- Adicionar parentVideosCount e versionsCount ao tipo exportPreview
- Adicionar customDurationSeconds aos tipos de upload e update
- Corrigir tipos implÃ­citos any nos DatePicker
- Remover imports nÃ£o usados em Shares.tsx
- Simplificar Upload-new.tsx (arquivo nÃ£o utilizado)

## [2026-01-22 22:58:24] - d23d4f8

**Autor:** Victor Samuel

ci: adicionar verificaÃ§Ã£o de TypeScript antes do build Docker

- Adicionar step para verificar compilaÃ§Ã£o TypeScript antes do build
- Mostrar erros de compilaÃ§Ã£o para facilitar debug

## [2026-01-22 23:07:15] - 42acfba

**Autor:** Victor Samuel

fix: corrigir tipo customDurationSeconds de null para undefined

- Alterar null para undefined para compatibilidade com tipo number | undefined

## [2026-01-22 23:17:55] - b91463f

**Autor:** Victor Samuel

fix: corrigir erros de TypeScript no backend

- Corrigir tipo do chunk em upload.ts e videos.routes.ts (aceitar string | Buffer)
- Adicionar calculatedDuration Ã  interface de versions em pdf.service.ts

## [2026-01-22 23:27:59] - 01dee66

**Autor:** Victor Samuel

fix: corrigir criaÃ§Ã£o de usuÃ¡rio no Dockerfile do backend

- Verificar se usuÃ¡rio com UID 1000 jÃ¡ existe antes de criar
- Usar UID diretamente ao invÃ©s de nome de usuÃ¡rio para evitar conflitos

## [2026-01-22 23:47:45] - 9332044

**Autor:** Victor Samuel

feat: tornar imagens Docker pÃºblicas automaticamente

- Adicionar step para tornar imagens pÃºblicas apÃ³s push
- Adicionar permissÃ£o administration:write ao workflow
- Atualizar documentaÃ§Ã£o sobre imagens pÃºblicas

## [2026-01-22 23:48:00] - dd34fde

**Autor:** Victor Samuel

fix: melhorar step para tornar imagens pÃºblicas usando curl

- Usar curl com GITHUB_TOKEN ao invÃ©s de gh CLI
- Converter nome do pacote corretamente (substituir / por -)

## [2026-01-22 23:48:14] - 35205d9

**Autor:** Victor Samuel

fix: ajustar endpoint da API para tornar imagens pÃºblicas

- Tentar endpoint de usuÃ¡rio primeiro, depois organizaÃ§Ã£o
- Usar nome correto do pacote (relatorios-backend/frontend)
- Adicionar fallback com instruÃ§Ãµes manuais

## [2026-01-22 23:48:26] - bf4364a

**Autor:** Victor Samuel

docs: adicionar guia para tornar imagens pÃºblicas manualmente

## [2026-01-22 23:49:25] - a1fad19

**Autor:** Victor Samuel

fix: remover permissÃ£o administration:write invÃ¡lida

- A permissÃ£o administration nÃ£o Ã© vÃ¡lida no contexto de workflows
- packages:write jÃ¡ Ã© suficiente para gerenciar pacotes

## [2026-01-22 23:52:29] - f9b5b91

**Autor:** Victor Samuel

docs: adicionar guia rÃ¡pido sobre qual arquivo usar no deploy

## [2026-01-22 23:58:55] - c11f8af

**Autor:** Victor Samuel

feat: criar docker-compose.yml baseado no modelo do usuÃ¡rio

- Usar formato similar Ã  stack de referÃªncia
- Usar rede_publica ao invÃ©s de npm_default
- Adicionar limites de recursos (cpus, mem_limit)
- Usar restart: unless-stopped
- Usar user: 0:0 no backend
- Volumes locais para uploads
- Corrigir VITE_API_URL no .env.example

## [2026-01-23 00:21:08] - 586f567

**Autor:** Victor Samuel

fix: adicionar .sequelizerc e copiar arquivos de config no Dockerfile

- Criar .sequelizerc para configurar caminhos do Sequelize CLI
- Copiar config, migrations e .sequelizerc no stage de produÃ§Ã£o
- Corrigir erro 'Cannot find /app/config/config.json'

## [2026-01-23 00:21:21] - 3271da6

**Autor:** Victor Samuel

fix: adicionar valores padrÃ£o no config.js para produÃ§Ã£o

- Garantir que Sequelize CLI funcione mesmo sem todas as variÃ¡veis
- Valores padrÃ£o para evitar erros de configuraÃ§Ã£o

## [2026-01-23 00:34:21] - 4d701d0

**Autor:** Victor Samuel

fix: corrigir migration share_links para criar tabela se nÃ£o existir

- Verificar se tabela existe antes de modificar
- Criar tabela share_links e share_link_videos se nÃ£o existirem
- Adicionar coluna custom_slug apenas se tabela jÃ¡ existir e coluna nÃ£o existir
- Melhorar tratamento de erros

## [2026-01-23 07:48:46] - 9a58cdf

**Autor:** Victor Samuel

docs: adicionar guia de troubleshooting para deploy VPS

## [2026-01-23 08:02:52] - 2d7504a

**Autor:** Victor Samuel

fix: corrigir healthcheck do frontend

- Alterar --quiet para --no-verbose (compatibilidade)
- Aumentar start_period para 10s (dar mais tempo para nginx iniciar)
- Aplicar correÃ§Ã£o em todos os arquivos docker-compose

## [2026-01-23 08:03:07] - d367ebf

**Autor:** Victor Samuel

fix: usar curl ao invÃ©s de wget no healthcheck do frontend

- curl Ã© mais confiÃ¡vel e sempre disponÃ­vel no nginx:alpine
- Simplificar comando do healthcheck

## [2026-01-23 08:03:35] - 8b03070

**Autor:** Victor Samuel

docs: adicionar guia de configuraÃ§Ã£o do Nginx Proxy Manager

## [2026-01-23 08:07:52] - 26a189c

**Autor:** Victor Samuel

fix: remover react-refresh do build de produÃ§Ã£o

- Configurar .babelrc para usar react-refresh apenas em development
- Adicionar envName ao babel-loader para garantir modo correto
- Definir NODE_ENV=production explicitamente no Dockerfile
- Corrigir erro '$ is not defined' em produÃ§Ã£o

## [2026-01-23 08:23:36] - a3bdcc1

**Autor:** Victor Samuel

fix: melhorar tratamento de erros no Login e adicionar guia NPM

- Adicionar verificaÃ§Ã£o segura de settings no Login.tsx
- Criar guia passo a passo detalhado para configurar NPM
- Prevenir erro quando settings retornar formato inesperado

## [2026-01-23 08:27:02] - bde2303

**Autor:** Victor Samuel

feat: adicionar favicon para remover erro 404

- Criar favicon.svg simples com logo 'P' verde
- Atualizar Dockerfile para copiar favicon da pasta public
- Resolver erro 404 do favicon no console

## [2026-01-23 08:28:40] - 80d8526

**Autor:** Victor Samuel

fix: corrigir cÃ¡lculo de rollover para nÃ£o triplicar limite

- Adicionar verificaÃ§Ã£o se mÃªs anterior tem vÃ­deos antes de calcular rollover
- SÃ³ calcular rollover de meses que realmente tiveram vÃ­deos
- Prevenir triplicaÃ§Ã£o do limite quando nÃ£o hÃ¡ dados histÃ³ricos
- Resolver problema de limite mensal mostrando 3300s ao invÃ©s de 1100s

## [2026-01-23 08:30:40] - bbd1326

**Autor:** Victor Samuel

feat: adicionar campo manual de segundos acumulados na exportaÃ§Ã£o

- Adicionar campo opcional para informar segundos acumulados manualmente
- Atualizar API para aceitar manualRollover como parÃ¢metro
- Calcular limite com rollover manual quando fornecido
- Exibir limite, rollover e restante no PDF gerado
- Permitir sobrescrever cÃ¡lculo automÃ¡tico de rollover

## [2026-01-23 09:01:00] - e786f0c

**Autor:** Victor Samuel

fix: corrigir cÃ³pia condicional do favicon no Dockerfile

- Usar RUN com mount para copiar favicon condicionalmente
- Resolver erro de build quando favicon nÃ£o existe
- Usar BuildKit mount para acessar arquivo do builder stage

## [2026-01-23 09:20:12] - 275c177

**Autor:** Victor Samuel

fix: garantir que baseLimit nÃ£o seja undefined no cÃ¡lculo de limite

- Usar operador nullish coalescing (??) para garantir valor padrÃ£o
- Resolver erro TypeScript TS18048
- Garantir que baseLimit sempre tenha um valor numÃ©rico

## [2026-01-23 09:55:17] - eb411e7

**Autor:** Victor Samuel

fix: melhorar tratamento de erros e seguranÃ§a na geraÃ§Ã£o de PDF

- Adicionar logs detalhados de erro para debug
- Adicionar verificaÃ§Ãµes de seguranÃ§a para arrays undefined
- Proteger acesso a video.versions e calculatedDuration
- Melhorar mensagens de erro em desenvolvimento

## [2026-01-23 09:56:22] - 8fda4d9

**Autor:** Victor Samuel

fix: adicionar verificaÃ§Ãµes de seguranÃ§a para arrays no PDF date range

- Proteger acesso a video.versions quando undefined
- Adicionar fallbacks para calculatedDuration
- Prevenir erros quando arrays estÃ£o vazios ou undefined

## [2026-01-23 10:12:51] - ed00196

**Autor:** Victor Samuel

fix: usar caminho correto do Chromium no Puppeteer

- Usar variÃ¡vel de ambiente PUPPETEER_EXECUTABLE_PATH
- Fallback para /usr/bin/chromium (instalado no Dockerfile)
- Corrigir caminho incorreto /usr/bin/google-chrome-stable
- Resolver erro de geraÃ§Ã£o de PDF

## [2026-01-23 10:14:11] - 5a54b2f

**Autor:** Victor Samuel

fix: adicionar variÃ¡veis Puppeteer nos docker-compose files

- Adicionar PUPPETEER_EXECUTABLE_PATH e PUPPETEER_SKIP_CHROMIUM_DOWNLOAD
- Garantir que variÃ¡veis sejam passadas para o container
- Criar guia de rebuild do backend
- Resolver problema de caminho do Chromium

## [2026-01-23 10:18:48] - 197fc6c

**Autor:** Victor Samuel

feat: configurar domÃ­nio customizado para links de compartilhamento

- Adicionar funÃ§Ã£o getShareUrl() para gerar URLs de compartilhamento
- Usar variÃ¡vel de ambiente VITE_SHARE_URL (padrÃ£o: arquivos.pixfilmes.com)
- Atualizar ShareModal e Shares para usar novo domÃ­nio
- Adicionar DefinePlugin no webpack para injetar variÃ¡vel
- Atualizar Dockerfile para aceitar VITE_SHARE_URL como build arg

## [2026-01-23 10:18:57] - 44cdc3b

**Autor:** Victor Samuel

fix: adicionar VITE_SHARE_URL como build arg no docker-compose.portainer.yml

## [2026-01-23 10:19:24] - c07f6b8

**Autor:** Victor Samuel

docs: adicionar guia de configuraÃ§Ã£o do domÃ­nio de compartilhamento

- Documentar configuraÃ§Ã£o do NPM para arquivos.pixfilmes.com
- InstruÃ§Ãµes de rebuild do frontend
- Troubleshooting comum

## [2026-01-23 10:20:27] - a36b54e

**Autor:** Victor Samuel

fix: corrigir uso de variÃ¡vel de ambiente - remover VITE_ prefix

- Projeto usa Webpack, nÃ£o Vite
- Mudar de VITE_SHARE_URL para SHARE_URL
- Atualizar DefinePlugin para process.env.SHARE_URL
- Atualizar documentaÃ§Ã£o

## [2026-01-23 10:44:36] - 4545286

**Autor:** Victor Samuel

fix: adicionar SHARE_URL como build arg no CI/CD

- Passar variÃ¡vel SHARE_URL para o build do frontend
- Usar GitHub Variables para configuraÃ§Ã£o

## [2026-01-23 11:33:15] - 13403da

**Autor:** Victor Samuel

docs: adicionar guia de rebuild do frontend para SHARE_URL

- InstruÃ§Ãµes para atualizar container do frontend
- VerificaÃ§Ã£o se variÃ¡vel foi injetada
- Troubleshooting comum

## [2026-01-23 12:03:05] - 77e9b55

**Autor:** Victor Samuel

fix: corrigir relatÃ³rio PDF - rollover, formataÃ§Ã£o e links

- Corrigir cÃ¡lculo de rollover: subtrair do total utilizado
- Mostrar tudo em segundos no relatÃ³rio (nÃ£o converter para min/s)
- Remover cards de Limite e Restante, manter apenas Total Utilizado e Total de VÃ­deos
- Adicionar links de reproduÃ§Ã£o para cada vÃ­deo no relatÃ³rio
- Melhorar funÃ§Ã£o getShareUrl com fallback e debug

## [2026-01-23 12:04:33] - 163d99f

**Autor:** Victor Samuel

fix: atualizar relatÃ³rio mensal com mesmas melhorias

- Aplicar formataÃ§Ã£o em segundos no relatÃ³rio mensal
- Remover cards de Limite e Restante no relatÃ³rio mensal
- Adicionar links de reproduÃ§Ã£o no relatÃ³rio mensal
- Incluir frontendUrl nos dados do PDF mensal

## [2026-01-23 12:28:41] - c1bf94f

**Autor:** Victor Samuel

feat: adicionar reproduÃ§Ã£o e thumbnails para links pÃºblicos

- Criar rotas pÃºblicas /api/shares/:token/thumbnail/:videoId e /api/shares/:token/stream/:videoId
- Adicionar botÃ£o de reproduÃ§Ã£o na pÃ¡gina PublicShare
- Adicionar modal de player de vÃ­deo para links pÃºblicos
- Thumbnails agora funcionam sem autenticaÃ§Ã£o usando token do share
- VÃ­deos podem ser reproduzidos diretamente na pÃ¡gina pÃºblica

## [2026-01-23 12:29:02] - 779459e

**Autor:** Victor Samuel

fix: melhorar getShareUrl com fallback inteligente e debug

- Adicionar fallback que detecta relatorio.pixfilmes.com e substitui por arquivos.pixfilmes.com
- Adicionar debug detalhado para identificar problema de URL
- Garantir que sempre use arquivos.pixfilmes.com como padrÃ£o

## [2026-01-23 12:29:25] - 1ddb10d

**Autor:** Victor Samuel

fix: mover funÃ§Ã£o validateShareToken para antes das rotas

- Mover funÃ§Ã£o helper para o topo do arquivo
- Garantir que estÃ¡ disponÃ­vel antes de ser usada

## [2026-01-23 12:32:13] - 33206ef

**Autor:** Victor Samuel

feat: abrir modal automaticamente via URL e melhorar link no PDF

- Adicionar rota /videos/:id que abre modal automaticamente
- Detectar videoId na URL e abrir modal ao carregar pÃ¡gina
- Limpar URL quando modal fechar
- Tornar link no PDF mais discreto com Ã­cone SVG de play
- Reduzir largura da coluna AÃ§Ãµes de 25% para 10%
- Mudar texto de 'Reproduzir' para 'Ver' com Ã­cone menor

## [2026-01-23 12:32:25] - 4562c98

**Autor:** Victor Samuel

fix: adicionar imports faltantes useNavigate e useParams

## [2026-01-23 12:43:32] - 3bff938

**Autor:** Victor Samuel

fix: remover funÃ§Ã£o validateShareToken duplicada

- Remover segunda definiÃ§Ã£o da funÃ§Ã£o que estava causando erro de compilaÃ§Ã£o TypeScript

## [2026-01-23 13:04:39] - 2a3546c

**Autor:** Victor Samuel

fix: evitar colisÃ£o de custom_slug em compartilhamentos

- Gerar slug Ãºnico considerando registros ativos e inativos\n- Retry leve para evitar conflito de UNIQUE em condiÃ§Ã£o de corrida

## [2026-01-23 13:22:12] - d67a02e

**Autor:** Victor Samuel

feat: manter proporÃ§Ã£o correta do vÃ­deo no player

- Criar funÃ§Ã£o getVideoAspectRatioStyle para calcular aspect ratio dinÃ¢mico\n- Suportar proporÃ§Ãµes 9:16, 1:1, 4:3, 3:4\n- Aplicar aspect ratio correto nos players de PublicShare, Videos e Shares\n- Adicionar widthPixels e heightPixels na resposta da API de compartilhamento\n- Usar object-contain para manter proporÃ§Ã£o sem distorÃ§Ã£o

