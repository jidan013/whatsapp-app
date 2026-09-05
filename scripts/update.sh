#!/usr/bin/env bash
# update.sh - Update aplikasi ke versi terbaru (git pull + migrate + rebuild + reload)
# Idempotent: aman dijalankan berulang, tidak melakukan apa-apa jika sudah up to date.
set -euo pipefail

log() { echo "[update] $(date '+%Y-%m-%d %H:%M:%S') - $*"; }
fail() { echo "[update] ERROR: $*" >&2; exit 1; }

check_git_clean() {
  if [[ -n "$(git status --porcelain)" ]]; then
    fail "Ada perubahan lokal yang belum di-commit. Commit atau stash dulu sebelum update."
  fi
}

pull_latest() {
  log "Mengambil kode terbaru dari git..."
  git pull --ff-only || fail "git pull gagal (kemungkinan ada divergent history, resolve manual)"
}

backup_before_update() {
  log "Membuat backup sebelum update (jaga-jaga)..."
  ./scripts/backup.sh FULL || fail "Backup pra-update gagal, update dibatalkan demi keamanan"
}

main() {
  check_git_clean
  backup_before_update
  pull_latest

  log "Menjalankan ulang proses deploy..."
  ./scripts/deploy.sh

  log "Update selesai."
}

main "$@"
