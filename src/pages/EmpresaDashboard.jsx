import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { 
    Users, Briefcase, Plus, LogOut, CheckCircle, Clock,
    Building, Search, XCircle, ExternalLink, User,
    ChevronDown, Trash2, Edit, Save, AlertTriangle, Compass,
    FileText, X, MapPin, DollarSign, Filter, Pencil, Camera, Mail, Phone, MapPinned, Gift, Download,
    Flame, Thermometer, Sun, Wind, Snowflake, MessageSquare, Star
} from 'lucide-react';
import { TODOS_OS_CURSOS } from '../data/cursos';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import Navbar from '../components/layout/Navbar';
import BrandLogo from '../components/layout/BrandLogo';
import { NorteConfirmModal } from '../components/ui/NorteConfirmModal';

const MODALIDADES = ['presencial', 'hibrido', 'remoto'];
const LABEL_MODAL = { presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' };
const STATUS_CAND = ['pendente', 'em_analise', 'aprovado', 'recusado', 'contratado'];
const LABEL_STATUS = { 
    pendente: '⏳ Pendente', 
    em_analise: '🔍 Em análise', 
    aprovado: '✅ Aprovado', 
    recusado: '❌ Recusado',
    contratado: '🏆 CONTRATADO'
};
const COR_STATUS = { 
    pendente: 'rgba(235,191,33,0.15)', 
    em_analise: 'rgba(67,141,121,0.1)', 
    aprovado: 'rgba(0,141,76,0.15)', 
    recusado: 'rgba(239,68,68,0.15)',
    contratado: 'rgba(181,53,246,0.2)'
};
const TEXT_COR_STATUS = {
    pendente: '#B45309',
    em_analise: '#0D9488',
    aprovado: '#059669',
    recusado: '#DC2626',
    contratado: '#7c3aed'
};
const DISC_PERFIS = [
    { value: '', label: 'Qualquer Perfil' },
    { value: 'D', label: '🔴 Dominante (D) — Executor' },
    { value: 'I', label: '🟡 Influente (I) — Comunicador' },
    { value: 'S', label: '🟢 Estável (S) — Planejador' },
    { value: 'C', label: '🔵 Analítico (C) — Detalhista' },
];

// Mapeamento do perfil DISC retornado pelo Quiz para a letra do filtro
function getDiscDominante(rawDisc) {
    if (!rawDisc) return null;
    try {
        const discData = typeof rawDisc === 'string' && rawDisc.startsWith('{') 
            ? JSON.parse(rawDisc) 
            : (typeof rawDisc === 'object' ? rawDisc : null);
            
        if (discData && Object.keys(discData).length > 0) {
            // Encontra qual tem a maior %
            const sorted = Object.entries(discData).sort((a,b) => b[1] - a[1]);
            const dominanteStr = sorted[0][0]; // "Executor", "Comunicador", "Planejador", "Analista"
            
            if (dominanteStr === 'Executor') return 'D';
            if (dominanteStr === 'Comunicador') return 'I';
            if (dominanteStr === 'Planejador') return 'S';
            if (dominanteStr === 'Analista') return 'C';
        }
    } catch {
        return null;
    }
}

const WhatsAppIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 448 512" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.2-3.2-5.6-.3-8.6 2.4-11.3 2.5-2.4 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.5-9.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.3 5.7 23.6 9.2 31.7 11.7 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
    </svg>
);

const SUGESTOES_PALAVRAS = {
    Vendas: "vendas, metas, cliente, negociação, fechamento",
    Atendimento: "atendimento, suporte, cliente, comunicação, solução",
    Administrativo: "organização, documentos, planilhas, excel, processos",
    Operacional: "produção, carga, descarga, estoque, agilidade",
    Financeiro: "caixa, contas, financeiro, pagamento, controle"
};

