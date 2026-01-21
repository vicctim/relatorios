# 🚀 Guia Completo de Deploy - VPS com Docker + Portainer + NPM

## 📋 Pré-requisitos

- VPS Ubuntu 22.04+ (recomendado)
- Docker Standalone instalado
- Portainer instalado e rodando
- Nginx Proxy Manager (NPM) instalado e rodando
- Domínio configurado (DNS apontando para VPS)

## 🔧 Passo 1: Preparar VPS

### 1.1 Instalar Docker Standalone

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Reiniciar sessão ou executar:
newgrp docker

# Verificar instalação
docker --version
docker compose version
```

### 1.2 Instalar Portainer

```bash
docker volume create portainer_data

docker run -d -p 8000:8000 -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Acesse: `https://seu-ip:9443`

### 1.3 Instalar Nginx Proxy Manager

```bash
# Criar rede do NPM
docker network create npm_default

# Instalar NPM
docker run -d \
  --name=npm \
  -p 80:80 \
  -p 443:443 \
  -p 81:81 \
  -v npm_data:/data \
  -v npm_letsencrypt:/etc/letsencrypt \
  --restart=always \
  --network=npm_default \
  jc21/nginx-proxy-manager:latest
```

Acesse: `http://seu-ip:81`
- Email: `admin@example.com`
- Senha: `changeme` (altere no primeiro acesso!)

## 📦 Passo 2: Preparar Projeto

### 2.1 Clonar Repositório

```bash
# Na VPS
cd /opt
git clone git@github.com:vicctim/relatorios.git
cd relatorios
```

### 2.2 Configurar Variáveis de Ambiente

```bash
# Copiar exemplo
cp .env.example .env

# Editar com valores de produção
nano .env
```

**Valores importantes:**
```env
# Gerar senha segura para MySQL root
DB_ROOT_PASSWORD=$(openssl rand -base64 32)

# Gerar senha segura para usuário MySQL
DB_PASSWORD=$(openssl rand -base64 32)

# Gerar JWT secret (mínimo 32 caracteres)
JWT_SECRET=$(openssl rand -hex 32)

# URL do frontend
FRONTEND_URL=https://relatorio.pixfilmes.com
VITE_API_URL=/api
```

## 🐳 Passo 3: Deploy via Portainer

### 3.1 Criar Stack

1. Acesse Portainer: `https://seu-ip:9443`
2. Vá em **Stacks** → **Add stack**
3. Nome: `relatorios`
4. Método: **Repository** ou **Upload**

**Opção A: Repository (Recomendado)**
- Repository URL: `https://github.com/vicctim/relatorios.git`
- Repository reference: `main`
- Compose path: `docker-compose.portainer.yml`

**Opção B: Upload**
- Faça upload do arquivo `docker-compose.portainer.yml`

### 3.2 Configurar Environment Variables

No Portainer, na seção **Environment variables**, adicione todas as variáveis do `.env`:

```
DB_ROOT_PASSWORD=sua-senha-root
DB_NAME=relatorios
DB_USER=relatorios
DB_PASSWORD=sua-senha-usuario
JWT_SECRET=sua-chave-jwt-segura
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://relatorio.pixfilmes.com
VITE_API_URL=/api
MAX_FILE_SIZE_MB=500
COMPRESSION_THRESHOLD_MB=100
TZ=America/Sao_Paulo
```

### 3.3 Deploy

1. Clique em **Deploy the stack**
2. Aguarde o build e inicialização (pode levar 5-10 minutos)
3. Verifique os logs em **Containers** → `relatorios-backend` → **Logs**

## 🌐 Passo 4: Configurar Nginx Proxy Manager

### 4.1 Adicionar Proxy Host

1. Acesse NPM: `http://seu-ip:81`
2. Vá em **Proxy Hosts** → **Add Proxy Host**

**Details:**
- Domain Names: `relatorio.pixfilmes.com`
- Scheme: `http`
- Forward Hostname/IP: `relatorios-frontend`
- Forward Port: `80`
- Cache Assets: ✅
- Block Common Exploits: ✅
- Websockets Support: ✅

