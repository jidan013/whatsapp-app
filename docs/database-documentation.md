# Database Documentation

Skema lengkap: `prisma/schema.prisma`. PostgreSQL, Prisma ORM, semua primary
key UUID, soft delete via `deletedAt`, timestamp `createdAt`/`updatedAt` di
hampir semua tabel.

## Kelompok Tabel

### Auth & RBAC
- `users` — akun login, punya `passwordHash` (argon2id), relasi ke `departments`
- `roles` — ADMIN, SUPERVISOR, TECHNICIAN, OPERATOR (seed default) + custom role
- `permissions` — kode permission granular, format `resource:action` (mis. `agenda:create`)
- `user_roles` — many-to-many users-roles
- `role_permissions` — many-to-many roles-permissions
- `sessions` — Auth.js session tracking tambahan (session utama pakai JWT, tabel ini untuk audit)

### Organisasi
- `departments` — departemen/divisi
- `technicians` — profil teknisi (1-1 dengan `users`, punya `employeeCode`)

### Agenda (Domain Inti)
- `agenda` — record pekerjaan/tugas utama
- `agenda_categories` — kategori (Instalasi, Perbaikan, dll)
- `agenda_status` — status dengan `isTerminal` flag (Completed/Cancelled = terminal)
- `agenda_media` — foto/video/dokumen terlampir, relasi opsional ke `google_drive_files`
- `comments` — komentar pada agenda

### Notifikasi & Log
- `notifications` — antrian notifikasi (WEB/WHATSAPP/EMAIL), status PENDING sampai SENT/FAILED
- `activity_logs` — audit trail seluruh aksi penting (login, CRUD, upload, export, backup, dll)

### Export/Backup/Drive
- `exports` — riwayat export PDF/Excel/CSV, status QUEUED sampai PROCESSING sampai COMPLETED/FAILED
- `backup_logs` — riwayat backup, termasuk checksum dan status enkripsi
- `google_drive_files` — katalog semua file yang tersinkron ke Drive (dipakai 3 kategori: AGENDA_MEDIA, EXPORT, BACKUP)

### Sistem
- `settings` — key-value config, grouped by `category`

## Relasi Penting

```
User 1-1 Technician
User 1-N Agenda (createdBy)
User 1-N Agenda (assignedTo, opsional)
Agenda N-1 AgendaCategory
Agenda N-1 AgendaStatus
Agenda 1-N AgendaMedia
Agenda 1-N Comment
AgendaMedia N-1 GoogleDriveFile (opsional, null jika Drive sync gagal)
Role N-N Permission (lewat RolePermission)
User N-N Role (lewat UserRole)
```

## Index Strategy

Semua foreign key diberi index eksplisit. Kolom yang sering dipakai untuk
filter (`scheduledDate`, `deletedAt`, `status`) juga diindex, termasuk
composite index `(scheduledDate, statusId)` di tabel `agenda` untuk query
dashboard/kalender.

## Migrasi

```bash
npx prisma migrate dev --name nama_perubahan   # development
npx prisma migrate deploy                       # production
```

Jangan pernah edit file di `prisma/migrations/` secara manual setelah dibuat -
buat migrasi baru untuk perubahan lebih lanjut.
