import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Cookie, Building, Users, AlertTriangle, Lock, Clock, Megaphone, Download, Trash2, Scale } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function LegalPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const docParam = searchParams.get('doc');
    
    // Lista base de documentos
    const [docs, setDocs] = useState([
        {
            id: 'termos',
            icon: <FileText size={18} />,
            label: 'Termos de Uso',
            content: (
                <>
                    <h3>1. Aceitação dos Termos</h3>
                    <p>Ao acessar e utilizar a plataforma Norte Empregos, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso. Se não concordar com qualquer cláusula, não utilize os serviços.</p>
                    <h3>2. Descrição do Serviço</h3>
                    <p>A plataforma oferece um sistema de criação e gestão de currículos profissionais, conectando candidatos a empresas recrutadoras. Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer funcionalidade a qualquer momento.</p>
                    <h3>3. Limitação de Responsabilidade</h3>
                    <p>A plataforma é uma ferramenta de intermediação. Não garantimos e não somos responsáveis por: que o uso do currículo resultará em contratação; a veracidade das vagas publicadas pelas empresas; acordos ou contratos realizados diretamente entre empresa e candidato.</p>
                    <h3>4. Resolução de Disputas</h3>
                    <p>Eventuais conflitos decorrentes destes Termos serão resolvidos prioritariamente por acordo direto entre as partes. Na impossibilidade de acordo, fica eleito o foro da comarca competente da sede da plataforma.</p>
                </>
            )
        },
        {
            id: 'privacidade',
            icon: <Shield size={18} />,
            label: 'Política de Privacidade',
            content: (
                <>
                    <h3>1. Dados que Coletamos</h3>
                    <p><strong>Candidatos:</strong> nome, e-mail, telefone, CPF, endereço, currículo, experiências, formação, foto e documentos.</p>
                    <p><strong>Empresas:</strong> razão social, CNPJ, dados do responsável, endereço, vagas publicadas e dados de pagamento.</p>
                    <h3>2. Como Usamos os Dados</h3>
                    <p>Seus dados são utilizados exclusivamente para: conectar candidatos a empresas; melhorar a experiência da plataforma; cumprir obrigações legais. Não vendemos dados a terceiros.</p>
                    <h3>3. Compartilhamento</h3>
                    <p>O currículo do candidato poderá ser compartilhado com empresas cadastradas na plataforma, conforme autorização expressa do candidato. As empresas são responsáveis pelo uso que fazem desses dados.</p>
                    <h3>4. Prazo de Armazenamento</h3>
                    <p>Currículos e dados de candidatos são armazenados por até 24 meses sem atividade. Após este período, os dados poderão ser removidos automaticamente. O usuário pode solicitar a remoção antecipada a qualquer momento.</p>
                    <h3>5. Seus Direitos (LGPD)</h3>
                    <p>Você tem direito a: acessar seus dados; corrigir informações incorretas; excluir sua conta e dados; exportar seus dados; revogar o consentimento dado.</p>
                    <h3>6. Contato do Encarregado de Dados (DPO)</h3>
                    <p>Para exercer seus direitos ou enviar dúvidas sobre privacidade, entre em contato pelo e-mail: <strong>privacidade@norteempregos.com.br</strong></p>
                </>
            )
        },
        {
            id: 'cookies',
            icon: <Cookie size={18} />,
            label: 'Política de Cookies',
            content: (
                <>
                    <h3>1. O que são Cookies?</h3>
                    <p>Cookies são pequenos arquivos de texto armazenados no seu dispositivo que nos ajudam a melhorar a experiência de uso da plataforma.</p>
                    <h3>2. Tipos de Cookies que Usamos</h3>
                    <p><strong>Essenciais:</strong> Necessários para o funcionamento da plataforma (ex: manter a sessão ativa). Não podem ser desativados.</p>
                    <h3>3. Tempo de Armazenamento</h3>
                    <p>Cookies essenciais: duração da sessão. Cookies de preferência: até 12 meses. Cookies analíticos: até 26 meses.</p>
                    <h3>4. Como Desativar</h3>
                    <p>Você pode gerenciar ou desativar cookies pelas configurações do seu navegador. Note que desativar cookies essenciais pode impedir o funcionamento correto da plataforma.</p>
                </>
            )
        },
        {
            id: 'antifraude',
            icon: <AlertTriangle size={18} />,
            label: 'Política Anti-Fraude',
            content: (
                <>
                    <h3>1. Condutas Proibidas</h3>
                    <p>É expressamente proibido na plataforma:</p>
                    <ul>
                        <li>Criar perfis com identidade falsa ou se passar por outra pessoa</li>
                        <li>Realizar phishing ou qualquer tentativa de obtenção ilícita de dados</li>
                        <li>Aplicar golpes contra outros usuários da plataforma</li>
                        <li>Usar bots, scripts ou automações para abusar dos serviços</li>
                        <li>Publicar vagas falsas com intuito de fraude</li>
                        <li>Cobrar qualquer valor de candidatos para participação em processos seletivos</li>
                    </ul>
                    <h3>2. Como Denunciar</h3>
                    <p>Se você identificar uma vaga suspeita ou comportamento fraudulento, utilize o botão "Denunciar" disponível em cada vaga ou entre em contato pelo e-mail: <strong>suporte@norteempregos.com.br</strong></p>
                    <h3>3. Punições</h3>
                    <p>Violações resultarão em remoção imediata da conta e poderão ser reportadas às autoridades competentes, inclusive à Polícia Civil e ao Ministério Público.</p>
                </>
            )
        },
        {
            id: 'seguranca',
            icon: <Lock size={18} />,
            label: 'Política de Segurança',
            content: (
                <>
                    <h3>1. Criptografia</h3>
                    <p>Todas as senhas são armazenadas com criptografia bcrypt. As comunicações entre o usuário e a plataforma são protegidas por HTTPS (TLS).</p>
                    <h3>2. Controle de Acesso</h3>
                    <p>A plataforma utiliza Row Level Security (RLS) no banco de dados, garantindo que cada usuário só acesse seus próprios dados. Dados de administração são restritos a contas autorizadas.</p>
                    <h3>3. Backup</h3>
                    <p>O banco de dados possui backups automáticos diários. Em caso de incidente grave, os dados podem ser restaurados para até 7 dias antes do evento.</p>
                    <h3>4. Resposta a Incidentes</h3>
                    <p>Em caso de vazamento de dados ou acesso indevido, a plataforma notificará os usuários afetados e a ANPD (Autoridade Nacional de Proteção de Dados) conforme exigido pela LGPD, dentro do prazo legal de 72 horas.</p>
                </>
            )
        }
    ]);

    const [activeDoc, setActiveDoc] = useState(docParam || 'termos');

    // Funções de Ação
    const handleExportData = async () => {
        if (!user) return;
        try {
            const { data: curriculo } = await supabase.from('curriculos').select('*').eq('user_id', user.id).single();
            const { data: candidaturas } = await supabase.from('candidaturas').select('*, vagas(titulo, empresas(razao_social))').eq('user_id', user.id);
            const { data: consentimentos } = await supabase.from('consent_logs').select('*').eq('user_id', user.id);

            const exportData = {
                exportado_em: new Date().toISOString(),
                plataforma: 'Norte Empregos',
                usuario: { id: user.id, email: user.email },
                curriculo: curriculo || 'Nenhum currículo cadastrado',
                candidaturas: candidaturas || [],
                registros_consentimento: consentimentos || [],
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Erro ao exportar dados: ' + err.message);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmado = window.confirm('⚠️ ATENÇÃO: Todos os seus dados serão apagados permanentemente.\n\nEsta ação NÃO pode ser desfeita.\n\nDeseja continuar?');
        if (!confirmado) return;
        try {
            await supabase.from('access_logs').insert([{
                user_id: user.id,
                email: user.email,
                action: 'account_deleted',
                user_agent: navigator.userAgent
            }]);
            await supabase.from('curriculos').delete().eq('user_id', user.id);
            await supabase.from('candidaturas').delete().eq('user_id', user.id);
            await supabase.auth.signOut();
            navigate('/');
        } catch (err) {
            alert('Erro ao excluir conta: ' + err.message);
        }
    };

    // Atualiza docs baseado no login
    useEffect(() => {
        if (user) {
            const functionalDocs = [
                {
                    id: 'meus-dados',
                    icon: <Download size={18} />,
                    label: 'Meus Dados (LGPD)',
                    content: (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '2rem' }}>
                                <Download size={40} color="#2563eb" style={{ marginBottom: '1rem' }} />
                                <h3 style={{ color: '#1e40af', marginBottom: '1rem' }}>Portabilidade de Dados</h3>
                                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                                    Você tem o direito de baixar uma cópia completa de todos os seus dados armazenados na plataforma: currículo, candidaturas e registros de consentimento.
                                </p>
                                <button 
                                    onClick={handleExportData}
                                    className="neon-button" 
                                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                                >
                                    BAIXAR TODOS OS MEUS DADOS (JSON)
                                </button>
                            </div>
                        </div>
                    )
                },
                {
                    id: 'excluir-conta',
                    icon: <Trash2 size={18} />,
                    label: 'Excluir Minha Conta',
                    content: (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid #fca5a5', borderRadius: '12px', padding: '2rem' }}>
                                <AlertTriangle size={40} color="#dc2626" style={{ marginBottom: '1rem' }} />
                                <h3 style={{ color: '#991b1b', marginBottom: '1rem' }}>Zona de Risco</h3>
                                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                                    Ao excluir sua conta, todos os seus dados serão apagados permanentemente. Esta ação é irreversível conforme o Direito ao Esquecimento da LGPD.
                                </p>
                                <button 
                                    onClick={handleDeleteAccount}
                                    style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                                >
                                    EXCLUIR CONTA PERMANENTEMENTE
                                </button>
                            </div>
                        </div>
                    )
                }
            ];
            
            setDocs(prev => {
                const combined = [...prev];
                functionalDocs.forEach(fd => {
                    if (!combined.some(d => d.id === fd.id)) combined.push(fd);
                });
                return combined;
            });
        }
    }, [user]);

    // Se o parâmetro mudar, atualiza o documento (caso o usuário clique em outro link de fora)
    useEffect(() => {
        if (docParam && docs.some(d => d.id === docParam)) {
            setActiveDoc(docParam);
        }
    }, [docParam, docs]);

    const active = docs.find(d => d.id === activeDoc) || docs[0];

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', color: 'var(--neon-purple)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontWeight: 700, fontSize: '0.9rem' }}
                >
                    <ArrowLeft size={18} /> Voltar
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ color: '#0f172a', fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>⚖️ Central Legal</h1>
                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Toda a documentação legal e políticas da plataforma Norte Empregos.</p>
                </div>

                <div className="grid-legal">

                    {/* Sidebar de navegação */}
                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', position: 'sticky', top: '1rem' }}>
                        {docs.map(doc => (
                            <button
                                key={doc.id}
                                onClick={() => setActiveDoc(doc.id)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '0.85rem 1.25rem', background: activeDoc === doc.id ? 'rgba(124,58,237,0.08)' : 'transparent',
                                    border: 'none', borderLeft: activeDoc === doc.id ? '3px solid var(--neon-purple)' : '3px solid transparent',
                                    color: activeDoc === doc.id ? 'var(--neon-purple)' : (doc.id === 'excluir-conta' ? '#dc2626' : '#475569'),
                                    fontWeight: activeDoc === doc.id ? 700 : 500, cursor: 'pointer',
                                    fontSize: '0.85rem', textAlign: 'left', transition: 'all 0.15s'
                                }}
                            >
                                {doc.icon} {doc.label}
                            </button>
                        ))}
                    </div>

                    {/* Área de conteúdo */}
                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem' }}>
                        <h2 style={{ color: '#0f172a', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {active.icon} {active.label}
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                            Última atualização: 15 de Março de 2026
                        </p>
                        <div style={{ color: '#475569', lineHeight: '1.7', fontSize: '0.92rem' }}>
                            <style>{`
                                .legal-content h3 { color: #0f172a; font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; margin-top: 1.25rem; border-left: 3px solid var(--neon-purple); padding-left: 0.6rem; }
                                .legal-content p { color: #475569; line-height: 1.7; font-size: 0.92rem; margin-bottom: 0.75rem; }
                                .legal-content ul { color: #475569; line-height: 1.8; font-size: 0.92rem; margin-left: 1.25rem; margin-bottom: 0.75rem; }
                                .legal-content li { margin-bottom: 0.25rem; }
                                .legal-content strong { color: #0f172a; }
                            `}</style>
                            <div className="legal-content">
                                {active.content}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
