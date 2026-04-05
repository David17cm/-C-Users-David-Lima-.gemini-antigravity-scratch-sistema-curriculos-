import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    User, Camera, BookOpen, Tag, GraduationCap, 
    Plus, Trash2, Briefcase, FileText, Brain, X, ChevronDown, ChevronUp, Award, Save, CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import CandidateNavbar from '../components/layout/CandidateNavbar';
import DiscQuizModal from '../components/modals/DiscQuizModal';
import { NorteToast } from '../components/ui/NorteToast';

const EMPTY_FORM = {
    nome: '', dataNascimento: '', genero: '', email: '', telefone: '', cidade: '', resumo: '',
    endereco: '', bairro: '', numero: '', foto_url: '',
    habilidades: [], cursos_prof: [], experiencias: [], formacoes: [],
    ensino_medio: { status: '', ano_cursando: '', ano_conclusao: '', fundamental_completo: false },
    cnh: { possui: false, categorias: [] }, possui_transporte: false,
    perfil_disc: '', codigo_indicacao: ''
};

const SKILLS_SUGGESTIONS = [
    "Comunicação", "Trabalho em equipe", "Proatividade", "Organização", 
    "Responsabilidade", "Adaptabilidade", "Inteligência emocional", "Comprometimento", 
    "Pacote Office", "Atendimento ao cliente", "Vendas", "Negociação",
    "Liderança", "Vontade de aprender", "Pontualidade", "Resiliência"
];

const MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function maskPhone(value) {
    const nums = value.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 10) return nums.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    return nums.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
}

