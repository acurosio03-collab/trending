# 3. Panduan Deployment Vercel

1. Push proyek ke GitHub (pastikan `.env.local` TIDAK ikut — sudah ada di `.gitignore`).
2. Di https://vercel.com → **Add New → Project** → impor repo. Framework terdeteksi *Next.js*.
3. **Settings → Environment Variables** — isi (Production, Preview, Development):
   | Nama | Keterangan |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | dari Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dari Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | RAHASIA, server only |
   | `NEXT_PUBLIC_SITE_URL` | `https://domain-anda.com` |
   | `STOCK_PROVIDERS`, `TWELVEDATA_API_KEY`, `FMP_API_KEY`, `IHSG_SYMBOL` | data saham |
   | `QUOTE_CACHE_SECONDS`, `HISTORY_CACHE_SECONDS`, `RATE_LIMIT_PER_MINUTE` | opsional |
   | `NEWS_RSS_FEEDS` | opsional |
   | `CRON_SECRET` | string acak panjang untuk Vercel Cron |
4. **Deploy**.
5. Kembali ke Supabase → **Authentication → URL Configuration**: ubah *Site URL* ke domain produksi dan tambahkan `https://domain-anda.com/auth/callback` ke Redirect URLs.
6. Login sebagai admin dan jalankan refresh pertama (lihat panduan API).
7. Cron: `vercel.json` sudah mendefinisikan jadwal. Cron Vercel mengikuti ketentuan paket Anda (paket Hobby membatasi frekuensi); sesuaikan jadwal bila perlu.

## Checklist produksi
- [ ] `SUPABASE_SERVICE_ROLE_KEY` tidak punya prefix `NEXT_PUBLIC_`
- [ ] Confirm email aktif di Supabase Auth
- [ ] Redirect URL produksi terdaftar
- [ ] Semua tabel RLS *enabled*
- [ ] Admin pertama dibuat dengan aman dan akun admin memakai password kuat
- [ ] Halaman Kebijakan Privasi/Risiko disesuaikan dengan hukum yang berlaku dan lisensi data provider
- [ ] Rate limiting diganti ke Redis/KV bila trafik tinggi
- [ ] Sambungkan gateway pembayaran bila ingin langganan otomatis
