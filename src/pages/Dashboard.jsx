import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Save, User, LogOut, Plus, Trash2, BookOpen, Briefcase, Camera, Award, MapPin, Tag, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CURSOS_POR_CATEGORIA } from '../data/cursos';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import Navbar from '../components/layout/Navbar';

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
};

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingFoto, setUploadingFoto] = useState(false);
    const [errors, setErrors] = useState({});
    const [toastMsg, setToastMsg] = useState('');
    const [toastError, setToastError] = useState('');
    const [habilidadeInput, setHabilidadeInput] = useState('');
    const [cursosSearch, setCursosSearch] = useState('');
    const [openSections, setOpenSections] = useState({
        foto: true,
        basico: true,
        resumo: false,
        habilidades: false,
        cursos: false,
        ensinoMedio: false,
        formacao: false,
        cnh: false,
        experiencia: false
    });
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const fileInputRef = useRef();

    const [formData, setFormData] = useState(EMPTY_FORM);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({ ...prev, email: user.email }));
            fetchCurriculo(user.id);
        }
    }, [user]);

    const fetchCurriculo = async (userId) => {
        try {
            const { data } = await supabase.from('curriculos').select('*').eq('user_id', userId).single();
            if (data) {
                const cnhRaw = data.cnh || {};
                const emRaw = data.ensino_medio || {};
                setFormData({
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
                    cursos_prof: Array.isArray(data.cursos_prof) ? data.cursos_prof : [],
                    experiencias: Array.isArray(data.experiencias) ? data.experiencias : [],
                    formacoes: Array.isArray(data.formacoes) ? data.formacoes : [],
                    ensino_medio: { status: emRaw.status || '', ano_cursando: emRaw.ano_cursando || '', turno: emRaw.turno || '', ano_conclusao: emRaw.ano_conclusao || '' },
                    cnh: { possui: cnhRaw.possui === true, categorias: Array.isArray(cnhRaw.categorias) ? cnhRaw.categorias : [] },
                });
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleFotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingFoto(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `${user.id}/avatar.${ext}`;
            const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
            if (error) throw error;
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
        if (!formData.bairro.trim()) e.bairro = 'Bairro obrigatório (necessário para o CV)';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        if (!user) return;
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
                updated_at: new Date().toISOString(),
            };
            const { error } = await supabase.from('curriculos').upsert(payload, { onConflict: 'user_id' }).select();
            if (error) throw error;
            setToastMsg('Currículo salvo com sucesso!');
            setTimeout(() => setToastMsg(''), 3500);
        } catch (err) {
            setToastError(`Erro ao salvar: ${err.message}`);
            setTimeout(() => setToastError(''), 3500);
        }
        finally { setSaving(false); }
    };

    const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

    // Habilidades chip
    const addHabilidade = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && habilidadeInput.trim()) {
            e.preventDefault();
            const nova = habilidadeInput.trim().replace(/,$/, '');
            if (!formData.habilidades.includes(nova)) {
                setFormData(prev => ({ ...prev, habilidades: [...prev.habilidades, nova] }));
            }
            setHabilidadeInput('');
        }
    };
    const removeHabilidade = (h) => setFormData(prev => ({ ...prev, habilidades: prev.habilidades.filter(x => x !== h) }));

    // Cursos profissionalizantes
    // Cursos profissionalizantes estruturados
    const addCurso = (nome) => {
        const jaExiste = formData.cursos_prof.some(c => c.nome === nome);
        if (jaExiste) return;
        setFormData(prev => ({
            ...prev,
            cursos_prof: [...prev.cursos_prof, { nome, instituicao: '', status: 'completo', observacao: '' }]
        }));
    };
    const removeCurso = (nome) => setFormData(prev => ({ ...prev, cursos_prof: prev.cursos_prof.filter(c => c.nome !== nome) }));
    const updateCurso = (nome, field, value) => {
        setFormData(prev => ({
            ...prev,
            cursos_prof: prev.cursos_prof.map(c => c.nome === nome ? { ...c, [field]: value } : c)
        }));
    };

    // Experiências
    const addExp = () => setFormData(prev => ({ ...prev, experiencias: [...prev.experiencias, { empresa: '', cargo: '', inicio: '', fim: '', atual: false, descricao: '' }] }));
    const removeExp = (i) => setFormData(prev => ({ ...prev, experiencias: prev.experiencias.filter((_, idx) => idx !== i) }));
    const updateExp = (i, f, v) => { const a = [...formData.experiencias]; a[i][f] = v; setFormData(prev => ({ ...prev, experiencias: a })); };

    // Formações
    const addForm = () => setFormData(prev => ({ ...prev, formacoes: [...prev.formacoes, { instituicao: '', curso: '', status: 'cursando', semestre: '', turno: '', inicio: '', fim: '' }] }));
    const removeForm = (i) => setFormData(prev => ({ ...prev, formacoes: prev.formacoes.filter((_, idx) => idx !== i) }));
    const updateForm = (i, f, v) => { const a = [...formData.formacoes]; a[i][f] = v; setFormData(prev => ({ ...prev, formacoes: a })); };

    const toggleCnh = (cat) => {
        const cats = formData.cnh.categorias.includes(cat)
            ? formData.cnh.categorias.filter(c => c !== cat)
            : [...formData.cnh.categorias, cat];
        setFormData(prev => ({ ...prev, cnh: { ...prev.cnh, categorias: cats } }));
    };

    const cursosVisiveis = useMemo(() => {
        return Object.entries(CURSOS_POR_CATEGORIA).reduce((acc, [cat, lista]) => {
            const filtrado = cursosSearch.trim()
                ? lista.filter(c => c.toLowerCase().includes(cursosSearch.toLowerCase()))
                : lista;
            if (filtrado.length) acc[cat] = filtrado;
            return acc;
        }, {});
    }, [cursosSearch]);

    if (loading || authLoading) {
        return (
            <div className="container" style={{ marginTop: '2rem' }}>
                <Skeleton width="300px" height="32px" style={{ marginBottom: '1rem' }} />
                <Skeleton width="500px" height="20px" style={{ marginBottom: '2rem' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        );
    }

    const inp = (field) => ({
        className: `neon-input${errors[field] ? ' error' : ''}`,
        style: { border: errors[field] ? '1px solid #ff4444' : undefined }
    });
    const errMsg = (field) => errors[field]
        ? <span style={{ color: '#ff4444', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{errors[field]}</span>
        : null;

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

    const g0 = { marginBottom: 0 };

    return (
        <div>
            <Navbar icon={<User size={24} />} title="PORTAL DE CURRÍCULOS">
                <button onClick={() => navigate('/vagas')} className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', width: 'auto' }}>VAGAS</button>
                <button onClick={() => navigate('/cv-preview')} className="neon-button" style={{ margin: 0, padding: '8px 16px', width: 'auto', background: 'var(--neon-purple)', color: '#fff' }}>CURRÍCULO</button>
                <button onClick={handleLogout} className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', width: 'auto' }}><LogOut size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> SAIR</button>
            </Navbar>

            {/* TOAST NOTIFICATION DE SUCESSO */}
            {toastMsg && (
                <div style={{
                    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(34, 197, 94, 0.95)', color: '#fff', padding: '12px 24px',
                    borderRadius: '8px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '1px solid #22c55e',
                    fontWeight: 'bold', animation: 'fadeIn 0.3s ease-out'
                }}>
                    <Save size={18} /> {toastMsg}
                </div>
            )}

            {/* TOAST NOTIFICATION DE ERRO */}
            {toastError && (
                <div style={{
                    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(239, 68, 68, 0.95)', color: '#fff', padding: '12px 24px',
                    borderRadius: '8px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '1px solid #ef4444',
                    fontWeight: 'bold', animation: 'fadeIn 0.3s ease-out'
                }}>
                    {toastError}
                </div>
            )}

            <div className="container" style={{ marginTop: '2rem' }}>
                <h2 style={{ color: 'var(--neon-purple)', marginBottom: '0.5rem' }}>MEU PERFIL PROFISSIONAL</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Mantenha seus dados atualizados para que as empresas possam te encontrar.</p>

                <form onSubmit={handleSave} noValidate>

                    {/* FOTO */}
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        {sectionHdr(<Camera size={20} />, 'FOTO DE PERFIL', 'foto')}
                        {openSections.foto && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #7c3aed', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {formData.foto_url ? <img src={formData.foto_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} color="#9ca3af" />}
                                </div>
                                <div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Esta foto aparece no PDF do currículo.</p>
                                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFotoUpload} style={{ display: 'none' }} />
                                    <button type="button" onClick={() => fileInputRef.current.click()} className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', width: 'auto' }} disabled={uploadingFoto}>
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
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                                    <div className="input-group" style={g0}>
                                        <label>Nome Completo *</label>
                                        <input {...inp('nome')} type="text" value={formData.nome} onChange={e => { setFormData(p => ({ ...p, nome: e.target.value })); setErrors(p => ({ ...p, nome: '' })); }} />
                                        {errMsg('nome')}
                                    </div>
                                    <div className="input-group" style={g0}>
                                        <label>Data de Nascimento *</label>
                                        <input {...inp('dataNascimento')} type="date" style={{ colorScheme: 'dark', border: errors.dataNascimento ? '1px solid #ff4444' : undefined }} value={formData.dataNascimento} onChange={e => { setFormData(p => ({ ...p, dataNascimento: e.target.value })); if (errors.dataNascimento) setErrors(p => ({ ...p, dataNascimento: '' })); }} />
                                        {errMsg('dataNascimento')}
                                    </div>
                                    <div className="input-group" style={g0}>
                                        <label>E-mail *</label>
                                        <input {...inp('email')} type="email" inputMode="email" value={formData.email} onChange={e => { setFormData(p => ({ ...p, email: e.target.value })); if (errors.email) setErrors(p => ({ ...p, email: '' })); }} />
                                        {errMsg('email')}
                                    </div>
                                    <div className="input-group" style={g0}>
                                        <label>Telefone / WhatsApp *</label>
                                        <input {...inp('telefone')} type="tel" inputMode="numeric" placeholder="(00) 00000-0000" value={formData.telefone}
                                            onChange={e => { setFormData(p => ({ ...p, telefone: maskPhone(e.target.value) })); if (errors.telefone) setErrors(p => ({ ...p, telefone: '' })); }} />
                                        {errMsg('telefone')}
                                    </div>
                                    <div className="input-group" style={g0}>
                                        <label>Cidade *</label>
                                        <input {...inp('cidade')} type="text" placeholder="Ex: São Paulo - SP" value={formData.cidade} onChange={e => setFormData(p => ({ ...p, cidade: e.target.value }))} />
                                    </div>
                                    <div className="input-group" style={g0}>
                                        <label>Logradouro (Rua/Av) *</label>
                                        <input {...inp('endereco')} type="text" placeholder="Rua Nome da Rua" value={formData.endereco} onChange={e => setFormData(p => ({ ...p, endereco: e.target.value }))} />
                                    </div>
                                    <div className="input-group" style={g0}>
                                        <label>Bairro * (Aparece no CV)</label>
                                        <input {...inp('bairro')} type="text" placeholder="Ex: Centro" value={formData.bairro} onChange={e => setFormData(p => ({ ...p, bairro: e.target.value }))} />
                                    </div>
                                    <div className="input-group" style={g0}>
                                        <label>Número *</label>
                                        <input {...inp('numero')} type="text" placeholder="123" value={formData.numero} onChange={e => setFormData(p => ({ ...p, numero: e.target.value }))} />
                                    </div>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1rem' }}>
                                    💡 <strong>Privacidade:</strong> Apenas o <b>Bairro</b> e a <b>Cidade</b> serão exibidos para as empresas e no seu currículo.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* RESUMO */}
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        {sectionHdr(<BookOpen size={20} />, 'RESUMO PROFISSIONAL', 'resumo')}
                        {openSections.resumo && (
                            <div className="input-group" style={{ ...g0, animation: 'fadeIn 0.3s ease' }}>
                                <textarea className="neon-input" style={{ minHeight: '110px', resize: 'vertical' }} value={formData.resumo} onChange={e => setFormData(p => ({ ...p, resumo: e.target.value }))} placeholder="Conte sobre sua trajetória e objetivos..." />
                            </div>
                        )}
                    </div>

                    {/* HABILIDADES */}
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        {sectionHdr(<Tag size={20} />, 'HABILIDADES', 'habilidades')}
                        {openSections.habilidades && (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Digite uma habilidade e pressione Enter para adicionar.</p>
                                <input className="neon-input" placeholder="Ex: React, Excel, Atendimento..." value={habilidadeInput}
                                    onChange={e => setHabilidadeInput(e.target.value)} onKeyDown={addHabilidade} />
                                {formData.habilidades.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                                        {formData.habilidades.map(h => (
                                            <span key={h} onClick={() => removeHabilidade(h)} style={{ background: 'rgba(0,240,255,0.12)', border: '1px solid rgba(0,240,255,0.3)', color: 'var(--neon-blue)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                                                {h} ✕
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* CURSOS PROFISSIONALIZANTES */}
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        {sectionHdr(<GraduationCap size={20} />, 'CURSOS PROFISSIONALIZANTES', 'cursos')}
                        {openSections.cursos && (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                                        {formData.cursos_prof.length > 0 ? <strong style={{ color: 'var(--neon-blue)' }}>{formData.cursos_prof.length} selecionado(s)</strong> : 'Selecione os cursos que você realizou.'}
                                    </p>
                                    <input className="neon-input" style={{ width: '260px' }} placeholder="🔍 Filtrar cursos..." value={cursosSearch} onChange={e => setCursosSearch(e.target.value)} />
                                </div>

                                {/* Cursos selecionados com formulário detalhado */}
                                {formData.cursos_prof.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                        {formData.cursos_prof.map((c, idx) => (
                                            <div key={idx} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '1.25rem', borderRadius: '8px', position: 'relative' }}>
                                                <button type="button" onClick={() => removeCurso(c.nome)} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                <h4 style={{ color: '#7c3aed', marginBottom: '1rem', marginTop: 0 }}>{c.nome}</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                                        <label>Instituição</label>
                                                        <input className="neon-input" placeholder="Ex: Senai, Udemy, Escola..." value={c.instituicao} onChange={e => updateCurso(c.nome, 'instituicao', e.target.value)} />
                                                    </div>
                                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                                        <label>Status</label>
                                                        <select className="neon-input" value={c.status} onChange={e => updateCurso(c.nome, 'status', e.target.value)}>
                                                            <option value="completo">Completo</option>
                                                            <option value="cursando">Cursando</option>
                                                        </select>
                                                    </div>
                                                    <div className="input-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                                                        <label>Observações (Opcional)</label>
                                                        <input className="neon-input" placeholder="Ex: Ênfase em gestão..." value={c.observacao} onChange={e => updateCurso(c.nome, 'observacao', e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Categorias */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {Object.entries(cursosVisiveis).map(([categoria, lista]) => (
                                        <div key={categoria}>
                                            <p style={{ color: 'var(--neon-purple)', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>{categoria}</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                {lista.map(curso => {
                                                    const sel = formData.cursos_prof.includes(curso);
                                                    return (
                                                        <span key={curso} onClick={() => addCurso(curso)} style={{
                                                            padding: '5px 13px', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s ease',
                                                            background: sel ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.05)',
                                                            border: sel ? '1px solid rgba(0,240,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                                                            color: sel ? 'var(--neon-blue)' : 'var(--text-muted)',
                                                            fontWeight: sel ? '600' : '400',
                                                        }}>
                                                            {sel ? '✓ ' : ''}{curso}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    {Object.keys(cursosVisiveis).length === 0 && (
                                        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Nenhum curso encontrado para "{cursosSearch}".</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ENSINO MÉDIO */}
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        {sectionHdr(<BookOpen size={20} />, 'ENSINO MÉDIO', 'ensinoMedio')}
                        {openSections.ensinoMedio && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
                                <div className="input-group" style={g0}>
                                    <label>Status</label>
                                    <select className="neon-input" value={formData.ensino_medio.status} onChange={e => setFormData(p => ({ ...p, ensino_medio: { ...p.ensino_medio, status: e.target.value } }))}>
                                        <option value="">Selecione...</option>
                                        <option value="cursando">Cursando</option>
                                        <option value="completo">Completo</option>
                                    </select>
                                </div>
                                {formData.ensino_medio.status === 'cursando' && (<>
                                    <div className="input-group" style={g0}>
                                        <label>Ano Atual</label>
                                        <select className="neon-input" value={formData.ensino_medio.ano_cursando} onChange={e => setFormData(p => ({ ...p, ensino_medio: { ...p.ensino_medio, ano_cursando: e.target.value } }))}>
                                            <option value="">Selecione...</option>
                                            {ANOS_EM.map(a => <option key={a}>{a}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group" style={g0}>
                                        <label>Turno</label>
                                        <select className="neon-input" value={formData.ensino_medio.turno} onChange={e => setFormData(p => ({ ...p, ensino_medio: { ...p.ensino_medio, turno: e.target.value } }))}>
                                            <option value="">Selecione...</option>
                                            {TURNOS.map(t => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </>)}
                                {formData.ensino_medio.status === 'completo' && (
                                    <div className="input-group" style={g0}>
                                        <label>Ano de Conclusão</label>
                                        <input type="number" className="neon-input" placeholder="Ex: 2022" min="1990" max="2099" value={formData.ensino_medio.ano_conclusao} onChange={e => setFormData(p => ({ ...p, ensino_medio: { ...p.ensino_medio, ano_conclusao: e.target.value } }))} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* FORMAÇÃO ACADÊMICA */}
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        <div
                            onClick={() => toggleSection('formacao')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,240,255,0.2)', paddingBottom: '10px', marginBottom: openSections.formacao ? '20px' : '0', cursor: 'pointer', userSelect: 'none' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neon-blue)' }}><BookOpen size={20} /><h3 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase' }}>FORMAÇÃO ACADÊMICA</h3></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                {openSections.formacao && <button type="button" onClick={(e) => { e.stopPropagation(); addForm(); }} className="neon-button" style={{ margin: 0, padding: '5px 15px', width: 'auto', fontSize: '0.8rem' }}><Plus size={14} /> ADICIONAR</button>}
                                <div style={{ color: 'var(--text-muted)', transform: openSections.formacao ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', fontSize: '1rem' }}>▼</div>
                            </div>
                        </div>
                        {openSections.formacao && (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                {formData.formacoes.map((f, i) => (
                                    <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '4px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="button" onClick={() => removeForm(i)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}><Trash2 size={18} /></button></div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                            <div className="input-group" style={g0}><label>Instituição</label><input className="neon-input" value={f.instituicao} onChange={e => updateForm(i, 'instituicao', e.target.value)} /></div>
                                            <div className="input-group" style={g0}><label>Curso</label><input className="neon-input" value={f.curso} onChange={e => updateForm(i, 'curso', e.target.value)} /></div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '1rem' }}>
                                            <div className="input-group" style={g0}>
                                                <label>Status</label>
                                                <select className="neon-input" value={f.status || 'cursando'} onChange={e => updateForm(i, 'status', e.target.value)}>
                                                    <option value="cursando">Cursando</option>
                                                    <option value="trancado">Trancado</option>
                                                    <option value="completo">Completo</option>
                                                </select>
                                            </div>
                                            {f.status === 'cursando' && (<>
                                                <div className="input-group" style={g0}><label>Semestre</label><select className="neon-input" value={f.semestre || ''} onChange={e => updateForm(i, 'semestre', e.target.value)}><option value="">Selecione...</option>{SEMESTRES.map(s => <option key={s}>{s}</option>)}</select></div>
                                                <div className="input-group" style={g0}><label>Turno</label><select className="neon-input" value={f.turno || ''} onChange={e => updateForm(i, 'turno', e.target.value)}><option value="">Selecione...</option>{TURNOS.map(t => <option key={t}>{t}</option>)}</select></div>
                                            </>)}
                                            {(f.status === 'trancado' || f.status === 'completo') && (<>
                                                <div className="input-group" style={g0}><label>Data Início</label><input type="date" className="neon-input" style={{ colorScheme: 'dark' }} value={f.inicio || ''} onChange={e => updateForm(i, 'inicio', e.target.value)} /></div>
                                                <div className="input-group" style={g0}><label>Data Fim</label><input type="date" className="neon-input" style={{ colorScheme: 'dark' }} value={f.fim || ''} onChange={e => updateForm(i, 'fim', e.target.value)} /></div>
                                            </>)}
                                        </div>
                                    </div>
                                ))}
                                {formData.formacoes.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem' }}>Nenhuma formação adicionada.</p>}
                            </div>
                        )}
                    </div>

                    {/* CNH */}
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        {sectionHdr(<Award size={20} />, 'CARTEIRA DE MOTORISTA (CNH)', 'cnh')}
                        {openSections.cnh && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ display: 'flex', gap: '1.5rem' }}>
                                    <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', textTransform: 'none', fontSize: '1rem' }}>
                                        <input type="radio" name="cnh" checked={!formData.cnh.possui} onChange={() => setFormData(p => ({ ...p, cnh: { possui: false, categorias: [] } }))} /> Não possuo CNH
                                    </label>
                                    <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', textTransform: 'none', fontSize: '1rem' }}>
                                        <input type="radio" name="cnh" checked={formData.cnh.possui} onChange={() => setFormData(p => ({ ...p, cnh: { ...p.cnh, possui: true } }))} /> Possuo CNH
                                    </label>
                                </div>
                                {formData.cnh.possui && (
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', alignSelf: 'center' }}>Categoria:</span>
                                        {CNH_CATS.map(cat => (
                                            <label key={cat} style={{ display: 'flex', gap: '6px', cursor: 'pointer', textTransform: 'none', fontSize: '1rem' }}>
                                                <input type="checkbox" checked={formData.cnh.categorias.includes(cat)} onChange={() => toggleCnh(cat)} /> {cat}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* EXPERIÊNCIA */}
                    <div className="glass-panel" style={{ marginBottom: '4rem' }}>
                        <div
                            onClick={() => toggleSection('experiencia')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,240,255,0.2)', paddingBottom: '10px', marginBottom: openSections.experiencia ? '20px' : '0', cursor: 'pointer', userSelect: 'none' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neon-blue)' }}><Briefcase size={20} /><h3 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase' }}>EXPERIÊNCIA PROFISSIONAL</h3></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                {openSections.experiencia && <button type="button" onClick={(e) => { e.stopPropagation(); addExp(); }} className="neon-button" style={{ margin: 0, padding: '5px 15px', width: 'auto', fontSize: '0.8rem' }}><Plus size={14} /> ADICIONAR</button>}
                                <div style={{ color: 'var(--text-muted)', transform: openSections.experiencia ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', fontSize: '1rem' }}>▼</div>
                            </div>
                        </div>
                        {openSections.experiencia && (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                {formData.experiencias.map((exp, i) => (
                                    <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '4px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="button" onClick={() => removeExp(i)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}><Trash2 size={18} /></button></div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className="input-group" style={g0}><label>Empresa</label><input className="neon-input" value={exp.empresa} onChange={e => updateExp(i, 'empresa', e.target.value)} /></div>
                                            <div className="input-group" style={g0}><label>Cargo</label><input className="neon-input" value={exp.cargo} onChange={e => updateExp(i, 'cargo', e.target.value)} /></div>
                                            <div className="input-group" style={g0}><label>Data Início</label><input type="date" className="neon-input" style={{ colorScheme: 'dark' }} value={exp.inicio} onChange={e => updateExp(i, 'inicio', e.target.value)} /></div>
                                            <div className="input-group" style={g0}><label>Data Fim</label><input type="date" className="neon-input" style={{ colorScheme: 'dark' }} value={exp.fim} onChange={e => updateExp(i, 'fim', e.target.value)} disabled={exp.atual} /></div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '1rem 0' }}>
                                            <input type="checkbox" id={`atual-${i}`} checked={exp.atual} onChange={e => updateExp(i, 'atual', e.target.checked)} />
                                            <label htmlFor={`atual-${i}`} style={{ marginBottom: 0, textTransform: 'none', fontSize: '1rem' }}>Trabalho atualmente aqui</label>
                                        </div>
                                        <div className="input-group" style={g0}><label>Principais Atividades</label><textarea className="neon-input" style={{ minHeight: '80px' }} value={exp.descricao} onChange={e => updateExp(i, 'descricao', e.target.value)} /></div>
                                    </div>
                                ))}
                                {formData.experiencias.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem' }}>Nenhuma experiência adicionada.</p>}
                            </div>
                        )}
                    </div>

                    {/* SALVAR */}
                    <div className="fab-container">
                        <button type="submit" className="neon-button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#000', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', marginTop: 0 }} disabled={saving}>
                            <Save size={20} /> {saving ? 'GRAVANDO...' : 'SALVAR TODO O CURRÍCULO'}
                        </button>
                    </div>
                </form>

                {/* ZONA DE PERIGO + LEGAL + PORTABILIDADE */}
                <div style={{ marginTop: '4rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button onClick={() => navigate('/legal')} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 20px', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', transition: 'all 0.2s' }}>
                        ⚖️ Central Legal — Termos, Privacidade, Cookies e Políticas
                    </button>

                    {/* Exportação de Dados — Portabilidade LGPD */}
                    <div style={{ border: '1px solid #bfdbfe', borderRadius: '8px', padding: '1.25rem', background: 'rgba(59,130,246,0.03)' }}>
                        <h4 style={{ color: '#2563eb', margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>📦 Meus Dados — Portabilidade LGPD</h4>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1rem' }}>
                            Você tem o direito de baixar uma cópia completa de todos os seus dados armazenados na plataforma: currículo, candidaturas e registros de consentimento.
                        </p>
                        <button
                            onClick={async () => {
                                try {
                                    const { data: curriculo } = await supabase.from('curriculos').select('*').eq('user_id', user.id).single();
                                    const { data: candidaturas } = await supabase.from('candidaturas').select('*, vagas(titulo, empresas(razao_social))').eq('user_id', user.id);
                                    const { data: consentimentos } = await supabase.from('consent_logs').select('*').eq('user_id', user.id);

                                    const exportData = {
                                        exportado_em: new Date().toISOString(),
                                        plataforma: 'Talentos Futuro do Trabalho',
                                        usuario: {
                                            id: user.id,
                                            email: user.email,
                                        },
                                        curriculo: curriculo || 'Nenhum currículo cadastrado',
                                        candidaturas: candidaturas || [],
                                        registros_consentimento: consentimentos || [],
                                    };

                                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `meus-dados-${new Date().toISOString().slice(0,10)}.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                } catch (err) {
                                    alert('Erro ao exportar dados: ' + err.message);
                                }
                            }}
                            style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid #93c5fd', color: '#2563eb', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }}
                        >
                            📥 Baixar Todos os Meus Dados (JSON)
                        </button>
                    </div>

                    <div style={{ border: '1px solid #fee2e2', borderRadius: '8px', padding: '1.25rem' }}>
                        <h4 style={{ color: '#dc2626', margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>Zona de Risco — Exclusão de Conta</h4>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1rem' }}>
                            Ao excluir sua conta, todos os seus dados (currículo, foto, candidaturas) serão apagados permanentemente. Esta ação é irreversível, conforme o Direito ao Esquecimento da LGPD.
                        </p>
                        <button
                            onClick={async () => {
                                const confirmado = window.confirm('⚠️ ATENÇÃO: Todos os seus dados serão apagados permanentemente.\n\nEsta ação NÃO pode ser desfeita.\n\nDeseja continuar?');
                                if (!confirmado) return;
                                try {
                                    // Log de Auditoria LGPD antes de apagar tudo
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
                            }}
                            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }}
                        >
                            🗑️ Excluir Minha Conta Permanentemente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
