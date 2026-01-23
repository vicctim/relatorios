# 🌐 Configurar NPM - Passo a Passo Visual

Guia detalhado para configurar o Nginx Proxy Manager e resolver o erro 405.

## ⚠️ Problema Atual

- ✅ Frontend carregando
- ❌ `/api/*` retornando 405 Method Not Allowed
- ❌ Login não funciona

**Causa:** NPM não está fazendo proxy de `/api` para o backend.

---

## 📋 Passo 1: Criar Proxy Host Principal

1. Acesse NPM: `http://seu-ip:81`
2. Vá em **Proxy Hosts** → **Add Proxy Host**

### Aba "Details"

Preencha:
- **Domain Names:** `relatorio.pixfilmes.com`
- **Scheme:** `http` (não https)
- **Forward Hostname/IP:** `relatorios_frontend`
- **Forward Port:** `80`
- ✅ **Cache Assets**
- ✅ **Block Common Exploits**
- ✅ **Websockets Support**

**NÃO salve ainda!** Primeiro configure as Custom Locations.

---

## 🔗 Passo 2: Configurar Custom Locations (CRÍTICO!)

**IMPORTANTE:** Configure ANTES de salvar o Proxy Host principal.

### 2.1 Adicionar Location `/api`

1. Na mesma tela do Proxy Host, vá na aba **"Custom Locations"**
2. Clique em **"Add Location"** ou **"Add Custom Location"**

Preencha:
- **Location:** `/api`
- **Scheme:** `http`
- **Forward Hostname/IP:** `relatorios_backend`
- **Forward Port:** `3001`
- ✅ **Preserve Path** (importante!)

**Save** esta location.

### 2.2 Adicionar Location `/uploads` (Opcional)

1. Clique em **"Add Location"** novamente

Preencha:
- **Location:** `/uploads`
- **Scheme:** `http`
- **Forward Hostname/IP:** `relatorios_backend`
- **Forward Port:** `3001`
- ✅ **Preserve Path**

**Save** esta location.

---

## 🔒 Passo 3: Configurar SSL

1. Vá na aba **"SSL"**
2. Selecione: **"Request a new SSL Certificate"**
3. Preencha:
   - **Domain Names:** `relatorio.pixfilmes.com`
   - **Email:** seu-email@exemplo.com
   - ✅ **Agree to Terms**
   - ✅ **Force SSL** (recomendado)

4. **Save**

---

## ✅ Passo 4: Salvar Proxy Host

Agora sim, clique em **"Save"** no Proxy Host principal.

---

## 🧪 Passo 5: Testar

### 5.1 Testar Frontend

```bash
curl https://relatorio.pixfilmes.com
# Deve retornar HTML (200 OK)
```

### 5.2 Testar API (CRÍTICO!)

```bash
# Health check
curl https://relatorio.pixfilmes.com/api/health
# Deve retornar: {"status":"ok",...}

# Settings públicos
curl https://relatorio.pixfilmes.com/api/settings/public
# Deve retornar JSON: {"settings":{...}}
```

### 5.3 Testar Login

```bash
curl -X POST https://relatorio.pixfilmes.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pixfilmes.com","password":"admin123"}'
# Deve retornar: {"token":"...","user":{...}}
```

---

## 🐛 Se Ainda Der 405

### Verificar Ordem das Locations

No NPM, a ordem das Custom Locations importa! `/api` deve estar **ANTES** de `/` (root).

Se necessário:
1. Edite o Proxy Host
2. Na aba **Custom Locations**
3. Reordene para que `/api` venha primeiro
4. Salve

### Verificar Rede

```bash
# Verificar se containers estão na rede_publica
docker network inspect rede_publica | grep -A 5 relatorios

# Verificar se NPM está na rede_publica
docker inspect <container_npm> | grep -A 10 Networks
```

### Verificar Nomes dos Containers

```bash
# Verificar nomes exatos
docker ps --format "table {{.Names}}\t{{.Image}}"

# Deve mostrar:
# relatorios_backend
# relatorios_frontend
```

**Use os nomes EXATOS** no NPM (sem espaços, sem caracteres especiais).

---

## 📝 Checklist Final

- [ ] Proxy Host criado com domínio correto
- [ ] Forward Hostname: `relatorios_frontend:80` (frontend)
- [ ] Custom Location `/api` → `relatorios_backend:3001`
- [ ] Custom Location `/uploads` → `relatorios_backend:3001` (opcional)
- [ ] SSL configurado (Let's Encrypt)
- [ ] Containers na rede `rede_publica`
- [ ] NPM na rede `rede_publica`
- [ ] Teste `/api/health` retorna JSON (não HTML)
- [ ] Teste login funciona

---

## ⚡ Solução Rápida

Se você já criou o Proxy Host sem as Custom Locations:

1. Edite o Proxy Host existente
2. Vá em **Custom Locations**
3. Adicione `/api` → `relatorios_backend:3001`
4. Salve

O NPM deve atualizar automaticamente e o 405 deve desaparecer.

---

**✅ Após configurar, o login deve funcionar!**
