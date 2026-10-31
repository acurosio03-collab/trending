# TRENDING SAHAM PRO 🇮🇩

Platform pemantauan & analisis saham Indonesia (BEI): dashboard IHSG, trending stocks, detail saham + indikator teknikal, AI Stock Analyst, Stock Screener PRO, watchlist, portfolio tracker, berita, akun Free/Premium/Admin, dan admin panel.

> Informasi yang ditampilkan hanya untuk edukasi dan informasi, bukan rekomendasi investasi atau jaminan keuntungan.

## Stack
Next.js 15 (App Router) • TypeScript • Tailwind CSS • Lightweight Charts • Supabase (Auth + PostgreSQL + RLS) • Vercel

## Prinsip utama
- **Tidak ada data palsu.** Semua harga/histori datang dari provider API. Jika API belum dikonfigurasi atau gagal, UI menampilkan "Data sedang tidak tersedia".
- **Status data jelas:** Real-time / Delayed / Historis + waktu update + nama provider. Adapter saat ini memberi label *delayed* (sampai Anda memverifikasi paket real-time dari provider).
- **Otorisasi di server.** Premium/admin dibaca dari database (`is_premium()` / `is_admin()`), bukan dari browser. RLS aktif di semua tabel.
- **Rahasia hanya di server.** `SUPABASE_SERVICE_ROLE_KEY` dan API key provider tidak pernah dikirim ke frontend.

## Struktur folder
```
supabase/schema.sql        17 tabel + price_alerts, app_settings, RLS, trigger, fungsi keamanan, seed
lib/providers/             adapter provider (twelvedata.ts, fmp.ts) + index.ts (fallback, cache)
lib/indicators.ts          RSI, MACD, MA20/50/200, Bollinger, support/resistance, volatilitas
lib/analysis.ts            AI Stock Analyst (rule-based, berbasis data aktual)
lib/refresh.ts             sinkronisasi harga/histori/indikator/fundamental ke database
lib/auth.ts                getSession(): validasi user + role dari database
app/api/*                  market, stocks, analyze, screener, watchlist, portfolio, news, alerts, admin, cron
app/*                      halaman UI (home, trending, stock/[symbol], screener, watchlist, portfolio, news, admin, ...)
components/                Logo, Nav (bottom nav HP), PriceChart, StockTable, MarketClock, ...
docs/                      panduan setup
```

## Mulai cepat
1. `npm install`
2. Ikuti **[docs/01-SETUP-SUPABASE.md](docs/01-SETUP-SUPABASE.md)**
3. Salin `.env.example` → `.env.local`, isi nilainya
4. Ikuti **[docs/02-INTEGRASI-API-SAHAM.md](docs/02-INTEGRASI-API-SAHAM.md)**
5. `npm run dev` → buka http://localhost:3000
6. Buat admin pertama: **[docs/04-ADMIN-PERTAMA.md](docs/04-ADMIN-PERTAMA.md)**
7. Isi data pertama kali (login admin): buka `/api/cron/refresh?mode=quotes`, lalu `/api/cron/refresh?mode=deep&offset=0&limit=5` (ulangi dengan offset 5, 10, 15 …)
8. Deploy: **[docs/03-DEPLOY-VERCEL.md](docs/03-DEPLOY-VERCEL.md)**

## Batasan jujur yang perlu Anda ketahui
- **Cakupan data bergantung provider & paket.** Dukungan ticker BEI dan real-time tidak dijamin oleh semua provider. Verifikasi paket Anda; jika perlu tambah adapter baru (lihat panduan API).
- **IHSG:** simbol default `^JKSE` (set `IHSG_SYMBOL` bila provider memakai simbol lain).
- **Statistik pasar** (jumlah naik/turun/stagnan, volume, nilai) dihitung dari *saham yang dipantau platform* (tabel `stock_symbols`), bukan seluruh BEI, dan diberi label demikian. Tambahkan lebih banyak saham lewat Admin → Saham.
- **Nilai transaksi** = estimasi volume × harga terakhir bila provider tidak menyediakan nilai.
- **Chart 1D** memakai candle harian terakhir karena adapter bawaan hanya menyediakan data harian; tambahkan data intraday di adapter bila paket Anda mendukung.
- **AI Stock Analyst** bersifat rule-based atas indikator aktual (tanpa janji profit). Bisa ditingkatkan dengan LLM; kirim hasil `analyze()` sebagai konteks, jangan data karangan.
- **Kalender dividen/aksi korporasi & pengumuman emiten** memakai berita kategori *corporate_action* (RSS berizin / input admin) + tautan resmi IDX. Tidak ada tanggal yang dikarang. Untuk kalender terstruktur, tambahkan endpoint dividen/corporate action dari provider Anda.
- **Notifikasi/alert harga:** dievaluasi terhadap snapshot harga terakhir saat pengguna membuka halaman Watchlist. Push/email membutuhkan job tambahan (mis. Supabase Edge Function + layanan email).
- **Pembayaran:** belum terhubung ke gateway. Admin mengaktifkan Premium manual (Admin → Pengguna). Untuk otomatis, buat webhook server (Midtrans/Xendit) yang menulis ke tabel `subscriptions` memakai service role dan memverifikasi signature.
- **Rate limit & cache** berjalan in-memory per instance serverless. Untuk trafik besar gunakan Upstash Redis / Vercel KV.
- Kode ini belum dijalankan lewat `npm run build` di lingkungan pembuatnya (registry npm tidak dapat diakses). Jalankan `npm install && npm run typecheck && npm run build` lebih dulu dan perbaiki bila ada ketidakcocokan versi.

## Keamanan — ringkas
- RLS di semua tabel; `user_roles` & `subscriptions` hanya bisa ditulis admin/service role → pengguna tak bisa menaikkan role/premium sendiri.
- Trigger database membatasi watchlist Free (1 daftar, 10 saham) dan melarang user mengubah `is_suspended`.
- Setiap endpoint admin memanggil `getSession()` → `is_admin` dari database; aksi dicatat di `admin_logs`.
- Input divalidasi dengan zod; rate limiting per IP; header keamanan di `next.config.mjs`.
- Fungsi `has_role/is_admin/is_premium` menerima parameter user id (security definer). UUID tidak bisa ditebak sehingga risiko rendah; jika ingin lebih ketat, buat versi tanpa parameter untuk RLS dan batasi `EXECUTE` versi berparameter ke service role.
