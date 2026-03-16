import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Building, LogOut, Plus, Search, FileText, Briefcase, Users, X, ExternalLink, MapPin, DollarSign, Filter } from 'lucide-react';
import { TODOS_OS_CURSOS } from '../data/cursos';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import Navbar from '../components/layout/Navbar';

const MODALIDADES = ['presencial', 'hibrido', 'remoto'];
const LABEL_MODAL = { presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' };
const STATUS_CAND = ['pendente', 'em_analise', 'aprovado', 'recusado'];
const LABEL_STATUS = { pendente: '⏳ Pendente', em_analise: '🔍 Em análise', aprovado: '✅ Aprovado', recusado: '❌ Recusado' };
const COR_STATUS = { pendente: 'rgba(255,193,7,0.15)', em_analise: 'rgba(0,240,255,0.1)', aprovado: 'rgba(34,197,94,0.15)', recusado: 'rgba(255,68,68,0.15)' };
const NIVEL_FORM = ['Qualquer', 'Superior Cursando', 'Superior Completo', 'Ensino Médio'];

// Calcula idade a partir de data_nascimento
function calcIdade(dt) {
    if (!dt) return null;
    const hoje = new Date(); const n = new Date(dt);
    let idade = hoje.getFullYear() - n.getFullYear();
    const m = hoje.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) idade--;
    return idade;
}

