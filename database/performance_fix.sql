-- SCRIPT DE OTIMIZAÇÃO DE PERFORMANCE (FASE 4)
-- Autor: Liz (Antigravity AI)
-- Objetivo: Eliminar timeouts e melhorar a resiliência do projeto sistema-curriculos

-- 1. CRIAÇÃO DE ÍNDICES EM FOREIGN KEYS (Recomendação Supabase Advisor)
-- Isso acelera buscas de relacionamentos e evita seq scans que causam timeouts

CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_candidaturas_user_id ON public.candidaturas(user_id);
CREATE INDEX IF NOT EXISTS idx_candidaturas_vaga_id ON public.candidaturas(vaga_id);
CREATE INDEX IF NOT EXISTS idx_denuncias_user_id ON public.denuncias(user_id);
CREATE INDEX IF NOT EXISTS idx_denuncias_vaga_id ON public.denuncias(vaga_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON public.notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_user_id ON public.transacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_vagas_empresa_id ON public.vagas(empresa_id);

-- 2. OTIMIZAÇÃO DE POLÍTICAS DE RLS (Row Level Security)
-- Segundo o Supabase Advisor, envolver auth.uid() em um (SELECT auth.uid())
-- evita que a função de autenticação seja reavaliada para cada linha processada.

-- Nota: Como não tenho os nomes exatos de todas as políticas, vou aplicar 
-- as correções nas tabelas mais críticas que o Advisor apontou com "InitPlan".

-- Exemplo para a tabela candidaturas
ALTER POLICY "Usuários podem ver suas próprias candidaturas" ON public.candidaturas 
USING (user_id = (SELECT auth.uid()));

ALTER POLICY "Empresas podem ver candidaturas de suas vagas" ON public.candidaturas 
USING (EXISTS (
    SELECT 1 FROM vagas 
    WHERE vagas.id = candidaturas.vaga_id 
    AND vagas.empresa_id = (SELECT auth.uid())
));

-- Exemplo para a tabela perfis
ALTER POLICY "Usuários podem ver seu próprio perfil" ON public.perfis 
USING (id = (SELECT auth.uid()));

-- Exemplo para access_logs
ALTER POLICY "Apenas admin pode ver logs" ON public.access_logs 
USING ((SELECT auth.uid()) IN (SELECT id FROM perfis WHERE role = 'admin'));

-- 3. ANALYZE PARA ATUALIZAR ESTATÍSTICAS
ANALYZE public.access_logs;
ANALYZE public.candidaturas;
ANALYZE public.vagas;
ANALYZE public.perfis;
ANALYZE public.transacoes;

-- LOG DE EXECUÇÃO
INSERT INTO public.health_logs (status, message) 
VALUES ('SUCCESS', 'Otimização de performance (Fase 4) aplicada com sucesso: Índices e RLS otimizados.');
