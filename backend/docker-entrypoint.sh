#!/bin/sh
set -e

# Executar migrations se a variável estiver definida
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "🔄 Executando migrations..."
  npm run migrate
  echo "✅ Migrations concluídas!"
fi

# Iniciar aplicação
echo "🚀 Iniciando aplicação..."
exec node dist/app.js
