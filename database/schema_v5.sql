-- =====================================================
-- schema_v5.sql — Execute no SQL Editor do Supabase
-- =====================================================

-- 1. Novos campos em vagas
ALTER TABLE public.vagas
    ADD COLUMN IF NOT EXISTS salario_min NUMERIC,
    ADD COLUMN IF NOT EXISTS salario_max NUMERIC,
    ADD COLUMN IF NOT EXISTS modalidade TEXT CHECK (modalidade IN ('presencial', 'hibrido', 'remoto')),
    ADD COLUMN IF NOT EXISTS cidade TEXT;

-- 2. Novos campos em curriculos
ALTER TABLE public.curriculos
    ADD COLUMN IF NOT EXISTS cidade TEXT,
    ADD COLUMN IF NOT EXISTS endereco TEXT,
    ADD COLUMN IF NOT EXISTS bairro TEXT,
    ADD COLUMN IF NOT EXISTS numero TEXT,
    ADD COLUMN IF NOT EXISTS habilidades TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS cursos_prof JSONB[] DEFAULT '{}';

-- 3. Verificação
SELECT 'vagas.salario_min' AS campo UNION ALL
SELECT 'vagas.modalidade'  UNION ALL
SELECT 'vagas.cidade'      UNION ALL
SELECT 'curriculos.cidade' UNION ALL
SELECT 'curriculos.habilidades' UNION ALL
SELECT 'curriculos.cursos_prof';