**SSL:**
- SSL Certificate: **Request a new SSL Certificate**
- Domain Names: `relatorio.pixfilmes.com`
- Email: seu-email@exemplo.com
- Agree to Terms: ✅
- Save

### 4.2 Configurar API Proxy (Opcional)

Se quiser acessar API diretamente:

1. **Add Proxy Host**
- Domain: `api.relatorio.pixfilmes.com`
- Forward: `relatorios-backend:3001`
- SSL: Let's Encrypt

## ✅ Passo 5: Verificar Deploy

### 5.1 Health Checks

```bash
# Backend
curl https://relatorio.pixfilmes.com/api/health

# Frontend
curl https://relatorio.pixfilmes.com
```

### 5.2 Verificar Containers

No Portainer:
- **Containers** → Todos devem estar **Running** e **Healthy**

### 5.3 Testar Login

1. Acesse: `https://relatorio.pixfilmes.com`
2. Login: `admin@pixfilmes.com` / `admin123`
3. **IMPORTANTE:** Altere a senha imediatamente!

## 🔒 Passo 6: Segurança Pós-Deploy

### 6.1 Alterar Senha Admin

1. Faça login
2. Vá em **Admin** → **Users**
3. Edite o usuário admin
4. Altere a senha

### 6.2 Configurar Firewall

```bash
# UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 9443/tcp  # Portainer
sudo ufw allow 81/tcp    # NPM
sudo ufw enable
```

### 6.3 Backup Automático

Crie script de backup:

```bash
#!/bin/bash
# /opt/backup-relatorios.sh

BACKUP_DIR="/opt/backups/relatorios"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MySQL
docker exec relatorios-mysql mysqldump -u root -p$DB_ROOT_PASSWORD relatorios > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
docker cp relatorios-backend:/app/uploads $BACKUP_DIR/uploads_$DATE

# Compactar
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/db_$DATE.sql $BACKUP_DIR/uploads_$DATE

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup concluído: backup_$DATE.tar.gz"
```

Adicionar ao crontab:
```bash
crontab -e
# Backup diário às 2h
0 2 * * * /opt/backup-relatorios.sh
```

## 📊 Monitoramento

### Portainer

- **Dashboard:** Visão geral de containers
- **Logs:** Logs em tempo real
- **Stats:** Uso de recursos

### NPM

- **Logs:** Acessos e erros
- **SSL:** Status dos certificados

## 🔄 Atualizações

### Atualizar Código

```bash
# Na VPS
cd /opt/relatorios
git pull origin main

# No Portainer
# Stacks → relatorios → Editor
# Clique em "Update the stack"
```

### Rebuild

Se houver mudanças nos Dockerfiles:

```bash
# No Portainer
# Stacks → relatorios → Editor
# Marque "Recreate the containers"
# Clique em "Update the stack"
```

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
# Verificar se está saudável
docker exec relatorios-mysql mysqladmin ping -h localhost -u root -p

# Ver logs
docker logs relatorios-mysql
```

### SSL não funciona

1. Verifique DNS apontando para VPS
2. Verifique firewall (porta 80 e 443 abertas)
3. Verifique logs do NPM
4. Aguarde propagação DNS (pode levar até 24h)

## 📝 Checklist de Deploy

- [ ] Docker instalado
- [ ] Portainer instalado e acessível
- [ ] NPM instalado e acessível
- [ ] Rede `npm_default` criada
- [ ] Repositório clonado
- [ ] `.env` configurado com valores seguros
- [ ] Stack deployada no Portainer
- [ ] Containers rodando e saudáveis
- [ ] Proxy Host configurado no NPM
- [ ] SSL configurado (Let's Encrypt)
- [ ] Domínio acessível
- [ ] Login funcionando
- [ ] Senha admin alterada
- [ ] Firewall configurado
- [ ] Backup automático configurado

## 🎉 Pronto!

Sua aplicação está rodando em produção com:
- ✅ Docker Standalone
- ✅ Portainer para gerenciamento
- ✅ Nginx Proxy Manager com SSL
- ✅ Domínio configurado
- ✅ Backup automático
