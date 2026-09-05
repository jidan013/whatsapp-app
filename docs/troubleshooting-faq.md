# Troubleshooting & FAQ

## Bot WhatsApp tidak terkoneksi / QR tidak muncul

```bash
pm2 logs agenda-bot --lines 100
```

Jika session korup, hapus dan login ulang:

```bash
pm2 stop agenda-bot
rm -rf storage/bot-session/*
pm2 start agenda-bot
pm2 logs agenda-bot
```

## Error "ENCRYPTION_KEY harus berupa 32 byte hex"

`ENCRYPTION_KEY` di `.env` harus persis 64 karakter hex (32 byte). Generate ulang:

```bash
openssl rand -hex 32
```

## Export PDF/Excel gagal

1. Cek log: `pm2 logs agenda-web`
2. Pastikan folder `exports/` ada dan writable: `mkdir -p exports && chmod 755 exports`
3. Jika Google Drive sync gagal tapi file lokal berhasil, itu bukan error fatal -
   export tetap `COMPLETED` dengan `googleDriveFileId` kosong (lihat log warning)

## Backup gagal dengan error terkait pg_dump

Pastikan `postgresql-client` terpasang dan versi kompatibel dengan versi server
PostgreSQL:

```bash
sudo apt-get install -y postgresql-client
pg_dump --version
```

## npm install gagal karena conflict dependency

Pastikan Node.js versi 20+ (`node -v`). Jika masih gagal, coba:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Login gagal terus meski password benar

Cek apakah user memang aktif (`isActive: true`) dan sudah punya role
(`user_roles`). User tanpa role tidak akan punya permission apapun meskipun
bisa login.

## Rate limit terkena padahal request wajar

Rate limiter fail-open jika Redis tidak tersedia (request tetap diizinkan),
tapi jika Redis aktif dan limit tercapai, cek `RATE_LIMIT_MAX_REQUESTS` dan
`RATE_LIMIT_WINDOW_MS` di `.env` - naikkan jika perlu.

## Bagaimana cara pindah dari local storage ke S3/MinIO?

`lib/storage/local-storage-driver.ts` mengimplementasikan interface `StorageDriver`.
Buat implementasi baru (mis. `s3-storage-driver.ts`) yang implement interface
yang sama, lalu ganti export `storageDriver` di file tersebut berdasarkan
`STORAGE_DRIVER` env var. Tidak ada bagian lain dari aplikasi yang perlu diubah
karena semua akses storage melalui interface ini.
