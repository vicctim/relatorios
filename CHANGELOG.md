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

