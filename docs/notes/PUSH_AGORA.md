# 🚀 Enviar Código para GitHub - AGORA

## ✅ Você Já Fez

- ✅ Repositório criado no GitHub
- ✅ Chave SSH adicionada (ou está adicionando)
- ✅ Git configurado localmente

## 📤 Opção Mais Rápida: HTTPS

Como SSH pode ter problemas no WSL, vamos usar HTTPS:

### 1. Alterar Remote para HTTPS

```bash
git remote set-url origin https://github.com/vicctim/relatorios.git
```

### 2. Fazer Push

```bash
git push -u origin main
```

### 3. Quando Pedir Credenciais

**Username:** `vicctim`

**Password:** Use um **Personal Access Token** (não sua senha do GitHub)

### Como Criar Personal Access Token

1. Acesse: https://github.com/settings/tokens
2. Clique em **Generate new token** → **Generate new token (classic)**
3. **Note:** `relatorios-push`
4. **Expiration:** 90 dias (ou o que preferir)
5. **Select scopes:** Marque `repo` (todas as permissões de repositório)
6. Clique em **Generate token**
7. **COPIE O TOKEN** (aparece só uma vez!)
8. Cole o token quando o Git pedir a senha

## ✅ Após Push Bem-Sucedido

Você verá:
```
Enumerating objects: 127, done.
Counting objects: 100% (127/127), done.
Writing objects: 100% (127/127), done.
To https://github.com/vicctim/relatorios.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

## 🎉 Pronto!

Depois disso:
- ✅ Código no GitHub
- ✅ Hooks automáticos funcionando
- ✅ Versionamento automático ativo

## 💡 Dica

Você pode salvar o token no Git para não precisar digitar sempre:

```bash
# Configurar Git Credential Helper
git config --global credential.helper store

# Na primeira vez, ele vai pedir e salvar
# Nas próximas vezes, não vai mais pedir
```
