-- ============================================================
-- ADIÇÃO DE PERFIL COMPORTAMENTAL (Teste DISC)
-- ============================================================
-- Execute o script abaixo no SQL Editor do Supabase para criar
-- o suporte ao novo formulário que o candidato preencherá.

ALTER TABLE public.curriculos ADD COLUMN IF NOT EXISTS perfil_disc TEXT;
