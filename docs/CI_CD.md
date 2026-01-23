# 🚀 CI/CD com GitHub Actions

Este projeto usa GitHub Actions para construir e publicar imagens Docker automaticamente no GitHub Container Registry (ghcr.io).

## 📋 Visão Geral

O workflow `.github/workflows/docker-build.yml` é acionado automaticamente quando:
- Push para branch `main`
- Criação de tags (ex: `v1.0.0`)
- Pull requests (apenas build, sem push)
- Execução manual via `workflow_dispatch`

## 🐳 Imagens Publicadas

As imagens são publicadas no GitHub Container Registry:

- **Backend:** `ghcr.io/vicctim/relatorios/backend:latest`
- **Frontend:** `ghcr.io/vicctim/relatorios/frontend:latest`

### Tags Disponíveis

- `latest` - Última versão da branch main
- `main-<sha>` - Build específico por commit SHA
- `v1.0.0` - Versões semânticas (quando você cria uma tag)

## 🔐 Autenticação

### Para Pull das Imagens na VPS

1. **Criar Personal Access Token (PAT):**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token (classic)
   - Permissões: `read:packages`
   - Copiar o token

2. **Login no Docker (na VPS):**
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u vicctim --password-stdin
   ```

   Ou manualmente:
   ```bash
   docker login ghcr.io
   # Username: vicctim
   # Password: <seu-token>
   ```

3. **Pull das imagens:**
   ```bash
   docker pull ghcr.io/vicctim/relatorios/backend:latest
   docker pull ghcr.io/vicctim/relatorios/frontend:latest
   ```

### Para Builds Automáticos

O GitHub Actions usa automaticamente `GITHUB_TOKEN` (não precisa configurar nada).

## 📦 Usando as Imagens no Deploy

### Opção 1: Usar docker-compose.registry.yml (Recomendado)

Este arquivo já está configurado para usar as imagens do registry:

```bash
# Na VPS
cd /opt/relatorios
docker compose -f docker-compose.registry.yml up -d
```

**No Portainer:**
1. Stacks → Add stack
2. Repository: `https://github.com/vicctim/relatorios.git`
3. Compose path: `docker-compose.registry.yml`
4. Deploy

### Opção 2: Atualizar docker-compose.portainer.yml

Se preferir usar o arquivo original, substitua as seções `build:` por `image:`:

```yaml
backend:
  image: ghcr.io/vicctim/relatorios/backend:latest
  # Remover a seção 'build:'
  
frontend:
  image: ghcr.io/vicctim/relatorios/frontend:latest
  # Remover a seção 'build:'
```

## 🔄 Atualizar Imagens

### Atualização Automática

Toda vez que você faz push para `main`, novas imagens são buildadas e publicadas automaticamente.

### Atualização Manual na VPS

```bash
# Fazer login (se ainda não fez)
docker login ghcr.io

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

## 🏷️ Versionamento

### Criar uma Versão

```bash
# Criar tag
git tag v1.0.0
git push origin v1.0.0
```

Isso vai:
1. Acionar o workflow
2. Buildar as imagens
3. Publicar com tag `v1.0.0`

### Usar Versão Específica

No `docker-compose.registry.yml`, altere:

```yaml
backend:
  image: ghcr.io/vicctim/relatorios/backend:v1.0.0
  
frontend:
  image: ghcr.io/vicctim/relatorios/frontend:v1.0.0
```

## 📊 Monitoramento

### Ver Builds

1. GitHub → Actions
2. Veja o histórico de builds
3. Clique em um build para ver logs detalhados

### Ver Imagens Publicadas

1. GitHub → Seu repositório → Packages (lado direito)
2. Veja todas as imagens publicadas
3. Clique para ver detalhes e tags

## 🐛 Troubleshooting

### Erro: "unauthorized: authentication required"

**Solução:** Fazer login no Docker:
```bash
docker login ghcr.io
```

### Erro: "pull access denied"

**Solução:** Verificar se o repositório é público ou se você tem acesso. Se for privado, precisa do PAT.

### Imagens não atualizam

**Solução:** Forçar pull:
```bash
docker pull ghcr.io/vicctim/relatorios/backend:latest --force
```

### Build falha no GitHub Actions

**Verificar:**
1. Logs do workflow em Actions
2. Dockerfile sem erros
3. Dependências corretas no package.json

## 🔒 Segurança

- As imagens são privadas por padrão (se o repositório for privado)
- Use PATs com permissões mínimas necessárias
- Revise os Dockerfiles regularmente
- Mantenha as dependências atualizadas

## 📝 Checklist de Deploy com CI/CD

- [ ] Workflow configurado e funcionando
- [ ] Imagens publicadas no ghcr.io
- [ ] PAT criado para pull na VPS
- [ ] Login no Docker configurado na VPS
- [ ] docker-compose.registry.yml configurado
- [ ] Stack deployada no Portainer
- [ ] Containers rodando com imagens do registry
- [ ] Testes funcionando

---

**✅ CI/CD configurado e pronto para uso!**
