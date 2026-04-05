import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Briefcase, GraduationCap, Tag, Brain, CheckCircle, ArrowLeft, ArrowRight, Plus, Trash2, X, Camera, BookOpen } from 'lucide-react';
import { NorteToast } from '../components/ui/NorteToast';

// ─── Constantes ───────────────────────────────────────────────────────────────
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const ANOS  = Array.from({ length: 40 }, (_, i) => (new Date().getFullYear() - i).toString());
const SEMESTRES = ['1°','2°','3°','4°','5°','6°','7°','8°','9°','10°'];
const ANOS_EM = ['1° Ano','2° Ano','3° Ano'];
const TURNOS  = ['Manhã','Tarde','Noite'];

const SKILLS_OPTIONS = [
    "Comunicação", "Trabalho em equipe", "Proatividade", "Organização", 
    "Responsabilidade", "Adaptabilidade", "Inteligência emocional", "Comprometimento", 
    "Pontualidade", "Resolução de problemas", "Atendimento ao cliente", "Vendas", 
    "Negociação", "Liderança", "Gestão de tempo", "Facilidade com tecnologia", 
    "Pacote Office básico", "Digitação rápida", "Organização de documentos", "Aprendizado rápido"
];

function maskPhone(v) {
    const n = v.replace(/\D/g,'').slice(0,11);
    if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3').replace(/-$/,'');
    return n.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3').replace(/-$/,'');
}

const STEPS = [
    { id: 1, label: 'Dados Pessoais',   icon: User,          time: '3-5 min' },
    { id: 2, label: 'Experiências',     icon: Briefcase,     time: '2 min'   },
    { id: 3, label: 'Formação',         icon: GraduationCap, time: '1 min'   },
    { id: 4, label: 'Habilidades',      icon: Tag,           time: '1 min'   },
    { id: 5, label: 'Cursos',           icon: BookOpen,      time: '1 min'   },
    { id: 6, label: 'Perfil DISC',      icon: Brain,         time: '4 min'   },
];

// ─── Componente DISC embutido ──────────────────────────────────────────────────
const DISC_QUESTIONS = [
    { question:"Em um projeto de equipe, qual sua prioridade?",options:[{text:"Entregar resultados rápidos e bater metas.",type:"Executor"},{text:"Garantir que todos estejam motivados e integrados.",type:"Comunicador"},{text:"Manter o cronograma organizado e sem conflitos.",type:"Planejador"},{text:"Garantir que cada detalhe técnico esteja perfeito.",type:"Analista"}]},
    { question:"Como você reage sob pressão intensa?",options:[{text:"Tomo o controle e decido o que deve ser feito.",type:"Executor"},{text:"Busco apoio nas pessoas e tento aliviar o clima.",type:"Comunicador"},{text:"Mantenho a calma e sigo o plano estabelecido.",type:"Planejador"},{text:"Analiso todos os dados antes de agir com precisão.",type:"Analista"}]},
    { question:"Qual característica melhor descreve você no trabalho?",options:[{text:"Determinado e competitivo.",type:"Executor"},{text:"Persuasivo e entusiasmado.",type:"Comunicador"},{text:"Paciente e bom ouvinte.",type:"Planejador"},{text:"Disciplinado e cauteloso.",type:"Analista"}]},
    { question:"O que mais te desmotiva em uma tarefa?",options:[{text:"Falta de autonomia ou progresso lento.",type:"Executor"},{text:"Falta de interação social ou rotina isolada.",type:"Comunicador"},{text:"Mudanças bruscas e falta de harmonia.",type:"Planejador"},{text:"Desorganização ou falta de padrões lógicos.",type:"Analista"}]},
    { question:"Como você prefere receber feedbacks?",options:[{text:"Direto ao ponto, com foco em resultados.",type:"Executor"},{text:"De forma amigável e valorizando meu empenho.",type:"Comunicador"},{text:"Com tato, sem críticas agressivas.",type:"Planejador"},{text:"Com evidências claras e dados fundamentados.",type:"Analista"}]},
    { question:"Ao enfrentar um problema novo, você...",options:[{text:"Age logo para resolvê-lo o quanto antes.",type:"Executor"},{text:"Conversa com outros para ter novas ideias.",type:"Comunicador"},{text:"Avalia o impacto na rotina da equipe.",type:"Planejador"},{text:"Estuda o problema a fundo para entender a causa.",type:"Analista"}]},
    { question:"Qual ambiente de trabalho você prefere?",options:[{text:"Desafiador e com metas claras de crescimento.",type:"Executor"},{text:"Dinâmico, alegre e com muita troca de ideias.",type:"Comunicador"},{text:"Previsível, seguro e acolhedor.",type:"Planejador"},{text:"Sério, focado em processos e alta qualidade.",type:"Analista"}]},
    { question:"Como você lida com mudanças?",options:[{text:"Vejo como oportunidade de ganhar mercado/espaço.",type:"Executor"},{text:"Fico animado com a novidade e novas conexões.",type:"Comunicador"},{text:"Sinto certa resistência se mudar o que já funciona.",type:"Planejador"},{text:"Questiono os motivos e analiso os riscos.",type:"Analista"}]},
    { question:"Sua principal força é...",options:[{text:"A capacidade de agir e fazer acontecer.",type:"Executor"},{text:"O carisma e a facilidade de comunicação.",type:"Comunicador"},{text:"A lealdade e o espírito de equipe.",type:"Planejador"},{text:"A organização e o pensamento crítico.",type:"Analista"}]},
    { question:"Qual o seu maior medo profissional?",options:[{text:"Falhar ou ser visto como incapaz.",type:"Executor"},{text:"Ser rejeitado ou ignorado pelas pessoas.",type:"Comunicador"},{text:"Perder a estabilidade ou enfrentar conflitos.",type:"Planejador"},{text:"Cometer erros por falta de atenção aos detalhes.",type:"Analista"}]},
];

