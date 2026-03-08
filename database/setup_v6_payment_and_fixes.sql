-- SCRIPT COMPLETO DE INFRAESTRUTURA E PAGAMENTO

-- 1. ADICIONAR COLUNA 'PAGO' EM USER_ROLES (Para o Paywall)
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS pago BOOLEAN DEFAULT FALSE;

-- 2. CRIAR BUCKET 'avatars' (Se não existir)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. PERMISSÕES DE STORAGE
DROP POLICY IF EXISTS "Fotos públicas" ON storage.objects;
DROP POLICY IF EXISTS "Upload de fotos" ON storage.objects;

CREATE POLICY "Fotos públicas" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Upload de fotos" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
);

-- 4. CORREÇÃO DE VISIBILIDADE DAS CANDIDATURAS (RLS)
-- Referência explícita a public.curriculos.user_id para evitar ambiguidade
DROP POLICY IF EXISTS "Empresas e Admins podem ler todos os curriculos" ON public.curriculos;
DROP POLICY IF EXISTS "Empresas veem currículos de candidatos" ON public.curriculos;

CREATE POLICY "Empresas veem currículos de candidatos" ON public.curriculos
FOR SELECT USING (
    public.curriculos.user_id IN (
        SELECT c.user_id FROM public.candidaturas c
        JOIN public.vagas v ON v.id = c.vaga_id
        JOIN public.empresas e ON e.id = v.empresa_id
        WHERE e.user_id = auth.uid()
    ) OR auth.uid() = public.curriculos.user_id
);

-- 5. PERMISSÃO PARA ADMIN VER TUDO (Opcional, mas recomendado)
CREATE POLICY "Admins veem todos os curriculos" ON public.curriculos
FOR SELECT USING (
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
);

-- 6. MODERAÇÃO DE EMPRESAS (Fase 6)
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS aprovada BOOLEAN DEFAULT FALSE;

-- 7. TABELA DE TRANSAÇÕES (Fase 7)
CREATE TABLE IF NOT EXISTS public.transacoes (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    valor       NUMERIC DEFAULT 19.90,
    status      TEXT DEFAULT 'confirmado', -- simplificado para o MVP
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuário vê suas transações" ON public.transacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin vê todas transações" ON public.transacoes FOR SELECT USING (
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
);
