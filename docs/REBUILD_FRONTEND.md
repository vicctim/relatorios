# 🔄 Como Fazer Rebuild do Frontend

Guia rápido para atualizar o container do frontend com a nova variável `SHARE_URL`.

## ⚠️ Problema Atual

O container está rodando código antigo que ainda gera links com `relatorio.pixfilmes.com` ao invés de `arquivos.pixfilmes.com`.

## 🚀 Solução: Rebuild do Container

### Opção 1: Via Portainer (Recomendado)

Se você está usando imagens do GitHub Container Registry:

1. **Aguarde o CI/CD completar** (verifique em: `https://github.com/vicctim/relatorios/actions`)
2. Acesse o Portainer: `http://seu-ip:9000`
3. Vá em **Stacks** → Selecione sua stack `relatorios`
4. Clique em **Editor**
5. **Não precisa mudar nada** - apenas clique em **Update the stack**
6. Marque **"Recreate the containers"** (importante!)
7. Aguarde o rebuild completar

Isso vai forçar o pull da nova imagem `ghcr.io/vicctim/relatorios/frontend:latest` com `SHARE_URL` configurada.

### Opção 2: Via Terminal (SSH no VPS)

```bash
# 1. Entrar no diretório do projeto
cd /caminho/para/relatorios

# 2. Fazer pull da nova imagem (se usar CI/CD)
docker pull ghcr.io/vicctim/relatorios/frontend:latest

# 3. Parar e remover o container antigo
docker stop relatorios_frontend
docker rm relatorios_frontend

# 4. Reiniciar a stack (vai usar a nova imagem)
docker-compose -f docker-compose.registry.yml up -d frontend

# Ou se usar docker-compose.yml:
docker-compose up -d frontend
```

### Opção 3: Rebuild Local (se usar docker-compose.portainer.yml)

**IMPORTANTE:** Você precisa ter `SHARE_URL` no seu `.env` local:

```bash
# 1. Adicionar no .env
echo "SHARE_URL=https://arquivos.pixfilmes.com" >> .env

# 2. Entrar no diretório do projeto
cd /caminho/para/relatorios

# 3. Fazer rebuild apenas do frontend
docker-compose -f docker-compose.portainer.yml build frontend

# 4. Reiniciar o container
docker-compose -f docker-compose.portainer.yml up -d frontend
```

## ✅ Verificar se Funcionou

Após o rebuild, teste:

1. Acesse a aplicação: `https://relatorio.pixfilmes.com`
2. Vá em **Vídeos** ou **Compartilhamentos**
3. Crie um novo link de compartilhamento
4. O link gerado deve ser: `https://arquivos.pixfilmes.com/s/{slug}`

**Não deve mais aparecer:** `https://relatorio.pixfilmes.com/s/{slug}`

## 🔍 Verificar Variável no Build

Se quiser confirmar que a variável foi injetada no build, você pode verificar o código JavaScript gerado:

```bash
# Entrar no container
docker exec -it relatorios_frontend sh

# Verificar o arquivo JavaScript (procure por SHARE_URL)
grep -r "SHARE_URL" /usr/share/nginx/html/*.js | head -5
```

Ou verificar diretamente no navegador:
1. Abra DevTools (F12)
2. Vá em **Sources** ou **Network**
3. Abra o arquivo `main.*.js`
4. Procure por `SHARE_URL` ou `arquivos.pixfilmes.com`

## 🐛 Se Ainda Não Funcionar

### 1. Verificar se CI/CD completou

Acesse: `https://github.com/vicctim/relatorios/actions`

O último workflow deve estar **verde** (sucesso).

### 2. Verificar se variável está configurada no GitHub

1. Acesse: `https://github.com/vicctim/relatorios/settings/variables/actions`
2. Verifique se existe `SHARE_URL` com valor `https://arquivos.pixfilmes.com`

Se não existir, crie:
- Nome: `SHARE_URL`
- Valor: `https://arquivos.pixfilmes.com`

### 3. Forçar novo build no CI/CD

1. Acesse: `https://github.com/vicctim/relatorios/actions`
2. Clique em **"Build and Push Docker Images"**
3. Clique em **"Run workflow"**
4. Selecione branch `main`
5. Clique em **"Run workflow"**

### 4. Limpar cache do navegador

O navegador pode estar usando JavaScript em cache. Limpe o cache:
- **Chrome/Edge:** Ctrl+Shift+Delete → Limpar cache
- Ou use **Modo Anônimo** para testar

## 📝 Notas

- A variável `SHARE_URL` é injetada **durante o build** (não em runtime)
- Por isso é necessário fazer **rebuild** do container
- Se usar `docker-compose.portainer.yml`, a variável vem do `.env` local
- Se usar `docker-compose.registry.yml`, a variável vem do GitHub Variables
