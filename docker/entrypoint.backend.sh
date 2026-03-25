#!/bin/sh
# ============================================================
# PLENIUM Backend Entrypoint
# Führt Datenbankmigrationen aus, bevor der Server startet.
# ============================================================

set -e

echo "🔄 Führe Datenbankmigrationen aus..."
cd /app/packages/db && npx prisma migrate deploy
echo "✅ Migrationen abgeschlossen."

echo "🚀 Starte PLENIUM Backend..."
exec "$@"
