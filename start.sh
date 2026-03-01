#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "🚀 Iniciando Cortex Flow Frontend..."

if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependências..."
  npm install
fi

npm run dev
