# 🚀 Deploy na VPS - Docker Standalone + Portainer + NPM

**Data:** 2026-01-21  
**Versão:** Com correções F-006, F-008, F-009, F-010, F-011, F-014, F-015

---

## 📋 Checklist Rápido

- [ ] VPS com Ubuntu 22.04+ e Docker instalado
- [ ] Portainer rodando
- [ ] Nginx Proxy Manager rodando
- [ ] Domínio `relatorio.pixfilmes.com` apontando para VPS
- [ ] Repositório clonado na VPS
- [ ] Variáveis de ambiente configuradas
- [ ] Stack deployada no Portainer
- [ ] Proxy Host configurado no NPM
- [ ] SSL (Let's Encrypt) configurado
- [ ] Migration executada no banco

---

## 🔧 Passo 1: Preparar VPS

### 1.1 Verificar Docker

```bash
docker --version
docker compose version
```

### 1.2 Criar Rede do NPM (se não existir)

```bash
docker network create npm_default
```

Verificar se existe:
```bash
docker network ls | grep npm
```

---

## 📦 Passo 2: Clonar e Configurar

### 2.1 Clonar Repositório

```bash
cd /opt
git clone https://github.com/vicctim/relatorios.git
cd relatorios
```

### 2.2 Configurar Variáveis de Ambiente

```bash
# Copiar exemplo
cp .env.example .env

# Editar
nano .env
```

**Valores obrigatórios:**

```env
# Database
DB_ROOT_PASSWORD=<senha-forte-aleatoria>
DB_NAME=relatorios
DB_USER=relatorios
DB_PASSWORD=<senha-forte-aleatoria>

# JWT (GERAR UMA CHAVE SEGURA!)
JWT_SECRET=<gerar-com-openssl-rand-hex-32>
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=https://relatorio.pixfilmes.com
VITE_API_URL=/api

# Upload
MAX_FILE_SIZE_MB=500
COMPRESSION_THRESHOLD_MB=100

# Timezone
TZ=America/Sao_Paulo
```

**Gerar senhas seguras:**

```bash
# JWT Secret (mínimo 32 caracteres)
openssl rand -hex 32

# Senha MySQL
openssl rand -base64 32
```

---

## 🐳 Passo 3: Deploy via Portainer

### 3.1 Escolher Método de Deploy

**Opção A: Usar Imagens do CI/CD (Recomendado) ⚡**
- Mais rápido (não precisa buildar na VPS)
- Usa imagens pré-buildadas do GitHub Container Registry
- Compose path: `docker-compose.registry.yml`
- **Requer:** Login no Docker (ver passo 3.2)

**Opção B: Build Local na VPS**
- Builda as imagens diretamente na VPS
- Compose path: `docker-compose.portainer.yml`
- Mais lento, mas não requer autenticação

### 3.2 Login no Docker (Apenas para Opção A)

Se escolheu usar imagens do CI/CD, faça login:

```bash
# Criar Personal Access Token no GitHub:
# Settings → Developer settings → Personal access tokens → Tokens (classic)
# Permissões: read:packages

# Login no Docker
docker login ghcr.io
# Username: vicctim
# Password: <seu-token>
```

### 3.3 Criar Stack

1. Acesse Portainer: `https://seu-ip:9443`
2. **Stacks** → **Add stack**
3. Nome: `relatorios`

**Se Opção A (CI/CD):**
- Repository URL: `https://github.com/vicctim/relatorios.git`
- Repository reference: `main`
- Compose path: `docker-compose.registry.yml`

**Se Opção B (Build Local):**
- Repository URL: `https://github.com/vicctim/relatorios.git`
- Repository reference: `main`
- Compose path: `docker-compose.portainer.yml`
- Build method: **Use BuildKit**

### 3.2 Environment Variables

No Portainer, adicione todas as variáveis do `.env`:

```
DB_ROOT_PASSWORD=<valor>
DB_NAME=relatorios
DB_USER=relatorios
DB_PASSWORD=<valor>
JWT_SECRET=<valor-gerado>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://relatorio.pixfilmes.com
VITE_API_URL=/api
MAX_FILE_SIZE_MB=500
COMPRESSION_THRESHOLD_MB=100
TZ=America/Sao_Paulo
```

### 3.3 Deploy

1. Clique em **Deploy the stack**
2. Aguarde build (5-10 minutos)
3. Verifique logs em **Containers** → `relatorios-backend`

---

## 🗄️ Passo 4: Executar Migrations

**IMPORTANTE:** Após o primeiro deploy, execute as migrations:

```bash
# Entrar no container backend
docker exec -it relatorios-backend sh

# Executar migrations
npm run migrate

# Sair
exit
```

**OU via Portainer:**
1. **Containers** → `relatorios-backend` → **Console**
2. Execute: `npm run migrate`

**Migrations incluídas:**
- ✅ `20260121000002-add-include-in-report-to-videos.js` (Nova feature)

---

## 🌐 Passo 5: Configurar Nginx Proxy Manager

### 5.1 Adicionar Proxy Host

1. Acesse NPM: `http://seu-ip:81`
2. **Proxy Hosts** → **Add Proxy Host**

**Details:**
- Domain Names: `relatorio.pixfilmes.com`
- Scheme: `http`
- Forward Hostname/IP: `relatorios-frontend`
- Forward Port: `80`
- ✅ Cache Assets
- ✅ Block Common Exploits
- ✅ Websockets Support

**SSL:**
- SSL Certificate: **Request a new SSL Certificate**
- Domain Names: `relatorio.pixfilmes.com`
- Email: seu-email@exemplo.com
- ✅ Agree to Terms
- **Save**

### 5.2 Custom Locations (Opcional)

Se quiser acessar API diretamente:

**Location 1: API**
- Location: `/api`
- Scheme: `http`
- Forward Hostname: `relatorios-backend`
- Forward Port: `3001`

**Location 2: Uploads**
- Location: `/uploads`
- Scheme: `http`
- Forward Hostname: `relatorios-backend`
- Forward Port: `3001`

---

## ✅ Passo 6: Verificar Deploy

### 6.1 Health Checks

```bash
# Backend
curl https://relatorio.pixfilmes.com/api/health

# Deve retornar: {"status":"ok"}
```

### 6.2 Verificar Containers

No Portainer:
- ✅ `relatorios-mysql` → **Running** e **Healthy**
- ✅ `relatorios-backend` → **Running** e **Healthy**
- ✅ `relatorios-frontend` → **Running** e **Healthy**

### 6.3 Testar Aplicação

1. Acesse: `https://relatorio.pixfilmes.com`
2. Login: `admin@pixfilmes.com` / `admin123`
3. **⚠️ ALTERE A SENHA IMEDIATAMENTE!**

### 6.4 Verificar Feature Nova

1. Vá em **Upload**
2. Faça upload de um vídeo
3. Verifique que há checkbox "Incluir este vídeo no relatório"
4. Teste com checkbox desmarcado → não deve aparecer em relatórios

---

## 🔒 Segurança Pós-Deploy

### 6.1 Alterar Senha Admin

1. Login → **Admin** → **Users**
2. Edite usuário admin
3. Altere senha

### 6.2 Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 9443/tcp  # Portainer
sudo ufw allow 81/tcp    # NPM
sudo ufw enable
```

### 6.3 Backup Automático

Criar script `/opt/backup-relatorios.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/relatorios"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup MySQL
docker exec relatorios-mysql mysqldump -u root -p${DB_ROOT_PASSWORD} relatorios > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
docker cp relatorios-backend:/app/uploads $BACKUP_DIR/uploads_$DATE

# Compactar
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/db_$DATE.sql $BACKUP_DIR/uploads_$DATE

# Limpar backups antigos (manter 7 dias)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "✅ Backup concluído: backup_$DATE.tar.gz"
```

Tornar executável:
```bash
chmod +x /opt/backup-relatorios.sh
```

Adicionar ao crontab:
```bash
crontab -e
# Backup diário às 2h
0 2 * * * /opt/backup-relatorios.sh
```

---

## 🔄 Atualizações Futuras

### Atualizar Código (Com CI/CD)

Se estiver usando `docker-compose.registry.yml`:

```bash
# Na VPS
cd /opt/relatorios
git pull origin main

# Pull das novas imagens
docker pull ghcr.io/vicctim/relatorios/backend:latest
docker pull ghcr.io/vicctim/relatorios/frontend:latest

# Recriar containers
docker compose -f docker-compose.registry.yml up -d --force-recreate
```

**No Portainer:**
1. Stacks → relatorios → Editor
2. Clique em "Update the stack"
3. Marque "Recreate the containers"
4. Deploy

### Atualizar Código (Build Local)

```bash
# Na VPS
cd /opt/relatorios
git pull origin main

# No Portainer
# Stacks → relatorios → Editor
# Clique em "Update the stack"
# Marque "Recreate the containers" se houver mudanças nos Dockerfiles
```

### Executar Novas Migrations

```bash
docker exec -it relatorios-backend npm run migrate
```

---

## 🐛 Troubleshooting

### Containers não iniciam

```bash
# Ver logs
docker logs relatorios-backend
docker logs relatorios-frontend
docker logs relatorios-mysql

# Verificar rede
docker network inspect npm_default
docker network inspect relatorios-network
```

### MySQL não conecta

```bash
# Verificar health
docker exec relatorios-mysql mysqladmin ping -h localhost -u root -p

# Ver logs
docker logs relatorios-mysql
```

### Migration falha

```bash
# Verificar se container está rodando
docker ps | grep relatorios-backend

# Entrar no container
docker exec -it relatorios-backend sh

# Verificar variáveis de ambiente
env | grep DB_

# Executar migration manualmente
npm run migrate
```

### SSL não funciona

1. Verifique DNS apontando para VPS:
   ```bash
   dig relatorio.pixfilmes.com
   ```

2. Verifique firewall (portas 80 e 443 abertas)

3. Verifique logs do NPM no Portainer

4. Aguarde propagação DNS (pode levar até 24h)

### Erro "Network npm_default not found"

```bash
# Criar rede
docker network create npm_default

# Verificar
docker network ls | grep npm
```

---

## 📊 Estrutura Final

```
VPS
├── /opt/relatorios/          # Código fonte
│   ├── docker-compose.portainer.yml
│   ├── .env
│   ├── backend/
│   └── frontend/
│
├── Docker Volumes
│   ├── mysql_data            # Dados MySQL
│   ├── uploads_data          # Uploads de vídeos
│   ├── portainer_data        # Dados Portainer
│   ├── npm_data              # Dados NPM
│   └── npm_letsencrypt       # Certificados SSL
│
└── Networks
    ├── npm_default           # Rede do NPM
    └── relatorios-network    # Rede interna da aplicação
```

---

## 🎯 URLs Finais

- **Frontend:** `https://relatorio.pixfilmes.com`
- **API:** `https://relatorio.pixfilmes.com/api`
- **Health Check:** `https://relatorio.pixfilmes.com/api/health`
- **Portainer:** `https://seu-ip:9443`
- **NPM:** `http://seu-ip:81`

---

## ✅ Checklist Final

- [ ] Todos os containers rodando
- [ ] Health checks passando
- [ ] SSL configurado e funcionando
- [ ] Login funcionando
- [ ] Senha admin alterada
- [ ] Upload de vídeo funcionando
- [ ] Feature "Incluir no Relatório" funcionando
- [ ] Relatórios gerando corretamente
- [ ] Firewall configurado
- [ ] Backup automático configurado

---

**🎉 Deploy concluído!**