export default function Dashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, pago, loading: authLoading, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [autoSaving, setAutoSaving] = useState(false);
    const [uploadingFoto, setUploadingFoto] = useState(false);
    const [toast, setToast] = useState({ message: '', type: 'info' });
    const [habilidadeInput, setHabilidadeInput] = useState('');
    const [showDiscQuiz, setShowDiscQuiz] = useState(false);
    const [openSections, setOpenSections] = useState({
        foto: true, basico: true, resumo: true, habilidades: true, 
        escolaridade: true, formacao: true, cursos: true, experiencias: true, cnh: true
    });

    const fileInputRef = useRef();

    // ESCUTA CLIQUE NO BOTÃO TESTE DISC DO MENU
    useEffect(() => {
        if (location.state?.openDisc && !authLoading) {
            setShowDiscQuiz(true);
            // Limpa o state para permitir reabrir se clicar de novo
            window.history.replaceState({}, document.title);
        }
    }, [location.state, authLoading]);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const isInitialLoad = useRef(true);
    const saveTimeoutRef = useRef(null);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({ ...prev, email: user.email }));
            fetchCurriculo(user.id);
        }
    }, [user]);

    useEffect(() => {
        if (isInitialLoad.current || !user) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => performAutosave(), 3000);
        return () => clearTimeout(saveTimeoutRef.current);
    }, [formData]);

    // TRACKING: Logar quando o usuário visualiza a oferta premium
    useEffect(() => {
        if (user && !pago && !authLoading) {
            const logOfferVisit = async () => {
                const sessionKey = `view_premium_${user.id}_${new Date().toISOString().split('T')[0]}`;
                if (sessionStorage.getItem(sessionKey)) return;

                try {
                    await supabase.from('access_logs').insert([{
                        user_id: user.id,
                        email: user.email,
                        action: 'view_premium_offer',
                        user_agent: navigator.userAgent,
                        accessed_at: new Date().toISOString()
                    }]);
                    sessionStorage.setItem(sessionKey, 'true');
                } catch (e) {
                    console.error('Erro ao logar visualização de oferta:', e);
                }
            };
            logOfferVisit();
        }
    }, [user, pago, authLoading]);

    const fetchCurriculo = async (userId) => {
        try {
            const { data } = await supabase.from('curriculos').select('*').eq('user_id', userId).maybeSingle();
            if (data) {
                setFormData({
                    ...EMPTY_FORM,
                    ...data,
                    dataNascimento: data.data_nascimento || '',
                    habilidades: data.habilidades || [],
                    experiencias: data.experiencias || [],
                    formacoes: data.formacoes || [],
                    cursos_prof: data.cursos_prof || [],
                    ensino_medio: data.ensino_medio || EMPTY_FORM.ensino_medio,
                    cnh: data.cnh || EMPTY_FORM.cnh,
                });
            }
        } finally {
            setLoading(false);
            setTimeout(() => isInitialLoad.current = false, 1000);
        }
    };

    const performAutosave = async () => {
        setAutoSaving(true);
        try {
            const payload = { ...formData, user_id: user.id, data_nascimento: formData.dataNascimento, updated_at: new Date().toISOString() };
            delete payload.dataNascimento;
            await supabase.from('curriculos').upsert(payload, { onConflict: 'user_id' });
        } finally { setAutoSaving(false); }
    };

    const handleFotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingFoto(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `${user.id}/avatar-${Date.now()}.${ext}`;
            await supabase.storage.from('avatars').upload(path, file);
            const { data } = supabase.storage.from('avatars').getPublicUrl(path);
            setFormData(prev => ({ ...prev, foto_url: data.publicUrl }));
        } finally { setUploadingFoto(false); }
    };

    const toggleSection = (s) => setOpenSections(p => ({ ...p, [s]: !p[s] }));

    const SectionHeader = ({ icon: Icon, title, id }) => (
        <div 
            onClick={() => toggleSection(id)}
            style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                padding: '1.2rem', cursor: 'pointer', borderBottom: openSections[id] ? '1px solid #f1f5f9' : 'none',
                background: '#fff', borderTopLeftRadius: '12px', borderTopRightRadius: '12px'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={20} color="var(--norte-green)" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--norte-dark-green)', textTransform: 'uppercase' }}>{title}</h3>
            </div>
            {openSections[id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
    );

    const handleAddSkill = (skill) => {
        if (!formData.habilidades.includes(skill)) {
            setFormData(prev => ({ ...prev, habilidades: [...prev.habilidades, skill] }));
        }
    };

    const handleRemoveSkill = (skill) => {
        setFormData(prev => ({ ...prev, habilidades: prev.habilidades.filter(s => s !== skill) }));
    };

    const handleSaveManual = async () => {
        await performAutosave();
        setToast({ message: 'Currículo salvo com sucesso! 🛡️', type: 'success' });
        setTimeout(() => navigate('/cv-preview'), 1500);
    };

    if (loading) return <div className="container" style={{padding:'2rem'}}><CardSkeleton /><CardSkeleton /></div>;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '100px' }}>
            <CandidateNavbar subtitle={autoSaving ? 'Salvando...' : 'Salvo'} profilePhoto={formData.foto_url} />

            <div className="container" style={{ marginTop: '2rem', padding: '0 15px' }}>
                
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--norte-dark-green)', margin: 0 }}>MANTENHA SEU PERFIL ATUALIZADO 🌿</h2>
                    <button 
                        onClick={() => navigate('/cv-preview')}
                        className="neon-button secondary"
                        style={{ width: 'auto', margin: 0, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}
                    >
                        <FileText size={18} /> VISUALIZAR MEU CURRÍCULO 🚀
                    </button>
                </div>

                {/* BANNER PREMIUM (SE NÃO FOR PAGO) */}
                {!pago && (
                    <div className="premium-banner" style={{
                        background: 'linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)',
                        borderRadius: '16px',
                        padding: '1.5rem 2.5rem',
                        marginBottom: '2.5rem',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '2rem',
                        boxShadow: '0 15px 35px -5px rgba(124, 58, 237, 0.4)',
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '0.5px' }}>
                                <Award color="#fbbf24" fill="#fbbf24" size={32} /> SEJA UM CANDIDATO PREMIUM
                            </h3>
                            <p style={{ margin: '10px 0 0 0', opacity: 0.95, fontSize: '1rem', maxWidth: '520px', lineHeight: 1.5 }}>
                                Desbloqueie o <strong>Selo de Perfil Verificado</strong>, veja quem visitou seu currículo e tenha acesso a modelos exclusivos por apenas <strong>R$ 7,90</strong>.
                            </p>
                        </div>
                        <button 
                            onClick={() => window.open(`https://pay.cakto.com.br/fzowxw7_836819?refId=${user.id}`, '_blank')}
                            style={{ 
                                background: '#fff', 
                                color: '#7c3aed', 
                                width: 'auto', 
                                margin: 0, 
                                fontWeight: 900, 
                                padding: '14px 32px', 
                                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                                fontSize: '1rem',
                                borderRadius: '10px',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                zIndex: 2
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            QUERO SER PREMIUM 🚀
                        </button>
                        
                        {/* Decoração de fundo conforme imagem */}
                        <div style={{ position: 'absolute', right: '-40px', bottom: '-40px', opacity: 0.15, zIndex: 1 }}>
                            <Award size={200} />
                        </div>
                    </div>
                )}

                {/* CHECKLIST DE MELHORIA */}
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid #10b981' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--norte-dark-green)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Brain size={20} color="#10b981" /> CHECKLIST DE MELHORIA DO CURRÍCULO 🧬
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        {[
                            { label: 'Foto de Perfil Profissional', met: !!formData.foto_url, tip: 'Aumenta 4x visualizações' },
                            { label: 'Resumo Completo (>50 letras)', met: (formData.resumo?.length || 0) > 50, tip: 'Causa impacto inicial' },
                            { label: 'Pelo menos 5 Habilidades', met: (formData.habilidades?.length || 0) >= 5, tip: 'Ajuda no filtro das empresas' },
                            { label: 'Experiências Detalhadas', met: (formData.experiencias?.length || 0) > 0, tip: 'Mostra sua bagagem' },
                            { label: 'Teste Comportamental DISC', met: !!formData.perfil_disc, tip: 'Essencial para RH' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: item.met ? '#10b981' : '#64748b' }}>
                                {item.met ? <CheckCircle size={16} /> : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                                <div>
                                    <strong style={{ display: 'block' }}>{item.label}</strong>
                                    {!item.met && <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>Dica: {item.tip}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* FOTO */}
                    <div className="glass-panel" style={{ padding: 0 }}>
                        <SectionHeader icon={Camera} title="Foto de Perfil" id="foto" />
                        {openSections.foto && (
                            <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                                <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <img src={formData.foto_url || 'https://via.placeholder.com/150'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Perfil" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input type="file" ref={fileInputRef} hidden onChange={handleFotoUpload} />
                                    <button onClick={() => fileInputRef.current.click()} type="button" className="neon-button secondary" style={{ width: 'auto' }}>
                                        {uploadingFoto ? 'ENVIANDO...' : '📷 ADICIONAR MINHA MELHOR FOTO'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* DADOS PESSOAIS */}
                    <div className="glass-panel" style={{ padding: 0 }}>
                        <SectionHeader icon={User} title="Dados Pessoais" id="basico" />
                        {openSections.basico && (
                            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                                <div className="input-group">
                                    <label>Nome Completo *</label>
                                    <input className="neon-input" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label>Telefone / WhatsApp *</label>
                                    <input className="neon-input" value={formData.telefone || ''} onChange={e => setFormData({...formData, telefone: maskPhone(e.target.value)})} />
                                </div>
                                <div className="input-group">
                                    <label>Data de Nascimento *</label>
                                    <input className="neon-input" type="date" value={formData.dataNascimento || ''} onChange={e => setFormData({...formData, dataNascimento: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label>Gênero *</label>
                                    <select className="neon-input" value={formData.genero || ''} onChange={e => setFormData({...formData, genero: e.target.value})}>
                                        <option value="">Selecione...</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Feminino">Feminino</option>
                                        <option value="Prefiro não dizer">Prefiro não dizer</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Cidade *</label>
                                    <input className="neon-input" value={formData.cidade || ''} onChange={e => setFormData({...formData, cidade: e.target.value})} placeholder="Sua cidade" />
                                </div>
                                <div className="input-group">
                                    <label>Bairro *</label>
                                    <input className="neon-input" value={formData.bairro || ''} onChange={e => setFormData({...formData, bairro: e.target.value})} />
                                </div>
                                <div className="input-group" style={{ gridColumn: 'span 1' }}>
                                    <label>Endereço (Rua e Nº) *</label>
                                    <input className="neon-input" value={formData.endereco || ''} onChange={e => setFormData({...formData, endereco: e.target.value})} placeholder="Ex: Av. Brasil, 123" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RESUMO */}
                    <div className="glass-panel" style={{ padding: 0 }}>
                        <SectionHeader icon={BookOpen} title="Resumo Profissional" id="resumo" />
                        {openSections.resumo && (
                            <div style={{ padding: '1.5rem' }}>
                                <textarea className="neon-input" style={{ minHeight: '120px' }} value={formData.resumo || ''} onChange={e => setFormData({...formData, resumo: e.target.value})} placeholder="Conte brevemente sobre sua jornada profissional e seus objetivos..." />
                            </div>
                        )}
                    </div>

                    {/* HABILIDADES */}
                    <div className="glass-panel" style={{ padding: 0 }}>
                        <SectionHeader icon={Tag} title="Principais Habilidades" id="habilidades" />
                        {openSections.habilidades && (
                            <div style={{ padding: '1.5rem' }}>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Selecione suas principais competências:</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.5rem' }}>
                                    {SKILLS_SUGGESTIONS.map(skill => (
                                        <button 
                                            key={skill} 
                                            type="button"
                                            onClick={() => formData.habilidades.includes(skill) ? handleRemoveSkill(skill) : handleAddSkill(skill)}
                                            style={{ 
                                                padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer',
                                                background: formData.habilidades.includes(skill) ? 'var(--norte-green)' : '#fff',
                                                color: formData.habilidades.includes(skill) ? '#fff' : '#475569',
                                                transition: '0.2s'
                                            }}
                                        >
                                            {formData.habilidades.includes(skill) ? '✓ ' : ''}{skill}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                    <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '8px' }}>Adicionar habilidade única:</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input className="neon-input" value={habilidadeInput} onChange={e => setHabilidadeInput(e.target.value)} placeholder="Ex: Pilotagem de Drone, Corel Draw..." />
                                        <button type="button" onClick={() => { if(habilidadeInput.trim()) { handleAddSkill(habilidadeInput.trim()); setHabilidadeInput(''); } }} className="neon-button" style={{ width: 'auto', margin: 0 }}>ADICIONAR</button>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '1rem' }}>
                                        {formData.habilidades.filter(s => !SKILLS_SUGGESTIONS.includes(s)).map(s => (
                                            <span key={s} style={{ background: 'var(--norte-dark-green)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {s} <X size={14} style={{ cursor: 'pointer' }} onClick={() => handleRemoveSkill(s)} />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ESCOLARIDADE */}
                    <div className="glass-panel" style={{ padding: 0 }}>
                        <SectionHeader icon={GraduationCap} title="Escolaridade" id="escolaridade" />
                        {openSections.escolaridade && (
                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                    <div className="input-group">
                                        <label>Status do Ensino Médio</label>
                                        <select className="neon-input" value={formData.ensino_medio?.status || ''} onChange={e => setFormData({...formData, ensino_medio: {...formData.ensino_medio, status: e.target.value}})}>
                                            <option value="">Selecione...</option>
                                            <option value="completo">Concluído</option>
                                            <option value="cursando">Cursando</option>
                                            <option value="incompleto">Incompleto</option>
                                        </select>
                                    </div>

                                    {formData.ensino_medio?.status === 'cursando' && (
                                        <div className="input-group">
                                            <label>Qual ano está cursando?</label>
                                            <select className="neon-input" value={formData.ensino_medio?.ano_cursando || ''} onChange={e => setFormData({...formData, ensino_medio: {...formData.ensino_medio, ano_cursando: e.target.value}})}>
                                                <option value="">Selecione...</option>
                                                <option value="1">1º Ano</option>
                                                <option value="2">2º Ano</option>
                                                <option value="3">3º Ano</option>
                                            </select>
                                        </div>
                                    )}

                                    {formData.ensino_medio?.status === 'completo' && (
                                        <div className="input-group">
                                            <label>Ano de Conclusão</label>
                                            <input type="number" className="neon-input" placeholder="Ex: 2022" value={formData.ensino_medio?.ano_conclusao || ''} onChange={e => setFormData({...formData, ensino_medio: {...formData.ensino_medio, ano_conclusao: e.target.value}})} />
                                        </div>
                                    )}

                                    {formData.ensino_medio?.status === 'incompleto' && (
                                        <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '30px' }}>
                                            <input type="checkbox" checked={formData.ensino_medio?.fundamental_completo || false} onChange={e => setFormData({...formData, ensino_medio: {...formData.ensino_medio, fundamental_completo: e.target.checked}})} />
                                            <label style={{ margin: 0 }}>Possuo Ensino Fundamental completo</label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* FORMAÇÃO ACADÊMICA */}
                    <div className="glass-panel" style={{ padding: 0 }}>
                        <SectionHeader icon={Plus} title="Formação Acadêmica (Superior)" id="formacao" />
                        {openSections.formacao && (
                            <div style={{ padding: '1.5rem' }}>
                                <button type="button" onClick={() => setFormData({...formData, formacoes: [...(formData.formacoes || []), { curso: '', instituicao: '', status: '', ano_conclusao: '' }]})} className="neon-button secondary" style={{ width: '100%', background: '#f8fafc', color: '#475569', marginBottom: '1.5rem' }}>
                                    + ADICIONAR FORMAÇÃO SUPERIOR
                                </button>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {(formData.formacoes || []).map((f, i) => (
                                        <div key={i} style={{ border: '1px solid #f1f5f9', padding: '1.2rem', borderRadius: '12px', position: 'relative' }}>
                                            <button type="button" onClick={() => setFormData({...formData, formacoes: formData.formacoes.filter((_, idx) => idx !== i)})} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                <Trash2 size={18} color="#ef4444" />
                                            </button>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                <div className="input-group"><label>Curso</label><input className="neon-input" placeholder="Ex: Administração, Direito..." value={f.curso || ''} onChange={e => { const nf = [...formData.formacoes]; nf[i].curso = e.target.value; setFormData({...formData, formacoes: nf}); }} /></div>
                                                <div className="input-group"><label>Onde faz / fez (Instituição)</label><input className="neon-input" placeholder="Ex: UFPA, Unama..." value={f.instituicao || ''} onChange={e => { const nf = [...formData.formacoes]; nf[i].instituicao = e.target.value; setFormData({...formData, formacoes: nf}); }} /></div>
                                                <div className="input-group">
                                                    <label>Status</label>
                                                    <select className="neon-input" value={f.status || ''} onChange={e => { const nf = [...formData.formacoes]; nf[i].status = e.target.value; setFormData({...formData, formacoes: nf}); }}>
                                                        <option value="">Selecione...</option>
                                                        <option value="completo">Completo</option>
                                                        <option value="cursando">Cursando</option>
                                                        <option value="incompleto">Incompleto</option>
                                                    </select>
                                                </div>
                                                {f.status === 'completo' && (
                                                    <div className="input-group"><label>Ano de Conclusão</label><input type="number" className="neon-input" value={f.ano_conclusao || ''} onChange={e => { const nf = [...formData.formacoes]; nf[i].ano_conclusao = e.target.value; setFormData({...formData, formacoes: nf}); }} /></div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CURSOS */}
                    <div className="glass-panel" style={{ padding: 0 }}>
                        <SectionHeader icon={Award} title="Cursos Profissionalizantes" id="cursos" />
                        {openSections.cursos && (
                            <div style={{ padding: '1.5rem' }}>
                                <button type="button" onClick={() => setFormData({...formData, cursos_prof: [...(formData.cursos_prof || []), { nome: '', instituicao: '', status: '' }]})} className="neon-button secondary" style={{ width: '100%', background: '#f8fafc', color: '#475569', marginBottom: '1.5rem' }}>
                                    + ADICIONAR CURSO
                                </button>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {(formData.cursos_prof || []).map((c, i) => (
                                    <div key={i} style={{ border: '1px solid #f1f5f9', padding: '1.2rem', borderRadius: '12px', display: 'flex', gap: '1.2rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                        <div className="input-group" style={{ flex: 2, minWidth: '200px' }}><label>O que fez (Nome do Curso)</label><input className="neon-input" value={c.nome || ''} onChange={e => { const nc = [...formData.cursos_prof]; nc[i].nome = e.target.value; setFormData({...formData, cursos_prof: nc}); }} /></div>
                                        <div className="input-group" style={{ flex: 1.5, minWidth: '180px' }}><label>Onde fez (Instituição)</label><input className="neon-input" value={c.instituicao || ''} onChange={e => { const nc = [...formData.cursos_prof]; nc[i].instituicao = e.target.value; setFormData({...formData, cursos_prof: nc}); }} /></div>
                                        <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
                                            <label>Status</label>
                                            <select className="neon-input" value={c.status || ''} onChange={e => { const nc = [...formData.cursos_prof]; nc[i].status = e.target.value; setFormData({...formData, cursos_prof: nc}); }}>
                                                <option value="">Selecione...</option>
                                                <option value="completo">Completo</option>
                                                <option value="cursando">Cursando</option>
                                            </select>
                                        </div>
                                        <button type="button" onClick={() => setFormData({...formData, cursos_prof: formData.cursos_prof.filter((_, idx) => idx !== i)})} style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '42px', width: '42px', transition: '0.2s' }}>
                                            <Trash2 size={20} color="#ef4444" />
                                        </button>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* EXPERIÊNCIAS PROFISSIONAIS */}
                    <div className="glass-panel" style={{ padding: 0 }}>
                        <SectionHeader icon={Briefcase} title="Experiências Profissionais" id="experiencias" />
                        {openSections.experiencias && (
                            <div style={{ padding: '1.5rem' }}>
                                <button type="button" onClick={() => setFormData({...formData, experiencias: [...(formData.experiencias || []), { empresa: '', cargo: '', mes_inicio: '', ano_inicio: '', mes_fim: '', ano_fim: '', atual: false, atribuicoes: '' }]})} className="neon-button secondary" style={{ width: '100%', background: '#f8fafc', color: '#475569', marginBottom: '1.5rem' }}>
                                    + ADICIONAR EXPERIÊNCIA
                                </button>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {(formData.experiencias || []).map((exp, i) => (
                                        <div key={i} style={{ border: '1px solid #f1f5f9', padding: '1.2rem', borderRadius: '12px', position: 'relative' }}>
                                            <button type="button" onClick={() => setFormData({...formData, experiencias: formData.experiencias.filter((_, idx) => idx !== i)})} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                <Trash2 size={18} color="#ef4444" />
                                            </button>
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' }}>
                                                <div className="input-group"><label>Empresa</label><input className="neon-input" value={exp.empresa || ''} onChange={e => { const ne = [...formData.experiencias]; ne[i].empresa = e.target.value; setFormData({...formData, experiencias: ne}); }} /></div>
                                                <div className="input-group"><label>Cargo</label><input className="neon-input" value={exp.cargo || ''} onChange={e => { const ne = [...formData.experiencias]; ne[i].cargo = e.target.value; setFormData({...formData, experiencias: ne}); }} /></div>
                                                
                                                <div className="input-group" style={{ gridColumn: 'span 1' }}>
                                                    <label>Início</label>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <select className="neon-input" style={{ flex: 1 }} value={exp.mes_inicio || ''} onChange={e => { const ne = [...formData.experiencias]; ne[i].mes_inicio = e.target.value; setFormData({...formData, experiencias: ne}); }}>
                                                            <option value="">Mês</option>
                                                            {MESES.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
                                                        </select>
                                                        <input type="number" className="neon-input" style={{ flex: 1 }} placeholder="Ano" value={exp.ano_inicio || ''} onChange={e => { const ne = [...formData.experiencias]; ne[i].ano_inicio = e.target.value; setFormData({...formData, experiencias: ne}); }} />
                                                    </div>
                                                </div>

                                                <div className="input-group" style={{ gridColumn: 'span 1' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <label style={{ margin: 0 }}>Fim</label>
                                                        <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                            <input type="checkbox" checked={exp.atual || false} onChange={e => { const ne = [...formData.experiencias]; ne[i].atual = e.target.checked; setFormData({...formData, experiencias: ne}); }} /> Atual
                                                        </label>
                                                    </div>
                                                    {!exp.atual && (
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            <select className="neon-input" style={{ flex: 1 }} value={exp.mes_fim || ''} onChange={e => { const ne = [...formData.experiencias]; ne[i].mes_fim = e.target.value; setFormData({...formData, experiencias: ne}); }}>
                                                                <option value="">Mês</option>
                                                                {MESES.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
                                                            </select>
                                                            <input type="number" className="neon-input" style={{ flex: 1 }} placeholder="Ano" value={exp.ano_fim || ''} onChange={e => { const ne = [...formData.experiencias]; ne[i].ano_fim = e.target.value; setFormData({...formData, experiencias: ne}); }} />
                                                        </div>
                                                    )}
                                                    {exp.atual && <div className="neon-input" style={{ background: '#f8fafc', color: 'var(--norte-green)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>TRABALHANDO ATUALMENTE</div>}
                                                </div>

                                                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                                    <label>Atribuições (O que você fazia?)</label>
                                                    <textarea className="neon-input" style={{ minHeight: '80px' }} placeholder="Ex: Atendimento ao cliente, reposição de estoque, fechamento de caixa..." value={exp.atribuicoes || ''} onChange={e => { const ne = [...formData.experiencias]; ne[i].atribuicoes = e.target.value; setFormData({...formData, experiencias: ne}); }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {(formData.experiencias?.length === 0) && (
                                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: '1rem' }}>Caso seja seu primeiro emprego, pode deixar em branco.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* CNH E TRANSPORTE */}
                    <div className="glass-panel" style={{ padding: 0 }}>
                        <SectionHeader icon={Award} title="CNH e Transporte" id="cnh" />
                        {openSections.cnh && (
                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                                    <div className="input-group">
                                        <label>Possui CNH?</label>
                                        <select className="neon-input" value={formData.cnh?.possui ? 'true' : 'false'} onChange={e => setFormData({...formData, cnh: {...formData.cnh, possui: e.target.value === 'true'}})}>
                                            <option value="false">Não possuo</option>
                                            <option value="true">Sim, possuo</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>Possui Veículo Próprio?</label>
                                        <select className="neon-input" value={formData.possui_transporte ? 'true' : 'false'} onChange={e => setFormData({...formData, possui_transporte: e.target.value === 'true'})}>
                                            <option value="false">Não possuo</option>
                                            <option value="true">Sim, possuo</option>
                                        </select>
                                    </div>
                                </div>

                                {formData.cnh?.possui && (
                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--norte-dark-green)', display: 'block', marginBottom: '10px' }}>CATEGORIAS DA CNH:</label>
                                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                            {['A', 'B', 'C', 'D', 'E'].map(cat => (
                                                <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700 }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={formData.cnh?.categorias?.includes(cat)} 
                                                        onChange={e => {
                                                            const cats = formData.cnh?.categorias || [];
                                                            if (e.target.checked) setFormData({...formData, cnh: {...formData.cnh, categorias: [...cats, cat]}});
                                                            else setFormData({...formData, cnh: {...formData.cnh, categorias: cats.filter(c => c !== cat)}});
                                                        }}
                                                    /> {cat}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                    <button 
                        onClick={handleSaveManual} 
                        className="neon-button" 
                        style={{ background: autoSaving ? '#10b981' : 'var(--norte-dark-green)', color: '#fff', width: 'auto', padding: '16px 60px', fontSize: '1.1rem', fontWeight: 900, boxShadow: '0 8px 20px rgba(0, 91, 50, 0.3)', transition: 'all 0.3s ease' }}
                    >
                        {autoSaving ? <CheckCircle size={20} style={{ marginRight: '10px', display: 'inline' }} /> : <Save size={20} style={{ marginRight: '10px', display: 'inline' }} />}
                        {autoSaving ? 'SALVANDO CURRÍCULO...' : 'SALVAR CURRÍCULO 💾'}
                    </button>
                    <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.85rem' }}>Seus dados também são salvos automaticamente enquanto você digita. ✨</p>
                </div>
            </div>

            <DiscQuizModal isOpen={showDiscQuiz} onClose={() => setShowDiscQuiz(false)} onFinish={(res) => setFormData({...formData, perfil_disc: JSON.stringify(res)})} />
            <NorteToast message={toast.message} type={toast.type} onClose={() => setToast({message:'', type:'info'})} />
        </div>
    );
}
