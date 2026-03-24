import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Building, LogOut, Plus, Search, FileText, Briefcase, Users, X, ExternalLink, MapPin, DollarSign, Filter, Pencil, CheckCircle, AlertTriangle, User, Camera, Mail, Phone, MapPinned, Gift } from 'lucide-react';
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

// Verifica se o currículo está completo
function isCurriculoCompleto(cv) {
    if (!cv) return false;
    const temResumo = !!cv.resumo && cv.resumo.trim().length > 10;
    const temExp = Array.isArray(cv.experiencias) && cv.experiencias.length > 0;
    const temForm = Array.isArray(cv.formacoes) && cv.formacoes.length > 0;
    const temHabilidades = Array.isArray(cv.habilidades) && cv.habilidades.length > 0;
    const temContato = !!cv.telefone && !!cv.cidade;
    
    return temResumo && (temExp || cv.primeiro_emprego) && temForm && temHabilidades && temContato;
}

export default function EmpresaDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [empresa, setEmpresa] = useState(null);
    const [activeTab, setActiveTab] = useState('vagas');

    // Vagas
    const [showVagaForm, setShowVagaForm] = useState(false);
    const [vagaToEdit, setVagaToEdit] = useState(null);
    const [newVaga, setNewVaga] = useState({ titulo: '', descricao: '', requisitos: '', modalidade: '', cidade: '', salario_min: '', salario_max: '', data_limite: '' });
    const [vagas, setVagas] = useState([]);

    // Talentos
    const [talentos, setTalentos] = useState([]);
    const [filtros, setFiltros] = useState({ 
        nome: '', 
        idadeMin: '', 
        idadeMax: '', 
        cursos: ['', '', ''], 
        nivelFormacao: 'Qualquer', 
        cidade: '', 
        habilidade: '',
        statusCurriculo: 'todos' // 'todos', 'completo', 'incompleto'
    });
    const [showFiltros, setShowFiltros] = useState(false);

    // Perfil empresa
    const [perfilForm, setPerfilForm] = useState({ 
        razao_social: '', 
        cnpj: '', 
        descricao_empresa: '',
        logo_url: '',
        historia: '',
        telefone: '',
        email_contato: '',
        endereco: '',
        bairro: '',
        cidade: ''
    });
    const [submittingPerfil, setSubmittingPerfil] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // Modal candidatos
    const [modalCandidatos, setModalCandidatos] = useState(null);
    const [loadingCandidatos, setLoadingCandidatos] = useState(false);
    const [vagaToClose, setVagaToClose] = useState(null);
    const [notification, setNotification] = useState(null);

    // Helper para mostrar notificações
    const notify = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    useEffect(() => { if (user) checkEmpresaPerfil(); }, [user]);
    useEffect(() => { if (activeTab === 'talentos') fetchTalentos(); }, [activeTab]);

    const checkEmpresaPerfil = async () => {
        setLoading(true);
        try {
            const { data } = await supabase.from('empresas').select('*').eq('user_id', user.id).limit(1).maybeSingle();
            if (data) { 
                setEmpresa(data); 
                setPerfilForm({
                    razao_social: data.razao_social || '',
                    cnpj: data.cnpj || '',
                    descricao_empresa: data.descricao_empresa || '',
                    logo_url: data.logo_url || '',
                    historia: data.historia || '',
                    telefone: data.telefone || '',
                    email_contato: data.email_contato || '',
                    endereco: data.endereco || '',
                    bairro: data.bairro || '',
                    cidade: data.cidade || ''
                });
                fetchVagas(data.id); 
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleUploadLogo = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setUploadingLogo(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${empresa.id}-${Math.random()}.${fileExt}`;
            const filePath = `logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath);

            setPerfilForm(prev => ({ ...prev, logo_url: publicUrl }));
            notify('Logo carregada com sucesso!', 'success');
        } catch (err) {
            notify('Erro ao subir logo: ' + err.message, 'error');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSalvarPerfil = async (e) => {
        if (e) e.preventDefault();
        setSubmittingPerfil(true);
        try {
            const { data, error } = await supabase
                .from('empresas')
                .update(perfilForm)
                .eq('id', empresa.id)
                .select()
                .single();
            
            if (error) throw error;
            setEmpresa(data);
            notify('Perfil atualizado com sucesso!', 'success');
            setActiveTab('vagas');
        } catch (err) {
            notify('Erro ao salvar perfil: ' + err.message, 'error');
        } finally {
            setSubmittingPerfil(false);
        }
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
        // SEGURANÇA: Empresa aprovada visualiza a base global conforme política RLS 'Visualizacao_Universal_Curriculos'
        if (!empresa?.id) return;

        try {
            const { data, error: cvError } = await supabase
                .from('curriculos')
                .select(`
                    user_id, nome, email, telefone, cidade, bairro, data_nascimento, 
                    habilidades, cursos_prof, formacoes, ensino_medio, resumo, experiencias,
                    indicacoes:indicacoes!indicacoes_quem_indicou_fkey(count)
                `)
                .order('updated_at', { ascending: false });

            if (cvError) throw cvError;
            
            // Transformar count em número simples
            const formatted = (data || []).map(t => ({
                ...t,
                referralCount: t.indicacoes?.[0]?.count || 0
            }));

            setTalentos(formatted);
        } catch (err) {
            console.error('Erro ao buscar talentos:', err.message);
            setTalentos([]);
        }
    };

    const handleSubmitEmpresa = async (e) => {
        e.preventDefault();
        setSubmittingPerfil(true);
        try {
            const { data, error } = await supabase
                .from('empresas')
                .insert([{ ...perfilForm, user_id: user.id, aprovada: true }])
                .select()
                .single();
            
            if (error) throw error;
            
            if (data) { 
                setEmpresa(data); 
                fetchVagas(data.id); 
            }
        } catch (err) {
            alert('Erro ao criar perfil: ' + err.message);
        } finally {
            setSubmittingPerfil(false);
        }
    };

    const handlePublicarVaga = async (e) => {
        e.preventDefault();
        const payload = { 
            ...newVaga, 
            empresa_id: empresa.id, 
            status: 'aberta', 
            salario_min: newVaga.salario_min || null, 
            salario_max: newVaga.salario_max || null,
            data_limite: newVaga.data_limite || null
        };

        try {
            if (vagaToEdit) {
                // Modo Edição
                const { error } = await supabase
                    .from('vagas')
                    .update(payload)
                    .eq('id', vagaToEdit.id);
                
                if (error) throw error;
                notify('Vaga atualizada com sucesso!', 'success');
            } else {
                // Modo Criação
                const { error } = await supabase
                    .from('vagas')
                    .insert([payload]);
                
                if (error) throw error;
                notify('Vaga publicada com sucesso!', 'success');
            }

            setShowVagaForm(false);
            setVagaToEdit(null);
            setNewVaga({ titulo: '', descricao: '', requisitos: '', modalidade: '', cidade: '', salario_min: '', salario_max: '', data_limite: '' });
            fetchVagas(empresa.id);
        } catch (err) {
            notify('Erro: ' + err.message, 'error');
        }
    };

    const handleEditVaga = (vaga) => {
        setVagaToEdit(vaga);
        setNewVaga({
            titulo: vaga.titulo,
            descricao: vaga.descricao,
            requisitos: vaga.requisitos || '',
            modalidade: vaga.modalidade || '',
            cidade: vaga.cidade || '',
            salario_min: vaga.salario_min || '',
            salario_max: vaga.salario_max || '',
            data_limite: vaga.data_limite || ''
        });
        setShowVagaForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        let maxPoints = 0;

        const cursosAtivos = filtros.cursos.filter(c => c.trim());
        if (cursosAtivos.length > 0) maxPoints += cursosAtivos.length; // 1 pt por curso
        if (filtros.cidade.trim()) maxPoints += 1;
        if (filtros.habilidade.trim()) maxPoints += 1;
        if (filtros.nivelFormacao !== 'Qualquer') maxPoints += 1;
        if (filtros.statusCurriculo !== 'todos') maxPoints += 1;

        const processados = talentos.map(t => {
            const completo = isCurriculoCompleto(t);
            
            // Filtro restritivo de status de currículo
            if (filtros.statusCurriculo === 'completo' && !completo) return null;
            if (filtros.statusCurriculo === 'incompleto' && completo) return null;

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

            // Bônus por indicações (Upgrade de Perfil) - OCULTO PARA DEPLOY
            // const referralBonus = Math.min((t.referralCount || 0) * 5, 20); // Máximo 20% de bônus
            const referralBonus = 0;
            
            // A lógica de prioridade: Se há pontos distribuídos, calculamos o %, senão é 100% de match (nenhum critério ativo).
            let matchScore = 0;
            if (maxPoints > 0) {
                matchScore = Math.round((pontos / maxPoints) * 100) + referralBonus;
            } else {
                matchScore = 100 + referralBonus; 
            }

            return { ...t, matchScore, completo, referralCount: t.referralCount || 0 };
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '1.5rem' }}>
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        );
    }

    if (!empresa) {
        return (
            <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, #0a0a0f, #000)', color: '#fff', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-panel" style={{ maxWidth: '450px', width: '100%', padding: '3rem', animation: 'fadeIn 0.6s ease-out' }}>
                    <h2 style={{ color: 'var(--neon-blue)', marginBottom: '2rem', textAlign: 'center', fontWeight: 900 }}>Criar Perfil da Empresa</h2>
                    <form onSubmit={handleSubmitEmpresa}>
                        <div className="input-group">
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>RAZÃO SOCIAL</label>
                            <input className="neon-input" required value={perfilForm.razao_social} onChange={e => setPerfilForm({ ...perfilForm, razao_social: e.target.value })} placeholder="Nome oficial da empresa" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>CNPJ</label>
                            <input className="neon-input" required value={perfilForm.cnpj} onChange={e => setPerfilForm({ ...perfilForm, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>DESCRIÇÃO</label>
                            <textarea className="neon-input" required style={{ minHeight: '100px' }} value={perfilForm.descricao_empresa} onChange={e => setPerfilForm({ ...perfilForm, descricao_empresa: e.target.value })} placeholder="Fale um pouco sobre a empresa..." />
                        </div>
                        <button type="submit" disabled={submittingPerfil} className="neon-button" style={{ 
                            background: 'var(--neon-purple)', 
                            color: '#fff', 
                            height: '56px', 
                            fontSize: '1rem', 
                            fontWeight: 800,
                            marginTop: '1rem' 
                        }}>
                            {submittingPerfil ? 'CRIANDO PERFIL...' : 'CRIAR PERFIL'}
                        </button>
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
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
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
                <div className="tabs-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                    <button onClick={() => setActiveTab('vagas')} className="neon-button secondary" style={tabStyle('vagas')}><Briefcase size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />MINHAS VAGAS</button>
                    <button onClick={() => setActiveTab('talentos')} className="neon-button secondary" style={tabStyle('talentos')}><Users size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />BUSCAR TALENTOS</button>
                    <button onClick={() => setActiveTab('perfil')} className="neon-button secondary" style={tabStyle('perfil')}><User size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />MEU PERFIL</button>
                </div>

                {/* ===== ABA VAGAS ===== */}
                {activeTab === 'vagas' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>GERENCIAR VAGAS</h2>
                            <button onClick={() => setShowVagaForm(!showVagaForm)} className="neon-button" style={{ margin: 0, padding: '8px 20px', width: 'auto' }}><Plus size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />NOVA VAGA</button>
                        </div>

                        {showVagaForm && (
                            <div className="glass-panel" style={{ marginBottom: '2.5rem', border: '1px solid var(--neon-blue)', animation: 'slideDown 0.4s ease-out' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h3 style={{ color: 'var(--neon-blue)', margin: 0 }}>{vagaToEdit ? 'Editar Vaga' : 'Nova Vaga'}</h3>
                                    {vagaToEdit && (
                                        <button onClick={() => { setShowVagaForm(false); setVagaToEdit(null); setNewVaga({ titulo: '', descricao: '', requisitos: '', modalidade: '', cidade: '', salario_min: '', salario_max: '', data_limite: '' }); }}
                                            className="neon-button secondary" style={{ margin: 0, padding: '6px 14px', width: 'auto', fontSize: '0.8rem' }}>
                                            CANCELAR EDIÇÃO
                                        </button>
                                    )}
                                </div>
                                <form onSubmit={handlePublicarVaga}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem', marginBottom: '1rem' }}>
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
                                        <div className="input-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                                            <label>Prazo Limite para Inscrição (Opcional)</label>
                                            <input type="date" className="neon-input" value={newVaga.data_limite} onChange={e => setNewVaga({ ...newVaga, data_limite: e.target.value })} />
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
                                    <button type="submit" className="neon-button" style={{ background: 'var(--neon-blue)', color: '#000' }}>
                                        {vagaToEdit ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR'}
                                    </button>
                                </form>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
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
                                        <p style={{ fontSize: '0.85rem', color: '#22c55e', margin: '4px 0', fontWeight: 600 }}>
                                            💰 R$ {vaga.salario_min?.toLocaleString('pt-BR') || '?'} — {vaga.salario_max?.toLocaleString('pt-BR') || '?'}
                                        </p>
                                    )}
                                    {vaga.data_limite && (
                                        <p style={{ fontSize: '0.8rem', color: '#f59e0b', margin: '4px 0 12px 0', fontWeight: 600 }}>
                                            ⏳ Inscrições até: {new Date(vaga.data_limite + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                                        </p>
                                    )}
                                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                                        {vaga.descricao?.substring(0, 90)}...
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleVerCandidatos(vaga)} className="neon-button" style={{ margin: 0, padding: '8px 12px', fontSize: '0.8rem', width: 'auto', flex: 1 }}>
                                            <Users size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />CANDIDATOS
                                        </button>
                                        <button onClick={() => handleEditVaga(vaga)} className="neon-button secondary" style={{ margin: 0, padding: '8px 12px', fontSize: '0.8rem', width: 'auto' }}>
                                            <Pencil size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} /> EDITAR
                                        </button>
                                        <button onClick={() => handleFecharVaga(vaga.id)} disabled={vaga.status === 'fechada'} className="neon-button secondary" style={{ margin: 0, padding: '8px', fontSize: '0.8rem', width: 'auto', opacity: vaga.status === 'fechada' ? 0.5 : 1 }}>
                                            {vaga.status === 'fechada' ? '✓' : 'X'}
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
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label>Status do Currículo</label>
                                        <select className="neon-input" value={filtros.statusCurriculo} onChange={e => atualizarFiltro('statusCurriculo', e.target.value)}>
                                            <option value="todos">Todos os currículos</option>
                                            <option value="completo">Apenas Completos</option>
                                            <option value="incompleto">Apenas Incompletos</option>
                                        </select>
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

                                <button onClick={() => setFiltros({ nome: '', idadeMin: '', idadeMax: '', cursos: ['', '', ''], nivelFormacao: 'Qualquer', cidade: '', habilidade: '', statusCurriculo: 'todos' })}
                                    className="neon-button secondary" style={{ margin: '1rem 0 0 0', padding: '6px 16px', width: 'auto', fontSize: '0.8rem' }}>
                                    Limpar Filtros
                                </button>
                            </div>
                        )}

                        {/* Tabela de talentos */}
                        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                            <div className="table-responsive">
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
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <p style={{ fontWeight: 'bold', margin: 0 }}>{t.nome}</p>
                                                    {t.completo ? (
                                                        <span title="Perfil Completo" style={{ color: '#22c55e', display: 'flex' }}><CheckCircle size={14} /></span>
                                                    ) : (
                                                        <span title="Perfil Incompleto" style={{ color: '#f59e0b', display: 'flex' }}><AlertTriangle size={14} /></span>
                                                    )}
                                                    {/* TOP INDICADOR - OCULTO PARA DEPLOY
                                                    {t.referralCount > 0 && (
                                                        <span title={`Top Indicador - ${t.referralCount} amigo(s)`} style={{ 
                                                            color: 'var(--neon-purple)', 
                                                            display: 'flex', 
                                                            background: 'rgba(181,53,246,0.1)', 
                                                            padding: '2px 6px', 
                                                            borderRadius: '4px', 
                                                            fontSize: '0.65rem', 
                                                            fontWeight: 900, 
                                                            alignItems: 'center', 
                                                            gap: '3px',
                                                            border: '1px solid rgba(181,53,246,0.3)'
                                                        }}>
                                                            <Gift size={10} /> TOP INDICADOR
                                                        </span>
                                                    )}
                                                    */}
                                                </div>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.email}</p>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {t.matchScore >= 100 ? (
                                                    <span style={{ 
                                                        background: 'linear-gradient(90deg, rgba(34,197,94,0.15) 0%, rgba(124,58,237,0.15) 100%)', 
                                                        color: '#fff', 
                                                        padding: '4px 10px', 
                                                        borderRadius: '12px', 
                                                        fontSize: '0.8rem', 
                                                        fontWeight: 'bold', 
                                                        whiteSpace: 'nowrap',
                                                        border: '1px solid rgba(124,58,237,0.3)'
                                                    }}>
                                                        🚀 Super Match {t.matchScore}%
                                                    </span>
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
                        </div>
                    </>
                )}

                {/* ===== ABA PERFIL ===== */}
                {activeTab === 'perfil' && (
                    <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: '100px', height: '100px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(0,240,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {perfilForm.logo_url ? (
                                        <img src={perfilForm.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <Building size={40} color="var(--text-muted)" style={{ opacity: 0.3 }} />
                                    )}
                                </div>
                                <label style={{ position: 'absolute', bottom: '-8px', right: '-8px', background: 'var(--neon-blue)', color: '#000', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex', boxShadow: '0 0 15px var(--neon-blue)' }}>
                                    <Camera size={16} />
                                    <input type="file" hidden accept="image/*" onChange={handleUploadLogo} disabled={uploadingLogo} />
                                </label>
                            </div>
                            <div>
                                <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>PERSONALIZAR PERFIL</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configure como sua empresa aparece para os candidatos</p>
                            </div>
                        </div>

                        <form onSubmit={handleSalvarPerfil}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="input-group">
                                    <label>Razão Social</label>
                                    <input className="neon-input" value={perfilForm.razao_social} onChange={e => setPerfilForm({...perfilForm, razao_social: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label>CNPJ</label>
                                    <input className="neon-input" disabled value={perfilForm.cnpj} />
                                </div>
                                <div className="input-group">
                                    <label><Mail size={14} style={{ marginRight: '6px' }}/> E-mail de Contato</label>
                                    <input className="neon-input" type="email" value={perfilForm.email_contato} onChange={e => setPerfilForm({...perfilForm, email_contato: e.target.value})} placeholder="rh@empresa.com" />
                                </div>
                                <div className="input-group">
                                    <label><Phone size={14} style={{ marginRight: '6px' }}/> Telefone/WhatsApp</label>
                                    <input className="neon-input" value={perfilForm.telefone} onChange={e => setPerfilForm({...perfilForm, telefone: e.target.value})} placeholder="(00) 00000-0000" />
                                </div>
                            </div>

                            <div className="input-group">
                                <label><MapPinned size={14} style={{ marginRight: '6px' }}/> Localização</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                                    <input className="neon-input" placeholder="Endereço e Número" value={perfilForm.endereco} onChange={e => setPerfilForm({...perfilForm, endereco: e.target.value})} />
                                    <input className="neon-input" placeholder="Bairro" value={perfilForm.bairro} onChange={e => setPerfilForm({...perfilForm, bairro: e.target.value})} />
                                    <input className="neon-input" placeholder="Cidade" value={perfilForm.cidade} onChange={e => setPerfilForm({...perfilForm, cidade: e.target.value})} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>História / Missão</label>
                                <textarea className="neon-input" style={{ minHeight: '120px' }} value={perfilForm.historia} onChange={e => setPerfilForm({...perfilForm, historia: e.target.value})} placeholder="Conte a história da empresa, missão e valores..." />
                            </div>

                            <div className="input-group">
                                <label>Descrição Curta</label>
                                <textarea className="neon-input" style={{ minHeight: '80px' }} value={perfilForm.descricao_empresa} onChange={e => setPerfilForm({...perfilForm, descricao_empresa: e.target.value})} placeholder="Um resumo rápido que aparece nas vagas..." />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" disabled={submittingPerfil} className="neon-button" style={{ flex: 1 }}>
                                    {submittingPerfil ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                                </button>
                                <button type="button" onClick={() => setActiveTab('vagas')} className="neon-button secondary" style={{ width: 'auto' }}>
                                    CANCELAR
                                </button>
                            </div>
                        </form>
                    </div>
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

            {/* NOTIFICAÇÃO PERSONALIZADA (TOAST) */}
            {notification && (
                <div style={{
                    position: 'fixed', top: '1.5rem', right: '1.5rem', left: 'auto',
                    maxWidth: 'calc(100vw - 2rem)',
                    background: notification.type === 'success' ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
                    backdropFilter: 'blur(10px)', color: '#fff',
                    padding: '1rem 1.5rem', borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    zIndex: 10000, animation: 'slideInRight 0.4s ease-out'
                }}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    <span style={{ fontWeight: 600 }}>{notification.message}</span>
                </div>
            )}
        </div>
    );
}
