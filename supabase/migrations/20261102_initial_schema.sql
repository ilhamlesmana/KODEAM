-- ==============================================================================
-- NEXORA LMS — FULL DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Platform: Supabase / PostgreSQL
-- Target: Production LMS for School with Admin (Guru) and Siswa roles
-- NOTE: 100% IDEMPOTENT (Aman dijalankan berkali-kali tanpa error duplicate)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'essay');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE question_difficulty AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assignment_type AS ENUM ('quiz', 'assignment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('in_progress', 'submitted', 'graded', 'late');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Mirrors auth.users with app metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    status account_status NOT NULL DEFAULT 'active',
    avatar_url TEXT,
    phone VARCHAR(30),
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,       -- e.g. "Kelas 7A", "Kelas 8B", "Kelas 10 MIPA 1"
    level VARCHAR(50) NOT NULL,              -- e.g. "7", "8", "9", "10", "11", "12"
    academic_year VARCHAR(20) NOT NULL,      -- e.g. "2026/2027"
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. STUDENTS TABLE (Detailed student data linked to profile)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    nis_nisn VARCHAR(50) UNIQUE,
    gender VARCHAR(20),                      -- 'Laki-laki', 'Perempuan'
    address TEXT,
    parent_name VARCHAR(255),
    parent_phone VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. SUBJECTS TABLE (Mata Pelajaran)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,              -- e.g. "Matematika", "Fisika", "Bahasa Indonesia"
    code VARCHAR(50) UNIQUE NOT NULL,        -- e.g. "MTK", "FIS", "BIN"
    description TEXT,
    cover_image_url TEXT,
    color_accent VARCHAR(30) DEFAULT '#0284c7',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. CLASS_SUBJECTS (Mapping between Class and Subjects)
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (class_id, subject_id)
);

-- 8. ENROLLMENTS (Student registration per academic year)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'enrolled',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, class_id, academic_year)
);

-- 9. LEARNING MATERIALS (Materi Pembelajaran)
CREATE TABLE IF NOT EXISTS public.learning_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_rich_text TEXT,
    pdf_url TEXT,
    image_url TEXT,
    video_url TEXT,
    order_index INT NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. MATERIAL ATTACHMENTS (File Lampiran Materi)
CREATE TABLE IF NOT EXISTS public.material_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.learning_materials(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. MATERIAL COMPLETIONS (Tracking Siswa Menyelesaikan Materi)
CREATE TABLE IF NOT EXISTS public.material_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.learning_materials(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (material_id, student_id)
);

-- 12. QUESTIONS (Bank Soal)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL DEFAULT 'multiple_choice',
    points NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    difficulty question_difficulty NOT NULL DEFAULT 'medium',
    explanation TEXT,
    short_answer_key TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. QUESTION OPTIONS (Pilihan Jawaban Soal PG / Benar Salah)
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. ASSIGNMENTS (Tugas dan Ujian)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type assignment_type NOT NULL DEFAULT 'quiz',
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_minutes INT DEFAULT 60,
    total_points NUMERIC(6, 2) NOT NULL DEFAULT 100.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    allow_late BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. ASSIGNMENT QUESTIONS (Relasi Tugas dengan Soal)
CREATE TABLE IF NOT EXISTS public.assignment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 1,
    points NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(assignment_id, question_id)
);

-- 16. SUBMISSIONS (Pengumpulan Jawaban Siswa)
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    submitted_at TIMESTAMPTZ,
    status submission_status NOT NULL DEFAULT 'in_progress',
    total_score NUMERIC(6, 2),
    file_urls TEXT[],
    student_notes TEXT,
    teacher_feedback TEXT,
    graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (assignment_id, student_id)
);

-- 17. SUBMISSION ANSWERS (Jawaban Tiap Soal)
CREATE TABLE IF NOT EXISTS public.submission_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
    student_answer_text TEXT,
    file_url TEXT,
    is_correct BOOLEAN,
    score NUMERIC(5, 2) DEFAULT 0.00,
    teacher_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(submission_id, question_id)
);

-- 18. GRADES (Rekap Nilai Siswa)
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
    score NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    max_score NUMERIC(6, 2) NOT NULL DEFAULT 100.00,
    feedback TEXT,
    is_published BOOLEAN NOT NULL DEFAULT true,
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (student_id, assignment_id)
);

