# Modelos de Dados

## Diagrama ER

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│    User      │     │      Video       │     │ Professional │
├──────────────┤     ├──────────────────┤     ├──────────────┤
│ id           │     │ id               │     │ id           │
│ name         │     │ title            │     │ name         │
│ email        │     │ filename         │     │ active       │
│ password     │     │ originalFilename │     │ createdAt    │
│ role         │     │ path             │     │ updatedAt    │
│ active       │     │ mimeType         │     └──────────────┘
│ createdAt    │     │ size             │            │
│ updatedAt    │     │ durationSeconds  │            │
└──────────────┘     │ resolutionWidth  │            │
                     │ resolutionHeight │            │
                     │ resolutionLabel  │            │
                     │ professionalId   │────────────┘
                     │ parentId         │───┐ (auto-referência)
                     │ requestDate      │   │
                     │ completionDate   │   │
                     │ isTv             │   │
                     │ tvTitle          │   │
                     │ createdAt        │◀──┘
                     │ updatedAt        │
                     └──────────────────┘
                            │
                            │
                     ┌──────────────────┐
                     │   DownloadLog    │
                     ├──────────────────┤
                     │ id               │
                     │ videoId          │
                     │ userId           │
                     │ downloadedAt     │
                     │ ipAddress        │
                     │ userAgent        │
                     └──────────────────┘

┌──────────────────────┐     ┌──────────────────┐
│ NotificationRecipient│     │     Setting      │
├──────────────────────┤     ├──────────────────┤
│ id                   │     │ id               │
│ type (email/whatsapp)│     │ key              │
│ value                │     │ value            │
│ active               │     │ description      │
│ createdAt            │     │ createdAt        │
│ updatedAt            │     │ updatedAt        │
└──────────────────────┘     └──────────────────┘
```

---

## User

Representa os usuários do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | PK, auto-increment |
| name | VARCHAR(255) | Nome completo |
| email | VARCHAR(255) | Email único |
| password | VARCHAR(255) | Hash bcrypt |
| role | ENUM | 'admin', 'editor', 'viewer' |
| active | BOOLEAN | Se está ativo |
| createdAt | DATETIME | Data de criação |
| updatedAt | DATETIME | Última atualização |

**Índices:** email (unique)

---

## Professional

Editores/profissionais que produzem os vídeos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | PK, auto-increment |
| name | VARCHAR(255) | Nome do profissional |
| active | BOOLEAN | Se está ativo |
| createdAt | DATETIME | Data de criação |
| updatedAt | DATETIME | Última atualização |

---

## Video

Vídeos enviados ao sistema. Suporta versões (pai/filho).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | PK, auto-increment |
| title | VARCHAR(255) | Título do vídeo |
| filename | VARCHAR(255) | Nome do arquivo salvo |
| originalFilename | VARCHAR(255) | Nome original |
| path | VARCHAR(500) | Caminho no disco |
| mimeType | VARCHAR(100) | video/mp4 ou video/quicktime |
| size | BIGINT | Tamanho em bytes |
| durationSeconds | DECIMAL(10,2) | Duração em segundos |
| resolutionWidth | INT | Largura em pixels |
| resolutionHeight | INT | Altura em pixels |
| resolutionLabel | VARCHAR(20) | '4K', '1080p', '720p', etc |
| professionalId | INT | FK para Professional |
| parentId | INT | FK para Video (versão) |
| requestDate | DATE | Data de solicitação |
| completionDate | DATE | Data de conclusão |
| isTv | BOOLEAN | Se é para TV |
| tvTitle | VARCHAR(255) | Título da TV (se isTv) |
| createdAt | DATETIME | Data de criação |
| updatedAt | DATETIME | Última atualização |

**Relacionamentos:**
- `belongsTo Professional` (professionalId)
- `belongsTo Video as parent` (parentId)
- `hasMany Video as versions` (parentId)

**Índices:** professionalId, parentId, requestDate

---

## DownloadLog

Registra cada download de vídeo.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | PK, auto-increment |
| videoId | INT | FK para Video |
| userId | INT | FK para User (quem baixou) |
| downloadedAt | DATETIME | Data/hora do download (UTC-3) |
| ipAddress | VARCHAR(45) | IP do cliente |
| userAgent | TEXT | User-agent do navegador |

---

## Setting

Configurações do sistema em formato chave-valor.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | PK, auto-increment |
| key | VARCHAR(100) | Chave única |
| value | TEXT | Valor da configuração |
| description | VARCHAR(255) | Descrição |
| createdAt | DATETIME | Data de criação |
| updatedAt | DATETIME | Última atualização |

**Chaves padrão:**
- `monthly_limit_seconds`: 1100
- `rollover_months`: 2
- `company_name`: Pix Filmes
- `compression_threshold_mb`: 100

---

## NotificationRecipient

Destinatários de notificações automáticas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | PK, auto-increment |
| type | ENUM | 'email' ou 'whatsapp' |
| value | VARCHAR(255) | Email ou telefone |
| active | BOOLEAN | Se está ativo |
| createdAt | DATETIME | Data de criação |
| updatedAt | DATETIME | Última atualização |

---

## Cálculo de Duração (Versões)

Vídeos principais contam 100% da duração.
Versões adicionais (com `parentId`) contam 50%.

```typescript
function getCalculatedDuration(video: Video): number {
  if (video.parentId) {
    return video.durationSeconds * 0.5;
  }
  return video.durationSeconds;
}
```

### Exemplo

| Vídeo | Duração Real | parentId | Duração Calculada |
|-------|--------------|----------|-------------------|
| Video A | 60s | null | 60s |
| Video A v2 | 60s | 1 | 30s |
| Video B | 30s | null | 30s |
| **Total** | 150s | - | **120s** |
