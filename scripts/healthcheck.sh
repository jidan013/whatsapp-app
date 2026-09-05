#!/usr/bin/env bash
# healthcheck.sh - Cek kesehatan web app, bot, dan database
# Idempotent, read-only, aman dijalankan sesering apapun (cocok untuk cron watchdog).
set -uo pipefail

WEB_URL="${WEB_URL:-http://localhost:3000/api/health}"
BOT_URL="${BOT_URL:-http://localhost:3001/health}"

log() { echo "[healthcheck] $(date '+%Y-%m-%d %H:%M:%S') - $*"; }

FAILED=0

check_web() {
  if curl -fsS "$WEB_URL" >/dev/null 2>&1; then
    log "OK  - Web app ($WEB_URL)"
  else
    log "FAIL - Web app tidak merespons ($WEB_URL)"
    FAILED=1
  fi
}

check_bot() {
  if curl -fsS "$BOT_URL" >/dev/null 2>&1; then
    log "OK  - WhatsApp bot ($BOT_URL)"
  else
    log "FAIL - WhatsApp bot tidak merespons ($BOT_URL)"
    FAILED=1
  fi
}

check_pm2() {
  if ! command -v pm2 >/dev/null 2>&1; then
    log "SKIP - PM2 tidak ditemukan di PATH"
    return
  fi

  if pm2 describe agenda-web 2>/dev/null | grep -q "status.*online"; then
    log "OK  - PM2 process agenda-web online"
  else
    log "FAIL - PM2 process agenda-web tidak online"
    FAILED=1
  fi

  if pm2 describe agenda-bot 2>/dev/null | grep -q "status.*online"; then
    log "OK  - PM2 process agenda-bot online"
  else
    log "FAIL - PM2 process agenda-bot tidak online"
    FAILED=1
  fi
}

main() {
  check_web
  check_bot
  check_pm2

  if [[ "$FAILED" -eq 1 ]]; then
    log "Healthcheck GAGAL - ada komponen yang bermasalah."
    exit 1
  fi

  log "Semua komponen sehat."
  exit 0
}

main "$@"
