# Testing Guide

Tiga lapis test, sesuai kebutuhan `npm test`, `npm run typecheck`, dan `npm run lint`
yang harus semuanya lolos sebelum deploy (lihat `scripts/deploy.sh`).

## Unit Test (tests/unit/)

Tidak butuh database atau server - murni logic (validasi Zod, RBAC guard, CSV generator).

```bash
npx vitest run tests/unit
```

## Integration Test (tests/integration/)

Butuh PostgreSQL nyata dengan migrasi sudah diterapkan (pastikan `.env` sudah ada - lihat `installation-guide.md` - karena `docker-compose.yml` membaca kredensial dari sana):

```bash
docker compose up -d
npx prisma migrate deploy
npx vitest run tests/integration
```

Test ini membuat dan menghapus data test-nya sendiri (lihat beforeAll/afterAll
di setiap file), aman dijalankan berulang.

## API Test (tests/api/)

Butuh Next.js server yang benar-benar berjalan:

```bash
npm run dev
npx vitest run tests/api
```

## Semua Sekaligus

```bash
npm test
```

Catatan: npm test menjalankan seluruh folder tests/ termasuk integration
dan API test, jadi pastikan database dan server sudah berjalan sebelum
menjalankan perintah ini di CI/CD.
