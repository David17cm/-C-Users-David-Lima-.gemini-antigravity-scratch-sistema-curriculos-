-- Adicionando preferência de gênero na tabela de vagas
ALTER TABLE public.vagas 
ADD COLUMN IF NOT EXISTS preferencia_genero TEXT DEFAULT 'todos' CHECK (preferencia_genero IN ('todos', 'masculino', 'feminino'));
