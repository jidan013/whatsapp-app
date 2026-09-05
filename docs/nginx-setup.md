# Nginx Setup

Nginx berfungsi sebagai reverse proxy di depan Next.js (port 3000). Bot WhatsApp
(port 3001) TIDAK perlu diekspos publik - itu hanya untuk healthcheck internal.

## Konfigurasi Dasar

Buat file `/etc/nginx/sites-available/whatsapp-agenda-system`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    client_max_body_size 60M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan:

```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-agenda-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Rate Limiting di Layer Nginx (opsional, tambahan dari rate limiter aplikasi)

```nginx
limit_req_zone $binary_remote_addr zone=agenda_limit:10m rate=10r/s;

server {
    location / {
        limit_req zone=agenda_limit burst=20 nodelay;
    }
}
```

Setelah SSL dipasang (lihat `ssl-setup.md`), Certbot akan otomatis menambahkan
blok `listen 443 ssl` dan redirect HTTP ke HTTPS.
