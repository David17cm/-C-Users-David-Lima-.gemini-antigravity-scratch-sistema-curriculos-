-- ============================================
-- Sistema de Denúncias Interno (LGPD Compliance)
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Tabela de Denúncias
CREATE TABLE IF NOT EXISTS denuncias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Candidato que denunciou
    vaga_id UUID REFERENCES vagas(id) ON DELETE CASCADE,      -- Vaga denunciada
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,-- Empresa responsável
    motivo TEXT NOT NULL,                                     -- Descrição da denúncia
    status TEXT NOT NULL DEFAULT 'pendente',                  -- pendente, analisado, arquivado
    resolucao TEXT,                                           -- Comentário do admin
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS (Row Level Security)
ALTER TABLE denuncias ENABLE ROW LEVEL SECURITY;

-- Candidatos podem criar denúncias (INSERT)
CREATE POLICY "Candidatos podem criar denúncias"
    ON denuncias FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Candidatos podem ver suas próprias denúncias
CREATE POLICY "Candidatos vêem suas denúncias"
    ON denuncias FOR SELECT
    USING (auth.uid() = user_id);

-- Admins podem ver e editar todas as denúncias
CREATE POLICY "Admins gerenciam denúncias"
    ON denuncias FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'master')
        )
    );

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_denuncias_updated_at
    BEFORE UPDATE ON denuncias
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
