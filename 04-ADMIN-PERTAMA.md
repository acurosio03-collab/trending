# 4. Membuat Akun Admin Pertama Secara Aman

Role admin **tidak bisa** dibuat lewat halaman register (tidak ada jalur dari browser). Admin pertama diberikan langsung di database oleh pemilik project.

1. Buka aplikasi → **Daftar** memakai email Anda → konfirmasi email → pastikan bisa login.
2. Supabase Dashboard → **SQL Editor** → jalankan (ganti emailnya):

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'EMAIL-ANDA@contoh.com'
on conflict (user_id, role) do nothing;
```

3. Verifikasi:
```sql
select u.email, r.role
from public.user_roles r join auth.users u on u.id = r.user_id
where r.role = 'admin';
```
4. Logout lalu login lagi → menu **Admin** muncul (`/admin`).

## Praktik keamanan
- Gunakan password unik & kuat; aktifkan MFA di akun Supabase/GitHub/Vercel Anda.
- Batasi jumlah admin. Admin berikutnya cukup diberikan lewat **Admin → Pengguna → Admin** (tercatat di log) atau SQL di atas.
- Jangan pernah membagikan `SUPABASE_SERVICE_ROLE_KEY`; jika bocor, putar (rotate) di Supabase dan perbarui env Vercel.
- Periksa **Admin → Log Admin** secara berkala.
- Untuk mencabut admin: `delete from public.user_roles where role='admin' and user_id = (select id from auth.users where email='...');`
