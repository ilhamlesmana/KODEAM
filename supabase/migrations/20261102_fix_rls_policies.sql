-- ==============================================================================
-- NEXORA LMS — MIGRATION: FIX RLS PERMISSIONS FOR DIRECT DATABASE INTEGRATION
-- Target: Izinkan operasi CRUD (SELECT, INSERT, UPDATE, DELETE) dari aplikasi NEXORA
-- NOTE: Jalankan script SQL ini di Supabase SQL Editor Anda!
-- ==============================================================================

-- 1. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public and auth can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public and auth can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public and auth can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public and auth can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Public and auth can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public and auth can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public and auth can update profiles" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public and auth can delete profiles" ON public.profiles FOR DELETE USING (true);

-- 2. CLASSES
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Classes are viewable by authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Classes are viewable by everyone" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Public and auth can read classes" ON public.classes;
DROP POLICY IF EXISTS "Public and auth can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Public and auth can update classes" ON public.classes;
DROP POLICY IF EXISTS "Public and auth can delete classes" ON public.classes;

CREATE POLICY "Public and auth can read classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Public and auth can insert classes" ON public.classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public and auth can update classes" ON public.classes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public and auth can delete classes" ON public.classes FOR DELETE USING (true);

-- 3. STUDENTS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all students, students can view own record" ON public.students;
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Public and auth can read students" ON public.students;
DROP POLICY IF EXISTS "Public and auth can insert students" ON public.students;
DROP POLICY IF EXISTS "Public and auth can update students" ON public.students;
DROP POLICY IF EXISTS "Public and auth can delete students" ON public.students;

CREATE POLICY "Public and auth can read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Public and auth can insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Public and auth can update students" ON public.students FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public and auth can delete students" ON public.students FOR DELETE USING (true);

-- 4. SUBJECTS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Subjects are viewable by public and authenticated users" ON public.subjects;
DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Public and auth can read subjects" ON public.subjects;
DROP POLICY IF EXISTS "Public and auth can insert subjects" ON public.subjects;
DROP POLICY IF EXISTS "Public and auth can update subjects" ON public.subjects;
DROP POLICY IF EXISTS "Public and auth can delete subjects" ON public.subjects;

CREATE POLICY "Public and auth can read subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Public and auth can insert subjects" ON public.subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public and auth can update subjects" ON public.subjects FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public and auth can delete subjects" ON public.subjects FOR DELETE USING (true);

-- 5. CLASS_SUBJECTS
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Class subjects viewable by authenticated users" ON public.class_subjects;
DROP POLICY IF EXISTS "Admins can manage class subjects" ON public.class_subjects;
DROP POLICY IF EXISTS "Public and auth can read class_subjects" ON public.class_subjects;
DROP POLICY IF EXISTS "Public and auth can manage class_subjects" ON public.class_subjects;

CREATE POLICY "Public and auth can read class_subjects" ON public.class_subjects FOR SELECT USING (true);
CREATE POLICY "Public and auth can manage class_subjects" ON public.class_subjects FOR ALL USING (true) WITH CHECK (true);

-- 6. LEARNING MATERIALS
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view all materials, students view published for their class" ON public.learning_materials;
DROP POLICY IF EXISTS "Admins can manage learning materials" ON public.learning_materials;
DROP POLICY IF EXISTS "Public and auth can read materials" ON public.learning_materials;
DROP POLICY IF EXISTS "Public and auth can insert materials" ON public.learning_materials;
DROP POLICY IF EXISTS "Public and auth can update materials" ON public.learning_materials;
DROP POLICY IF EXISTS "Public and auth can delete materials" ON public.learning_materials;

CREATE POLICY "Public and auth can read materials" ON public.learning_materials FOR SELECT USING (true);
CREATE POLICY "Public and auth can insert materials" ON public.learning_materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Public and auth can update materials" ON public.learning_materials FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public and auth can delete materials" ON public.learning_materials FOR DELETE USING (true);

