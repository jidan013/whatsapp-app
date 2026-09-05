# PM2 Setup

Aplikasi berjalan sebagai 2 proses PM2 terpisah (lihat `ecosystem.config.js`):

| Proses | Deskripsi | Port |
|---|---|---|
| `agenda-web` | Next.js production server | 3000 |
| `agenda-bot` | WhatsApp bot (Baileys) + scheduler backup + notification dispatcher | 3001 (healthcheck only) |

## Perintah Dasar

```bash
pm2 start ecosystem.config.js     # start pertama kali
pm2 reload ecosystem.config.js    # reload tanpa downtime (setelah deploy)
pm2 status                        # lihat status kedua proses
pm2 logs agenda-web               # log Next.js
pm2 logs agenda-bot               # log bot (termasuk QR code saat login pertama)
pm2 monit                         # monitoring real-time (CPU/memory)
```

## Startup Otomatis Saat Server Reboot

```bash
pm2 startup systemd
# jalankan perintah yang ditampilkan (biasanya perlu sudo)
pm2 save
```

## Login WhatsApp Pertama Kali

Saat `agenda-bot` pertama kali dijalankan dan belum ada session tersimpan
(`storage/bot-session/`), QR code akan muncul di log:

```bash
pm2 logs agenda-bot --lines 100
```

Scan QR tersebut dengan WhatsApp di HP (Menu > Perangkat Tertaut > Tautkan Perangkat).
Setelah berhasil, session tersimpan di `storage/bot-session/` dan tidak perlu
scan ulang kecuali logout eksplisit atau folder tersebut dihapus.

## Restart Manual Jika Bot Terputus

Bot punya auto-reconnect internal (lihat `bot/connection.ts`), tapi jika perlu
restart paksa:

```bash
pm2 restart agenda-bot
```
