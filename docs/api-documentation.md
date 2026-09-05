# API Documentation

Semua endpoint di bawah `/api` memerlukan session Auth.js (cookie), kecuali
`/api/health` dan `/api/auth/*`. Response selalu berbentuk:

```json
{ "success": true, "data": "..." }
```
atau
```json
{ "success": false, "error": "...", "fieldErrors": { "field": ["pesan"] } }
```

## Auth

- `GET/POST /api/auth/[...nextauth]` — dikelola Auth.js (login, logout, session)

## Agenda

| Method | Path | Permission | Deskripsi |
|---|---|---|---|
| GET | `/api/agenda` | `agenda:read` | List agenda dengan filter (query params: dateFrom, dateTo, categoryId, statusId, technicianId, departmentId, location, search, page, pageSize, orderBy, orderDirection) |
| POST | `/api/agenda` | `agenda:create` | Buat agenda baru |
| GET | `/api/agenda/:id` | `agenda:read` | Detail agenda |
| PATCH | `/api/agenda/:id` | `agenda:update` | Update agenda |
| DELETE | `/api/agenda/:id` | `agenda:delete` | Soft delete agenda |
| POST | `/api/agenda/:id/complete` | `agenda:update` | Tandai agenda selesai |

## Upload

| Method | Path | Permission | Deskripsi |
|---|---|---|---|
| POST | `/api/upload` | `media:upload` | Upload media ke agenda. `multipart/form-data` dengan field `agendaId` dan `file` |

## Export

| Method | Path | Permission | Deskripsi |
|---|---|---|---|
| POST | `/api/export/pdf` | `agenda:export` | Generate export PDF (query params sama seperti filter agenda) |
| POST | `/api/export/excel` | `agenda:export` | Generate export Excel |
| POST | `/api/export/csv` | `agenda:export` | Generate export CSV |

Rate limited: 100 request/menit per user (lihat `middleware/rate-limit.ts`).

## Backup

| Method | Path | Permission | Deskripsi |
|---|---|---|---|
| GET | `/api/backup` | `backup:view` | List riwayat backup |
| POST | `/api/backup` | `backup:trigger` | Trigger backup manual. Body: `{ "type": "FULL" }` (atau `DATABASE_ONLY` / `FILES_ONLY`) |

## Settings

| Method | Path | Permission | Deskripsi |
|---|---|---|---|
| GET | `/api/settings` | (session) | List settings, opsional filter `?category=` |
| POST | `/api/settings` | `settings:manage` | Buat/update setting. Body: `{ "key": "...", "value": "...", "category": "..." }` |

## Google Drive Webhook

| Method | Path | Deskripsi |
|---|---|---|
| POST | `/api/drive/webhook` | Menerima push notification dari Google Drive API (lihat `google-drive-setup.md`) |

## Health

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/health` | Cek status aplikasi + koneksi database (dipakai load balancer/PM2) |
