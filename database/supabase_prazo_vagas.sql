-- ============================================================
-- ADIÇÃO DO CAMPO "DATA LIMITE" NA TABELA DE VAGAS
-- ============================================================
-- Execute o script abaixo no SQL Editor do Supabase para criar
-- o suporte ao novo campo de prazo de encerramento das vagas.

ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS data_limite DATE;
