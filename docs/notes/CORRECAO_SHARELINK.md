# ✅ Correção do Erro ShareLink.custom_slug

## 🔍 Problema Identificado

O erro `Unknown column 'ShareLink.custom_slug' in 'field list'` ocorria porque:

1. ✅ A coluna existe no banco como `custom_slug` (snake_case)
2. ✅ O modelo usa `customSlug` (camelCase)
3. ✅ O Sequelize com `underscored: true` converte automaticamente
4. ⚠️ **Mas o modelo pode ter cache antigo**

## ✅ Solução Aplicada

1. **Modelo ajustado** - `backend/src/models/ShareLink.ts`
   - Removido `underscored: false` (usa config global)
   - Campo `customSlug` mapeia corretamente para `custom_slug`

2. **Teste confirmado** - O Sequelize faz o mapeamento correto:
   ```sql
   SELECT `custom_slug` AS `customSlug` FROM `share_links`
   ```

## 🔄 Próximo Passo

**Reinicie o backend** para limpar o cache do Sequelize:

```bash
# Parar backend atual
npm run stop

# Ou manualmente:
pkill -f 'ts-node-dev.*app.ts'

# Reiniciar
npm run dev
```

## ✅ Após Reiniciar

O erro deve desaparecer e os links de compartilhamento devem funcionar normalmente.

## 🧪 Teste

Após reiniciar, teste criar um link de compartilhamento:
1. Acesse a funcionalidade de compartilhamento
2. Crie um novo link
3. Verifique se funciona sem erros
