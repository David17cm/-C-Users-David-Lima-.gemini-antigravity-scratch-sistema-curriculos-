import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut, Users, Building, Plus, Briefcase, BarChart2, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import Navbar from '../components/layout/Navbar';

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ candidatos: 0, empresas: 0, vagas: 0, candidaturas: 0, receitaTotal: 0, usuariosAtivos: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [usuarios, setUsuarios] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [vagas, setVagas] = useState([]);
    const [metrics, setMetrics] = useState({ registrosPorSemana: [], vagasMaisProcuradas: [] });

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [inviteMessage, setInviteMessage] = useState(null);
    const [vagaToClose, setVagaToClose] = useState(null);

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => {
        if (activeTab === 'usuarios') fetchUsuarios();
        if (activeTab === 'empresas') fetchEmpresas();
        if (activeTab === 'vagas') fetchTodasVagas();
        if (activeTab === 'metricas') fetchMetrics();
    }, [activeTab]);

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const [
                { count: cand },
                { count: emp },
                { count: vagasCount },
                { count: candCount },
                { data: transData },
                { count: totalUsers }
            ] = await Promise.all([
                supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'candidato'),
                supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'empresa'),
                supabase.from('vagas').select('*', { count: 'exact', head: true }),
                supabase.from('candidaturas').select('*', { count: 'exact', head: true }),
                supabase.from('transacoes').select('valor'),
                supabase.from('user_roles').select('*', { count: 'exact', head: true }),
            ]);

            const totalReceita = transData?.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0) || 0;

            setStats({
                candidatos: cand || 0,
                empresas: emp || 0,
                vagas: vagasCount || 0,
                candidaturas: candCount || 0,
                receitaTotal: totalReceita,
                usuariosAtivos: totalUsers || 0
            });
        } catch (e) { console.error(e); }
        finally { setLoadingStats(false); }
    };

    const fetchUsuarios = async () => {
        const { data } = await supabase
            .from('user_roles')
            .select('user_id, role, pago, created_at');
        if (data) setUsuarios(data);
    };

    const fetchEmpresas = async () => {
        const { data } = await supabase.from('empresas').select('*').order('created_at', { ascending: false });
        if (data) setEmpresas(data);
    };

    const handleAprovarEmpresa = async (id, status) => {
        await supabase.from('empresas').update({ aprovada: status }).eq('id', id);
        setEmpresas(prev => prev.map(e => e.id === id ? { ...e, aprovada: status } : e));
    };

    const fetchTodasVagas = async () => {
        const { data } = await supabase
            .from('vagas')
            .select('*, empresas(razao_social)')
            .order('created_at', { ascending: false });
        if (data) setVagas(data);
    };

    const fetchMetrics = async () => {
        // Vagas mais procuradas
        const { data: candData } = await supabase
            .from('candidaturas')
            .select('vaga_id, vagas(titulo)');

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

    const handleFecharVagaAdmin = (vagaId) => {
        setVagaToClose(vagaId);
    };

    const confirmFecharVagaAdmin = async () => {
        if (!vagaToClose) return;
        await supabase.from('vagas').update({ status: 'fechada' }).eq('id', vagaToClose);
        setVagas(prev => prev.map(v => v.id === vagaToClose ? { ...v, status: 'fechada' } : v));
        setVagaToClose(null);
    };

    const handleExportarCSV = async () => {
        const { data } = await supabase.from('curriculos').select('nome, email, telefone');
        if (!data || data.length === 0) { alert('Nenhum candidato com currículo para exportar.'); return; }
        const header = 'Nome,Email,Telefone\n';
        const rows = data.map(c => `"${c.nome || ''}","${c.email || ''}","${c.telefone || ''}"`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `candidatos_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviting(true);
        setInviteMessage(null);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: inviteEmail,
                options: { emailRedirectTo: `${window.location.origin}/`, shouldCreateUser: true }
            });
            if (error) throw error;
            setInviteMessage({ type: 'success', text: 'Convite enviado com sucesso!' });
            setInviteEmail('');
        } catch (error) {
            setInviteMessage({ type: 'error', text: 'Erro: ' + error.message });
        } finally { setInviting(false); }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const statCards = [
        { label: 'Candidatos', value: stats.candidatos, color: 'var(--neon-blue)', icon: <Users size={28} color="var(--neon-blue)" /> },
        { label: 'Empresas', value: stats.empresas, color: 'var(--neon-purple)', icon: <Building size={28} color="var(--neon-purple)" /> },
        // { label: 'Receita Total', value: `R$ ${stats.receitaTotal.toFixed(2)}`, color: '#00ff88', icon: <BarChart2 size={28} color="#00ff88" /> },
        { label: 'Usuários Ativos', value: stats.usuariosAtivos, color: '#f59e0b', icon: <Users size={28} color="#f59e0b" /> },
    ];

    const tabStyle = (t) => ({
        margin: 0, padding: '8px 18px', width: 'auto',
        ...(activeTab === t ? {} : { background: 'none', color: 'var(--text-muted)', border: '1px solid transparent' })
    });

    return (
        <div>
            <Navbar icon={<Shield size={24} />} title="PAINEL ADMINISTRATIVO">
                <button onClick={handleLogout} className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', width: 'auto' }}>
                    <LogOut size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> SAIR
                </button>
            </Navbar>

            <div className="container" style={{ marginTop: '2rem' }}>
                {/* Abas */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    {[['overview', '📊 Visão Geral'], ['usuarios', '👥 Usuários'], ['empresas', '🏢 Empresas'], ['vagas', '💼 Vagas'], ['metricas', '📈 Métricas']].map(([key, label]) => (
                        <button key={key} onClick={() => setActiveTab(key)} className="neon-button secondary" style={tabStyle(key)}>{label}</button>
                    ))}
                </div>

                {/* === ABA: VISÃO GERAL === */}
                {activeTab === 'overview' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                            {statCards.map(({ label, value, icon }) => (
                                <div key={label} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
                                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>{icon}</div>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>{label}</p>
                                        <h2 style={{ fontSize: '2rem', margin: 0 }}>
                                            {loadingStats ? <Skeleton width="60px" height="32px" /> : value}
                                        </h2>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Convidar empresa */}
                        <div className="glass-panel">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                <Plus size={20} color="var(--neon-blue)" /> Adicionar Nova Empresa
                            </h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Envie um convite por e-mail (Magic Link) para o representante da empresa.</p>
                            <form onSubmit={handleInvite} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) auto', gap: '1rem', alignItems: 'end' }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label>E-mail do Representante</label>
                                    <input type="email" className="neon-input" placeholder="rh@empresa.com.br" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                                </div>
                                <button type="submit" disabled={inviting} className="neon-button" style={{ margin: 0, height: '48px' }}>
                                    {inviting ? 'ENVIANDO...' : 'ENVIAR CONVITE'}
                                </button>
                            </form>
                            {inviteMessage && (
                                <div style={{ marginTop: '1rem', padding: '0.8rem', borderRadius: '8px', backgroundColor: inviteMessage.type === 'error' ? 'rgba(255,68,68,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${inviteMessage.type === 'error' ? '#ff4444' : '#22c55e'}`, color: inviteMessage.type === 'error' ? '#ff4444' : '#22c55e' }}>
                                    {inviteMessage.text}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* === ABA: USUÁRIOS === */}
                {activeTab === 'usuarios' && (
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ margin: 0 }}>Todos os Usuários</h3>
                            <button onClick={handleExportarCSV} className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Download size={16} /> EXPORTAR CSV
                            </button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                <tr>
                                    <th style={{ padding: '1rem' }}>ID do Usuário</th>
                                    <th style={{ padding: '1rem' }}>Role</th>
                                    <th style={{ padding: '1rem' }}>Cadastrado em</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map(u => (
                                    <tr key={u.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.user_id}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '10px', background: u.role === 'admin' ? 'rgba(181,53,246,0.2)' : u.role === 'empresa' ? 'rgba(0,240,255,0.1)' : 'rgba(34,197,94,0.1)', color: u.role === 'admin' ? 'var(--neon-purple)' : u.role === 'empresa' ? 'var(--neon-blue)' : '#22c55e' }}>
                                                {u.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {/* {u.role === 'candidato' && (
                                                <span style={{ fontSize: '0.75rem', color: u.pago ? '#00ff88' : '#ff4444' }}>
                                                    {u.pago ? '✅ PAGO' : '❌ PENDENTE'}
                                                </span>
                                            )} */}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* === ABA: EMPRESAS === */}
                {activeTab === 'empresas' && (
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ margin: 0 }}>Gerenciar Empresas</h3>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                <tr>
                                    <th style={{ padding: '1rem' }}>Empresa</th>
                                    <th style={{ padding: '1rem' }}>CNPJ</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                    <th style={{ padding: '1rem' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {empresas.map(e => (
                                    <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 'bold' }}>{e.razao_social}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{e.user_id}</div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{e.cnpj}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '10px', background: e.aprovada ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: e.aprovada ? '#22c55e' : '#f59e0b' }}>
                                                {e.aprovada ? 'APROVADA' : 'PENDENTE'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button onClick={() => handleAprovarEmpresa(e.id, !e.aprovada)}
                                                className="neon-button secondary" style={{ margin: 0, padding: '5px 12px', fontSize: '0.75rem', width: 'auto', borderColor: e.aprovada ? '#ff4444' : '#00ff88', color: e.aprovada ? '#ff4444' : '#00ff88' }}>
                                                {e.aprovada ? 'BLOQUEAR' : 'APROVAR'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* === ABA: VAGAS === */}
                {activeTab === 'vagas' && (
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ margin: 0 }}>Todas as Vagas</h3>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                <tr>
                                    <th style={{ padding: '1rem' }}>Vaga</th>
                                    <th style={{ padding: '1rem' }}>Empresa</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                    <th style={{ padding: '1rem' }}>Data</th>
                                    <th style={{ padding: '1rem' }}>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vagas.map(v => (
                                    <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: v.status === 'fechada' ? 0.6 : 1 }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{v.titulo}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{v.empresas?.razao_social}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '10px', background: v.status === 'aberta' ? 'rgba(0,240,255,0.1)' : 'rgba(255,68,68,0.1)', color: v.status === 'aberta' ? 'var(--neon-blue)' : '#ff4444' }}>
                                                {v.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(v.created_at).toLocaleDateString('pt-BR')}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <button onClick={() => handleFecharVagaAdmin(v.id)} disabled={v.status === 'fechada'} className="neon-button secondary" style={{ margin: 0, padding: '5px 12px', fontSize: '0.75rem', width: 'auto', opacity: v.status === 'fechada' ? 0.5 : 1 }}>
                                                {v.status === 'fechada' ? 'Encerrada' : 'Fechar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* === ABA: MÉTRICAS === */}
                {activeTab === 'metricas' && (
                    <div style={{ display: 'grid', gap: '2rem' }}>
                        {/* Cards de totais */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            {statCards.map(({ label, value, icon }) => (
                                <div key={label} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
                                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>{icon}</div>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>{label}</p>
                                        <h2 style={{ fontSize: '2rem', margin: 0 }}>{loadingStats ? '…' : value}</h2>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Vagas mais procuradas */}
                        <div className="glass-panel">
                            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <BarChart2 size={20} color="var(--neon-blue)" /> Vagas Mais Procuradas
                            </h3>
                            {metrics.vagasMaisProcuradas.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Nenhuma candidatura registrada ainda.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {metrics.vagasMaisProcuradas.map((item, i) => {
                                        const maxCount = metrics.vagasMaisProcuradas[0].count;
                                        const pct = Math.round((item.count / maxCount) * 100);
                                        return (
                                            <div key={i}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                                                    <span>{item.titulo}</span>
                                                    <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold' }}>{item.count} candidatura{item.count !== 1 ? 's' : ''}</span>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--neon-blue), var(--neon-purple))', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Botão exportar */}
                        <div className="glass-panel" style={{ textAlign: 'center' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Exportar Dados</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Baixe a lista de candidatos com currículo cadastrado.</p>
                            <button onClick={handleExportarCSV} className="neon-button" style={{ width: 'auto', minWidth: '250px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: '0 auto' }}>
                                <Download size={18} /> EXPORTAR CSV DE CANDIDATOS
                            </button>
                        </div>
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
                            A empresa não receberá novos currículos. Esta ação pode ser desfeita posteriormente.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setVagaToClose(null)} className="neon-button secondary" style={{ margin: 0, width: 'auto' }}>CANCELAR</button>
                            <button onClick={confirmFecharVagaAdmin} className="neon-button error" style={{ margin: 0, width: 'auto', background: 'rgba(239, 68, 68, 0.2)', color: '#ff4444', borderColor: '#ff4444' }}>SIM, FECHAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
