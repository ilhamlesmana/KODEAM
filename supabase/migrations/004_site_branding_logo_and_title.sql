-- ============================================================================
-- MIGRATION 004: SITE BRANDING (LOGO URL & BROWSER TAB TITLE)
-- Idempotent migration untuk memastikan kolom logo_url dan browser_title
-- tersedia pada tabel public.site_settings di Supabase PostgreSQL
-- ============================================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS browser_title text DEFAULT 'NEXORA × SMK MARHAS — Platform E-Learning Terpadu',
  ADD COLUMN IF NOT EXISTS teacher_commitment text DEFAULT 'Pembelajaran Interaktif & Terarah',
  ADD COLUMN IF NOT EXISTS teacher_specialty text DEFAULT 'Matematika & Sains Digital';
