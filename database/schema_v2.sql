-- Script de Atualização do Banco de Dados (Sistema de Currículos V2)
-- Execute este script no SQL Editor do seu painel do Supabase.

-- 1. Criação da tabela de Perfis (User Roles)
CREATE TABLE public.user_roles (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('admin', 'empresa', 'candidato')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas de user_roles
-- Usuários podem ler sua própria role
CREATE POLICY "Users can read their own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Admins podem ler todas as roles (precisaremos de uma policy especial aqui)
-- Para evitar recursão infinita (admin checando se ele é admin para ver roles),
-- faremos a validação de forma direta (recomendado usar claims de JWT, mas para MVP vamos usar a tabela)
-- Ex: Usuário insere no cadastro se é empresa ou candidato.
-- Por enquanto, no MVP, vamos permitir que cada usuário veja a role dos outros apenas se for do tipo 'admin'
-- Ou para facilitar, como user_roles não é sensível, deixamos apenas permissão de leitura global:
CREATE POLICY "Anyone can read roles" ON public.user_roles
    FOR SELECT USING (true);

-- A inserção de novos roles: (Por segurança seria ideal criar via trigger ou function backend, 
-- mas permitiremos insert associado ao próprio UID no momento do cadastro inicial)
CREATE POLICY "Users can insert their own role on signup" ON public.user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 2. Criação da tabela de Empresas (Dados PJ)
CREATE TABLE public.empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_roles(user_id) NOT NULL UNIQUE,
    cnpj TEXT NOT NULL UNIQUE,
    razao_social TEXT NOT NULL,
    descricao_empresa TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa logada (candidatos) pode ver os dados das empresas (para ver de quem é a vaga)
CREATE POLICY "Authenticated users can view empresas" ON public.empresas
    FOR SELECT USING (auth.role() = 'authenticated');

-- Empresas podem editar seu próprio perfil
CREATE POLICY "Empresas can update their own data" ON public.empresas
    FOR UPDATE USING (auth.uid() = user_id);
    
CREATE POLICY "Empresas can insert their own data" ON public.empresas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Criação da tabela de Vagas
CREATE TABLE public.vagas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    requisitos TEXT,
    status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;

-- Todos logados podem ver vagas
CREATE POLICY "Qualquer logado pode ver vagas" ON public.vagas
    FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas a empresa dona pode inserir/editar vagas
CREATE POLICY "Empresa insere propria vaga" ON public.vagas
    FOR INSERT WITH CHECK (
        empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid())
    );

CREATE POLICY "Empresa edita propria vaga" ON public.vagas
    FOR UPDATE USING (
        empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid())
    );


-- 4. Ajustes nas Políticas da tabela de Currículos
-- A tabela 'curriculos' já existe. Vamos apenas adicionar políticas para que Empresas possam ler todos e Admins também.

-- Permitir leitura de TODOS os currículos se o usuário logado tiver a role 'empresa' ou 'admin'
CREATE POLICY "Empresas e Admins podem ler todos os curriculos" ON public.curriculos
    FOR SELECT USING (
        (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) IN ('empresa', 'admin')
    );

-- Nota: A política "Users can view their own curriculo" já garante que o candidato veja o dele.
-- As políticas de INSERT e UPDATE já estão prontas no seu schema.sql oriinal e continuam válidas.
