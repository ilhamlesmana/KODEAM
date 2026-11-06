-- ==============================================================================
-- NEXORA LMS — ADD DUE_DATE & END_TIME TO ASSIGNMENTS TABLE
-- Database: Supabase / PostgreSQL
-- ==============================================================================

-- 1. Tambahkan kolom due_date, end_time, dan start_time pada tabel assignments jika belum ada
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ DEFAULT (now() + interval '7 days');
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ DEFAULT (now() + interval '7 days');
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS allow_late BOOLEAN DEFAULT false;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);

-- 2. Sinkronkan nilai due_date dan end_time jika salah satu sudah terisi
UPDATE public.assignments SET due_date = end_time WHERE due_date IS NULL AND end_time IS NOT NULL;
UPDATE public.assignments SET end_time = due_date WHERE end_time IS NULL AND due_date IS NOT NULL;

-- 3. Muat ulang cache schema PostgREST di Supabase
NOTIFY pgrst, 'reload schema';
