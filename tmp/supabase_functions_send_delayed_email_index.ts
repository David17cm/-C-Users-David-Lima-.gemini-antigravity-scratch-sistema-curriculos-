import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { userEmail, type, notificationId } = payload;

    console.log('[INFO] Processando envio: ' + type + ' para ' + userEmail);

    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY não configurada no ambiente.");
    }

    let subject = "Novidades importantes do BI Alves";
    let htmlBody = "";

    if (type === 'sem_curriculo' || type === 'recuperacao') {
      subject = "🚀 Seu currículo está incompleto no BI Alves!";
      htmlBody = `
        <div style="font-family: sans-serif; background: #0f172a; color: #fff; padding: 40px; border-radius: 12px; border: 1px solid #38bdf8; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #38bdf8; margin-top: 0;">Olá!</h1>
          <p style="font-size: 1.1rem; line-height: 1.6;">Vimos que você ainda não completou seu perfil no sistema de talentos do BI Alves.</p>
          <div style="background: rgba(56,189,248,0.1); padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #38bdf8;">💡 Sabia que perfis completos têm 5x mais chances de serem selecionados pelas empresas?</p>
          </div>
          <p>Não perca a sua próxima oportunidade profissional por um perfil incompleto.</p>
          <div style="margin: 35px 0; text-align: center;">
            <a href="https://sistema-curriculos.vercel.app/perfil" style="background: #38bdf8; color: #000; padding: 14px 30px; text-decoration: none; font-weight: 800; border-radius: 8px; display: inline-block;">COMPLETAR AGORA</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #1e293b; margin: 30px 0;">
          <p style="font-size: 0.85rem; color: #64748b; text-align: center;">Equipe BI Alves - Sistema de Talentos</p>
        </div>
      `;
    } else if (type === 'novas_vagas') {
      subject = "📢 Oportunidades Urgentes no BI Alves!";
      
      // Buscar vagas dinâmicas
      console.log('[INFO] Buscando vagas com maior salário...');
      const { data: vagas, error: vagasError } = await supabase
        .from('vagas')
        .select('*, empresas(razao_social)')
        .eq('status', 'aberta')
        .order('salario_max', { ascending: false }) // Prioridade: Maior salário
        .order('created_at', { ascending: false })  // Depois: Mais recentes
        .limit(3);

      if (vagasError) console.error('[ERROR] Falha ao buscar vagas:', vagasError);

      let vagasHtml = "";
      if (vagas && vagas.length > 0) {
        vagasHtml = vagas.map(v => `
          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 15px; margin-bottom: 12px;">
            <h3 style="margin: 0 0 5px 0; color: #a855f7; text-transform: uppercase; font-size: 1.1rem;">${v.titulo}</h3>
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #fff; font-size: 0.95rem;">🏢 ${v.empresas?.razao_social || 'Empresa parceira'}</p>
            <div style="display: flex; gap: 15px; flex-wrap: wrap; font-size: 0.85rem;">
               <span style="color: #22c55e; font-weight: bold;">💰 R$ ${v.salario_max ? v.salario_max.toLocaleString('pt-BR') : 'A Combinar'}</span>
               <span style="color: #94a3b8;">📍 ${v.cidade || 'Remoto'}</span>
            </div>
            <p style="margin: 10px 0 0 0; font-size: 0.85rem; color: #cbd5e1; line-height: 1.4;">${v.descricao.substring(0, 100)}...</p>
          </div>
        `).join('');
      } else {
        vagasHtml = '<p style="color: #94a3b8; text-align: center;">Nenhuma vaga específica para este momento, mas confira o portal para novidades!</p>';
      }

      htmlBody = `
        <div style="font-family: sans-serif; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 12px; border: 1px solid #a855f7; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #a855f7; margin-top: 0; text-align: center;">Vagas Imperdíveis!</h1>
          <p style="text-align: center; color: #cbd5e1;">Selecionamos as 3 melhores oportunidades para você agora:</p>
          
          <div style="margin: 30px 0;">
            ${vagasHtml}
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://sistema-curriculos.vercel.app" style="background: #a855f7; color: #fff; padding: 14px 35px; text-decoration: none; font-weight: 800; border-radius: 8px; display: inline-block;">VER TODAS AS VAGAS</a>
          </div>
          
          <p style="font-size: 0.8rem; color: #64748b; text-align: center; margin-top: 40px;">Você está recebendo este e-mail porque se cadastrou no Banco de Talentos BI Alves.</p>
        </div>
      `;
    }

    // DISPARO VIA BREVO API
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sender: { name: "Talentos BI Alves", email: "contato@bialves.com" },
        to: [{ email: userEmail }],
        subject: subject,
        htmlContent: htmlBody
      })
    });

    const result = await response.json();

    if (notificationId && response.ok) {
      await supabase
        .from('notificacoes_enviadas')
        .update({ 
          status: 'sent', 
          enviado_em: new Date().toISOString(),
          resend_id: result.messageId // Guardamos o ID do Brevo no mesmo campo por simplicidade
        })
        .eq('id', notificationId);
    }

    return new Response(JSON.stringify({ success: response.ok, result }), { 
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e) {
    console.error('[ERROR]', e.message);
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

