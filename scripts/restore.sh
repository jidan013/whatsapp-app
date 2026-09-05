#!/usr/bin/env bash
# restore.sh - Restore dari file backup terenkripsi
# TIDAK idempotent secara sengaja (restore = operasi destruktif), karena itu ada konfirmasi wajib.
set -euo pipefail

log() { echo "[restore] $(date '+%Y-%m-%d %H:%M:%S') - $*"; }
fail() { echo "[restore] ERROR: $*" >&2; exit 1; }

BACKUP_FILE="${1:-}"

[[ -n "$BACKUP_FILE" ]] || fail "Penggunaan: ./scripts/restore.sh <path-ke-file-backup>"
[[ -f "$BACKUP_FILE" ]] || fail "File backup tidak ditemukan: $BACKUP_FILE"
[[ -f .env ]] || fail ".env tidak ditemukan"
[[ -d dist/bot ]] || fail "Bot belum di-build. Jalankan: npm run bot:build"

echo "=============================================="
echo "  PERINGATAN: RESTORE AKAN MENIMPA DATA SAAT INI"
echo "=============================================="
echo "File backup: $BACKUP_FILE"
read -r -p "Ketik 'RESTORE' (huruf besar) untuk melanjutkan: " CONFIRMATION

if [[ "$CONFIRMATION" != "RESTORE" ]]; then
  log "Restore dibatalkan oleh operator."
  exit 0
fi

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

log "Mendekripsi backup..."
node -e "
const fs = require('fs');
const { decryptBuffer } = require('./dist/bot/server/backup/backup.service.js');
const encrypted = fs.readFileSync('$BACKUP_FILE');
const decrypted = decryptBuffer(encrypted);
fs.writeFileSync('$TMP_DIR/decrypted.bin', decrypted);
" || fail "Dekripsi backup gagal - cek ENCRYPTION_KEY di .env"

log "Backup berhasil didekripsi ke $TMP_DIR/decrypted.bin"
log "Untuk full/database backup, restore manual dengan:"
log "  pg_restore --clean --if-exists --dbname=\$DATABASE_URL $TMP_DIR/decrypted.bin"
log "(Langkah ini sengaja tidak dijalankan otomatis untuk mencegah restore ke database yang salah.)"
log "Jika ini backup FILES_ONLY/FULL, ekstrak sebagai zip dan salin ke storage/local secara manual setelah verifikasi."

log "Restore preparation selesai."
