-- =====================================================
-- ADMIN MANAGEMENT QUERIES
-- Jalankan di Lovable Cloud → Database → SQL Editor
-- =====================================================

-- 1. Tambah Super Admin pertama (setelah register via /register)
INSERT INTO user_roles (user_id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users
WHERE email = 'email@kamu.com';

-- 2. Tambah Admin biasa (setelah register via /register)
INSERT INTO user_roles (user_id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'email-anggota@tim.com';

-- 3. Verifikasi daftar admin
SELECT * FROM user_roles ORDER BY created_at DESC;

-- 4. Cabut akses admin
DELETE FROM user_roles
WHERE email = 'email-anggota@tim.com';

-- 5. Upgrade admin biasa menjadi super_admin
UPDATE user_roles
SET role = 'super_admin'
WHERE email = 'email-anggota@tim.com';