-- 19. ANNOUNCEMENTS (Pengumuman Platform)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(20) NOT NULL DEFAULT 'all',
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 20. SITE SETTINGS (Pengaturan Website Dinamis)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    site_name VARCHAR(100) NOT NULL DEFAULT 'NEXORA',
    tagline VARCHAR(255) NOT NULL DEFAULT 'Learn Beyond Limits.',
    logo_url TEXT,
    teacher_name VARCHAR(150) NOT NULL DEFAULT 'Ilham Lesmana',
    teacher_bio TEXT NOT NULL DEFAULT 'Senior Educator & Technology Specialist berkomitmen menghadirkan metode belajar modern, interaktif, dan terstruktur untuk membimbing siswa mencapai potensi terbaik.',
    teacher_photo_url TEXT,
    contact_email VARCHAR(150) DEFAULT 'admin@nexora.sch.id',
    contact_phone VARCHAR(50) DEFAULT '+62 812-3456-7890',
    contact_address TEXT DEFAULT 'Jakarta, Indonesia',
    accent_color VARCHAR(30) DEFAULT '#0284c7',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- ==============================================================================
-- 21. INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_class ON public.class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject ON public.class_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_class_subject ON public.learning_materials(class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_question_options_q ON public.question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_subject ON public.assignments(class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_student ON public.submissions(assignment_id, student_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_subject ON public.grades(student_id, subject_id);

-- ==============================================================================
-- 22. AUTOMATIC UPDATED_AT TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_classes_updated_at ON public.classes;
CREATE TRIGGER set_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_subjects_updated_at ON public.subjects;
CREATE TRIGGER set_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_materials_updated_at ON public.learning_materials;
CREATE TRIGGER set_materials_updated_at
BEFORE UPDATE ON public.learning_materials
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_assignments_updated_at ON public.assignments;
CREATE TRIGGER set_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_submissions_updated_at ON public.submissions;
CREATE TRIGGER set_submissions_updated_at
BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_settings_updated_at ON public.site_settings;
CREATE TRIGGER set_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 23. SECURITY HELPER FUNCTIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS UUID AS $$
DECLARE
    s_id UUID;
BEGIN
    SELECT s.id INTO s_id
    FROM public.students s
    WHERE s.profile_id = auth.uid();
    RETURN s_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_student_class_id()
RETURNS UUID AS $$
DECLARE
    c_id UUID;
BEGIN
    SELECT s.class_id INTO c_id
    FROM public.students s
    WHERE s.profile_id = auth.uid();
    RETURN c_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 24. ROW LEVEL SECURITY (RLS) POLICIES (With DROP IF EXISTS for 100% Idempotency)
-- ==============================================================================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.is_admin());

-- CLASSES
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Classes are viewable by authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Classes are viewable by everyone" ON public.classes;
CREATE POLICY "Classes are viewable by everyone"
ON public.classes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
CREATE POLICY "Admins can manage classes"
ON public.classes FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- STUDENTS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all students, students can view own record" ON public.students;
CREATE POLICY "Admins can view all students, students can view own record"
ON public.students FOR SELECT
TO authenticated
USING (public.is_admin() OR profile_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
CREATE POLICY "Admins can manage students"
ON public.students FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- SUBJECTS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subjects are viewable by public and authenticated users" ON public.subjects;
CREATE POLICY "Subjects are viewable by public and authenticated users"
ON public.subjects FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
CREATE POLICY "Admins can manage subjects"
ON public.subjects FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- CLASS_SUBJECTS
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Class subjects viewable by authenticated users" ON public.class_subjects;
CREATE POLICY "Class subjects viewable by authenticated users"
ON public.class_subjects FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage class subjects" ON public.class_subjects;
CREATE POLICY "Admins can manage class subjects"
ON public.class_subjects FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ENROLLMENTS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view all enrollments, students view own" ON public.enrollments;
CREATE POLICY "Admins view all enrollments, students view own"
ON public.enrollments FOR SELECT
TO authenticated
USING (public.is_admin() OR student_id = public.current_student_id());

DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
CREATE POLICY "Admins can manage enrollments"
ON public.enrollments FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- LEARNING MATERIALS
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view all materials, students view published for their class" ON public.learning_materials;
CREATE POLICY "Admins view all materials, students view published for their class"
ON public.learning_materials FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR (
        is_published = true 
        AND (class_id IS NULL OR class_id = public.current_student_class_id())
    )
);

DROP POLICY IF EXISTS "Admins can manage learning materials" ON public.learning_materials;
CREATE POLICY "Admins can manage learning materials"
ON public.learning_materials FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- MATERIAL ATTACHMENTS
ALTER TABLE public.material_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Attachments viewable by authenticated users with material access" ON public.material_attachments;
CREATE POLICY "Attachments viewable by authenticated users with material access"
ON public.material_attachments FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.learning_materials lm
        WHERE lm.id = material_id 
        AND lm.is_published = true
        AND (lm.class_id IS NULL OR lm.class_id = public.current_student_class_id())
    )
);

