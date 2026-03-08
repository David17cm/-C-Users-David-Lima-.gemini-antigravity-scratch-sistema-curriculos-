-- =====================================================
-- schema_v4.sql — Execute no SQL Editor do Supabase
-- =====================================================

-- 1. Novos campos na tabela curriculos
ALTER TABLE public.curriculos
    ADD COLUMN IF NOT EXISTS foto_url TEXT,
    ADD COLUMN IF NOT EXISTS ensino_medio JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS cnh JSONB DEFAULT '{}'::jsonb;

-- 2. Tabela de candidaturas
CREATE TABLE IF NOT EXISTS public.candidaturas (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vaga_id     UUID REFERENCES public.vagas(id) ON DELETE CASCADE NOT NULL,
    status      TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'visualizada', 'aprovada', 'recusada')),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE (user_id, vaga_id)
);

ALTER TABLE public.candidaturas ENABLE ROW LEVEL SECURITY;

-- Candidato vê suas próprias candidaturas
CREATE POLICY "Candidato vê suas candidaturas"
    ON public.candidaturas FOR SELECT
    USING (auth.uid() = user_id);

-- Candidato pode se candidatar
CREATE POLICY "Candidato pode se candidatar"
    ON public.candidaturas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Empresa vê candidaturas das suas vagas
CREATE POLICY "Empresa vê candidaturas das suas vagas"
    ON public.candidaturas FOR SELECT
    USING (
        vaga_id IN (
            SELECT v.id FROM public.vagas v
            JOIN public.empresas e ON e.id = v.empresa_id
            WHERE e.user_id = auth.uid()
        )
    );

-- Admin vê tudo
CREATE POLICY "Admin vê todas as candidaturas"
    ON public.candidaturas FOR ALL
    USING (
        (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
    );

-- 3. Verificação
SELECT 'foto_url' AS campo, column_name IS NOT NULL AS existe
FROM information_schema.columns
WHERE table_name = 'curriculos' AND column_name = 'foto_url'
UNION ALL
SELECT 'ensino_medio', column_name IS NOT NULL
FROM information_schema.columns
WHERE table_name = 'curriculos' AND column_name = 'ensino_medio'
UNION ALL
SELECT 'cnh', column_name IS NOT NULL
FROM information_schema.columns
WHERE table_name = 'curriculos' AND column_name = 'cnh'
UNION ALL
SELECT 'tabela candidaturas', table_name IS NOT NULL
FROM information_schema.tables
WHERE table_name = 'candidaturas';
