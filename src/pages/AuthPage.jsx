import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CircuitBoard, User, Lock, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Constantes de redirecionamento
const ROLE_REDIRECT = {
    admin: '/admin',
    master: '/admin',
    empresa: '/empresa',
    candidato: '/vagas',
};

// SEGURANÇA HIGH-01: Limites de tentativas de login
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 segundos

// SEGURANÇA MED-02: Regex de validação de email
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Termos de Uso
    const [aceitouTermos, setAceitouTermos] = useState(false);
    const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false);

    // SEGURANÇA HIGH-01: Controle de rate limiting
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [lockedUntil, setLockedUntil] = useState(null);
    const [lockCountdown, setLockCountdown] = useState(0);

    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'signup') setIsLogin(false);
        else if (mode === 'login') setIsLogin(true);
    }, [searchParams]);

    // SEGURANÇA HIGH-01: Countdown do bloqueio
    useEffect(() => {
        if (!lockedUntil) return;
        const interval = setInterval(() => {
            const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
            if (remaining <= 0) {
                setLockedUntil(null);
                setLockCountdown(0);
                setLoginAttempts(0);
                clearInterval(interval);
            } else {
                setLockCountdown(remaining);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lockedUntil]);

    // Redirecionamento Automático após Login/Role carregar
    const { user, role, loading: authLoading } = useAuth();
    useEffect(() => {
        // Se temos um usuário e a carga do AuthContext finalizou
        if (user && !authLoading) {
            // Conta sem role configurada (Pode ocorrer se RLS falhar ou conta órfã)
            if (role === null && isLogin) {
                setError('Perfil de acesso não encontrado. Verifique se sua conta foi aprovada ou configurada corretamente.');
                setLoading(false);
                return;
            }

            if (role) {
                const target = ROLE_REDIRECT[role] || '/dashboard';
                if (window.location.pathname !== target) {
                    navigate(target, { replace: true });
                }
            }
        }
    }, [user, role, authLoading, navigate, isLogin]);

    /**
     * Retry com backoff exponencial.
     * Tenta `maxRetries` vezes, dobrando o delay a cada falha de rede/timeout.
     * Erros de credenciais (4xx) são lançados imediatamente, sem retry.
     */
    const retryWithBackoff = async (fn, maxRetries = 3, baseDelayMs = 2000) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (err) {
                const isNetworkError = !err.status || err.status >= 500;
                const isLastAttempt = attempt === maxRetries;

                if (!isNetworkError || isLastAttempt) throw err;

                const delay = baseDelayMs * Math.pow(2, attempt - 1); // 2s, 4s, 8s...
                setError(`Servidor lento. Tentativa ${attempt} de ${maxRetries}. Aguarde ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                setError(null);
            }
        }
    };

    const doLogin = async (loginEmail, loginPassword) => {
        if (lockedUntil && Date.now() < lockedUntil) {
            setError(`Muitas tentativas. Aguarde ${lockCountdown} segundos.`);
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            let signInData = null;
            const cleanEmail = loginEmail.trim();

            try {
                // Tentativa de login com retry automático em caso de erro de rede/timeout
                const result = await retryWithBackoff(async () => {
                    const { data, error: signInError } = await supabase.auth.signInWithPassword({
                        email: cleanEmail,
                        password: loginPassword,
                    });

                    // Erro de credenciais (400) — não tentar novamente
                    if (signInError && signInError.status === 400) throw signInError;
                    // Erro de rede/servidor — propagar para o retry
                    if (signInError) throw signInError;

                    return data;
                });
                signInData = result;
            } catch (authErr) {
                console.error('Erro detalhado de Login:', authErr);
                // Se o erro NÃO for de credenciais (ex: rede), repassar para o catch externo
                if (authErr.status !== 400) throw authErr;

                // Se as credenciais forem inválidas, tentamos ver se é um CONVITE pendente
                const { data: inviteData, error: inviteFetchError } = await supabase
                    .from('empresa_invites')
                    .select('*')
                    .eq('email', cleanEmail)
                    .eq('password_temp', loginPassword)
                    .eq('status', 'pendente')
                    .maybeSingle();

                if (!inviteFetchError && inviteData) {
                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        email: loginEmail,
                        password: loginPassword,
                        options: { data: { full_name: inviteData.razao_social, is_invited_company: true } }
                    });

                    if (signUpError) throw signUpError;

                    if (signUpData?.user) {
                        await supabase.from('user_roles').insert([{ user_id: signUpData.user.id, role: 'empresa' }]);
                        await supabase.from('empresas').insert([{
                            user_id: signUpData.user.id,
                            razao_social: inviteData.razao_social,
                            cnpj: inviteData.cnpj,
                            aprovada: true
                        }]);
                        await supabase.from('empresa_invites').update({ status: 'concluido' }).eq('id', inviteData.id);
                        setSuccessMessage('Acesso de parceiro ativado com sucesso! Redirecionando...');
                        return;
                    }
                }

                // Se não for um convite, aí sim lançamos o erro de credenciais original
                throw authErr;
            }

            // Registro de Log de Acesso (fire-and-forget)
            if (signInData?.user) {
                supabase.from('access_logs').insert([{
                    user_id: signInData.user.id,
                    email: loginEmail,
                    action: 'login',
                    user_agent: navigator.userAgent,
                    accessed_at: new Date().toISOString()
                }]).catch(() => { });
            }

        } catch (err) {
            const newAttempts = loginAttempts + 1;
            setLoginAttempts(newAttempts);
            if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
                setLockedUntil(Date.now() + LOCKOUT_DURATION_MS);
                setError(`Conta bloqueada por ${LOCKOUT_DURATION_MS / 1000}s.`);
            } else {
                setError(`Credenciais inválidas. ${MAX_LOGIN_ATTEMPTS - newAttempts} tentativa(s) restante(s).`);
            }
        } finally {
            setLoading(false);
        }
    };


    const handleAuth = async (e) => {
        e.preventDefault();
        if (isLogin) {
            await doLogin(email, password);
        } else {
            await handleSignup();
        }
    };

    const handleSignup = async () => {
        setLoading(true);
        setError(null);
        const cleanEmail = email.trim();

        // SEGURANÇA MED-02: Validação de formato de email
        if (!EMAIL_REGEX.test(email)) {
            setError('Por favor, insira um endereço de e-mail válido.');
            setLoading(false);
            return;
        }

        // SEGURANÇA MED-03: Validação de senha mais rígida (mín. 8 chars + 1 número)
        if (password.length < 8) {
            setError('A senha deve ter pelo menos 8 caracteres.');
            setLoading(false);
            return;
        }

        if (!/\d/.test(password)) {
            setError('A senha deve conter pelo menos 1 número.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem!');
            setLoading(false);
            return;
        }

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: cleanEmail,
                password,
                options: { data: { full_name: name } }
            });
            if (signUpError) throw signUpError;

            if (data?.user) {
                const { error: roleError } = await supabase.from('user_roles').insert([
                    { user_id: data.user.id, role: 'candidato' }
                ]);
                if (roleError) {
                    console.error('Erro ao definir role:', roleError.message);
                    throw new Error('Falha ao configurar perfil de acesso. Por favor, tente novamente.');
                }

                // --- LÓGICA DE INDICAÇÃO (Indique e Ganhe) ---
                const refCode = searchParams.get('ref');
                if (refCode) {
                    try {
                        const { data: donorUserId, error: rpcError } = await supabase
                            .rpc('get_user_id_by_referral_code', { ref_code: refCode });
                        
                        if (donorUserId && !rpcError) {
                            await supabase.from('indicacoes').insert([{
                                quem_indicou: donorUserId,
                                quem_se_cadastrou: data.user.id
                            }]);
                        }
                    } catch (e) {
                        console.warn('Erro ao registrar indicação:', e.message);
                    }
                }
                // ----------------------------------------------

                // Log de Consentimento LGPD
                try {
                    await supabase.from('consent_logs').insert([{
                        user_id: data.user.id,
                        email: cleanEmail,
                        accepted_terms: aceitouTermos,
                        accepted_privacy: aceitouPrivacidade,
                        ip_address: null, // preenchido pelo servidor via Edge Function
                        user_agent: navigator.userAgent,
                        consented_at: new Date().toISOString()
                    }]);
                } catch (e) {
                    console.warn('Log de consentimento não registrado:', e.message);
                }
            }

            setLoading(false);
            setSuccessMessage('Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de fazer login.');
            setIsLogin(true);
        } catch (err) {
            setError(err.message || 'Erro ao criar conta.');
            setLoading(false);
        }
    };

    const isLocked = lockedUntil && Date.now() < lockedUntil;

    return (
        <div className="flex-center">
            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <CircuitBoard size={48} color="var(--neon-blue)" style={{ margin: '0 auto 1rem' }} />
                    <h2>{isLogin ? 'ACESSO AO SISTEMA' : 'NOVO REGISTRO'}</h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {isLogin ? 'Conecte-se para gerenciar seus dados.' : 'Inicialize seu perfil profissional.'}
                    </p>
                </div>

                {error ? (
                    <div style={{
                        color: '#ff4444',
                        backgroundColor: 'rgba(255, 68, 68, 0.1)',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        border: '1px solid #ff4444',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <AlertTriangle size={16} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span>{error}</span>
                            <button 
                                onClick={() => {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    window.location.reload();
                                }}
                                style={{ 
                                    fontSize: '0.75rem', 
                                    textDecoration: 'underline', 
                                    background: 'none', 
                                    border: 'none', 
                                    color: 'inherit', 
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            >
                                Limpar cache e tentar novamente
                            </button>
                        </div>
                    </div>
                ) : successMessage ? (
                    <div style={{
                        color: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        padding: '12px',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        border: '1px solid #22c55e',
                        fontSize: '0.95rem',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontWeight: '500'
                    }}>
                        <CheckCircle2 size={18} />
                        {successMessage}
                    </div>
                ) : null}

                {/* SEGURANÇA HIGH-01: Aviso de bloqueio por tentativas */}
                {isLocked && (
                    <div style={{
                        backgroundColor: 'rgba(245,158,11,0.1)',
                        border: '1px solid #f59e0b',
                        color: '#f59e0b',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        textAlign: 'center',
                        fontSize: '0.85rem'
                    }}>
                        🔒 Acesso temporariamente bloqueado. Tente novamente em <strong>{lockCountdown}s</strong>.
                    </div>
                )}

                <form onSubmit={handleAuth}>
                    {!isLogin && (
                        <div className="input-group">
                            <label htmlFor="name">Nome Completo</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '15px', left: '15px' }} />
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    className="neon-input"
                                    style={{ paddingLeft: '45px' }}
                                    placeholder="Seu nome"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="email">E-mail</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '15px', left: '15px' }} />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="neon-input"
                                style={{ paddingLeft: '45px' }}
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Senha de Acesso</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '15px', left: '15px' }} />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                className="neon-input"
                                style={{ paddingLeft: '45px' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={isLogin ? 1 : 8}
                            />
                        </div>
                        {/* SEGURANÇA MED-03: Dica de requisitos de senha */}
                        {!isLogin && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                                Mínimo 8 caracteres, com ao menos 1 número.
                            </p>
                        )}
                    </div>

                    {!isLogin && (
                        <div className="input-group">
                            <label htmlFor="confirmPassword">Confirme sua Senha</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '15px', left: '15px' }} />
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    className="neon-input"
                                    style={{ paddingLeft: '45px' }}
                                    placeholder="Repita a senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    {!isLogin && (
                        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label htmlFor="aceitouTermos" style={{ display: 'flex', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'none', alignItems: 'flex-start' }}>
                                <input type="checkbox" id="aceitouTermos" name="aceitouTermos" checked={aceitouTermos} onChange={e => setAceitouTermos(e.target.checked)} style={{ marginTop: '3px' }} />
                                <span>Li e concordo com os <a href="/legal?doc=termos" target="_blank" style={{ color: 'var(--neon-blue)', textDecoration: 'underline' }}>Termos de Uso</a> do sistema.</span>
                            </label>
                            <label htmlFor="aceitouPrivacidade" style={{ display: 'flex', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'none', alignItems: 'flex-start' }}>
                                <input type="checkbox" id="aceitouPrivacidade" name="aceitouPrivacidade" checked={aceitouPrivacidade} onChange={e => setAceitouPrivacidade(e.target.checked)} style={{ marginTop: '3px' }} />
                                <span>Autorizo o processamento dos meus dados conforme a <a href="/legal?doc=privacidade" target="_blank" style={{ color: 'var(--neon-blue)', textDecoration: 'underline' }}>Política de Privacidade</a>.</span>
                            </label>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="neon-button"
                        disabled={loading || isLocked || (!isLogin && (!aceitouTermos || !aceitouPrivacidade))}
                        style={{ opacity: (isLocked || (!isLogin && (!aceitouTermos || !aceitouPrivacidade))) ? 0.5 : 1 }}
                    >
                        {isLocked
                            ? `BLOQUEADO (${lockCountdown}s)`
                            : loading
                                ? (user ? 'REDIRECIONANDO...' : 'PROCESSANDO...')
                                : (isLogin ? 'ENTRAR' : 'REGISTRAR')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => { setIsLogin(!isLogin); setError(null); setLoginAttempts(0); setLockedUntil(null); }}
                    >
                        {isLogin ? 'Não tem conta? Registre-se.' : 'Já tem conta? Faça login.'}
                    </button>
                </div>
            </div>
        </div>
    );
}