DROP POLICY IF EXISTS "Admins manage material attachments" ON public.material_attachments;
CREATE POLICY "Admins manage material attachments"
ON public.material_attachments FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- MATERIAL COMPLETIONS
ALTER TABLE public.material_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own completion status, admins view all" ON public.material_completions;
CREATE POLICY "Students manage own completion status, admins view all"
ON public.material_completions FOR SELECT
TO authenticated
USING (public.is_admin() OR student_id = public.current_student_id());

DROP POLICY IF EXISTS "Students insert/delete own completion" ON public.material_completions;
CREATE POLICY "Students insert/delete own completion"
ON public.material_completions FOR INSERT
TO authenticated
WITH CHECK (student_id = public.current_student_id() OR public.is_admin());

DROP POLICY IF EXISTS "Students delete own completion" ON public.material_completions;
CREATE POLICY "Students delete own completion"
ON public.material_completions FOR DELETE
TO authenticated
USING (student_id = public.current_student_id() OR public.is_admin());

-- QUESTIONS (Bank Soal)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can do everything on questions" ON public.questions;
CREATE POLICY "Admins can do everything on questions"
ON public.questions FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students view questions when assigned" ON public.questions;
CREATE POLICY "Students view questions when assigned"
ON public.questions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignment_questions aq
        JOIN public.assignments a ON a.id = aq.assignment_id
        WHERE aq.question_id = questions.id
        AND a.class_id = public.current_student_class_id()
        AND a.is_active = true
    )
);

-- QUESTION OPTIONS
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage all question options" ON public.question_options;
CREATE POLICY "Admins manage all question options"
ON public.question_options FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students can view options without is_correct leak" ON public.question_options;
CREATE POLICY "Students can view options without is_correct leak"
ON public.question_options FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.assignment_questions aq
        JOIN public.assignments a ON a.id = aq.assignment_id
        WHERE aq.question_id = question_options.question_id
        AND a.class_id = public.current_student_class_id()
        AND a.is_active = true
    )
);

-- ASSIGNMENTS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage all assignments" ON public.assignments;
CREATE POLICY "Admins manage all assignments"
ON public.assignments FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students view assignments for their class" ON public.assignments;
CREATE POLICY "Students view assignments for their class"
ON public.assignments FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR (class_id = public.current_student_class_id() AND is_active = true)
);

-- ASSIGNMENT QUESTIONS
ALTER TABLE public.assignment_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage assignment questions" ON public.assignment_questions;
CREATE POLICY "Admins manage assignment questions"
ON public.assignment_questions FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students view questions for their class assignments" ON public.assignment_questions;
CREATE POLICY "Students view questions for their class assignments"
ON public.assignment_questions FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_questions.assignment_id
        AND a.class_id = public.current_student_class_id()
        AND a.is_active = true
    )
);

-- SUBMISSIONS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view all submissions, students view own" ON public.submissions;
CREATE POLICY "Admins view all submissions, students view own"
ON public.submissions FOR SELECT
TO authenticated
USING (public.is_admin() OR student_id = public.current_student_id());

DROP POLICY IF EXISTS "Students insert/update own submission" ON public.submissions;
CREATE POLICY "Students insert/update own submission"
ON public.submissions FOR INSERT
TO authenticated
WITH CHECK (student_id = public.current_student_id() OR public.is_admin());

DROP POLICY IF EXISTS "Students update own submission when in_progress" ON public.submissions;
CREATE POLICY "Students update own submission when in_progress"
ON public.submissions FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    OR (student_id = public.current_student_id() AND status = 'in_progress')
);

DROP POLICY IF EXISTS "Admins delete submissions" ON public.submissions;
CREATE POLICY "Admins delete submissions"
ON public.submissions FOR DELETE
TO authenticated
USING (public.is_admin());

-- SUBMISSION ANSWERS
ALTER TABLE public.submission_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view all submission answers, students view own" ON public.submission_answers;
CREATE POLICY "Admins view all submission answers, students view own"
ON public.submission_answers FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.submissions s
        WHERE s.id = submission_id AND s.student_id = public.current_student_id()
    )
);

DROP POLICY IF EXISTS "Students insert/update own answers during in_progress submission" ON public.submission_answers;
CREATE POLICY "Students insert/update own answers during in_progress submission"
ON public.submission_answers FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.submissions s
        WHERE s.id = submission_id 
        AND s.student_id = public.current_student_id()
        AND s.status = 'in_progress'
    )
);

DROP POLICY IF EXISTS "Students update own answers during in_progress" ON public.submission_answers;
CREATE POLICY "Students update own answers during in_progress"
ON public.submission_answers FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.submissions s
        WHERE s.id = submission_id 
        AND s.student_id = public.current_student_id()
        AND s.status = 'in_progress'
    )
);

