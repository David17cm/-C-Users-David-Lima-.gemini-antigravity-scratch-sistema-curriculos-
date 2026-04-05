import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
                    <ShieldAlert size={48} color="var(--neon-blue)" style={{ margin: '0 auto 1rem' }} />
                    <h1 style={{ color: 'var(--neon-blue)', fontSize: '1.8rem' }}>TERMOS DE USO</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Última atualização: 15 de Março de 2026</p>
                </div>

                <div style={{ color: 'var(--light-text)', lineHeight: '1.7', fontSize: '0.95rem' }}>

                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>1. Aceitação dos Termos</h3>
                        <p>Ao acessar e utilizar a plataforma Norte Empregos, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso. Se não concordar com qualquer cláusula, não utilize os serviços.</p>
                    </section>

                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>2. Descrição do Serviço</h3>
                        <p>A plataforma oferece um sistema de criação e gestão de currículos profissionais, conectando candidatos a empresas recrutadoras. Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer funcionalidade a qualquer momento, com ou sem aviso prévio.</p>
                    </section>

                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>3. Responsabilidades do Usuário (Candidato)</h3>
                        <p>O candidato é o único responsável pela veracidade e exatidão das informações inseridas em seu currículo. Declarações falsas, incluindo formação acadêmica, experiência profissional ou habilidades, podem resultar em suspensão imediata e permanente da conta, além de possível responsabilidade legal.</p>
                    </section>

                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>4. Regras para Empresas (Empregadores)</h3>
                        <p>Empresas que utilizam a plataforma para publicar vagas concordam com as seguintes regras:</p>
                        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                            <li>As vagas publicadas devem ser reais, legítimas e com remuneração honesta.</li>
                            <li>É expressamente proibido publicar vagas com qualquer tipo de discriminação (gênero, raça, idade, orientação sexual, etc.).</li>
                            <li>É proibido utilizar a plataforma para coletar dados pessoais de candidatos de forma ilícita ou para fins que não sejam o processo seletivo.</li>
                            <li>Esquemas de pirâmide financeira, marketing multinível disfarçado de emprego e qualquer oportunidade enganosa são vedados.</li>
                            <li>A empresa assume total responsabilidade pelo conteúdo das vagas publicadas.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>5. Política Anti-Fraude</h3>
                        <p>É expressamente proibido na plataforma:</p>
                        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                            <li>Criar perfis de usuário com identidade falsa ou se passar por outra pessoa.</li>
                            <li>Realizar phishing ou qualquer outra tentativa de obtenção ilícita de dados.</li>
                            <li>Aplicar golpes de qualquer natureza contra outros usuários da plataforma.</li>
                            <li>Usar scripts automáticos, bots ou qualquer meio não humano para abusar dos serviços.</li>
                        </ul>
                        <p style={{ marginTop: '0.75rem' }}>Violações a esta política resultarão em remoção imediata da conta e poderão ser reportadas às autoridades competentes. Para denunciar comportamento suspeito, entre em contato pelo e-mail: <b>suporte@nortevagas.online</b>.</p>
                    </section>

                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>6. Propriedade Intelectual</h3>
                        <p>Todo o conteúdo, design e código da plataforma são protegidos pelas leis de direitos autorais. A reprodução, distribuição ou modificação não autorizada é proibida. O conteúdo do currículo do candidato é de sua propriedade, cabendo à plataforma apenas o direito de armazená-lo e exibi-lo conforme autorizado.</p>
                    </section>

                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>7. Limitação de Responsabilidade</h3>
                        <p>A plataforma é uma ferramenta de intermediação. Não garantimos e não somos responsáveis por:</p>
                        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                            <li>Que o uso do currículo resultará em contratação.</li>
                            <li>A veracidade das vagas publicadas pelas empresas.</li>
                            <li>Acordos, contratos ou negociações realizados diretamente entre empresa e candidato.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>8. Cancelamento e Exclusão de Conta</h3>
                        <p>O usuário pode solicitar a exclusão de sua conta e de todos os seus dados a qualquer momento pelo painel de configurações ou pelo e-mail de suporte. Uma vez excluídos, os dados não poderão ser recuperados, em conformidade com o direito ao esquecimento previsto na LGPD.</p>
                    </section>

                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>9. Resolução de Disputas</h3>
                        <p>Eventuais conflitos decorrentes destes Termos serão resolvidos prioritariamente por acordo direto entre as partes. Na impossibilidade de acordo, fica eleito o foro da Comarca de [Cidade/UF], com renúncia a qualquer outro, por mais privilegiado que seja.</p>
                    </section>
                    
                    <section style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>10. Casos de Sucesso e Divulgação</h3>
                        <p>Ao utilizar a plataforma e obter uma contratação através das vagas aqui publicadas, o usuário (Candidato) autoriza expressamente a Norte Empregos a utilizar seu nome e imagem (conforme fornecidos no cadastro) para fins de divulgação de "Cases de Sucesso". Esta divulgação poderá ocorrer em nossas redes sociais, site oficial e materiais de marketing, com o objetivo de celebrar a conquista do usuário e demonstrar a eficácia da plataforma.</p>
                    </section>


                </div>

                <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button className="neon-button" onClick={() => navigate(-1)}>
                        ESTOU DE ACORDO
                    </button>
                </div>
            </div>
        </div>
    );
}
