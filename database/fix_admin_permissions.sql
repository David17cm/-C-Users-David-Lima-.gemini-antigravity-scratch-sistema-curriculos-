-- =========================================================================
-- CORREÇÃO DE PERMISSÕES DO ADMINISTRADOR (EMPRESAS E VAGAS)
-- Problema: O Admin tentava aprovar empresas e fechar vagas pelo painel,
-- mas o banco de dados ignorava (falha silenciosa) porque as políticas (RLS)
-- permitiam UPDATE apenas ao "dono" (a própria empresa).
-- Solução: Adicionar políticas de UPDATE para o Admin nestas tabelas.
-- Dependência: Requer a função `public.is_admin()` (já criada no fix anterior).
-- =========================================================================

-- 1. Permite que o Admin edite dados da empresa (ex: mudar status de aprovada)
DROP POLICY IF EXISTS "Admins podem alterar empresas" ON public.empresas;
CREATE POLICY "Admins podem alterar empresas" ON public.empresas
    FOR UPDATE USING (
        public.is_admin()
    );

-- 2. Permite que o Admin edite dados das vagas (ex: forçar fechamento de vaga abusiva)
DROP POLICY IF EXISTS "Admins podem alterar vagas" ON public.vagas;
CREATE POLICY "Admins podem alterar vagas" ON public.vagas
    FOR UPDATE USING (
        public.is_admin()
    );

-- 3. (Opcional, mas recomendado) Admin ler perfil de quem ainda não completou tudo
-- A policy atual de empresas diz: "Authenticated users can view empresas", que já cobre leitura global.

-- Nota: Todas as exclusões (DELETE) continuam bloqueadas por padrão no frontend/backend 
-- para evitar perda acidental de histórico.
