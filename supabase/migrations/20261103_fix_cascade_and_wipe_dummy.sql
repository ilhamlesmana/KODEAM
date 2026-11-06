-- ==============================================================================
-- NEXORA LMS — FIX FOREIGN KEY CONSTRAINTS (CASCADE DELETE) & WIPE DUMMY DATA
-- Database: Supabase / PostgreSQL
-- ==============================================================================

-- BAGIAN 1: PERBAIKI SEMUA FOREIGN KEY AGAR BISA DIHAPUS TANPA DIBLOKIR POSTGRESQL

-- 1. Tabel Students
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_class_id_fkey;
ALTER TABLE public.students 
  ADD CONSTRAINT students_class_id_fkey 
  FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;

-- 2. Tabel Learning Materials
ALTER TABLE public.learning_materials DROP CONSTRAINT IF EXISTS learning_materials_class_id_fkey;
ALTER TABLE public.learning_materials 
  ADD CONSTRAINT learning_materials_class_id_fkey 
  FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.learning_materials DROP CONSTRAINT IF EXISTS learning_materials_subject_id_fkey;
ALTER TABLE public.learning_materials 
  ADD CONSTRAINT learning_materials_subject_id_fkey 
  FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- 3. Tabel Questions
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_class_id_fkey;
ALTER TABLE public.questions 
  ADD CONSTRAINT questions_class_id_fkey 
  FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_subject_id_fkey;
ALTER TABLE public.questions 
  ADD CONSTRAINT questions_subject_id_fkey 
  FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- 4. Tabel Question Options
ALTER TABLE public.question_options DROP CONSTRAINT IF EXISTS question_options_question_id_fkey;
ALTER TABLE public.question_options 
  ADD CONSTRAINT question_options_question_id_fkey 
  FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;

-- 5. Tabel Assignments
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_class_id_fkey;
ALTER TABLE public.assignments 
  ADD CONSTRAINT assignments_class_id_fkey 
  FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_subject_id_fkey;
ALTER TABLE public.assignments 
  ADD CONSTRAINT assignments_subject_id_fkey 
  FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- 6. Tabel Assignment Questions
ALTER TABLE public.assignment_questions DROP CONSTRAINT IF EXISTS assignment_questions_assignment_id_fkey;
ALTER TABLE public.assignment_questions 
  ADD CONSTRAINT assignment_questions_assignment_id_fkey 
  FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;

ALTER TABLE public.assignment_questions DROP CONSTRAINT IF EXISTS assignment_questions_question_id_fkey;
ALTER TABLE public.assignment_questions 
  ADD CONSTRAINT assignment_questions_question_id_fkey 
  FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;

-- 7. Tabel Submissions
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_assignment_id_fkey;
ALTER TABLE public.submissions 
  ADD CONSTRAINT submissions_assignment_id_fkey 
  FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;

ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_student_id_fkey;
ALTER TABLE public.submissions 
  ADD CONSTRAINT submissions_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- 8. Tabel Grades
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_assignment_id_fkey;
ALTER TABLE public.grades 
  ADD CONSTRAINT grades_assignment_id_fkey 
  FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_student_id_fkey;
ALTER TABLE public.grades 
  ADD CONSTRAINT grades_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_class_id_fkey;
ALTER TABLE public.grades 
  ADD CONSTRAINT grades_class_id_fkey 
  FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_subject_id_fkey;
ALTER TABLE public.grades 
  ADD CONSTRAINT grades_subject_id_fkey 
  FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;

-- 9. Tabel Announcements
ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_class_id_fkey;
ALTER TABLE public.announcements 
  ADD CONSTRAINT announcements_class_id_fkey 
  FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- ==============================================================================
-- BAGIAN 2: PEMBERSIHAN TOTAL SELURUH DATA DUMMY DARI DATABASE
-- Menghapus semua kelas, materi, soal, tugas, dan siswa dummy agar database bersih
-- ==============================================================================
TRUNCATE TABLE public.submissions, public.grades, public.assignment_questions, public.assignments, public.question_options, public.questions, public.learning_materials, public.students CASCADE;

-- Hapus kelas dan mapel dummy
DELETE FROM public.classes;
DELETE FROM public.subjects;
DELETE FROM public.announcements;

-- Bersihkan profil akun siswa dummy (tetap mempertahankan akun Guru Ilham Lesmana)
DELETE FROM public.profiles WHERE role = 'student';

-- Pastikan profil Guru Ilham Lesmana tetap ada dan aktif
INSERT INTO public.profiles (id, username, full_name, role, status, phone, bio)
VALUES (
    '11111111-0000-0000-0000-000000000000',
    'guru_ilham',
    'Ilham Lesmana',
    'admin',
    'active',
    '+62 812-3456-7890',
    'Pengajar utama dan administrator sistem NEXORA LMS.'
) ON CONFLICT (id) DO NOTHING;
