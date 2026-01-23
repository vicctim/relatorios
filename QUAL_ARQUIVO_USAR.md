# 📋 Qual Arquivo Usar para Deploy na VPS?

## 🐳 Docker Compose (`.yml`)

### ✅ **Recomendado: `docker-compose.registry.yml`**

**Use quando:**
- ✅ Quer usar imagens pré-buildadas do CI/CD (mais rápido)
- ✅ Não quer buildar na VPS (economiza recursos)
- ✅ Quer sempre usar a última versão do `main`

**Como usar:**
```bash
# No Portainer:
# Compose path: docker-compose.registry.yml
```

**Vantagens:**
- ⚡ Mais rápido (não precisa buildar)
- 🔄 Sempre atualizado (usa imagens do GitHub)
- 💾 Economiza espaço e recursos na VPS

---

### 🔧 Alternativa: `docker-compose.portainer.yml`

**Use quando:**
- ✅ Quer buildar localmente na VPS
- ✅ Precisa fazer modificações customizadas
- ✅ Não quer depender do GitHub Container Registry

**Como usar:**
```bash
# No Portainer:
# Compose path: docker-compose.portainer.yml
```

**Vantagens:**
- 🔨 Build local (mais controle)
- 🛠️ Pode modificar Dockerfiles antes do build
- 🔒 Não depende de serviços externos

---

## 🔐 Arquivo de Ambiente (`.env`)

### ✅ **Use: `.env.example` como base**

**Passos:**

1. **Copiar o exemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Editar com valores de produção:**
   ```bash
   nano .env
   ```

3. **Valores obrigatórios para alterar:**

   ```env
   # Database - GERAR SENHAS SEGURAS!
   DB_ROOT_PASSWORD=<gerar-com-openssl-rand-base64-32>
   DB_PASSWORD=<gerar-com-openssl-rand-base64-32>
   
   # JWT - GERAR CHAVE SEGURA!
   JWT_SECRET=<gerar-com-openssl-rand-hex-32>
   
   # Frontend
   FRONTEND_URL=https://relatorio.pixfilmes.com
   VITE_API_URL=/api
   
   # Migrations (apenas no primeiro deploy)
   RUN_MIGRATIONS=true
   ```

4. **Gerar senhas seguras:**
   ```bash
   # JWT Secret
   openssl rand -hex 32
   
   # Senha MySQL
   openssl rand -base64 32
   ```

---

## 📝 Resumo Rápido

### Para Deploy na VPS (Recomendado):

1. **Docker Compose:** `docker-compose.registry.yml`
2. **Arquivo .env:** Criar a partir de `.env.example`

### Comandos Rápidos:

```bash
# 1. Clonar repositório
cd /opt
git clone https://github.com/vicctim/relatorios.git
cd relatorios

# 2. Criar .env
cp .env.example .env
nano .env  # Editar com valores de produção

# 3. No Portainer:
# - Repository: https://github.com/vicctim/relatorios.git
# - Compose path: docker-compose.registry.yml
# - Adicionar variáveis do .env
```

---

## 🔍 Comparação

| Aspecto | `docker-compose.registry.yml` | `docker-compose.portainer.yml` |
|---------|------------------------------|-------------------------------|
| **Velocidade** | ⚡ Muito rápido | 🐌 Mais lento (build local) |
| **Recursos** | 💾 Economiza | 💻 Usa mais CPU/RAM |
| **Atualização** | 🔄 Automática (CI/CD) | 🔨 Manual (git pull + rebuild) |
| **Dependências** | 🌐 Precisa GitHub | ✅ Tudo local |
| **Recomendado** | ✅ **SIM** | ⚠️ Apenas se necessário |

---

## ✅ Checklist Final

- [ ] Escolhido `docker-compose.registry.yml` (recomendado)
- [ ] Criado `.env` a partir de `.env.example`
- [ ] Gerado senhas seguras para DB e JWT
- [ ] Configurado `FRONTEND_URL` corretamente
- [ ] Definido `RUN_MIGRATIONS=true` no primeiro deploy
- [ ] Adicionado todas as variáveis no Portainer

---

**🎯 Recomendação Final:** Use `docker-compose.registry.yml` + `.env` (criado a partir de `.env.example`)
