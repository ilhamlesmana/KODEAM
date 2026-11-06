-- ==============================================================================
-- NEXORA LMS — MASTER DATABASE SYNC & PERMISSION SETUP
-- Target: Memastikan seluruh tabel, kolom, data awal, dan izin edit sinkron 100%
-- NOTE: Jalankan SELURUH script ini di Supabase SQL Editor Anda!
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SITE SETTINGS TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    site_name VARCHAR(150) NOT NULL DEFAULT 'NEXORA',
    tagline VARCHAR(255) NOT NULL DEFAULT 'Learn Beyond Limits.',
    logo_url TEXT,
    teacher_name VARCHAR(150) NOT NULL DEFAULT 'Ilham Lesmana',
    teacher_bio TEXT,
    teacher_photo_url TEXT,
    teacher_commitment TEXT DEFAULT 'Pembelajaran Interaktif & Terarah',
    teacher_specialty TEXT DEFAULT 'Matematika & Sains Digital',
    contact_email VARCHAR(150) DEFAULT 'ilham@nexora.sch.id',
    contact_phone VARCHAR(50) DEFAULT '+62 812-3456-7890',
    contact_address TEXT DEFAULT 'Gedung Edukasi Modern Lt. 4, Jakarta Selatan, Indonesia',
    accent_color VARCHAR(30) DEFAULT '#0ea5e9',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Pastikan kolom baru ada
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS teacher_commitment TEXT DEFAULT 'Pembelajaran Interaktif & Terarah';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS teacher_specialty TEXT DEFAULT 'Matematika & Sains Digital';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS teacher_photo_url TEXT;

-- Pastikan baris id = 1 ada
INSERT INTO public.site_settings (
    id, site_name, tagline, teacher_name, teacher_bio, teacher_commitment, teacher_specialty, contact_email, contact_phone, contact_address, accent_color
) VALUES (
    1,
    'NEXORA',
    'Learn Beyond Limits.',
    'Ilham Lesmana',
    'Senior Educator & Technology Specialist berkomitmen menghadirkan metode belajar modern, interaktif, dan terstruktur untuk membimbing siswa mencapai potensi akademik terbaik.',
    'Pembelajaran Interaktif & Terarah',
    'Matematika & Sains Digital',
    'ilham@nexora.sch.id',
    '+62 812-3456-7890',
    'Gedung Edukasi Modern Lt. 4, Jakarta Selatan, Indonesia',
    '#0ea5e9'
) ON CONFLICT (id) DO NOTHING;

-- 3. PROFILES TABLE: Lepas constraint foreign key ke auth.users agar pembuatan akun siswa oleh guru tidak gagal
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    avatar_url TEXT,
    phone VARCHAR(30),
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    level VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    nis_nisn VARCHAR(50) UNIQUE,
    gender VARCHAR(20),
    address TEXT,
    parent_name VARCHAR(255),
    parent_phone VARCHAR(30),
    password VARCHAR(255) DEFAULT 'siswa123',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'siswa123';

-- 6. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    color_accent VARCHAR(30) DEFAULT '#0ea5e9',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. LEARNING MATERIALS TABLE
CREATE TABLE IF NOT EXISTS public.learning_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_rich_text TEXT,
    pdf_url TEXT,
    image_url TEXT,
    video_url TEXT,
    order_index INT NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. QUESTIONS & OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
    points INT NOT NULL DEFAULT 10,
    explanation TEXT,
    short_answer_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    option_key VARCHAR(10) NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'quiz',
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    duration_minutes INT,
    total_points INT NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.assignment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 1,
    UNIQUE (assignment_id, question_id)
);

-- 10. SUBMISSIONS & GRADES TABLE
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    submitted_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted',
    total_score NUMERIC(5,2),
    file_urls TEXT[],
    student_notes TEXT,
    teacher_feedback TEXT,
    graded_by VARCHAR(100),
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
    score NUMERIC(5,2) NOT NULL DEFAULT 0,
    max_score NUMERIC(5,2) NOT NULL DEFAULT 100,
    feedback TEXT,
    is_published BOOLEAN NOT NULL DEFAULT true,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(50) NOT NULL DEFAULT 'all',
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 12. SEED DATA AWAL (SESUAI IDENTIK DENGAN FRONTEND)
-- ==============================================================================