// ─── Helpers de estilo (Amazonian Light Premium) ──────────────────────────────
const panel = { 
    background:'#ffffff', 
    border:'1px solid #e2e8f0', 
    borderRadius:'20px', 
    padding:'2rem', 
    marginBottom:'1.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
};
const label = { 
    display:'block', 
    fontSize:'0.75rem', 
    fontWeight:800, 
    color:'#94a3b8', 
    marginBottom:'8px', 
    textTransform:'uppercase', 
    letterSpacing:'0.08em' 
};
const input = { 
    width:'100%', 
    background:'#ffffff', 
    border:'1px solid #e2e8f0', 
    borderRadius:'12px', 
    padding:'12px 16px', 
    color:'var(--text-main)', 
    fontSize:'0.95rem', 
    outline:'none', 
    boxSizing:'border-box',
    transition: 'all 0.2s ease'
};
const selectStyle = { ...input, cursor:'pointer' };
const optionCard = (selected) => ({
    cursor:'pointer', 
    padding:'18px 22px', 
    borderRadius:'16px',
    border: selected ? '2px solid var(--norte-green)' : '1px solid #e2e8f0',
    background: selected ? 'rgba(0,141,76,0.05)' : '#ffffff',
    color: selected ? 'var(--norte-green)' : 'var(--text-muted)',
    fontWeight: selected ? 800 : 500,
    marginBottom:'12px', 
    transition:'all 0.2s ease', 
    userSelect:'none',
    display:'flex', 
    alignItems:'center', 
    justifyContent:'space-between',
    gap:'16px', 
    fontSize:'1rem',
    boxShadow: selected ? '0 4px 12px rgba(0,141,76,0.08)' : 'none'
});

const blockHeader = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    marginBottom: '20px',
    borderBottom: '1px solid #f1f5f9'
};

const blockTitle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.85rem',
    fontWeight: 900,
    color: 'var(--norte-dark-green)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

