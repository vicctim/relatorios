# 🚀 Comando para Enviar ao GitHub

## ✅ Status

- ✅ Git inicializado
- ✅ Remote configurado: `git@github.com:vicctim/relatorios.git`
- ✅ Commit inicial criado (127 arquivos)
- ✅ Hooks configurados

## 📤 Enviar Código

Execute este comando:

```bash
git push -u origin main
```

## 🔐 Autenticação

### Se usar SSH (recomendado):

Se der erro de autenticação, configure SSH key:

```bash
# Verificar se tem chave
ls -la ~/.ssh/id_ed25519.pub

# Se não tiver, criar:
ssh-keygen -t ed25519 -C "victorsamuel@outlook.com"
# Pressione Enter para aceitar local padrão
# Pressione Enter para senha vazia (ou defina uma)

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar no GitHub:
# 1. Acesse: https://github.com/settings/keys
# 2. Clique em "New SSH key"
# 3. Título: "WSL Development"
# 4. Cole a chave pública
# 5. Clique em "Add SSH key"

# Testar
ssh -T git@github.com
# Deve mostrar: "Hi vicctim! You've successfully authenticated..."
```

### Se usar HTTPS:

```bash
# Alterar para HTTPS
git remote set-url origin https://github.com/vicctim/relatorios.git

# Fazer push
git push -u origin main

# Quando pedir credenciais:
# Username: vicctim
# Password: Use Personal Access Token (não sua senha)
```

**Criar Personal Access Token:**
1. https://github.com/settings/tokens
2. Generate new token (classic)
3. Nome: `relatorios-local`
4. Marque `repo` (todas)
5. Generate e COPIE o token
6. Use como senha

## ✅ Após Push Bem-Sucedido

Você verá:
```
Enumerating objects: ...
Counting objects: 100% (...)
Writing objects: 100% (...)
To github.com:vicctim/relatorios.git
 * [new branch]      main -> main
```

## 🎉 Pronto!

Depois disso, os hooks automáticos vão funcionar em cada commit!
