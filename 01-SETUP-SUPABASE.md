# 1. Panduan Setup Supabase

## A. Buat project
1. Daftar/masuk di https://supabase.com → **New project**.
2. Pilih region terdekat (mis. Singapore), buat password database, tunggu project siap.

## B. Jalankan skema
1. Buka **SQL Editor** → **New query**.
2. Tempel seluruh isi `supabase/schema.sql` → **Run**.
3. Verifikasi di **Table Editor**: 19 tabel (17 tabel utama + `price_alerts`, `app_settings`), semuanya bertanda RLS *enabled*.
4. Di tabel `stock_symbols` sudah ada 20 saham awal (BBCA, BBRI, BMRI, TLKM, ASII, GOTO, …). Tambah lewat Admin → Saham.

> Jika Anda menjalankan ulang skema, bagian `create trigger` / `create policy` akan error karena sudah ada. Untuk reset di project baru, hapus schema `public` lebih dulu atau buat project baru.

## C. Konfigurasi Auth
1. **Authentication → Providers → Email**: aktif. Disarankan *Confirm email* aktif untuk produksi.
2. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (lokal) → ganti ke domain produksi saat deploy.
   - Redirect URLs: tambahkan `http://localhost:3000/auth/callback` dan `https://DOMAIN-ANDA/auth/callback`.
3. (Opsional) Atur template email ke Bahasa Indonesia di **Authentication → Email Templates**.

## D. Ambil kunci API
**Project Settings → API**:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (**RAHASIA**, hanya di server/Vercel env; jangan diberi prefix `NEXT_PUBLIC_`, jangan di-commit)

## E. Uji keamanan cepat (disarankan)
Di SQL Editor, jalankan sebagai pengguna biasa (mis. lewat aplikasi) dan pastikan:
- `insert into user_roles ...` dari klien ditolak (tidak ada policy tulis untuk user biasa).
- `update subscriptions set status='active' ...` dari klien ditolak.
- Pengguna A tidak bisa membaca `watchlists` pengguna B.
