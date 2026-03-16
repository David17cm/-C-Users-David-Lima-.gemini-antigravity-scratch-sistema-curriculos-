import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Cookie, Building, Users, AlertTriangle, Lock, Clock, Megaphone } from 'lucide-react';

const DOCS = [
    {
        id: 'termos',
        icon: <FileText size={18} />,
        label: 'Termos de Uso',
        content: (
            <>
                <h3>1. Aceitação dos Termos</h3>
                <p>Ao acessar e utilizar a plataforma Talentos Futuro do Trabalho, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso. Se não concordar com qualquer cláusula, não utilize os serviços.</p>
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
                <p>Para exercer seus direitos ou enviar dúvidas sobre privacidade, entre em contato pelo e-mail: <strong>privacidade@talentosfuturo.com.br</strong></p>
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
                <p><strong>Preferências:</strong> Armazenam suas escolhas (ex: aceite do banner de cookies).</p>
                <p><strong>Analíticos:</strong> Nos ajudam a entender como a plataforma é usada (Google Analytics).</p>
                <h3>3. Tempo de Armazenamento</h3>
                <p>Cookies essenciais: duração da sessão. Cookies de preferência: até 12 meses. Cookies analíticos: até 26 meses.</p>
                <h3>4. Como Desativar</h3>
                <p>Você pode gerenciar ou desativar cookies pelas configurações do seu navegador. Note que desativar cookies essenciais pode impedir o funcionamento correto da plataforma.</p>
            </>
        )
    },
    {
        id: 'empresas',
        icon: <Building size={18} />,
        label: 'Termos para Empresas',
        content: (
            <>
                <h3>1. Regras de Publicação de Vagas</h3>
                <p>As vagas publicadas devem ser reais, legítimas e com remuneração honesta. A empresa é a única responsável pelo conteúdo publicado.</p>
                <h3>2. Proibições Absolutas</h3>
                <ul>
                    <li>Publicar vagas com qualquer tipo de discriminação (gênero, raça, idade, etc.)</li>
                    <li>Publicar vagas com salários enganosos ou condições de trabalho falsas</li>
                    <li>Esquemas de pirâmide financeira ou marketing multinível disfarçado de emprego</li>
                    <li>Usar a plataforma para coletar dados de candidatos para fins outros que não o processo seletivo</li>
                    <li>Publicar vagas em nome de empresas que não representam</li>
                </ul>
                <h3>3. Uso dos Dados dos Candidatos</h3>
                <p>A empresa se compromete a usar os dados dos candidatos (currículo, contato) exclusivamente para o processo seletivo da vaga em questão, em conformidade com a LGPD (Lei nº 13.709/2018).</p>
                <h3>4. Punições</h3>
                <p>O descumprimento destas regras resultará em remoção imediata das vagas, suspensão ou banimento permanente da conta, podendo ainda ser reportado às autoridades competentes.</p>
            </>
        )
    },
    {
        id: 'candidatos',
        icon: <Users size={18} />,
        label: 'Termos para Candidatos',
        content: (
            <>
                <h3>1. Veracidade das Informações</h3>
                <p>O candidato é o único responsável pela veracidade e exatidão das informações inseridas em seu currículo. Declarações falsas podem resultar em suspensão imediata da conta e responsabilidade legal.</p>
                <h3>2. Compartilhamento do Currículo</h3>
                <p>Ao se candidatar a uma vaga, você autoriza expressamente que seu currículo seja compartilhado com a empresa responsável pela vaga. A plataforma não é responsável pelo uso que a empresa fará dessas informações.</p>
                <h3>3. Sem Garantia de Contratação</h3>
                <p>A plataforma é um facilitador de conexões. Não garantimos que o uso do currículo resultará em entrevista ou contratação. O processo seletivo é de total responsabilidade da empresa contratante.</p>
                <h3>4. Direito ao Esquecimento</h3>
                <p>Você pode solicitar a exclusão completa da sua conta e de todos os seus dados a qualquer momento, nas configurações do seu painel.</p>
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
                <p>Se você identificar uma vaga suspeita ou comportamento fraudulento, utilize o botão "Denunciar" disponível em cada vaga ou entre em contato pelo e-mail: <strong>suporte@talentosfuturo.com.br</strong></p>
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
    },
    {
        id: 'retencao',
        icon: <Clock size={18} />,
        label: 'Retenção de Dados',
        content: (
            <>
                <h3>1. Prazos de Armazenamento</h3>
                <ul>
                    <li><strong>Currículos ativos:</strong> Armazenados enquanto a conta estiver ativa</li>
                    <li><strong>Currículos inativos:</strong> Apagados após 24 meses sem acesso</li>
                    <li><strong>Logs de acesso:</strong> Mantidos por 6 meses</li>
                    <li><strong>Dados de candidatura:</strong> Mantidos por 12 meses após encerramento da vaga</li>
                </ul>
                <h3>2. Direito ao Esquecimento</h3>
                <p>O usuário pode solicitar a exclusão imediata de todos os seus dados a qualquer momento. Uma vez excluídos, os dados não poderão ser recuperados, exceto quando há obrigação legal de retenção.</p>
                <h3>3. Obrigação Legal</h3>
                <p>Alguns dados podem ser retidos por prazos mais longos quando exigido por lei (ex: dados fiscais por até 5 anos).</p>
            </>
        )
    },
    {
        id: 'incidentes',
        icon: <AlertTriangle size={18} />,
        label: 'Resposta a Incidentes',
        content: (
            <>
                <h3>1. Objetivo</h3>
                <p>Estabelecer o procedimento em caso de violação de dados, ataques cibernéticos ou acessos não autorizados, conforme exigido pela LGPD.</p>
                <h3>2. Identificação e Contenção</h3>
                <p>Ao detectar uma vulnerabilidade ou vazamento, a equipe técnica isolará os sistemas afetados em até 4 horas. Logs de acesso serão preservados para auditoria.</p>
                <h3>3. Notificação à ANPD e Usuários</h3>
                <p>Caso o incidente represente risco aos direitos dos usuários, a plataforma notificará a Autoridade Nacional de Proteção de Dados (ANPD) e os titulares dos dados no prazo de 72 horas.</p>
                <h3>4. Remediação</h3>
                <p>Após a contenção, será feita uma análise de causa raiz para implementar novas camadas de segurança e prevenir recorrências.</p>
            </>
        )
    },
    {
        id: 'publicacao',
        icon: <Megaphone size={18} />,
        label: 'Política de Publicação',
        content: (
            <>
                <h3>1. Regras para Vagas</h3>
                <p>Toda vaga deve ser descrita de forma clara, contendo cargo, requisitos e informações sobre remuneração. É proibido omitir que se trata de uma vaga de emprego real.</p>
                <h3>2. Conteúdo Proibido</h3>
                <ul>
                    <li>Anúncios de pirâmide financeira ou marketing multinível</li>
                    <li>Vagas que exijam pagamento de taxas para participar do processo</li>
                    <li>Solicitação de dados sensíveis desnecessários (ex: dados bancários no primeiro contato)</li>
                    <li>Conteúdo discriminatório de qualquer natureza</li>
                </ul>
                <h3>3. Responsabilidade da Empresa</h3>
                <p>A empresa declara ser a detentora do direito de contratação para a vaga anunciada. Vagas de terceiros só podem ser publicadas por consultorias de RH devidamente identificadas.</p>
            </>
        )
    },
    {
        id: 'denuncia',
        icon: <Megaphone size={18} />,
        label: 'Política de Denúncia',
        content: (
            <>
                <h3>1. O que você pode denunciar?</h3>
                <ul>
                    <li>Vagas com conteúdo falso, enganoso ou discriminatório</li>
                    <li>Empresas que solicitam pagamento para participação em seleções</li>
                    <li>Comportamentos abusivos de outros usuários</li>
                    <li>Uso indevido de dados pessoais</li>
                </ul>
                <h3>2. Como denunciar?</h3>
                <p>Clique no botão "Denunciar esta vaga como suspeita" disponível no detalhe de cada vaga, ou envie um e-mail para: <strong>suporte@talentosfuturo.com.br</strong></p>
                <h3>3. O que acontece após a denúncia?</h3>
                <p>Nossa equipe analisa toda denúncia em até 72 horas. Se confirmada, a vaga ou conta será removida imediatamente. Denúncias graves são encaminhadas às autoridades. O denunciante permanece anônimo.</p>
            </>
        )
    }
];

const sectionStyle = {
    marginBottom: '1.25rem',
};

const h3Style = {
    color: '#0f172a',
    fontSize: '1rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    marginTop: '1.25rem',
    borderLeft: '3px solid var(--neon-purple)',
    paddingLeft: '0.6rem',
};

const pStyle = {
    color: '#475569',
    lineHeight: '1.7',
    fontSize: '0.92rem',
    marginBottom: '0.75rem',
};

const ulStyle = {
    color: '#475569',
    lineHeight: '1.8',
    fontSize: '0.92rem',
    marginLeft: '1.25rem',
    marginBottom: '0.75rem',
};

export default function LegalPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const docParam = searchParams.get('doc');
    const [activeDoc, setActiveDoc] = useState(docParam || 'termos');

    // Se o parâmetro mudar, atualiza o documento (caso o usuário clique em outro link de fora)
    React.useEffect(() => {
        if (docParam && DOCS.some(d => d.id === docParam)) {
            setActiveDoc(docParam);
        }
    }, [docParam]);

    const active = DOCS.find(d => d.id === activeDoc);

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
                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Toda a documentação legal e políticas da plataforma Talentos Futuro do Trabalho.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>

                    {/* Sidebar de navegação */}
                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', position: 'sticky', top: '1rem' }}>
                        {DOCS.map(doc => (
                            <button
                                key={doc.id}
                                onClick={() => setActiveDoc(doc.id)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '0.85rem 1.25rem', background: activeDoc === doc.id ? 'rgba(124,58,237,0.08)' : 'transparent',
                                    border: 'none', borderLeft: activeDoc === doc.id ? '3px solid var(--neon-purple)' : '3px solid transparent',
                                    color: activeDoc === doc.id ? 'var(--neon-purple)' : '#475569',
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
                        <div style={{ ...pStyle }}>
                            <style>{`
                                .legal-content h3 { ${Object.entries(h3Style).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`).join(';')} }
                                .legal-content p { ${Object.entries(pStyle).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`).join(';')} }
                                .legal-content ul { ${Object.entries(ulStyle).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`).join(';')} }
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
