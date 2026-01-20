# API Endpoints

Base URL: `http://localhost:3001/api`

## Autenticação

Todas as rotas (exceto login/register) requerem header:
```
Authorization: Bearer <token>
```

---

## Auth `/api/auth`

| Método | Rota | Descrição | Auth | Role |
|--------|------|-----------|------|------|
| POST | `/login` | Login | Não | - |
| POST | `/register` | Criar conta | Não | - |
| GET | `/me` | Perfil atual | Sim | Todos |
| PUT | `/me` | Atualizar perfil | Sim | Todos |

### POST /login
```json
// Request
{ "email": "admin@pixfilmes.com", "password": "admin123" }

// Response
{ "token": "eyJ...", "user": { "id": 1, "name": "Admin", "role": "admin" } }
```

---

## Users `/api/users`

| Método | Rota | Descrição | Auth | Role |
|--------|------|-----------|------|------|
| GET | `/` | Listar usuários | Sim | admin |
| POST | `/` | Criar usuário | Sim | admin |
| GET | `/:id` | Buscar usuário | Sim | admin |
| PUT | `/:id` | Atualizar usuário | Sim | admin |
| DELETE | `/:id` | Deletar usuário | Sim | admin |

---

## Professionals `/api/professionals`

| Método | Rota | Descrição | Auth | Role |
|--------|------|-----------|------|------|
| GET | `/` | Listar profissionais | Sim | Todos |
| POST | `/` | Criar profissional | Sim | admin |
| PUT | `/:id` | Atualizar | Sim | admin |
| DELETE | `/:id` | Deletar | Sim | admin |

---

## Settings `/api/settings`

| Método | Rota | Descrição | Auth | Role |
|--------|------|-----------|------|------|
| GET | `/` | Listar configurações | Sim | admin |
| PUT | `/` | Atualizar configurações | Sim | admin |

### Chaves de Configuração
- `monthly_limit_seconds` - Limite mensal (default: 1100)
- `rollover_months` - Meses de rollover (default: 2)
- `company_name` - Nome da empresa
- `company_phone` - Telefone
- `company_address` - Endereço
- `company_cnpj` - CNPJ
- `smtp_host`, `smtp_port`, `smtp_user`, `smtp_password` - Email
- `evolution_api_url`, `evolution_api_token` - WhatsApp

---

## Videos `/api/videos`

| Método | Rota | Descrição | Auth | Role |
|--------|------|-----------|------|------|
| GET | `/` | Listar vídeos | Sim | Todos |
| POST | `/` | Upload vídeo | Sim | editor |
| GET | `/:id` | Detalhes do vídeo | Sim | Todos |
| PUT | `/:id` | Atualizar vídeo | Sim | editor |
| DELETE | `/:id` | Deletar vídeo | Sim | admin |
| POST | `/:id/version` | Adicionar versão | Sim | editor |
| GET | `/:id/download` | Download (com log) | Sim | Todos |
| GET | `/:id/stream` | Stream/preview | Sim | Todos |

### POST /videos (Upload)
```
Content-Type: multipart/form-data

Fields:
- video: File (MP4 ou MOV, max 500MB)
- title: string
- professionalId: number
- requestDate: string (YYYY-MM-DD)
- completionDate: string (YYYY-MM-DD)
- isTv: boolean
- tvTitle?: string (obrigatório se isTv=true)
```

### GET /videos (Query params)
```
?month=12&year=2024        # Filtrar por mês
?professionalId=1          # Filtrar por profissional
?page=1&limit=20           # Paginação
```

---

## Reports `/api/reports`

| Método | Rota | Descrição | Auth | Role |
|--------|------|-----------|------|------|
| GET | `/stats` | Estatísticas dashboard | Sim | Todos |
| GET | `/:year/:month` | Relatório mensal | Sim | Todos |
| GET | `/:year/:month/usage` | Uso do mês | Sim | Todos |
| GET | `/:year/:month/pdf` | Gerar PDF | Sim | Todos |

### GET /reports/:year/:month
```json
// Response
{
  "month": 12,
  "year": 2024,
  "byProfessional": [
    {
      "professional": "Editor 1",
      "videos": [...],
      "totalDuration": 450
    }
  ],
  "totalVideos": 15,
  "totalDuration": 850
}
```

### GET /reports/:year/:month/usage
```json
// Response
{
  "month": 12,
  "year": 2024,
  "usedSeconds": 850,
  "baseLimit": 1100,
  "rolloverSeconds": 250,
  "effectiveLimit": 1350,
  "remainingSeconds": 500,
  "percentUsed": 63
}
```

---

## Logs `/api/logs`

| Método | Rota | Descrição | Auth | Role |
|--------|------|-----------|------|------|
| GET | `/downloads` | Listar downloads | Sim | admin |
| GET | `/downloads/:videoId` | Downloads do vídeo | Sim | admin |

---

## Notifications `/api/notifications`

| Método | Rota | Descrição | Auth | Role |
|--------|------|-----------|------|------|
| GET | `/recipients` | Listar destinatários | Sim | admin |
| POST | `/recipients` | Adicionar destinatário | Sim | admin |
| PUT | `/recipients/:id` | Ativar/desativar | Sim | admin |
| DELETE | `/recipients/:id` | Remover | Sim | admin |
| POST | `/test` | Testar notificação | Sim | admin |

### POST /notifications/recipients
```json
// Email
{ "type": "email", "value": "cliente@email.com" }

// WhatsApp
{ "type": "whatsapp", "value": "11999999999" }
```

---

## Health Check

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/health` | Status da API | Não |

```json
// Response
{ "status": "ok", "timestamp": "2024-12-08T14:30:00.000Z" }
```
