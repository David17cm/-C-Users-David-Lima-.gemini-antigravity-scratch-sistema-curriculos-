-- AUDITORIA DE SEGURANÇA - CORREÇÕES CRÍTICAS
-- David, execute este script para fechar brechas de segurança identificadas.

-- 1. PROTEÇÃO DE AUTO-PROMOÇÃO (user_roles)
-- O cadastro via cliente só deve permitir a role 'candidato'. 
-- Admins e Empresas devem ser criados via Painel Admin ou SQL.
DROP POLICY IF EXISTS "Users can insert their own role on signup" ON public.user_roles;
CREATE POLICY "Registro apenas como candidato" ON public.user_roles
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND role = 'candidato'
    );

-- 2. PRIVACIDADE DE ROLES
-- Apenas o próprio usuário ou admins devem ver as roles.
DROP POLICY IF EXISTS "Anyone can read roles" ON public.user_roles;
CREATE POLICY "Leitura restrita de roles" ON public.user_roles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
    );

-- 3. SEGURANÇA DE STORAGE (avatars)
-- Garantir que o usuário só consiga gerenciar o arquivo vinculado ao seu próprio UID.
-- Convenção de path: avatars/userID/arquivo.jpg
DROP POLICY IF EXISTS "Upload de fotos" ON storage.objects;
CREATE POLICY "Upload apenas na pasta propria" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Atualizacao apenas na pasta propria" ON storage.objects 
    FOR UPDATE USING (
        bucket_id = 'avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Remocao apenas na pasta propria" ON storage.objects 
    FOR DELETE USING (
        bucket_id = 'avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 4. REFORÇO DE PRIVACIDADE DE ENDEREÇO
-- Apenas o dono e Admins podem ver o endereço completo.
-- Empresas já possuem uma policy específica que permite ver apenas o que for selecionado via código (bairro/cidade).
-- Mas para segurança total no DB, vamos garantir que SELECT * oculte o endereço de terceiros.
-- (No Postgres RLS é binário, ou vê a linha ou não vê. Ocultar COLUNAS requer Views ou filtragem no código como já fazemos).
-- Para este sistema, manteremos a filtragem robusta no código (react) e a RLS de linha que já existe.

-- 5. VERIFICAÇÃO DE EMPRESA APROVADA
-- Garantir que apenas empresas aprovadas consigam postar vagas.
DROP POLICY IF EXISTS "Empresa insere propria vaga" ON public.vagas;
CREATE POLICY "Empresa aprovada insere vaga" ON public.vagas
    FOR INSERT WITH CHECK (
        empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid() AND aprovada = true)
    );