export default function EmpresaDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [empresa, setEmpresa] = useState(null);
    const [activeTab, setActiveTab] = useState('vagas');

    // Vagas
    const [showVagaForm, setShowVagaForm] = useState(false);
    const [newVaga, setNewVaga] = useState({ titulo: '', descricao: '', requisitos: '', modalidade: '', cidade: '', salario_min: '', salario_max: '' });
    const [vagas, setVagas] = useState([]);

    // Talentos
    const [talentos, setTalentos] = useState([]);
    const [filtros, setFiltros] = useState({ nome: '', idadeMin: '', idadeMax: '', cursos: ['', '', ''], nivelFormacao: 'Qualquer', cidade: '', habilidade: '' });
    const [showFiltros, setShowFiltros] = useState(false);

    // Perfil empresa
    const [perfilForm, setPerfilForm] = useState({ razao_social: '', cnpj: '', descricao_empresa: '' });

    // Modal candidatos
    const [modalCandidatos, setModalCandidatos] = useState(null);
    const [loadingCandidatos, setLoadingCandidatos] = useState(false);
    const [vagaToClose, setVagaToClose] = useState(null);

    useEffect(() => { if (user) checkEmpresaPerfil(); }, [user]);
    useEffect(() => { if (activeTab === 'talentos') fetchTalentos(); }, [activeTab]);

    const checkEmpresaPerfil = async () => {
        setLoading(true);
        try {
            const { data } = await supabase.from('empresas').select('*').eq('user_id', user.id).single();
            if (data) { setEmpresa(data); fetchVagas(data.id); }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchVagas = async (empresaId) => {
        const { data } = await supabase
            .from('vagas')
            .select('*, candidaturas(count)')
            .eq('empresa_id', empresaId)
            .order('created_at', { ascending: false });
        setVagas(data || []);
    };

    const fetchTalentos = async () => {
        const { data } = await supabase.from('curriculos').select('user_id, nome, email, telefone, cidade, bairro, data_nascimento, habilidades, cursos_prof, formacoes, ensino_medio');
        setTalentos(data || []);
    };

    const handleSubmitEmpresa = async (e) => {
        e.preventDefault();
        const { data, error } = await supabase.from('empresas').insert([{ ...perfilForm, user_id: user.id }]).select().single();
        if (!error) { setEmpresa(data); fetchVagas(data.id); }
    };

    const handlePublicarVaga = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('vagas').insert([{ ...newVaga, empresa_id: empresa.id, status: 'aberta', salario_min: newVaga.salario_min || null, salario_max: newVaga.salario_max || null }]);
        if (!error) { setShowVagaForm(false); setNewVaga({ titulo: '', descricao: '', requisitos: '', modalidade: '', cidade: '', salario_min: '', salario_max: '' }); fetchVagas(empresa.id); }
    };

    const handleFecharVaga = (vagaId) => {
        setVagaToClose(vagaId);
    };

    const confirmFecharVaga = async () => {
        if (!vagaToClose) return;
        await supabase.from('vagas').update({ status: 'fechada' }).eq('id', vagaToClose);
        setVagas(prev => prev.map(v => v.id === vagaToClose ? { ...v, status: 'fechada' } : v));
        setVagaToClose(null);
    };

    const handleVerCandidatos = async (vaga) => {
        setLoadingCandidatos(true);
        setModalCandidatos({ vaga, candidatos: [] });
        try {
            // 1. Busca as candidaturas
            const { data: cands, error: candsError } = await supabase
                .from('candidaturas')
                .select('user_id, created_at, status')
                .eq('vaga_id', vaga.id)
                .order('created_at', { ascending: false });

            if (candsError) throw candsError;

            let mergedCandidatos = [];

            if (cands && cands.length > 0) {
                // 2. Extrai os IDs dos usuários
                const userIds = cands.map(c => c.user_id);

                // 3. Busca os currículos correspondentes
                const { data: cvs, error: cvsError } = await supabase
                    .from('curriculos')
                    .select('user_id, nome, email, telefone, bairro, cidade')
                    .in('user_id', userIds);

                if (cvsError) throw cvsError;

                // 4. Junta os dados manualmente
                mergedCandidatos = cands.map(cand => ({
                    ...cand,
                    curriculos: cvs?.find(cv => cv.user_id === cand.user_id) || null
                }));
            }

            setModalCandidatos({ vaga, candidatos: mergedCandidatos });
        } catch (err) {
            console.error("Exceção capturada:", err);
            alert("Erro ao buscar candidatos: " + err.message);
        }
        finally { setLoadingCandidatos(false); }
    };

    const handleStatusCandidatura = async (userId, vagaId, novoStatus) => {
        await supabase.from('candidaturas').update({ status: novoStatus }).eq('user_id', userId).eq('vaga_id', vagaId);
        setModalCandidatos(prev => ({
            ...prev,
            candidatos: prev.candidatos.map(c => c.user_id === userId ? { ...c, status: novoStatus } : c)
        }));
    };

    const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

    const atualizarFiltro = (field, value) => setFiltros(prev => ({ ...prev, [field]: value }));
    const atualizarCursoFiltro = (idx, value) => setFiltros(prev => { const c = [...prev.cursos]; c[idx] = value; return { ...prev, cursos: c }; });

    // Sistema de Match e Filtros Diretos
    const talentosComMatch = useMemo(() => {
        let maxPontos = 0;

        const cursosAtivos = filtros.cursos.filter(c => c.trim());
        if (cursosAtivos.length > 0) maxPontos += cursosAtivos.length; // 1 pt por curso
        if (filtros.cidade.trim()) maxPontos += 1;
        if (filtros.habilidade.trim()) maxPontos += 1;
        if (filtros.nivelFormacao !== 'Qualquer') maxPontos += 1;

        const processados = talentos.map(t => {
            // Se tiver filtro de NOME ou IDADE, consideramos filtros restritivos (eliminatórios)
            const nome = filtros.nome.trim().toLowerCase();
            if (nome && !t.nome?.toLowerCase().includes(nome)) return null;

            const idade = calcIdade(t.data_nascimento);
            if (filtros.idadeMin && (idade === null || idade < Number(filtros.idadeMin))) return null;
            if (filtros.idadeMax && (idade === null || idade > Number(filtros.idadeMax))) return null;

            let pontos = 0;

            if (cursosAtivos.length > 0) {
                cursosAtivos.forEach(c => {
                    const hasCurso = (t.cursos_prof || []).some(cp => {
                        const nomeCurso = typeof cp === 'string' ? cp : cp.nome;
                        return nomeCurso?.toLowerCase().includes(c.toLowerCase());
                    });
                    if (hasCurso) pontos += 1;
                });
            }

            if (filtros.cidade.trim() && t.cidade?.toLowerCase().includes(filtros.cidade.toLowerCase())) {
                pontos += 1;
            }

            if (filtros.habilidade.trim()) {
                const h = filtros.habilidade.toLowerCase();
                const hasHabilidade = (t.habilidades || []).some(hb => hb.toLowerCase().includes(h));
                if (hasHabilidade) pontos += 1;
            }

            if (filtros.nivelFormacao !== 'Qualquer') {
                const fms = t.formacoes || [];
                const em = t.ensino_medio || {};
                let formacaoOk = false;
                if (filtros.nivelFormacao === 'Superior Cursando' && fms.some(f => f.status === 'cursando')) formacaoOk = true;
                if (filtros.nivelFormacao === 'Superior Completo' && fms.some(f => f.status === 'completo')) formacaoOk = true;
                if (filtros.nivelFormacao === 'Ensino Médio' && em.status === 'completo') formacaoOk = true;
                if (formacaoOk) pontos += 1;
            }

            // A lógica de prioridade: Se há pontos distribuídos, calculamos o %, senão é 100% de match (nenhum critério ativo).
            let matchScore = 0;
            if (maxPontos > 0) {
                matchScore = Math.round((pontos / maxPontos) * 100);
            } else {
                matchScore = 100; // Sem critérios definidos, todos são visualizáveis e 100% compativeis
            }

            return { ...t, matchScore };
        }).filter(t => t !== null); // Remove apenas os que falharam nos filtros estritos (nome, idade)

        // Ordena do maior match para o menor
        return processados.sort((a, b) => b.matchScore - a.matchScore);
    }, [talentos, filtros]);

    if (loading) {
        return (
            <div className="container" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <Skeleton width="200px" height="32px" />
                    <Skeleton width="100px" height="40px" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        );
    }

    if (!empresa) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh' }}>
                <div className="glass-panel" style={{ width: '100%', maxWidth: '480px' }}>
                    <h2 style={{ color: 'var(--neon-blue)', marginBottom: '1.5rem' }}>Criar Perfil da Empresa</h2>
                    <form onSubmit={handleSubmitEmpresa}>
                        <div className="input-group"><label>Razão Social</label><input className="neon-input" required value={perfilForm.razao_social} onChange={e => setPerfilForm({ ...perfilForm, razao_social: e.target.value })} /></div>
                        <div className="input-group"><label>CNPJ</label><input className="neon-input" required placeholder="00.000.000/0000-00" value={perfilForm.cnpj} onChange={e => setPerfilForm({ ...perfilForm, cnpj: e.target.value })} /></div>
                        <div className="input-group"><label>Descrição</label><textarea className="neon-input" style={{ minHeight: '80px' }} value={perfilForm.descricao_empresa} onChange={e => setPerfilForm({ ...perfilForm, descricao_empresa: e.target.value })} /></div>
                        <button type="submit" className="neon-button">CRIAR PERFIL</button>
                    </form>
                </div>
            </div>
        );
    }

    if (!empresa.aprovada) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', textAlign: 'center', padding: '2rem' }}>
                <div className="glass-panel" style={{ maxWidth: '500px' }}>
                    <Building size={48} color="#f59e0b" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ color: '#f59e0b', marginBottom: '1rem' }}>Perfil em Análise</h2>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        Sua empresa <strong>{empresa.razao_social}</strong> foi cadastrada com sucesso! <br /><br />
                        Nossa equipe administrativa está revisando seus dados. Você receberá acesso total assim que o perfil for aprovado.
                    </p>
                    <button onClick={handleLogout} className="neon-button secondary" style={{ marginTop: '2rem' }}>SAIR</button>
                </div>
            </div>
        );
    }

    const tabStyle = (t) => ({
        margin: 0, padding: '8px 18px', width: 'auto',
        ...(activeTab === t ? {} : { background: 'none', color: 'var(--text-muted)', border: '1px solid transparent' })
    });

    return (
        <div>
            {/* Modal candidatos */}
            {modalCandidatos && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
                    onClick={(e) => e.target === e.currentTarget && setModalCandidatos(null)}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', maxHeight: '82vh', overflowY: 'auto', position: 'relative' }}>
                        <button onClick={() => setModalCandidatos(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                        <h3 style={{ color: 'var(--neon-blue)', marginBottom: '0.25rem', paddingRight: '2rem' }}>Candidatos — {modalCandidatos.vaga.titulo}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            {loadingCandidatos ? 'Buscando...' : `${modalCandidatos.candidatos.length} candidatura(s)`}
                        </p>
                        {loadingCandidatos && <p style={{ textAlign: 'center', color: 'var(--neon-blue)' }}>Carregando...</p>}
                        {!loadingCandidatos && modalCandidatos.candidatos.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}><Users size={40} style={{ opacity: 0.4, marginBottom: '1rem' }} /><p>Nenhuma candidatura ainda.</p></div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {modalCandidatos.candidatos.map((c, i) => {
                                const cv = c.curriculos;
                                return (
                                    <div key={i} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div>
                                                <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>{cv?.nome || 'Sem currículo'}</p>
                                                {cv?.bairro && <p style={{ color: 'var(--neon-blue)', fontSize: '0.8rem', marginBottom: '4px' }}>📍 {cv.bairro}{cv.cidade ? ` - ${cv.cidade}` : ''}</p>}
                                                {cv?.email && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>✉ {cv.email}</p>}
                                                {cv?.telefone && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📱 {cv.telefone}</p>}
                                                <p style={{ color: 'rgba(154,140,173,0.5)', fontSize: '0.75rem', marginTop: '4px' }}>
                                                    Candidatou-se em {new Date(c.created_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <button onClick={() => navigate(`/cv-preview/${c.user_id}`)} className="neon-button secondary" style={{ margin: 0, padding: '8px 14px', width: 'auto', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <ExternalLink size={14} /> VER CV
                                            </button>
                                        </div>
                                        {/* Status da candidatura */}
                                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
                                            {STATUS_CAND.map(st => (
                                                <button key={st} onClick={() => handleStatusCandidatura(c.user_id, modalCandidatos.vaga.id, st)}
                                                    style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)', background: (c.status || 'pendente') === st ? COR_STATUS[st] : 'transparent', color: (c.status || 'pendente') === st ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: (c.status || 'pendente') === st ? 'bold' : 'normal', transition: 'all 0.15s' }}>
                                                    {LABEL_STATUS[st]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <Navbar icon={<Building size={24} />} title={empresa.razao_social} subtitle="[PJ]">
                <button onClick={handleLogout} className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', width: 'auto' }}><LogOut size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> SAIR</button>
            </Navbar>

            <div className="container" style={{ marginTop: '2rem' }}>
                {/* Abas */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                    <button onClick={() => setActiveTab('vagas')} className="neon-button secondary" style={tabStyle('vagas')}><Briefcase size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />MINHAS VAGAS</button>
                    <button onClick={() => setActiveTab('talentos')} className="neon-button secondary" style={tabStyle('talentos')}><Users size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />BUSCAR TALENTOS</button>
                </div>

                {/* ===== ABA VAGAS ===== */}
                {activeTab === 'vagas' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>GERENCIAR VAGAS</h2>
                            <button onClick={() => setShowVagaForm(!showVagaForm)} className="neon-button" style={{ margin: 0, padding: '8px 20px', width: 'auto' }}><Plus size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />NOVA VAGA</button>
                        </div>

                        {showVagaForm && (
                            <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                                <h3 style={{ color: 'var(--neon-blue)', marginBottom: '1.5rem' }}>Publicar Nova Vaga</h3>
                                <form onSubmit={handlePublicarVaga}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label>Título da Vaga *</label>
                                            <input className="neon-input" required value={newVaga.titulo} onChange={e => setNewVaga({ ...newVaga, titulo: e.target.value })} placeholder="Ex: Desenvolvedor React" />
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label>Modalidade</label>
                                            <select className="neon-input" value={newVaga.modalidade} onChange={e => setNewVaga({ ...newVaga, modalidade: e.target.value })}>
                                                <option value="">Selecione...</option>
                                                {MODALIDADES.map(m => <option key={m} value={m}>{LABEL_MODAL[m]}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label>Cidade</label>
                                            <input className="neon-input" value={newVaga.cidade} onChange={e => setNewVaga({ ...newVaga, cidade: e.target.value })} placeholder="Ex: São Paulo - SP" />
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label>Faixa Salarial (R$)</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input type="number" className="neon-input" placeholder="Mín" value={newVaga.salario_min} onChange={e => setNewVaga({ ...newVaga, salario_min: e.target.value })} style={{ flex: 1 }} />
                                                <input type="number" className="neon-input" placeholder="Máx" value={newVaga.salario_max} onChange={e => setNewVaga({ ...newVaga, salario_max: e.target.value })} style={{ flex: 1 }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Descrição das Atividades *</label>
                                        <textarea className="neon-input" required style={{ minHeight: '100px' }} value={newVaga.descricao} onChange={e => setNewVaga({ ...newVaga, descricao: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label>Requisitos / Diferenciais</label>
                                        <textarea className="neon-input" style={{ minHeight: '70px' }} value={newVaga.requisitos} onChange={e => setNewVaga({ ...newVaga, requisitos: e.target.value })} />
                                    </div>
                                    <button type="submit" className="neon-button" style={{ background: 'var(--neon-blue)', color: '#000' }}>PUBLICAR</button>
                                </form>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {vagas.map(vaga => (
                                <div key={vaga.id} className="glass-panel" style={{ padding: '1.5rem', opacity: vaga.status === 'fechada' ? 0.7 : 1 }}>
                                    <h3 style={{ marginBottom: '0.5rem' }}>{vaga.titulo}</h3>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                        <span style={{ fontSize: '0.7rem', background: vaga.status === 'aberta' ? 'rgba(0,240,255,0.1)' : 'rgba(255,68,68,0.1)', color: vaga.status === 'aberta' ? 'var(--neon-blue)' : '#ff4444', padding: '2px 8px', borderRadius: '10px' }}>{vaga.status?.toUpperCase()}</span>
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '10px' }}>
                                            👥 {vaga.candidaturas?.[0]?.count || 0} inscrito(s)
                                        </span>
                                        {vaga.modalidade && <span style={{ fontSize: '0.7rem', background: 'rgba(181,53,246,0.1)', color: 'var(--neon-purple)', padding: '2px 8px', borderRadius: '10px' }}>{LABEL_MODAL[vaga.modalidade]}</span>}
                                        {vaga.cidade && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📍 {vaga.cidade}</span>}
                                    </div>
                                    {(vaga.salario_min || vaga.salario_max) && (
                                        <p style={{ fontSize: '0.85rem', color: '#22c55e', marginBottom: '0.75rem' }}>
                                            💰 R$ {vaga.salario_min?.toLocaleString('pt-BR') || '?'} — {vaga.salario_max?.toLocaleString('pt-BR') || '?'}
                                        </p>
                                    )}
                                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                                        {vaga.descricao?.substring(0, 90)}...
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleVerCandidatos(vaga)} className="neon-button" style={{ margin: 0, padding: '8px 12px', fontSize: '0.8rem', width: 'auto', flex: 1 }}>
                                            <Users size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />CANDIDATOS
                                        </button>
                                        <button onClick={() => handleFecharVaga(vaga.id)} disabled={vaga.status === 'fechada'} className="neon-button secondary" style={{ margin: 0, padding: '8px', fontSize: '0.8rem', width: 'auto', opacity: vaga.status === 'fechada' ? 0.5 : 1 }}>
                                            {vaga.status === 'fechada' ? '✓ ENCERRADA' : 'FECHAR'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* ===== ABA TALENTOS ===== */}
                {activeTab === 'talentos' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>BANCO de TALENTOS <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>({talentosComMatch.length} candidato{talentosComMatch.length !== 1 ? 's' : ''})</span></h2>
                            <button onClick={() => setShowFiltros(!showFiltros)} className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Filter size={16} /> {showFiltros ? 'OCULTAR PERFIL' : 'DEFINIR PERFIL DESEJADO'}
                            </button>
                        </div>

                        {/* Painel de filtros */}
                        {showFiltros && (
                            <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                                <h4 style={{ color: 'var(--neon-purple)', marginBottom: '1.5rem' }}>🎯 Perfil de Match Desejado</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label>Nome do candidato</label>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                                            <input className="neon-input" style={{ paddingLeft: '38px' }} placeholder="Buscar por nome..." value={filtros.nome} onChange={e => atualizarFiltro('nome', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label>Faixa de Idade</label>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input type="number" className="neon-input" placeholder="Mín" min={14} max={99} value={filtros.idadeMin} onChange={e => atualizarFiltro('idadeMin', e.target.value)} style={{ flex: 1 }} />
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>até</span>
                                            <input type="number" className="neon-input" placeholder="Máx" min={14} max={99} value={filtros.idadeMax} onChange={e => atualizarFiltro('idadeMax', e.target.value)} style={{ flex: 1 }} />
                                        </div>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label>Nível de Formação</label>
                                        <select className="neon-input" value={filtros.nivelFormacao} onChange={e => atualizarFiltro('nivelFormacao', e.target.value)}>
                                            {NIVEL_FORM.map(n => <option key={n}>{n}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label>Cidade</label>
                                        <input className="neon-input" placeholder="Ex: São Paulo" value={filtros.cidade} onChange={e => atualizarFiltro('cidade', e.target.value)} />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label>Habilidade</label>
                                        <input className="neon-input" placeholder="Ex: Excel" value={filtros.habilidade} onChange={e => atualizarFiltro('habilidade', e.target.value)} />
                                    </div>
                                </div>

                                {/* Até 3 cursos profissionalizantes */}
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label>Cursos Profissionalizantes (até 3)</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                        {filtros.cursos.map((c, i) => (
                                            <select key={i} className="neon-input" value={c} onChange={e => atualizarCursoFiltro(i, e.target.value)}>
                                                <option value="">Curso {i + 1}...</option>
                                                {TODOS_OS_CURSOS.map(curso => <option key={curso} value={curso}>{curso}</option>)}
                                            </select>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={() => setFiltros({ nome: '', idadeMin: '', idadeMax: '', cursos: ['', '', ''], nivelFormacao: 'Qualquer', cidade: '', habilidade: '' })}
                                    className="neon-button secondary" style={{ margin: '1rem 0 0 0', padding: '6px 16px', width: 'auto', fontSize: '0.8rem' }}>
                                    Limpar Filtros
                                </button>
                            </div>
                        )}

                        {/* Tabela de talentos */}
                        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                    <tr>
                                        <th style={{ padding: '1rem' }}>Candidato</th>
                                        <th style={{ padding: '1rem' }}>Afinidade</th>
                                        <th style={{ padding: '1rem' }}>Idade</th>
                                        <th style={{ padding: '1rem' }}>Cidade</th>
                                        <th style={{ padding: '1rem' }}>Contato</th>
                                        <th style={{ padding: '1rem' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {talentosComMatch.map(t => (
                                        <tr key={t.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>{t.nome}</p>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.email}</p>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {t.matchScore === 100 ? (
                                                    <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>🔥 100% compatível</span>
                                                ) : t.matchScore >= 50 ? (
                                                    <span style={{ background: 'rgba(255,193,7,0.15)', color: '#f59e0b', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>🟡 {t.matchScore}% compatível</span>
                                                ) : (
                                                    <span style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>⚪ {t.matchScore}% compatível</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                                                {calcIdade(t.data_nascimento) !== null ? `${calcIdade(t.data_nascimento)} anos` : '—'}
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                {t.bairro ? `${t.bairro}${t.cidade ? ` - ${t.cidade}` : ''}` : (t.cidade || '—')}
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{t.telefone || '—'}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <button onClick={() => navigate(`/cv-preview/${t.user_id}`)} className="neon-button secondary" style={{ margin: 0, padding: '6px 14px', width: 'auto', fontSize: '0.8rem' }}>
                                                    VER CURRÍCULO
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {talentosComMatch.length === 0 && (
                                        <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum candidato encontrado com os filtros aplicados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* MODAL DE CONFIRMAÇÃO DE FECHAMENTO DE VAGA */}
            {vagaToClose && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
                        <h3 style={{ color: 'var(--neon-purple)', marginBottom: '1rem' }}>FECHAR ESTA VAGA?</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            Ao fechar esta vaga, novos talentos não poderão mais se candidatar. Esta ação pode ser revertida editando a vaga futuramente.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setVagaToClose(null)} className="neon-button secondary" style={{ margin: 0, width: 'auto' }}>CANCELAR</button>
                            <button onClick={confirmFecharVaga} className="neon-button error" style={{ margin: 0, width: 'auto', background: 'rgba(239, 68, 68, 0.2)', color: '#ff4444', borderColor: '#ff4444' }}>SIM, FECHAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
