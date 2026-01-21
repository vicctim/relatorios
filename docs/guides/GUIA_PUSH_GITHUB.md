# 🚀 Guia para Enviar Código ao GitHub

## ✅ Status Atual

- ✅ Repositório Git inicializado
- ✅ Remote configurado: `git@github.com:vicctim/relatorios.git`
- ✅ Commit inicial criado
- ✅ Hooks Git configurados

## 📤 Enviar para GitHub

### Opção 1: SSH (Recomendado)

Se você já tem SSH key configurada:

```bash
git push -u origin main
```

**Se der erro de autenticação SSH**, configure a chave:

```bash
# Verificar se tem SSH key
ls -la ~/.ssh/id_rsa.pub

# Se não tiver, criar:
ssh-keygen -t ed25519 -C "victorsamuel@outlook.com"

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar no GitHub:
# 1. Acesse: https://github.com/settings/keys
# 2. Clique em "New SSH key"
# 3. Cole a chave pública
# 4. Salve

# Testar conexão
ssh -T git@github.com
```

### Opção 2: HTTPS (Alternativa)

Se SSH não funcionar:

```bash
# Alterar remote para HTTPS
git remote set-url origin https://github.com/vicctim/relatorios.git

# Enviar código
git push -u origin main
```

**Quando pedir credenciais:**
- **Username:** `vicctim`
- **Password:** Use um **Personal Access Token** (não sua senha)

### Como Criar Personal Access Token

1. Acesse: https://github.com/settings/tokens
2. Clique em **Generate new token** → **Generate new token (classic)**
3. **Note:** `relatorios-local`
4. **Expiration:** Escolha um prazo (ex: 90 dias)
5. **Select scopes:** Marque `repo` (todas as permissões)
6. Clique em **Generate token**
7. **COPIE O TOKEN** (só aparece uma vez!)
8. Use o token como senha quando o Git pedir

## 🔍 Verificar

```bash
# Ver remote
git remote -v

# Ver status
git status

# Ver último commit
git log --oneline -1
```

## ✅ Após o Push Bem-Sucedido

Você verá algo como:
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
Writing objects: 100% (X/X), done.
To github.com:vicctim/relatorios.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

## 🎉 Próximos Passos

Depois do push, os **hooks automáticos** vão funcionar:

### Próximo Commit

```bash
# Fazer mudanças no código
# ...

# Adicionar e commitar
git add .
git commit -m "feat: adiciona nova funcionalidade"

# O que acontece automaticamente:
# ✅ Pre-commit: Valida código (não bloqueia se houver avisos)
# ✅ Post-commit: Atualiza CHANGELOG.md
# ✅ Post-commit: Envia para GitHub automaticamente
```

## 🐛 Troubleshooting

### Erro: "Permission denied (publickey)"

**Solução:** Configure SSH key (veja Opção 1 acima)

### Erro: "Authentication failed"

**Solução:** Use Personal Access Token (veja Opção 2 acima)

### Erro: "Repository not found"

**Solução:** Verifique se:
- Repositório existe no GitHub
- Você tem permissão de escrita
- Nome do repositório está correto: `vicctim/relatorios`

### Erro: "Updates were rejected"

**Solução:** Se alguém já fez push:
```bash
git pull origin main --rebase
git push -u origin main
```

## ✅ Checklist

- [ ] SSH key configurada OU Personal Access Token criado
- [ ] Remote verificado: `git remote -v`
- [ ] Push executado: `git push -u origin main`
- [ ] Código visível no GitHub
- [ ] Hooks funcionando (teste com próximo commit)

## 🎉 Pronto!

Após o push bem-sucedido, seu repositório estará:
- ✅ Sincronizado com GitHub
- ✅ Hooks automáticos ativos
- ✅ Versionamento automático funcionando
- ✅ Pronto para desenvolvimento!
