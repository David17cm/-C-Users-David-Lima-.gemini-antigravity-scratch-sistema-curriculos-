-- NORTE EMPREGOS: MIGRATION MATCHING SCORE
-- -----------------------------------------
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. Adicionando colunas estruturadas à tabela de vagas
ALTER TABLE public.vagas 
ADD COLUMN IF NOT EXISTS requisitos_obrigatorios JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS requisitos_desejaveis JSONB DEFAULT '[]'::jsonb;

-- 2. Criando a tabela de Candidaturas (o vínculo entre Candidatos e Vagas)
CREATE TABLE IF NOT EXISTS public.candidaturas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vaga_id UUID REFERENCES public.vagas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    score_afinidade INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovado', 'recusado', 'contratado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(vaga_id, user_id)
);

-- 3. Habilitando RLS para candidaturas
ALTER TABLE public.candidaturas ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acesso
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Candidatos podem ver suas proprias candidaturas') THEN
        CREATE POLICY "Candidatos podem ver suas proprias candidaturas" ON public.candidaturas
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Empresas podem ver candidaturas de suas vagas') THEN
        CREATE POLICY "Empresas podem ver candidaturas de suas vagas" ON public.candidaturas
            FOR SELECT USING (
                vaga_id IN (SELECT id FROM public.vagas WHERE empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()))
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Candidatos podem se candidatar') THEN
        CREATE POLICY "Candidatos podem se candidatar" ON public.candidaturas
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Política para Empresa atualizar status da candidatura
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Empresas podem atualizar status de candidaturas') THEN
        CREATE POLICY "Empresas podem atualizar status de candidaturas" ON public.candidaturas
            FOR UPDATE USING (
                vaga_id IN (SELECT id FROM public.vagas WHERE empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()))
            );
    END IF;
END $$;
