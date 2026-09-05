# Installation Guide

Panduan instalasi WhatsApp Agenda System dari nol di Ubuntu Server 24.04 LTS.

## Prasyarat

- Ubuntu Server 24.04 LTS (fresh atau existing)
- Akses root/sudo
- Domain yang sudah mengarah ke IP server (untuk SSL, opsional saat development)
- Akun Google Cloud dengan Service Account untuk Google Drive API (lihat `google-drive-setup.md`)

## Instalasi Otomatis

```bash
git clone <repository-url> whatsapp-agenda-system
cd whatsapp-agenda-system
sudo ./scripts/install.sh
```

Script ini akan memasang: Node.js 20 LTS, PostgreSQL client, PM2, Nginx, Certbot,
dan seluruh dependency npm. Lihat `scripts/install.sh` untuk detail setiap langkah.

## Instalasi Manual (jika script tidak cocok dengan environment Anda)

### 1. Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
node -v  # pastikan v20.x
```

### 2. PostgreSQL

Jika PostgreSQL belum ada di server ini (mis. pakai managed database terpisah),
cukup pasang client-nya:

```bash
sudo apt-get install -y postgresql-client
```

Jika ingin PostgreSQL lokal di server yang sama:

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo -u postgres createuser --pwprompt agenda_user
sudo -u postgres createdb --owner=agenda_user whatsapp_agenda
```

### 3. PM2

```bash
sudo npm install -g pm2
```

### 4. Dependency Proyek

```bash
npm install
```

### 5. Environment Variables

```bash
cp .env.example .env
nano .env  # isi semua CHANGE_ME dengan nilai asli
```

Generate secret yang dibutuhkan:

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -hex 32      # ENCRYPTION_KEY
openssl rand -hex 24      # GOOGLE_DRIVE_WEBHOOK_TOKEN
```

### 6. Migrasi & Seed Database

```bash
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
```

### 7. Build & Deploy

```bash
./scripts/deploy.sh
```

Lihat `deployment-guide.md` untuk konfigurasi Nginx + SSL, dan `pm2-setup.md`
untuk detail proses PM2.
