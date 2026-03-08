-- =============================================================
-- SCRIPT: Criação de Usuários de Teste
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor)
-- Senha de todos: 123456
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- PASSO 1: Criar usuários (verifica existência antes de inserir)
-- =============================================================

DO $$
DECLARE
    admin_id     uuid;
    candidato_id uuid;
    empresa_id   uuid;
BEGIN

    -- ---- ADMIN ----
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@gmail.com';
    IF admin_id IS NULL THEN
        admin_id := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role,
            email, encrypted_password,
            email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at,
            confirmation_token, email_change,
            email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            admin_id, 'authenticated', 'authenticated',
            'admin@gmail.com',
            crypt('123456', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Admin"}',
            NOW(), NOW(), '', '', '', ''
        );
        RAISE NOTICE 'Usuário admin@gmail.com criado com ID: %', admin_id;
    ELSE
        RAISE NOTICE 'Usuário admin@gmail.com já existe com ID: %', admin_id;
    END IF;

    -- ---- CANDIDATO ----
    SELECT id INTO candidato_id FROM auth.users WHERE email = 'teste.candidato@gmail.com';
    IF candidato_id IS NULL THEN
        candidato_id := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role,
            email, encrypted_password,
            email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at,
            confirmation_token, email_change,
            email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            candidato_id, 'authenticated', 'authenticated',
            'teste.candidato@gmail.com',
            crypt('123456', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Candidato Teste"}',
            NOW(), NOW(), '', '', '', ''
        );
        RAISE NOTICE 'Usuário teste.candidato@gmail.com criado com ID: %', candidato_id;
    ELSE
        RAISE NOTICE 'Usuário teste.candidato@gmail.com já existe com ID: %', candidato_id;
    END IF;

    -- ---- EMPRESA ----
    SELECT id INTO empresa_id FROM auth.users WHERE email = 'teste.empresa@gmail.com';
    IF empresa_id IS NULL THEN
        empresa_id := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role,
            email, encrypted_password,
            email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at,
            confirmation_token, email_change,
            email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            empresa_id, 'authenticated', 'authenticated',
            'teste.empresa@gmail.com',
            crypt('123456', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Empresa Teste"}',
            NOW(), NOW(), '', '', '', ''
        );
        RAISE NOTICE 'Usuário teste.empresa@gmail.com criado com ID: %', empresa_id;
    ELSE
        RAISE NOTICE 'Usuário teste.empresa@gmail.com já existe com ID: %', empresa_id;
    END IF;

    -- =============================================================
    -- PASSO 2: Inserir/atualizar roles na tabela user_roles
    -- =============================================================

    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

    INSERT INTO public.user_roles (user_id, role)
    VALUES (candidato_id, 'candidato')
    ON CONFLICT (user_id) DO UPDATE SET role = 'candidato';

    INSERT INTO public.user_roles (user_id, role)
    VALUES (empresa_id, 'empresa')
    ON CONFLICT (user_id) DO UPDATE SET role = 'empresa';

    RAISE NOTICE 'Roles inseridas/atualizadas com sucesso!';

END $$;

-- =============================================================
-- VERIFICAÇÃO FINAL
-- =============================================================

SELECT
    u.email,
    r.role,
    u.email_confirmed_at IS NOT NULL AS email_confirmado,
    u.id
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE u.email IN (
    'admin@gmail.com',
    'teste.candidato@gmail.com',
    'teste.empresa@gmail.com'
)
ORDER BY r.role;
