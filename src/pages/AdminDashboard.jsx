import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    Activity, Users, Briefcase, Mail, LogOut, ArrowRight,
    Filter, RefreshCw, ShieldAlert, Trash2, CheckCircle, Clock,
    Building, BarChart2, Shield, AlertTriangle, Database,
    Plus, Download, Search, XCircle, Send, Lock, Menu, X, Compass, Bell
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import BrandLogo from '../components/layout/BrandLogo';

const TABS = [
    { id: 'visao', label: 'Monitoramento', icon: Activity },
    { id: 'usuarios', label: 'Candidatos', icon: Users },
    { id: 'empresas', label: 'Parceiros', icon: Building },
    { id: 'vagas', label: 'Curadoria', icon: Briefcase },
    { id: 'metricas', label: 'Inteligência', icon: BarChart2 },
    { id: 'automacao', label: 'Automação', icon: Mail },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'logs', label: 'Auditoria', icon: Clock },
    { id: 'lgpd', label: 'Privacidade', icon: Shield },
    { id: 'denuncias', label: 'Ouvidoria', icon: AlertTriangle },
    { id: 'contratacoes', label: 'Contratações', icon: CheckCircle }
];

const TrendChart = ({ data, isMobile }) => {
    if (!data || data.length === 0) return (
        <div className="glass-panel" style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Aguardando dados oficiais de tráfego...
        </div>
    );

    const width = 800;
    const height = 200;
    const paddingX = 60; // Aumentado para rótulos do Eixo Y
    const paddingY = 40; // Espaço para rótulos de pontos

    const maxVal = Math.max(...data.map(d => Math.max(d.visits || 0, d.signups || 0)), 1);
    // Escala amigável para o Eixo Y (múltiplos de 5 ou 10)
    const effectiveMax = Math.ceil(maxVal * 1.2 / 5) * 5;
    
    const getX = (index) => (index / (data.length - 1 || 1)) * (width - 2 * paddingX) + paddingX;
    const getY = (val) => height - ((val / (effectiveMax || 1)) * (height - 2 * paddingY) + paddingY);

    // Função para criar curva suave (Bezier)
    const createPath = (values, key) => {
        if (data.length < 2) return `M ${getX(0)} ${getY(values[0][key])} L ${getX(0)} ${getY(values[0][key])}`;
        
        return values.reduce((acc, d, i, arr) => {
            const x = getX(i);
            const y = getY(d[key]);
            if (i === 0) return `M ${x} ${y}`;
            
            // Controle simples para curva suave
            const prevX = getX(i - 1);
            const prevY = getY(arr[i-1][key]);
            const cp1x = prevX + (x - prevX) / 2;
            const cp2x = prevX + (x - prevX) / 2;
            
            return `${acc} C ${cp1x} ${prevY}, ${cp2x} ${y}, ${x} ${y}`;
        }, "");
    };

    const visitsPath = createPath(data, 'visits');
    const signupsPath = createPath(data, 'signups');

    return (
        <div className="glass-panel" style={{ 
            width: '100%', 
            height: isMobile ? '280px' : height + 100, 
            padding: isMobile ? '12px' : '24px', 
            marginTop: '20px', 
            position: 'relative', 
            overflow: 'hidden' 
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '0.7rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: isMobile ? '15px' : '30px' }}>
                <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📈 {isMobile ? 'Fluxo' : 'Fluxo de Engajamento'}
                </span>
                <div style={{ display: 'flex', gap: '24px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                        <div style={{ width: '10px', height: '10px', background: 'var(--norte-green)', borderRadius: '50%' }}></div> Visitantes
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                        <div style={{ width: '10px', height: '10px', background: 'var(--norte-dark-green)', borderRadius: '50%' }}></div> Inscrições
                    </span>
                </div>
            </div>
            
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'calc(100% - 60px)', overflow: 'visible' }}>
                <defs>
                    <linearGradient id="gradVisits" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'var(--norte-green)', stopOpacity: 0.2 }} />
                        <stop offset="100%" style={{ stopColor: 'var(--norte-green)', stopOpacity: 0 }} />
                    </linearGradient>
                    <linearGradient id="gradSignups" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'var(--norte-dark-green)', stopOpacity: 0.2 }} />
                        <stop offset="100%" style={{ stopColor: 'var(--norte-dark-green)', stopOpacity: 0 }} />
                    </linearGradient>
                </defs>

                {/* Eixo Y e Linhas de Grade */}
                {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                    const val = Math.round(effectiveMax * pct);
                    const y = getY(val);
                    return (
                        <g key={pct}>
                            <text x={paddingX - 15} y={y + 4} textAnchor="end" style={{ fontSize: '10px', fill: 'var(--text-muted)', fontWeight: 600 }}>{val}</text>
                            <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(0, 141, 76, 0.05)" strokeWidth="1" />
                        </g>
                    );
                })}
                
                {/* Preenchimento de Área */}
                {data.length > 1 && (
                    <>
                        <path d={`${visitsPath} L ${getX(data.length-1)} ${height - paddingY/2} L ${getX(0)} ${height - paddingY/2} Z`} fill="url(#gradVisits)" style={{ transition: 'all 0.5s ease' }} />
                        <path d={`${signupsPath} L ${getX(data.length-1)} ${height - paddingY/2} L ${getX(0)} ${height - paddingY/2} Z`} fill="url(#gradSignups)" style={{ transition: 'all 0.5s ease' }} />
                    </>
                )}

                {/* Linhas Principais */}
                <path d={visitsPath} fill="none" stroke="var(--norte-green)" strokeWidth="4" strokeLinecap="round" style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 141, 76, 0.2))' }} />
                <path d={signupsPath} fill="none" stroke="var(--norte-dark-green)" strokeWidth="4" strokeLinecap="round" style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 91, 50, 0.2))' }} />
                
                {/* Pontos e Rótulos Numéricos */}
                {data.map((d, i) => {
                    const vx = getX(i);
                    const vy = getY(d.visits);
                    const sx = getX(i);
                    const sy = getY(d.signups);

                    return (
                        <g key={i}>
                            {/* Visitantes */}
                            <circle cx={vx} cy={vy} r="5" fill="#fff" stroke="var(--norte-green)" strokeWidth="3" />
                            <text x={vx} y={vy - 12} textAnchor="middle" style={{ fontSize: '11px', fill: 'var(--norte-green)', fontWeight: 800 }}>
                                {d.visits}
                            </text>

                            {/* Inscrições */}
                            <circle cx={sx} cy={sy} r="5" fill="#fff" stroke="var(--norte-dark-green)" strokeWidth="3" />
                            <text x={sx} y={sy + 20} textAnchor="middle" style={{ fontSize: '11px', fill: 'var(--norte-dark-green)', fontWeight: 800 }}>
                                {d.signups}
                            </text>
                        </g>
                    );
                })}
            </svg>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: `0 ${paddingX}px`, position: 'absolute', bottom: '20px', width: '100%', boxSizing: 'border-box' }}>
               {data.filter((_, i) => data.length < 8 || i % Math.max(1, Math.floor(data.length/7)) === 0).map((d, i) => (
                   <span key={i} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                       {new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                   </span>
               ))}
            </div>
        </div>
    );
};