-- Classes
INSERT INTO public.classes (id, name, level, academic_year, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Kelas 7A', '7', '2026/2027', 'Kelas 7 Unggulan Sains & Matematika'),
    ('22222222-2222-2222-2222-222222222222', 'Kelas 8A', '8', '2026/2027', 'Kelas 8 Reguler Multimedia & Teknologi'),
    ('33333333-3333-3333-3333-333333333333', 'Kelas 9A', '9', '2026/2027', 'Kelas 9 Persiapan Kelulusan & Ujian Nasional')
ON CONFLICT (name) DO NOTHING;

-- Subjects
INSERT INTO public.subjects (id, name, code, description, color_accent, cover_image_url) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Matematika', 'MTK-01', 'Penguasaan konsep aljabar linear, persamaan kuadrat, geometri bangun ruang, dan statistika data.', '#0ea5e9', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Ilmu Pengetahuan Alam (IPA)', 'IPA-01', 'Eksplorasi ilmu fisika gerak, mekanika dasar, reaksi kimia, serta ekologi makhluk hidup.', '#10b981', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Bahasa Inggris', 'BIG-01', 'Pengembangan kemampuan berkomunikasi lisan, grammar komprehensif, reading text, dan penulisan terstruktur.', '#8b5cf6', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Bahasa Indonesia', 'BIN-01', 'Keterampilan literasi kritis, analisis teks editorial, sastra nusantara, dan penulisan karya ilmiah.', '#ec4899', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Ilmu Pengetahuan Sosial (IPS)', 'IPS-01', 'Dinamika peradaban sejarah, kajian geografis wilayah Indonesia, dan pemahaman dasar kegiatan ekonomi.', '#f59e0b', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800')
ON CONFLICT (code) DO NOTHING;

-- Akun Siswa 1: Ahmad Fauzan
INSERT INTO public.profiles (id, username, full_name, role, status, avatar_url, phone, bio)
VALUES (
    '11111111-0000-0000-0000-000000000001',
    'ahmad_fauzan',
    'Ahmad Fauzan',
    'student',
    'active',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
    '+62 813-1122-3344',
    'Siswa antusias sains dan teknologi.'
) ON CONFLICT (id) DO NOTHING;

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
) ON CONFLICT (id) DO NOTHING;

-- Akun Siswa 2: Nadia Azhari
INSERT INTO public.profiles (id, username, full_name, role, status, avatar_url, phone, bio)
VALUES (
    '11111111-0000-0000-0000-000000000002',
    'nadia_azhari',
    'Nadia Azhari',
    'student',
    'active',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
    '+62 813-9988-7766',
    'Siswa pencinta matematika.'
) ON CONFLICT (id) DO NOTHING;

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
) ON CONFLICT (id) DO NOTHING;

-- Pengumuman Awal
INSERT INTO public.announcements (id, title, content, target_role, is_active)
VALUES (
    '99999999-1111-1111-1111-111111111111',
    'Selamat Datang di NEXORA LMS',
    'Platform pembelajaran daring resmi NEXORA telah aktif. Silakan akses materi pembelajaran dan cek jadwal tugas atau kuis secara berkala.',
    'all',
    true
) ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 13. ROW LEVEL SECURITY (RLS) FULL ACCESS (Mencegah Error Block saat Edit)
-- ==============================================================================

-- Site Settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_site_settings" ON public.site_settings;
CREATE POLICY "allow_all_site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_profiles" ON public.profiles;
CREATE POLICY "allow_all_profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_classes" ON public.classes;
CREATE POLICY "allow_all_classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);

-- Students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_students" ON public.students;
CREATE POLICY "allow_all_students" ON public.students FOR ALL USING (true) WITH CHECK (true);

-- Subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_subjects" ON public.subjects;
CREATE POLICY "allow_all_subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

-- Learning Materials
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_materials" ON public.learning_materials;
CREATE POLICY "allow_all_materials" ON public.learning_materials FOR ALL USING (true) WITH CHECK (true);

-- Questions & Options
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_questions" ON public.questions;
CREATE POLICY "allow_all_questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_question_options" ON public.question_options;
CREATE POLICY "allow_all_question_options" ON public.question_options FOR ALL USING (true) WITH CHECK (true);

-- Assignments & Assignment Questions
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_assignments" ON public.assignments;
CREATE POLICY "allow_all_assignments" ON public.assignments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.assignment_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_assignment_questions" ON public.assignment_questions;
CREATE POLICY "allow_all_assignment_questions" ON public.assignment_questions FOR ALL USING (true) WITH CHECK (true);

-- Submissions & Grades
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_submissions" ON public.submissions;
CREATE POLICY "allow_all_submissions" ON public.submissions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_grades" ON public.grades;
CREATE POLICY "allow_all_grades" ON public.grades FOR ALL USING (true) WITH CHECK (true);

-- Announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_announcements" ON public.announcements;
CREATE POLICY "allow_all_announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
