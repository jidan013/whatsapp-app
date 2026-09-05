# Google Drive Setup

## 1. Buat Project di Google Cloud Console

1. Buka https://console.cloud.google.com
2. Buat project baru (atau pakai yang sudah ada)
3. Aktifkan **Google Drive API** (APIs & Services > Library > cari "Google Drive API" > Enable)

## 2. Buat Service Account

1. APIs & Services > Credentials > Create Credentials > Service Account
2. Beri nama, mis. `whatsapp-agenda-drive`
3. Setelah dibuat, buka tab **Keys** > Add Key > Create New Key > JSON
4. Simpan file JSON yang terunduh - itu berisi `client_email` dan `private_key`

## 3. Isi Environment Variables

Dari file JSON tadi, isi ke `.env`:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=whatsapp-agenda-drive@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-project-id
```

Catatan: `private_key` di file JSON sudah dalam format dengan `\n` literal -
salin apa adanya termasuk tanda kutip di sekelilingnya.

## 4. Buat Folder Root di Google Drive dan Share ke Service Account

1. Buat folder baru di Google Drive akun Anda, mis. "WhatsApp Agenda System"
2. Klik kanan > Share > masukkan email service account (dari `client_email`)
3. Beri akses **Editor**
4. Salin ID folder dari URL (`https://drive.google.com/drive/folders/<FOLDER_ID>`)
5. Isi `GOOGLE_DRIVE_ROOT_FOLDER_ID=<FOLDER_ID>` di `.env`

## 5. (Opsional) Webhook Push Notification

Jika ingin sistem bereaksi terhadap perubahan file di Drive secara real-time,
daftarkan channel watch ke Google Drive API yang mengarah ke:

```
POST https://yourdomain.com/api/drive/webhook
```

Set `GOOGLE_DRIVE_WEBHOOK_TOKEN` di `.env` dan gunakan token yang sama saat
mendaftarkan channel (`channel.token` di Drive API `watch` request), supaya
webhook bisa diverifikasi keasliannya (lihat `app/api/drive/webhook/route.ts`).

## Verifikasi

Setelah semua terisi, coba trigger export atau upload media - file akan otomatis
tersinkronisasi dan muncul di halaman `/drive` pada dashboard.
