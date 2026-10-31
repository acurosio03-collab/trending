# 2. Panduan Integrasi API Saham

Aplikasi memakai **adapter provider** (`lib/providers/*`) sehingga provider bisa diganti tanpa menyentuh UI. Semua panggilan melewati `lib/providers/index.ts` yang menyediakan:
- **Fallback** berurutan sesuai `STOCK_PROVIDERS` (mis. `twelvedata,fmp`)
- **Cache** (`QUOTE_CACHE_SECONDS`, `HISTORY_CACHE_SECONDS`) + dedup request
- **Penanganan rate limit & error** → mengembalikan pesan "Data sedang tidak tersedia" (tanpa data palsu)

## Provider bawaan
| Provider | Env | Catatan |
|---|---|---|
| Twelve Data | `TWELVEDATA_API_KEY` | Memakai `exchange=XIDX`. Dukungan BEI & real-time tergantung paket. |
| Financial Modeling Prep | `FMP_API_KEY` | Ticker `KODE.JK`; menyediakan fundamental (PER, PBV, EPS, yield, 52W). Dukungan tergantung paket. |

**Wajib Anda lakukan:** cek dokumentasi & paket provider untuk memastikan ticker BEI (contoh `BBCA`) dan jenis data (real-time vs delayed) yang Anda dapatkan, serta syarat lisensi/tampilan data. Jangan mengasumsikan semua provider mendukung seluruh ticker BEI.

TradingView dan IDX tidak punya API publik gratis untuk redistribusi data; gunakan hanya jalur resmi/berlisensi (mis. kontrak data IDX) lalu tulis adapter sendiri.

## Langkah mengaktifkan
1. Daftar di provider, ambil API key.
2. Isi `.env.local` (lokal) atau Vercel env:
   ```
   STOCK_PROVIDERS=twelvedata,fmp
   TWELVEDATA_API_KEY=...
   FMP_API_KEY=...
   IHSG_SYMBOL=^JKSE
   ```
3. Jalankan `npm run dev`, login sebagai admin, lalu buka:
   - `/api/cron/refresh?mode=quotes` — harga semua saham aktif → tabel `stock_prices`
   - `/api/cron/refresh?mode=deep&offset=0&limit=5` — histori + indikator + fundamental, 5 saham per panggilan (ulangi offset 5, 10, …) agar tidak melewati kuota gratis
4. Cek **Admin → Statistik** untuk status API key dan hasil refresh.

Jadwal otomatis: `vercel.json` memanggil `mode=quotes` tiap 15 menit pada jam bursa (UTC 02–09, Senin–Jumat) dan `mode=news` tiap 3 jam. Pasang `CRON_SECRET` di Vercel agar cron terautentikasi (Vercel mengirim `Authorization: Bearer <CRON_SECRET>`). Untuk `mode=deep`, buat cron tambahan atau jalankan manual karena kuota API.

## Menambah provider baru
1. Buat `lib/providers/namaprovider.ts` yang mengekspor objek `StockProvider` (lihat `lib/types.ts`): `getQuote`, `getHistory`, opsional `getFundamentals`.
2. Daftarkan di `REGISTRY` pada `lib/providers/index.ts`.
3. Tambahkan nama ke `STOCK_PROVIDERS` dan env API key-nya.
4. Jika provider menjamin real-time, set `status: "realtime"` pada kuotasi hanya untuk data yang memang real-time.

## Berita
Isi `NEWS_RSS_FEEDS` dengan format `kategori|Nama Sumber|https://url-rss` dipisah koma. Kategori: `bei, ekonomi, perbankan, energi, teknologi, keuangan, kebijakan, corporate_action`. Gunakan hanya feed yang penerbitnya mengizinkan. Admin juga dapat menambah berita manual (wajib menyertakan tautan artikel asli).

## Cara kerja data → halaman
- Home/Trending/Screener/Watchlist/Portfolio membaca **snapshot di database** (cepat, hemat kuota) + IHSG langsung.
- Detail saham & grafik mengambil kuotasi/histori via adapter (di-cache), lalu indikator dihitung dari candle tersebut.
