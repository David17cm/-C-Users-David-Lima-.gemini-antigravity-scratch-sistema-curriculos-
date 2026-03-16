-- ============================================
-- Fase 2: Tabelas de Governança LGPD
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Tabela de Logs de Consentimento
-- Registra a data/hora exata do aceite dos termos no cadastro
CREATE TABLE IF NOT EXISTS consent_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    accepted_terms BOOLEAN DEFAULT FALSE,
    accepted_privacy BOOLEAN DEFAULT FALSE,
    ip_address TEXT,
    user_agent TEXT,
    consented_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Logs de Acesso
-- Registra cada login do usuário (Marco Civil da Internet)
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    action TEXT NOT NULL DEFAULT 'login',
    user_agent TEXT,
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS (Row Level Security) para as novas tabelas

-- consent_logs: só o próprio usuário pode ler seus registros
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê seus próprios consentimentos"
    ON consent_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Inserir consentimento no cadastro"
    ON consent_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin pode ver todos os consentimentos
CREATE POLICY "Admin lê todos os consentimentos"
    ON consent_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'master')
        )
    );

-- access_logs: só o próprio usuário pode ler seus registros
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê seus próprios acessos"
    ON access_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Inserir log de acesso no login"
    ON access_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin pode ver todos os logs de acesso
CREATE POLICY "Admin lê todos os acessos"
    ON access_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'master')
        )
    );
