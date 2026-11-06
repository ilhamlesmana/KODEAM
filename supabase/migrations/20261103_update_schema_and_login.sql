-- ==============================================================================
-- NEXORA LMS — UPDATE SCHEMA: FIX STUDENT LOGIN & LANDING PAGE SETTINGS
-- Target: 
-- 1. Lepas foreign key profiles -> auth.users agar pembuatan akun siswa oleh guru tidak gagal
-- 2. Tambah kolom password di tabel students
-- 3. Tambah kolom teacher_commitment & teacher_specialty di site_settings
-- 4. Masukkan akun siswa bawaan ke Supabase (Ahmad Fauzan & Nadia Azhari)
-- ==============================================================================

-- 1. PROFILES: Lepaskan Foreign Key ke auth.users agar akun siswa bisa dibuat langsung
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. STUDENTS: Tambah kolom password untuk autentikasi siswa
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'siswa123';

-- 3. SITE SETTINGS: Tambah kolom komitmen pengajaran & spesialisasi pengajar
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS teacher_commitment TEXT DEFAULT 'Pembelajaran Interaktif & Terarah';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS teacher_specialty TEXT DEFAULT 'Matematika & Sains Digital';

-- Update nilai default pada id = 1 jika belum ada
UPDATE public.site_settings 
SET 
    teacher_commitment = COALESCE(teacher_commitment, 'Pembelajaran Interaktif & Terarah'),
    teacher_specialty = COALESCE(teacher_specialty, 'Matematika & Sains Digital')
WHERE id = 1;

-- 4. SEED AKUN SISWA BAWAAN KE SUPABASE (Siap Login)
-- A. Profil Ahmad Fauzan
INSERT INTO public.profiles (id, username, full_name, role, status, avatar_url, phone, bio)
VALUES (
    '11111111-0000-0000-0000-000000000001',
    'ahmad_fauzan',
    'Ahmad Fauzan',
    'student',
    'active',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
    '+62 813-1122-3344',
    'Siswa antusias sains dan pemrograman robotika.'
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    status = EXCLUDED.status;

-- B. Data Siswa Ahmad Fauzan (NISN: 202607001, Pass: siswa123)
INSERT INTO public.students (id, profile_id, class_id, nis_nisn, gender, address, parent_name, parent_phone, password)
VALUES (
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '202607001',
    'Laki-laki',
    'Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan',
    'Bambang Sudirman',
    '+62 811-2345-6789',
    'siswa123'
) ON CONFLICT (id) DO UPDATE SET
    nis_nisn = EXCLUDED.nis_nisn,
    password = EXCLUDED.password;

-- C. Profil Nadia Azhari
INSERT INTO public.profiles (id, username, full_name, role, status, avatar_url, phone, bio)
VALUES (
    '11111111-0000-0000-0000-000000000002',
    'nadia_azhari',
    'Nadia Azhari',
    'student',
    'active',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
    '+62 813-9988-7766',
    'Siswa pencinta matematika dan literasi bahasa.'
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    status = EXCLUDED.status;

-- D. Data Siswa Nadia Azhari (NISN: 202607002, Pass: siswa123)
INSERT INTO public.students (id, profile_id, class_id, nis_nisn, gender, address, parent_name, parent_phone, password)
VALUES (
    '22222222-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '202607002',
    'Perempuan',
    'Jl. Kemang Raya No. 45, Jakarta Selatan',
    'Dewi Sartika',
    '+62 812-9876-5432',
    'siswa123'
) ON CONFLICT (id) DO UPDATE SET
    nis_nisn = EXCLUDED.nis_nisn,
    password = EXCLUDED.password;

-- 5. PASTIKAN RLS TETAP TERBUKA UNTUK AKSES LMS
DROP POLICY IF EXISTS "Public and auth can read students" ON public.students;
DROP POLICY IF EXISTS "Public and auth can insert students" ON public.students;
DROP POLICY IF EXISTS "Public and auth can update students" ON public.students;
DROP POLICY IF EXISTS "Public and auth can delete students" ON public.students;

CREATE POLICY "Public and auth can read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Public and auth can insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Public and auth can update students" ON public.students FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public and auth can delete students" ON public.students FOR DELETE USING (true);
