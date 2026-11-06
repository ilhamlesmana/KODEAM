-- ==============================================================================
-- NEXORA LMS: FIX FULL PERMISSIONS & SCHEMA FOR BANK SOAL & ASSIGNMENTS
-- Jalankan script ini di Supabase Dashboard -> SQL Editor -> Klik "Run"
-- ==============================================================================

-- 1. Pastikan kolom option_key ada di tabel question_options dan bernilai opsional/default
ALTER TABLE public.question_options ADD COLUMN IF NOT EXISTS option_key VARCHAR(10) DEFAULT 'A';
ALTER TABLE public.question_options ALTER COLUMN option_key DROP NOT NULL;
ALTER TABLE public.question_options ALTER COLUMN option_key SET DEFAULT 'A';

-- 2. Pastikan kolom waktu pada tabel assignments lengkap
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ DEFAULT (now() + interval '7 days');
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ DEFAULT (now() + interval '7 days');
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS class_ids TEXT[] DEFAULT '{}';

-- 3. Pastikan tabel perantara assignment_questions tersedia
CREATE TABLE IF NOT EXISTS public.assignment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 1,
  points INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assignment_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_questions_asg ON public.assignment_questions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_questions_qst ON public.assignment_questions(question_id);

-- 4. Buka akses RLS (Row Level Security) agar Guru dapat menyimpan Bank Soal & Tugas tanpa diblokir
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access to questions" ON public.questions;
CREATE POLICY "Public full access to questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to question_options" ON public.question_options;
CREATE POLICY "Public full access to question_options" ON public.question_options FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to assignments" ON public.assignments;
CREATE POLICY "Public full access to assignments" ON public.assignments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to assignment_questions" ON public.assignment_questions;
CREATE POLICY "Public full access to assignment_questions" ON public.assignment_questions FOR ALL USING (true) WITH CHECK (true);

-- 5. Muat ulang cache schema PostgREST Supabase
NOTIFY pgrst, 'reload schema';
