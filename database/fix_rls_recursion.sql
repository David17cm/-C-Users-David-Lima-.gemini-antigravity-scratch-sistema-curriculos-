-- =========================================================================
-- CORREÇÃO DE RECURSÃO DE POLÍTICAS DE RLS (USER_ROLES)
-- Problema: "Leitura restrita de roles" tenta ler user_roles DE DENTRO 
-- de uma policy atrelada à PRÓPRIA user_roles, gerando loop de checagem.
-- Solução: Usar SECURITY DEFINER view ou function para checar claims de admin
-- =========================================================================

-- Passo 1: Remover a policy que causa o loop infinito ou comportamento errôneo
DROP POLICY IF EXISTS "Leitura restrita de roles" ON public.user_roles;

-- Passo 2: Criar uma função rápida e bypass para verificar se o próprio usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Passo 3: Recriar as políticas sem recursão usando a check function
CREATE POLICY "Usuário ou Admin Lê Roles" ON public.user_roles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        public.is_admin()
    );

-- Nota: Essa função is_admin() roda com privilégios de bypass (SECURITY DEFINER), 
-- então não entra no loop da política da tabela enquanto verifica o cargo do admin.
