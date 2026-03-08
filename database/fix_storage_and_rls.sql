-- 1. CRIAR BUCKET 'avatars' (Se não existir)
-- Nota: Algumas versões do Supabase requerem criação via Painel, 
-- mas este SQL tenta habilitar via comandos de sistema se disponível.
-- Caso falhe o INSERT, crie manualmente no menu 'Storage' -> 'New Bucket' com nome 'avatars' e marque como PUBLIC.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS DE ACESSO AO STORAGE (FOTOS)
-- Permitir que qualquer um veja as fotos (público)
CREATE POLICY "Fotos públicas" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Permitir que usuários logados enviem fotos
CREATE POLICY "Upload de fotos" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
);

-- 3. CORREÇÃO DE VISIBILIDADE DAS CANDIDATURAS (RLS)
-- Garante que a empresa consiga ver os currículos de quem se candidatou às suas vagas
DROP POLICY IF EXISTS "Empresas e Admins podem ler todos os curriculos" ON public.curriculos;

CREATE POLICY "Empresas veem currículos de candidatos" ON public.curriculos
FOR SELECT USING (
    public.curriculos.user_id IN (
        SELECT c.user_id FROM public.candidaturas c
        JOIN public.vagas v ON v.id = c.vaga_id
        JOIN public.empresas e ON e.id = v.empresa_id
        WHERE e.user_id = auth.uid()
    ) OR auth.uid() = public.curriculos.user_id
);

-- 4. AJUSTE NA TABELA CANDIDATURAS PARA JOIN
-- Garante que a empresa veja a linha da candidatura
DROP POLICY IF EXISTS "Empresa vê candidaturas das suas vagas" ON public.candidaturas;

CREATE POLICY "Empresa vê candidaturas das suas vagas" ON public.candidaturas
FOR SELECT USING (
    vaga_id IN (
        SELECT v.id FROM public.vagas v
        JOIN public.empresas e ON e.id = v.empresa_id
        WHERE e.user_id = auth.uid()
    )
);
