# Zozotech POS Resto (Next.js + Turso)

Rewrite Nadha Resto menjadi stack modern berbasis Next.js (App Router) yang siap jalan di Vercel dan menggunakan Turso/libSQL sebagai database utama.

## Fitur yang disiapkan
- Dashboard kasir dengan data menu, pesanan aktif, status meja, dan ringkasan harian.
- API route untuk menu, pesanan, dan meja (serverless friendly).
- Skema SQLite siap impor ke Turso + seed data contoh.
- UI kasir untuk membuat pesanan baru, update status tiket, dan toggle status meja.

## Prasyarat
- Node.js 18+ dan npm (untuk menjalankan secara lokal).
- Akun Turso atau libSQL self-host untuk database (env `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN`).

## Menjalankan secara lokal
1. Instal dependency: `npm install` (jalankan di folder `zozotech-pos-resto`).  
2. Buat file `.env.local`:
   ```env
   TURSO_DATABASE_URL="libsql://your-db-url.turso.io"
   TURSO_AUTH_TOKEN="your_turso_token"
   ```
   Jika variabel di atas tidak diisi, app akan jatuh ke SQLite file lokal `database/local.db`.
3. Push skema & seed (bisa ke Turso atau file lokal):
   ```bash
   npm run db:push
   npm run db:seed
   ```
4. Jalankan dev server: `npm run dev` lalu buka `http://localhost:3000`.

## Deploy ke Vercel
- Buat project Vercel baru, pilih folder `zozotech-pos-resto`.
- Set Environment Variables di Vercel: `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN`.
- Jalankan perintah seed/push satu kali (via Turso CLI lokal) sebelum deploy pertama:
  ```bash
  turso db create zozotech-pos-resto
  turso db tokens create zozotech-pos-resto # ambil url + token
  turso db shell zozotech-pos-resto < database/schema.sql
  turso db shell zozotech-pos-resto < database/seed.sql
  ```

## Struktur utama
- `src/app/page.tsx` — UI dashboard kasir (client component).
- `src/app/api/*` — API routes serverless (menu, orders, tables, dashboard feed).
- `src/lib/*` — helper DB, formatter, dan validator (Zod).
- `database/schema.sql` — definisi tabel untuk Turso/SQLite.
- `database/seed.sql` — data contoh menu, meja, staff, stok.
- `scripts/push-schema.ts` / `scripts/seed.ts` — utilitas untuk menjalankan schema/seed via `npm run db:push` / `npm run db:seed`.

## Catatan
- Harga disimpan sebagai integer IDR (tanpa desimal).
- Status pesanan: `pending`, `accepted`, `preparing`, `served`, `paid`, `cancelled`.
- Status meja: `available`, `occupied`, `reserved`, `dirty`.
- Jika ingin menambah modul lain (inventori, promo, dsb), tinggal tambahkan tabel di `schema.sql` dan buat route handler baru di `src/app/api`.
