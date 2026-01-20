# Guia de Deploy - Pix Filmes Relatórios

Este guia descreve o processo de deploy da aplicação em uma VPS utilizando Docker, Portainer e Nginx Proxy Manager.

## Pré-requisitos
- VPS (Ubuntu 22.04 recomendado)
- Docker e Docker Compose instalados
- Portainer instalado (opcional, mas recomendado para gerenciamento)
- Nginx Proxy Manager (NPM) instalado
- Domínio configurado (DNS apontando para a VPS)

## 1. Estrutura de Arquivos
Certifique-se de ter os seguintes arquivos na VPS (você pode clonar o repositório ou copiar via SCP):
- `docker-compose.portainer.yml` (será usado como a stack principal)
- `backend/` (código fonte e Dockerfile)
- `frontend/` (código fonte e Dockerfile)
- `.env.production` (renomear para `.env`)

## 2. Configuração de Variáveis
1. Renomeie o arquivo `.env.production` para `.env`:
   ```bash
   cp .env.production .env
   ```
2. Edite o `.env` e defina senhas seguras e chaves reais:
   ```bash
   # Gere uma chave segura para o JWT
   openssl rand -hex 32
   ```

## 3. Configuração da Rede (Network)
O Nginx Proxy Manager e a aplicação precisam compartilhar uma rede externa para se comunicarem sem expor portas no host.

1. Verifique o nome da rede do NPM:
   ```bash
   docker network ls
   ```
   (Geralmente é `npm_default` ou `proxy_network`. No nosso `docker-compose.portainer.yml`, estamos chamando de `proxy`. Se for diferente, ajuste o arquivo compose).

2. Se a rede não existir, crie:
   ```bash
   docker network create proxy
   ```

## 4. Deploy via Portainer
1. Acesse o Portainer.
2. Vá em **Stacks** -> **Add stack**.
3. Nome: `relatorios`.
4. Método: **Upload** (suba o `docker-compose.portainer.yml`) ou **Repository** (se estiver no Git).
5. **Environment variables**: Você pode carregar o `.env` aqui.
6. Clique em **Deploy the stack**.

## 5. Build das Imagens
Se estiver usando a opção "Build" no compose, o Portainer tentará buildar as imagens. Isso pode demorar na VPS.

**Alternativa recomendada (Docker Hub/Registry):**
1. Buildar as imagens localmente e subir para um registry.
2. Alterar o `image:` no docker-compose para usar as imagens do registry ao invés de `build:`.

## 6. Configuração do Nginx Proxy Manager
1. Acesse o painel do NPM (geralmente porta 81).
2. Adicione um **Proxy Host**:
   - **Domain Names**: `relatorio.pixfilmes.com`
   - **Scheme**: `http`
   - **Forward Hostname**: `relatorios-frontend` (nome do container)
   - **Forward Port**: `80`
   - **Cache Assets**: Ative se desejar.
   - **Block Common Exploits**: Ative.
   - **SSL**: Request a new SSL Certificate (Let's Encrypt). Force SSL.

3. Adicione **Custom Locations** para a API:
   - Clique em "Custom Locations".
   - **Location**: `/api`
   - **Scheme**: `http`
   - **Forward Hostname**: `relatorios-backend`
   - **Forward Port**: `3001`

4. Adicione **Custom Locations** para Uploads:
   - **Location**: `/uploads`
   - **Scheme**: `http`
   - **Forward Hostname**: `relatorios-backend`
   - **Forward Port**: `3001`

## 7. Verificação
- Acesse `https://relatorio.pixfilmes.com`
- Teste o login.
- Verifique se o upload e os relatórios funcionam.
- Monitore os logs no Portainer se houver problemas.
