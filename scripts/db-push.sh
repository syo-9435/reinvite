#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "🔄 prisma db push && prisma generate..."
prisma db push && prisma generate
echo ""

echo "🔄 dev サーバーを再起動中..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
rm -f .next/dev/lock
sleep 1

nohup npm run dev > /tmp/nextjs-dev.log 2>&1 &
sleep 4

if lsof -ti:3000 > /dev/null 2>&1; then
  echo "✅ 完了 → http://localhost:3000"
else
  echo "⚠️  起動中... ログ: tail -f /tmp/nextjs-dev.log"
fi
