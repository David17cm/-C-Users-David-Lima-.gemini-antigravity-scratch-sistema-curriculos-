import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    Activity, Users, Briefcase, Mail, LogOut, ArrowRight,
    Filter, RefreshCw, ShieldAlert, Trash2, CheckCircle, Clock,
    Building, BarChart2, Shield, AlertTriangle, Database,
    Plus, Download, Search, XCircle, Send, Lock, Menu, X, Compass
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
    { id: 'logs', label: 'Auditoria', icon: Clock },
    { id: 'lgpd', label: 'Privacidade', icon: Shield },
    { id: 'denuncias', label: 'Ouvidoria', icon: AlertTriangle },
    { id: 'contratacoes', label: 'Contratações', icon: CheckCircle }
];

const TrendChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const width = 800;
    const height = 180;
    const padding = 20;

    const maxVal = Math.max(...data.map(d => Math.max(d.visits, d.signups)), 10);
    // Adiciona 10% de folga no topo para o gráfico respirar
    const effectiveMax = maxVal * 1.1;
    
    const getX = (index) => (index / (data.length - 1 || 1)) * (width - 2 * padding) + padding;
    const getY = (val) => height - ((val / effectiveMax) * (height - 2 * padding) + padding);

    const visitsPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.visits)}`).join(' ');
    const signupsPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.signups)}`).join(' ');

    return (
        <div className="glass-panel" style={{ width: '100%', height: height + 80, padding: '20px', marginTop: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📈 Fluxo de Engajamento
                </span>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                        <div style={{ width: '12px', height: '12px', background: 'var(--norte-green)', borderRadius: '4px', boxShadow: '0 0 10px rgba(0, 141, 76, 0.3)' }}></div> Visitantes
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                        <div style={{ width: '12px', height: '12px', background: 'var(--norte-dark-green)', borderRadius: '4px', boxShadow: '0 0 10px rgba(0, 91, 50, 0.3)' }}></div> Inscrições
                    </span>
                </div>
            </div>
            
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'calc(100% - 40px)', overflow: 'visible' }}>
                <defs>
                    <linearGradient id="gradVisits" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'var(--norte-green)', stopOpacity: 0.4 }} />
                        <stop offset="100%" style={{ stopColor: 'var(--norte-green)', stopOpacity: 0 }} />
                    </linearGradient>
                    <linearGradient id="gradSignups" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'var(--norte-dark-green)', stopOpacity: 0.4 }} />
                        <stop offset="100%" style={{ stopColor: 'var(--norte-dark-green)', stopOpacity: 0 }} />
                    </linearGradient>
                </defs>

                {/* Linhas de Grade (Suaves para Light/Dark mode) */}
                {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                   <line key={pct} x1={padding} y1={getY(effectiveMax * pct)} x2={width-padding} y2={getY(effectiveMax * pct)} stroke="rgba(0, 141, 76, 0.08)" strokeWidth="1" strokeDasharray="4 4" />
                ))}
                
                {/* Preenchimento Dinâmico */}
                <path d={`${visitsPath} L ${getX(data.length-1)} ${height} L ${getX(0)} ${height} Z`} fill="url(#gradVisits)" />
                <path d={`${signupsPath} L ${getX(data.length-1)} ${height} L ${getX(0)} ${height} Z`} fill="url(#gradSignups)" />

                {/* Linhas Principais */}
                <path d={visitsPath} fill="none" stroke="var(--norte-green)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 141, 76, 0.15))' }} />
                <path d={signupsPath} fill="none" stroke="var(--norte-dark-green)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 91, 50, 0.15))' }} />
                
                {/* Pontos Interativos */}
                {data.length < 31 && data.map((d, i) => (
                    <g key={i}>
                        <circle cx={getX(i)} cy={getY(d.visits)} r="4.5" fill="#fff" stroke="var(--neon-blue)" strokeWidth="2.5" />
                        <circle cx={getX(i)} cy={getY(d.signups)} r="4.5" fill="#fff" stroke="var(--neon-purple)" strokeWidth="2.5" />
                    </g>
                ))}
            </svg>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', position: 'absolute', bottom: '15px', width: 'calc(100% - 40px)' }}>
               {data.filter((_, i) => i % Math.max(1, Math.floor(data.length/6)) === 0).map((d, i) => (
                   <span key={i} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
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
        }
    }, [activeTab]);



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
            <Navbar icon={<BrandLogo size={24} />} title="NORTE EMPREGOS" subtitle="ADMIN">
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleLogout} className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', width: 'auto' }}><LogOut size={16} /> SAIR</button>
                </div>
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

                                <select className="neon-input" value={diasFiltro} onChange={e => setDiasFiltro(e.target.value)} style={{ width: 'auto', marginBottom: 0, padding: '8px 16px', height: 'auto' }}>
                                    <option value="hoje">Hoje</option>
                                    <option value="ontem">Ontem</option>
                                    <option value="3">Último 3 dias</option>
                                    <option value="7">Últimos 7 dias</option>
                                    <option value="14">Últimos 14 dias</option>
                                    <option value="custom">Personalizado</option>
                                </select>

                                {diasFiltro === 'custom' && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <input type="date" value={customDates.start} onChange={e => setCustomDates(p => ({...p, start: e.target.value}))} className="neon-input" style={{ width: 'auto', marginBottom: 0, padding: '4px', fontSize: '0.8rem' }} />
                                        <span style={{ fontSize: '0.8rem' }}>até</span>
                                        <input type="date" value={customDates.end} onChange={e => setCustomDates(p => ({...p, end: e.target.value}))} className="neon-input" style={{ width: 'auto', marginBottom: 0, padding: '4px', fontSize: '0.8rem' }} />
                                    </div>
                                )}
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
                                    <div style={{ background: 'rgba(124, 58, 237, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(124, 58, 237, 0.2)', textAlign: 'center', boxShadow: '0 0 20px rgba(124, 58, 237, 0.1)' }}>
                                        <div style={{ color: 'var(--neon-purple)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>🚀 Vidas Impactadas</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.contratados}</div>
                                    </div>
                                </div>

                                {/* [NEW] GRÁFICO DE TENDÊNCIA */}
                                <TrendChart data={trendData} />

                                {/* FUNIL DE CONVERSÃO VISUAL */}
                                <div style={{ marginTop: '3rem', marginBottom: '2rem' }}>
                                    <h3 style={{ color: 'var(--neon-blue)', fontSize: '1rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>📊 Inteligência do Funil (Conversão)</h3>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>👥 Base de Candidatos</h2>
                                <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--neon-blue)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800 }}>
                                    {totalCand} TOTAL
                                </span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '600px', justifyContent: 'flex-end' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input 
                                        className="neon-input" 
                                        placeholder="Buscar candidato por nome..." 
                                        style={{ paddingLeft: '40px', marginBottom: 0 }}
                                        value={searchCand}
                                        onChange={(e) => {
                                            setSearchCand(e.target.value);
                                            setPageCandidates(1);
                                        }}
                                    />
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button onClick={() => {
                                        const sorter = [...usuariosList].sort((a,b) => a.total_candidaturas - b.total_candidaturas);
                                        setUsuariosList(sorter);
                                    }} className="neon-button secondary" title="Menos Inscritos" style={{ margin: 0, padding: '8px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--norte-green)' }}>
                                        <Filter size={16} color="currentColor" />
                                    </button>
                                    <button onClick={carregarUsuarios} className="neon-button secondary" style={{ margin: 0, padding: '8px', width: '38px', height: '38px' }}>
                                        <RefreshCw size={16} className={loading ? 'spin' : ''} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {loading ? <p>Carregando usuários...</p> : (
                            <div className="table-responsive">
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                    <thead style={{ background: '#f8fafc', color: '#475569' }}>
                                        <tr>
                                            <th style={{ padding: '15px' }}>Nome</th>
                                            <th style={{ padding: '15px' }}>Gênero</th>
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
                                                <td style={{ padding: '15px', fontWeight: 600 }} data-label="NOME">{u.nome}</td>
                                                <td style={{ padding: '15px' }} data-label="GÊNERO">{u.genero || '—'}</td>
                                                <td style={{ padding: '15px', color: '#64748b' }} data-label="CONTATO">{u.email}<br/>{u.telefone}</td>
                                                <td style={{ padding: '15px' }} data-label="VAGAS">
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
                                                <td style={{ padding: '15px' }} data-label="PERFIL">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
                                                        <div style={{ width: '80px', height: '8px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${u.completude}%`, height: '100%', background: u.completude >= 80 ? '#22c55e' : (u.completude >= 40 ? '#eab308' : '#ef4444') }}></div>
                                                        </div>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{u.completude}%</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '15px', color: '#64748b' }} data-label="ÚLTIMO">{new Date(u.updated_at).toLocaleDateString()}</td>
                                                <td style={{ padding: '15px', gap: '8px', display: 'flex' }} className="actions-cell">
                                                    <button onClick={() => navigate(`/cv-preview/${u.user_id}`)} className="neon-button secondary" style={{ margin: 0, padding: '6px 12px', fontSize: '0.75rem', width: 'auto' }}>Ver CV</button>
                                                    <button className="neon-button error" style={{ margin: 0, padding: '6px 12px', fontSize: '0.75rem', width: 'auto', background: '#fee2e2', color: '#ef4444', border: '1px solid #ef4444' }}>Bloquear</button>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h2 style={{ color: 'var(--neon-purple)', margin: 0 }}>⚡ Inteligência de Automação</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Monitoramento em tempo real dos disparos de e-mail e retenção.</p>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button 
                                    onClick={handleDisparoRecuperacao} 
                                    disabled={isSendingEmails}
                                    className="neon-button" 
                                    style={{ 
                                        width: 'auto', margin: 0, padding: '8px 20px', 
                                        background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                                        borderColor: '#f59e0b',
                                        opacity: isSendingEmails ? 0.7 : 1
                                    }}
                                >
                                    {isSendingEmails ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <RefreshCw size={14} className="spin" /> {sendProgress}
                                        </div>
                                    ) : (
                                        '🚀 DISPARAR RECUPERAÇÃO (2 dias)'
                                    )}
                                </button>
                                <select className="neon-input" value={filtroAutomacao} onChange={e => setFiltroAutomacao(Number(e.target.value))} style={{ width: 'auto', marginBottom: 0, padding: '8px 16px', height: 'auto' }}>
                                    <option value={1}>Hoje</option>
                                    <option value={3}>Últimos 3 dias</option>
                                    <option value={7}>Últimos 7 dias</option>
                                    <option value={14}>Últimos 14 dias</option>
                                </select>
                                <button onClick={carregarAutomacao} className="neon-button secondary" style={{ width: 'auto', margin: 0 }}>
                                    <RefreshCw size={16} /> ATUALIZAR
                                </button>
                            </div>
                        </div>

                        {/* NOVO: BANNER DE BROADCAST DE VAGAS */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            {/* BROADCAST GERAL */}
                            <div style={{ 
                                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(56, 189, 248, 0.1))',
                                padding: '1.5rem', borderRadius: '16px',
                                border: '1px solid rgba(124, 58, 237, 0.2)',
                                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem'
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>📣 Divulgar Novas Vagas (Geral)</h3>
                                    <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        Envia um e-mail para <strong>toda a base de candidatos</strong> convidando-os a ver as oportunidades atuais.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleDisparoNovasVagas}
                                    disabled={isSendingBroadcast}
                                    className="neon-button" 
                                    style={{ 
                                        width: '100%', margin: 0, padding: '10px 24px', 
                                        background: 'var(--neon-purple)', color: '#fff',
                                        fontWeight: 800, fontSize: '0.9rem',
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
                                padding: '1.5rem', borderRadius: '16px',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem'
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>🎯 Recuperar Sem Inscrição</h3>
                                    <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        Foca apenas nos candidatos que <strong>ainda não se candidataram</strong> a nenhuma das vagas do sistema.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleDisparoSemInscricao}
                                    disabled={isSendingBroadcast}
                                    className="neon-button" 
                                    style={{ 
                                        width: '100%', margin: 0, padding: '10px 24px', 
                                        background: 'var(--neon-blue)', color: '#000',
                                        fontWeight: 800, fontSize: '0.9rem',
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

                        {loading ? <p>Carregando estatísticas...</p> : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                                    <div style={{ background: 'rgba(168, 85, 247, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                                        <div style={{ color: 'var(--neon-purple)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>E-mails Enviados</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{automationStats.sent}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>Total acumulado hoje</div>
                                    </div>
                                    <div style={{ background: 'rgba(34, 197, 94, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                        <div style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>Taxa de Abertura</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>
                                            {automationStats.sent > 0 ? Math.round((automationStats.opened / automationStats.sent) * 100) : 0}%
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>{automationStats.opened} aberturas confirmadas</div>
                                    </div>
                                    <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                        <div style={{ color: 'var(--neon-blue)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>Candidatos Recuperados</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{automationStats.recovered}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>Completaram o CV após e-mail</div>
                                    </div>
                                </div>

                                <h3 style={{ marginBottom: '1.5rem' }}>🎯 Últimos Disparos</h3>
                                        <div className="table-responsive">
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                <thead>
                                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                                                        <th style={{ padding: '12px' }}>Candidato</th>
                                                        <th style={{ padding: '12px' }}>Gatilho</th>
                                                        <th style={{ padding: '12px' }}>Status</th>
                                                        <th style={{ padding: '12px' }}>Enviado em</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recentNotifications.map(n => (
                                                        <tr key={n.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                            <td style={{ padding: '12px', fontWeight: 600 }} data-label="E-MAIL">{n.candidato_email || 'Usuário'}</td>
                                                            <td style={{ padding: '12px' }} data-label="TIPO">
                                                                <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                                                                    {n.tipo === 'sem_curriculo' ? '📝 Cadastro' : '💼 Vagas'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px' }} data-label="STATUS">
                                                                <span style={{ 
                                                                    color: n.status === 'opened' ? '#4ade80' : (n.status === 'clicked' ? 'var(--neon-blue)' : 'var(--text-muted)'),
                                                                    display: 'flex', alignItems: 'center', gap: '5px', justifyContent: isMobile ? 'flex-end' : 'flex-start'
                                                                }}>
                                                                    {n.status === 'opened' && <CheckCircle size={14} />}
                                                                    {n.status === 'clicked' && <Activity size={14} />}
                                                                    {n.status.toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px', color: 'var(--text-muted)' }} data-label="DATA">{new Date(n.enviado_em).toLocaleDateString()}</td>
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

                {activeTab === 'contratacoes' && (
                    <div className="glass-panel animation-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>🏆 Mural de Conquistas</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Relatório consolidado de candidatos que efetivaram contratação pelo sistema</p>
                            </div>
                            <div className="input-group" style={{ marginBottom: 0, width: '300px' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                                    <input className="neon-input" style={{ paddingLeft: '38px' }} placeholder="Filtrar por nome ou empresa..." value={filtroContratado} onChange={e => setFiltroContratado(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {loading ? <p>Carregando contratações...</p> : (
                            <div className="table-responsive">
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                        <tr>
                                            <th style={{ padding: '1rem' }}>Candidato</th>
                                            <th style={{ padding: '1rem' }}>Vaga</th>
                                            <th style={{ padding: '1rem' }}>Empresa</th>
                                            <th style={{ padding: '1rem' }}>Data do Sucesso</th>
                                            <th style={{ padding: '1rem' }}>Contato</th>
                                            <th style={{ padding: '1rem' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contratacoesList.filter(c => 
                                            c.curriculos?.nome?.toLowerCase().includes(filtroContratado.toLowerCase()) || 
                                            c.vagas?.empresas?.razao_social?.toLowerCase().includes(filtroContratado.toLowerCase())
                                        ).map(c => (
                                            <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-blue)', fontWeight: 800 }}>
                                                            {c.curriculos?.nome?.substring(0, 1)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 700 }}>{c.curriculos?.nome}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.curriculos?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--norte-teal)' }}>{c.vagas?.titulo}</span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ fontWeight: 600 }}>{c.vagas?.empresas?.razao_social}</span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontSize: '0.9rem' }}>{new Date(c.created_at).toLocaleDateString()}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ fontSize: '0.85rem' }}>{c.curriculos?.telefone || '—'}</span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button 
                                                        onClick={() => navigate(`/cv-preview/${c.user_id}`)} 
                                                        className="neon-button secondary" 
                                                        style={{ margin: 0, padding: '6px 12px', fontSize: '0.7rem', width: 'auto' }}
                                                    >
                                                        VER PERFIL
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {contratacoesList.length === 0 && (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    <CheckCircle size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                                    <br />Nenhuma contratação oficializada no período.
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
