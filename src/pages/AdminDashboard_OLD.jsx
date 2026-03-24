import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut, Users, Building, Plus, Briefcase, BarChart2, Download, FileCheck, Clock, AlertTriangle, LayoutDashboard, Database, ListChecks, CheckCircle, XCircle, Send, Mail, Lock, Menu, X, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import Navbar from '../components/layout/Navbar';
import HealthCheck from '../components/ui/HealthCheck';

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ candidatos: 0, empresas: 0, vagas: 0, candidaturas: 0, receitaTotal: 0, usuariosAtivos: 0, perfisCompletos: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [usuarios, setUsuarios] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [vagas, setVagas] = useState([]);
    const [metrics, setMetrics] = useState({ registrosPorSemana: [], vagasMaisProcuradas: [] });
    const [registrationData, setRegistrationData] = useState([]);
    const [chartPeriod, setChartPeriod] = useState(7); // default 7 days
    const [customDates, setCustomDates] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [inviteMessage, setInviteMessage] = useState(null);
    const [vagaToClose, setVagaToClose] = useState(null);
    const [relatedDenunciaId, setRelatedDenunciaId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [vagaToDelete, setVagaToDelete] = useState(null);
    const [accessLogs, setAccessLogs] = useState([]);
    const [consentLogs, setConsentLogs] = useState([]);
    const [denuncias, setDenuncias] = useState([]);
    const [allEmpresas, setAllEmpresas] = useState([]);
    const [showNewEmpresaModal, setShowNewEmpresaModal] = useState(false);
    const [newEmpresaData, setNewEmpresaData] = useState({ razao_social: '', cnpj: '', email: '', password: '' });
    const [creatingEmpresa, setCreatingEmpresa] = useState(false);
    const [notification, setNotification] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState('todos'); // 'todos', 'completos', 'incompletos'
    const [searchTerm, setSearchTerm] = useState('');

    // Helper para notifica├º├Áes premium
    const notify = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    useEffect(() => { fetchStats(); fetchRegistrationData(); }, []);
    useEffect(() => { fetchRegistrationData(); }, [chartPeriod, customDates]);

    const fetchAllEmpresas = async () => {
        try {
            // Buscamos tanto as empresas j├í ativas quanto os convites pendentes
            const { data: emps } = await supabase.from('empresas').select('*');
            const { data: invs } = await supabase.from('empresa_invites').select('*');
            
            // Unificamos para exibi├º├úo
            const combined = [
                ...(emps || []).map(e => ({ ...e, is_invite: false })),
                ...(invs || []).filter(i => i.status === 'pendente').map(i => ({ 
                    id: i.id, 
                    razao_social: i.razao_social, 
                    cnpj: i.cnpj, 
                    email_contato: i.email, 
                    created_at: i.created_at,
                    user_id: null,
                    is_invite: true 
                }))
            ];
            setAllEmpresas(combined.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
        } catch (err) { console.error('Erro ao buscar empresas:', err); }
    };

    useEffect(() => {
        if (activeTab === 'usuarios') fetchUsuarios();
        if (activeTab === 'empresas') fetchAllEmpresas();
        if (activeTab === 'vagas') fetchTodasVagas();
        if (activeTab === 'metricas') fetchMetrics();
        if (activeTab === 'logs') fetchAccessLogs();
        if (activeTab === 'lgpd') fetchConsentLogs();
        if (activeTab === 'denuncias') fetchDenuncias();
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
                { count: totalUsers },
                { count: completedCount }
            ] = await Promise.all([
                supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'candidato'),
                supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'empresa'),
                supabase.from('vagas').select('*', { count: 'exact', head: true }),
                supabase.from('candidaturas').select('*', { count: 'exact', head: true }),
                supabase.from('transacoes').select('valor'),
                supabase.from('user_roles').select('*', { count: 'exact', head: true }),
                supabase.from('curriculos').select('*', { count: 'exact', head: true }),
            ]);

            const totalReceita = transData?.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0) || 0;

            setStats({
                candidatos: cand || 0,
                empresas: emp || 0,
                vagas: vagasCount || 0,
                candidaturas: candCount || 0,
                receitaTotal: totalReceita,
                usuariosAtivos: totalUsers || 0,
                perfisCompletos: completedCount || 0
            });
        } catch (e) { console.error(e); }
        finally { setLoadingStats(false); }
    };

    const fetchUsuarios = async () => {
        try {
            const { data: rolesData, error: rolesError } = await supabase
                .from('user_roles')
                .select('user_id, role, pago, created_at')
                .order('created_at', { ascending: false });

            if (rolesError) throw rolesError;
            if (!rolesData) return;

            const { data: cvData } = await supabase.from('curriculos').select('user_id, nome, email, telefone');
            const { data: empData } = await supabase.from('empresas').select('user_id, razao_social');

            const cvMap = new Map((cvData || []).map(cv => [cv.user_id, { nome: cv.nome, email: cv.email, telefone: cv.telefone }]));
            const empMap = new Map((empData || []).map(e => [e.user_id, e.razao_social]));

            const usuariosTratados = rolesData.map(u => {
                let nomeDisplay = 'Perfil Incompleto';
                let emailDisplay = 'N├úo informado';
                let telefoneDisplay = 'N/A';

                if (u.role === 'candidato' && cvMap.has(u.user_id)) {
                    const cvInfo = cvMap.get(u.user_id);
                    nomeDisplay = cvInfo.nome;
                    emailDisplay = cvInfo.email;
                    telefoneDisplay = cvInfo.telefone || 'N/A';
                } else if (u.role === 'empresa' && empMap.has(u.user_id)) {
                    nomeDisplay = empMap.get(u.user_id);
                } else if (u.role === 'admin') {
                    nomeDisplay = 'Administrador';
                }

                const isComplete = u.role === 'candidato' ? cvMap.has(u.user_id) : true;

                return { ...u, nome_display: nomeDisplay, email_display: emailDisplay, telefone_display: telefoneDisplay, status_perfil: isComplete ? 'completo' : 'incompleto' };
            });

            setUsuarios(usuariosTratados);
        } catch (err) { console.error(err); }
    };

    const handleExportarCSV = async () => {
        try {
            const { data, error } = await supabase.from('curriculos').select('nome, email, telefone, cidade, bairro, perfil_disc');
            if (error) throw error;
            if (!data || data.length === 0) {
                notify('Nenhum candidato encotrado.', 'error');
                return;
            }

            const headers = ['Nome', 'Email', 'Telefone', 'Cidade', 'Bairro', 'Perfil DISC'];
            const rows = data.map(c => [
                `"${c.nome || ''}"`,
                `"${c.email || ''}"`,
                `"${c.telefone || ''}"`,
                `"${c.cidade || ''}"`,
                `"${c.bairro || ''}"`,
                `"${c.perfil_disc || ''}"`
            ]);

            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
            const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
            
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `Candidatos_OFC_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            notify('Planilha exportada com sucesso!', 'success');
        } catch (err) {
            console.error(err);
            notify('Erro ao exportar CSV: ' + err.message, 'error');
        }
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
        const { data } = await supabase.from('vagas').select('*, empresas(razao_social)').order('created_at', { ascending: false });
        if (data) setVagas(data);
    };

    const fetchMetrics = async () => {
        const { data: candData } = await supabase.from('candidaturas').select('vaga_id, vagas(titulo)');
        if (candData) {
            const counts = {};
            candData.forEach(c => {
                const key = c.vaga_id;
                if (!counts[key]) counts[key] = { titulo: c.vagas?.titulo || 'Sem t├¡tulo', count: 0 };
                counts[key].count++;
            });
            const sorted = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
            setMetrics(prev => ({ ...prev, vagasMaisProcuradas: sorted }));
        }
    };

    const handleFecharVaga = (vaga, denunciaId = null) => {
        setVagaToClose(vaga);
        setRelatedDenunciaId(denunciaId);
        setShowDeleteConfirm(true);
    };

    const confirmFecharVaga = async () => {
        if (!vagaToClose) return;
        try {
            const { error } = await supabase.from('vagas').update({ status: 'encerrada' }).eq('id', vagaToClose.id);
            if (error) throw error;
            
            if (relatedDenunciaId) {
                await supabase.from('denuncias').update({ status: 'analisado' }).eq('id', relatedDenunciaId);
                fetchDenuncias();
            }

            fetchStats();
            fetchVagas();
            setShowDeleteConfirm(false);
            setVagaToClose(null);
            setRelatedDenunciaId(null);
            notify('Vaga encerrada com sucesso!', 'success');
        } catch (err) { 
            notify('Erro ao fechar vaga.', 'error'); 
        }
    };

    const confirmDeleteVaga = async () => {
        if (!vagaToDelete) return;
        try {
            const { error } = await supabase.rpc('admin_delete_vaga', { target_vaga_id: vagaToDelete.id });
            if (error) throw error;
            
            fetchStats();
            fetchTodasVagas();
            setVagaToDelete(null);
            notify('Vaga e suas depend├¬ncias foram exclu├¡das!', 'success');
        } catch (err) {
            notify('Erro ao excluir vaga permanentemente: ' + err.message, 'error');
        }
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            if (userToDelete.is_invite) {
                // ├ë um convite pendente. Basta deletar da tabela empresa_invites
                const { error } = await supabase.from('empresa_invites').delete().eq('id', userToDelete.id);
                if (error) throw error;
            } else {
                const userId = userToDelete.user_id || userToDelete.id; // Suporta tanto candidato quanto empresa ativa
                const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
                if (error) throw error;
            }
            
            fetchStats();
            if (activeTab === 'usuarios') fetchUsuarios();
            if (activeTab === 'empresas') fetchAllEmpresas();
            setUserToDelete(null);
            notify('Registro exclu├¡do do sistema com sucesso!', 'success');
        } catch (err) {
            notify('Erro ao excluir registro: ' + err.message, 'error');
        }
    };

    const handleCreateEmpresa = async (e) => {
        e.preventDefault();
        setCreatingEmpresa(true);
        try {
            // 1. Criar o "convite/acesso pr├®vio" na tabela empresa_invites
            // Nota: Esta tabela precisa existir no Supabase com (email, password_temp, razao_social, cnpj)
            const { error: inviteError } = await supabase.from('empresa_invites').insert([{
                email: newEmpresaData.email,
                password_temp: newEmpresaData.password,
                razao_social: newEmpresaData.razao_social,
                cnpj: newEmpresaData.cnpj,
                status: 'pendente'
            }]);

            if (inviteError) throw inviteError;

            // O registro em 'empresas' ser├í criado automaticamente na AuthPage 
            // no momento do primeiro login, para garantir o v├¡nculo correto com o Auth.id.

            setInviteMessage({ type: 'success', text: `Perfil de ${newEmpresaData.razao_social} criado com sucesso!` });
            setShowNewEmpresaModal(false);
            setNewEmpresaData({ razao_social: '', cnpj: '', email: '', password: '' });
            fetchAllEmpresas();
            notify('Empresa criada com sucesso!', 'success');
        } catch (err) {
            notify('Erro ao criar empresa: ' + err.message, 'error');
        } finally {
            setCreatingEmpresa(false);
        }
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
            setInviteMessage({ type: 'success', text: 'Convite enviado!' });
            setInviteEmail('');
        } catch (error) { setInviteMessage({ type: 'error', text: 'Erro: ' + error.message }); }
        finally { setInviting(false); }
    };

    const fetchAccessLogs = async () => {
        const { data } = await supabase.from('access_logs').select('*').order('accessed_at', { ascending: false }).limit(100);
        if (data) setAccessLogs(data);
    };

    const fetchConsentLogs = async () => {
        const { data } = await supabase.from('consent_logs').select('*').order('consented_at', { ascending: false }).limit(100);
        if (data) setConsentLogs(data);
    };

    const fetchRegistrationData = async () => {
        try {
            const now = new Date();
            let startDate, endDate;

            if (chartPeriod === 'custom') {
                startDate = new Date(customDates.start);
                endDate = new Date(customDates.end);
                // Ensure end is at the end of the day
                endDate.setHours(23, 59, 59, 999);
            } else {
                startDate = new Date();
                startDate.setDate(now.getDate() - chartPeriod);
                endDate = now;
            }
            
            const { data, error } = await supabase
                .from('user_roles')
                .select('created_at')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Group by day
            const counts = {};
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            for (let i = 0; i <= diffDays; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                counts[dateStr] = 0;
            }

            data.forEach(item => {
                const day = item.created_at.split('T')[0];
                if (counts[day] !== undefined) counts[day]++;
            });

            const formatted = Object.entries(counts)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));

            setRegistrationData(formatted);
        } catch (err) { console.error('Erro ao buscar dados do gr├ífico:', err); }
    };

    const fetchDenuncias = async () => {
        const { data } = await supabase.from('denuncias').select('*, vagas(titulo), empresas(razao_social), curriculos(nome, email)').order('created_at', { ascending: false });
        if (data) setDenuncias(data);
    };

    const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

    const taxaConversao = stats.candidatos > 0 ? ((stats.perfisCompletos / stats.candidatos) * 100).toFixed(1) : 0;

    const statCards = [
        { label: 'Candidatos', value: stats.candidatos, gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', icon: <Users size={24} color="#fff" /> },
        { label: 'Empresas', value: stats.empresas, gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', icon: <Building size={24} color="#fff" /> },
        { label: 'Perfis Completos', value: `${stats.perfisCompletos} (${taxaConversao}%)`, gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', icon: <CheckCircle size={24} color="#fff" /> },
        { label: 'Usu├írios Totais', value: stats.usuariosAtivos, gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', icon: <Shield size={24} color="#fff" /> },
    ];

    const menuItems = [
        { key: 'overview', label: 'Monitoramento', icon: <LayoutDashboard size={20} /> },
        { key: 'usuarios', label: 'Gest├úo de Usu├írios', icon: <Users size={20} /> },
        { key: 'empresas', label: 'Parceiros / Empresas', icon: <Building size={20} /> },
        { key: 'vagas', label: 'Curadoria de Vagas', icon: <Briefcase size={20} /> },
        { key: 'metricas', label: 'Intelig├¬ncia de Dados', icon: <BarChart2 size={20} /> },
        { key: 'logs', label: 'Log de Auditoria', icon: <Clock size={20} /> },
        { key: 'lgpd', label: 'Privacidade LGPD', icon: <Database size={20} /> },
        { key: 'denuncias', label: 'Ouvidoria / Den├║ncias', icon: <AlertTriangle size={20} /> },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#08080a', color: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
            {/* ESTILOS DE RESET PARA O ADMIN (TEMA ESCURO) */}
            <style>{`
                body {
                    background-color: #08080a !important;
                    background-image: none !important;
                }
                body::before {
                    display: none !important;
                }
                .admin-sidebar {
                    transform: translateX(-100%);
                }
                .admin-sidebar.open {
                    transform: translateX(0);
                }
                @media (min-width: 1025px) {
                    .admin-sidebar {
                        transform: translateX(0) !important;
                    }
                }
            `}</style>

            {/* OVERLAY MOBILE */}
            {isSidebarOpen && (
                <div 
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 1500
                    }}
                />
            )}

            {/* SIDEBAR */}
            <aside 
                className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`} 
                style={{ 
                    width: '280px', 
                    background: '#0f0f14', 
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    zIndex: 2000,
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isSidebarOpen ? '20px 0 50px rgba(0,0,0,0.5)' : 'none'
                }}
            >
                <div style={{ padding: '2.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="mobile-menu-close"
                        style={{
                            display: 'none',
                            position: 'absolute',
                            right: '1rem',
                            top: '1rem',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={20} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            background: 'linear-gradient(135deg, var(--neon-purple), var(--neon-blue))',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 15px rgba(124, 58, 237, 0.4)'
                        }}>
                            <Shield size={18} color="white" />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>TALENTOS</h2>
                    </div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '3px', fontWeight: 800, opacity: 0.6 }}>CENTRAL DE COMANDO</span>
                    <div style={{ marginTop: '12px' }}>
                        <HealthCheck />
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '2rem 1rem', overflowY: 'auto' }}>
                    {menuItems.map(item => (
                        <button 
                            key={item.key}
                            onClick={() => {
                                setActiveTab(item.key);
                                setIsSidebarOpen(false);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                width: '100%',
                                padding: '14px 18px',
                                border: 'none',
                                background: activeTab === item.key ? 'linear-gradient(90deg, rgba(124, 58, 237, 0.15), transparent)' : 'transparent',
                                color: activeTab === item.key ? 'var(--neon-purple)' : '#94a3b8',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                fontWeight: activeTab === item.key ? 700 : 500,
                                marginBottom: '6px',
                                textAlign: 'left',
                                position: 'relative'
                            }}
                        >
                            {activeTab === item.key && <div style={{ position: 'absolute', left: 0, width: '4px', height: '20px', background: 'var(--neon-purple)', borderRadius: '0 4px 4px 0' }} />}
                            <span style={{ 
                                opacity: activeTab === item.key ? 1 : 0.7,
                                transform: activeTab === item.key ? 'scale(1.1)' : 'scale(1)',
                                transition: 'transform 0.2s'
                            }}>
                                {item.icon}
                            </span>
                            <span style={{ fontSize: '0.95rem' }}>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div style={{ padding: '2rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button 
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            background: 'rgba(239, 68, 68, 0.03)',
                            color: '#f87171',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = '#f87171'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.03)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'; }}
                    >
                        <LogOut size={18} />
                        ENCERRAR SESS├âO
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="admin-main" style={{ 
                flex: 1, 
                marginLeft: isSidebarOpen ? '0' : '280px', // Fallback inline
                padding: '3.5rem',
                minHeight: '100vh',
                background: '#08080a'
            }}>
                <header className="admin-header" style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div className="admin-header-titles" style={{ animation: 'slideRight 0.5s ease-out' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-purple)', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px' }}>
                            <button 
                                className="mobile-menu-toggle" 
                                onClick={() => setIsSidebarOpen(true)}
                                style={{
                                    display: 'none',
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    padding: '8px',
                                    marginRight: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                <Menu size={24} />
                            </button>
                            <div style={{ width: '12px', height: '2px', background: 'currentColor' }} className="header-dash-line" /> PAINEL / {activeTab.toUpperCase()}
                        </div>
                        <h1 className="admin-title" style={{ fontSize: '2.8rem', fontWeight: 900, margin: 0, background: 'linear-gradient(to bottom, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
                            {menuItems.find(m => m.key === activeTab).label}
                        </h1>
                    </div>
                    <div className="glass-panel admin-user-info" style={{ padding: '0.8rem 1.2rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logado como</p>
                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--neon-blue)' }}>Administrador OFC</p>
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--neon-blue)', opacity: 0.2 }} />
                    </div>
                </header>

                {/* === ABA: VIS├âO GERAL === */}
                {activeTab === 'overview' && (
                    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                        <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                            {statCards.map(({ label, value, icon, gradient }) => (
                                <div key={label} className="glass-panel" style={{ 
                                    padding: '2rem', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '2rem',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    cursor: 'default'
                                }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                    <div style={{ 
                                        padding: '1.2rem', 
                                        background: gradient,
                                        borderRadius: '20px',
                                        boxShadow: '0 10px 20px -5px rgba(0,0,0,0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {icon}
                                    </div>
                                    <div>
                                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 700, letterSpacing: '1px' }}>{label.toUpperCase()}</p>
                                        <h2 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 900, color: '#fff' }}>
                                            {loadingStats ? <Skeleton width="80px" height="40px" /> : value}
                                        </h2>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="glass-panel admin-card" style={{ padding: '3rem', border: '1px solid rgba(124, 58, 237, 0.15)', background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.03), rgba(0, 0, 0, 0))', marginBottom: '4rem' }}>
                            <div className="admin-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <BarChart2 size={24} color="var(--neon-purple)" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>FLUXO DE CADASTROS</h3>
                                        <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>Acompanhamento di├írio de novos usu├írios no sistema.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px' }}>
                                    {[7, 14, 30, 'custom'].map(p => (
                                        <button 
                                            key={p} 
                                            onClick={() => setChartPeriod(p)}
                                            style={{
                                                padding: '10px 20px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                background: chartPeriod === p ? 'var(--neon-purple)' : 'transparent',
                                                color: chartPeriod === p ? '#fff' : '#94a3b8',
                                                fontSize: '0.85rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                        >
                                            {p === 'custom' ? 'CUSTOM' : `${p} D`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {chartPeriod === 'custom' && (
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '2rem', animation: 'fadeIn 0.3s ease-out', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '6px', display: 'block', fontWeight: 800 }}>DE:</label>
                                        <input 
                                            type="date" 
                                            value={customDates.start} 
                                            onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '8px', width: '100%', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '6px', display: 'block', fontWeight: 800 }}>AT├ë:</label>
                                        <input 
                                            type="date" 
                                            value={customDates.end} 
                                            onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '8px', width: '100%', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div style={{ height: '300px', width: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '10px', paddingBottom: '30px' }}>
                                {registrationData.length === 0 ? (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                        Carregando dados estat├¡sticos...
                                    </div>
                                ) : (
                                    <>
                                        {registrationData.map((d, idx) => {
                                            const max = Math.max(...registrationData.map(val => val.count), 5);
                                            const height = (d.count / max) * 100;
                                            return (
                                                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                                                    <div style={{ 
                                                        width: '100%', 
                                                        height: `${height}%`, 
                                                        background: 'linear-gradient(to top, rgba(124, 58, 237, 0.8), rgba(56, 189, 248, 0.8))',
                                                        borderRadius: '6px 6px 0 0',
                                                        position: 'relative',
                                                        transition: 'height 1s ease-out'
                                                    }}>
                                                        <div style={{ 
                                                            position: 'absolute', 
                                                            top: '-25px', 
                                                            left: '50%', 
                                                            transform: 'translateX(-50%)',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 800,
                                                            color: 'var(--neon-blue)'
                                                        }}>{d.count}</div>
                                                    </div>
                                                    <span style={{ fontSize: '0.65rem', color: '#64748b', transform: 'rotate(-45deg)', whiteSpace: 'nowrap', width: '20px' }}>
                                                        {d.date.split('-').slice(1).reverse().join('/')}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '3rem', border: '1px solid rgba(124, 58, 237, 0.15)', background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.03), rgba(0, 0, 0, 0))' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2.5rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Send size={24} color="#38bdf8" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>CONVIDAR PARCEIRO</h3>
                                    <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>Expanda a rede de empresas contratantes via magic-link.</p>
                                </div>
                            </div>
                            
                            <form onSubmit={handleInvite} style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'end' }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '12px', display: 'block', letterSpacing: '1px' }}>ENDERE├çO DE E-MAIL</label>
                                    <input type="email" className="neon-input" placeholder="contato@empresa.com.br" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required 
                                        style={{ height: '56px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', fontSize: '1rem' }} />
                                </div>
                                <button type="submit" disabled={inviting} className="neon-button" style={{ 
                                    margin: 0, 
                                    height: '56px', 
                                    padding: '0 40px', 
                                    fontSize: '1rem', 
                                    fontWeight: 800,
                                    background: 'linear-gradient(135deg, var(--neon-purple), #9333ea)',
                                    boxShadow: '0 10px 20px -5px rgba(124, 58, 237, 0.4)'
                                }}>
                                    {inviting ? 'PROCESSANDO...' : 'ENVIAR ACESSO'}
                                </button>
                            </form>
                            {inviteMessage && <div style={{ 
                                marginTop: '2rem', 
                                padding: '1.2rem', 
                                borderRadius: '12px', 
                                background: inviteMessage.type === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)', 
                                color: inviteMessage.type === 'error' ? '#f87171' : '#4ade80', 
                                border: `1px solid ${inviteMessage.type === 'error' ? '#f8717144' : '#4ade8044'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontWeight: 500
                            }}>
                                {inviteMessage.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                {inviteMessage.text}
                            </div>}
                        </div>
                    </div>
                )}

                {/* === ABA: PARCEIROS / EMPRESAS === */}
                {activeTab === 'empresas' && (
                    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>GERENCIAR PARCEIROS</h3>
                                <p style={{ margin: '5px 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>Visualize e cadastre empresas que utilizam a plataforma.</p>
                            </div>
                            <button onClick={() => setShowNewEmpresaModal(true)} className="neon-button" style={{ margin: 0, padding: '0 25px', height: '50px', width: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Plus size={20} /> CRIAR NOVO PERFIL
                            </button>
                        </div>

                        <div className="glass-panel" style={{ padding: 0 }}>
                            <div className="table-responsive"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    <tr>
                                        <th style={{ padding: '1.5rem 2.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>EMPRESA</th>
                                        <th style={{ padding: '1.5rem 2.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>CNPJ</th>
                                        <th style={{ padding: '1.5rem 2.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>CONTATO</th>
                                        <th style={{ padding: '1.5rem 2.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>STATUS</th>
                                        <th style={{ padding: '1.5rem 2.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>A├ç├òES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allEmpresas.map(emp => (
                                        <tr key={emp.id} className="admin-table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '1.5rem 2.5rem' }}>
                                                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>{emp.razao_social}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>Criado em: {new Date(emp.created_at).toLocaleDateString('pt-BR')}</div>
                                            </td>
                                            <td style={{ padding: '1.5rem 2.5rem', color: '#94a3b8', fontWeight: 600 }}>{emp.cnpj || 'ÔÇö'}</td>
                                            <td style={{ padding: '1.5rem 2.5rem', color: '#94a3b8', fontWeight: 600 }}>{emp.email_contato || 'ÔÇö'}</td>
                                            <td style={{ padding: '1.5rem 2.5rem' }}>
                                                <span style={{ 
                                                    padding: '6px 14px', 
                                                    borderRadius: '20px', 
                                                    fontSize: '0.75rem', 
                                                    fontWeight: 800,
                                                    background: emp.user_id ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: emp.user_id ? '#4ade80' : '#f87171'
                                                }}>
                                                    {emp.user_id ? 'ATIVO' : 'PENDENTE'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.5rem 2.5rem', display: 'flex', gap: '8px' }}>
                                                <button className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', fontSize: '0.75rem', width: 'auto' }}>VER DETALHES</button>
                                                <button onClick={() => setUserToDelete(emp)} className="neon-button secondary danger" style={{ margin: 0, padding: '8px 16px', fontSize: '0.75rem', width: 'auto' }}>
                                                    <span style={{color: '#f87171'}}>EXCLUIR</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {allEmpresas.length === 0 && (
                                        <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Nenhuma empresa cadastrada.</td></tr>
                                    )}
                                </tbody>
                            </table></div>
                        </div>

                        {/* MODAL NOVO PERFIL */}
                        {showNewEmpresaModal && (
                            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem' }}>
                                <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '3.5rem' }}>
                                    <h3 style={{ margin: '0 0 2rem', fontSize: '1.8rem', fontWeight: 900, textAlign: 'center' }}>NOVO PARCEIRO</h3>
                                    <form onSubmit={handleCreateEmpresa}>
                                        <div className="input-group">
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>RAZ├âO SOCIAL</label>
                                            <input className="neon-input" required value={newEmpresaData.razao_social} onChange={e => setNewEmpresaData({...newEmpresaData, razao_social: e.target.value})} placeholder="Ex: Google Inc." />
                                        </div>
                                        <div className="input-group">
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>CNPJ (OPCIONAL)</label>
                                            <input className="neon-input" value={newEmpresaData.cnpj} onChange={e => setNewEmpresaData({...newEmpresaData, cnpj: e.target.value})} placeholder="00.000.000/0000-00" />
                                        </div>
                                        <div style={{ padding: '1.5rem', background: 'rgba(124, 58, 237, 0.05)', borderRadius: '16px', border: '1px solid rgba(124, 58, 237, 0.1)', marginBottom: '2rem' }}>
                                            <p style={{ margin: '0 0 1.5rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--neon-purple)', letterSpacing: '1px' }}>CREDENCIAIS DE ACESSO</p>
                                            <div className="input-group">
                                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>E-MAIL DA EMPRESA</label>
                                                <div style={{ position: 'relative' }}>
                                                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#64748b' }} />
                                                    <input type="email" className="neon-input" required style={{ paddingLeft: '40px' }} value={newEmpresaData.email} onChange={e => setNewEmpresaData({...newEmpresaData, email: e.target.value})} placeholder="gestor@empresa.com" />
                                                </div>
                                            </div>
                                            <div className="input-group" style={{ marginBottom: 0 }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>SENHA INICIAL</label>
                                                <div style={{ position: 'relative' }}>
                                                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#64748b' }} />
                                                    <input type="password" title="Defina a senha que a empresa usar├í para o primeiro login" className="neon-input" required style={{ paddingLeft: '40px' }} value={newEmpresaData.password} onChange={e => setNewEmpresaData({...newEmpresaData, password: e.target.value})} placeholder="ÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇó" />
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                                            <button type="button" onClick={() => setShowNewEmpresaModal(false)} className="neon-button secondary" style={{ margin: 0 }}>CANCELAR</button>
                                            <button type="submit" disabled={creatingEmpresa} className="neon-button" style={{ margin: 0, background: 'var(--neon-purple)' }}>
                                                {creatingEmpresa ? 'CRIANDO...' : 'CRIAR PERFIL'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'usuarios' && (
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', animation: 'fadeIn 0.4s ease-out', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>BASE DE TALENTOS</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '5px 15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>FILTRAR:</span>
                                    <select 
                                        value={filterStatus} 
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="todos" style={{ background: '#0f0f14' }}>TODOS</option>
                                        <option value="completos" style={{ background: '#0f0f14' }}>PERFIL COMPLETO</option>
                                        <option value="incompletos" style={{ background: '#0f0f14' }}>PERFIL INCOMPLETO</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '5px 15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginLeft: '10px' }}>
                                    <Search size={16} color="#64748b" />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por nome ou e-mail..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 500, outline: 'none', width: '200px' }}
                                    />
                                </div>
                            </div>
                            <button onClick={handleExportarCSV} className="neon-button secondary" style={{ 
                                margin: 0, 
                                padding: '12px 24px', 
                                width: 'auto', 
                                background: 'rgba(255,255,255,0.03)',
                                fontSize: '0.9rem',
                                fontWeight: 700
                            }}>
                                <Download size={18} style={{ marginRight: '10px' }} /> RELAT├ôRIO COMPLETO (CSV)
                            </button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <div className="table-responsive"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.01)', textAlign: 'left' }}>
                                    <tr>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800, letterSpacing: '1px' }}>DADOS ACAD├èMICOS / NOME</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800, letterSpacing: '1px' }}>CONTATO E COMUNICA├ç├âO</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800, letterSpacing: '1px' }}>CLASSIFICA├ç├âO</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800, letterSpacing: '1px' }}>DATA CADASTRO</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800, letterSpacing: '1px' }}>A├ç├òES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios
                                        .filter(u => {
                                            const matchesStatus = filterStatus === 'todos' || u.status_perfil === filterStatus;
                                            const matchesSearch = searchTerm === '' || 
                                                u.nome_display.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                u.email_display.toLowerCase().includes(searchTerm.toLowerCase());
                                            return matchesStatus && matchesSearch;
                                        })
                                        .map(u => (
                                        <tr key={u.user_id} className="admin-table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '1.5rem 2.5rem' }}>
                                                <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.05rem' }}>{u.nome_display}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '6px', opacity: 0.6 }}>UUID: {u.user_id}</div>
                                            </td>
                                            <td style={{ padding: '1.5rem 2.5rem' }}>
                                                <div style={{ color: 'var(--neon-blue)', fontSize: '0.95rem', fontWeight: 700 }}>{u.email_display}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>{u.telefone_display}</div>
                                            </td>
                                            <td style={{ padding: '1.5rem 2.5rem' }}>
                                                <span style={{ 
                                                    fontSize: '0.7rem', 
                                                    padding: '5px 12px', 
                                                    borderRadius: '8px', 
                                                    background: u.role === 'admin' ? 'rgba(124, 58, 237, 0.12)' : u.role === 'empresa' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(34, 197, 94, 0.08)', 
                                                    color: u.role === 'admin' ? 'var(--neon-purple)' : u.role === 'empresa' ? '#38bdf8' : '#4ade80',
                                                    fontWeight: 900,
                                                    border: `1px solid ${u.role === 'admin' ? 'rgba(124, 58, 237, 0.3)' : u.role === 'empresa' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {u.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.5rem 2.5rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '1.5rem 2.5rem', display: 'flex', gap: '8px' }}>
                                                {u.role === 'candidato' && (
                                                    <button 
                                                        onClick={() => navigate(`/cv-preview/${u.user_id}`)} 
                                                        className="neon-button secondary" 
                                                        style={{ margin: 0, padding: '8px 16px', fontSize: '0.75rem', width: 'auto', background: 'rgba(124, 58, 237, 0.1)', borderColor: 'rgba(124, 58, 237, 0.3)' }}
                                                    >
                                                        <span style={{color: 'var(--neon-purple)'}}>VER PERFIL</span>
                                                    </button>
                                                )}
                                                {u.role !== 'admin' && (
                                                    <button onClick={() => setUserToDelete(u)} className="neon-button secondary danger" style={{ margin: 0, padding: '8px 16px', fontSize: '0.75rem', width: 'auto' }}>
                                                        <span style={{color: '#f87171'}}>EXCLUIR</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table></div>
                        </div>
                    </div>
                )}

                {/* Restantes das abas seguem o padr├úo com cores melhoradas */}
                {activeTab === 'empresas' && (
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', animation: 'fadeIn 0.4s ease-out' }}>
                        <div style={{ padding: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>PARCEIROS CONTRATANTES</h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <div className="table-responsive"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.01)', textAlign: 'left' }}>
                                    <tr>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>IDENTIFICA├ç├âO</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>SITUA├ç├âO</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>MODERA├ç├âO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {empresas.map(e => (
                                        <tr key={e.id} className="admin-table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '1.5rem 2.5rem' }}>
                                                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{e.razao_social}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>CNPJ: {e.cnpj}</div>
                                            </td>
                                            <td style={{ padding: '1.5rem 2.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: e.aprovada ? '#4ade80' : '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', boxShadow: `0 0 10px currentColor` }} />
                                                    {e.aprovada ? 'ATIVO NO SISTEMA' : 'AGUARDANDO APROVA├ç├âO'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.5rem 2.5rem', display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleAprovarEmpresa(e.id, !e.aprovada)} 
                                                    className="neon-button secondary" 
                                                    style={{ 
                                                        width: 'auto', 
                                                        padding: '8px 20px', 
                                                        fontSize: '0.8rem', 
                                                        fontWeight: 900,
                                                        color: e.aprovada ? '#f87171' : '#10b981', 
                                                        background: e.aprovada ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                                                        borderColor: 'currentColor',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                    {e.aprovada ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                                    {e.aprovada ? 'BLOQUEAR ACESSO' : 'LIBERAR CADASTRO'}
                                                </button>
                                                {e.user_id && (
                                                    <button onClick={() => setUserToDelete(e)} className="neon-button secondary danger" style={{ margin: 0, padding: '8px 16px', fontSize: '0.75rem', width: 'auto' }}>
                                                        <span style={{color: '#f87171'}}>EXCLUIR</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table></div>
                        </div>
                    </div>
                )}

                {activeTab === 'vagas' && (
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', animation: 'fadeIn 0.4s ease-out' }}>
                        <div style={{ padding: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>CONTROLE DE PUBLICA├ç├òES</h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <div className="table-responsive"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.01)', textAlign: 'left' }}>
                                    <tr>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>T├ìTULO DA VAGA / CONTRATANTE</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>STATUS ATUAL</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}> GEST├âO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vagas.map(v => (
                                        <tr key={v.id} className="admin-table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: v.status === 'encerrada' ? 0.5 : 1 }}>
                                            <td style={{ padding: '1.5rem 2.5rem' }}>
                                                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{v.titulo}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>Empresa: {v.empresas?.razao_social}</div>
                                            </td>
                                            <td style={{ padding: '1.5rem 2.5rem' }}>
                                                <span style={{ 
                                                    fontSize: '0.7rem', 
                                                    padding: '5px 12px', 
                                                    borderRadius: '8px', 
                                                    background: v.status === 'aberta' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                                    color: v.status === 'aberta' ? '#38bdf8' : '#f87171', 
                                                    fontWeight: 900,
                                                    border: '1px solid currentColor'
                                                }}>
                                                    {v.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.5rem 2.5rem' }}>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => handleFecharVaga(v)} disabled={v.status === 'encerrada'} 
                                                        className={`neon-button secondary ${v.status === 'encerrada' ? '' : 'danger'}`} 
                                                        style={{ 
                                                            margin: 0, 
                                                            padding: '8px 20px', 
                                                            width: 'auto', 
                                                            fontSize: '0.8rem', 
                                                            fontWeight: 800,
                                                            opacity: v.status === 'encerrada' ? 0.3 : 1
                                                        }}>
                                                        {v.status === 'encerrada' ? 'VAGA ENCERRADA' : 'CANCELAR PUBLICA├ç├âO'}
                                                    </button>
                                                    <button onClick={() => setVagaToDelete(v)} className="neon-button secondary danger" style={{ margin: 0, padding: '8px 16px', fontSize: '0.75rem', width: 'auto' }}>
                                                        <span style={{color: '#f87171'}}>EXCLUIR</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table></div>
                        </div>
                    </div>
                )}

                {activeTab === 'metricas' && (
                    <div style={{ display: 'grid', gap: '2.5rem', animation: 'fadeIn 0.4s ease-out' }}>
                        <div className="glass-panel admin-card" style={{ padding: '3.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '3rem' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BarChart2 size={28} color="#38bdf8" />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900 }}>RANKING DE INTERESSES (TOP 5)</h3>
                            </div>
                            
                            {metrics.vagasMaisProcuradas.length === 0 ? (
                                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem' }}>Dados insuficientes para gerar m├®tricas.</p>
                            ) : (
                                <div style={{ display: 'grid', gap: '2rem' }}>
                                    {metrics.vagasMaisProcuradas.map((m, i) => {
                                        const max = metrics.vagasMaisProcuradas[0].count;
                                        const pct = (m.count / max) * 100;
                                        return (
                                            <div key={i}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 800, fontSize: '0.95rem' }}>
                                                    <span>{m.titulo.toUpperCase()}</span>
                                                    <span style={{ color: 'var(--neon-blue)', letterSpacing: '1px' }}>{m.count} CANDIDATURAS</span>
                                                </div>
                                                <div style={{ height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', overflow: 'hidden', padding: '2px' }}>
                                                    <div style={{ 
                                                        width: `${pct}%`, 
                                                        height: '100%', 
                                                        background: 'linear-gradient(to right, #3b82f6, var(--neon-purple))', 
                                                        borderRadius: '4px',
                                                        boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
                                                        transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)'
                                                    }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* LOGS, LGPD e DEN├ÜNCIAS seguem o mesmo padr├úo refinado */}
                {activeTab === 'logs' && (
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', animation: 'fadeIn 0.4s ease-out' }}>
                         <div style={{ padding: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>AUDITORIA DE ACESSO</h3>
                            <div style={{ padding: '6px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>├ÜLTIMOS 100 EVENTOS</div>
                        </div>
                        <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
                            <div className="table-responsive"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#0f0f14', zIndex: 10 }}>
                                    <tr style={{ textAlign: 'left' }}>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>USU├üRIO</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>A├ç├âO SIST├èMICA</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>TIMESTAMP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accessLogs.map(l => (
                                        <tr key={l.id} className="admin-table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '1.2rem 2.5rem', color: 'var(--neon-blue)', fontWeight: 800, fontSize: '0.9rem' }}>{l.email.toLowerCase()}</td>
                                            <td style={{ padding: '1.2rem 2.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#4ade80', background: 'rgba(34,197,94,0.05)', padding: '5px 12px', borderRadius: '6px', fontWeight: 700, border: '1px solid rgba(34,197,94,0.2)' }}>{l.action.toUpperCase()}</span>
                                            </td>
                                            <td style={{ padding: '1.2rem 2.5rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{new Date(l.accessed_at).toLocaleString('pt-BR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table></div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'lgpd' && (
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', animation: 'fadeIn 0.4s ease-out' }}>
                        <div style={{ padding: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>TERMOS E PRIVACIDADE</h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <div className="table-responsive"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.01)', textAlign: 'left' }}>
                                    <tr>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>USU├üRIO</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>CONSENTIMENTO</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>DATA ACEITE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {consentLogs.map(l => (
                                        <tr key={l.id} className="admin-table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '1.2rem 2.5rem', color: 'var(--neon-blue)', fontWeight: 800 }}>{l.email.toLowerCase()}</td>
                                            <td style={{ padding: '1.2rem 2.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: l.accepted_terms ? '#4ade80' : '#f87171', fontWeight: 900, fontSize: '0.75rem' }}>
                                                    {l.accepted_terms ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                    {l.accepted_terms ? 'TOTAL' : 'RESTRITO'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.2rem 2.5rem', color: '#94a3b8', fontWeight: 600 }}>{new Date(l.consented_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table></div>
                        </div>
                    </div>
                )}

                {activeTab === 'denuncias' && (
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', animation: 'fadeIn 0.4s ease-out' }}>
                        <div style={{ padding: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>TRIAGEM DE DEN├ÜNCIAS</h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <div className="table-responsive"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.01)', textAlign: 'left' }}>
                                    <tr>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>VAGA ALVO / EMPRESA</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>MOTIVO REPORTADO</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}> INTERVEN├ç├âO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {denuncias.length === 0 ? (
                                        <tr><td colSpan="3" style={{ padding: '5rem', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>Nenhum alerta pendente. Opera├º├úo est├ível.Ô£¿</td></tr>
                                    ) : (
                                        denuncias.map(d => (
                                            <tr key={d.id} className="admin-table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '1.5rem 2.5rem' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{d.vagas?.titulo}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>Contratante: {d.empresas?.razao_social}</div>
                                                </td>
                                                <td style={{ padding: '1.5rem 2.5rem', fontSize: '0.9rem', color: '#fda4af', maxWidth: '300px', fontWeight: 600 }}>"{d.motivo}"</td>
                                                <td style={{ padding: '1.5rem 2.5rem' }}>
                                                    <button onClick={() => {
                                                        const vagaToCloseFromDenuncia = { id: d.vaga_id, titulo: d.vagas?.titulo };
                                                        handleFecharVaga(vagaToCloseFromDenuncia, d.id);
                                                    }} className="neon-button secondary danger" style={{ width: 'auto', padding: '10px 20px', fontWeight: 900 }}>PROTEGER SISTEMA</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table></div>
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL FECHAR VAGA - ESTILIZADO */}
            {vagaToClose && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s ease-out' }}>
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', maxWidth: '500px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem' }}>
                            <AlertTriangle size={40} color="#f87171" />
                        </div>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.5px' }}>ENCERRAR PUBLICA├ç├âO?</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '3rem', lineHeight: 1.6, fontSize: '1rem' }}>Esta vaga ser├í ocultada para todos os candidatos imediatamento. Voc├¬ poder├í reverter esta a├º├úo nos logs se necess├írio.</p>
                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                            <button onClick={() => setVagaToClose(null)} className="neon-button secondary" style={{ width: 'auto', padding: '0 30px', height: '52px', fontWeight: 800 }}>CANCELAR</button>
                            <button onClick={confirmFecharVaga} className="neon-button" style={{ 
                                width: 'auto', 
                                background: '#dc2626', 
                                padding: '0 30px', 
                                height: '52px', 
                                fontWeight: 800,
                                boxShadow: '0 10px 20px -5px rgba(220, 38, 38, 0.4)'
                            }}>SIM, ENCERRAR</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EXCLUIR VAGA DEFINITIVAMENTE */}
            {vagaToDelete && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s ease-out' }}>
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', maxWidth: '500px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem' }}>
                            <AlertTriangle size={40} color="#f87171" />
                        </div>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.5px', color: '#f87171' }}>EXCLUS├âO IRREVERS├ìVEL</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '3rem', lineHeight: 1.6, fontSize: '1rem' }}>Voc├¬ est├í prestes a excluir todos os registros da vaga <strong>{vagaToDelete.titulo}</strong>. Isso apagar├í todas as candidaturas e curr├¡culos atrelados a ela em definitivo.</p>
                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                            <button onClick={() => setVagaToDelete(null)} className="neon-button secondary" style={{ width: 'auto', padding: '0 30px', height: '52px', fontWeight: 800 }}>CANCELAR</button>
                            <button onClick={confirmDeleteVaga} className="neon-button" style={{ 
                                width: 'auto', background: '#dc2626', padding: '0 30px', height: '52px', fontWeight: 800,
                                boxShadow: '0 10px 20px -5px rgba(220, 38, 38, 0.4)'
                            }}>EXCLUIR VAGA</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EXCLUIR USUARIO */}
            {userToDelete && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s ease-out' }}>
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', maxWidth: '500px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem' }}>
                            <AlertTriangle size={40} color="#f87171" />
                        </div>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.5px', color: '#f87171' }}>EXCLUIR USU├üRIO?</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '3rem', lineHeight: 1.6, fontSize: '1rem' }}>Esta a├º├úo vai apagar permanentemente o acesso, perfil e as vagas abertas de <strong>{userToDelete.nome_display || userToDelete.razao_social || userToDelete.email}</strong>. Deseja prosseguir?</p>
                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                            <button onClick={() => setUserToDelete(null)} className="neon-button secondary" style={{ width: 'auto', padding: '0 30px', height: '52px', fontWeight: 800 }}>CANCELAR</button>
                            <button onClick={confirmDeleteUser} className="neon-button" style={{ 
                                width: 'auto', background: '#dc2626', padding: '0 30px', height: '52px', fontWeight: 800,
                                boxShadow: '0 10px 20px -5px rgba(220, 38, 38, 0.4)'
                            }}>SIM, EXCLUIR</button>
                        </div>
                    </div>
                </div>
            )}

            {/* NOTIFICA├ç├âO PERSONALIZADA (TOAST) */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    background: notification.type === 'success' ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
                    backdropFilter: 'blur(10px)', color: '#fff',
                    padding: '1rem 2rem', borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    zIndex: 10000, animation: 'slideInRight 0.4s ease-out'
                }}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    <span style={{ fontWeight: 600 }}>{notification.message}</span>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;400;700;900&display=swap');
                
                /* Reset global contrast overrides for Admin */
                h1, h2, h3, h4, h5, h6 {
                    color: inherit !important;
                    margin-top: 0;
                }

                table {
                    color: #f8fafc !important;
                }

                th {
                    color: #94a3b8 !important;
                }

                td {
                    color: #f8fafc !important;
                }

                label {
                    color: #94a3b8 !important;
                }

                p, span {
                    color: inherit;
                }

                .glass-panel {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                }
                
                .neon-button.secondary {
                    color: #f8fafc !important;
                    background: rgba(255, 255, 255, 0.05) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                }

                .neon-button.secondary:hover {
                    background: rgba(255, 255, 255, 0.1) !important;
                    color: #fff !important;
                }

                .admin-table-row:hover {
                    background: rgba(255, 255, 255, 0.02) !important;
                }
                
                @keyframes fadeIn { 
                    from { opacity: 0; transform: translateY(10px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
                
                @keyframes slideRight {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .neon-button.danger:hover {
                    background: #dc2626 !important;
                    box-shadow: 0 0 20px rgba(220, 38, 38, 0.4) !important;
                    color: white !important;
                }

                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @media (max-width: 1024px) {
                    .admin-main {
                        margin-left: 0 !important;
                        padding: 1.5rem !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    .mobile-menu-close {
                        display: block !important;
                    }
                    .mobile-menu-toggle {
                        display: block !important;
                    }
                    .header-dash-line {
                        display: none !important;
                    }
                    .admin-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 1.5rem !important;
                        margin-bottom: 2.5rem !important;
                    }
                    .admin-title {
                        font-size: 1.8rem !important;
                    }
                    .admin-user-info {
                        width: 100% !important;
                        justify-content: space-between !important;
                    }
                    .glass-panel.admin-card {
                        padding: 1.5rem !important;
                        margin-bottom: 2rem !important;
                    }
                    .admin-grid {
                        gap: 1.5rem !important;
                        margin-bottom: 2.5rem !important;
                    }
                    .admin-section-header {
                        margin-bottom: 1.5rem !important;
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 1rem !important;
                    }
                }

                @media (max-width: 640px) {
                    .admin-main {
                        padding: 1rem !important;
                    }
                    .glass-panel.admin-card {
                        padding: 1rem !important;
                    }
                }
            `}</style>
        </div>
    );
}
