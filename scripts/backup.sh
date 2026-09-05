#!/usr/bin/env bash
# backup.sh - Trigger backup manual dari command line (mis. via crontab tambahan atau operator manual)
# Idempotent secara alami: setiap eksekusi membuat backup baru dengan timestamp unik.
set -euo pipefail

log() { echo "[backup] $(date '+%Y-%m-%d %H:%M:%S') - $*"; }
fail() { echo "[backup] ERROR: $*" >&2; exit 1; }

BACKUP_TYPE="${1:-FULL}"

case "$BACKUP_TYPE" in
  FULL|DATABASE_ONLY|FILES_ONLY) ;;
  *) fail "Tipe backup tidak valid: $BACKUP_TYPE (gunakan FULL, DATABASE_ONLY, atau FILES_ONLY)" ;;
esac

[[ -f .env ]] || fail ".env tidak ditemukan"
[[ -d dist/bot ]] || fail "Bot belum di-build. Jalankan: npm run bot:build"

log "Menjalankan backup tipe: $BACKUP_TYPE"

node -e "
const { backupService } = require('./dist/bot/server/backup/backup.service.js');
backupService.runBackup({ type: '$BACKUP_TYPE', isAutomatic: false })
  .then((result) => {
    console.log('Backup selesai:', result.status, result.filePath ?? '');
    process.exit(result.status === 'COMPLETED' ? 0 : 1);
  })
  .catch((err) => {
    console.error('Backup gagal:', err);
    process.exit(1);
  });
" || fail "Eksekusi backup gagal"

log "Backup selesai."
