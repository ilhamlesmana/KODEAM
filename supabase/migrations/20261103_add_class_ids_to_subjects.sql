-- ==============================================================================
-- NEXORA LMS — ADD CLASS_IDS TO SUBJECTS TABLE
-- Database: Supabase / PostgreSQL
-- ==============================================================================

-- 1. Tambahkan kolom class_ids tipe array teks ke tabel subjects
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS class_ids TEXT[] DEFAULT '{}';

-- 2. Pastikan RLS mengizinkan operasi pada kolom baru
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_subjects" ON public.subjects;
CREATE POLICY "allow_all_subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
