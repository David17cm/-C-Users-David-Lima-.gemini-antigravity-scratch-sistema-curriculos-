# 🚀 Sistema de Currículos e Vagas - Guia de Deploy

Este é o guia completo para colocar o seu sistema no ar (em produção) utilizando serviços gratuitos e profissionais como **Vercel** (para o Frontend) e **Supabase** (para o Banco de Dados/Backend).

---

## 📂 1. Estrutura Atual do Projeto

O seu projeto está com a seguinte estrutura pronta e funcional:

- **Frontend:** React + Vite (Pasta `src/`)
  - `src/pages/`: Todas as telas do sistema (Dashboard do Candidato, Empresa, Admin, Preview do CV).
  - `src/components/`: Componentes visuais reutilizáveis (Navbar, Skeletons, ProtectedRoutes).
  - `src/services/supabase.js`: A conexão vital com o seu banco de dados.
- **Backend/Database:** Supabase (PostgreSQL)
  - Tudo estruturado nas tabelas `user_roles`, `empresas`, `vagas`, `curriculos` e `candidaturas`.

---

## 🔐 2. Preparação do Banco de Dados (Supabase)

Antes de subir o site, certifique-se de que o Supabase está configurado corretamente para o mundo real:

1. **Desative o RLS de Desenvolvimento Imprudente (Opcional):**
   - Se durante o desenvolvimento você deixou alguma política "aberta para todos", revise as restrições (RLS) para garantir que apenas usuários logados acessem informações de terceiros.
2. **Configure as URLs de Redirecionamento de Autenticação:**
   - No painel do Supabase, vá em **Authentication > URL Configuration**.
   - O campo `Site URL` hoje deve estar como `http://localhost:5173`. Você precisará mudar isso para o link definitivo que a Vercel/Netlify vai gerar para você (ex: `https://meu-sistema-de-vagas.vercel.app`).
   - Mantenha `http://localhost:5173` apenas na lista de "Redirect URLs" adicionais se quiser continuar desenvolvendo localmente.

---

## 🌐 3. Publicando o Frontend (Vercel)

A forma mais fácil e recomendada de colocar um site React+Vite no ar é pela Vercel.

**Passo a passo inicial:**
1. Crie uma conta no [GitHub](https://github.com/) (caso não tenha).
2. Envie (faça um *push*) desta pasta do seu projeto (`C:\Users\David Lima\.gemini\antigravity\scratch\sistema-curriculos`) para um repositório no GitHub.
   ```bash
   git init
   git add .
   git commit -m "Versão 1.0 - Sistema Completo"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

**Fazendo o Deploy:**
1. Crie uma conta na [Vercel](https://vercel.com/).
2. Clique em **"Add New" > "Project"**.
3. Conecte com o seu GitHub e importe o repositório que você acabou de enviar.
4. **⚠️ O MAIS IMPORTANTE: VARIÁVEIS DE AMBIENTE (Environment Variables)**
   - No painel de importação da Vercel, abra a seção "Environment Variables".
   - Você DEVE copiar exatamente o que tem no seu arquivo `.env` local para lá:
     - Nome: `VITE_SUPABASE_URL` | Valor: *[Sua URL do Supabase]*
     - Nome: `VITE_SUPABASE_ANON_KEY` | Valor: *[Sua Chave Anon do Supabase]*
5. Clique em **Deploy**.

A Vercel fará o build (`npm run build`) automaticamente em menos de 2 minutos. Ela te dará um link pronto como: `https://seu-sistema-curriculos.vercel.app`.

---

## 🔄 4. O Check Final

Depois que o site estiver no ar no link da Vercel:

1. Volte ao site do Supabase (Authentication > URL Configuration) e altere a **Site URL** para o novo link da Vercel para que as pessoas consigam fazer o cadastro e o login.
2. Acesse seu novo link pelo celular ou em outra guia anônima.
3. Teste o fluxo básico: Crie uma conta, preencha o currículo, e crie uma conta de empresa para testar a comunicação.

🎉 **Tudo pronto! Seu sistema estará rodando na nuvem!**