export default function CVWizardPage() {
    const { user, pago } = useAuth();
    const navigate = useNavigate();
    const [step, setStep]     = useState(1);
    const [saving, setSaving] = useState(false);
    const [done, setDone]     = useState(false);
    const [showWppModal, setShowWppModal] = useState(false);
    const fileInputRef        = useRef();
    const [uploadingFoto, setUploadingFoto] = useState(false);
    const [toast, setToast] = useState({ message: '', type: 'info' });

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    // ── Passo 1: Dados Pessoais ──
    const [pessoal, setPessoal] = useState({
        foto_url:'', nome:'', telefone:'', dataNascimento:'', genero:'',
        bairro:'', cidade:'', endereco:''
    });

    // ── Passo 2: Experiências ──
    const [temExperiencia, setTemExperiencia] = useState(null); // null | true | false
    const [experiencias, setExperiencias]     = useState([
        { empresa:'', cargo:'', atual:false, mes_inicio:'', ano_inicio:'', mes_fim:'', ano_fim:'', descricao:'' }
    ]);

    // ── Passo 3: Formação ──
    const [escolaridade, setEscolaridade]   = useState(''); // 'em_incompleto' | 'em_cursando' | 'em_completo' | 'sup_incompleto' | 'sup_cursando' | 'sup_completo'
    const [turnoEM, setTurnoEM]             = useState('');
    const [serieEM, setSerieEM]             = useState('');
    const [anoConclEM, setAnoConclEM]       = useState('');
    const [anoConclEMSup, setAnoConclEMSup] = useState(''); // usado quando entra em superior
    const [cursoSup, setCursoSup]           = useState('');
    const [instSup, setInstSup]             = useState('');
    const [semestreSup, setSemestreSup]     = useState('');
    const [anoConclSup, setAnoConclSup]     = useState('');

    // ── Passo 4: Habilidades e Cursos ──
    const [habilidades, setHabilidades]   = useState([]);
    const [habilInput, setHabilInput]     = useState('');
    const [temCurso, setTemCurso]         = useState(null); // null | true | false
    const [cursos, setCursos]             = useState([
        { nome:'', instituicao:'', status:'completo' }
    ]);

    // ── Passo 5: DISC ──
    const [discStep, setDiscStep]     = useState(0);
    const [discAnswers, setDiscAnswers] = useState([]);
    const [discDone, setDiscDone]     = useState(false);
    const [discResult, setDiscResult] = useState(null);

    // ─── Foto Upload ────────────────────────────────────────────────────────────
    const handleFotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingFoto(true);
        try {
            const ext  = file.type.split('/')[1];
            const path = `${user.id}/avatar.${ext}`;
            await supabase.storage.from('avatars').upload(path, file, { upsert:true, contentType:file.type });
            const { data } = supabase.storage.from('avatars').getPublicUrl(path);
            setPessoal(p => ({ ...p, foto_url:`${data.publicUrl}?t=${Date.now()}` }));
        } catch(err) { showToast('Erro no upload: ' + err.message, 'error'); }
        finally { setUploadingFoto(false); }
    };

    // ─── DISC ───────────────────────────────────────────────────────────────────
    const handleDiscSelect = (type) => {
        const novo = [...discAnswers];
        novo[discStep] = type;
        setDiscAnswers(novo);
        if (discStep < DISC_QUESTIONS.length - 1) {
            setDiscStep(discStep + 1);
        } else {
            calcDisc(novo);
        }
    };

    const calcDisc = (ans) => {
        const counts = { Executor:0, Comunicador:0, Planejador:0, Analista:0 };
        ans.forEach(t => { counts[t] = (counts[t]||0) + 1; });
        const total = ans.length;
        const pct = {
            Executor: Math.round((counts.Executor/total)*100),
            Comunicador: Math.round((counts.Comunicador/total)*100),
            Planejador: Math.round((counts.Planejador/total)*100),
            Analista: Math.round((counts.Analista/total)*100),
        };
        setDiscResult(pct);
        setDiscDone(true);
    };

    // ─── Monta payload de formação ───────────────────────────────────────────────
    const buildFormacao = () => {
        const formacoes = [];
        let ensino_medio = {};

        if (escolaridade === 'em_incompleto') {
            ensino_medio = { status:'incompleto' };
        } else if (escolaridade === 'em_cursando') {
            ensino_medio = { status:'cursando', turno:turnoEM, ano_cursando:serieEM };
        } else if (escolaridade === 'em_completo') {
            ensino_medio = { status:'completo', ano_conclusao:anoConclEM };
        } else if (escolaridade === 'sup_incompleto') {
            ensino_medio = { status:'completo', ano_conclusao:anoConclEM };
        } else if (escolaridade === 'sup_cursando') {
            ensino_medio = { status:'completo', ano_conclusao:anoConclEMSup };
            formacoes.push({ curso:cursoSup, instituicao:instSup, status:'cursando', semestre:semestreSup });
        } else if (escolaridade === 'sup_completo') {
            ensino_medio = { status:'completo', ano_conclusao:anoConclEMSup };
            formacoes.push({ curso:cursoSup, instituicao:instSup, status:'completo', ano_conclusao:anoConclSup });
        }
        return { ensino_medio, formacoes };
    };

    // ─── Salvar no Supabase ──────────────────────────────────────────────────────
    const handleFinish = async () => {
        setSaving(true);
        try {
            const { ensino_medio, formacoes } = buildFormacao();

            const expPayload = temExperiencia === false
                ? [{ empresa:'Primeiro Emprego', cargo:'', atual:false, descricao:'', mes_inicio:'', ano_inicio:'', mes_fim:'', ano_fim:'' }]
                : experiencias.filter(e => e.empresa.trim());

            const cursosPayload = temCurso === false ? [] : cursos.filter(c => c.nome.trim()).map(c => JSON.stringify(c));

            const payload = {
                user_id:       user.id,
                nome:          pessoal.nome,
                email:         user.email,
                telefone:      pessoal.telefone,
                cidade:        pessoal.cidade,
                bairro:        pessoal.bairro,
                endereco:      pessoal.endereco,
                data_nascimento: pessoal.dataNascimento,
                genero:        pessoal.genero,
                foto_url:      pessoal.foto_url,
                habilidades,
                cursos_prof:   cursosPayload,
                experiencias:  expPayload,
                formacoes,
                ensino_medio,
                perfil_disc:   discResult ? JSON.stringify(discResult) : null,
                updated_at:    new Date().toISOString(),
            };

            const { error } = await supabase.from('curriculos').upsert(payload, { onConflict:'user_id' });
            if (error) throw error;
            
            setDone(true);
            setShowWppModal(true);
        } catch(err) {
            showToast('Erro ao salvar: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    // Avança automaticamente quando o DISC termina
    useEffect(() => {
        if (discDone && discResult && step === 6) {
            handleFinish();
        }
    }, [discDone, discResult]);

    const progress = (step / STEPS.length) * 100;

    // ─── Tela de Conclusão ────────────────────────────────────────────────────────
    if (done) return (
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', background:'transparent' }}>
            <div style={{ textAlign:'center', maxWidth:'500px' }}>
                <div style={{ display:'inline-flex', padding:'24px', background:'rgba(0,141,76,0.08)', borderRadius:'50%', marginBottom:'2rem', border:'2px solid var(--norte-green)' }}>
                    <CheckCircle size={72} color="var(--norte-green)" />
                </div>
                <h1 style={{ fontSize:'2.5rem', fontWeight:900, marginBottom:'1rem', color:'var(--norte-dark-green)' }}>
                    Currículo 100% Completo!
                </h1>
                <p style={{ color:'var(--text-muted)', fontSize:'1.1rem', lineHeight:1.7, marginBottom:'2.5rem' }}>
                    Parabéns, {pessoal.nome.split(' ')[0]}! Seu perfil está pronto para as melhores empresas.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                    <button
                        onClick={() => navigate('/vagas')}
                        style={{ background:'linear-gradient(135deg, var(--norte-green) 0%, #16a34a 100%)', color:'#fff', border:'none', borderRadius:'14px', padding:'16px 36px', fontSize:'1.1rem', fontWeight:800, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'10px', boxShadow:'0 8px 24px rgba(0,141,76,0.35)' }}
                    >
                        Ver Vagas Agora <ArrowRight size={22} />
                    </button>
                    
                    {!showWppModal && (
                        <a 
                            href="https://chat.whatsapp.com/LAjyH1ZoYil9vofahhNaLw" 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ color:'var(--norte-green)', fontWeight:700, textDecoration:'none', fontSize:'1rem' }}
                        >
                            Entrar no Grupo de Alertas VIP
                        </a>
                    )}
                </div>
            </div>

            {/* Modal de Sucesso WhatsApp */}
            {showWppModal && (
                <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.4)', backdropFilter:'blur(8px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
                    <div style={{ background:'#fff', borderRadius:'24px', padding:'2.5rem', maxWidth:'450px', width:'100%', textAlign:'center', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)', animation:'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                        <div style={{ width:'80px', height:'80px', background:'#25D366', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem', boxShadow:'0 8px 20px rgba(37, 211, 102, 0.3)' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.559 4.191 1.62 6.034L0 24l6.135-1.61a11.893 11.893 0 005.915 1.569h.005c6.636 0 12.032-5.396 12.035-12.032a11.799 11.799 0 00-3.489-8.452"/></svg>
                        </div>
                        <h2 style={{ fontSize:'1.75rem', fontWeight:900, color:'var(--norte-dark-green)', marginBottom:'0.75rem' }}>Grupo VIP de Vagas 🌿</h2>
                        <p style={{ color:'#64748b', fontSize:'1rem', lineHeight:1.6, marginBottom:'2rem' }}>
                            Parabéns, seu currículo está pronto! Agora, entre no nosso grupo exclusivo para receber **alertas de vagas em tempo real** no seu Celular.
                        </p>
                        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                            <a 
                                href="https://chat.whatsapp.com/LAjyH1ZoYil9vofahhNaLw" 
                                target="_blank" 
                                rel="noreferrer"
                                onClick={() => {
                                    setShowWppModal(false);
                                    // Abrir WhatsApp em nova aba e redirecionar conforme status premium
                                    setTimeout(() => navigate(pago ? '/painel' : '/oferta-premium'), 500);
                                }}
                                style={{ background:'#25D366', color:'#fff', padding:'16px', borderRadius:'16px', textDecoration:'none', fontWeight:800, fontSize:'1.1rem', boxShadow:'0 10px 20px rgba(37, 211, 102, 0.25)', transition:'transform 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}
                            >
                                ENTRAR NO GRUPO VIP
                            </a>
                            <button 
                                onClick={() => {
                                    setShowWppModal(false);
                                    navigate(pago ? '/painel' : '/oferta-premium');
                                }}
                                style={{ background:'transparent', border:'none', color:'#94a3b8', padding:'10px', fontWeight:700, fontSize:'0.9rem', cursor:'pointer' }}
                            >
                                Ir para meu painel
                            </button>
                        </div>
                    </div>
                    <style>{`
                        @keyframes popIn {
                            from { opacity: 0; transform: scale(0.9) translateY(20px); }
                            to { opacity: 1; transform: scale(1) translateY(0); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );

    return (
        <div style={{ minHeight:'100vh', background:'transparent', padding:'0' }}>
            {/* ── Cabeçalho com Progress Bar ── */}
            <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', borderBottom:'1px solid #e2e8f0', padding:'1.5rem 1.5rem', position:'sticky', top:0, zIndex:100 }}>
                <div style={{ maxWidth:'700px', margin:'0 auto' }}>
                    {/* Steps indicadores */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const active  = step === s.id;
                            const done_s  = step > s.id;
                            return (
                                <div key={s.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', flex:1, position:'relative' }}>
                                    <div style={{
                                        width:'42px', height:'42px', borderRadius:'50%',
                                        background: done_s ? 'var(--norte-green)' : active ? '#fff' : '#f8fafc',
                                        border: `2px solid ${done_s || active ? 'var(--norte-green)' : '#e2e8f0'}`,
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        transition:'all 0.3s ease',
                                        boxShadow: active ? '0 0 15px rgba(0,141,76,0.2)' : 'none',
                                        zIndex: 2
                                    }}>
                                        {done_s
                                            ? <CheckCircle size={20} color="#fff" />
                                            : <Icon size={20} color={active ? 'var(--norte-green)' : '#94a3b8'} />
                                        }
                                    </div>
                                    {/* Linha conectora simples se precisar no futuro */}
                                </div>
                            );
                        })}
                    </div>

                    {/* Barra de progresso */}
                    <div style={{ height:'8px', background:'#f1f5f9', borderRadius:'4px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${progress}%`, background:'var(--norte-green)', borderRadius:'4px', transition:'width 0.5s ease' }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:'10px' }}>
                        <span style={{ fontSize:'0.85rem', color:'var(--norte-dark-green)', fontWeight:800 }}>Etapa {step} de 6: {STEPS[step-1].label}</span>
                        <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600 }}>⏱ ~{STEPS[step-1].time}</span>
                    </div>
                </div>
            </div>

            {/* ── Conteúdo do Passo ── */}
            <div style={{ maxWidth:'700px', margin:'0 auto', padding:'2rem 1.5rem' }}>

                {/* ════════════ PASSO 1: DADOS PESSOAIS ════════════ */}
                {step === 1 && (
                    <div>
                        <h2 style={{ fontSize:'2.2rem', fontWeight:900, marginBottom:'0.5rem', color:'var(--norte-dark-green)' }}>Dados Pessoais</h2>
                        <p style={{ color:'var(--text-muted)', marginBottom:'2.5rem', fontSize:'1.05rem', fontWeight:500 }}>Essas informações serão exibidas no seu currículo para as empresas.</p>

                        {/* Foto */}
                        <div style={{ ...panel, display:'flex', alignItems:'center', gap:'1.5rem', borderLeft:'6px solid var(--norte-green)' }}>
                            <div onClick={() => fileInputRef.current.click()} style={{ width:'100px', height:'100px', borderRadius:'50%', overflow:'hidden', border:'4px solid var(--norte-green)', background:'rgba(0,141,76,0.05)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'transform 0.2s', boxShadow:'0 8px 16px rgba(0,141,76,0.1)' }}>
                                {pessoal.foto_url
                                    ? <img src={pessoal.foto_url} alt="Foto" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                                    : <Camera size={36} color="var(--norte-green)" />
                                }
                            </div>
                            <div>
                                <p style={{ color:'var(--norte-dark-green)', fontWeight:800, fontSize:'1.1rem', marginBottom:'4px' }}>Foto de Perfil</p>
                                <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'14px', fontWeight:500 }}>Opcional, mas aumenta suas chances!</p>
                                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFotoUpload} style={{ display:'none' }} />
                                <button type="button" onClick={() => fileInputRef.current.click()} style={{ background:'var(--norte-green)', border:'none', color:'#fff', borderRadius:'10px', padding:'10px 22px', cursor:'pointer', fontWeight:800, fontSize:'0.9rem', boxShadow:'0 4px 10px rgba(0,141,76,0.2)' }}>
                                    {uploadingFoto ? 'Enviando...' : '📷 Escolher Foto'}
                                </button>
                            </div>
                        </div>

                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'1.5rem' }}>
                            {[
                                { lbl:'Nome Completo *', key:'nome', type:'text', placeholder:'Seu nome completo' },
                                { lbl:'Telefone / WhatsApp *', key:'telefone', type:'tel', placeholder:'(99) 99999-9999' },
                                { lbl:'Data de Nascimento *', key:'dataNascimento', type:'date', placeholder:'' },
                                { lbl:'Gênero *', key:'genero', type:'select', options:['Masculino','Feminino','Prefiro não dizer'] },
                                { lbl:'Cidade *', key:'cidade', type:'text', placeholder:'Sua cidade' },
                                { lbl:'Bairro *', key:'bairro', type:'text', placeholder:'Seu bairro' },
                                { lbl:'Endereço (Rua e Nº) *', key:'endereco', type:'text', placeholder:'Ex: Av. Brasil, 123' },
                            ].map(f => (
                                <div key={f.key} style={{ gridColumn: f.key === 'endereco' ? 'span 1' : 'auto' }}>
                                    <label style={label}>{f.lbl}</label>
                                    {f.type === 'select' ? (
                                        <select style={selectStyle} value={pessoal[f.key]} onChange={e => setPessoal(p => ({ ...p, [f.key]:e.target.value }))}>
                                            <option value="">Selecione...</option>
                                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type={f.type}
                                            style={input}
                                            placeholder={f.placeholder}
                                            value={pessoal[f.key]}
                                            onChange={e => {
                                                let val = e.target.value;
                                                if (f.key === 'telefone') val = maskPhone(val);
                                                setPessoal(p => ({ ...p, [f.key]: val }));
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ════════════ PASSO 2: EXPERIÊNCIAS ════════════ */}
                {step === 2 && (
                    <div>
                        <h2 style={{ fontSize:'1.8rem', fontWeight:900, marginBottom:'0.25rem' }}>Experiências</h2>
                        <p style={{ color:'#64748b', marginBottom:'2rem' }}>Conte um pouco do seu histórico de trabalho.</p>

                        {temExperiencia === null && (
                            <div style={{ marginTop:'2rem' }}>
                                <p style={{ color:'var(--norte-dark-green)', fontWeight:800, fontSize:'1.3rem', marginBottom:'1.5rem', textAlign:'center' }}>Você já trabalhou antes?</p>
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'1.5rem' }}>
                                    <div style={optionCard(false)} onClick={() => setTemExperiencia(true)}>
                                        <div style={{ background:'rgba(0,141,76,0.1)', padding:'12px', borderRadius:'12px' }}>
                                            <Briefcase size={32} color="var(--norte-green)" />
                                        </div>
                                        <div style={{ flex:1 }}><p style={{ margin:0, fontWeight:900, color:'var(--norte-dark-green)', fontSize:'1.1rem' }}>Sim, já trabalhei</p><p style={{ margin:0, fontSize:'0.9rem', color:'var(--text-muted)' }}>Quero adicionar minhas experiências</p></div>
                                    </div>
                                    <div style={optionCard(false)} onClick={() => setTemExperiencia(false)}>
                                        <div style={{ background:'rgba(235,191,33,0.1)', padding:'12px', borderRadius:'12px', fontSize:'2rem' }}>🌱</div>
                                        <div style={{ flex:1 }}><p style={{ margin:0, fontWeight:900, color:'var(--norte-dark-green)', fontSize:'1.1rem' }}>Primeiro emprego</p><p style={{ margin:0, fontSize:'0.9rem', color:'var(--text-muted)' }}>Ainda não tive experiência profissional</p></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {temExperiencia === false && (
                            <div style={{ ...panel, textAlign:'center', padding:'3.5rem 2rem', background:'linear-gradient(rgba(0,141,76,0.02), rgba(235,191,33,0.02))' }}>
                                <div style={{ fontSize:'4rem', marginBottom:'1.5rem' }}>🌱</div>
                                <h3 style={{ color:'var(--norte-green)', fontSize:'2rem', fontWeight:900, marginBottom:'1rem' }}>Isso é maravilhoso!</h3>
                                <p style={{ color:'var(--text-muted)', maxWidth:'480px', margin:'0 auto', fontSize:'1.1rem', lineHeight:1.6, fontWeight:500 }}>
                                    Todo grande profissional começou do zero. Seu currículo será destacado como <strong style={{ color:'var(--norte-green)' }}>Primeiro Emprego</strong>, focando no seu potencial e vontade de aprender!
                                </p>
                                <button onClick={() => setTemExperiencia(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', marginTop:'2.5rem', fontSize:'0.95rem', fontWeight:700, textDecoration:'underline' }}>← Mudar resposta</button>
                            </div>
                        )}

                        {temExperiencia === true && (
                            <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                                <button type="button" onClick={() => setExperiencias(ex => [{ empresa:'', cargo:'', atual:false, mes_inicio:'', ano_inicio:'', mes_fim:'', ano_fim:'', descricao:'' }, ...ex])} style={{ background:'rgba(241,245,249,1)', border:'none', color:'var(--norte-dark-green)', borderRadius:'10px', padding:'12px 24px', cursor:'pointer', fontWeight:800, fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', textTransform:'uppercase', alignSelf:'flex-start' }}>
                                    <Plus size={18} /> Adicionar Experiência
                                </button>

                                {experiencias.map((exp, i) => (
                                    <div key={i} style={{ ...panel, background:'#f1f5f9', position:'relative', border:'1px solid #e2e8f0', padding:'1.5rem 2rem' }}>
                                        <div style={blockHeader}>
                                            <div style={blockTitle}>
                                                <Briefcase size={16} /> Experiência Profissional
                                            </div>
                                            <div style={{ display:'flex', alignItems:'center', gap:'15px' }}>
                                                {experiencias.length > 1 && (
                                                    <button type="button" onClick={() => setExperiencias(ex => ex.filter((_,idx) => idx!==i))} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', padding:0, display:'flex' }} title="Remover"><Trash2 size={20}/></button>
                                                )}
                                                <X size={16} color="#94a3b8" style={{ cursor:'pointer' }} onClick={() => setExperiencias(ex => ex.filter((_,idx) => idx!==i))} />
                                            </div>
                                        </div>

                                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'2rem', marginBottom:'1.5rem' }}>
                                            <div>
                                                <label style={label}>Empresa</label>
                                                <input style={input} value={exp.empresa} placeholder="Ex: Mercado Central" onChange={e => { const n=[...experiencias]; n[i].empresa=e.target.value; setExperiencias(n); }} />
                                            </div>
                                            <div style={{ position:'relative' }}>
                                                <label style={label}>Cargo</label>
                                                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                                                    <input style={{ ...input, flex:1 }} value={exp.cargo} placeholder="Ex: Auxiliar de Vendas" onChange={e => { const n=[...experiencias]; n[i].cargo=e.target.value; setExperiencias(n); }} />
                                                    <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', color:'#64748b', fontSize:'0.85rem', fontWeight:700, whiteSpace:'nowrap' }}>
                                                        <input type="checkbox" checked={exp.atual} onChange={e => { const n=[...experiencias]; n[i].atual=e.target.checked; setExperiencias(n); }} style={{ width:'16px', height:'16px', accentColor:'var(--norte-green)' }} />
                                                        Atual
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', marginBottom:'1.5rem' }}>
                                            <div>
                                                <label style={label}>Início</label>
                                                <div style={{ display:'flex', gap:'12px' }}>
                                                    <select style={selectStyle} value={exp.mes_inicio} onChange={e => { const n=[...experiencias]; n[i].mes_inicio=e.target.value; setExperiencias(n); }}><option value="">Mês</option>{MESES.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                                    <select style={selectStyle} value={exp.ano_inicio} onChange={e => { const n=[...experiencias]; n[i].ano_inicio=e.target.value; setExperiencias(n); }}><option value="">Ano</option>{ANOS.map(a => <option key={a} value={a}>{a}</option>)}</select>
                                                </div>
                                            </div>
                                            <div style={{ opacity: exp.atual ? 0.3 : 1, pointerEvents: exp.atual ? 'none' : 'auto' }}>
                                                <label style={label}>Fim</label>
                                                <div style={{ display:'flex', gap:'12px' }}>
                                                    <select style={selectStyle} value={exp.mes_fim} onChange={e => { const n=[...experiencias]; n[i].mes_fim=e.target.value; setExperiencias(n); }}><option value="">Mês</option>{MESES.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                                    <select style={selectStyle} value={exp.ano_fim} onChange={e => { const n=[...experiencias]; n[i].ano_fim=e.target.value; setExperiencias(n); }}><option value="">Ano</option>{ANOS.map(a => <option key={a} value={a}>{a}</option>)}</select>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label style={label}>Atribuições</label>
                                            <textarea style={{ ...input, minHeight:'120px', resize:'vertical' }} placeholder="Descreva suas atividades..." value={exp.descricao} onChange={e => { const n=[...experiencias]; n[i].descricao=e.target.value; setExperiencias(n); }} />
                                        </div>
                                    </div>
                                ))}
                                
                                <button onClick={() => setTemExperiencia(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', marginTop:'1.5rem', fontSize:'0.9rem', fontWeight:600, textDecoration:'underline', textAlign:'left' }}>← Mudar resposta</button>
                            </div>
                        )}
                    </div>
                )}

                {/* ════════════ PASSO 3: FORMAÇÃO ════════════ */}
                {step === 3 && (
                    <div>
                        <h2 style={{ fontSize:'2.2rem', fontWeight:900, marginBottom:'0.5rem', color:'var(--norte-dark-green)' }}>Formação Escolar</h2>
                        <p style={{ color:'var(--text-muted)', marginBottom:'2.5rem', fontSize:'1.05rem', fontWeight:500 }}>Informe sua escolaridade atual para que as empresas conheçam seu nível de ensino.</p>

                        <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                            {/* Bloco Ensino Médio */}
                            <div style={panel}>
                                <div style={blockHeader}>
                                    <div style={blockTitle}>
                                        <GraduationCap size={16} /> Ensino Médio
                                    </div>
                                    <X size={16} color="#94a3b8" />
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'2rem', marginBottom:'1.5rem' }}>
                                    <div>
                                        <label style={label}>Status</label>
                                        <select style={selectStyle} value={escolaridade.includes('em_') ? escolaridade : ''} onChange={e => setEscolaridade(e.target.value)}>
                                            <option value="">Selecione...</option>
                                            <option value="em_incompleto">Incompleto</option>
                                            <option value="em_cursando">Cursando</option>
                                            <option value="em_completo">Completo</option>
                                        </select>
                                    </div>
                                    {(escolaridade === 'em_completo' || escolaridade.startsWith('sup_')) && (
                                        <div>
                                            <label style={label}>Ano de Conclusão</label>
                                            <input style={input} type="number" placeholder="Ex: 2020" value={anoConclEM || anoConclEMSup} onChange={e => {
                                                if (escolaridade.startsWith('sup_')) setAnoConclEMSup(e.target.value);
                                                else setAnoConclEM(e.target.value);
                                            }} />
                                        </div>
                                    )}
                                    {escolaridade === 'em_cursando' && (
                                        <div style={{ display:'flex', gap:'12px' }}>
                                            <div style={{ flex:1 }}><label style={label}>Turno</label><select style={selectStyle} value={turnoEM} onChange={e => setTurnoEM(e.target.value)}><option value="">...</option>{TURNOS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                                            <div style={{ flex:1 }}><label style={label}>Série</label><select style={selectStyle} value={serieEM} onChange={e => setSerieEM(e.target.value)}><option value="">...</option>{ANOS_EM.map(a=><option key={a} value={a}>{a}</option>)}</select></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Seleção Superior (Opcional) */}
                            {(!escolaridade.startsWith('sup_') && escolaridade !== 'em_incompleto' && escolaridade !== 'em_cursando') && (
                                <button
                                    onClick={() => setEscolaridade('sup_cursando')}
                                    style={{ background:'#f1f5f9', border:'2px dashed #cbd5e1', color:'#64748b', borderRadius:'14px', padding:'1rem', cursor:'pointer', fontWeight:700, fontSize:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}
                                >
                                    <Plus size={18} /> Adicionar Ensino Superior
                                </button>
                            )}

                            {/* Bloco Ensino Superior */}
                            {escolaridade.startsWith('sup_') && (
                                <div style={{ ...panel, background:'#f8fafc' }}>
                                    <div style={blockHeader}>
                                        <div style={blockTitle}>
                                            <GraduationCap size={16} /> Ensino Superior
                                        </div>
                                        <X size={16} color="#94a3b8" style={{ cursor:'pointer' }} onClick={() => setEscolaridade('em_completo')} />
                                    </div>
                                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'2rem', marginBottom:'1.5rem' }}>
                                        <div>
                                            <label style={label}>Status</label>
                                            <select style={selectStyle} value={escolaridade} onChange={e => setEscolaridade(e.target.value)}>
                                                <option value="sup_incompleto">Incompleto</option>
                                                <option value="sup_cursando">Cursando</option>
                                                <option value="sup_completo">Completo</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={label}>Título do Curso</label>
                                            <input style={input} placeholder="Ex: Administração" value={cursoSup} onChange={e => setCursoSup(e.target.value)} />
                                        </div>
                                    </div>
                                    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'2rem' }}>
                                        <div>
                                            <label style={label}>Nome da Instituição</label>
                                            <input style={input} placeholder="Ex: UFAM" value={instSup} onChange={e => setInstSup(e.target.value)} />
                                        </div>
                                        {escolaridade === 'sup_completo' && (
                                            <div><label style={label}>Ano de Conclusão</label><input style={input} type="number" placeholder="Ex: 2024" value={anoConclSup} onChange={e => setAnoConclSup(e.target.value)} /></div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!escolaridade && (
                                <div style={{ textAlign:'center', color:'#94a3b8', fontSize:'0.9rem', fontWeight:600 }}>Escolha seu nível de escolaridade</div>
                            )}
                        </div>
                    </div>
                )}

                {/* ════════════ PASSO 4: HABILIDADES ════════════ */}
                {step === 4 && (
                    <div>
                        <h2 style={{ fontSize:'2.2rem', fontWeight:900, marginBottom:'0.5rem', color:'var(--norte-dark-green)' }}>Suas Habilidades</h2>
                        <p style={{ color:'var(--text-muted)', marginBottom:'2.5rem', fontSize:'1.05rem', fontWeight:500 }}>O que você sabe fazer de melhor? Selecione abaixo. ✨</p>

                        <div style={{ ...panel, borderLeft:'6px solid var(--norte-green)' }}>
                            {/* 1. Chips de Habilidades Selecionadas (Todas) */}
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--norte-dark-green)', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Suas Habilidades Selecionadas
                                </label>
                                <div style={{ 
                                    display: 'flex', 
                                    flexWrap: 'wrap', 
                                    gap: '10px',
                                    minHeight: '45px',
                                    padding: '16px',
                                    background: '#f8fafc',
                                    borderRadius: '16px',
                                    border: '2px dashed #e2e8f0'
                                }}>
                                    {habilidades.length === 0 ? (
                                        <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>Nenhuma habilidade selecionada ainda. Clique nas sugestões abaixo ou adicione uma exclusiva.</span>
                                    ) : (
                                        habilidades.map(skill => (
                                            <div 
                                                key={skill}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '8px 16px',
                                                    background: 'var(--norte-green)',
                                                    color: 'white',
                                                    borderRadius: '25px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 700,
                                                    boxShadow: '0 4px 10px rgba(0, 141, 76, 0.2)',
                                                    animation: 'popIn 0.2s ease-out'
                                                }}
                                            >
                                                {skill}
                                                <X 
                                                    size={14} 
                                                    style={{ cursor: 'pointer', opacity: 0.8 }} 
                                                    onClick={() => setHabilidades(h => h.filter(x => x !== skill))}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* 2. Sugestões Rápidas */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Sugestões Rápidas (Toque para adicionar)
                                    </label>
                                    <div style={{ 
                                        display: 'flex', 
                                        flexWrap: 'wrap', 
                                        gap: '8px'
                                    }}>
                                        {SKILLS_OPTIONS.filter(s => !habilidades.includes(s)).map(skill => (
                                            <button
                                                key={skill}
                                                type="button"
                                                onClick={() => setHabilidades(h => [...h, skill])}
                                                style={{
                                                    padding: '10px 22px',
                                                    borderRadius: '30px',
                                                    border: '1px solid rgba(0, 141, 76, 0.1)',
                                                    background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
                                                    color: '#64748b',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    boxShadow: '0 2px 4px rgba(0, 141, 76, 0.05)'
                                                }}
                                                onMouseOver={e => {
                                                    e.currentTarget.style.borderColor = 'var(--norte-green)';
                                                    e.currentTarget.style.color = '#fff';
                                                    e.currentTarget.style.background = 'var(--norte-green)';
                                                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
                                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 141, 76, 0.2)';
                                                }}
                                                onMouseOut={e => {
                                                    e.currentTarget.style.borderColor = 'rgba(0, 141, 76, 0.1)';
                                                    e.currentTarget.style.color = '#64748b';
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff, #f8fafc)';
                                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 141, 76, 0.05)';
                                                }}
                                            >
                                                <Plus size={14} />
                                                {skill}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 3. Adicionar Habilidade Personalizada */}
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                                    <label style={{ ...label, color: 'var(--norte-dark-green)' }}>Habilidade Personalizada</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input 
                                            style={{ ...input, flex: 1 }} 
                                            placeholder="Ex: Pilotagem de Drone, Corel Draw..." 
                                            value={habilInput} 
                                            onChange={e => setHabilInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key==='Enter' && habilInput.trim()) {
                                                    e.preventDefault();
                                                    const val = habilInput.trim();
                                                    if (!habilidades.includes(val)) setHabilidades(h => [...h, val]);
                                                    setHabilInput('');
                                                }
                                            }}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const val = habilInput.trim();
                                                if (val) {
                                                    if (!habilidades.includes(val)) setHabilidades(h => [...h, val]);
                                                    setHabilInput('');
                                                }
                                            }}
                                            style={{ background: 'var(--norte-green)', color: '#fff', border: 'none', borderRadius: '12px', padding: '0 25px', fontWeight: 800, cursor: 'pointer' }}
                                        >
                                            ADD
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════ PASSO 5: CURSOS ════════════ */}
                {step === 5 && (
                    <div>
                        <h2 style={{ fontSize:'2.2rem', fontWeight:900, marginBottom:'0.5rem', color:'var(--norte-dark-green)' }}>Cursos Extras</h2>
                        <p style={{ color:'var(--text-muted)', marginBottom:'2.5rem', fontSize:'1.05rem', fontWeight:500 }}>Você já estudou algo extra-curricular? Adicione seus certificados aqui. 📚</p>

                        {temCurso === null && (
                            <div style={{ marginTop:'2.5rem' }}>
                                <p style={{ color:'var(--norte-dark-green)', fontWeight:800, fontSize:'1.2rem', marginBottom:'1.5rem', textAlign:'center' }}>Você possui cursos profissionalizantes ou técnicos?</p>
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'1.5rem' }}>
                                    <div style={optionCard(false)} onClick={() => setTemCurso(true)}>
                                        <div style={{ background:'rgba(0,141,76,0.08)', padding:'12px', borderRadius:'12px' }}>
                                            <GraduationCap size={32} color="var(--norte-green)" />
                                        </div>
                                        <div style={{ flex:1 }}><p style={{ margin:0, fontWeight:900, color:'var(--norte-dark-green)', fontSize:'1.1rem' }}>Sim, possuo</p><p style={{ margin:0, fontSize:'0.9rem', color:'var(--text-muted)' }}>Adicionar meus certificados</p></div>
                                    </div>
                                    <div style={optionCard(false)} onClick={() => setTemCurso(false)}>
                                        <div style={{ background:'rgba(241,245,249,1)', padding:'12px', borderRadius:'12px', fontSize:'1.8rem' }}>⏩</div>
                                        <div style={{ flex:1 }}><p style={{ margin:0, fontWeight:900, color:'var(--norte-dark-green)', fontSize:'1.1rem' }}>Ainda não</p><p style={{ margin:0, fontSize:'0.9rem', color:'var(--text-muted)' }}>Pular para o próximo passo</p></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {temCurso === false && (
                            <div style={{ ...panel, textAlign:'center', padding:'2.5rem' }}>
                                <p style={{ color:'var(--text-muted)', fontSize:'1.1rem', fontWeight:500 }}>Sem problemas! O currículo foca nas suas habilidades práticas também. ✨</p>
                                <button onClick={() => setTemCurso(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.9rem', fontWeight:600, textDecoration:'underline', marginTop:'1rem' }}>← Mudar resposta</button>
                            </div>
                        )}

                        {temCurso === true && (
                            <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                                {cursos.map((c, i) => (
                                    <div key={i} style={{ ...panel, position:'relative', borderLeft:'6px solid var(--norte-green)' }}>
                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                                            <span style={{ fontWeight:900, color:'var(--norte-dark-green)', fontSize:'1.1rem' }}>Curso {i+1}</span>
                                            {cursos.length > 1 && <button type="button" onClick={() => setCursos(cs => cs.filter((_,idx) => idx!==i))} style={{ background:'rgba(239, 68, 68, 0.1)', border:'none', color:'#ef4444', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><Trash2 size={16}/></button>}
                                        </div>
                                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'1.25rem', marginBottom:'1.25rem' }}>
                                            <div><label style={label}>Nome do Curso *</label><input style={input} value={c.nome} placeholder="Ex: Informática Básica" onChange={e => { const n=[...cursos]; n[i].nome=e.target.value; setCursos(n); }} /></div>
                                            <div><label style={label}>Instituição</label><input style={input} value={c.instituicao} placeholder="Ex: SENAI" onChange={e => { const n=[...cursos]; n[i].instituicao=e.target.value; setCursos(n); }} /></div>
                                        </div>
                                        <div><label style={label}>Status</label><select style={selectStyle} value={c.status} onChange={e => { const n=[...cursos]; n[i].status=e.target.value; setCursos(n); }}><option value="completo">Completo</option><option value="cursando">Cursando</option></select></div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setCursos(cs => [...cs, { nome:'', instituicao:'', status:'completo' }])} style={{ background:'rgba(0,141,76,0.05)', border:'2px dashed var(--norte-green)', color:'var(--norte-green)', borderRadius:'16px', padding:'1.5rem', width:'100%', cursor:'pointer', fontWeight:800, fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                                    <Plus size={20} /> Adicionar outro curso
                                </button>
                                <button onClick={() => setTemCurso(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', marginTop:'1rem', fontSize:'0.9rem', fontWeight:600, textDecoration:'underline' }}>← Mudar resposta</button>
                            </div>
                        )}
                    </div>
                )}

                {/* ════════════ PASSO 6: DISC ════════════ */}
                {step === 6 && (
                    <div>
                        <h2 style={{ fontSize:'2.2rem', fontWeight:900, marginBottom:'0.5rem', color:'var(--norte-dark-green)' }}>Perfil Comportamental</h2>
                        <p style={{ color:'var(--text-muted)', marginBottom:'2.5rem', fontSize:'1.05rem', fontWeight:500 }}>Descubra como você costuma agir no ambiente de trabalho com esse teste de 10 perguntas rápidas.</p>

                        {!discDone ? (
                            <div style={{ ...panel, borderLeft:'6px solid var(--norte-yellow)' }}>
                                {/* Progresso DISC */}
                                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                                    <span style={{ color:'var(--text-muted)', fontSize:'0.9rem', fontWeight:700 }}>Questão {discStep+1} de {DISC_QUESTIONS.length}</span>
                                    <span style={{ color:'var(--norte-dark-green)', fontSize:'0.9rem', fontWeight:900 }}>{Math.round(((discStep+1)/DISC_QUESTIONS.length)*100)}%</span>
                                </div>
                                <div style={{ height:'8px', background:'#f1f5f9', borderRadius:'4px', marginBottom:'2rem', overflow:'hidden' }}>
                                    <div style={{ height:'100%', width:`${((discStep+1)/DISC_QUESTIONS.length)*100}%`, background:'var(--norte-green)', transition:'width 0.4s ease' }} />
                                </div>

                                <h3 style={{ fontSize:'1.4rem', fontWeight:900, marginBottom:'2rem', lineHeight:1.4, color:'var(--norte-dark-green)' }}>{DISC_QUESTIONS[discStep].question}</h3>

                                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                                    {DISC_QUESTIONS[discStep].options.map((opt, i) => (
                                        <button key={i} onClick={() => handleDiscSelect(opt.type)} style={{ background:'white', border:'2px solid #f1f5f9', borderRadius:'16px', padding:'18px 22px', color:'var(--text-main)', cursor:'pointer', textAlign:'left', fontSize:'1.05rem', fontWeight:600, transition:'all 0.2s', fontFamily:'inherit', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.02)' }} onMouseOver={e => e.currentTarget.style.borderColor='var(--norte-green)'} onMouseOut={e => e.currentTarget.style.borderColor='#f1f5f9'}>
                                            {opt.text}
                                        </button>
                                    ))}
                                </div>

                                {discStep > 0 && (
                                    <button onClick={() => setDiscStep(d => d-1)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', marginTop:'2rem', fontSize:'0.95rem', fontWeight:700, display:'flex', alignItems:'center', gap:'8px', textDecoration:'underline' }}>
                                        <ArrowLeft size={18} /> Voltar para a pergunta anterior
                                    </button>
                                )}
                            </div>
                        ) : saving ? (
                            <div style={{ ...panel, textAlign:'center', padding:'4rem 2rem' }}>
                                <div style={{ fontSize:'4rem', marginBottom:'1.5rem', animation:'bounce 1s infinite' }}>⏳</div>
                                <h3 style={{ color:'var(--norte-dark-green)', fontWeight:900, fontSize:'1.5rem' }}>Finalizando seu perfil...</h3>
                                <p style={{ color:'var(--text-muted)', marginTop:'0.5rem' }}>Estamos processando suas informações com cuidado.</p>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* ── Botões de Navegação ── */}
                {!(step === 6 && (discStep > 0 || discDone)) && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'3rem', paddingTop:'2rem', borderTop:'2px solid #f1f5f9' }}>
                        <button
                            onClick={() => { if (step > 1) setStep(s => s-1); else navigate('/vagas'); }}
                            style={{ background:'white', border:'2px solid #e2e8f0', color:'var(--text-muted)', borderRadius:'16px', padding:'14px 28px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', fontWeight:800, fontSize:'1rem', transition:'all 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.borderColor='var(--norte-green)'}
                            onMouseOut={e => e.currentTarget.style.borderColor='#e2e8f0'}
                        >
                            <ArrowLeft size={20} /> {step === 1 ? 'Sair agora' : 'Voltar'}
                        </button>

                        {step < 6 && (
                            <button
                                onClick={() => {
                                    // Validações simples antes de avançar
                                    if (step === 1) {
                                        if (!pessoal.nome.trim()) { showToast('Por favor, informe seu nome completo.', 'info'); return; }
                                        if (!pessoal.telefone.trim()) { showToast('Por favor, informe seu telefone ou WhatsApp.', 'info'); return; }
                                        if (!pessoal.dataNascimento) { showToast('Por favor, sua data de nascimento é obrigatória.', 'info'); return; }
                                        if (!pessoal.genero) { showToast('Por favor, selecione seu gênero.', 'info'); return; }
                                        if (!pessoal.cidade.trim()) { showToast('Por favor, informe sua cidade.', 'info'); return; }
                                        if (!pessoal.bairro.trim()) { showToast('Por favor, informe seu bairro.', 'info'); return; }
                                        if (!pessoal.endereco.trim()) { showToast('Por favor, informe seu endereço completo.', 'info'); return; }
                                    }
                                    if (step === 2 && temExperiencia === null) { showToast('Por favor, responda se você já trabalhou antes.', 'info'); return; }
                                    if (step === 3 && !escolaridade) { showToast('Por favor, selecione sua escolaridade.', 'info'); return; }
                                    // Passo 4: Habilidades (opcional)
                                    if (step === 5 && temCurso === null) { showToast('Por favor, responda se você fez algum curso.', 'info'); return; }
                                    
                                    setStep(s => s+1);
                                }}
                                style={{ background:'var(--norte-green)', color:'#fff', border:'none', borderRadius:'16px', padding:'14px 40px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', fontWeight:900, fontSize:'1.1rem', boxShadow:'0 10px 20px rgba(0,141,76,0.25)', transition:'transform 0.2s' }}
                                onMouseOver={e => e.currentTarget.style.transform='translateY(-2px)'}
                                onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}
                            >
                                Continuar <ArrowRight size={22} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <NorteToast 
                message={toast.message} 
                type={toast.type} 
                onClose={() => setToast({ ...toast, message: '' })} 
            />
        </div>
    );
}
