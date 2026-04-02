import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Eye } from 'lucide-react';

export default function PrivacyPage() {
    const navigate = useNavigate();

    return (
        <div className="flex-center" style={{ padding: '2rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', textAlign: 'left' }}>
                <button 
                    onClick={() => navigate(-1)} 
                    style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}
                >
                    <ArrowLeft size={18} /> Voltar
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <Lock size={48} color="var(--neon-blue)" style={{ margin: '0 auto 1rem' }} />
                    <h1 style={{ color: 'var(--neon-blue)', fontSize: '1.8rem' }}>POLÍTICA DE PRIVACIDADE</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Conforme a Lei Geral de Proteção de Dados (LGPD)</p>
                </div>

                <div className="privacy-content" style={{ color: 'var(--light-text)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>1. Informações que Coletamos</h3>
                        <p>Para fornecer nossos serviços, coletamos as seguintes informações:</p>
                        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                            <li>Dados de Cadastro: Nome completo, e-mail e senha (criptografada).</li>
                            <li>Dados do Currículo: Experiência profissional, formação acadêmica, habilidades e contatos que você optar por inserir.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>2. Finalidade do Tratamento</h3>
                        <p>Seus dados são utilizados exclusivamente para:</p>
                        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                            <li>Gerar e personalizar o arquivo do seu currículo.</li>
                            <li>Permitir que você acesse e edite suas informações futuramente.</li>
                            <li>Gerenciar o acesso ao sistema e suporte técnico.</li>
                            <li>Divulgação de <b>Cases de Sucesso</b>: Em caso de contratação comprovada, seu nome e imagem podem ser utilizados em comunicações de marketing da plataforma, conforme detalhado nos Termos de Uso.</li>
                        </ul>

                    </section>

                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>3. Compartilhamento de Dados</h3>
                        <p>Nós não vendemos ou compartilhamos seus dados pessoais com terceiros para fins de marketing. O acesso aos dados é restrito ao próprio usuário e, em casos técnicos, aos administradores do sistema para manutenção.</p>
                    </section>

                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>4. Seus Direitos (LGPD)</h3>
                        <p>Como titular dos dados, você tem direito a:</p>
                        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                            <li>Confirmação da existência de tratamento.</li>
                            <li>Acesso aos dados e correção de dados incompletos ou inexatos.</li>
                            <li>Eliminação dos dados pessoais tratados (revogação do consentimento).</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>5. Segurança</h3>
                        <p>Utilizamos tecnologias de ponta, como criptografia de ponta a ponta e provedores de infraestrutura seguros (Supabase/Vercel) para garantir que suas informações estejam protegidas contra acessos não autorizados.</p>
                    </section>

                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>6. Contato</h3>
                        <p>Para dúvidas sobre sua privacidade, entre em contato através do e-mail de suporte disponível no painel.</p>
                    </section>
                </div>

                <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button className="neon-button" onClick={() => navigate(-1)}>
                        CIENTE DA POLÍTICA
                    </button>
                </div>
            </div>
        </div>
    );
}
