-- ================================================================
-- KEEPALIVE: Evitar pausa por inatividade do Supabase (plano free)
-- Execute este script no SQL Editor do Supabase:
--   Dashboard > SQL Editor > New query > Cole e execute
--
-- O que ele faz:
--   1. Habilita a extensão pg_cron (nativa do Supabase)
--   2. Cria uma tabela de log de saúde do sistema
--   3. Agenda um job que roda a cada 4 dias e registra o ping
--
-- Resultado: O banco NUNCA será pausado por inatividade.
-- ================================================================

-- 1. Habilitar extensão pg_cron (nativa do Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Criar tabela de logs de saúde (para auditoria e monitoramento)
CREATE TABLE IF NOT EXISTS public.system_health_logs (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    checked_at  timestamptz DEFAULT now() NOT NULL,
    status      text        DEFAULT 'ok' NOT NULL,
    note        text
);

-- RLS: somente admins podem ler os logs de saúde
ALTER TABLE public.system_health_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_can_read_health_logs" ON public.system_health_logs;
CREATE POLICY "admin_can_read_health_logs"
    ON public.system_health_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- 3. Remover job anterior se existir (para evitar duplicatas ao re-executar)
SELECT cron.unschedule('supabase-keepalive') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'supabase-keepalive'
);

-- 4. Agendar o job de keepalive a cada 4 dias (às 06:00 UTC)
--    Formato cron: minuto hora dia-do-mês mês dia-da-semana
--    "0 6 */4 * *" = às 06:00 UTC, a cada 4 dias
SELECT cron.schedule(
    'supabase-keepalive',
    '0 6 */4 * *',
    $$
        INSERT INTO public.system_health_logs (status, note)
        VALUES ('ok', 'Keepalive automático — banco ativo e respondendo.');
    $$
);

-- 5. Verificar se o job foi criado com sucesso
SELECT
    jobname,
    schedule,
    command,
    active
FROM cron.job
WHERE jobname = 'supabase-keepalive';
