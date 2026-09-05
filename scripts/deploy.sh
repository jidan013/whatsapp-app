#!/usr/bin/env bash
# deploy.sh - Build dan deploy WhatsApp Agenda System via PM2
# Idempotent: aman dijalankan berulang kali (restart proses yang sudah ada, bukan duplikat).
set -euo pipefail

log() { echo "[deploy] $(date '+%Y-%m-%d %H:%M:%S') - $*"; }
fail() { echo "[deploy] ERROR: $*" >&2; exit 1; }

check_env_file() {
  [[ -f .env ]] || fail ".env tidak ditemukan. Jalankan ./scripts/install.sh terlebih dahulu."
}

run_typecheck_and_lint() {
  log "Menjalankan typecheck..."
  npm run typecheck || fail "Typecheck gagal, deploy dibatalkan"

  log "Menjalankan lint..."
  npm run lint || fail "Lint gagal, deploy dibatalkan"
}

run_migrations() {
  log "Menjalankan migrasi database (prisma migrate deploy)..."
  npx prisma migrate deploy || fail "Migrasi database gagal"
}

build_web() {
  log "Build Next.js (production)..."
  npm run build || fail "Build Next.js gagal"
}

build_bot() {
  log "Build WhatsApp bot..."
  npm run bot:build || fail "Build bot gagal"
}

deploy_pm2() {
  log "Deploy via PM2..."
  if pm2 describe agenda-web >/dev/null 2>&1; then
    pm2 reload ecosystem.config.js --update-env
  else
    pm2 start ecosystem.config.js
  fi
  pm2 save || log "PERINGATAN: pm2 save gagal (startup script mungkin belum di-generate, lihat 'pm2 startup')"
}

main() {
  check_env_file
  run_typecheck_and_lint
  run_migrations
  build_web
  build_bot
  deploy_pm2

  log "Deploy selesai. Cek status dengan: pm2 status"
  log "Cek log dengan: pm2 logs agenda-web / pm2 logs agenda-bot"
}

main "$@"