const normalizarTexto = (txt) => {
    if (!txt) return "";
    return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

// Componente do Mapa de Calor
function HeatmapBadge({ score }) {
    let config = {
        label: 'GELADO',
        icon: Snowflake,
        color: '#fff',
        bg: 'linear-gradient(135deg, #1e293b, #334155)',
        glow: 'none',
        className: ''
    };

    if (score >= 90) {
        config = {
            label: 'MUITO QUENTE',
            icon: Flame,
            color: '#fff',
            bg: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            glow: '0 0 15px rgba(239, 68, 68, 0.5)',
            className: 'heatmap-pulse'
        };
    } else if (score >= 70) {
        config = {
            label: 'AQUECIDO',
            icon: Sun,
            color: '#000',
            bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            glow: '0 0 10px rgba(245, 158, 11, 0.3)',
            className: ''
        };
    } else if (score >= 40) {
        config = {
            label: 'MORNO',
            icon: Thermometer,
            color: '#000',
            bg: 'linear-gradient(135deg, #a3e635, #65a30d)',
            glow: 'none',
            className: ''
        };
    } else if (score >= 10) {
        config = {
            label: 'FRIO',
            icon: Wind,
            color: '#fff',
            bg: 'linear-gradient(135deg, #38bdf8, #0284c7)',
            glow: 'none',
            className: ''
        };
    }

    return (
        <span className={config.className} style={{
            background: config.bg,
            color: config.color,
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: config.glow,
            width: 'fit-content',
            border: '1px solid rgba(255,255,255,0.1)',
            whiteSpace: 'nowrap'
        }}>
            <config.icon size={14} fill={config.color === '#fff' ? 'currentColor' : 'none'} />
            {config.label} {score}%
        </span>
    );
}

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
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [empresa, setEmpresa] = useState(null);
    const [activeTab, setActiveTab] = useState(localStorage.getItem('empresaActiveTab') || 'vagas');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(24);
    const [totalCount, setTotalCount] = useState(0);

    // Vagas
    const [showVagaForm, setShowVagaForm] = useState(false);
    const [vagaToEdit, setVagaToEdit] = useState(null);
    const [newVaga, setNewVaga] = useState({ 
        titulo: '', 
        descricao: '', 
        requisitos: '', 
        modalidade: '', 
        cidade: '', 
        salario_min: '', 
        salario_max: '', 
        data_limite: '', 
        quantidade: 1,
        requisitos_obrigatorios: [],
        requisitos_desejaveis: [],
        preferencia_genero: 'todos'
    });
    const [vagas, setVagas] = useState([]);

    // Talentos
    const [talentos, setTalentos] = useState([]);
    const [filtros, setFiltros] = useState({ 
        nome: '', 
        idadeMin: '', 
        idadeMax: '', 
        cursos: ['', '', ''], 
        ensinoMedio: '',       // '', 'completo', 'cursando', 'incompleto'
        ensinoSuperior: '',    // '', 'completo', 'cursando'
        cursoSuperior: '',     // texto livre (nome do curso)
        perfilDisc: '',        // '', 'D', 'I', 'S', 'C'
        cidade: '', 
        habilidade: '',
        statusCurriculo: 'todos',
        genero: '',
        perfilReferencia: '',  // Novo: Escolha do Cargo Base
        palavrasChave: '',      // Novo: Atividades e Competências
        possuiTransporte: '',   // '', 'true', 'false'
        cnhCat: ''              // '', 'A', 'B', etc
    });

    const [filtrosDebouncados, setFiltrosDebouncados] = useState(filtros);
    const [selecionados, setSelecionados] = useState(new Set());
    const [gerandoPdf, setGerandoPdf] = useState(false);
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
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null });
    const notificationRef = useRef(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [favoritosIds, setFavoritosIds] = useState(new Set());
    const [perfisSalvos, setPerfisSalvos] = useState([]);
    const [showSalvarPerfilModal, setShowSalvarPerfilModal] = useState(false);
    const [nomeNovoPerfil, setNomeNovoPerfil] = useState('');

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

    const handleWhatsAppContact = (telefone, nomeCandidato) => {
        if (!telefone) return notify('Telefone não informado.', 'error');
        
        // Limpa tudo que não é número
        let cleanNumber = telefone.replace(/\D/g, '');
        
        // Se tiver 10 ou 11 dígitos e não começar com 55, adiciona
        if ((cleanNumber.length === 10 || cleanNumber.length === 11) && !cleanNumber.startsWith('55')) {
            cleanNumber = '55' + cleanNumber;
        }

        const msg = `Olá ${nomeCandidato.split(' ')[0]}, vim através da plataforma Norte Empregos e gostaria de conversar sobre sua candidatura.`;
        const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    useEffect(() => { if (user) checkEmpresaPerfil(); }, [user]);
    
    // Debounce para os filtros
    useEffect(() => {
        const handler = setTimeout(() => {
            setFiltrosDebouncados(filtros);
        }, 500);
        return () => clearTimeout(handler);
    }, [filtros]);

    useEffect(() => { 
        localStorage.setItem('empresaActiveTab', activeTab);
        if (activeTab === 'talentos' || (activeTab === 'salvos' && favoritosIds.size > 0)) {
            fetchTalentos(); 
        } else if (activeTab === 'salvos' && favoritosIds.size === 0) {
            setTalentos([]);
            setTotalCount(0);
        }
    }, [activeTab, currentPage, filtrosDebouncados, empresa?.id, favoritosIds]);

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
                fetchFavoritos(data.id);
                fetchPerfisSalvos(data.id);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // --- EFEITO PARA REABRIR MODAL AO VOLTAR ---
    useEffect(() => {
        const lastVagaId = sessionStorage.getItem('lastOpenedVagaId');
        if (lastVagaId && vagas.length > 0 && !modalCandidatos) {
            const vagaEncontrada = vagas.find(v => v.id === lastVagaId);
            if (vagaEncontrada) {
                handleVerCandidatos(vagaEncontrada);
            }
        }
    }, [vagas]); // Dispara quando as vagas carregarem


    const fetchPerfisSalvos = async (empId) => {
        if (!empId) return;
        try {
            const { data } = await supabase
                .from('empresa_filtros_salvos')
                .select('*')
                .eq('empresa_id', empId)
                .order('created_at', { ascending: false });
            setPerfisSalvos(data || []);
        } catch (err) {
            console.error('Erro ao buscar perfis salvos:', err);
        }
    };

    const handleSalvarPerfilBusca = async () => {
        if (!empresa?.id) return;
        if (!nomeNovoPerfil.trim()) return notify('Digite um nome para o perfil', 'error');

        try {
            const { error } = await supabase
                .from('empresa_filtros_salvos')
                .insert({
                    empresa_id: empresa.id,
                    nome_perfil: nomeNovoPerfil.trim(),
                    filtros: filtros
                });

            if (error) throw error;
            
            notify('Perfil de busca salvo!', 'success');
            setNomeNovoPerfil('');
            setShowSalvarPerfilModal(false);
            fetchPerfisSalvos(empresa.id);
        } catch (err) {
            notify('Erro ao salvar perfil: ' + err.message, 'error');
        }
    };

    const aplicarPerfilSalvo = (perfil) => {
        setFiltros(perfil.filtros);
        notify(`Perfil "${perfil.nome_perfil}" aplicado!`, 'info');
    };

    const deletarPerfilSalvo = async (id) => {
        try {
            const { error } = await supabase
                .from('empresa_filtros_salvos')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            notify('Perfil removido', 'info');
            fetchPerfisSalvos(empresa.id);
        } catch (err) {
            notify('Erro ao remover perfil', 'error');
        }
    };

    const resetFiltros = () => {
        setFiltros({ 
            nome: '', idadeMin: '', idadeMax: '', cursos: ['', '', ''], 
            ensinoMedio: '', ensinoSuperior: '', cursoSuperior: '', 
            perfilDisc: '', cidade: '', habilidade: '', statusCurriculo: 'todos', 
            genero: '', perfilReferencia: '', palavrasChave: '',
            possuiTransporte: '', cnhCat: ''
        });

        notify('Filtros restaurados', 'info');
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

    const fetchFavoritos = async (empId) => {
        if (!empId) return;
        try {
            const { data, error } = await supabase
                .from('empresa_favoritos')
                .select('user_id')
                .eq('empresa_id', empId);
            
            if (error) throw error;
            const ids = new Set((data || []).map(f => f.user_id));
            setFavoritosIds(ids);
        } catch (err) {
            console.error('Erro ao carregar favoritos:', err);
        }
    };

    const toggleFavorite = async (candidatoId) => {
        if (!empresa?.id) return;
        
        const isFav = favoritosIds.has(candidatoId);
        
        try {
            if (isFav) {
                // Remover
                const { error } = await supabase
                    .from('empresa_favoritos')
                    .delete()
                    .eq('empresa_id', empresa.id)
                    .eq('user_id', candidatoId);
                
                if (error) throw error;
                
                setFavoritosIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(candidatoId);
                    return newSet;
                });
                notify('Candidato removido dos salvos', 'info');
            } else {
                // Adicionar
                const { error } = await supabase
                    .from('empresa_favoritos')
                    .insert({
                        empresa_id: empresa.id,
                        user_id: candidatoId
                    });
                
                if (error) throw error;
                
                setFavoritosIds(prev => new Set(prev).add(candidatoId));
                notify('Candidato salvo no seu Banco de Talentos!', 'success');
            }
        } catch (err) {
            console.error('Erro ao favoritar:', err);
            notify('Erro ao atualizar favoritos', 'error');
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
        if (!empresa?.id) return;
        setLoading(true);

        try {
            const from = (currentPage - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from('curriculos')
                .select(`
                    user_id, nome, email, telefone, cidade, bairro, data_nascimento, genero,
                    habilidades, cursos_prof, formacoes, ensino_medio, resumo, experiencias,
                    perfil_disc, cnh, possui_transporte
                `, { count: 'exact' });


            // --- MODO FAVORITOS (ABA SALVOS) ---
            if (activeTab === 'salvos') {
                if (favoritosIds.size === 0) {
                    setTalentos([]);
                    setTotalCount(0);
                    setLoading(false);
                    return;
                }
                query = query.in('user_id', Array.from(favoritosIds));
            }

            // --- APLICAÇÃO DE FILTROS SERVER-SIDE ---
            if (filtros.nome) query = query.ilike('nome', `%${filtros.nome}%`);
            if (filtros.cidade) query = query.ilike('cidade', `%${filtros.cidade}%`);
            if (filtros.genero) query = query.eq('genero', filtros.genero);
            
            // Filtro de Idade
            if (filtros.idadeMin) {
                const date = new Date();
                date.setFullYear(date.getFullYear() - parseInt(filtros.idadeMin));
                query = query.lte('data_nascimento', date.toISOString().split('T')[0]);
            }
            if (filtros.idadeMax) {
                const date = new Date();
                date.setFullYear(date.getFullYear() - (parseInt(filtros.idadeMax) + 1));
                query = query.gte('data_nascimento', date.toISOString().split('T')[0]);
            }

            // Transporte
            if (filtros.possuiTransporte === 'true') query = query.eq('possui_transporte', true);
            if (filtros.possuiTransporte === 'false') query = query.eq('possui_transporte', false);

            // CNH (JSONB containment check or string match in select)
            if (filtros.cnhCat) {
                // Filtramos por categoria contida no array categorias do JSONB cnh
                query = query.contains('cnh', { categorias: [filtros.cnhCat] });
            }

            // Educação
            if (filtros.ensinoMedio) {
                query = query.eq('ensino_medio->>status', filtros.ensinoMedio);
            }
            // Nota: Filtraremos Ensino Superior no lado do cliente para percorrer toda a lista de diplomas

            // Nota: Filtraremos o perfil DISC no lado do cliente para maior precisão com JSONB

            // Nota: Habilidades e Cursos agora são calculados via Smart Scoring no useMemo

            const { data, count, error: cvError } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (cvError) throw cvError;
            
            setTalentos(data || []);
            setTotalCount(count || 0);
        } catch (err) {
            console.error('Erro ao buscar talentos:', err.message);
            setTalentos([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    };
    
    // Resetar página ao mudar filtros (Debounce recomendado depois)
    useEffect(() => {
        setCurrentPage(1);
    }, [filtrosDebouncados, activeTab]);

    // --- Seleção para download em lote ---
    const toggleSelecionado = (userId) => {
        setSelecionados(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const toggleTodos = (lista) => {
        if (selecionados.size === lista.length) {
            setSelecionados(new Set());
        } else {
            setSelecionados(new Set(lista.map(t => t.user_id)));
        }
    };

    // --- Download em Lote (PDF) ---
    const handleDownloadBatch = async (lista) => {
        if (lista.length === 0) {
            alert('Selecione ao menos um candidato para baixar.');
            return;
        }
        setGerandoPdf(true);
        try {
            const { jsPDF } = await import('jspdf');
            const html2canvas = (await import('html2canvas')).default;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageW = 210;
            const pageH = 297;

            // Container invisível para renderização do currículo
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.top = '-10000px';
            container.style.left = '-10000px';
            container.style.width = '793px'; // A4 width at 96dpi aprox
            document.body.appendChild(container);

            for (let i = 0; i < lista.length; i++) {
                const cvData = lista[i];
                if (i > 0) doc.addPage();

                // Helper local para idade
                let idadeLabel = '';
                const idade = calcIdade(cvData.data_nascimento);
                if (idade !== null) idadeLabel = `🎂 ${idade} anos`;

                const infoStr = [
                    idadeLabel,
                    cvData.genero ? `👤 ${cvData.genero}` : '',
                    cvData.cidade ? `📍 ${cvData.bairro ? cvData.bairro + ' - ' : ''}${cvData.cidade}` : '',
                    cvData.email ? `✉ ${cvData.email}` : '',
                    cvData.telefone ? `📱 ${cvData.telefone}` : ''
                ].filter(Boolean).join(' | ');

                let discHtml = '';
                if (cvData.perfil_disc) {
                    try {
                        const disc = typeof cvData.perfil_disc === 'string' && cvData.perfil_disc.startsWith('{') 
                            ? JSON.parse(cvData.perfil_disc) : null;
                        if (disc) {
                            const sorted = Object.entries(disc).sort((a,b) => b[1] - a[1]);
                            if (sorted.length > 0) {
                                discHtml = `
                                    <div style="margin-top: 15px; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                                        <span style="font-size: 14px; font-weight: bold; color: #7c3aed; text-transform: uppercase;">🚀 ${sorted[0][0]}</span>
                                        <div style="display: flex; gap: 10px; font-size: 11px; font-weight: bold; color: #666;">
                                            ${sorted.map(([k, v]) => `<span>${k.substring(0,3).toUpperCase()}: ${v}%</span>`).join('')}
                                        </div>
                                    </div>
                                `;
                            }
                        } else {
                            discHtml = `<span style="font-size: 12px; font-weight: bold; background: rgba(124,58,237,0.1); color: #7c3aed; padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(124,58,237,0.2);">🌟 PERFIL DISC: ${cvData.perfil_disc}</span>`;
                        }
                    } catch(e) {}
                }

                const exps = Array.isArray(cvData.experiencias) ? cvData.experiencias : [];
                const expHtml = exps.map(exp => {
                    const ini = [exp.mes_inicio, exp.ano_inicio].filter(Boolean).join('/');
                    const fim = exp.atual ? 'Atual' : [exp.mes_fim, exp.ano_fim].filter(Boolean).join('/');
                    return `
                        <div style="margin-bottom: 12px;">
                            <h4 style="margin: 0; color: #1f2937; font-size: 15px;">${exp.cargo || ''}</h4>
                            <span style="color: #7c3aed; font-size: 13px; font-weight: 600;">${exp.empresa || ''}</span>
                            <span style="color: #6b7280; font-size: 13px; margin-left: 10px;">(${ini} - ${fim})</span>
                            <p style="margin: 5px 0 0 0; font-size: 13px; color: #4b5563;">${exp.descricao || ''}</p>
                        </div>
                    `;
                }).join('');

                const formacoes = Array.isArray(cvData.formacoes) ? cvData.formacoes : [];
                const emHtml = cvData.ensino_medio?.status ? `
                    <div style="margin-bottom: 8px;">
                        <span style="color: #1f2937; font-weight: bold; font-size: 14px;">Ensino Médio (${cvData.ensino_medio.status})</span>
                    </div>
                ` : '';
                const formHtml = formacoes.map(f => `
                    <div style="margin-bottom: 8px;">
                        <h4 style="margin: 0; color: #1f2937; font-size: 15px;">${f.curso || ''}</h4>
                        <span style="color: #6b7280; font-size: 13px;">${f.instituicao || ''} - ${f.status || ''}</span>
                    </div>
                `).join('');

                const habHtml = (cvData.habilidades || []).map(h => `
                    <span style="background: rgba(124,58,237,0.1); color: #7c3aed; border: 1px solid rgba(124,58,237,0.2); padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block;">${h}</span>
                `).join('');

                container.innerHTML = `
                    <div style="background: #fff; width: 793px; min-height: 1122px; padding: 40px; box-sizing: border-box; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 28px; font-weight: bold; text-transform: uppercase;">${cvData.nome || ''}</h1>
                            <div style="color: #555; font-size: 14px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
                                ${infoStr}
                            </div>
                            ${discHtml}
                        </div>

                        ${cvData.resumo ? `
                            <div style="margin-bottom: 25px;">
                                <h2 style="font-size: 16px; color: #111; text-transform: uppercase; border-bottom: 2px solid #7c3aed; padding-bottom: 5px; margin-bottom: 12px;">Resumo Profissional</h2>
                                <p style="font-size: 14px; color: #4b5563; line-height: 1.5; margin: 0; white-space: pre-wrap;">${cvData.resumo}</p>
                            </div>
                        ` : ''}

                        ${exps.length > 0 ? `
                            <div style="margin-bottom: 25px;">
                                <h2 style="font-size: 16px; color: #111; text-transform: uppercase; border-bottom: 2px solid #7c3aed; padding-bottom: 5px; margin-bottom: 12px;">Experiência</h2>
                                ${expHtml}
                            </div>
                        ` : ''}

                        ${(emHtml || formHtml) ? `
                            <div style="margin-bottom: 25px;">
                                <h2 style="font-size: 16px; color: #111; text-transform: uppercase; border-bottom: 2px solid #7c3aed; padding-bottom: 5px; margin-bottom: 12px;">Formação Acadêmica</h2>
                                ${emHtml}
                                ${formHtml}
                            </div>
                        ` : ''}

                        ${habHtml ? `
                            <div>
                                <h2 style="font-size: 16px; color: #111; text-transform: uppercase; border-bottom: 2px solid #7c3aed; padding-bottom: 5px; margin-bottom: 12px;">Habilidades</h2>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    ${habHtml}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                // Aguarda 50ms para garantir paint na DOM
                await new Promise(r => setTimeout(r, 50)); 
                
                const canvas = await html2canvas(container.firstElementChild, { 
                    scale: 1.5, 
                    useCORS: true, 
                    backgroundColor: '#ffffff'
                });
                
                const imgData = canvas.toDataURL('image/jpeg', 0.85);
                const imgProps = doc.getImageProperties(imgData);
                const pdfHeight = (imgProps.height * pageW) / imgProps.width;
                
                doc.addImage(imgData, 'JPEG', 0, 0, pageW, pdfHeight);
            }

            document.body.removeChild(container);

            const timestamp = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
            doc.save(`curriculos_lote_${timestamp}.pdf`);
        } catch (err) {
            console.error('Erro ao gerar PDF em lote:', err);
            alert('Erro ao gerar o PDF: ' + err.message);
        } finally {
            setGerandoPdf(false);
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
            data_limite: newVaga.data_limite || null,
            quantidade: parseInt(newVaga.quantidade) || 1,
            preferencia_genero: newVaga.preferencia_genero || 'todos'
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
            setNewVaga({ 
                titulo: '', 
                descricao: '', 
                requisitos: '', 
                modalidade: '', 
                cidade: '', 
                salario_min: '', 
                salario_max: '', 
                data_limite: '', 
                quantidade: 1,
                requisitos_obrigatorios: [],
                requisitos_desejaveis: []
            });
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
            data_limite: vaga.data_limite || '',
            quantidade: vaga.quantidade || 1,
            requisitos_obrigatorios: Array.isArray(vaga.requisitos_obrigatorios) ? vaga.requisitos_obrigatorios : [],
            requisitos_desejaveis: Array.isArray(vaga.requisitos_desejaveis) ? vaga.requisitos_desejaveis : [],
            preferencia_genero: vaga.preferencia_genero || 'todos'
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
        // Salva no sessionStorage para reabrir ao voltar
        sessionStorage.setItem('lastOpenedVagaId', vaga.id);

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
                const userIds = cands.map(c => c.user_id);
                const { data: cvs, error: cvsError } = await supabase
                    .from('curriculos')
                    .select('*')
                    .in('user_id', userIds);

                if (cvsError) throw cvsError;

                // 4. Calcula afinidade para cada candidato baseado nos requisitos da vaga
                mergedCandidatos = cands.map(cand => {
                    const cv = cvs?.find(cv => cv.user_id === cand.user_id) || null;
                    let score = 0;
                    
                    if (cv && vaga) {
                        // 1. CHECAGEM DE GÊNERO (Critério de desempate/filtro)
                        let matchingGenero = true;
                        if (vaga.preferencia_genero && vaga.preferencia_genero !== 'todos') {
                            if (cv.genero && cv.genero.toLowerCase() !== vaga.preferencia_genero) {
                                matchingGenero = false;
                            }
                        }

                        const obrigatorios = Array.isArray(vaga.requisitos_obrigatorios) ? vaga.requisitos_obrigatorios : [];
                        const desejaveis = Array.isArray(vaga.requisitos_desejaveis) ? vaga.requisitos_desejaveis : [];
                        
                        let matchInternal = 0;
                        let maxPoints = (obrigatorios.length * 10) + (desejaveis.length * 5);
                        
                        if (maxPoints > 0) {
                            const cvHab = (cv.habilidades || []).map(h => normalizarTexto(h));
                            const cvResumo = normalizarTexto(cv.resumo || '');
                            const cvExps = (cv.experiencias || []).map(exp => 
                                normalizarTexto(`${exp.cargo} ${exp.atribuicoes || exp.descricao || ''}`)
                            );
                            
                            obrigatorios.forEach(req => {
                                const r = normalizarTexto(req);
                                const matchNasExps = cvExps.some(e => e.includes(r));
                                if (cvHab.some(h => h.includes(r)) || cvResumo.includes(r) || matchNasExps) {
                                    matchInternal += 10;
                                }
                            });
                            
                            desejaveis.forEach(req => {
                                const r = normalizarTexto(req);
                                const matchNasExps = cvExps.some(e => e.includes(r));
                                if (cvHab.some(h => h.includes(r)) || cvResumo.includes(r) || matchNasExps) {
                                    matchInternal += 5;
                                }
                            });
                            
                            score = Math.round((matchInternal / maxPoints) * 100);
                        } else {
                            score = 20; // Score base se não houver requisitos, mas houver inscrição
                        }

                        // Penalidade se não bater o gênero preferido
                        if (!matchingGenero) {
                            score = Math.max(0, score - 50); 
                        }
                    }

                    return {
                        ...cand,
                        curriculos: cv,
                        score_afinidade: score
                    };
                });

                // 5. ORDENAÇÃO POR CALOR (Os melhores no topo)
                mergedCandidatos.sort((a, b) => (b.score_afinidade || 0) - (a.score_afinidade || 0));
            }

            setModalCandidatos({ vaga, candidatos: mergedCandidatos });
        } catch (err) {
            console.error("Exceção capturada:", err);
            alert("Erro ao buscar candidatos: " + err.message);
        }
        finally { setLoadingCandidatos(false); }
    };

    const handleStatusCandidatura = async (userId, vagaId, novoStatus) => {
        if (novoStatus === 'contratado') {
            setConfirmModal({
                isOpen: true,
                data: { userId, vagaId, novoStatus }
            });
            return;
        }
        
        await executarMudancaStatus(userId, vagaId, novoStatus);
    };

    const executarMudancaStatus = async (userId, vagaId, novoStatus) => {
        try {
            const { error } = await supabase.from('candidaturas')
                .update({ status: novoStatus })
                .eq('user_id', userId)
                .eq('vaga_id', vagaId);
            
            if (error) throw error;

            setModalCandidatos(prev => ({
                ...prev,
                candidatos: prev.candidatos.map(c => c.user_id === userId ? { ...c, status: novoStatus } : c)
            }));

            notify(novoStatus === 'contratado' ? 'Parabéns pela contratação! 🏆' : 'Status atualizado!', 'success');
        } catch (err) {
            notify('Erro ao atualizar status: ' + err.message, 'error');
        } finally {
            setConfirmModal({ isOpen: false, data: null });
        }
    };

    const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

    const atualizarFiltro = (field, value) => setFiltros(prev => ({ ...prev, [field]: value }));
    const atualizarCursoFiltro = (idx, value) => setFiltros(prev => { const c = [...prev.cursos]; c[idx] = value; return { ...prev, cursos: c }; });

    // Sistema de Pontuação Inteligente (Scoring Ponderado)
    const talentosComMatch = useMemo(() => {
        // 1. Definição de Pesos Base
        const PESOS_BASE = {
            experiencia: 40,
            habilidades: 25,
            disc: 20,
            localizacao: 10,
            extra: 5
        };

        const processados = talentos.map(t => {
            const completo = isCurriculoCompleto(t);
            const idade = calcIdade(t.data_nascimento);
            
            let totalActiveWeight = 0;
            let totalEarnedPoints = 0;

            // --- CATEGORIA 1: EXPERIÊNCIA (40 pts) ---
            const kwSet = filtros.palavrasChave ? filtros.palavrasChave.split(',').map(s => normalizarTexto(s.trim())).filter(s => s.length > 0) : [];
            if (kwSet.length > 0) {
                totalActiveWeight += PESOS_BASE.experiencia;
                
                // Analisa todas as descrições de experiências
                const textoExperiencia = (t.experiencias || []).map(exp => 
                    normalizarTexto(`${exp.cargo} ${exp.atribuicoes || exp.descricao || ''}`)
                ).join(' ');

                let matches = 0;
                kwSet.forEach(kw => { if (textoExperiencia.includes(kw)) matches++; });
                
                const expScore = (matches / kwSet.length) * PESOS_BASE.experiencia;
                totalEarnedPoints += expScore;
            }

            // --- CATEGORIA 2: HABILIDADES E CURSOS (25 pts) ---
            const cursosAtivos = (filtros.cursos || []).filter(c => c !== '');
            const temHabFiltro = !!filtros.habilidade;
            
            if (temHabFiltro || cursosAtivos.length > 0) {
                totalActiveWeight += PESOS_BASE.habilidades;
                let habPoints = 0;
                
                // Habilidades principais (Peso 15)
                if (temHabFiltro) {
                    const skillsBuscadas = filtros.habilidade.split(',').map(s => normalizarTexto(s.trim())).filter(s => s !== '');
                    if (skillsBuscadas.length > 0) {
                        const habCandidato = (t.habilidades || []).map(h => normalizarTexto(h));
                        let matches = 0;
                        skillsBuscadas.forEach(sb => {
                            if (habCandidato.some(hc => hc.includes(sb))) matches++;
                        });
                        habPoints += (matches / skillsBuscadas.length) * 15;
                    }
                }

                // Cursos
                if (cursosAtivos.length > 0) {
                    let cursoMatches = 0;
                    cursosAtivos.forEach(c => { if ((t.cursos_prof || []).includes(c)) cursoMatches++; });
                    habPoints += (cursoMatches / cursosAtivos.length) * 10;
                }

                totalEarnedPoints += Math.min(habPoints, PESOS_BASE.habilidades);
            }

            // --- CATEGORIA 3: PERFIL DISC (20 pts) ---
            if (filtros.perfilDisc) {
                totalActiveWeight += PESOS_BASE.disc;
                const dominante = getDiscDominante(t.perfil_disc);
                if (dominante === filtros.perfilDisc) {
                    totalEarnedPoints += PESOS_BASE.disc;
                }
            }

            // --- CATEGORIA 4: LOCALIZAÇÃO (10 pts) ---
            if (filtros.cidade) {
                totalActiveWeight += PESOS_BASE.localizacao;
                if (normalizarTexto(t.cidade).includes(normalizarTexto(filtros.cidade))) {
                    totalEarnedPoints += PESOS_BASE.localizacao;
                }
            }

            // --- CATEGORIA 5: EXTRA / FORMAÇÃO (5 pts) ---
            const temFiltroSuperiorStatus = !!filtros.ensinoSuperior;
            const temFiltroSuperiorNome = !!filtros.cursoSuperior;
            const temFiltroMedio = !!filtros.ensinoMedio;
            const temFiltroCompleto = filtros.statusCurriculo === 'completo';

            if (temFiltroSuperiorStatus || temFiltroSuperiorNome || temFiltroMedio || temFiltroCompleto) {
                totalActiveWeight += PESOS_BASE.extra;
                let extraPoints = 0;

                // Ensino Médio (Peso 2)
                if (temFiltroMedio && t.ensino_medio?.status === filtros.ensinoMedio) extraPoints += 2.5;

                // Ensino Superior (Peso 2)
                if (temFiltroSuperiorStatus || temFiltroSuperiorNome) {
                    const formacoes = t.formacoes || [];
                    
                    if (filtros.ensinoSuperior === 'nenhum') {
                        // "Nenhum" só pontua se não houver formações
                        if (formacoes.length === 0) extraPoints += 2.5;
                    } else {
                        // Busca por status ou nome do curso
                        const matchSuperior = formacoes.some(f => {
                            const matchStatus = !filtros.ensinoSuperior || f.status === filtros.ensinoSuperior;
                            const matchNome = !filtros.cursoSuperior || normalizarTexto(f.curso).includes(normalizarTexto(filtros.cursoSuperior));
                            return matchStatus && matchNome;
                        });
                        if (matchSuperior) extraPoints += 2.5;
                    }
                }

                // Integridade (Filtro por Completo)
                if (temFiltroCompleto && completo) extraPoints += 1;

                totalEarnedPoints += Math.min(extraPoints, PESOS_BASE.extra);
            }

            // --- CÁLCULO FINAL COM REDISTRIBUIÇÃO ---
            let finalScore = 0;
            if (totalActiveWeight > 0) {
                // A mágica da redistribuição: (pontos ganhos / total que ele PODERIA ganhar) * 100
                finalScore = Math.round((totalEarnedPoints / totalActiveWeight) * 100);
            }
            
            return {
                ...t,
                idade,
                matchScore: finalScore,
                completo
            };
        });

        // Ordenar por maior pontuação
        return processados.sort((a,b) => b.matchScore - a.matchScore);
    }, [talentos, filtros]);

    // Nota: O carregamento global foi movido para dentro das abas para evitar o "flicker" e perda de foco nos filtros.

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

    const tabStyle = (t) => {
        const isActive = activeTab === t;
        return {
            margin: 0, 
            padding: '10px 22px', 
            width: 'auto',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '0.5px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid',
            ...(isActive ? { 
                background: 'rgba(0, 141, 76, 0.1)', 
                color: 'var(--norte-dark-green)', 
                borderColor: 'var(--norte-green)',
                boxShadow: '0 4px 15px rgba(0, 141, 76, 0.15)',
                transform: 'translateY(-1px)'
            } : { 
                background: 'rgba(255, 255, 255, 0.6)', 
                color: '#64748b', 
                borderColor: '#e2e8f0',
                cursor: 'pointer'
            })
        };
    };

    return (
        <div>
            <style>{`
                .action-btn {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-weight: 800;
                    border: none;
                    border-radius: 8px;
                    color: #fff;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .action-btn:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                }
                .action-btn:active {
                    transform: translateY(0);
                }
                .btn-wpp { 
                    background: linear-gradient(135deg, #25D366, #128C7E); 
                    box-shadow: 0 4px 12px rgba(18, 140, 126, 0.3); 
                }
                .tab-btn:hover {
                    background: rgba(0, 141, 76, 0.05) !important;
                    color: var(--norte-dark-green) !important;
                    transform: translateY(-2px);
                }
                .badge-premium {
                    background: linear-gradient(135deg, #ebbf21, #d97706);
                    color: #fff;
                    padding: 2px 8px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 900;
                    margin-left: 6px;
                    box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .pulse {
                    animation: pulse-gold 2s infinite;
                }
                @keyframes pulse-gold {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(235, 191, 33, 0.7); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(235, 191, 33, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(235, 191, 33, 0); }
                }
            `}</style>
            {/* Modal candidatos */}
            {modalCandidatos && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setModalCandidatos(null);
                            sessionStorage.removeItem('lastOpenedVagaId');
                        }
                    }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', maxHeight: '82vh', overflowY: 'auto', position: 'relative' }}>
                        <button onClick={() => {
                            setModalCandidatos(null);
                            sessionStorage.removeItem('lastOpenedVagaId');
                        }} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>

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
                                    <div key={i} style={{ 
                                        background: '#fff', 
                                        border: '1px solid #e5e7eb', 
                                        borderRadius: '12px', 
                                        padding: '1.25rem',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: '250px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <button 
                                                        onClick={() => toggleFavorite(c.user_id)}
                                                        style={{ 
                                                            background: 'none', 
                                                            border: 'none', 
                                                            cursor: 'pointer', 
                                                            padding: '4px',
                                                            display: 'flex'
                                                        }}
                                                    >
                                                        <Star 
                                                            size={20} 
                                                            fill={favoritosIds.has(c.user_id) ? '#ebbf21' : 'none'} 
                                                            color={favoritosIds.has(c.user_id) ? '#ebbf21' : 'rgba(0,0,0,0.2)'} 
                                                        />
                                                    </button>
                                                    <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--norte-dark-green)', margin: '0' }}>{cv?.nome || 'Sem currículo'}</p>
                                                    <HeatmapBadge score={c.score_afinidade || 0} />
                                                </div>
                                                
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {cv?.genero && (
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                                            <User size={14} style={{ color: 'var(--norte-teal)' }} /> {cv.genero}
                                                        </p>
                                                    )}
                                                    {cv?.bairro && (
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                                            <MapPin size={14} style={{ color: '#ef4444' }} /> {cv.bairro}{cv.cidade ? ` - ${cv.cidade}` : ''}
                                                        </p>
                                                    )}
                                                    {cv?.email && (
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                                            <Mail size={14} style={{ color: 'var(--norte-green)' }} /> {cv.email}
                                                        </p>
                                                    )}
                                                    
                                                    {cv?.telefone && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                                                            <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                                                <Phone size={14} style={{ color: '#000' }} /> {cv.telefone}
                                                            </p>
                                                            <button 
                                                                onClick={() => handleWhatsAppContact(cv.telefone, cv.nome)}
                                                                className="action-btn btn-wpp" 
                                                                style={{ 
                                                                    padding: '5px 12px', 
                                                                    fontSize: '0.7rem', 
                                                                    height: '28px'
                                                                }}
                                                                title="Contactar via WhatsApp"
                                                            >
                                                                <WhatsAppIcon size={12} /> WHATSAPP
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '12px' }}>
                                                    Candidatou-se em {new Date(c.created_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>

                                            <button 
                                                onClick={() => navigate(`/cv-preview/${c.user_id}`)} 
                                                className="neon-button secondary" 
                                                style={{ 
                                                    margin: 0, padding: '8px 16px', width: 'auto', 
                                                    fontSize: '0.85rem', fontWeight: 700,
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    background: '#fff', border: '1px solid #d1d5db'
                                                }}
                                            >
                                                <ExternalLink size={16} /> VER CURRÍCULO
                                            </button>
                                        </div>

                                        {/* Status da candidatura */}
                                        <div style={{ 
                                            marginTop: '1.25rem', 
                                            paddingTop: '1rem', 
                                            borderTop: '1px solid #f3f4f6',
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.5rem', 
                                            flexWrap: 'wrap' 
                                        }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '4px' }}>MUDAR STATUS:</span>
                                            {STATUS_CAND.map(st => (
                                                <button 
                                                    key={st} 
                                                    onClick={() => handleStatusCandidatura(c.user_id, modalCandidatos.vaga.id, st)}
                                                    style={{ 
                                                        padding: '6px 14px', 
                                                        borderRadius: '20px', 
                                                        border: '1px solid',
                                                        borderColor: (c.status || 'pendente') === st ? 'transparent' : '#e5e7eb',
                                                        background: (c.status || 'pendente') === st ? COR_STATUS[st] : 'transparent', 
                                                        color: (c.status || 'pendente') === st ? TEXT_COR_STATUS[st] : '#6b7280', 
                                                        cursor: 'pointer', 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: 700, 
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
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

            <Navbar icon={<BrandLogo size={24} />} title="NORTE EMPREGOS" subtitle={`EMPRESA | ${empresa.razao_social}`}>
                <button onClick={handleLogout} className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', width: 'auto' }}><LogOut size={16} /> SAIR</button>
            </Navbar>

            <div className="container" style={{ marginTop: '2rem' }}>
                {/* Abas Estilizadas */}
                <div className="tabs-row" style={{ 
                    display: 'flex', 
                    gap: '0.75rem', 
                    marginBottom: '2.5rem', 
                    flexWrap: 'wrap',
                    paddingBottom: '10px',
                    borderBottom: '1px solid rgba(0,0,0,0.05)'
                }}>
                    <button onClick={() => setActiveTab('vagas')} className="tab-btn" style={tabStyle('vagas')}>
                        <Briefcase size={17} /> MINHAS VAGAS
                    </button>
                    <button onClick={() => setActiveTab('talentos')} className="tab-btn" style={tabStyle('talentos')}>
                        <Users size={17} /> BUSCAR TALENTOS
                    </button>
                    <button onClick={() => setActiveTab('salvos')} className="tab-btn" style={tabStyle('salvos')}>
                        <Star size={17} fill={favoritosIds.size > 0 ? '#ebbf21' : 'none'} color={favoritosIds.size > 0 ? '#ebbf21' : 'currentColor'} />
                        SALVOS 
                        {favoritosIds.size > 0 && (
                            <span className="badge-premium pulse">
                                {favoritosIds.size}
                            </span>
                        )}
                    </button>
                    <button onClick={() => setActiveTab('perfil')} className="tab-btn" style={tabStyle('perfil')}>
                        <User size={17} /> MEU PERFIL
                    </button>
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
                                        <button onClick={() => { setShowVagaForm(false); setVagaToEdit(null); setNewVaga({ titulo: '', descricao: '', requisitos: '', modalidade: '', cidade: '', salario_min: '', salario_max: '', data_limite: '', quantidade: 1, requisitos_obrigatorios: [], requisitos_desejaveis: [] }); }}
                                            className="neon-button secondary" style={{ margin: 0, padding: '6px 14px', width: 'auto', fontSize: '0.8rem' }}>
                                            CANCELAR EDIÇÃO
                                        </button>
                                    )}
                                </div>
                                <form onSubmit={handlePublicarVaga} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div className="input-group">
                                        <label style={{ color: 'var(--norte-dark-green)', fontWeight: 'bold' }}>TÍTULO DA VAGA *</label>
                                        <input className="neon-input" required value={newVaga.titulo} onChange={e => setNewVaga({ ...newVaga, titulo: e.target.value })} placeholder="Ex: Desenvolvedor React" />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.25rem' }}>
                                        <div className="input-group">
                                            <label>MODALIDADE</label>
                                            <select className="neon-input" value={newVaga.modalidade} onChange={e => setNewVaga({ ...newVaga, modalidade: e.target.value })}>
                                                <option value="">Selecione...</option>
                                                {MODALIDADES.map(m => <option key={m} value={m}>{LABEL_MODAL[m]}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label>PREFERÊNCIA DE SEXO</label>
                                            <select className="neon-input" value={newVaga.preferencia_genero} onChange={e => setNewVaga({ ...newVaga, preferencia_genero: e.target.value })}>
                                                <option value="todos">Sem preferência</option>
                                                <option value="masculino">Masculino</option>
                                                <option value="feminino">Feminino</option>
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label>CIDADE (Opcional)</label>
                                            <input className="neon-input" value={newVaga.cidade} onChange={e => setNewVaga({ ...newVaga, cidade: e.target.value })} placeholder="Ex: Manaus - AM" />
                                        </div>
                                        <div className="input-group">
                                            <label>Nº DE VAGAS</label>
                                            <input type="number" min="1" className="neon-input" value={newVaga.quantidade} onChange={e => setNewVaga({ ...newVaga, quantidade: e.target.value })} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
                                        <div className="input-group">
                                            <label>FAIXA SALARIAL (R$)</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input type="number" className="neon-input" placeholder="Mín" value={newVaga.salario_min} onChange={e => setNewVaga({ ...newVaga, salario_min: e.target.value })} style={{ flex: 1 }} />
                                                <input type="number" className="neon-input" placeholder="Máx" value={newVaga.salario_max} onChange={e => setNewVaga({ ...newVaga, salario_max: e.target.value })} style={{ flex: 1 }} />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label>PRAZO LIMITE PARA INSCRIÇÃO (OPCIONAL)</label>
                                            <input type="date" className="neon-input" value={newVaga.data_limite} onChange={e => setNewVaga({ ...newVaga, data_limite: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* --- REQUISITOS ESTRUTURADOS (TAGS - MOTOR DO MATCHING) --- */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
                                        <div className="input-group">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--norte-dark-green)', fontWeight: 'bold' }}>
                                                <CheckCircle size={16} /> COMPETÊNCIAS OBRIGATÓRIAS
                                            </label>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                                <input 
                                                    type="text" 
                                                    className="neon-input" 
                                                    placeholder="Aperte Enter para adicionar..." 
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = e.target.value.trim();
                                                            if (val && !newVaga.requisitos_obrigatorios.includes(val)) {
                                                                setNewVaga({ ...newVaga, requisitos_obrigatorios: [...newVaga.requisitos_obrigatorios, val] });
                                                                e.target.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <p style={{ fontSize: '0.7rem', color: '#666', margin: '0 0 8px 4px', fontStyle: 'italic' }}>
                                                Dica: Aperte Enter após cada item. Ex: Vendas, Excel, CNH B.
                                            </p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {newVaga.requisitos_obrigatorios.map((tag, idx) => (
                                                    <span key={idx} style={{ background: 'rgba(0,141,76,0.1)', color: 'var(--norte-dark-green)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(0,141,76,0.2)', fontWeight: 600 }}>
                                                        {tag}
                                                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => setNewVaga({ ...newVaga, requisitos_obrigatorios: newVaga.requisitos_obrigatorios.filter(t => t !== tag) })} />
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="input-group">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--norte-teal)', fontWeight: 'bold' }}>
                                                <Star size={16} /> DESEJÁVEIS / DIFERENCIAIS
                                            </label>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                                <input 
                                                    type="text" 
                                                    className="neon-input" 
                                                    placeholder="Aperte Enter para adicionar..." 
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = e.target.value.trim();
                                                            if (val && !newVaga.requisitos_desejaveis.includes(val)) {
                                                                setNewVaga({ ...newVaga, requisitos_desejaveis: [...newVaga.requisitos_desejaveis, val] });
                                                                e.target.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <p style={{ fontSize: '0.7rem', color: '#666', margin: '0 0 8px 4px', fontStyle: 'italic' }}>
                                                Ex: Inglês, Pós-graduação, Veículo próprio.
                                            </p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {newVaga.requisitos_desejaveis.map((tag, idx) => (
                                                    <span key={idx} style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--norte-teal)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(13,148,136,0.2)', fontWeight: 600 }}>
                                                        {tag}
                                                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => setNewVaga({ ...newVaga, requisitos_desejaveis: newVaga.requisitos_desejaveis.filter(t => t !== tag) })} />
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label style={{ fontWeight: 'bold' }}>DESCRIÇÃO DAS ATIVIDADES</label>
                                        <textarea className="neon-input" required style={{ minHeight: '120px' }} placeholder="Descreva aqui o dia a dia da função e o que você espera do candidato..." value={newVaga.descricao} onChange={e => setNewVaga({ ...newVaga, descricao: e.target.value })} />
                                    </div>
                                    
                                    <button type="submit" className="neon-button" style={{ background: 'var(--norte-green)', color: '#fff', border: 'none', height: '48px', fontSize: '1rem', fontWeight: 800 }}>
                                        {vagaToEdit ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR VAGA AGORA 🚀'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {loading && activeTab === 'vagas' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
                                <CardSkeleton />
                                <CardSkeleton />
                                <CardSkeleton />
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
                                {vagas.map(vaga => (
                                    <div key={vaga.id} className="glass-panel" style={{ padding: '1.5rem', opacity: vaga.status === 'fechada' ? 0.7 : 1 }}>
                                        <h3 style={{ marginBottom: '0.5rem' }}>{vaga.titulo}</h3>
                                        {/* ... resto do conteúdo da vaga ... */}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                        <span style={{ fontSize: '0.7rem', background: vaga.status === 'aberta' ? 'rgba(0,240,255,0.1)' : 'rgba(255,68,68,0.1)', color: vaga.status === 'aberta' ? 'var(--neon-blue)' : '#ff4444', padding: '2px 8px', borderRadius: '10px' }}>{vaga.status?.toUpperCase()}</span>
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '10px' }}>
                                            👥 {vaga.candidaturas?.[0]?.count || 0} inscrito(s)
                                        </span>
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                                            📦 {vaga.quantidade || 1} {vaga.quantidade > 1 ? 'vagas' : 'vaga'}
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
                        )}
                    </>
                )}

                {/* ===== ABA TALENTOS ===== */}
                {activeTab === 'talentos' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>BANCO de TALENTOS <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>({talentosComMatch.length} candidato{talentosComMatch.length !== 1 ? 's' : ''})</span></h2>
                            <button onClick={() => setShowFiltros(!showFiltros)} className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--norte-green)' }}>
                                <Filter size={16} color="currentColor" /> {showFiltros ? 'OCULTAR PERFIL' : 'DEFINIR PERFIL DESEJADO'}
                            </button>
                        </div>

                        {/* Painel de filtros inteligente */}
                        {showFiltros && (
                            <div className="glass-panel" style={{ marginBottom: '2rem', border: '1px solid rgba(0, 141, 76, 0.2)' }}>
                                <h4 style={{ color: 'var(--norte-dark-green)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Compass size={20} /> CONFIGURAR PERFIL DESEJADO (MATCH)
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => setShowSalvarPerfilModal(true)}
                                            className="action-btn" 
                                            style={{ background: 'var(--norte-green)', color: 'white', padding: '6px 12px', fontSize: '0.75rem' }}
                                        >
                                            <Save size={14} style={{ marginRight: '5px' }} /> SALVAR ESTE PERFIL
                                        </button>
                                        <button 
                                            onClick={resetFiltros}
                                            className="action-btn" 
                                            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '6px 12px', fontSize: '0.75rem' }}
                                        >
                                            LIMPAR
                                        </button>
                                    </div>
                                </h4>

                                {perfisSalvos.length > 0 && (
                                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,141,76,0.05)', borderRadius: '8px', border: '1px solid rgba(0,141,76,0.1)' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--norte-dark-green)', marginBottom: '8px', fontWeight: 'bold' }}>MEUS PERFIS SALVOS (ATALHOS):</label>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {perfisSalvos.map(p => (
                                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--norte-green)', borderRadius: '20px', padding: '4px 12px', cursor: 'pointer' }}>
                                                    <span onClick={() => aplicarPerfilSalvo(p)} style={{ fontSize: '0.8rem', color: 'var(--norte-dark-green)', fontWeight: 500 }}>{p.nome_perfil}</span>
                                                    <button onClick={() => deletarPerfilSalvo(p.id)} style={{ marginLeft: '8px', border: 'none', background: 'none', cursor: 'pointer', color: '#ff4444', display: 'flex' }}><X size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* SEÇÃO 1: BUSCA INTELIGENTE (PESO 40% EXP) */}
                                <div style={{ background: 'rgba(0, 141, 76, 0.03)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(0, 141, 76, 0.1)' }}>
                                    <h5 style={{ margin: '0 0 1rem 0', color: 'var(--norte-green)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1.4' }}>🚀 1. BUSCA POR EXPERIÊNCIA E ATIVIDADES (PESO 40%)</h5>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label>Cargo de Referência (Sugestão)</label>
                                            <select className="neon-input" value={filtros.perfilReferencia} onChange={e => {
                                                const val = e.target.value;
                                                setFiltros(prev => ({
                                                    ...prev,
                                                    perfilReferencia: val,
                                                    palavrasChave: SUGESTOES_PALAVRAS[val] || prev.palavrasChave
                                                }));
                                            }}>
                                                <option value="">Personalizado...</option>
                                                <option value="Vendas">Vendas / Comercial</option>
                                                <option value="Atendimento">Atendimento ao Cliente</option>
                                                <option value="Administrativo">Administrativo</option>
                                                <option value="Operacional">Operacional / Logística</option>
                                                <option value="Financeiro">Financeiro</option>
                                            </select>
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label>Palavras-chave de Atividades (Separe por vírgula)</label>
                                            <input 
                                                className="neon-input" 
                                                placeholder="Ex: vendas, metas, prospecção, atendimento..." 
                                                value={filtros.palavrasChave} 
                                                onChange={e => atualizarFiltro('palavrasChave', e.target.value)} 
                                            />
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                                💡 O sistema buscará esses termos dentro das descrições das experiências dos candidatos.
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                                    {/* SEÇÃO 2: DADOS PESSOAIS E LOCALIZAÇÃO */}
                                    <div>
                                        <h5 style={{ margin: '0 0 1rem 0', color: 'var(--norte-teal)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1.4' }}>📍 2. LOCALIZAÇÃO E BÁSICO (PESO 10%)</h5>
                                        <div className="input-group">
                                            <label>Nome do candidato</label>
                                            <div style={{ position: 'relative' }}>
                                                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                                                <input className="neon-input" style={{ paddingLeft: '36px' }} placeholder="Nome..." value={filtros.nome} onChange={e => atualizarFiltro('nome', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label>Cidade / Localização</label>
                                            <input className="neon-input" placeholder="Ex: Manaus" value={filtros.cidade} onChange={e => atualizarFiltro('cidade', e.target.value)} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            <div className="input-group">
                                                <label>Idade Mín</label>
                                                <input type="number" className="neon-input" value={filtros.idadeMin} onChange={e => atualizarFiltro('idadeMin', e.target.value)} />
                                            </div>
                                            <div className="input-group">
                                                <label>Idade Máx</label>
                                                <input type="number" className="neon-input" value={filtros.idadeMax} onChange={e => atualizarFiltro('idadeMax', e.target.value)} />
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }}>
                                            <div className="input-group">
                                                <label>Categoria CNH</label>
                                                <select className="neon-input" value={filtros.cnhCat} onChange={e => atualizarFiltro('cnhCat', e.target.value)}>
                                                    <option value="">Qualquer categoria...</option>
                                                    <option value="A">A (Moto)</option>
                                                    <option value="B">B (Carro)</option>
                                                    <option value="AB">AB (Moto e Carro)</option>
                                                    <option value="C">C (Caminhão)</option>
                                                    <option value="D">D (Ônibus)</option>
                                                    <option value="E">E (Articulado)</option>
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label>Transporte</label>
                                                <select className="neon-input" value={filtros.possuiTransporte} onChange={e => atualizarFiltro('possuiTransporte', e.target.value)}>
                                                    <option value="">Qualquer</option>
                                                    <option value="true">Possui</option>
                                                    <option value="false">Não possui</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>


                                    {/* SEÇÃO 3: FORMAÇÃO E HABILIDADES */}
                                    <div>
                                        <h5 style={{ margin: '0 0 1rem 0', color: 'var(--norte-dark-green)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1.4' }}>📚 3. FORMAÇÃO E SKILLS (PESO 30%)</h5>
                                        <div className="input-group">
                                            <label>Habilidades (separadas por vírgula)</label>
                                            <input 
                                                className="neon-input" 
                                                placeholder="Ex: Excel, Vendas, Inglês..." 
                                                value={filtros.habilidade} 
                                                onChange={e => atualizarFiltro('habilidade', e.target.value)} 
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Escolaridade</label>
                                            <select className="neon-input" value={filtros.ensinoMedio} onChange={e => atualizarFiltro('ensinoMedio', e.target.value)}>
                                                <option value="">Ensino Médio...</option>
                                                <option value="completo">Completo</option>
                                                <option value="cursando">Cursando</option>
                                                <option value="incompleto">Incompleto</option>
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label>Ensino Superior (Status)</label>
                                            <select className="neon-input" value={filtros.ensinoSuperior} onChange={e => atualizarFiltro('ensinoSuperior', e.target.value)}>
                                                <option value="">Qualquer status...</option>
                                                <option value="completo">Completo</option>
                                                <option value="cursando">Cursando</option>
                                                <option value="nenhum">Nenhum</option>
                                            </select>
                                        </div>
                                        {filtros.ensinoSuperior !== 'nenhum' && (
                                            <div className="input-group">
                                                <label>Qual o curso? (Pesquisa)</label>
                                                <input 
                                                    className="neon-input" 
                                                    placeholder="Ex: Administração, Direito..." 
                                                    value={filtros.cursoSuperior} 
                                                    onChange={e => atualizarFiltro('cursoSuperior', e.target.value)} 
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* SEÇÃO 4: PERFIL E COMPORTAMENTO */}
                                    <div>
                                        <h5 style={{ margin: '0 0 1rem 0', color: 'var(--neon-purple)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1.4' }}>🧠 4. COMPORTAMENTO (PESO 20%)</h5>
                                        <div className="input-group">
                                            <label>Perfil DISC Desejado</label>
                                            <select className="neon-input" value={filtros.perfilDisc} onChange={e => atualizarFiltro('perfilDisc', e.target.value)}>
                                                {DISC_PERFIS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label>Gênero</label>
                                            <select className="neon-input" value={filtros.genero} onChange={e => atualizarFiltro('genero', e.target.value)}>
                                                <option value="">Qualquer</option>
                                                <option value="Masculino">Masculino</option>
                                                <option value="Feminino">Feminino</option>
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label>Integridade dos Dados</label>
                                            <select className="neon-input" value={filtros.statusCurriculo} onChange={e => atualizarFiltro('statusCurriculo', e.target.value)}>
                                                <option value="todos">Todos os currículos</option>
                                                <option value="completo">Apenas Completos</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                    <button onClick={resetFiltros}
                                        className="neon-button secondary" style={{ margin: 0, padding: '8px 20px', width: 'auto', fontSize: '0.8rem' }}>
                                        LIMPAR TODOS OS FILTROS
                                    </button>
                                    
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                                        🎯 Os pontos são redistribuídos automaticamente se você deixar campos vazios.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Barra de download em lote */}
                        {selecionados.size > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '10px', padding: '0.75rem 1.25rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <span style={{ color: 'var(--neon-purple)', fontWeight: 700, fontSize: '0.9rem' }}>
                                    ✅ {selecionados.size} candidato{selecionados.size !== 1 ? 's' : ''} selecionado{selecionados.size !== 1 ? 's' : ''}
                                </span>
                                <button
                                    onClick={() => handleDownloadBatch(talentosComMatch.filter(t => selecionados.has(t.user_id)))}
                                    disabled={gerandoPdf}
                                    className="neon-button"
                                    style={{ margin: 0, padding: '8px 16px', width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
                                >
                                    <Download size={16} />
                                    {gerandoPdf ? 'GERANDO PDF...' : `BAIXAR ${selecionados.size} CURRÍCULO${selecionados.size !== 1 ? 'S' : ''}`}
                                </button>
                                <button onClick={() => setSelecionados(new Set())} className="neon-button secondary" style={{ margin: 0, padding: '8px 12px', width: 'auto', fontSize: '0.8rem' }}>Limpar Seleção</button>
                            </div>
                        )}

                        {/* Tabela de talentos */}
                        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                            <div className="table-responsive">
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', width: '40px' }}>
                                            <input type="checkbox" 
                                                checked={talentosComMatch.length > 0 && selecionados.size === talentosComMatch.length}
                                                onChange={() => toggleTodos(talentosComMatch)}
                                                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--neon-purple)' }}
                                            />
                                        </th>
                                        <th style={{ padding: '1rem' }}>Candidato</th>
                                        <th style={{ padding: '1rem' }}>Mapa de Calor</th>
                                        <th style={{ padding: '1rem' }}>Idade</th>
                                        <th style={{ padding: '1rem' }}>Cidade</th>
                                        <th style={{ padding: '1rem' }}>Contato</th>
                                        <th style={{ padding: '1rem' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                                    <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid rgba(124,58,237,0.1)', borderTopColor: 'var(--neon-purple)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Buscando talentos...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        talentosComMatch.map(t => (
                                            <tr key={t.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: selecionados.has(t.user_id) ? 'rgba(124,58,237,0.07)' : 'transparent', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1rem', width: '40px' }}>
                                                <input type="checkbox"
                                                    checked={selecionados.has(t.user_id)}
                                                    onChange={() => toggleSelecionado(t.user_id)}
                                                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--neon-purple)' }}
                                                />
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <p style={{ fontWeight: 'bold', margin: 0 }}>{t.nome}</p>
                                                    {t.genero && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({t.genero})</span>}
                                                    {t.completo ? (
                                                        <span title="Perfil Completo" style={{ color: '#22c55e', display: 'flex' }}><CheckCircle size={14} /></span>
                                                    ) : (
                                                        <span title="Perfil Incompleto" style={{ color: '#f59e0b', display: 'flex' }}><AlertTriangle size={14} /></span>
                                                    )}
                                                    
                                                    {t.possui_transporte && (
                                                        <span title="Possui Transporte Próprio" style={{ color: 'var(--norte-green)', display: 'flex' }}><Compass size={14} /></span>
                                                    )}
                                                    
                                                    {t.cnh?.possui && t.cnh.categorias?.length > 0 && (
                                                        <span title={`CNH Cat: ${t.cnh.categorias.join('/')}`} style={{ background: 'rgba(0,141,76,0.1)', color: 'var(--norte-green)', fontSize: '0.6rem', fontWeight: 900, padding: '2px 5px', borderRadius: '4px', border: '1px solid rgba(0,141,76,0.2)' }}>
                                                            {t.cnh.categorias[0]}
                                                        </span>
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
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <HeatmapBadge score={t.matchScore} />
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', maxWidth: '140px', lineHeight: '1.2' }}>
                                                        Compatibilidade baseada em experiência e habilidades
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                                                {calcIdade(t.data_nascimento) !== null ? `${calcIdade(t.data_nascimento)} anos` : '—'}
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                {t.bairro ? `${t.bairro}${t.cidade ? ` - ${t.cidade}` : ''}` : (t.cidade || '—')}
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{t.telefone || '—'}</td>
                                                     <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button 
                                                        onClick={() => toggleFavorite(t.user_id)} 
                                                        className="neon-button secondary" 
                                                        style={{ 
                                                            margin: 0, 
                                                            padding: '6px 12px', 
                                                            width: 'auto', 
                                                            fontSize: '0.75rem',
                                                            background: favoritosIds.has(t.user_id) ? 'rgba(245,158,11,0.1)' : 'transparent',
                                                            borderColor: favoritosIds.has(t.user_id) ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                                                            color: favoritosIds.has(t.user_id) ? '#f59e0b' : 'var(--text-main)'
                                                        }}
                                                    >
                                                        <Star size={14} fill={favoritosIds.has(t.user_id) ? "currentColor" : "none"} style={{ marginRight: '5px' }} />
                                                        {favoritosIds.has(t.user_id) ? 'SALVO' : 'SALVAR'}
                                                    </button>
                                                    <button onClick={() => navigate(`/cv-preview/${t.user_id}`)} className="neon-button secondary" style={{ margin: 0, padding: '6px 14px', width: 'auto', fontSize: '0.8rem' }}>
                                                        VER CV
                                                    </button>
                                                    {t.telefone && (
                                                        <button 
                                                            onClick={() => handleWhatsAppContact(t.telefone, t.nome)}
                                                            className="action-btn btn-wpp" 
                                                            style={{ 
                                                                padding: '0', 
                                                                width: '36px', 
                                                                height: '36px' 
                                                            }}
                                                            title="WhatsApp"
                                                        >
                                                            <WhatsAppIcon size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )))}
                                    {talentosComMatch.length === 0 && (
                                        <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum candidato encontrado com os filtros aplicados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINAÇÃO NUMERADA EMPRESA */}
                        {totalCount > pageSize && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '2rem', flexWrap: 'wrap' }}>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="neon-button secondary"
                                    style={{ width: 'auto', margin: 0, padding: '8px 16px' }}
                                >
                                    Anterior
                                </button>

                                {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === Math.ceil(totalCount / pageSize) || Math.abs(p - currentPage) <= 2)
                                    .map((p, idx, arr) => (
                                        <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: 'var(--text-muted)' }}>...</span>}
                                            <button
                                                onClick={() => setCurrentPage(p)}
                                                className={currentPage === p ? "neon-button" : "neon-button secondary"}
                                                style={{ 
                                                    width: '40px', height: '40px', margin: 0, padding: 0,
                                                    background: currentPage === p ? 'var(--neon-purple)' : 'transparent',
                                                    color: currentPage === p ? '#fff' : 'var(--text-main)',
                                                    borderColor: currentPage === p ? 'var(--neon-purple)' : 'rgba(255,255,255,0.1)'
                                                }}
                                            >
                                                {p}
                                            </button>
                                        </div>
                                    ))}

                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
                                    disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                                    className="neon-button secondary"
                                    style={{ width: 'auto', margin: 0, padding: '8px 16px' }}
                                >
                                    Próxima
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

                {/* ===== ABA SALVOS ===== */}
                {activeTab === 'salvos' && (
                    <div className="glass-panel" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>MEUS TALENTOS SALVOS</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', marginTop: '5px' }}>Currículos que você marcou com estrela para acesso rápido.</p>
                            </div>
                            <div style={{ background: 'rgba(235,191,33,0.1)', border: '1px solid #ebbf21', color: '#ebbf21', padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Star size={20} fill="#ebbf21" />
                                <span style={{ fontWeight: 800 }}>{favoritosIds.size} SALVOS</span>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <tr style={{ textAlign: 'left' }}>
                                        <th style={{ padding: '1.25rem 1rem' }}>Candidato</th>
                                        <th style={{ padding: '1.25rem 1rem' }}>Compatibilidade</th>
                                        <th style={{ padding: '1.25rem 1rem' }}>Cidade/Bairro</th>
                                        <th style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {talentosComMatch.map(t => (
                                        <tr key={t.user_id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 'bold', margin: 0, color: 'var(--norte-dark-green)' }}>{t.nome}</p>
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{t.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <HeatmapBadge score={t.matchScore} />
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                {t.cidade || '—'} {t.bairro ? `(${t.bairro})` : ''}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                 <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button 
                                                        onClick={() => toggleFavorite(t.user_id)} 
                                                        className="neon-button secondary" 
                                                        style={{ 
                                                            margin: 0, 
                                                            padding: '6px 12px', 
                                                            width: 'auto', 
                                                            fontSize: '0.75rem',
                                                            background: 'rgba(245,158,11,0.1)',
                                                            borderColor: '#f59e0b',
                                                            color: '#f59e0b'
                                                        }}
                                                    >
                                                        <Star size={14} fill="currentColor" style={{ marginRight: '5px' }} />
                                                        SALVO
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/cv-preview/${t.user_id}`)} 
                                                        className="neon-button secondary" 
                                                        style={{ margin: 0, padding: '8px 16px', width: 'auto', fontSize: '0.8rem' }}
                                                    >
                                                        <ExternalLink size={14} style={{ marginRight: '6px' }} /> VER CV
                                                    </button>
                                                    {t.telefone && (
                                                        <button 
                                                            onClick={() => handleWhatsAppContact(t.telefone, t.nome)}
                                                            className="action-btn btn-wpp" 
                                                            style={{ padding: '0', width: '36px', height: '36px' }}
                                                            title="WhatsApp"
                                                        >
                                                            <WhatsAppIcon size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {Array.from(favoritosIds).length === 0 && (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                                                <div style={{ opacity: 0.3, marginBottom: '1rem' }}>
                                                    <Star size={48} />
                                                </div>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Você ainda não salvou nenhum candidato.</p>
                                                <button onClick={() => setActiveTab('talentos')} className="neon-button" style={{ width: 'auto', marginTop: '1rem' }}>EXPLORAR TALENTOS</button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ===== ABA PERFIL ===== */}
                {activeTab === 'perfil' && (
                    <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: '100px', height: '100px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '2px dashed var(--norte-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
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
                        <h3 style={{ color: 'var(--norte-dark-green)', marginBottom: '1rem' }}>FECHAR ESTA VAGA?</h3>
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

            {/* NOTIFICAÇÃO PREMIUM (TOAST) */}
            {notification && (
                <div style={{
                    position: 'fixed', top: '1.5rem', right: '1.5rem', left: 'auto',
                    maxWidth: 'calc(100vw - 2rem)',
                    background: notification.type === 'success' ? '#008D4C' : '#ef4444',
                    color: '#fff', padding: '1rem 1.5rem', borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    zIndex: 10000, animation: 'slideInRight 0.4s ease-out'
                }}>
                    <div style={{ flexShrink: 0 }}>
                        {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <span style={{ fontWeight: 600 }}>{notification.message}</span>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideInUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>

            {/* MODAL: SALVAR PERFIL DE BUSCA */}
            {showSalvarPerfilModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '1rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', border: '1px solid var(--norte-green)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                            <div style={{ background: 'rgba(0,141,76,0.1)', color: 'var(--norte-green)', padding: '10px', borderRadius: '12px' }}>
                                <Save size={24} />
                            </div>
                            <h3 style={{ color: 'var(--norte-dark-green)', margin: 0 }}>Salvar Configurações</h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', marginBottom: '2rem', lineHeight: 1.5 }}>Isso guardará todos os filtros atuais (experiência, DISC, habilidades, etc.) para que você possa reativá-los com um clique no futuro.</p>
                        
                        <div className="input-group">
                            <label style={{ color: 'var(--norte-dark-green)', fontWeight: 800 }}>NOME DO PERFIL (EX: VAGA VENDEDOR ELITE)</label>
                            <input 
                                className="neon-input" 
                                autoFocus
                                value={nomeNovoPerfil} 
                                onChange={e => setNomeNovoPerfil(e.target.value)}
                                placeholder="Digite um título para esta busca..."
                                style={{ border: '1px solid rgba(0,141,76,0.3)' }}
                                onKeyDown={e => e.key === 'Enter' && handleSalvarPerfilBusca()}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '2.5rem' }}>
                            <button onClick={() => setShowSalvarPerfilModal(false)} className="neon-button secondary" style={{ margin: 0, flex: 1 }}>CANCELAR</button>
                            <button onClick={handleSalvarPerfilBusca} className="neon-button" style={{ margin: 0, flex: 2, background: 'var(--norte-green)' }}>SALVAR PERFIL AGORA</button>
                        </div>
                    </div>
                </div>
            )}

            <NorteConfirmModal 
                isOpen={confirmModal.isOpen}
                type="hiring"
                title="Confirmar Contratação"
                message="🎉 Parabéns! Você está prestes a oficializar a contratação deste talento. Isso registrará o sucesso no sistema e ajudará a medir o impacto da plataforma."
                confirmText="SIM, CONTRATAR AGORA!"
                cancelText="Ainda não"
                onConfirm={() => executarMudancaStatus(confirmModal.data.userId, confirmModal.data.vagaId, confirmModal.data.novoStatus)}
                onCancel={() => setConfirmModal({ isOpen: false, data: null })}
            />
        </div>
    );
}
