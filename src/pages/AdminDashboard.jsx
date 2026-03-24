import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    Activity, Users, Briefcase, Mail, LogOut, ArrowRight,
    Filter, RefreshCw, ShieldAlert, Trash2, CheckCircle, Clock,
    Building, BarChart2, Shield, AlertTriangle, Database,
    Plus, Download, Search, XCircle, Send, Lock, Menu, X
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';

const TABS = [
    { id: 'visao', label: 'Monitoramento', icon: Activity },
    { id: 'usuarios', label: 'Candidatos', icon: Users },
    { id: 'empresas', label: 'Parceiros', icon: Building },
    { id: 'vagas', label: 'Curadoria', icon: Briefcase },
    { id: 'metricas', label: 'Inteligência', icon: BarChart2 },
    { id: 'automacao', label: 'Automação', icon: Mail },
    { id: 'logs', label: 'Auditoria', icon: Clock },
    { id: 'lgpd', label: 'Privacidade', icon: Shield },
    { id: 'denuncias', label: 'Ouvidoria', icon: AlertTriangle }
];

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('visao');
    const [loading, setLoading] = useState(true);

    // Métricas Visão Rápida
    const [diasFiltro, setDiasFiltro] = useState(7);
    const [metricasFunil, setMetricasFunil] = useState({ 
        visitas: 0, logins: 0, curriculos_iniciados: 0, curriculos_completos: 0 
    });
    const [metricasTempo, setMetricasTempo] = useState({ dau: 0, wau: 0 });
    const [ativosAgora, setAtivosAgora] = useState(0);
    const [stats, setStats] = useState({ candidatos: 0, empresas: 0, perfisCompletos: 0 });

    // Listas
    const [usuariosList, setUsuariosList] = useState([]);
    const [vagasList, setVagasList] = useState([]);
    const [allEmpresas, setAllEmpresas] = useState([]);
    const [accessLogs, setAccessLogs] = useState([]);
    const [consentLogs, setConsentLogs] = useState([]);
    const [denuncias, setDenuncias] = useState([]);
    const [metrics, setMetrics] = useState({ registrosPorSemana: [], vagasMaisProcuradas: [] });
    
    // Modais e Estados de Ação
    const [showNewEmpresaModal, setShowNewEmpresaModal] = useState(false);
    const [newEmpresaData, setNewEmpresaData] = useState({ razao_social: '', cnpj: '', email: '', password: '' });
    const [creatingEmpresa, setCreatingEmpresa] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [vagaToDelete, setVagaToDelete] = useState(null);
    const [vagaToClose, setVagaToClose] = useState(null);
    const [relatedDenunciaId, setRelatedDenunciaId] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (!user) return;
        verificarAcesso();
    }, [user]);

    useEffect(() => {
        if (activeTab === 'visao') carregarVisaoGeral();
        if (activeTab === 'usuarios') carregarUsuarios();
        if (activeTab === 'empresas') carregarTodasEmpresas();
        if (activeTab === 'vagas') carregarVagas();
        if (activeTab === 'metricas') carregarMetricas();
        if (activeTab === 'logs') carregarLogs();
        if (activeTab === 'lgpd') carregarLGPD();
        if (activeTab === 'denuncias') carregarDenuncias();
    }, [activeTab, diasFiltro]);

    // O Tracker atualiza de 5 em 5 minutos para saber os online
    useEffect(() => {
        if (activeTab === 'visao') {
            const interval = setInterval(carregarAoVivo, 30000); // 30s
            return () => clearInterval(interval);
        }
    }, [activeTab]);

    const verificarAcesso = async () => {
        try {
            const { data } = await supabase.from('user_roles')
                .select('role').eq('user_id', user.id).single();
            if (!data || (data.role !== 'admin' && data.role !== 'master')) {
                alert('Acesso negado. Essa área é restrita.');
                navigate('/dashboard');
                return;
            }
            carregarVisaoGeral();
        } catch(err) {
            console.error('Erro de permissão', err);
            navigate('/');
        }
    };

    const carregarAoVivo = async () => {
        try {
            const agoraMenos5Min = new Date(Date.now() - 5 * 60000).toISOString();
            const { count } = await supabase
                .from('page_views')
                .select('session_id', { count: 'exact', head: true })
                .gte('created_at', agoraMenos5Min);
            setAtivosAgora(count || 0);
        } catch(err) {
            console.error(err);
        }
    };

    const carregarVisaoGeral = async () => {
        setLoading(true);
        try {
            // Conta os ativos logo de cara
            carregarAoVivo();

            // Usa RPC para o Funil
            const { data: fData, error: fError } = await supabase.rpc('get_funnel_metrics', { p_days: diasFiltro });
            if (fData) setMetricasFunil(fData);

            // RPC para Dau/Wau
            const { data: dData } = await supabase.rpc('get_admin_dau_wau');
            if (dData) setMetricasTempo(dData);

            // Estatísticas Globais (Contagens simples)
            const [
                { count: candCount },
                { count: empCount },
                { count: completeCount }
            ] = await Promise.all([
                supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'candidato'),
                supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'empresa'),
                supabase.from('curriculos').select('*', { count: 'exact', head: true })
            ]);

            setStats({
                candidatos: candCount || 0,
                empresas: empCount || 0,
                perfisCompletos: completeCount || 0
            });

        } catch (err) {
            console.error('Erro geral', err);
        } finally {
            setLoading(false);
        }
    };

    const carregarUsuarios = async () => {
        setLoading(true);
        try {
            // Buscamos os currículos
            const { data, error } = await supabase
                .from('curriculos')
                .select('user_id, nome, email, telefone, ultimo_acesso:updated_at, resumo, experiencias, formacoes')
                .order('updated_at', { ascending: false });
            
            if (error) throw error;

            // Buscamos as candidaturas separadamente para contar
            const { data: candData } = await supabase.from('candidaturas').select('user_id');
            const candCounts = {};
            if (candData) {
                candData.forEach(c => {
                    candCounts[c.user_id] = (candCounts[c.user_id] || 0) + 1;
                });
            }

            const formatado = data.map(u => {
                const perc = calcularCompletude(u);
                const countCand = candCounts[u.user_id] || 0;
                return { ...u, completude: perc, total_candidaturas: countCand };
            });
            setUsuariosList(formatado);
        } catch (err) {
            console.error("Erro usuarios:", err);
        } finally {
            setLoading(false);
        }
    };

    const calcularCompletude = (u) => {
        let pontos = 0;
        if (u.resumo && u.resumo.length > 10) pontos += 25;
        if (u.experiencias && u.experiencias.length > 0) pontos += 35;
        if (u.formacoes && u.formacoes.length > 0) pontos += 20;
        if (u.telefone) pontos += 20;
        return pontos;
    };

    const carregarVagas = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('vagas')
                .select('*, empresas(razao_social), candidaturas(count)')
                .order('created_at', { ascending: false });
            setVagasList(data || []);
        } catch (err) {
            console.error("Erro vagas", err);
        } finally {
            setLoading(false);
        }
    };

    const carregarTodasEmpresas = async () => {
        setLoading(true);
        try {
            const { data: emps } = await supabase.from('empresas').select('*');
            const { data: invs } = await supabase.from('empresa_invites').select('*');
            const combined = [
                ...(emps || []).map(e => ({ ...e, is_invite: false })),
                ...(invs || []).filter(i => i.status === 'pendente').map(i => ({ 
                    id: i.id, razao_social: i.razao_social, cnpj: i.cnpj, 
                    email_contato: i.email, created_at: i.created_at, user_id: null, is_invite: true 
                }))
            ];
            setAllEmpresas(combined.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
        } catch (err) { console.error('Erro empresas:', err); }
        finally { setLoading(false); }
    };

    const carregarMetricas = async () => {
        const { data: candData } = await supabase.from('candidaturas').select('vaga_id, vagas(titulo)');
        if (candData) {
            const counts = {};
            candData.forEach(c => {
                const key = c.vaga_id;
                if (!counts[key]) counts[key] = { titulo: c.vagas?.titulo || 'Sem título', count: 0 };
                counts[key].count++;
            });
            const sorted = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
            setMetrics(prev => ({ ...prev, vagasMaisProcuradas: sorted }));
        }
    };

    const carregarLogs = async () => {
        const { data } = await supabase.from('access_logs').select('*').order('accessed_at', { ascending: false }).limit(100);
        if (data) setAccessLogs(data);
    };

    const carregarLGPD = async () => {
        const { data } = await supabase.from('consent_logs').select('*').order('consented_at', { ascending: false }).limit(100);
        if (data) setConsentLogs(data);
    };

    const carregarDenuncias = async () => {
        const { data } = await supabase.from('denuncias').select('*, vagas(titulo), empresas(razao_social), curriculos(nome, email)').order('created_at', { ascending: false });
        if (data) setDenuncias(data);
    };

    const handleAprovarEmpresa = async (id, status) => {
        await supabase.from('empresas').update({ aprovada: status }).eq('id', id);
        carregarTodasEmpresas();
        notify('Status da empresa atualizado!', 'success');
    };

    const notify = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const handleAcaoVaga = async (vagaId, novaStatus) => {
        if(!confirm(`Mudar status para ${novaStatus}?`)) return;
        await supabase.from('vagas').update({ status: novaStatus }).eq('id', vagaId);
        carregarVagas();
        notify('Vaga atualizada!', 'success');
    };

    const confirmFecharVaga = async () => {
        if (!vagaToClose) return;
        try {
            const { error } = await supabase.from('vagas').update({ status: 'encerrada' }).eq('id', vagaToClose.id);
            if (error) throw error;
            if (relatedDenunciaId) {
                await supabase.from('denuncias').update({ status: 'analisado' }).eq('id', relatedDenunciaId);
                carregarDenuncias();
            }
            carregarVagas();
            setVagaToClose(null);
            notify('Vaga encerrada!', 'success');
        } catch (err) { notify('Erro ao fechar vaga.', 'error'); }
    };

    const confirmDeleteVaga = async () => {
        if (!vagaToDelete) return;
        try {
            const { error } = await supabase.rpc('admin_delete_vaga', { target_vaga_id: vagaToDelete.id });
            if (error) throw error;
            carregarVagas();
            setVagaToDelete(null);
            notify('Vaga excluída!', 'success');
        } catch (err) { notify('Erro ao excluir vaga.', 'error'); }
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            if (userToDelete.is_invite) {
                await supabase.from('empresa_invites').delete().eq('id', userToDelete.id);
            } else {
                const userId = userToDelete.user_id || userToDelete.id;
                const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
                if (error) throw error;
            }
            carregarUsuarios();
            carregarTodasEmpresas();
            setUserToDelete(null);
            notify('Usuário excluído!', 'success');
        } catch (err) { notify('Erro ao excluir usuário.', 'error'); }
    };

    const handleCreateEmpresa = async (e) => {
        e.preventDefault();
        setCreatingEmpresa(true);
        try {
            const { error } = await supabase.from('empresa_invites').insert([{
                email: newEmpresaData.email,
                password_temp: newEmpresaData.password,
                razao_social: newEmpresaData.razao_social,
                cnpj: newEmpresaData.cnpj,
                status: 'pendente'
            }]);
            if (error) throw error;
            setShowNewEmpresaModal(false);
            setNewEmpresaData({ razao_social: '', cnpj: '', email: '', password: '' });
            carregarTodasEmpresas();
            notify('Convite enviado!', 'success');
        } catch (err) { notify('Erro ao criar empresa: ' + err.message, 'error'); }
        finally { setCreatingEmpresa(false); }
    };

    // UI HELPER
    const tabStyle = (id) => ({
        padding: '10px 20px', margin: 0, width: 'auto',
        background: activeTab === id ? 'var(--neon-blue)' : 'transparent',
        color: activeTab === id ? '#000' : 'var(--text-muted)',
        border: '1px solid ' + (activeTab === id ? 'var(--neon-blue)' : 'rgba(255,255,255,0.1)'),
        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
    });

    return (
        <div>
            <Navbar icon={<ShieldAlert size={24} color="var(--neon-purple)" />} title="Painel Administrativo" subtitle="[Visão Global]">
                <button onClick={() => { supabase.auth.signOut(); navigate('/'); }} className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', width: 'auto' }}>
                    <LogOut size={16} style={{ display: 'inline', marginRight: '5px' }} /> SAIR
                </button>
            </Navbar>

            <div className="container" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} className="neon-button" style={tabStyle(t.id)}>
                            <t.icon size={16} /> {t.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'visao' && (
                    <div className="glass-panel animation-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>📊 Dashboard de Performance</h2>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.1)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.3)' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e', animation: 'pulse 2s infinite' }}></div>
                                    <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.9rem' }}>{ativosAgora} Simultâneos</span>
                                </div>

                                <select className="neon-input" value={diasFiltro} onChange={e => setDiasFiltro(Number(e.target.value))} style={{ width: 'auto', marginBottom: 0, padding: '8px 16px', height: 'auto' }}>
                                    <option value={1}>Hoje</option>
                                    <option value={3}>Últimos 3 dias</option>
                                    <option value={7}>Últimos 7 dias</option>
                                    <option value={14}>Últimos 14 dias</option>
                                    <option value={30}>Últimos 30 dias</option>
                                </select>
                            </div>
                        </div>

                        {loading ? <p>Carregando métricas...</p> : (
                            <>
                                {/* STATS GLOBAIS (ESTILO ANTIGO MELHORADO) */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                    <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)', textAlign: 'center' }}>
                                        <div style={{ color: 'var(--neon-blue)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Total Candidatos</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.candidatos}</div>
                                    </div>
                                    <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)', textAlign: 'center' }}>
                                        <div style={{ color: 'var(--neon-purple)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Parceiros</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.empresas}</div>
                                    </div>
                                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)', textAlign: 'center' }}>
                                        <div style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Perfis Salvos</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.perfisCompletos}</div>
                                    </div>
                                    <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.2)', textAlign: 'center' }}>
                                        <div style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Vagas Ativas</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>{vagasList.filter(v => v.status === 'aberta').length}</div>
                                    </div>
                                </div>

                                {/* FUNIL */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                    <div className="metric-card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                        <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Visitas Únicas</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b' }}>{metricasFunil?.visitas || 0}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowRight color="#94a3b8" /></div>
                                    
                                    <div className="metric-card" style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #bae6fd', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                        <div style={{ color: '#0369a1', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Logins (Contas)</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0284c7' }}>{metricasFunil?.logins || 0}</div>
                                        {metricasFunil?.visitas > 0 && (
                                            <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, marginTop: '5px' }}>
                                                Conversão: {Math.round((metricasFunil.logins / metricasFunil.visitas) * 100)}%
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowRight color="#94a3b8" /></div>

                                    <div className="metric-card" style={{ background: '#f5f3ff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ddd6fe', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                        <div style={{ color: '#6d28d9', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>CVs Completos</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#7c3aed' }}>{metricasFunil?.curriculos_completos || 0}</div>
                                        {metricasFunil?.logins > 0 && (
                                            <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, marginTop: '5px' }}>
                                                Engajamento: {Math.round((metricasFunil.curriculos_completos / metricasFunil.logins) * 100)}%
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* RETENCAO E ATIVOS */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                                    <div style={{ background: '#fffbeb', padding: '1.5rem', borderRadius: '12px', border: '1px solid #fef3c7', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                        <div style={{ background: '#fef3c7', padding: '15px', borderRadius: '12px' }}><Clock color="#d97706" size={32} /></div>
                                        <div>
                                            <p style={{ margin: 0, color: '#92400e', fontSize: '0.85rem', fontWeight: 600 }}>DAU (Contas Ativas Diárias)</p>
                                            <h3 style={{ margin: '5px 0 0', fontSize: '1.8rem', color: '#78350f' }}>{metricasTempo?.dau || 0}</h3>
                                        </div>
                                    </div>
                                    <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '12px', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                        <div style={{ background: '#dcfce7', padding: '15px', borderRadius: '12px' }}><Activity color="#16a34a" size={32} /></div>
                                        <div>
                                            <p style={{ margin: 0, color: '#166534', fontSize: '0.85rem', fontWeight: 600 }}>WAU (Contas Ativas Semanais)</p>
                                            <h3 style={{ margin: '5px 0 0', fontSize: '1.8rem', color: '#14532d' }}>{metricasTempo?.wau || 0}</h3>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'usuarios' && (
                    <div className="glass-panel animation-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>👥 Base de Candidatos</h2>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filtrar / Ordenar:</span>
                                <button onClick={() => {
                                    const sorter = [...usuariosList].sort((a,b) => a.total_candidaturas - b.total_candidaturas);
                                    setUsuariosList(sorter);
                                }} className="neon-button secondary" style={{ margin: 0, padding: '6px 14px', width: 'auto', fontSize: '0.8rem' }}>
                                    Menos Inscritos
                                </button>
                                <button onClick={() => {
                                    const sorter = [...usuariosList].sort((a,b) => b.total_candidaturas - a.total_candidaturas);
                                    setUsuariosList(sorter);
                                }} className="neon-button secondary" style={{ margin: 0, padding: '6px 14px', width: 'auto', fontSize: '0.8rem' }}>
                                    Mais Inscritos
                                </button>
                                <button onClick={carregarUsuarios} className="neon-button error" style={{ margin: 0, padding: '6px 14px', width: 'auto', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    Resetar
                                </button>
                            </div>
                        </div>

                        {loading ? <p>Carregando usuários...</p> : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                <thead style={{ background: '#f8fafc', color: '#475569' }}>
                                    <tr>
                                        <th style={{ padding: '15px' }}>Nome</th>
                                        <th style={{ padding: '15px' }}>Contato</th>
                                        <th style={{ padding: '15px' }}>Vagas Inscritas</th>
                                        <th style={{ padding: '15px' }}>Completude</th>
                                        <th style={{ padding: '15px' }}>Último Acesso</th>
                                        <th style={{ padding: '15px' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuariosList.map(u => (
                                        <tr key={u.user_id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <td style={{ padding: '15px', fontWeight: 600 }}>{u.nome}</td>
                                            <td style={{ padding: '15px', color: '#64748b' }}>{u.email}<br/>{u.telefone}</td>
                                            <td style={{ padding: '15px' }}>
                                                <span style={{ 
                                                    padding: '4px 10px', 
                                                    borderRadius: '20px', 
                                                    fontSize: '0.85rem', 
                                                    fontWeight: 700,
                                                    background: u.total_candidaturas === 0 ? '#fee2e2' : '#f0f9ff',
                                                    color: u.total_candidaturas === 0 ? '#ef4444' : '#0284c7'
                                                }}>
                                                    {u.total_candidaturas} {u.total_candidaturas === 1 ? 'vaga' : 'vagas'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '100px', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${u.completude}%`, height: '100%', background: u.completude >= 80 ? '#22c55e' : (u.completude >= 40 ? '#eab308' : '#ef4444') }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{u.completude}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '15px', color: '#64748b' }}>{new Date(u.ultimo_acesso).toLocaleDateString()}</td>
                                            <td style={{ padding: '15px', gap: '8px', display: 'flex' }}>
                                                <button onClick={() => navigate(`/cv-preview/${u.user_id}`)} className="neon-button secondary" style={{ margin: 0, padding: '6px 12px', fontSize: '0.75rem', width: 'auto' }}>Ver CV</button>
                                                <button className="neon-button error" style={{ margin: 0, padding: '6px 12px', fontSize: '0.75rem', width: 'auto', background: '#fee2e2', color: '#ef4444', border: '1px solid #ef4444' }}>Bloquear</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'vagas' && (
                    <div className="glass-panel animation-fade-in">
                        <h2 style={{ color: 'var(--neon-blue)', marginBottom: '1.5rem' }}>💼 Gerenciamento de Vagas</h2>
                        {loading ? <p>Carregando vagas...</p> : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <tr>
                                        <th style={{ padding: '12px' }}>Empresa / Vaga</th>
                                        <th style={{ padding: '12px' }}>Publicada em</th>
                                        <th style={{ padding: '12px' }}>Status</th>
                                        <th style={{ padding: '12px' }}>Candidatos</th>
                                        <th style={{ padding: '12px' }}>Ações Administrativas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vagasList.map(v => (
                                        <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '12px' }}>
                                                <strong>{v.empresas?.razao_social || 'Desconhecida'}</strong>
                                                <div style={{ color: 'var(--text-muted)' }}>{v.titulo}</div>
                                            </td>
                                            <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{new Date(v.created_at).toLocaleDateString()}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', 
                                                    background: v.status === 'aberta' ? 'rgba(0,240,255,0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: v.status === 'aberta' ? 'var(--neon-blue)' : '#ef4444' }}>
                                                    {v.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{v.candidaturas?.[0]?.count || 0}</td>
                                            <td style={{ padding: '12px', gap: '8px', display: 'flex' }}>
                                                {v.status === 'aberta' ? (
                                                    <button onClick={() => handleAcaoVaga(v.id, 'suspensa')} className="neon-button secondary" style={{ margin: 0, padding: '4px 10px', fontSize: '0.75rem', width: 'auto' }}>Suspender Vaga</button>
                                                ) : (
                                                    <button onClick={() => handleAcaoVaga(v.id, 'aberta')} className="neon-button secondary" style={{ margin: 0, padding: '4px 10px', fontSize: '0.75rem', width: 'auto' }}>Reabrir</button>
                                                )}
                                                <button className="neon-button error" style={{ margin: 0, padding: '4px 10px', fontSize: '0.75rem', width: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444' }}><Trash2 size={12}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'automacao' && (
                    <div className="glass-panel animation-fade-in">
                        <h2 style={{ color: 'var(--neon-purple)', marginBottom: '1.5rem' }}>⚡ Central de Automação e Campanhas</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Acione disparos de e-mail manuais baseados em gatilhos específicos da plataforma.</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '12px' }}>
                                <h3>📉 Campanha: "Complete seu Perfil"</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', minHeight: '60px' }}>
                                    Envia um e-mail de lembrete engajador para todos na base (que já aceitaram e-mails) que estão com o currículo com completude menor que 80%.
                                </p>
                                <button className="neon-button" style={{ background: 'var(--neon-purple)', color: '#fff', width: '100%' }}>DISPARAR CAMPANHA AGORA</button>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '12px' }}>
                                <h3>🚀 Alerta: "Novas Vagas"</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', minHeight: '60px' }}>
                                    Envia um boletim (newsletter) com as últimas 3 vagas abertas na plataforma para os candidatos que não logaram nos últimos 7 dias.
                                </p>
                                <button className="neon-button" style={{ background: 'var(--neon-blue)', color: '#000', width: '100%' }}>MONTAR E DISPARAR</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'empresas' && (
                    <div className="glass-panel animation-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>🏢 Gerenciar Parceiros</h2>
                            <button onClick={() => setShowNewEmpresaModal(true)} className="neon-button" style={{ margin: 0, padding: '8px 16px', width: 'auto' }}>
                                <Plus size={16} /> NOVO PERFIL
                            </button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '12px' }}>Empresa</th>
                                    <th style={{ padding: '12px' }}>CNPJ</th>
                                    <th style={{ padding: '12px' }}>Contato</th>
                                    <th style={{ padding: '12px' }}>Status</th>
                                    <th style={{ padding: '12px' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allEmpresas.map(emp => (
                                    <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '12px' }}>
                                            <strong>{emp.razao_social}</strong>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Desde: {new Date(emp.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{ padding: '12px' }}>{emp.cnpj || '—'}</td>
                                        <td style={{ padding: '12px' }}>{emp.email_contato || '—'}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{ 
                                                padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem',
                                                background: emp.user_id ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                                color: emp.user_id ? '#4ade80' : '#fbbf24'
                                            }}>
                                                {emp.user_id ? 'ATIVO' : 'PENDENTE'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleAprovarEmpresa(emp.id, !emp.aprovada)} className="neon-button secondary" style={{ margin: 0, padding: '4px 8px', fontSize: '0.7rem', width: 'auto' }}>
                                                {emp.aprovada ? 'Bloquear' : 'Aprovar'}
                                            </button>
                                            <button onClick={() => setUserToDelete(emp)} className="neon-button error" style={{ margin: 0, padding: '4px 8px', fontSize: '0.7rem', width: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444' }}>
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'metricas' && (
                    <div className="glass-panel animation-fade-in">
                        <h2 style={{ color: 'var(--neon-blue)', marginBottom: '2rem' }}>📊 Inteligência de Dados</h2>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Top 5 Vagas Mais Procuradas</h3>
                            {metrics.vagasMaisProcuradas.map((m, i) => {
                                const max = metrics.vagasMaisProcuradas[0]?.count || 1;
                                const pct = (m.count / max) * 100;
                                return (
                                    <div key={i} style={{ marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '5px' }}>
                                            <span>{m.titulo}</span>
                                            <strong>{m.count} candidaturas</strong>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--neon-blue)', borderRadius: '4px' }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="glass-panel animation-fade-in">
                        <h2 style={{ color: 'var(--neon-blue)', marginBottom: '1.5rem' }}>🔐 Log de Auditoria</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '12px' }}>Usuário</th>
                                    <th style={{ padding: '12px' }}>Ação</th>
                                    <th style={{ padding: '12px' }}>Data/Hora</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accessLogs.map(l => (
                                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '12px' }}>{l.email.toLowerCase()}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{ color: '#4ade80' }}>{l.action.toUpperCase()}</span>
                                        </td>
                                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{new Date(l.accessed_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'lgpd' && (
                    <div className="glass-panel animation-fade-in">
                        <h2 style={{ color: 'var(--neon-blue)', marginBottom: '1.5rem' }}>🛡️ Privacidade LGPD</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '12px' }}>Usuário</th>
                                    <th style={{ padding: '12px' }}>Consentimento</th>
                                    <th style={{ padding: '12px' }}>Data Aceite</th>
                                </tr>
                            </thead>
                            <tbody>
                                {consentLogs.map(l => (
                                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '12px' }}>{l.email.toLowerCase()}</td>
                                        <td style={{ padding: '12px' }}>
                                            {l.accepted_terms ? <span style={{color: '#4ade80'}}>ACEITO</span> : <span style={{color: '#ef4444'}}>RESTRITO</span>}
                                        </td>
                                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{new Date(l.consented_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'denuncias' && (
                    <div className="glass-panel animation-fade-in">
                        <h2 style={{ color: '#f87171', marginBottom: '1.5rem' }}>🚨 Ouvidoria / Denúncias</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '12px' }}>Vaga / Empresa</th>
                                    <th style={{ padding: '12px' }}>Motivo</th>
                                    <th style={{ padding: '12px' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {denuncias.length === 0 ? (
                                    <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center' }}>Nenhuma denúncia no momento. ✨</td></tr>
                                ) : denuncias.map(d => (
                                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '12px' }}>
                                            <strong>{d.vagas?.titulo}</strong><br/>
                                            {d.empresas?.razao_social}
                                        </td>
                                        <td style={{ padding: '12px', color: '#fda4af' }}>"{d.motivo}"</td>
                                        <td style={{ padding: '12px' }}>
                                            <button onClick={() => { setVagaToClose(d.vagas); setRelatedDenunciaId(d.id); }} className="neon-button error" style={{ margin: 0, padding: '6px 12px', width: 'auto', fontSize: '0.8rem' }}>Suspender Vaga</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL NOVO PARCEIRO */}
            {showNewEmpresaModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="glass-panel" style={{ maxWidth: '450px', width: '90%', padding: '2.5rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Novo Parceiro Contratante</h3>
                        <form onSubmit={handleCreateEmpresa}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Razão Social</label>
                                <input className="neon-input" required value={newEmpresaData.razao_social} onChange={e => setNewEmpresaData({...newEmpresaData, razao_social: e.target.value})} />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CNPJ</label>
                                <input className="neon-input" value={newEmpresaData.cnpj} onChange={e => setNewEmpresaData({...newEmpresaData, cnpj: e.target.value})} />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>E-mail de Acesso</label>
                                <input type="email" className="neon-input" required value={newEmpresaData.email} onChange={e => setNewEmpresaData({...newEmpresaData, email: e.target.value})} />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Senha Inicial</label>
                                <input type="password" title="Defina a senha que a empresa usar├í para o primeiro login" className="neon-input" required value={newEmpresaData.password} onChange={e => setNewEmpresaData({...newEmpresaData, password: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => setShowNewEmpresaModal(false)} className="neon-button secondary" style={{ margin: 0 }}>CANCELAR</button>
                                <button type="submit" disabled={creatingEmpresa} className="neon-button" style={{ margin: 0, background: 'var(--neon-purple)' }}>
                                    {creatingEmpresa ? 'CRIANDO...' : 'CRIAR PERFIL'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMAÇÃO EXCLUSÃO USUÁRIO */}
            {userToDelete && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', textAlign: 'center' }}>
                        <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
                        <h3>Excluir Usuário permanentemente?</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Esta ação é irreversível e apagará todos os dados vinculados.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setUserToDelete(null)} className="neon-button secondary" style={{ margin: 0 }}>CANCELAR</button>
                            <button onClick={confirmDeleteUser} className="neon-button error" style={{ margin: 0, background: '#ef4444', color: '#fff' }}>EXCLUIR AGORA</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMAÇÃO EXCLUSÃO VAGA */}
            {vagaToDelete && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', textAlign: 'center' }}>
                        <Trash2 size={48} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
                        <h3>Excluir Vaga definitivamente?</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Todas as candidaturas ligadas a esta vaga serão removidas.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setVagaToDelete(null)} className="neon-button secondary" style={{ margin: 0 }}>CANCELAR</button>
                            <button onClick={confirmDeleteVaga} className="neon-button error" style={{ margin: 0, background: '#ef4444', color: '#fff' }}>EXCLUIR VAGA</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SUSPENDER VAGA (VIA DENÚNCIA) */}
            {vagaToClose && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', textAlign: 'center' }}>
                        <AlertTriangle size={48} color="#fbbf24" style={{ marginBottom: '1.5rem' }} />
                        <h3>Suspender Publicação?</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>A vaga será ocultada para revisão.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setVagaToClose(null)} className="neon-button secondary" style={{ margin: 0 }}>CANCELAR</button>
                            <button onClick={confirmFecharVaga} className="neon-button" style={{ margin: 0, background: '#fbbf24', color: '#000' }}>SUSPENDER</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST NOTIFICATION */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    background: notification.type === 'success' ? '#22c55e' : '#ef4444',
                    color: '#fff', padding: '1rem 2rem', borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    zIndex: 10001, animation: 'slideInRight 0.4s ease-out'
                }}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <ShieldAlert size={20} />}
                    <span style={{ fontWeight: 600 }}>{notification.message}</span>
                </div>
            )}

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