export default function AdminDashboard() {
    const { user, role: userRole } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };
    const [activeTab, setActiveTab] = useState('visao');
    const [loading, setLoading] = useState(true);

    // Métricas Visão Rápida
    const [diasFiltro, setDiasFiltro] = useState('7');
    const [customDates, setCustomDates] = useState({ 
        start: new Date().toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
    });
    const [metricasFunil, setMetricasFunil] = useState({ 
        visitas: 0, inscritos: 0, abandonos: 0, candidatos: 0 
    });
    const [trendData, setTrendData] = useState([]);
    const [metricasTempo, setMetricasTempo] = useState({ dau: 0, wau: 0 });
    const [ativosAgora, setAtivosAgora] = useState(0);
    const [stats, setStats] = useState({ candidatos: 0, empresas: 0, perfisCompletos: 0, contratados: 0 });
    const [notifPermission, setNotifPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');

    const handleTesteNotificacao = async () => {
        if (typeof Notification === 'undefined') {
            alert('Seu navegador não suporta notificações.');
            return;
        }

        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            setNotifPermission(permission);
            if (permission !== 'granted') return;
        }

        // Disparo da Notificação Real
        new Notification("Norte Empregos 🚀", {
            body: "Olá David! Este é um teste de notificação do sistema. Tudo funcionando!",
            icon: "/favicon.ico", // ou logo do sistema se disponível
            badge: "/favicon.ico",
            tag: "teste-admin",
            requireInteraction: true
        });
    };

    // Listas
    const [usuariosList, setUsuariosList] = useState([]);
    const [vagasList, setVagasList] = useState([]);
    const [allEmpresas, setAllEmpresas] = useState([]);
    const [accessLogs, setAccessLogs] = useState([]);
    const [consentLogs, setConsentLogs] = useState([]);
    const [denuncias, setDenuncias] = useState([]);
    const [metrics, setMetrics] = useState({ registrosPorSemana: [], vagasMaisProcuradas: [] });
    const [automationStats, setAutomationStats] = useState({ sent: 0, opened: 0, clicked: 0, conversion: 0, recovered: 0 });
    const [filtroAutomacao, setFiltroAutomacao] = useState(1); // padrão 1 dia (Hoje)
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [registrationData, setRegistrationData] = useState([]);
    const [chartPeriod, setChartPeriod] = useState(7);

    // Push Notifications
    const [pushTitle, setPushTitle] = useState('');
    const [pushBody, setPushBody] = useState('');
    const [pushUrl, setPushUrl] = useState('/vagas');
    const [pushSubscribers, setPushSubscribers] = useState(0);
    const [isSendingPush, setIsSendingPush] = useState(false);

    const carregarSubscriptions = async () => {
        const { count } = await supabase
            .from('push_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');
        setPushSubscribers(count || 0);
    };

    const notify = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleBroadcastPush = async (e) => {
        e.preventDefault();
        if (!pushTitle || !pushBody) return notify('Preencha título e mensagem!', 'error');
        if (!window.confirm(`Deseja enviar esta notificação para ${pushSubscribers} usuários?`)) return;

        setIsSendingPush(true);
        try {
            const { data, error } = await supabase.functions.invoke('broadcast-push', {
                body: { title: pushTitle, body: pushBody, url: pushUrl }
            });

            if (error) throw error;
            
            const totalSent = data?.success || 0;
            notify(`🚀 ${totalSent} notificações disparadas com sucesso!`);
            
            setPushTitle('');
            setPushBody('');
        } catch (err) {
            console.error('Erro ao enviar push:', err);
            notify('Falha ao enviar: ' + err.message, 'error');
        } finally {
            setIsSendingPush(false);
        }
    };
    const [isSendingEmails, setIsSendingEmails] = useState(false);
    const [sendProgress, setSendProgress] = useState(null);
    const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
    const [broadcastProgress, setBroadcastProgress] = useState(null);
    
    // [MOBILE STATE]
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Contratações
    const [contratacoesList, setContratacoesList] = useState([]);
    const [filtroContratado, setFiltroContratado] = useState('');
    
    // Modais e Estados de Ação
    const [showNewEmpresaModal, setShowNewEmpresaModal] = useState(false);
    const [newEmpresaData, setNewEmpresaData] = useState({ razao_social: '', cnpj: '', email: '', password: '' });
    const [creatingEmpresa, setCreatingEmpresa] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [vagaToDelete, setVagaToDelete] = useState(null);
    const [vagaToClose, setVagaToClose] = useState(null);
    const [relatedDenunciaId, setRelatedDenunciaId] = useState(null);
    const [notification, setNotification] = useState(null);
    
    // Paginação Candidatos
    const [pageCandidates, setPageCandidates] = useState(1);
    const [pageSizeCand] = useState(20);
    const [totalCand, setTotalCand] = useState(0);
    const [searchCand, setSearchCand] = useState('');

    useEffect(() => {
        // Se já sabemos que não é admin, redirecionar se necessário
        // Se já sabemos que é admin, carregar a visão inicial
        if (userRole === 'admin') {
            carregarVisaoGeral();
        }
    }, [userRole]);

    useEffect(() => {
        if (userRole !== 'admin') return; 

        if (activeTab === 'visao') carregarVisaoGeral();
        if (activeTab === 'usuarios') carregarUsuarios();
        if (activeTab === 'empresas') carregarTodasEmpresas();
        if (activeTab === 'vagas') carregarVagas();
        if (activeTab === 'metricas') {
            carregarMetricas();
            fetchRegistrationData();
        }
        if (activeTab === 'logs') carregarLogs();
        if (activeTab === 'lgpd') carregarLGPD();
        if (activeTab === 'denuncias') carregarDenuncias();
        if (activeTab === 'automacao') carregarAutomacao();
        if (activeTab === 'contratacoes') carregarContratacoes();
    }, [activeTab, diasFiltro, customDates, filtroAutomacao, chartPeriod, userRole, pageCandidates, searchCand]);

    // O Tracker atualiza de 5 em 5 minutos para saber os online
    useEffect(() => {
        if (activeTab === 'visao') {
            const interval = setInterval(carregarAoVivo, 30000); // 30s
            return () => clearInterval(interval);
        } else if (activeTab === 'notificacoes') {
            carregarSubscriptions();
        }
    }, [activeTab]);

    const isDavidAdmin = user?.email === 'admin@gmail.com';

    const carregarAoVivo = async () => {
        try {
            const { data, error } = await supabase.rpc('get_active_users_count');
            if (error) throw error;
            setAtivosAgora(data || 0);
        } catch(err) {
            console.error('Erro ao buscar usuários ativos:', err);
        }
    };

    const carregarVisaoGeral = async () => {
        setLoading(true);
        try {
            carregarAoVivo();

            let startDate, endDate;
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (diasFiltro === 'hoje') {
                startDate = today;
                endDate = now;
            } else if (diasFiltro === 'ontem') {
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 1);
                endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
            } else if (diasFiltro === 'custom') {
                startDate = new Date(customDates.start + 'T00:00:00');
                endDate = new Date(customDates.end + 'T23:59:59');
            } else {
                const days = parseInt(diasFiltro);
                startDate = new Date(today);
                startDate.setDate(today.getDate() - (days - 1));
                endDate = now;
            }

            // Usa RPC v2 para o Funil com Range de Datas
            const { data: fData, error: fError } = await supabase.rpc('get_funnel_metrics_v2', { 
                p_start_date: startDate.toISOString(), 
                p_end_date: endDate.toISOString() 
            });
            if (fData) setMetricasFunil(fData);

            // [NEW] Busca dados de tendência para o gráfico
            const { data: tData } = await supabase.rpc('get_dashboard_trends', {
                p_start_date: startDate.toISOString(),
                p_end_date: endDate.toISOString()
            });
            if (tData) setTrendData(tData);

            // RPC para Dau/Wau
            const { data: dData } = await supabase.rpc('get_admin_dau_wau');
            if (dData) setMetricasTempo(dData);

            // Estatísticas Globais (Contagens simples)
            const [
                { count: candCount },
                { count: empCount },
                { count: completeCount },
                { count: hiredCount }
            ] = await Promise.all([
                supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'candidato'),
                supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'empresa'),
                supabase.from('curriculos').select('*', { count: 'exact', head: true }),
                supabase.from('candidaturas').select('*', { count: 'exact', head: true }).eq('status', 'contratado')
            ]);

            setStats({
                candidatos: candCount || 0,
                empresas: empCount || 0,
                perfisCompletos: completeCount || 0,
                contratados: hiredCount || 0
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
            const from = (pageCandidates - 1) * pageSizeCand;
            const to = from + pageSizeCand - 1;

            let query = supabase
                .from('curriculos')
                .select('user_id, nome, email, telefone, genero, data_nascimento, updated_at, resumo, experiencias, formacoes', { count: 'exact' });
            
            if (searchCand) {
                query = query.ilike('nome', `%${searchCand}%`);
            }

            const { data, count, error } = await query
                .order('updated_at', { ascending: false })
                .range(from, to);
            
            if (error) throw error;

            // Busca de candidaturas simplificada (contagem no banco seria ideal via View, mas manteremos a lógica aqui com limite de range)
            const userIds = (data || []).map(u => u.user_id);
            const { data: candData } = await supabase
                .from('candidaturas')
                .select('user_id')
                .in('user_id', userIds);
                
            const candCounts = {};
            if (candData) {
                candData.forEach(c => {
                    candCounts[c.user_id] = (candCounts[c.user_id] || 0) + 1;
                });
            }

            const formatado = (data || []).map(u => {
                const perc = calcularCompletude(u);
                const countCand = candCounts[u.user_id] || 0;
                return { ...u, completude: perc, total_candidaturas: countCand };
            });

            setUsuariosList(formatado);
            setTotalCand(count || 0);
        } catch (err) {
            console.error("Erro usuarios:", err);
            notify('Erro ao carregar candidatos', 'error');
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

    const carregarContratacoes = async () => {
        setLoading(true);
        try {
            // 1. Busca as candidaturas (vagas e empresas funcionam pois têm FK)
            const { data: cands, error: candsError } = await supabase
                .from('candidaturas')
                .select(`
                    id,
                    status,
                    created_at,
                    user_id,
                    vagas (
                        titulo,
                        empresas (
                            razao_social
                        )
                    )
                `)
                .eq('status', 'contratado')
                .order('created_at', { ascending: false });

            if (candsError) throw candsError;
            if (!cands || cands.length === 0) {
                setContratacoesList([]);
                return;
            }

            // 2. Coleta IDs para o Join Manual
            const userIds = [...new Set(cands.map(c => c.user_id))];

            // 3. Busca dados de contato na tabela curriculos
            const { data: profileData, error: profileError } = await supabase
                .from('curriculos')
                .select('user_id, nome, email, telefone')
                .in('user_id', userIds);

            if (profileError) throw profileError;

            // 4. Mapeia para consulta rápida
            const pMap = {};
            (profileData || []).forEach(p => pMap[p.user_id] = p);

            // 5. Une os dados no formato esperado pelo componente
            const merged = cands.map(c => ({
                ...c,
                curriculos: pMap[c.user_id] || { nome: 'N/A', email: 'vazio@norte.com' }
            }));

            setContratacoesList(merged);
        } catch (err) {
            console.error('Erro ao carregar contratações:', err);
            notify('Erro ao carregar lista de contratações', 'error');
        } finally {
            setLoading(false);
        }
    };

    const carregarAutomacao = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const startDate = new Date();
            startDate.setDate(now.getDate() - (filtroAutomacao - 1));
            // Zerar horas para "Hoje" ser desde 00:00
            if (filtroAutomacao === 1) startDate.setHours(0,0,0,0);
            
            const { data: statsData } = await supabase.from('notificacoes_enviadas')
                .select('status')
                .gte('enviado_em', startDate.toISOString());

            const { data: conversionData } = await supabase.rpc('get_email_conversion_stats');
            
            const { data: recoveryData } = await supabase.rpc('get_recovery_metrics', { p_start_date: startDate.toISOString() });

            const { data: recentData } = await supabase.from('notificacoes_enviadas')
                .select('*, candidato_email')
                .gte('enviado_em', startDate.toISOString())
                .order('enviado_em', { ascending: false })
                .limit(10);

            if (statsData) {
                const s = statsData.length;
                const o = statsData.filter(x => x.status === 'opened' || x.status === 'clicked').length;
                const c = statsData.filter(x => x.status === 'clicked').length;
                setAutomationStats({ 
                    sent: s, 
                    opened: o, 
                    clicked: c, 
                    conversion: conversionData || 0,
                    recovered: recoveryData?.[0]?.total_recovered || 0
                });
            }
            if (recentData) setRecentNotifications(recentData);
        } catch (err) {
            console.error('Erro automacao:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDisparoRecuperacao = async () => {
        if (!window.confirm('Deseja iniciar o disparo de e-mails para todos os candidatos que logaram hoje e ainda não completaram o currículo?')) return;
        
        setIsSendingEmails(true);
        setSendProgress('Identificando candidatos...');
        
        try {
            const { data: list, error: rpcError } = await supabase.rpc('preparar_notificacoes_recuperacao_hoje');
            
            if (rpcError) throw rpcError;
            
            if (!list || list.length === 0) {
                alert('Nenhum candidato pendente identificado para hoje!');
                setIsSendingEmails(false);
                setSendProgress(null);
                return;
            }

            let successCount = 0;
            for (let i = 0; i < list.length; i++) {
                const item = list[i];
                setSendProgress(`Enviando ${i + 1} de ${list.length}...`);
                
                try {
                    const { error: fnError } = await supabase.functions.invoke('send-delayed-email', {
                        body: { 
                            notificationId: item.notification_id, 
                            userEmail: item.user_email, 
                            type: 'sem_curriculo' 
                        }
                    });
                    if (!fnError) successCount++;
                } catch (e) {
                    console.error('Erro no despacho individual:', e);
                }
            }

            alert(`Disparo concluído! ${successCount} e-mails enviados.`);
            carregarAutomacao();
        } catch (err) {
            console.error('Erro no disparo em lote:', err);
            alert('Falha ao processar disparo em lote.');
        } finally {
            setIsSendingEmails(false);
            setSendProgress(null);
        }
    };

    const handleDisparoNovasVagas = async () => {
        if (!window.confirm('📢 Deseja enviar um e-mail para TODOS os candidatos cadastrados alertando sobre as novas vagas?')) return;
        
        setIsSendingBroadcast(true);
        setBroadcastProgress('Buscando candidatos...');
        
        try {
            // 1. Buscar todos os candidatos (e-mails) da tabela user_roles cruzando com curriculos ou direto de curriculos
            const { data: candidatos, error: fetchError } = await supabase
                .from('curriculos')
                .select('email, user_id');

            if (fetchError) throw fetchError;

            if (!candidatos || candidatos.length === 0) {
                alert('Nenhum candidato com e-mail cadastrado encontrado!');
                setIsSendingBroadcast(false);
                setBroadcastProgress(null);
                return;
            }

            let successCount = 0;
            // 2. Loop de disparo
            for (let i = 0; i < candidatos.length; i++) {
                const cand = candidatos[i];
                setBroadcastProgress(`Enviando ${i + 1} de ${candidatos.length}...`);

                try {
                    // Chamada para a Edge Function com o tipo 'novas_vagas'
                    const { error: fnError } = await supabase.functions.invoke('send-delayed-email', {
                        body: { 
                            userEmail: cand.email, 
                            type: 'novas_vagas' 
                        }
                    });
                    if (!fnError) successCount++;
                } catch (e) {
                    console.error(`Erro ao disparar para ${cand.email}:`, e);
                }
                
                // Pequeno delay para evitar sobrecarga (opcional)
                await new Promise(res => setTimeout(res, 100));
            }

            alert(`📢 Broadcast concluído! ${successCount} e-mails de vagas enviados com sucesso.`);
            carregarAutomacao();
        } catch (err) {
            console.error('Erro no broadcast de vagas:', err);
            alert('Falha crítica ao processar broadcast.');
        } finally {
            setIsSendingBroadcast(false);
            setBroadcastProgress(null);
        }
    };

    const handleDisparoSemInscricao = async () => {
        if (!window.confirm('🎯 Deseja iniciar o disparo para candidatos que NUNCA se candidataram a nenhuma vaga?')) return;
        
        setIsSendingBroadcast(true);
        setBroadcastProgress('Filtrando candidatos...');
        
        try {
            // 1. Buscar IDs de quem já se candidatou
            const { data: allCandidaturas } = await supabase.from('candidaturas').select('user_id');
            const idsComInscricao = new Set((allCandidaturas || []).map(c => c.user_id));
            
            // 2. Buscar todos os candidatos
            const { data: allCandidatos, error: errC } = await supabase
                .from('curriculos')
                .select('email, user_id');
            
            if (errC) throw errC;
            
            // 3. Filtrar somente os que não tem inscrição
            const candidatosAlvo = allCandidatos.filter(c => !idsComInscricao.has(c.user_id));

            if (candidatosAlvo.length === 0) {
                alert('Nenhum candidato pendente encontrado!');
                setIsSendingBroadcast(false);
                setBroadcastProgress(null);
                return;
            }

            let successCount = 0;
            for (let i = 0; i < candidatosAlvo.length; i++) {
                const cand = candidatosAlvo[i];
                setBroadcastProgress(`Enviando ${i + 1} de ${candidatosAlvo.length}...`);

                try {
                    const { error: fnError } = await supabase.functions.invoke('send-delayed-email', {
                        body: { 
                            userEmail: cand.email, 
                            type: 'novas_vagas' 
                        }
                    });
                    if (!fnError) successCount++;
                } catch (e) {
                    console.error(`Erro ao disparar para ${cand.email}:`, e);
                }
                await new Promise(res => setTimeout(res, 100));
            }

            alert(`🎯 Sucesso! ${successCount} e-mails enviados para incentivar a primeira candidatura.`);
            carregarAutomacao();
        } catch (err) {
            console.error('Erro no disparo:', err);
            alert('Falha ao processar disparo.');
        } finally {
            setIsSendingBroadcast(false);
            setBroadcastProgress(null);
        }
    };

    const fetchRegistrationData = async () => {
        try {
            const now = new Date();
            const startDate = new Date();
            startDate.setDate(now.getDate() - chartPeriod);
            startDate.setHours(0,0,0,0);

            const { data, error } = await supabase
                .from('user_roles')
                .select('created_at')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Agrupar por dia (usando timezone local para o label)
            const counts = {};
            for (let i = 0; i <= chartPeriod; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];
                counts[dateStr] = 0;
            }

            data.forEach(item => {
                // Ajuste para o dia local do navegador/servidor para bater com o que o david vê
                const d = new Date(item.created_at);
                const day = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
                if (counts[day] !== undefined) counts[day]++;
            });

            const formatted = Object.entries(counts)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));

            setRegistrationData(formatted);
        } catch (err) { console.error('Erro gráfico:', err); }
    };

    const handleAprovarEmpresa = async (id, status) => {
        await supabase.from('empresas').update({ aprovada: status }).eq('id', id);
        carregarTodasEmpresas();
        notify('Status da empresa atualizado!', 'success');
    };

    const handleMudarPlano = async (id, novoPlano) => {
        try {
            const { error } = await supabase.from('empresas').update({ plan_type: novoPlano }).eq('id', id);
            if (error) throw error;
            carregarTodasEmpresas();
            notify(`Plano alterado para ${novoPlano.toUpperCase()}!`, 'success');
        } catch (err) {
            notify('Erro ao alterar plano: ' + err.message, 'error');
        }
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
            // [NOVO] Engenharia Sênior: Criação direta e confirmada via RPC
            const { data, error } = await supabase.rpc('admin_create_empresa_direct', {
                p_email: newEmpresaData.email,
                p_password: newEmpresaData.password,
                p_razao_social: newEmpresaData.razao_social,
                p_cnpj: newEmpresaData.cnpj
            });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.message);

            setShowNewEmpresaModal(false);
            setNewEmpresaData({ razao_social: '', cnpj: '', email: '', password: '' });
            carregarTodasEmpresas();
            notify('Empresa criada e conta ATIVA!', 'success');
        } catch (err) { 
            notify('Erro ao criar empresa: ' + err.message, 'error'); 
        } finally { 
            setCreatingEmpresa(false); 
        }
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
            <Navbar icon={<BrandLogo size={24} />} title="NORTE EMPREGOS" subtitle="ADMIN">
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleLogout} className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', width: 'auto' }}><LogOut size={16} /> SAIR</button>
                </div>
            </Navbar>

            <div className="container" style={{ marginTop: '2rem' }}>
                {/* NAVEGAÇÃO POR TABS ESTILIZADA (Substitui o menu antigo) */}
                <div style={{ 
                    display: 'flex', 
                    gap: isMobile ? '4px' : '8px', 
                    marginBottom: '2rem', 
                    flexWrap: isMobile ? 'nowrap' : 'wrap', 
                    background: 'rgba(255,255,255,0.02)', 
                    padding: '8px', 
                    borderRadius: '16px',
                    overflowX: isMobile ? 'auto' : 'visible',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                }} className="tabs-row">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: isMobile ? '6px' : '10px',
                                    padding: isMobile ? '8px 12px' : '12px 20px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: active ? 'var(--norte-green)' : 'transparent',
                                    color: active ? '#fff' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontWeight: 600,
                                    fontSize: isMobile ? '0.75rem' : '0.9rem',
                                    whiteSpace: 'nowrap',
                                    boxShadow: active ? '0 4px 15px rgba(0, 141, 76, 0.3)' : 'none'
                                }}
                            >
                                <Icon size={isMobile ? 16 : 18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {activeTab === 'visao' && (
                    <div className="glass-panel animation-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', flexDirection: isMobile ? 'column' : 'row' }}>
                            <h2 style={{ color: 'var(--neon-blue)', margin: 0, fontSize: isMobile ? '1.3rem' : '1.8rem' }}>📊 Dashboard de Performance</h2>
                            
                            <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.1)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.3)' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e', animation: 'pulse 2s infinite' }}></div>
                                    <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.8rem' }}>{ativosAgora} {isMobile ? 'On' : 'Simultâneos'}</span>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <select className="neon-input" value={diasFiltro} onChange={e => setDiasFiltro(e.target.value)} style={{ width: 'auto', marginBottom: 0, padding: '8px 12px', height: '38px', fontSize: '0.85rem' }}>
                                        <option value="hoje">Hoje</option>
                                        <option value="ontem">Ontem</option>
                                        <option value="3">3 dias</option>
                                        <option value="7">7 dias</option>
                                        <option value="14">14 dias</option>
                                        <option value="custom">Personalizado</option>
                                    </select>

                                    {diasFiltro === 'custom' && (
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <input type="date" value={customDates.start} onChange={e => setCustomDates(p => ({...p, start: e.target.value}))} className="neon-input" style={{ width: '100px', marginBottom: 0, padding: '4px', fontSize: '0.75rem' }} />
                                            <input type="date" value={customDates.end} onChange={e => setCustomDates(p => ({...p, end: e.target.value}))} className="neon-input" style={{ width: '100px', marginBottom: 0, padding: '4px', fontSize: '0.75rem' }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {loading ? <p>Carregando métricas...</p> : (
                            <>
                                {/* STATS GLOBAIS (ESTILO ANTIGO MELHORADO) */}
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: isMobile ? '0.75rem' : '1rem', marginBottom: '2rem' }}>
                                    <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)', textAlign: 'center' }}>
                                        <div style={{ color: 'var(--neon-blue)', fontSize: isMobile ? '0.65rem' : '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Candidatos</div>
                                        <div style={{ fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: 800 }}>{stats.candidatos}</div>
                                    </div>
                                    <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)', textAlign: 'center' }}>
                                        <div style={{ color: 'var(--neon-purple)', fontSize: isMobile ? '0.65rem' : '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Parceiros</div>
                                        <div style={{ fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: 800 }}>{stats.empresas}</div>
                                    </div>
                                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)', textAlign: 'center' }}>
                                        <div style={{ color: '#4ade80', fontSize: isMobile ? '0.65rem' : '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Perfis Salvos</div>
                                        <div style={{ fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: 800 }}>{stats.perfisCompletos}</div>
                                    </div>
                                    <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.2)', textAlign: 'center' }}>
                                        <div style={{ color: '#fbbf24', fontSize: isMobile ? '0.65rem' : '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Vagas Ativas</div>
                                        <div style={{ fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: 800 }}>{vagasList.filter(v => v.status === 'aberta').length}</div>
                                    </div>
                                    <div style={{ background: 'rgba(124, 58, 237, 0.1)', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '12px', border: '1px solid rgba(124, 58, 237, 0.2)', textAlign: 'center', gridColumn: isMobile ? 'span 2' : 'auto' }}>
                                        <div style={{ color: 'var(--neon-purple)', fontSize: isMobile ? '0.65rem' : '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>🚀 Vidas Impactadas</div>
                                        <div style={{ fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: 800 }}>{stats.contratados}</div>
                                    </div>
                                </div>

                                {/* [NEW] GRÁFICO DE TENDÊNCIA */}
                                <TrendChart data={trendData} isMobile={isMobile} />

                                {/* FUNIL DE CONVERSÃO VISUAL */}
                                <div style={{ marginTop: '3rem', marginBottom: '2rem' }}>
                                    <h3 style={{ color: 'var(--neon-blue)', fontSize: isMobile ? '0.85rem' : '1rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>📊 Inteligência do Funil (Conversão)</h3>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: isMobile ? '1rem' : '2rem', alignItems: 'center' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: isMobile ? '1rem' : '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            {/* Camada 1: Visitantes */}
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>1. Visitantes Únicos</span>
                                                    <span style={{ fontWeight: 700 }}>{metricasFunil.visitas}</span>
                                                </div>
                                                <div style={{ height: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                                                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, var(--neon-blue), transparent)', opacity: 0.8 }}></div>
                                                </div>
                                            </div>

                                            {/* Camada 2: Inscritos */}
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>2. Registros (Contas Criadas)</span>
                                                    <span style={{ fontWeight: 700 }}>{metricasFunil.inscritos} <span style={{ color: '#4ade80', fontSize: '0.75rem' }}>({metricasFunil.visitas > 0 ? Math.round((metricasFunil.inscritos / metricasFunil.visitas) * 100) : 0}%)</span></span>
                                                </div>
                                                <div style={{ height: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '0 4px', display: 'flex', alignItems: 'center' }}>
                                                    <div style={{ 
                                                        width: `calc(${metricasFunil.visitas > 0 ? (metricasFunil.inscritos / metricasFunil.visitas) * 100 : 0}% - 8px)`, 
                                                        height: '22px', background: 'linear-gradient(90deg, var(--neon-purple), transparent)', borderRadius: '4px' 
                                                    }}></div>
                                                </div>
                                            </div>

                                            {/* Camada 3: Com Currículo */}
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>3. Com Currículo (Prontos)</span>
                                                    <span style={{ fontWeight: 700 }}>{metricasFunil.completos} <span style={{ color: '#4ade80', fontSize: '0.75rem' }}>({metricasFunil.inscritos > 0 ? Math.round((metricasFunil.completos / metricasFunil.inscritos) * 100) : 0}%)</span></span>
                                                </div>
                                                <div style={{ height: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '0 4px', display: 'flex', alignItems: 'center' }}>
                                                    <div style={{ 
                                                        width: `calc(${metricasFunil.visitas > 0 ? (metricasFunil.completos / metricasFunil.visitas) * 100 : 0}% - 8px)`, 
                                                        height: '22px', background: 'linear-gradient(90deg, #38bdf8, transparent)', borderRadius: '4px' 
                                                    }}></div>
                                                </div>
                                            </div>

                                            {/* Camada 4: Candidatos */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>4. Candidatos (Interesse Real)</span>
                                                    <span style={{ fontWeight: 700 }}>{metricasFunil.candidatos} <span style={{ color: '#4ade80', fontSize: '0.75rem' }}>({metricasFunil.completos > 0 ? Math.round((metricasFunil.candidatos / metricasFunil.completos) * 100) : 0}%)</span></span>
                                                </div>
                                                <div style={{ height: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '0 4px', display: 'flex', alignItems: 'center' }}>
                                                    <div style={{ 
                                                        width: `calc(${metricasFunil.visitas > 0 ? (metricasFunil.candidatos / metricasFunil.visitas) * 100 : 0}% - 8px)`, 
                                                        height: '22px', background: 'linear-gradient(90deg, #4ade80, transparent)', borderRadius: '4px' 
                                                    }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(0,0,0,0.2))', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.1)', textAlign: 'center' }}>
                                                <div style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>⛔ Não Terminaram CV</div>
                                                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fca5a5' }}>{metricasFunil.abandonos}</div>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>Registraram mas sumiram.</p>
                                            </div>

                                            <div style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(0,0,0,0.2))', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(251, 191, 36, 0.1)', textAlign: 'center' }}>
                                                <div style={{ color: '#fbbf24', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>⚠️ Com CV mas sem Vaga</div>
                                                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fde68a' }}>{metricasFunil.sem_candidatura}</div>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>Prontos, mas não aplicaram.</p>
                                            </div>

                                            <button onClick={() => setActiveTab('automacao')} className="neon-button secondary" style={{ fontSize: '0.7rem', padding: '10px 12px', width: '100%', margin: 0 }}>
                                                🚀 RECUPERAR VIA E-MAIL
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* RETENCAO E ATIVOS */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                    <div style={{ background: '#fffbeb', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '12px', border: '1px solid #fef3c7', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{ background: '#fef3c7', padding: isMobile ? '10px' : '15px', borderRadius: '12px' }}><Clock color="#d97706" size={isMobile ? 24 : 32} /></div>
                                        <div>
                                            <p style={{ margin: 0, color: '#92400e', fontSize: '0.75rem', fontWeight: 600 }}>DAU (Contas Ativas Diárias)</p>
                                            <h3 style={{ margin: '5px 0 0', fontSize: isMobile ? '1.5rem' : '1.8rem', color: '#78350f' }}>{metricasTempo?.dau || 0}</h3>
                                        </div>
                                    </div>
                                    <div style={{ background: '#f0fdf4', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '12px', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{ background: '#dcfce7', padding: isMobile ? '10px' : '15px', borderRadius: '12px' }}><Activity color="#16a34a" size={isMobile ? 24 : 32} /></div>
                                        <div>
                                            <p style={{ margin: 0, color: '#166534', fontSize: '0.75rem', fontWeight: 600 }}>WAU (Contas Ativas Semanais)</p>
                                            <h3 style={{ margin: '5px 0 0', fontSize: isMobile ? '1.5rem' : '1.8rem', color: '#14532d' }}>{metricasTempo?.wau || 0}</h3>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'usuarios' && (
                    <div className="glass-panel animation-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', flexDirection: isMobile ? 'column' : 'row' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <h2 style={{ color: 'var(--neon-blue)', margin: 0, fontSize: isMobile ? '1.2rem' : '1.8rem' }}>👥 Base de Candidatos</h2>
                                <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--neon-blue)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>
                                    {totalCand} TOTAL
                                </span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, width: '100%', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
                                <div style={{ position: 'relative', flex: 1, maxWidth: isMobile ? '100%' : '400px' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input 
                                        className="neon-input" 
                                        placeholder="Buscar por nome..." 
                                        style={{ paddingLeft: '40px', marginBottom: 0, width: '100%' }}
                                        value={searchCand}
                                        onChange={(e) => {
                                            setSearchCand(e.target.value);
                                            setPageCandidates(1);
                                        }}
                                    />
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button onClick={carregarUsuarios} className="neon-button secondary" style={{ margin: 0, padding: '8px', width: '38px', height: '38px' }}>
                                        <RefreshCw size={16} className={loading ? 'spin' : ''} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {loading ? <p>Carregando usuários...</p> : (
                            <div className="table-responsive">
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                        <tr>
                                            <th style={{ padding: '15px' }}>Nome / Contato</th>
                                            {!isMobile && <th style={{ padding: '15px' }}>Gênero</th>}
                                            <th style={{ padding: '15px', textAlign: 'center' }}>Vagas</th>
                                            <th style={{ padding: '15px', textAlign: 'center' }}>Perfil</th>
                                            {!isMobile && <th style={{ padding: '15px' }}>Último Acesso</th>}
                                            <th style={{ padding: '15px' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usuariosList.map(u => (
                                            <tr key={u.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ fontWeight: 700 }}>{u.nome || 'Sem Nome'}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Mail size={10} /> {u.email}
                                                    </div>
                                                </td>
                                                {!isMobile && <td style={{ padding: '15px' }}>{u.genero || '—'}</td>}
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    <span style={{ 
                                                        padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800,
                                                        background: u.total_candidaturas > 0 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                        color: u.total_candidaturas > 0 ? 'var(--neon-blue)' : '#ef4444'
                                                    }}>
                                                        {u.total_candidaturas}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                                        <div style={{ width: isMobile ? '40px' : '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${u.completude}%`, height: '100%', background: u.completude >= 80 ? '#22c55e' : (u.completude >= 40 ? '#eab308' : '#ef4444') }}></div>
                                                        </div>
                                                        {!isMobile && <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{u.completude}%</span>}
                                                    </div>
                                                </td>
                                                {!isMobile && <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{new Date(u.updated_at).toLocaleDateString()}</td>}
                                                <td style={{ padding: '15px', gap: '6px', display: 'flex' }}>
                                                    <button 
                                                        onClick={() => {
                                                            if (u.telefone) window.open(`https://wa.me/55${u.telefone.replace(/\D/g, '')}`, '_blank');
                                                        }} 
                                                        className="neon-button secondary" 
                                                        style={{ margin: 0, padding: '4px 8px', fontSize: '0.7rem', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e' }}
                                                        disabled={!u.telefone}
                                                    >
                                                        <Send size={14} />
                                                    </button>
                                                    <button onClick={() => window.open(`/cv-preview/${u.user_id}`, '_blank')} className="neon-button secondary" style={{ margin: 0, padding: '4px 10px', fontSize: '0.7rem', width: 'auto' }}>
                                                        {isMobile ? 'CV' : 'VER CV'}
                                                    </button>
                                                    <button className="neon-button error" style={{ margin: 0, padding: '8px', fontSize: '0.7rem', width: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444' }}>
                                                        <Trash2 size={14}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* PAGINAÇÃO NUMERADA ADMIN */}
                        {!loading && totalCand > pageSizeCand && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '2rem', flexWrap: 'wrap' }}>
                                <button 
                                    onClick={() => setPageCandidates(p => Math.max(1, p - 1))}
                                    disabled={pageCandidates === 1}
                                    className="neon-button secondary"
                                    style={{ width: 'auto', margin: 0, padding: '8px 16px' }}
                                >
                                    Anterior
                                </button>

                                {Array.from({ length: Math.ceil(totalCand / pageSizeCand) }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === Math.ceil(totalCand / pageSizeCand) || Math.abs(p - pageCandidates) <= 2)
                                    .map((p, idx, arr) => (
                                        <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: 'var(--text-muted)' }}>...</span>}
                                            <button
                                                onClick={() => setPageCandidates(p)}
                                                className={pageCandidates === p ? "neon-button" : "neon-button secondary"}
                                                style={{ 
                                                    width: '40px', height: '40px', margin: 0, padding: 0,
                                                    background: pageCandidates === p ? 'var(--neon-blue)' : 'transparent',
                                                    color: pageCandidates === p ? '#000' : 'var(--text-main)',
                                                    borderColor: pageCandidates === p ? 'var(--neon-blue)' : 'rgba(255,255,255,0.1)'
                                                }}
                                            >
                                                {p}
                                            </button>
                                        </div>
                                    ))}

                                <button 
                                    onClick={() => setPageCandidates(p => Math.min(Math.ceil(totalCand / pageSizeCand), p + 1))}
                                    disabled={pageCandidates >= Math.ceil(totalCand / pageSizeCand)}
                                    className="neon-button secondary"
                                    style={{ width: 'auto', margin: 0, padding: '8px 16px' }}
                                >
                                    Próxima
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'vagas' && (
                    <div className="glass-panel animation-fade-in">
                        <h2 style={{ color: 'var(--neon-blue)', marginBottom: '1.5rem' }}>💼 Gerenciamento de Vagas</h2>
                        {loading ? <p>Carregando vagas...</p> : (
                            <div className="table-responsive">
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <tr>
                                            <th style={{ padding: '12px' }}>Empresa / Vaga</th>
                                            {!isMobile && <th style={{ padding: '12px' }}>Publicada em</th>}
                                            <th style={{ padding: '12px' }}>Status</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Cands</th>
                                            <th style={{ padding: '12px' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vagasList.map(v => (
                                            <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <strong>{v.empresas?.razao_social || 'Desconhecida'}</strong>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{v.titulo}</div>
                                                </td>
                                                {!isMobile && <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{new Date(v.created_at).toLocaleDateString()}</td>}
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', 
                                                        background: v.status === 'aberta' ? 'rgba(0,240,255,0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                        color: v.status === 'aberta' ? 'var(--neon-blue)' : '#ef4444' }}>
                                                        {v.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', fontWeight: 'bold', textAlign: 'center' }}>{v.candidaturas?.[0]?.count || 0}</td>
                                                <td style={{ padding: '12px', gap: '4px', display: 'flex' }}>
                                                    {v.status === 'aberta' ? (
                                                        <button onClick={() => handleAcaoVaga(v.id, 'suspensa')} className="neon-button secondary" style={{ margin: 0, padding: '4px 8px', fontSize: '0.7rem', width: 'auto' }}>Suspender</button>
                                                    ) : (
                                                        <button onClick={() => handleAcaoVaga(v.id, 'aberta')} className="neon-button secondary" style={{ margin: 0, padding: '4px 8px', fontSize: '0.7rem', width: 'auto' }}>Liberar</button>
                                                    )}
                                                    <button className="neon-button error" style={{ margin: 0, padding: '6px', fontSize: '0.7rem', width: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444' }}><Trash2 size={14}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'automacao' && (
                    <div className="glass-panel animation-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem', flexDirection: isMobile ? 'column' : 'row' }}>
                            <div>
                                <h2 style={{ color: 'var(--neon-purple)', margin: 0, fontSize: isMobile ? '1.2rem' : '1.8rem' }}>⚡ Inteligência de Automação</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.75rem' : '0.9rem' }}>Monitoramento em tempo real dos disparos de e-mail e retenção.</p>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
                                <button 
                                    onClick={handleDisparoRecuperacao} 
                                    disabled={isSendingEmails}
                                    className="neon-button" 
                                    style={{ 
                                        width: isMobile ? '100%' : 'auto', margin: 0, padding: isMobile ? '10px 15px' : '8px 20px', 
                                        background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                                        borderColor: '#f59e0b',
                                        fontSize: isMobile ? '0.75rem' : '0.85rem',
                                        opacity: isSendingEmails ? 0.7 : 1
                                    }}
                                >
                                    {isSendingEmails ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                            <RefreshCw size={14} className="spin" /> {sendProgress}
                                        </div>
                                    ) : (
                                        '🚀 DISPARAR RECUPERAÇÃO (2 dias)'
                                    )}
                                </button>
                                <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
                                    <select className="neon-input" value={filtroAutomacao} onChange={e => setFiltroAutomacao(Number(e.target.value))} style={{ flex: 1, marginBottom: 0, padding: '8px', height: '40px', fontSize: '0.8rem' }}>
                                        <option value={1}>Hoje</option>
                                        <option value={3}>3 dias</option>
                                        <option value={7}>7 dias</option>
                                        <option value={14}>14 dias</option>
                                    </select>
                                    <button onClick={carregarAutomacao} className="neon-button secondary" style={{ width: 'auto', margin: 0, padding: '0 15px', height: '40px' }}>
                                        <RefreshCw size={16} /> {isMobile ? '' : 'ATUALIZAR'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* NOVO: BANNER DE BROADCAST DE VAGAS */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            {/* BROADCAST GERAL */}
                            <div style={{ 
                                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(56, 189, 248, 0.1))',
                                padding: isMobile ? '1.2rem' : '1.5rem', borderRadius: '16px',
                                border: '1px solid rgba(124, 58, 237, 0.2)',
                                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem'
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: isMobile ? '1rem' : '1.1rem' }}>📣 Divulgar Novas Vagas (Geral)</h3>
                                    <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
                                        Envia um e-mail para <strong>toda a base</strong> convidando-os a ver as oportunidades.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleDisparoNovasVagas}
                                    disabled={isSendingBroadcast}
                                    className="neon-button" 
                                    style={{ 
                                        width: '100%', margin: 0, padding: '10px', 
                                        background: 'var(--neon-purple)', color: '#fff',
                                        fontWeight: 800, fontSize: isMobile ? '0.75rem' : '0.9rem',
                                        boxShadow: '0 0 15px rgba(124, 58, 237, 0.4)'
                                    }}
                                >
                                    {isSendingBroadcast ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                            <RefreshCw size={14} className="spin" /> {broadcastProgress}
                                        </div>
                                    ) : (
                                        <>📢 DISPARAR PARA TODOS</>
                                    )}
                                </button>
                            </div>

                            {/* BROADCAST SEM INSCRIÇÃO */}
                            <div style={{ 
                                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(34, 197, 94, 0.1))',
                                padding: isMobile ? '1.2rem' : '1.5rem', borderRadius: '16px',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem'
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: isMobile ? '1rem' : '1.1rem' }}>🎯 Recuperar Sem Inscrição</h3>
                                    <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
                                        Foca nos candidatos que <strong>ainda não se candidataram</strong> a nenhuma vaga.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleDisparoSemInscricao}
                                    disabled={isSendingBroadcast}
                                    className="neon-button" 
                                    style={{ 
                                        width: '100%', margin: 0, padding: '10px', 
                                        background: 'var(--neon-blue)', color: '#000',
                                        fontWeight: 800, fontSize: isMobile ? '0.75rem' : '0.9rem',
                                        boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
                                    }}
                                >
                                    {isSendingBroadcast ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                            <RefreshCw size={14} className="spin" /> {broadcastProgress}
                                        </div>
                                    ) : (
                                        <>🎯 DISPARAR SEM INSCRIÇÃO</>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                            {/* CARD DE TESTE DE NOTIFICAÇÕES (APENAS DAVID) */}
                            {isDavidAdmin && (
                                <div className="glass-panel" style={{ 
                                    border: '1px solid var(--neon-blue)', 
                                    background: 'rgba(0, 240, 255, 0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                                        <Shield size={80} color="var(--neon-blue)" />
                                    </div>
                                    <h4 style={{ margin: 0, color: 'var(--neon-blue)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Send size={16} /> TESTE DE SISTEMA
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        David, use este botão para validar as **Notificações do Navegador** no seu dispositivo.
                                    </p>
                                    <button 
                                        onClick={handleTesteNotificacao}
                                        className="neon-button" 
                                        style={{ margin: 0, padding: '8px', fontSize: '0.8rem', background: 'var(--neon-blue)', color: '#000' }}
                                    >
                                        {notifPermission === 'granted' ? '🔔 ENVIAR NOTIFICAÇÃO TESTE' : '🔕 ATIVAR NOTIFICAÇÕES'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {loading ? <p>Carregando estatísticas...</p> : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                                    <div style={{ background: 'rgba(168, 85, 247, 0.05)', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '16px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                                        <div style={{ color: 'var(--neon-purple)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>E-mails Enviados</div>
                                        <div style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 900 }}>{automationStats.sent}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>Total hoje</div>
                                    </div>
                                    <div style={{ background: 'rgba(34, 197, 94, 0.05)', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                        <div style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>Taxa Abertura</div>
                                        <div style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 900 }}>
                                            {automationStats.sent > 0 ? Math.round((automationStats.opened / automationStats.sent) * 100) : 0}%
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>{automationStats.opened} aberturas</div>
                                    </div>
                                    <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                        <div style={{ color: 'var(--neon-blue)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>Recuperados</div>
                                        <div style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 900 }}>{automationStats.recovered}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>Completaram CV</div>
                                    </div>
                                </div>

                                <h3 style={{ marginBottom: '1.5rem', fontSize: isMobile ? '1.1rem' : '1.5rem' }}>🎯 Últimos Disparos</h3>
                                        <div className="table-responsive">
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
                                                <thead>
                                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                                                        <th style={{ padding: '12px' }}>Candidato</th>
                                                        {!isMobile && <th style={{ padding: '12px' }}>Gatilho</th>}
                                                        <th style={{ padding: '12px' }}>Status</th>
                                                        <th style={{ padding: '12px' }}>Data</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recentNotifications.map(n => (
                                                        <tr key={n.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                            <td style={{ padding: '12px', maxWidth: isMobile ? '130px' : 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                <div style={{ fontWeight: 600 }}>{n.candidato_email || 'Usuário'}</div>
                                                                {isMobile && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{n.tipo === 'sem_curriculo' ? '📝 Cadastro' : '💼 Vagas'}</div>}
                                                            </td>
                                                            {!isMobile && <td style={{ padding: '12px' }}>
                                                                <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                                                                    {n.tipo === 'sem_curriculo' ? '📝 Cadastro' : '💼 Vagas'}
                                                                </span>
                                                            </td>}
                                                            <td style={{ padding: '12px' }}>
                                                                <span style={{ 
                                                                    color: n.status === 'opened' ? '#4ade80' : (n.status === 'clicked' ? 'var(--neon-blue)' : 'var(--text-muted)'),
                                                                    display: 'flex', alignItems: 'center', gap: '5px'
                                                                }}>
                                                                    {n.status === 'opened' && <CheckCircle size={14} />}
                                                                    {n.status === 'clicked' && <Activity size={14} />}
                                                                    {n.status.toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(n.enviado_em).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                    {recentNotifications.length === 0 && (
                                                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum disparo registrado ainda.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'notificacoes' && (
                    <div className="glass-panel animation-fade-in">
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ color: 'var(--neon-blue)', margin: 0, fontSize: isMobile ? '1.2rem' : '1.8rem' }}>🔔 Central de Notificações Push</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.75rem' : '0.9rem' }}>Dispare alertas em tempo real diretamente para o navegador dos usuários.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 350px', gap: '2rem' }}>
                            <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#fff' }}>Criar Nova Notificação</h3>
                                <form onSubmit={handleBroadcastPush} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Título da Notificação</label>
                                        <input 
                                            type="text" 
                                            className="neon-input" 
                                            placeholder="Ex: 🚀 5 Novas Vagas em Manaus!" 
                                            value={pushTitle}
                                            onChange={e => setPushTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Mensagem (Corpo)</label>
                                        <textarea 
                                            className="neon-input" 
                                            placeholder="Ex: Confira as novas oportunidades de Engenharia que acabaram de ser publicadas no portal." 
                                            style={{ minHeight: '100px', resize: 'vertical' }}
                                            value={pushBody}
                                            onChange={e => setPushBody(e.target.value)}
                                            required
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Link de Destino (URL)</label>
                                        <input 
                                            type="text" 
                                            className="neon-input" 
                                            placeholder="/vagas" 
                                            value={pushUrl}
                                            onChange={e => setPushUrl(e.target.value)}
                                        />
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>O usuário será levado para cá ao clicar.</span>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={isSendingPush || pushSubscribers === 0}
                                        className="neon-button" 
                                        style={{ 
                                            marginTop: '1rem', 
                                            background: 'var(--neon-blue)', 
                                            color: '#000',
                                            fontWeight: 800,
                                            opacity: (isSendingPush || pushSubscribers === 0) ? 0.5 : 1
                                        }}
                                    >
                                        {isSendingPush ? 'ENVIANDO...' : `DISPARAR PARA ${pushSubscribers} INSCRITOS 🚀`}
                                    </button>
                                </form>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="glass-panel" style={{ border: '1px solid rgba(0, 240, 255, 0.2)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--neon-blue)', fontWeight: 700, marginBottom: '5px' }}>AUDIÊNCIA ALCANÇÁVEL</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{pushSubscribers}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Navegadores com Permissão Ativa</div>
                                </div>

                                <div className="glass-panel" style={{ fontSize: '0.85rem' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--neon-purple)' }}>💡 Dicas de Engajamento</h4>
                                    <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <li>Use <b>Emojis</b> para chamar mais atenção.</li>
                                        <li>Mantenha o título com menos de <b>40 caracteres</b>.</li>
                                        <li>Notificações enviadas às <b>08:00</b> ou <b>18:00</b> costumam ter mais cliques.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )  }

                {activeTab === 'empresas' && (
                    <div className="glass-panel animation-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>🏢 Gerenciar Parceiros</h2>
                            <button onClick={() => setShowNewEmpresaModal(true)} className="neon-button" style={{ margin: 0, padding: '8px 16px', width: 'auto' }}>
                                <Plus size={16} /> NOVO PERFIL
                            </button>
                        </div>
                        
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '12px' }}>Empresa</th>
                                        {!isMobile && <th style={{ padding: '12px' }}>CNPJ</th>}
                                        {!isMobile && <th style={{ padding: '12px' }}>Plano</th>}
                                        <th style={{ padding: '12px' }}>Status</th>
                                        <th style={{ padding: '12px' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allEmpresas.map(emp => (
                                        <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '12px' }}>
                                                <strong>{emp.razao_social}</strong>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Membro desde: {new Date(emp.created_at).toLocaleDateString()}</div>
                                            </td>
                                            {!isMobile && <td style={{ padding: '12px' }}>{emp.cnpj || '—'}</td>}
                                            {!isMobile && <td style={{ padding: '12px' }}>
                                                <span style={{ 
                                                    padding: '4px 10px', 
                                                    borderRadius: '20px', 
                                                    fontSize: '0.75rem', 
                                                    fontWeight: 800,
                                                    background: emp.plan_type === 'premium' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                                                    color: emp.plan_type === 'premium' ? '#a855f7' : '#94a3b8'
                                                }}>
                                                    {(emp.plan_type || 'BASIC').toUpperCase()}
                                                </span>
                                            </td>}
                                            <td style={{ padding: '12px' }}>
                                                <span style={{ 
                                                    padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', 
                                                    background: !emp.aprovada ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                                    color: !emp.aprovada ? '#ef4444' : '#22c55e',
                                                    fontWeight: 600
                                                }}>
                                                    {emp.aprovada ? 'ATIVO' : 'BLOQUEADO'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', gap: '6px', display: 'flex' }}>
                                                <button 
                                                    onClick={() => handleMudarPlano(emp.id, emp.plan_type === 'premium' ? 'basic' : 'premium')}
                                                    className="neon-button secondary"
                                                    style={{ 
                                                        margin: 0, padding: '4px 10px', fontSize: '0.7rem', width: 'auto', 
                                                        background: emp.plan_type === 'premium' ? 'rgba(34, 197, 94, 0.1)' : 'var(--neon-purple)', 
                                                        color: emp.plan_type === 'premium' ? '#22c55e' : '#fff' 
                                                    }}
                                                >
                                                    {emp.plan_type === 'premium' ? (isMobile ? 'BASIC' : 'Rebaixar p/ Basic') : (isMobile ? '⭐ PREM' : '⭐ Tornar Premium')}
                                                </button>
                                                <button 
                                                    onClick={() => handleAprovarEmpresa(emp.id, !emp.aprovada)} 
                                                    className="neon-button secondary" 
                                                    style={{ margin: 0, padding: '4px 10px', fontSize: '0.7rem', width: 'auto' }}
                                                >
                                                    {emp.aprovada ? (isMobile ? 'BLOQ' : 'Bloquear') : (isMobile ? 'LIBERAR' : 'Liberar')}
                                                </button>
                                                <button onClick={() => setUserToDelete(emp)} className="neon-button error" style={{ margin: 0, padding: '6px', fontSize: '0.7rem', width: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444' }}>
                                                    <Trash2 size={14}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'metricas' && (
                    <div className="glass-panel animation-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>📊 Inteligência de Dados</h2>
                            <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px' }}>
                                {[7, 14, 30].map(p => (
                                    <button key={p} onClick={() => setChartPeriod(p)} style={{
                                        padding: '6px 14px', borderRadius: '10px', border: 'none',
                                        background: chartPeriod === p ? 'var(--neon-blue)' : 'transparent',
                                        color: chartPeriod === p ? '#000' : '#94a3b8',
                                        fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                                    }}>{p} D</button>
                                ))}
                            </div>
                        </div>

                        {/* FLUXO DE CADASTROS */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Fluxo de Novos Cadastros</h3>
                            <div style={{ height: '250px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '10px', paddingBottom: '20px' }}>
                                {registrationData.map((d, idx) => {
                                    const max = Math.max(...registrationData.map(val => val.count), 5);
                                    const height = (d.count / max) * 100;
                                    return (
                                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                                            <div style={{ 
                                                width: '100%', height: `${height}%`, minHeight: d.count > 0 ? '5px' : '0',
                                                background: 'linear-gradient(to top, var(--neon-purple), var(--neon-blue))',
                                                borderRadius: '4px 4px 0 0', position: 'relative'
                                            }}>
                                                <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--neon-blue)' }}>{d.count}</div>
                                            </div>
                                            <span style={{ fontSize: '0.6rem', color: '#64748b', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                                                {d.date.split('-').slice(1).reverse().join('/')}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Top 5 Vagas Mais Procuradas</h3>
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
                        <h2 style={{ color: 'var(--neon-blue)', marginBottom: '1.5rem', fontSize: isMobile ? '1.2rem' : '1.8rem' }}>🔐 Log de Auditoria</h2>
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
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
                                            <td style={{ padding: '12px', maxWidth: isMobile ? '120px' : 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.email.toLowerCase()}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{ color: '#4ade80', fontWeight: 600 }}>{l.action.toUpperCase()}</span>
                                            </td>
                                            <td style={{ padding: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(l.accessed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'lgpd' && (
                    <div className="glass-panel animation-fade-in">
                        <h2 style={{ color: 'var(--neon-blue)', marginBottom: '1.5rem', fontSize: isMobile ? '1.2rem' : '1.8rem' }}>🛡️ Privacidade LGPD</h2>
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
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
                                            <td style={{ padding: '12px', maxWidth: isMobile ? '150px' : 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.email.toLowerCase()}</td>
                                            <td style={{ padding: '12px' }}>
                                                {l.accepted_terms ? <span style={{color: '#4ade80', fontWeight: 800}}>ACEITO</span> : <span style={{color: '#ef4444', fontWeight: 800}}>RESTRITO</span>}
                                            </td>
                                            <td style={{ padding: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(l.consented_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'denuncias' && (
                    <div className="glass-panel animation-fade-in">
                        <h2 style={{ color: '#f87171', marginBottom: '1.5rem', fontSize: isMobile ? '1.2rem' : '1.8rem' }}>🚨 Ouvidoria / Denúncias</h2>
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
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
                                                <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{d.empresas?.razao_social}</span>
                                            </td>
                                            <td style={{ padding: '12px', color: '#fda4af', fontStyle: 'italic' }}>"{d.motivo}"</td>
                                            <td style={{ padding: '12px' }}>
                                                <button onClick={() => { setVagaToClose(d.vagas); setRelatedDenunciaId(d.id); }} className="neon-button error" style={{ margin: 0, padding: '6px 12px', width: 'auto', fontSize: '0.7rem' }}>SUSPENDER</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'contratacoes' && (
                    <div className="glass-panel animation-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', flexDirection: isMobile ? 'column' : 'row' }}>
                            <div>
                                <h2 style={{ color: 'var(--neon-blue)', margin: 0, fontSize: isMobile ? '1.2rem' : '1.8rem' }}>🏆 Mural de Conquistas</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Relatório consolidado de contratações pelo sistema</p>
                            </div>
                            <div className="input-group" style={{ marginBottom: 0, width: isMobile ? '100%' : '300px' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                                    <input className="neon-input" style={{ paddingLeft: '38px', width: '100%' }} placeholder="Buscar nome ou empresa..." value={filtroContratado} onChange={e => setFiltroContratado(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {loading ? <p>Carregando contratações...</p> : (
                            <div className="table-responsive">
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                        <tr>
                                            <th style={{ padding: isMobile ? '10px' : '1rem' }}>Candidato</th>
                                            <th style={{ padding: isMobile ? '10px' : '1rem' }}>Vaga / Empresa</th>
                                            {!isMobile && <th style={{ padding: '1rem' }}>Data</th>}
                                            {!isMobile && <th style={{ padding: '1rem' }}>Contato</th>}
                                            <th style={{ padding: isMobile ? '10px' : '1rem' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contratacoesList.filter(c => 
                                            c.curriculos?.nome?.toLowerCase().includes(filtroContratado.toLowerCase()) || 
                                            c.vagas?.empresas?.razao_social?.toLowerCase().includes(filtroContratado.toLowerCase())
                                        ).map(c => (
                                            <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: isMobile ? '10px' : '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-blue)', fontWeight: 800, fontSize: '0.7rem' }}>
                                                            {c.curriculos?.nome?.substring(0, 1)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 700 }}>{c.curriculos?.nome}</div>
                                                            {isMobile && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: isMobile ? '10px' : '1rem' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--norte-teal)' }}>{c.vagas?.titulo}</div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{c.vagas?.empresas?.razao_social}</div>
                                                </td>
                                                {!isMobile && <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontSize: '0.9rem' }}>{new Date(c.created_at).toLocaleDateString()}</div>
                                                </td>}
                                                {!isMobile && <td style={{ padding: '1rem' }}>
                                                    <span style={{ fontSize: '0.85rem' }}>{c.curriculos?.telefone || '—'}</span>
                                                </td>}
                                                <td style={{ padding: isMobile ? '10px' : '1rem' }}>
                                                    <button 
                                                        onClick={() => navigate(`/cv-preview/${c.user_id}`)} 
                                                        className="neon-button secondary" 
                                                        style={{ margin: 0, padding: '4px 10px', fontSize: '0.65rem', width: 'auto' }}
                                                    >
                                                        {isMobile ? 'VER' : 'VER PERFIL'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {contratacoesList.length === 0 && (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    <CheckCircle size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                                    <br />Nenhuma contratação oficializada.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
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
                                <button type="submit" disabled={creatingEmpresa} className="neon-button" style={{ margin: 0, background: 'var(--norte-dark-green)' }}>
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
                            <button onClick={confirmFecharVaga} className="neon-button" style={{ margin: 0, background: 'var(--norte-yellow)', color: '#000' }}>SUSPENDER</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SISTEMA DE TOASTS PREMIUM */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 9999,
                    animation: 'slideUpNotif 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                }}>
                    <div className="glass-panel" style={{
                        padding: '16px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: notification.type === 'error' 
                            ? 'rgba(220, 38, 38, 0.95)' 
                            : 'rgba(0, 141, 76, 0.95)',
                        color: '#fff',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                        borderRadius: '20px',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        minWidth: '300px'
                    }}>
                        {notification.type === 'error' ? <ShieldAlert size={28} /> : <CheckCircle size={28} />}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {notification.type === 'error' ? 'Falha no Envio' : 'Sucesso Total'}
                            </span>
                            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>{notification.msg}</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUpNotif {
                    from { transform: translateY(100%) scale(0.9); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
