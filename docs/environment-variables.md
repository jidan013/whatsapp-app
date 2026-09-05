# Environment Variables Reference

Referensi lengkap semua environment variable. Sumber kebenaran adalah `.env.example` -
dokumen ini menjelaskan maksud setiap variabel.

| Variabel | Wajib? | Deskripsi |
|---|---|---|
| `NODE_ENV` | Ya | `development` atau `production` |
| `APP_URL` | Ya | Base URL aplikasi (untuk link di notifikasi, dll) |
| `DATABASE_URL` | Ya | Connection string PostgreSQL (dipakai runtime) |
| `DIRECT_DATABASE_URL` | Ya | Connection string langsung tanpa pooler (dipakai migrasi & pg_dump) |
| `AUTH_SECRET` | Ya | Secret untuk signing JWT session Auth.js. Generate: `openssl rand -base64 32` |
| `AUTH_URL` | Ya (production) | URL publik aplikasi untuk callback Auth.js |
| `ENCRYPTION_KEY` | Ya (jika backup aktif) | 32-byte hex untuk enkripsi backup AES-256-GCM. Generate: `openssl rand -hex 32` |
| `REDIS_URL` | Ya | Untuk rate limiting dan koordinasi antar proses |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Ya (jika pakai Google Drive) | Lihat `google-drive-setup.md` |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Ya (jika pakai Google Drive) | Lihat `google-drive-setup.md` |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | Ya (jika pakai Google Drive) | Folder tujuan semua upload/export/backup |
| `GOOGLE_DRIVE_WEBHOOK_TOKEN` | Tidak | Hanya jika pakai push notification webhook |
| `BOT_SESSION_DIR` | Tidak | Default `./storage/bot-session` |
| `BOT_ADMIN_NUMBERS` | Tidak | Nomor admin bot, pisah koma, format internasional tanpa `+` |
| `STORAGE_DRIVER` | Tidak | Saat ini hanya `local` yang diimplementasikan |
| `STORAGE_LOCAL_PATH` | Tidak | Default `./storage/local` |
| `MAX_UPLOAD_SIZE_MB` | Tidak | Default 50 |
| `ALLOWED_UPLOAD_MIME_TYPES` | Tidak | Daftar mime type yang diizinkan, pisah koma |
| `BACKUP_DIR` | Tidak | Default `./backup` |
| `BACKUP_CRON_SCHEDULE` | Tidak | Format cron, default `0 2 * * *` (jam 2 pagi setiap hari) |
| `BACKUP_RETENTION_DAYS` | Tidak | Default 30 hari |
| `BACKUP_ENCRYPT` | Tidak | Default `true` |
| `EXPORT_DIR` | Tidak | Default `./exports` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Hanya saat seed pertama kali | Membuat akun admin awal |
| `EMAIL_ENABLED` | Tidak | Default `false` (fitur opsional sesuai spesifikasi) |

Variabel dengan nilai default `CHANGE_ME_*` di `.env.example` wajib diganti
sebelum deploy ke production. Aplikasi akan melempar error saat runtime jika
variabel yang wajib tidak diisi dengan benar (lihat validasi di masing-masing
service, mis. `server/backup/backup.service.ts` untuk `ENCRYPTION_KEY`).
