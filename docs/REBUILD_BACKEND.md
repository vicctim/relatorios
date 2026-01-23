# 🔄 Como Fazer Rebuild do Backend

Guia rápido para atualizar o container do backend com as correções mais recentes.

## ⚠️ Problema Atual

O container está rodando código antigo que ainda tenta usar `/usr/bin/google-chrome-stable` ao invés de `/usr/bin/chromium`.

## 🚀 Solução: Rebuild do Container

### Opção 1: Via Portainer (Recomendado)

1. Acesse o Portainer: `http://seu-ip:9000`
2. Vá em **Stacks** → Selecione sua stack `relatorios`
3. Clique em **Editor**
4. Atualize o arquivo `docker-compose.yml` (ou use `docker-compose.registry.yml`)
5. Clique em **Update the stack**
6. Aguarde o rebuild completar

### Opção 2: Via CI/CD (Mais Rápido)

Se você está usando imagens do GitHub Container Registry:

1. **Aguarde o CI/CD completar** (já deve estar rodando após o último push)
2. No Portainer, vá em **Stacks** → Sua stack
3. Clique em **Editor**
4. **Não precisa mudar nada** - apenas clique em **Update the stack**
5. Isso vai forçar o pull da nova imagem `ghcr.io/vicctim/relatorios/backend:latest`

### Opção 3: Via Terminal (SSH no VPS)

```bash
# 1. Entrar no diretório do projeto
cd /caminho/para/relatorios

# 2. Parar o container do backend
docker stop relatorios_backend

# 3. Remover o container antigo
docker rm relatorios_backend

# 4. Fazer pull da nova imagem (se usar CI/CD)
docker pull ghcr.io/vicctim/relatorios/backend:latest

# 5. Reiniciar a stack
docker-compose -f docker-compose.registry.yml up -d backend

# Ou se usar docker-compose.yml:
docker-compose up -d backend
```

### Opção 4: Rebuild Local (se usar docker-compose.portainer.yml)

```bash
# 1. Entrar no diretório do projeto
cd /caminho/para/relatorios

# 2. Fazer rebuild apenas do backend
docker-compose -f docker-compose.portainer.yml build backend

# 3. Reiniciar o container
docker-compose -f docker-compose.portainer.yml up -d backend
```

## ✅ Verificar se Funcionou

Após o rebuild, verifique os logs:

```bash
docker logs relatorios_backend --tail 50
```

Você deve ver:
- ✅ `Server running on http://localhost:3001`
- ✅ Sem erros de Puppeteer

## 🧪 Testar Geração de PDF

1. Acesse a aplicação
2. Vá em **Relatórios**
3. Clique em **Exportar Relatório Personalizado**
4. Preencha as datas
5. (Opcional) Informe segundos acumulados manualmente
6. Clique em **Exportar PDF**

**Deve funcionar agora!** 🎉

## 🔍 Se Ainda Der Erro

Verifique se a variável de ambiente está sendo passada:

```bash
docker exec relatorios_backend env | grep PUPPETEER
```

Deve mostrar:
```
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

Se não aparecer, verifique o `docker-compose.yml` e adicione as variáveis conforme mostrado nos arquivos atualizados.
