-- ============================================================
-- SUPABASE ADMIN DELETE FUNCTIONS
-- ============================================================
-- ATENÇÃO: Cole todo este código na aba "SQL Editor" de seu painel do Supabase.
-- Estas funções rodam com privilégios elevados (SECURITY DEFINER)
-- para permitir que apenas a equipe Administrativa consiga excluir
-- usuários irreversivelmente sem precisar usar chaves de Servidor.

-- 1. FUNÇÃO: Excluir Usuário e Seus Rastros Completamente
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Apenas admins ou masters podem executar
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'master')) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem excluir usuários estruturalmente.';
  END IF;

  -- Deletar registros locais na API (a ordem importa para evitar conflito de chaves)
  DELETE FROM public.candidaturas WHERE user_id = target_user_id;
  DELETE FROM public.curriculos WHERE user_id = target_user_id;
  
  -- Se for uma Empresa, também apagamos as vagas relativas e as candidaturas dessas vagas
  DELETE FROM public.candidaturas WHERE vaga_id IN (SELECT id FROM public.vagas WHERE empresa_id IN (SELECT id FROM public.empresas WHERE user_id = target_user_id));
  DELETE FROM public.denuncias WHERE vaga_id IN (SELECT id FROM public.vagas WHERE empresa_id IN (SELECT id FROM public.empresas WHERE user_id = target_user_id));
  DELETE FROM public.vagas WHERE empresa_id IN (SELECT id FROM public.empresas WHERE user_id = target_user_id);
  
  DELETE FROM public.empresas WHERE user_id = target_user_id;
  DELETE FROM public.access_logs WHERE user_id = target_user_id;
  DELETE FROM public.consent_logs WHERE user_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- O GRANDE FINAL: Excluir irreversivelmente da tabela de Login da API
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. FUNÇÃO: Excluir Vaga Definitivamente e Seu Histórico
CREATE OR REPLACE FUNCTION admin_delete_vaga(target_vaga_id UUID)
RETURNS void AS $$
BEGIN
  -- Apenas admins ou masters podem executar
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'master')) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem excluir vagas.';
  END IF;

  -- Deletar registros dependentes dessa vaga
  DELETE FROM public.candidaturas WHERE vaga_id = target_vaga_id;
  DELETE FROM public.denuncias WHERE vaga_id = target_vaga_id;
  
  -- Deletar a vaga em si
  DELETE FROM public.vagas WHERE id = target_vaga_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
