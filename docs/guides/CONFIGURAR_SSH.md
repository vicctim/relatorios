# 🔐 Configurar SSH para GitHub

## ✅ Passo 1: Adicionar Chave no GitHub

Você já está fazendo isso! Na tela do GitHub:

1. **Title:** `relatorios` ✅
2. **Key type:** `Authentication Key` ✅  
3. **Key:** Sua chave SSH ✅
4. **Clique em:** `Add SSH key` ⬅️ **FAÇA ISSO AGORA**

## 🔧 Passo 2: Adicionar Chave ao SSH Agent (WSL)

Após adicionar no GitHub, execute no WSL:

```bash
# Iniciar ssh-agent
eval $(ssh-agent -s)

# Adicionar chave
ssh-add ~/.ssh/id_ed25519

# Se der erro, tente:
ssh-add ~/.ssh/id_rsa
```

## ✅ Passo 3: Testar Conexão

```bash
ssh -T git@github.com
```

**Deve mostrar:**
```
Hi vicctim! You've successfully authenticated, but GitHub does not provide shell access.
```

## 📤 Passo 4: Fazer Push

```bash
cd '/mnt/v/_VICTOR/Site/Pix Filmes/relatorios'
git push -u origin main
```

## 🐛 Se Ainda Der Erro

### Verificar Chave Pública

```bash
# Ver qual chave você tem
ls -la ~/.ssh/

# Mostrar chave pública
cat ~/.ssh/id_ed25519.pub
# ou
cat ~/.ssh/id_rsa.pub
```

**Certifique-se que a chave no GitHub é EXATAMENTE a mesma!**

### Verificar Permissões

```bash
# Corrigir permissões
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

### Alternativa: Usar HTTPS

Se SSH continuar dando problema:

```bash
# Alterar para HTTPS
git remote set-url origin https://github.com/vicctim/relatorios.git

# Fazer push
git push -u origin main

# Quando pedir credenciais:
# Username: vicctim
# Password: Personal Access Token (não sua senha)
```

## ✅ Checklist

- [ ] Chave SSH adicionada no GitHub (clicou em "Add SSH key")
- [ ] ssh-agent rodando
- [ ] Chave adicionada ao ssh-agent
- [ ] Teste `ssh -T git@github.com` funcionando
- [ ] Push executado com sucesso
