#!/usr/bin/env bash
set -euo pipefail
DEPLOY_DIR="/srv/clientes/pixfilmes/relatorios"
cd "$DEPLOY_DIR"
echo "[redeploy] Pull do repositório..."
git pull origin main
echo "[redeploy] Pull das imagens..."
docker compose pull backend frontend
echo "[redeploy] Subindo containers atualizados..."
docker compose up -d


echo "[redeploy] Concluído."
docker compose ps --format "table {{.Name}}\t{{.Status}}"
