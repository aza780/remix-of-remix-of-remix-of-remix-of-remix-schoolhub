# Panduan Manajemen Admin — ScholarHub

## Role yang tersedia

| Role | Akses |
|---|---|
| `super_admin` | Kelola semua post + kelola role tim |
| `admin` | Kelola post milik sendiri saja |

## Cara menambah anggota tim baru

1. Minta anggota register di `[URL aplikasi]/register`
2. Buka Lovable Cloud → Database → SQL Editor
3. Jalankan query di `docs/admin-management.sql` (bagian INSERT)
4. Verifikasi dengan query SELECT

## Cara mencabut akses

Jalankan query DELETE di `docs/admin-management.sql`

## Cara upgrade admin biasa menjadi super_admin

Jalankan query UPDATE di `docs/admin-management.sql`

## Catatan keamanan

- Jangan pernah share akses Database ke admin biasa
- Hanya Super Admin yang boleh menjalankan query di SQL Editor
- Selalu verifikasi dengan SELECT setelah setiap perubahan role
- RLS (Row Level Security) di database adalah pertahanan utama — frontend hanya UI layer
- Semua logika izin melalui helper `can.*` di `src/lib/permissions.ts`
- `useUserRole()` adalah satu-satunya sumber kebenaran untuk role user
