import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, User, Camera, BookOpen, Tag, GraduationCap, Plus, Trash2, Briefcase, Award, AlertCircle, FileText, Brain, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import CandidateNavbar from '../components/layout/CandidateNavbar';
import DiscQuizModal from '../components/modals/DiscQuizModal';
const TURNOS = ['Manhã', 'Tarde', 'Noite'];
const SEMESTRES = ['1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°'];
const ANOS_EM = ['1° Ano', '2° Ano', '3° Ano'];
const CNH_CATS = ['A', 'B', 'AB', 'ABD'];

// Máscara de telefone: (99) 99999-9999
function maskPhone(value) {
    const nums = value.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 10)
        return nums.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    return nums.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
}

const EMPTY_FORM = {
    nome: '', dataNascimento: '', email: '', telefone: '', cidade: '', resumo: '',
    endereco: '', bairro: '', numero: '',
    foto_url: '',
    habilidades: [],
    cursos_prof: [],
    experiencias: [],
    formacoes: [],
    ensino_medio: { status: '', ano_cursando: '', turno: '', ano_conclusao: '' },
    cnh: { possui: false, categorias: [] },
    perfil_disc: ''
};

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingFoto, setUploadingFoto] = useState(false);
    const [errors, setErrors] = useState({});
    const [toastMsg, setToastMsg] = useState('');
    const [toastError, setToastError] = useState('');
    const [habilidadeInput, setHabilidadeInput] = useState('');
    const [showDiscQuiz, setShowDiscQuiz] = useState(false);
    const [openSections, setOpenSections] = useState({
        foto: true,
        basico: true,
        resumo: false,
        habilidades: false,
        cursos: false,
        ensinoMedio: false,
        formacao: false,
        cnh: false,
        experiencia: false,
        disc: false
    });
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading } = useAuth();
    const fileInputRef = useRef();

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [lastSavedData, setLastSavedData] = useState(null);
    const [autoSaving, setAutoSaving] = useState(false);
    const saveTimeoutRef = useRef(null);

    useEffect(() => {
        if (location.state?.openDisc) {
            setShowDiscQuiz(true);
            setOpenSections(prev => ({ ...prev, disc: true }));
            // Limpa o state para não disparar no reload
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({ ...prev, email: user.email }));
            fetchCurriculo(user.id);
        }
    }, [user]);

    // Lógica de Autosave (Debounced)
    useEffect(() => {
        if (!user || loading || authLoading) return;
        if (lastSavedData && JSON.stringify(formData) === JSON.stringify(lastSavedData)) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            performAutosave();
        }, 2000);
        return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
    }, [formData]);

    const performAutosave = async () => {
        if (!user) return;
        setAutoSaving(true);
        try {
            const payload = {
                user_id: user.id,
                nome: formData.nome,
                email: formData.email,
                telefone: formData.telefone,
                cidade: formData.cidade,
                endereco: formData.endereco,
                bairro: formData.bairro,
                numero: formData.numero,
                data_nascimento: formData.dataNascimento,
                resumo: formData.resumo,
                foto_url: formData.foto_url,
                habilidades: formData.habilidades,
                cursos_prof: formData.cursos_prof.map(c => typeof c === 'string' ? c : JSON.stringify(c)),
                experiencias: formData.experiencias.map(e => typeof e === 'string' ? e : JSON.stringify(e)),
                formacoes: formData.formacoes.map(f => typeof f === 'string' ? f : JSON.stringify(f)),
                ensino_medio: formData.ensino_medio,
                cnh: formData.cnh,
                perfil_disc: formData.perfil_disc,
                updated_at: new Date().toISOString(),
            };
            await supabase.from('curriculos').upsert(payload, { onConflict: 'user_id' });
            setLastSavedData(JSON.parse(JSON.stringify(formData)));
        } catch (err) {
            console.warn('Autosave falhou silenciosamente:', err.message);
        } finally {
            setAutoSaving(false);
        }
    };

    const fetchCurriculo = async (userId) => {
        try {
            const { data } = await supabase.from('curriculos').select('*').eq('user_id', userId).limit(1).maybeSingle();
            const parseArray = (arr, type) => {
                if (!Array.isArray(arr)) return [];
                return arr.map(item => {
                    if (typeof item === 'string') {
                        if (item.trim().startsWith('{')) {
                            try { return JSON.parse(item); } catch (e) { /* fallback below */ }
                        }
                        if (type === 'cursos') return { nome: item, instituicao: '', status: 'completo', observacao: '' };
                        if (type === 'experiencias') return { empresa: item, cargo: '', atual: false, descricao: '' };
                        if (type === 'formacoes') return { instituicao: item, curso: '', status: 'cursando' };
                    }
                    return item;
                });
            };

            if (data) {
                const cnhRaw = data.cnh || {};
                const emRaw = data.ensino_medio || {};
                const loadedData = {
                    nome: data.nome || '',
                    dataNascimento: data.data_nascimento || '',
                    email: data.email || '',
                    telefone: data.telefone || '',
                    cidade: data.cidade || '',
                    endereco: data.endereco || '',
                    bairro: data.bairro || '',
                    numero: data.numero || '',
                    resumo: data.resumo || '',
                    foto_url: data.foto_url || '',
                    habilidades: Array.isArray(data.habilidades) ? data.habilidades : [],
                    cursos_prof: parseArray(data.cursos_prof, 'cursos'),
                    experiencias: parseArray(data.experiencias, 'experiencias'),
                    formacoes: parseArray(data.formacoes, 'formacoes'),
                    ensino_medio: { status: emRaw.status || '', ano_cursando: emRaw.ano_cursando || '', turno: emRaw.turno || '', ano_conclusao: emRaw.ano_conclusao || '' },
                    cnh: { possui: cnhRaw.possui === true, categorias: Array.isArray(cnhRaw.categorias) ? cnhRaw.categorias : [] },
                    perfil_disc: data.perfil_disc || '',
                };
                setFormData(loadedData);
                setLastSavedData(JSON.parse(JSON.stringify(loadedData)));
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleFotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
        if (!ALLOWED_TYPES.includes(file.type)) {
            alert('Tipo de arquivo inválido. Envie apenas imagens JPG, PNG ou WebP.');
            return;
        }
        setUploadingFoto(true);
        try {
            const ext = file.type.split('/')[1];
            const path = `${user.id}/avatar.${ext}`;
            await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
            const { data } = supabase.storage.from('avatars').getPublicUrl(path);
            setFormData(prev => ({ ...prev, foto_url: `${data.publicUrl}?t=${Date.now()}` }));
        } catch (err) { alert('Erro no upload: ' + err.message); }
        finally { setUploadingFoto(false); }
    };

    const validate = () => {
        const e = {};
        if (!formData.nome.trim()) e.nome = 'Nome obrigatório';
        if (!formData.dataNascimento) e.dataNascimento = 'Data obrigatória';
        if (!formData.email.trim()) e.email = 'E-mail obrigatório';
        if (!formData.telefone.trim()) e.telefone = 'Telefone obrigatório';
        if (!formData.bairro.trim()) e.bairro = 'Bairro obrigatório';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        setSaving(true);
        try {
            const payload = {
                user_id: user.id,
                nome: formData.nome,
                email: formData.email,
                telefone: formData.telefone,
                cidade: formData.cidade,
                endereco: formData.endereco,
                bairro: formData.bairro,
                numero: formData.numero,
                data_nascimento: formData.dataNascimento,
                resumo: formData.resumo,
                foto_url: formData.foto_url,
                habilidades: formData.habilidades,
                cursos_prof: formData.cursos_prof,
                experiencias: formData.experiencias,
                formacoes: formData.formacoes,
                ensino_medio: formData.ensino_medio,
                cnh: formData.cnh,
                perfil_disc: formData.perfil_disc,
                updated_at: new Date().toISOString(),
            };
            await supabase.from('curriculos').upsert(payload, { onConflict: 'user_id' });
            setToastMsg('Currículo salvo com sucesso!');
            setTimeout(() => setToastMsg(''), 3500);
        } catch (err) {
            setToastError(`Erro ao salvar: ${err.message}`);
            setTimeout(() => setToastError(''), 3500);
        }
        finally { setSaving(false); }
    };

    const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

    const sectionHdr = (icon, title, sectionKey) => (
        <div
            onClick={() => sectionKey ? toggleSection(sectionKey) : null}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                color: '#7c3aed', borderBottom: '1px solid #e5e7eb',
                paddingBottom: '10px', marginBottom: (sectionKey && !openSections[sectionKey]) ? '0' : '20px',
                cursor: sectionKey ? 'pointer' : 'default', userSelect: 'none'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {icon}<h3 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase' }}>{title}</h3>
            </div>
            {sectionKey && (
                <div style={{
                    transform: openSections[sectionKey] ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    fontSize: '1rem', color: 'var(--text-muted)'
                }}>
                    ▼
                </div>
            )}
        </div>
    );

    if (loading || authLoading) {
        return (
            <div className="container" style={{ marginTop: '2rem' }}>
                <Skeleton width="300px" height="32px" style={{ marginBottom: '1rem' }} />
                <Skeleton width="500px" height="20px" style={{ marginBottom: '2rem' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
                </div>
            </div>
        );
    }

    const inp = (field) => ({ className: `neon-input${errors[field] ? ' error' : ''}` });
    const errMsg = (field) => errors[field] ? <span style={{ color: '#ff4444', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{errors[field]}</span> : null;

    return (
        <div>
            <CandidateNavbar subtitle={autoSaving ? 'Salvando...' : 'Salvo'} profilePhoto={formData.foto_url} />

            {toastMsg && <div className="toast success">{toastMsg}</div>}
            {toastError && <div className="toast error">{toastError}</div>}

            <DiscQuizModal 
                isOpen={showDiscQuiz} 
                onClose={() => setShowDiscQuiz(false)} 
                onFinish={(results) => {
                    setFormData(prev => ({ ...prev, perfil_disc: JSON.stringify(results) }));
                    setShowDiscQuiz(false);
                }} 
            />

            <div className="container" style={{ marginTop: '2rem' }}>
                {location.state?.alertCV && (
                    <div className="alert-box">
                        <AlertCircle size={24} color="var(--neon-purple)" />
                        <div>
                            <strong>Currículo Incompleto</strong>
                            <p>Você precisa preencher o seu currículo antes de candidatar.</p>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ color: 'var(--neon-purple)', margin: 0 }}>MEU PERFIL PROFISSIONAL</h2>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Mantenha seus dados atualizados para atrair empresas.</p>
                    </div>
                    <button type="button" onClick={() => navigate('/cv-preview')} className="neon-button secondary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={20} /> VER PDF
                    </button>
                </div>

                <form onSubmit={handleSave} noValidate>
                    {/* FOTO */}
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        {sectionHdr(<Camera size={20} />, 'FOTO DE PERFIL', 'foto')}
                        {openSections.foto && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                <div className="avatar-preview">
                                    {formData.foto_url ? <img src={formData.foto_url} alt="Foto" /> : <User size={40} />}
                                </div>
                                <div>
                                    <p style={{ color: 'var(--neon-purple)', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600 }}>💡 Esta foto também aparecerá no seu menu de navegação.</p>
                                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFotoUpload} style={{ display: 'none' }} />
                                    <button type="button" onClick={() => fileInputRef.current.click()} className="neon-button secondary" style={{ width: 'auto' }} disabled={uploadingFoto}>
                                        {uploadingFoto ? 'ENVIANDO...' : '📷 ESCOLHER FOTO'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* DADOS BÁSICOS */}
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        {sectionHdr(<User size={20} />, 'DADOS BÁSICOS', 'basico')}
                        {openSections.basico && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                                <div className="input-group">
                                    <label>Nome Completo *</label>
                                    <input {...inp('nome')} type="text" value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} />
                                    {errMsg('nome')}
                                </div>
                                <div className="input-group">
                                    <label>Telefone / WhatsApp *</label>
                                    <input {...inp('telefone')} type="tel" value={formData.telefone} onChange={e => setFormData(p => ({ ...p, telefone: maskPhone(e.target.value) }))} />
                                    {errMsg('telefone')}
                                </div>
                                <div className="input-group">
                                    <label>Data de Nascimento *</label>
                                    <input {...inp('dataNascimento')} type="date" style={{ colorScheme: 'dark' }} value={formData.dataNascimento} onChange={e => setFormData(p => ({ ...p, dataNascimento: e.target.value }))} />
                                    {errMsg('dataNascimento')}
                                </div>
                                <div className="input-group">
                                    <label>Bairro *</label>
                                    <input {...inp('bairro')} type="text" value={formData.bairro} onChange={e => setFormData(p => ({ ...p, bairro: e.target.value }))} />
                                    {errMsg('bairro')}
                                </div>
                                <div className="input-group">
                                    <label>Cidade *</label>
                                    <input {...inp('cidade')} type="text" value={formData.cidade} onChange={e => setFormData(p => ({ ...p, cidade: e.target.value }))} />
                                </div>
                                <div className="input-group">
                                    <label>Logradouro/Nº</label>
                                    <input className="neon-input" type="text" value={formData.endereco} onChange={e => setFormData(p => ({ ...p, endereco: e.target.value }))} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RESUMO */}
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        {sectionHdr(<BookOpen size={20} />, 'RESUMO PROFISSIONAL', 'resumo')}
                        {openSections.resumo && (
                            <textarea className="neon-input" style={{ minHeight: '100px' }} value={formData.resumo} onChange={e => setFormData(p => ({ ...p, resumo: e.target.value }))} placeholder="Sua trajetória..." />
                        )}
                    </div>

                    {/* HABILIDADES */}
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        {sectionHdr(<Tag size={20} />, 'HABILIDADES', 'habilidades')}
                        {openSections.habilidades && (
                            <>
                                <input
                                    className="neon-input"
                                    placeholder="Pressione Enter para adicionar..."
                                    value={habilidadeInput}
                                    onChange={e => setHabilidadeInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && habilidadeInput.trim()) {
                                            e.preventDefault();
                                            if (!formData.habilidades.includes(habilidadeInput.trim())) {
                                                setFormData(p => ({ ...p, habilidades: [...p.habilidades, habilidadeInput.trim()] }));
                                            }
                                            setHabilidadeInput('');
                                        }
                                    }}
                                />
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '1rem' }}>
                                    {formData.habilidades.map(h => (
                                        <span key={h} className="glass-panel" style={{
                                            padding: '4px 12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '0.85rem',
                                            background: 'rgba(124, 58, 237, 0.1)',
                                            borderColor: 'rgba(124, 58, 237, 0.3)',
                                            borderRadius: '20px',
                                            color: 'var(--text-main)',
                                            boxShadow: 'none'
                                        }}>
                                            {h}
                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, habilidades: p.habilidades.filter(x => x !== h) }))}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ff4444',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: 0
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* CURSOS */}
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        {sectionHdr(<GraduationCap size={20} />, 'CURSOS PROFISSIONALIZANTES', 'cursos')}
                        {openSections.cursos && (
                            <div>
                                <button type="button" onClick={() => setFormData(p => ({ ...p, cursos_prof: [...p.cursos_prof, { nome: '', instituicao: '', status: 'completo', observacao: '' }] }))} className="neon-button secondary" style={{ width: 'auto', marginBottom: '1rem' }}><Plus size={16} /> ADICIONAR CURSO</button>
                                {formData.cursos_prof.map((c, i) => (
                                    <div key={i} className="form-item">
                                        <div className="grid-form-cursos">
                                            <div className="input-group" style={{ marginBottom: 0 }}><label>Curso</label><input className="neon-input" value={c.nome} onChange={e => { const n = [...formData.cursos_prof]; n[i].nome = e.target.value; setFormData(p => ({ ...p, cursos_prof: n })); }} /></div>
                                            <div className="input-group" style={{ marginBottom: 0 }}><label>Instituição</label><input className="neon-input" value={c.instituicao} onChange={e => { const n = [...formData.cursos_prof]; n[i].instituicao = e.target.value; setFormData(p => ({ ...p, cursos_prof: n })); }} /></div>
                                            <div className="input-group" style={{ marginBottom: 0 }}><label>Status</label><select className="neon-input" value={c.status} onChange={e => { const n = [...formData.cursos_prof]; n[i].status = e.target.value; setFormData(p => ({ ...p, cursos_prof: n })); }}><option value="completo">Completo</option><option value="cursando">Cursando</option></select></div>
                                            <button type="button" onClick={() => setFormData(p => ({ ...p, cursos_prof: p.cursos_prof.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', height: '42px' }}><Trash2 size={20} /></button>
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label>Observações</label>
                                            <textarea 
                                                className="neon-input" 
                                                placeholder="Ex: Focado em ferramentas de escritório, Excel avançado, etc." 
                                                value={c.observacao || ''} 
                                                onChange={e => { 
                                                    const n = [...formData.cursos_prof]; 
                                                    n[i].observacao = e.target.value; 
                                                    setFormData(p => ({ ...p, cursos_prof: n })); 
                                                }} 
                                                style={{ minHeight: '60px', paddingTop: '10px' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ENSINO MÉDIO */}
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        {sectionHdr(<Award size={20} />, 'ENSINO MÉDIO', 'ensinoMedio')}
                        {openSections.ensinoMedio && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                <div className="input-group">
                                    <label>Status</label>
                                    <select className="neon-input" value={formData.ensino_medio.status} onChange={e => setFormData(p => ({ ...p, ensino_medio: { ...p.ensino_medio, status: e.target.value } }))}>
                                        <option value="">Selecione...</option>
                                        <option value="completo">Completo</option>
                                        <option value="cursando">Cursando</option>
                                        <option value="incompleto">Incompleto</option>
                                    </select>
                                </div>
                                {formData.ensino_medio.status === 'cursando' && (
                                    <>
                                        <div className="input-group">
                                            <label>Ano que está cursando</label>
                                            <select className="neon-input" value={formData.ensino_medio.ano_cursando} onChange={e => setFormData(p => ({ ...p, ensino_medio: { ...p.ensino_medio, ano_cursando: e.target.value } }))}>
                                                <option value="">Selecione...</option>
                                                {ANOS_EM.map(a => <option key={a} value={a}>{a}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label>Turno</label>
                                            <select className="neon-input" value={formData.ensino_medio.turno} onChange={e => setFormData(p => ({ ...p, ensino_medio: { ...p.ensino_medio, turno: e.target.value } }))}>
                                                <option value="">Selecione...</option>
                                                {TURNOS.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </>
                                )}
                                {formData.ensino_medio.status === 'completo' && (
                                    <div className="input-group">
                                        <label>Ano de Conclusão</label>
                                        <input className="neon-input" type="number" placeholder="Ex: 2024" value={formData.ensino_medio.ano_conclusao} onChange={e => setFormData(p => ({ ...p, ensino_medio: { ...p.ensino_medio, ano_conclusao: e.target.value } }))} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* FORMAÇÃO ACADÊMICA */}
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        {sectionHdr(<BookOpen size={20} />, 'FORMAÇÃO ACADÊMICA', 'formacao')}
                        {openSections.formacao && (
                            <div>
                                <button type="button" onClick={() => setFormData(p => ({ ...p, formacoes: [...p.formacoes, { instituicao: '', curso: '', status: 'cursando' }] }))} className="neon-button secondary" style={{ width: 'auto', marginBottom: '1rem' }}><Plus size={16} /> ADICIONAR FORMAÇÃO</button>
                                {formData.formacoes.map((f, i) => (
                                    <div key={i} className="form-item">
                                        <div className="grid-form-formacao">
                                            <div className="input-group" style={{ marginBottom: 0 }}><label>Instituição</label><input className="neon-input" value={f.instituicao} onChange={e => { const n = [...formData.formacoes]; n[i].instituicao = e.target.value; setFormData(p => ({ ...p, formacoes: n })); }} /></div>
                                            <div className="input-group" style={{ marginBottom: 0 }}><label>Curso</label><input className="neon-input" value={f.curso} onChange={e => { const n = [...formData.formacoes]; n[i].curso = e.target.value; setFormData(p => ({ ...p, formacoes: n })); }} /></div>
                                            <div className="input-group" style={{ marginBottom: 0 }}><label>Status</label><select className="neon-input" value={f.status} onChange={e => { const n = [...formData.formacoes]; n[i].status = e.target.value; setFormData(p => ({ ...p, formacoes: n })); }}><option value="cursando">Cursando</option><option value="completo">Completo</option></select></div>
                                            <button type="button" onClick={() => setFormData(p => ({ ...p, formacoes: p.formacoes.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', height: '42px' }}><Trash2 size={20} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* EXPERIÊNCIA */}
                    <div className="glass-panel" style={{ marginBottom: '4rem' }}>
                        {sectionHdr(<Briefcase size={20} />, 'EXPERIÊNCIA PROFISSIONAL', 'experiencia')}
                        {openSections.experiencia && (
                            <div>
                                <button type="button" onClick={() => setFormData(p => ({ ...p, experiencias: [...p.experiencias, { empresa: '', cargo: '', atual: false, descricao: '' }] }))} className="neon-button secondary" style={{ width: 'auto', marginBottom: '1rem' }}><Plus size={16} /> ADICIONAR EXPERIÊNCIA</button>
                                {formData.experiencias.map((exp, i) => (
                                    <div key={i} className="form-item">
                                        <div className="grid-form-experiencia">
                                            <div className="input-group" style={{ marginBottom: 0 }}><label>Empresa</label><input className="neon-input" value={exp.empresa} onChange={e => { const n = [...formData.experiencias]; n[i].empresa = e.target.value; setFormData(p => ({ ...p, experiencias: n })); }} /></div>
                                            <div className="input-group" style={{ marginBottom: 0 }}><label>Cargo</label><input className="neon-input" value={exp.cargo} onChange={e => { const n = [...formData.experiencias]; n[i].cargo = e.target.value; setFormData(p => ({ ...p, experiencias: n })); }} /></div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px' }}><input type="checkbox" id={`at-${i}`} checked={exp.atual} onChange={e => { const n = [...formData.experiencias]; n[i].atual = e.target.checked; setFormData(p => ({ ...p, experiencias: n })); }} /><label htmlFor={`at-${i}`} style={{ marginBottom: 0, textTransform: 'none' }}>Atual</label></div>
                                            <button type="button" onClick={() => setFormData(p => ({ ...p, experiencias: p.experiencias.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', height: '42px' }}><Trash2 size={20} /></button>
                                        </div>
                                        <textarea className="neon-input" placeholder="Descreva suas atividades..." value={exp.descricao} onChange={e => { const n = [...formData.experiencias]; n[i].descricao = e.target.value; setFormData(p => ({ ...p, experiencias: n })); }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* TESTE DISC */}
                    <div className="glass-panel" style={{ marginBottom: '4rem' }}>
                        {sectionHdr(<Brain size={20} />, 'PERFIL COMPORTAMENTAL (DISC)', 'disc')}
                        {openSections.disc && (
                            <div style={{ padding: '10px 0' }}>
                                {!formData.perfil_disc || !formData.perfil_disc.startsWith('{') ? (
                                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                                        <div style={{ display: 'inline-flex', padding: '15px', background: 'rgba(124,58,237,0.1)', borderRadius: '50%', marginBottom: '1.5rem', color: 'var(--neon-purple)' }}>
                                            <Brain size={40} />
                                        </div>
                                        <h4 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '1rem' }}>DESCUBRA SEU PERFIL</h4>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '400px', marginInline: 'auto' }}>
                                            Responda ao nosso questionário rápido para descobrir suas principais tendências comportamentais e atrair as empresas certas.
                                        </p>
                                        <button type="button" onClick={() => setShowDiscQuiz(true)} className="neon-button" style={{ width: 'auto', padding: '12px 30px' }}>
                                            INICIAR TESTE COMPORTAMENTAL
                                        </button>
                                    </div>
                                ) : (() => {
                                    const res = JSON.parse(formData.perfil_disc);
                                    const sorted = Object.entries(res).sort((a,b) => b[1] - a[1]);
                                    const dominant = sorted[0][0];

                                    return (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
                                            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(124,58,237,0.05)', borderRadius: '15px' }}>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', fontWeight: 700 }}>Perfil Dominante</p>
                                                <h4 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--neon-purple)', margin: 0 }}>{dominant.toUpperCase()}</h4>
                                                <button type="button" onClick={() => setShowDiscQuiz(true)} style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', marginInline: 'auto' }}>
                                                    <RefreshCw size={14} /> REFAZER TESTE
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                {sorted.map(([type, value]) => (
                                                    <div key={type}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 800 }}>
                                                            <span>{type}</span>
                                                            <span style={{ color: value > 40 ? 'var(--neon-purple)' : 'var(--text-muted)' }}>{value}%</span>
                                                        </div>
                                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{ 
                                                                width: `${value}%`, 
                                                                height: '100%', 
                                                                background: type === dominant ? 'var(--neon-purple)' : 'rgba(255,255,255,0.2)',
                                                                boxShadow: type === dominant ? '0 0 10px rgba(124,58,237,0.5)' : 'none',
                                                                transition: 'width 1s ease-out' 
                                                            }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>


                    {/* BOTÃO SALVAR FIXO */}
                    <div className="fab-container">
                        <button type="submit" className="neon-button" style={{ display: 'flex', gap: '10px', background: '#000', color: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', width: 'auto', padding: '15px 30px', borderRadius: '30px' }} disabled={saving}>
                            <Save size={20} /> {saving ? 'GRAVANDO...' : 'SALVAR CURRÍCULO'}
                        </button>
                    </div>
                </form>

                <div style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.6, fontSize: '0.85rem' }}>
                    <p>© 2026 Talentos Futuro do Trabalho - Todos os direitos reservados</p>
                </div>
            </div>

            <style>{`
                .form-item { background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.05); }
                .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); padding: 12px 24px; borderRadius: 8px; zIndex: 9999; fontWeight: bold; animation: fadeIn 0.3s ease; }
                .toast.success { background: #22c55e; color: #fff; }
                .toast.error { background: #ef4444; color: #fff; }
                .avatar-preview { width: 100px; height: 100px; border-radius: 50%; overflow: hidden; border: 3px solid #7c3aed; background: #1a1a1a; display: flex; alignItems: center; justifyContent: center; flex-shrink: 0; }
                .avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
                .alert-box { background: rgba(124,58,237,0.1); border: 1px solid var(--neon-purple); padding: 1rem; border-radius: 12px; margin-bottom: 2rem; display: flex; gap: 1rem; }
            `}</style>
        </div>
    );
}
