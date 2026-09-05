# SSL Setup (Let's Encrypt)

## Prasyarat

- Nginx sudah dikonfigurasi (lihat `nginx-setup.md`) dan domain sudah mengarah ke server ini
- Port 80 dan 443 terbuka di firewall

## Generate Sertifikat

```bash
sudo certbot --nginx -d yourdomain.com
```

Certbot akan otomatis:
1. Memverifikasi kepemilikan domain
2. Menerbitkan sertifikat
3. Memodifikasi konfigurasi Nginx untuk HTTPS + redirect HTTP ke HTTPS

## Auto-Renewal

Certbot memasang systemd timer otomatis. Verifikasi dengan:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

## Update AUTH_URL

Setelah SSL aktif, update `.env`:

```
AUTH_URL=https://yourdomain.com
APP_URL=https://yourdomain.com
```

Lalu reload aplikasi:

```bash
pm2 reload agenda-web
```
