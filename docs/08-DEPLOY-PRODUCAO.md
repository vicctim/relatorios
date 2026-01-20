# Deploy em Produção

## Arquitetura de Produção

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │   (DNS + CDN)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │     Nginx       │
                    │ (Reverse Proxy) │
                    │   :80 / :443    │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │  Frontend   │   │   Backend   │   │   Uploads   │
    │   (React)   │   │  (Express)  │   │  (Static)   │
    │    :80      │   │   :3001     │   │             │
    └─────────────┘   └──────┬──────┘   └─────────────┘
                             │
                    ┌────────▼────────┐
                    │     MySQL       │
                    │    :3306        │
                    └─────────────────┘
```

## Preparação do Servidor

### Requisitos
- Ubuntu 22.04+ ou similar
- Docker + Docker Compose
- Mínimo 2GB RAM, 2 vCPU
- 50GB+ disco (para vídeos)

### Instalar Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

## Configuração

### 1. Clonar Repositório
```bash
cd /opt
git clone <repo> relatorios
cd relatorios
```

### 2. Criar .env de Produção
```bash
cp .env.example .env
nano .env
```

```env
# Database
DB_HOST=mysql
DB_PORT=3306
DB_NAME=relatorios
DB_USER=relatorios
DB_PASSWORD=<SENHA_FORTE_AQUI>
DB_ROOT_PASSWORD=<SENHA_ROOT_FORTE>

# JWT
JWT_SECRET=<CHAVE_SECRETA_LONGA_ALEATORIA>
JWT_EXPIRES_IN=7d

# Server
NODE_ENV=production
FRONTEND_URL=https://relatorio.pixfilmes.com

# URLs
VITE_API_URL=https://relatorio.pixfilmes.com/api

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@pixfilmes.com
SMTP_PASSWORD=<APP_PASSWORD>

# WhatsApp (Evolution API)
EVOLUTION_API_URL=https://api.evolution.com
EVOLUTION_API_TOKEN=<TOKEN>
EVOLUTION_INSTANCE_NAME=pixfilmes
```

### 3. Certificados SSL
```bash
mkdir -p nginx/ssl
# Copiar certificados Let's Encrypt
cp /etc/letsencrypt/live/relatorio.pixfilmes.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/relatorio.pixfilmes.com/privkey.pem nginx/ssl/
```

## Deploy

### Opção 1: Docker Compose

```bash
# Build e iniciar
docker compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker compose -f docker-compose.prod.yml logs -f

# Reiniciar serviço específico
docker compose -f docker-compose.prod.yml restart backend
```

### Opção 2: Docker Swarm

```bash
# Inicializar swarm (primeira vez)
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml relatorios

# Ver serviços
docker service ls

# Logs de um serviço
docker service logs relatorios_backend -f

# Escalar serviço
docker service scale relatorios_backend=3
```

## Comandos Úteis

### Logs
```bash
# Todos os containers
docker compose -f docker-compose.prod.yml logs -f

# Apenas backend
docker compose -f docker-compose.prod.yml logs -f backend

# Últimas 100 linhas
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Backup do Banco
```bash
# Criar backup
docker exec relatorios-mysql mysqldump -u root -p<SENHA> relatorios > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i relatorios-mysql mysql -u root -p<SENHA> relatorios < backup.sql
```

### Backup dos Uploads
```bash
# Criar backup
tar -czvf uploads_$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/relatorios_uploads_data/_data/

# Ou copiar para S3
aws s3 sync /var/lib/docker/volumes/relatorios_uploads_data/_data/ s3://bucket/uploads/
```

## Monitoramento

### Health Check
```bash
curl https://relatorio.pixfilmes.com/api/health
# {"status":"ok","timestamp":"..."}
```

### Verificar Containers
```bash
docker ps
docker stats
```

## Atualizações

### Processo de Update
```bash
cd /opt/relatorios

# Baixar mudanças
git pull

# Rebuild e restart
docker compose -f docker-compose.prod.yml up -d --build

# Verificar se subiu
docker compose -f docker-compose.prod.yml ps
```

### Rollback
```bash
# Ver histórico de deploys
git log --oneline

# Voltar para versão anterior
git checkout <commit-hash>
docker compose -f docker-compose.prod.yml up -d --build
```

## Segurança

### Checklist
- [ ] Senhas fortes no .env
- [ ] JWT_SECRET único e longo (32+ caracteres)
- [ ] SSL/TLS configurado
- [ ] Firewall configurado (apenas 80, 443)
- [ ] Backups automáticos
- [ ] Logs centralizados

### Firewall (UFW)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## Troubleshooting

### Container não inicia
```bash
# Ver logs detalhados
docker compose -f docker-compose.prod.yml logs backend

# Verificar se porta está em uso
ss -tlnp | grep 3001
```

### Erro de conexão com MySQL
```bash
# Verificar se MySQL está healthy
docker compose -f docker-compose.prod.yml ps

# Testar conexão
docker exec -it relatorios-mysql mysql -u relatorios -p
```

### Erro 502 Bad Gateway
```bash
# Backend provavelmente não está rodando
docker compose -f docker-compose.prod.yml restart backend

# Verificar logs do nginx
docker compose -f docker-compose.prod.yml logs nginx
```
