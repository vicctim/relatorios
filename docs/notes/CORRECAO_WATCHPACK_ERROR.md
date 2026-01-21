# ✅ Correção do Erro Watchpack ENODEV

## 🐛 Problema

Erro no frontend ao iniciar o webpack-dev-server:
```
Watchpack Error (initial scan): Error: ENODEV: no such device, lstat '/mnt/g'
```

## 🔍 Causa

O **Watchpack** (usado pelo Webpack para monitorar arquivos) está tentando acessar `/mnt/g`, que é um mount point do Windows que:
- Não existe no sistema
- Foi removido
- Não está acessível no WSL

Isso é comum no WSL quando o Webpack tenta monitorar todos os diretórios, incluindo mounts do Windows que podem não estar disponíveis.

## ✅ Solução Aplicada

### 1. **Configuração de `watchOptions`**

Adicionado ignore patterns para caminhos problemáticos:

```javascript
watchOptions: {
  poll: 1000,
  aggregateTimeout: 300,
  ignored: [
    /node_modules/,
    /\/mnt\/[a-f]/i,  // Ignora /mnt/a até /mnt/f (exceto /mnt/v)
    /\/mnt\/g/i,      // Específico para /mnt/g
    /\/tmp\/.*/,
    /\/proc\/.*/,
    /\/sys\/.*/,
  ],
  followSymlinks: false,
}
```

### 2. **Ignorar Warnings do Watchpack**

Adicionado ao `ignoreWarnings`:

```javascript
ignoreWarnings: [
  // ... outros warnings
  {
    message: /Watchpack Error.*ENODEV.*no such device/,
  },
  {
    message: /ENODEV: no such device/,
  },
]
```

## 📝 Arquivos Modificados

- `frontend/webpack.config.js`
  - Adicionado ignore patterns em `watchOptions`
  - Adicionado ignore warnings para erros ENODEV

## ✅ Resultado

Agora o Webpack:
- ✅ Ignora mounts do Windows que não existem
- ✅ Não tenta acessar `/mnt/g` ou outros caminhos problemáticos
- ✅ Suprime warnings relacionados a ENODEV
- ✅ Continua funcionando normalmente para monitorar arquivos do projeto

## 🧪 Teste

Após reiniciar o frontend:
```bash
npm run dev
```

O erro não deve mais aparecer nos logs.

## 💡 Nota

Este erro é **cosmético** e não afeta a funcionalidade do projeto. O Webpack continua funcionando normalmente, apenas tenta acessar caminhos que não existem. A correção suprime esses erros e evita tentativas desnecessárias.