-- 7. QUESTIONS (Bank Soal)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can do everything on questions" ON public.questions;
DROP POLICY IF EXISTS "Students view questions when assigned" ON public.questions;
DROP POLICY IF EXISTS "Public and auth can read questions" ON public.questions;
DROP POLICY IF EXISTS "Public and auth can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Public and auth can update questions" ON public.questions;
DROP POLICY IF EXISTS "Public and auth can delete questions" ON public.questions;

CREATE POLICY "Public and auth can read questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Public and auth can insert questions" ON public.questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public and auth can update questions" ON public.questions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public and auth can delete questions" ON public.questions FOR DELETE USING (true);

-- 8. QUESTION OPTIONS
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage all question options" ON public.question_options;
DROP POLICY IF EXISTS "Students can view options without is_correct leak" ON public.question_options;
DROP POLICY IF EXISTS "Public and auth can manage options" ON public.question_options;

CREATE POLICY "Public and auth can manage options" ON public.question_options FOR ALL USING (true) WITH CHECK (true);

-- 9. ASSIGNMENTS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage all assignments" ON public.assignments;
DROP POLICY IF EXISTS "Students view assignments for their class" ON public.assignments;
DROP POLICY IF EXISTS "Public and auth can read assignments" ON public.assignments;
DROP POLICY IF EXISTS "Public and auth can insert assignments" ON public.assignments;
DROP POLICY IF EXISTS "Public and auth can update assignments" ON public.assignments;
DROP POLICY IF EXISTS "Public and auth can delete assignments" ON public.assignments;

CREATE POLICY "Public and auth can read assignments" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Public and auth can insert assignments" ON public.assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public and auth can update assignments" ON public.assignments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public and auth can delete assignments" ON public.assignments FOR DELETE USING (true);

-- 10. ASSIGNMENT QUESTIONS
ALTER TABLE public.assignment_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage assignment questions" ON public.assignment_questions;
DROP POLICY IF EXISTS "Students view questions for their class assignments" ON public.assignment_questions;
DROP POLICY IF EXISTS "Public and auth can manage assignment questions" ON public.assignment_questions;

CREATE POLICY "Public and auth can manage assignment questions" ON public.assignment_questions FOR ALL USING (true) WITH CHECK (true);

-- 11. SUBMISSIONS & SUBMISSION ANSWERS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view all submissions, students view own" ON public.submissions;
DROP POLICY IF EXISTS "Students insert/update own submission" ON public.submissions;
DROP POLICY IF EXISTS "Students update own submission when in_progress" ON public.submissions;
DROP POLICY IF EXISTS "Admins delete submissions" ON public.submissions;
DROP POLICY IF EXISTS "Public and auth can manage submissions" ON public.submissions;

CREATE POLICY "Public and auth can manage submissions" ON public.submissions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.submission_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view all submission answers, students view own" ON public.submission_answers;
DROP POLICY IF EXISTS "Students insert/update own answers during in_progress submission" ON public.submission_answers;
DROP POLICY IF EXISTS "Students update own answers during in_progress" ON public.submission_answers;
DROP POLICY IF EXISTS "Public and auth can manage submission answers" ON public.submission_answers;

CREATE POLICY "Public and auth can manage submission answers" ON public.submission_answers FOR ALL USING (true) WITH CHECK (true);

-- 12. GRADES
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view all grades, students view own published grades" ON public.grades;
DROP POLICY IF EXISTS "Admins manage grades" ON public.grades;
DROP POLICY IF EXISTS "Public and auth can manage grades" ON public.grades;

CREATE POLICY "Public and auth can manage grades" ON public.grades FOR ALL USING (true) WITH CHECK (true);

-- 13. ANNOUNCEMENTS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Announcements viewable by target audience" ON public.announcements;
DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Public and auth can manage announcements" ON public.announcements;

CREATE POLICY "Public and auth can manage announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

-- 14. SITE SETTINGS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Site settings viewable by everyone" ON public.site_settings;
DROP POLICY IF EXISTS "Admins update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public and auth can manage site settings" ON public.site_settings;

CREATE POLICY "Public and auth can manage site settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);
