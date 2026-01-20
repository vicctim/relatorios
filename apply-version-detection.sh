#!/bin/bash
set -e

echo "Aplicando melhorias de detecção de versões..."

# 1. Atualizar imports (adicionar Clock e GitBranch)
sed -i '4s/Check/Check, Clock, GitBranch/' frontend/src/pages/Upload.tsx

# 2. Atualizar interface VideoFormData
sed -i '/interface VideoFormData {/,/^}/ {
  /isOpen: boolean;/a\
  isVersion: boolean;\
  originalVideoIndex: number | null;\
  customDurationSeconds: string;
}' frontend/src/pages/Upload.tsx

echo "Mudanças aplicadas com sucesso!"
echo "Próximos passos manuais necessários:"
echo "1. Adicionar função detectVersion()"
echo "2. Modificar onDrop callback"
echo "3. Adicionar campos de duração no formulário"
echo "4. Atualizar handleSubmitAll"
