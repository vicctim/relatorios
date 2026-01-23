# 🌐 Configurar Domínio de Compartilhamento

Guia para configurar o domínio `arquivos.pixfilmes.com` para links de compartilhamento.

## 📋 Visão Geral

Os links de compartilhamento agora podem usar um domínio diferente do sistema principal:
- **Sistema:** `https://relatorio.pixfilmes.com`
- **Compartilhamento:** `https://arquivos.pixfilmes.com/s/{slug}`

## ⚙️ Configuração

### 1. Variável de Ambiente

Adicione no seu `.env`:

```bash
SHARE_URL=https://arquivos.pixfilmes.com
```

**Importante:** Não inclua a barra final (`/`) no final da URL.

### 2. Configurar NPM para `arquivos.pixfilmes.com`

Você precisa criar um **novo Proxy Host** no Nginx Proxy Manager para o domínio de compartilhamento:

#### Passo 1: Criar Proxy Host

1. Acesse NPM: `http://seu-ip:81`
2. Vá em **Proxy Hosts** → **Add Proxy Host**

#### Passo 2: Configurar Details

- **Domain Names:** `arquivos.pixfilmes.com`
- **Scheme:** `http`
- **Forward Hostname/IP:** `relatorios_frontend` (mesmo container do frontend)
- **Forward Port:** `80`
- ✅ **Cache Assets**
- ✅ **Block Common Exploits**
- ✅ **Websockets Support**

#### Passo 3: Configurar Custom Locations

**Location 1: `/api`**
- Location: `/api`
- Scheme: `http`
- Forward Hostname: `relatorios_backend`
- Forward Port: `3001`
- ✅ **Preserve Path**

**Location 2: `/uploads`**
- Location: `/uploads`
- Scheme: `http`
- Forward Hostname: `relatorios_backend`
- Forward Port: `3001`
- ✅ **Preserve Path**

#### Passo 4: Configurar SSL

1. Vá na aba **SSL**
2. Selecione: **Request a new SSL Certificate**
3. Preencha:
   - **Domain Names:** `arquivos.pixfilmes.com`
   - **Email:** seu-email@exemplo.com
   - ✅ **Agree to Terms**
   - ✅ **Force SSL**

4. **Save**

## 🔄 Rebuild do Frontend

Após adicionar `SHARE_URL` no `.env`, você precisa fazer rebuild do frontend:

### Via CI/CD (Recomendado)

1. Aguarde o CI/CD completar o build
2. No Portainer, atualize a stack para puxar a nova imagem

### Via Build Local

```bash
# No diretório do projeto
docker-compose -f docker-compose.portainer.yml build frontend
docker-compose -f docker-compose.portainer.yml up -d frontend
```

## ✅ Verificar se Funcionou

1. Acesse `https://relatorio.pixfilmes.com`
2. Vá em **Vídeos** ou **Compartilhamentos**
3. Crie um novo link de compartilhamento
4. O link gerado deve ser: `https://arquivos.pixfilmes.com/s/{slug}`

## 🔍 Troubleshooting

### Links ainda usando `relatorio.pixfilmes.com`

**Causa:** Frontend não foi reconstruído com a nova variável.

**Solução:**
1. Verifique se `SHARE_URL` está no `.env`
2. Faça rebuild do frontend
3. Limpe o cache do navegador

### Erro 502 ao acessar `arquivos.pixfilmes.com`

**Causa:** NPM não está configurado ou container não está na rede correta.

**Solução:**
1. Verifique se o Proxy Host foi criado no NPM
2. Verifique se `relatorios_frontend` está na rede `rede_publica`
3. Verifique se o NPM está na rede `rede_publica`

### Links funcionam mas vídeos não carregam

**Causa:** Custom Location `/api` ou `/uploads` não configurada.

**Solução:**
1. Edite o Proxy Host `arquivos.pixfilmes.com`
2. Adicione as Custom Locations conforme Passo 3 acima

## 📝 Notas

- O domínio de compartilhamento **deve** apontar para o mesmo frontend container
- As rotas `/api` e `/uploads` devem fazer proxy para o backend
- A rota `/s/{slug}` é tratada pelo React Router no frontend
- Se `SHARE_URL` não for definida, o sistema usa `window.location.origin` como fallback
