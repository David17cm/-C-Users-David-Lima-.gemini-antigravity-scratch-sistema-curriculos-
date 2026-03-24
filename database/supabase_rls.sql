-- ============================================================
-- SUPABASE RLS (Row Level Security) — sistema-curriculos
-- ============================================================
-- INSTRUÇÕES: Cole todo este SQL no painel do Supabase:
--   Dashboard → SQL Editor → Cole e clique em RUN
-- ============================================================

-- ============================================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================
ALTER TABLE curriculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Execute este também se a tabela denuncias existir:
ALTER TABLE denuncias ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. FUNÇÃO AUXILIAR — verifica se o usuário é admin/master
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'master')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- 3. FUNÇÃO AUXILIAR — verifica se o usuário é empresa aprovada
-- ============================================================
CREATE OR REPLACE FUNCTION is_empresa_aprovada()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM empresas
    WHERE user_id = auth.uid()
    AND aprovada = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- 4. TABELA: curriculos
-- ============================================================

-- Candidato pode ver e editar apenas seu próprio currículo
CREATE POLICY "candidato_select_proprio_curriculo" ON curriculos
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin()
    OR (
      -- Empresa aprovada pode ver currículos dos candidatos das SUAS vagas (CRIT-03)
      is_empresa_aprovada()
      AND user_id IN (
        SELECT c.user_id FROM candidaturas c
        INNER JOIN vagas v ON c.vaga_id = v.id
        INNER JOIN empresas e ON v.empresa_id = e.id
        WHERE e.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "candidato_insert_proprio_curriculo" ON curriculos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "candidato_update_proprio_curriculo" ON curriculos
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- HIGH-05: Delete restrito ao próprio usuário ou admin
CREATE POLICY "candidato_delete_proprio_curriculo" ON curriculos
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ============================================================
-- 5. TABELA: user_roles
-- ============================================================

-- Qualquer usuário autenticado pode ver SUA própria role
CREATE POLICY "usuario_ver_propria_role" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Apenas o sistema (SECURITY DEFINER functions) pode inserir/atualizar roles
-- Nas operações de cadastro (handleSignup), o insert é feito com a anon key
-- mas o user_id é sempre o uid() do usuário recém-criado.
CREATE POLICY "sistema_insert_role" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_update_role" ON user_roles
  FOR UPDATE TO authenticated
  USING (is_admin());

-- ============================================================
-- 6. TABELA: vagas
-- ============================================================

-- Qualquer usuário autenticado pode visualizar vagas abertas
CREATE POLICY "todos_ver_vagas_abertas" ON vagas
  FOR SELECT TO authenticated
  USING (status = 'aberta' OR is_admin() OR (
    EXISTS (SELECT 1 FROM empresas WHERE user_id = auth.uid() AND id = vagas.empresa_id)
  ));

-- Empresa pode inserir vagas apenas para ela mesma
CREATE POLICY "empresa_insert_vaga" ON vagas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM empresas WHERE user_id = auth.uid() AND id = empresa_id AND aprovada = true)
  );

-- Empresa pode atualizar/fechar apenas suas próprias vagas; admin pode tudo
CREATE POLICY "empresa_update_propria_vaga" ON vagas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM empresas WHERE user_id = auth.uid() AND id = vagas.empresa_id)
    OR is_admin()
  );

-- ============================================================
-- 7. TABELA: candidaturas
-- ============================================================

-- Candidato vê suas candidaturas; empresa vê candidaturas de suas vagas; admin vê tudo
CREATE POLICY "ver_candidaturas" ON candidaturas
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM vagas v
      INNER JOIN empresas e ON v.empresa_id = e.id
      WHERE v.id = candidaturas.vaga_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "candidato_se_candidatar" ON candidaturas
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- HIGH-05: Candidato pode excluir apenas suas candidaturas
CREATE POLICY "candidato_delete_candidatura" ON candidaturas
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Empresa pode atualizar status da candidatura
CREATE POLICY "empresa_update_status_candidatura" ON candidaturas
  FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM vagas v
      INNER JOIN empresas e ON v.empresa_id = e.id
      WHERE v.id = candidaturas.vaga_id AND e.user_id = auth.uid()
    )
  );

-- ============================================================
-- 8. TABELA: empresas
-- ============================================================

CREATE POLICY "empresa_ver_proprio_perfil" ON empresas
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "empresa_criar_proprio_perfil" ON empresas
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "empresa_atualizar_proprio_perfil" ON empresas
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ============================================================
-- 9. TABELA: access_logs — CRIT-04: Apenas admin lê
-- ============================================================

CREATE POLICY "admin_ver_access_logs" ON access_logs
  FOR SELECT TO authenticated
  USING (is_admin() OR user_id = auth.uid());

-- O próprio sistema insere logs (qualquer autenticado pode inserir o próprio)
CREATE POLICY "usuario_inserir_access_log" ON access_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 10. TABELA: consent_logs — CRIT-04: Apenas admin lê
-- ============================================================

CREATE POLICY "admin_ver_consent_logs" ON consent_logs
  FOR SELECT TO authenticated
  USING (is_admin() OR user_id = auth.uid());

CREATE POLICY "usuario_inserir_consent_log" ON consent_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 11. TABELA: transacoes — Apenas admin lê
-- ============================================================

CREATE POLICY "admin_ver_transacoes" ON transacoes
  FOR SELECT TO authenticated
  USING (is_admin() OR user_id = auth.uid());

CREATE POLICY "usuario_inserir_transacao" ON transacoes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 12. TABELA: denuncias — Candidato insere; admin gerencia
-- ============================================================

CREATE POLICY "candidato_inserir_denuncia" ON denuncias
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_ver_denuncias" ON denuncias
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "admin_atualizar_denuncia" ON denuncias
  FOR UPDATE TO authenticated
  USING (is_admin());
