# 🌐 Configurar Nginx Proxy Manager

Guia para configurar o Nginx Proxy Manager (NPM) para acessar a aplicação relatorios.

## 📋 Pré-requisitos

- Nginx Proxy Manager instalado e rodando
- Rede `rede_publica` criada e conectada ao NPM
- Containers `relatorios_frontend` e `relatorios_backend` rodando

## 🔧 Passo 1: Verificar Rede

```bash
# Verificar se rede_publica existe
docker network ls | grep rede_publica

# Se não existir, criar:
docker network create rede_publica

# Verificar se NPM está na rede
docker inspect <container_npm> | grep -A 10 Networks
```

## 🌐 Passo 2: Configurar Proxy Host no NPM

1. **Acesse o NPM:** `http://seu-ip:81`

2. **Vá em Proxy Hosts → Add Proxy Host**

3. **Configure o Frontend:**

   **Details:**
   - Domain Names: `relatorio.pixfilmes.com`
   - Scheme: `http`
   - Forward Hostname/IP: `relatorios_frontend` (nome do container)
   - Forward Port: `80`
   - ✅ Cache Assets
   - ✅ Block Common Exploits
   - ✅ Websockets Support

4. **SSL (Let's Encrypt):**
   - SSL Certificate: **Request a new SSL Certificate**
   - Domain Names: `relatorio.pixfilmes.com`
   - Email: seu-email@exemplo.com
   - ✅ Agree to Terms
   - **Save**

## 🔗 Passo 3: Configurar Custom Locations (API)

1. **No mesmo Proxy Host**, vá em **Advanced** ou **Custom Locations**

2. **Adicionar Location para API:**

   **Location 1: `/api`**
   - Location: `/api`
   - Scheme: `http`
   - Forward Hostname: `relatorios_backend`
   - Forward Port: `3001`
   - **Save**

   **Location 2: `/uploads` (opcional)**
   - Location: `/uploads`
   - Scheme: `http`
   - Forward Hostname: `relatorios_backend`
   - Forward Port: `3001`
   - **Save**

## ✅ Passo 4: Verificar Configuração

### Testar Frontend

```bash
# Testar acesso direto ao container
curl http://relatorios_frontend/

# Ou via IP do container
docker inspect relatorios_frontend | grep IPAddress
curl http://<IP_CONTAINER>/
```

### Testar Backend

```bash
# Testar health check
curl http://relatorios_backend:3001/api/health

# Ou via IP do container
docker inspect relatorios_backend | grep IPAddress
curl http://<IP_CONTAINER>:3001/api/health
```

### Testar via NPM

```bash
# Via domínio (se DNS já estiver configurado)
curl https://relatorio.pixfilmes.com

# Health check via NPM
curl https://relatorio.pixfilmes.com/api/health
```

## 🐛 Troubleshooting 502 Bad Gateway

### 1. Verificar se Containers estão na Rede Correta

```bash
# Verificar redes dos containers
docker inspect relatorios_frontend | grep -A 20 Networks
docker inspect relatorios_backend | grep -A 20 Networks

# Verificar se estão na rede_publica
docker network inspect rede_publica | grep -A 5 relatorios
```

### 2. Verificar se Containers Estão Saudáveis

```bash
# Ver status
docker ps | grep relatorios

# Ver logs
docker logs relatorios_frontend --tail 50
docker logs relatorios_backend --tail 50
```

### 3. Testar Conectividade entre Containers

```bash
# Do NPM para Frontend
docker exec <container_npm> ping -c 3 relatorios_frontend

# Do NPM para Backend
docker exec <container_npm> ping -c 3 relatorios_backend
```

### 4. Verificar Configuração do NPM

No NPM, verifique:
- ✅ Forward Hostname está correto: `relatorios_frontend` (não IP)
- ✅ Forward Port está correto: `80` (frontend) ou `3001` (backend)
- ✅ Scheme está como `http` (não https para comunicação interna)
- ✅ Containers estão na mesma rede (`rede_publica`)

### 5. Verificar Logs do NPM

No NPM:
- Vá em **Logs** → **Access Logs**
- Veja se há erros de conexão
- Procure por `502` ou `upstream`

## 📝 Configuração Completa do NPM

### Proxy Host Principal

```
Domain: relatorio.pixfilmes.com
Forward: relatorios_frontend:80
SSL: Let's Encrypt
```

### Custom Locations

```
/api → relatorios_backend:3001
/uploads → relatorios_backend:3001 (opcional)
```

## 🔄 Após Configurar

1. **Aguardar propagação DNS** (se for primeira vez)
2. **Testar acesso:** `https://relatorio.pixfilmes.com`
3. **Verificar SSL:** Certificado deve estar válido
4. **Testar login:** `admin@pixfilmes.com` / `admin123`

## ⚠️ Importante

- O NPM deve estar na mesma rede `rede_publica` que os containers
- Use nomes dos containers (não IPs) no Forward Hostname
- Use `http` (não https) para comunicação interna entre containers
- SSL é configurado apenas no NPM (externo), não nos containers

---

**✅ Após configurar, o 502 Bad Gateway deve desaparecer!**