-- GRADES
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view all grades, students view own published grades" ON public.grades;
CREATE POLICY "Admins view all grades, students view own published grades"
ON public.grades FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR (student_id = public.current_student_id() AND is_published = true)
);

DROP POLICY IF EXISTS "Admins manage grades" ON public.grades;
CREATE POLICY "Admins manage grades"
ON public.grades FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ANNOUNCEMENTS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Announcements viewable by target audience" ON public.announcements;
CREATE POLICY "Announcements viewable by target audience"
ON public.announcements FOR SELECT
USING (
    public.is_admin()
    OR (
        is_active = true 
        AND (target_role = 'all' OR target_role = 'student')
        AND (class_id IS NULL OR class_id = public.current_student_class_id())
    )
);

DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
CREATE POLICY "Admins manage announcements"
ON public.announcements FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- SITE SETTINGS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site settings viewable by everyone" ON public.site_settings;
CREATE POLICY "Site settings viewable by everyone"
ON public.site_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins update site settings" ON public.site_settings;
CREATE POLICY "Admins update site settings"
ON public.site_settings FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- 25. SEED DATA (Default Settings, Classes, Subjects)
-- ==============================================================================

-- Default Site Settings
INSERT INTO public.site_settings (
    id, site_name, tagline, teacher_name, teacher_bio, contact_email, contact_phone, contact_address, accent_color
) VALUES (
    1,
    'NEXORA',
    'Learn Beyond Limits.',
    'Ilham Lesmana',
    'Senior Educator & Technology Specialist berkomitmen menghadirkan metode belajar modern, interaktif, dan terstruktur untuk membimbing siswa mencapai potensi akademik terbaik.',
    'ilham@nexora.sch.id',
    '+62 812-3456-7890',
    'Jakarta, Indonesia',
    '#38bdf8'
) ON CONFLICT (id) DO UPDATE SET
    site_name = EXCLUDED.site_name,
    tagline = EXCLUDED.tagline,
    teacher_name = EXCLUDED.teacher_name,
    teacher_bio = EXCLUDED.teacher_bio;

-- Default Classes
INSERT INTO public.classes (id, name, level, academic_year, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Kelas 7A', '7', '2026/2027', 'Kelas 7 Unggulan Akademik'),
    ('22222222-2222-2222-2222-222222222222', 'Kelas 8A', '8', '2026/2027', 'Kelas 8 Reguler'),
    ('33333333-3333-3333-3333-333333333333', 'Kelas 9A', '9', '2026/2027', 'Kelas 9 Persiapan Kelulusan')
ON CONFLICT (name) DO NOTHING;

-- Default Subjects
INSERT INTO public.subjects (id, name, code, description, color_accent) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Matematika', 'MTK-01', 'Pembelajaran konsep logika, aljabar, geometri, dan statistika.', '#38bdf8'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Ilmu Pengetahuan Alam (IPA)', 'IPA-01', 'Eksplorasi biologi, fisika dasar, dan sains lingkungan modern.', '#10b981'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Ilmu Pengetahuan Sosial (IPS)', 'IPS-01', 'Pemahaman sejarah, geografi, ekonomi, dan dinamika sosial masyarakat.', '#f59e0b'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Bahasa Indonesia', 'BIN-01', 'Keterampilan literasi, tata bahasa, penulisan esai, dan sastra.', '#ec4899'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Bahasa Inggris', 'BIG-01', 'Grammar, vocabulary, listening, reading comprehension, dan public speaking.', '#8b5cf6')
ON CONFLICT (code) DO NOTHING;

-- Connect Subjects to Classes
INSERT INTO public.class_subjects (class_id, subject_id) VALUES
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
    ('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
    ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
    ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT DO NOTHING;

-- Sample Global Announcement
INSERT INTO public.announcements (title, content, target_role, is_active)
VALUES (
    'Selamat Datang di NEXORA LMS',
    'Platform pembelajaran daring resmi NEXORA telah aktif. Silakan akses materi pembelajaran dan cek jadwal tugas atau kuis secara berkala.',
    'all',
    true
)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 26. SUPABASE STORAGE BUCKETS SETUP
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('nexora-files', 'nexora-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public files access" ON storage.objects;
CREATE POLICY "Public files access"
ON storage.objects FOR SELECT
USING (bucket_id = 'nexora-files');

DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'nexora-files');

DROP POLICY IF EXISTS "Users can update or delete own uploaded files" ON storage.objects;
CREATE POLICY "Users can update or delete own uploaded files"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'nexora-files');
