ALTER TABLE public.curriculos
ADD COLUMN IF NOT EXISTS resumo text,
ADD COLUMN IF NOT EXISTS experiencias jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS formacoes jsonb DEFAULT '[]'::jsonb;
