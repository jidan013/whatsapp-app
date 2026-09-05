#!/usr/bin/env bash
# install.sh - Setup awal WhatsApp Agenda System di Ubuntu Server 24.04 LTS
# Idempotent: aman dijalankan berulang kali.
set -euo pipefail

log() { echo "[install] $(date '+%Y-%m-%d %H:%M:%S') - $*"; }
fail() { echo "[install] ERROR: $*" >&2; exit 1; }

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    fail "Script ini harus dijalankan sebagai root (gunakan sudo)."
  fi
}

check_ubuntu_version() {
  if ! grep -q "24.04" /etc/os-release 2>/dev/null; then
    log "PERINGATAN: Script ini didesain untuk Ubuntu 24.04 LTS. OS Anda mungkin berbeda."
  fi
}

install_node() {
  if command -v node >/dev/null 2>&1 && [[ "$(node -v | cut -d. -f1 | tr -d v)" -ge 20 ]]; then
    log "Node.js sudah terpasang: $(node -v)"
    return
  fi
  log "Memasang Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  command -v node >/dev/null 2>&1 || fail "Instalasi Node.js gagal"
  log "Node.js terpasang: $(node -v)"
}

install_system_packages() {
  log "Update package list..."
  apt-get update -y

  log "Memasang dependency sistem (postgresql-client, build-essential, git, nginx, certbot)..."
  apt-get install -y \
    postgresql-client \
    build-essential \
    git \
    curl \
    unzip \
    nginx \
    certbot \
    python3-certbot-nginx \
    || fail "Gagal memasang package sistem"
}

install_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    log "PM2 sudah terpasang: $(pm2 -v)"
    return
  fi
  log "Memasang PM2 global..."
  npm install -g pm2 || fail "Gagal memasang PM2"
}

install_project_dependencies() {
  log "Memasang dependency proyek (npm install)..."
  npm install || fail "npm install gagal"
}

setup_env_file() {
  if [[ -f .env ]]; then
    log ".env sudah ada, dilewati (tidak menimpa)."
    return
  fi
  if [[ ! -f .env.example ]]; then
    fail ".env.example tidak ditemukan"
  fi
  cp .env.example .env
  log ".env dibuat dari .env.example — WAJIB isi credential asli sebelum deploy!"
}

create_runtime_directories() {
  log "Membuat direktori runtime (storage, uploads, exports, backup, logs)..."
  mkdir -p storage/local storage/bot-session uploads exports backup logs
}

main() {
  require_root
  check_ubuntu_version
  install_system_packages
  install_node
  install_pm2
  install_project_dependencies
  setup_env_file
  create_runtime_directories

  log "Instalasi selesai. Langkah selanjutnya:"
  log "  1. Edit .env dengan credential asli"
  log "  2. Jalankan: npx prisma migrate deploy"
  log "  3. Jalankan: npm run prisma:seed"
  log "  4. Jalankan: ./scripts/deploy.sh"
}

main "$@"
