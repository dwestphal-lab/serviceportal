#!/bin/bash
# ============================================================
# PLENIUM — Poll & Deploy Script
# ============================================================
# Läuft per Cron jede Minute.
# Prüft ob GitHub neue Commits hat — falls ja: deploy.sh.
#
# Installation (als plenium-User, crontab -e):
#   * * * * * /opt/plenium/scripts/poll-and-deploy.sh develop >> /opt/plenium/logs/develop.log 2>&1
#   * * * * * /opt/plenium/scripts/poll-and-deploy.sh prod    >> /opt/plenium/logs/prod.log    2>&1
# ============================================================

ENVIRONMENT=${1:-}
REPO_DIR="/opt/plenium/repo"
LOCK_FILE="/tmp/plenium-deploy-${ENVIRONMENT}.lock"
DEPLOY_SCRIPT="/opt/plenium/scripts/deploy.sh"

# ── Umgebung → Branch ────────────────────────────────────────────────────────

case "$ENVIRONMENT" in
  develop) BRANCH="develop" ;;
  prod)    BRANCH="main"    ;;
  *)
    echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: Unbekannte Umgebung '$ENVIRONMENT'"
    echo "$(date '+%Y-%m-%d %H:%M:%S') Erlaubte Werte: develop | prod"
    exit 1
    ;;
esac

# ── Lock: verhindert parallele Ausführung ────────────────────────────────────
# Falls noch ein Deployment läuft (z.B. langer Build), nichts tun.

if [ -f "$LOCK_FILE" ]; then
  # Lock-Datei älter als 30 Minuten → Deployment hängt, Lock entfernen
  if [ "$(find "$LOCK_FILE" -mmin +30)" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') WARNUNG: Alten Lock entfernt (> 30 Min.)"
    rm -f "$LOCK_FILE"
  else
    exit 0  # Deployment läuft noch, abwarten
  fi
fi

# Lock setzen, bei Scriptende automatisch entfernen
touch "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

# ── GitHub-Stand prüfen ───────────────────────────────────────────────────────

cd "$REPO_DIR"

# Metadaten von GitHub holen (nur Commit-Hash, kein Checkout)
git fetch origin "$BRANCH" --quiet 2>/dev/null

LOCAL_HASH=$(git rev-parse "refs/heads/$BRANCH" 2>/dev/null || echo "none")
REMOTE_HASH=$(git rev-parse "origin/$BRANCH" 2>/dev/null)

# Kein Update nötig
if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
  exit 0
fi

# ── Neuer Commit gefunden → Deployen ─────────────────────────────────────────

SHORT_HASH="${REMOTE_HASH:0:8}"
echo "$(date '+%Y-%m-%d %H:%M:%S') Neuer Commit auf $BRANCH ($SHORT_HASH) — starte Deployment..."

"$DEPLOY_SCRIPT" "$ENVIRONMENT"

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') ✓ Deployment $ENVIRONMENT abgeschlossen ($SHORT_HASH)"
else
  echo "$(date '+%Y-%m-%d %H:%M:%S') ✗ Deployment $ENVIRONMENT FEHLGESCHLAGEN (Exit $EXIT_CODE)"
fi

exit $EXIT_CODE
