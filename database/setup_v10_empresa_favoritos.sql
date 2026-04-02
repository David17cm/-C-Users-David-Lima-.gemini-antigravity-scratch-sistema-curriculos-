-- 1. Criação da tabela de favoritos
CREATE TABLE IF NOT EXISTS public.empresa_favoritos (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id  UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_favorito UNIQUE(empresa_id, user_id)
);

-- 2. Habilitar RLS
ALTER TABLE public.empresa_favoritos ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (RLS)
-- Empresas podem gerenciar seus próprios favoritos
DROP POLICY IF EXISTS "Empresas podem ler seus favoritos" ON public.empresa_favoritos;
CREATE POLICY "Empresas podem ler seus favoritos" ON public.empresa_favoritos
    FOR SELECT USING (
        empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Empresas podem favoritar talentos" ON public.empresa_favoritos;
CREATE POLICY "Empresas podem favoritar talentos" ON public.empresa_favoritos
    FOR INSERT WITH CHECK (
        empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Empresas podem remover favoritos" ON public.empresa_favoritos;
CREATE POLICY "Empresas podem remover favoritos" ON public.empresa_favoritos
    FOR DELETE USING (
        empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid())
    );
