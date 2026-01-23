# 🌐 Tornar Imagens Docker Públicas

As imagens Docker são configuradas para serem tornadas públicas automaticamente pelo workflow do GitHub Actions. No entanto, se isso não funcionar automaticamente, você pode torná-las públicas manualmente.

## 🔄 Automático (Via Workflow)

O workflow `.github/workflows/docker-build.yml` tenta tornar as imagens públicas automaticamente após cada push. Isso acontece nos steps:
- `Make backend image public`
- `Make frontend image public`

## 📝 Manual (Via Interface do GitHub)

Se o workflow não conseguir tornar as imagens públicas automaticamente, siga estes passos:

### 1. Acessar Packages

1. Acesse: https://github.com/vicctim?tab=packages
2. Ou vá em: Seu perfil → **Packages** (no menu lateral)

### 2. Tornar Backend Público

1. Clique no pacote `relatorios-backend`
2. Vá em **Package settings** (no menu lateral)
3. Role até a seção **Danger Zone**
4. Clique em **Change visibility**
5. Selecione **Public**
6. Confirme digitando o nome do pacote

### 3. Tornar Frontend Público

1. Clique no pacote `relatorios-frontend`
2. Repita os mesmos passos acima

## ✅ Verificar se Está Público

Após tornar público, você pode verificar:

1. Acesse a página do pacote
2. Deve aparecer um badge **Public** no topo
3. Qualquer pessoa pode fazer pull sem autenticação:

```bash
docker pull ghcr.io/vicctim/relatorios/backend:latest
docker pull ghcr.io/vicctim/relatorios/frontend:latest
```

## 🔒 Se Precisar Tornar Privado Novamente

Siga os mesmos passos acima, mas selecione **Private** ao invés de **Public**.

## 📊 Benefícios de Imagens Públicas

- ✅ Não precisa fazer login no Docker para pull
- ✅ Mais fácil para deploy em VPS
- ✅ Pode compartilhar imagens com outros desenvolvedores
- ✅ Reduz configuração no CI/CD

## ⚠️ Considerações de Segurança

- As imagens públicas podem ser baixadas por qualquer pessoa
- Não inclua informações sensíveis nas imagens (use variáveis de ambiente)
- O código fonte já está público no GitHub, então as imagens também podem ser públicas

---

**Nota:** Se você quiser manter as imagens privadas, remova os steps `Make * image public` do workflow.
