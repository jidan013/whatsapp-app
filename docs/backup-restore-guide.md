# Backup & Restore Guide

## Cara Kerja Backup

Backup dijalankan oleh proses `agenda-bot` (bukan `agenda-web`) lewat cron
scheduler internal (`bot/scheduler.ts`), supaya hanya berjalan sekali meskipun
ada beberapa instance Next.js.

Tiga tipe backup didukung:
- `FULL` — database (`pg_dump --format=custom`) + seluruh file di storage lokal, dizip jadi satu
- `DATABASE_ONLY` — hanya `pg_dump`
- `FILES_ONLY` — hanya zip folder `storage/local`

Semua backup dienkripsi dengan AES-256-GCM (kecuali `BACKUP_ENCRYPT=false` di `.env`)
sebelum disimpan ke `backup/` dan disinkronkan ke Google Drive.

## Jadwal

Diatur lewat `BACKUP_CRON_SCHEDULE` di `.env` (format cron standar), default
`0 2 * * *` (setiap hari jam 2 pagi). Pembersihan backup lama (lebih dari
`BACKUP_RETENTION_DAYS`) berjalan setiap hari jam 3 pagi.

## Backup Manual

Lewat dashboard: buka halaman Backup, klik salah satu tombol tipe backup.

Lewat CLI:

```bash
./scripts/backup.sh FULL
./scripts/backup.sh DATABASE_ONLY
./scripts/backup.sh FILES_ONLY
```

## Restore

**PERINGATAN: restore adalah operasi destruktif, akan menimpa data saat ini.**

```bash
./scripts/restore.sh backup/full-backup-2026-08-15T02-00-00-000Z.zip.enc
```

Script akan:
1. Meminta konfirmasi eksplisit (ketik `RESTORE`)
2. Mendekripsi file backup ke direktori temporary
3. Menampilkan instruksi `pg_restore` yang perlu dijalankan manual (sengaja
   tidak otomatis, untuk mencegah restore ke database yang salah)

Untuk restore file (jika backup tipe `FULL` atau `FILES_ONLY`), ekstrak hasil
dekripsi sebagai zip dan salin isinya ke `storage/local/` setelah verifikasi.

## Verifikasi Backup

Checksum SHA-256 setiap backup tersimpan di kolom `checksum` tabel `backup_logs`.
Bandingkan dengan `sha256sum` file yang diunduh untuk memastikan tidak korup.
