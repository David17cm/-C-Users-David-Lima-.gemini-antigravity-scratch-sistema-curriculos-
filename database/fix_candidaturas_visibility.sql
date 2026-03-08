-- =========================================================================
-- CORREÇÃO DE VISIBILIDADE: CANDIDATURAS E CURRÍCULOS
-- Problema: Empresas não conseguiam ver os candidatos inscritos em suas vagas
-- devido a subqueries complexas no RLS que causavam falhas ou retorno vazio.
-- Solução: Criar funções auxiliares SECURITY DEFINER para simplificar as políticas.
-- =========================================================================

-- 1. Helper para pegar a Role de qualquer usuário sem recursão
CREATE OR REPLACE FUNCTION public.get_role_of(target_uid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_roles WHERE user_id = target_uid;
$$;

-- 2. Helper para checar se o usuário logado é dono de uma vaga específica
CREATE OR REPLACE FUNCTION public.is_vaga_owner(v_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.vagas v
        JOIN public.empresas e ON e.id = v.empresa_id
        WHERE v.id = v_id AND e.user_id = auth.uid()
    );
END;
$$;

-- 3. AJUSTE: TABELA CANDIDATURAS
DROP POLICY IF EXISTS "Empresa vê candidaturas das suas vagas" ON public.candidaturas;
DROP POLICY IF EXISTS "Empresa vê inscritos" ON public.candidaturas;
DROP POLICY IF EXISTS "Admin vê todas as candidaturas" ON public.candidaturas;
DROP POLICY IF EXISTS "Admin vê tudo candidaturas" ON public.candidaturas;

-- Empresa vê quem se inscreveu na vaga dela
CREATE POLICY "Empresa vê inscritos" ON public.candidaturas
    FOR SELECT USING (
        public.is_vaga_owner(vaga_id)
    );

-- Admin vê tudo sem recursão
CREATE POLICY "Admin vê tudo candidaturas" ON public.candidaturas
    FOR ALL USING (
        public.get_role_of(auth.uid()) = 'admin'
    );


-- 4. AJUSTE: TABELA CURRICULOS (Para busca livre de talentos e visualização de inscritos)
DROP POLICY IF EXISTS "Empresas veem currículos de candidatos" ON public.curriculos;
DROP POLICY IF EXISTS "Empresas e Admins podem ler todos os curriculos" ON public.curriculos;
DROP POLICY IF EXISTS "Leitura global para Empresas e Admins" ON public.curriculos;

-- Empresa pode ler TODOS os currículos (para o Banco de Talentos funcionar)
-- ou pelo menos de quem se inscreveu. Para o site ser funcional, liberamos leitura para empresas.
CREATE POLICY "Leitura global para Empresas e Admins" ON public.curriculos
    FOR SELECT USING (
        public.get_role_of(auth.uid()) IN ('empresa', 'admin')
    );

-- 5. AJUSTE: STATUS DA CANDIDATURA (Compatibilidade com Frontend)
ALTER TABLE public.candidaturas DROP CONSTRAINT IF EXISTS candidaturas_status_check;
ALTER TABLE public.candidaturas ADD CONSTRAINT candidaturas_status_check 
    CHECK (status IN ('pendente', 'em_analise', 'aprovado', 'recusado', 'visualizada'));

-- Nota: Mudança de 'aprovada' para 'aprovado' para bater com o que o React envia.
UPDATE public.candidaturas SET status = 'aprovado' WHERE status = 'aprovada';
UPDATE public.candidaturas SET status = 'recusado' WHERE status = 'recusada';
