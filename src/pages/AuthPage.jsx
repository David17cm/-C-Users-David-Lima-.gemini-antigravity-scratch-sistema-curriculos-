import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CircuitBoard, User, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Constantes de redirecionamento


const ROLE_REDIRECT = {
    admin: '/admin',
    master: '/admin',
    empresa: '/empresa',
    candidato: '/dashboard',
};

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

    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'signup') setIsLogin(false);
        else if (mode === 'login') setIsLogin(true);
    }, [searchParams]);

    // Redirecionamento Automático após Login/Role carregar
    const { user, role, loading: authLoading } = useAuth();
    useEffect(() => {
        // Log para ajudar a debugar se as roles carregaram antes de navegar:
        console.log('AuthPage Redirection Check: user=', !!user, 'role=', role, 'authLoading=', authLoading);

        // Só redireciona se já terminou de carregar do BD
        if (user && role && !authLoading) {
            const target = ROLE_REDIRECT[role] || '/dashboard';
            // Só redireciona se não estivermos já no destino correto (prevenção de loop)
            if (window.location.pathname !== target) {
                console.log('AuthPage: Redirecionando para', target);
                navigate(target, { replace: true });
            }
        }
    }, [user, role, authLoading, navigate]);

    const doLogin = async (loginEmail, loginPassword) => {
        setLoading(true);
        setError(null);
        console.log('AuthPage: Tentando login para:', loginEmail);

        try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword,
            });
            if (signInError) throw signInError;

            // Registro de Log de Acesso (Marco Civil da Internet)
            if (signInData?.user) {
                await supabase.from('access_logs').insert([{
                    user_id: signInData.user.id,
                    email: loginEmail,
                    action: 'login',
                    user_agent: navigator.userAgent,
                    accessed_at: new Date().toISOString()
                }]).catch(err => console.warn('Log de acesso não registrado:', err.message));
            }

            console.log('AuthPage: Sign-in OK. Aguardando role para redirecionar...');
        } catch (err) {
            console.error('AuthPage: Erro no login:', err);
            setError(err.message || 'Erro ao autenticar. Verifique email e senha.');
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

        if (password !== confirmPassword) {
            setError('As senhas não coincidem!');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            setLoading(false);
            return;
        }

        console.log('AuthPage: Iniciando cadastro para:', email);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: name } }
            });
            if (signUpError) throw signUpError;

            if (data?.user) {
                await supabase.from('user_roles').insert([
                    { user_id: data.user.id, role: 'candidato' }
                ]);

                // Log de Consentimento LGPD - salva data/hora exata do aceite
                await supabase.from('consent_logs').insert([{
                    user_id: data.user.id,
                    email: email,
                    accepted_terms: true,
                    accepted_privacy: true,
                    ip_address: null, // preenchido pelo servidor se disponível
                    user_agent: navigator.userAgent,
                    consented_at: new Date().toISOString()
                }]).catch(err => console.warn('Log de consentimento não registrado:', err.message));
            }

            setLoading(false);
            setSuccessMessage('Cadastro realizado com sucesso! Você já pode fazer o seu login abaixo.');
            setIsLogin(true);
        } catch (err) {
            console.error('AuthPage: Erro no cadastro:', err);
            setError(err.message || 'Erro ao criar conta.');
            setLoading(false);
        }
    };

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

                {error && (
                    <div style={{
                        color: '#ff4444',
                        backgroundColor: 'rgba(255, 68, 68, 0.1)',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        border: '1px solid #ff4444',
                        fontSize: '0.9rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {successMessage && (
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
                )}

                <form onSubmit={handleAuth}>
                    {!isLogin && (
                        <div className="input-group">
                            <label>Nome Completo</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '15px', left: '15px' }} />
                                <input
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
                        <label>E-mail</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '15px', left: '15px' }} />
                            <input
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
                        <label>Senha de Acesso</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '15px', left: '15px' }} />
                            <input
                                type="password"
                                className="neon-input"
                                style={{ paddingLeft: '45px' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="input-group">
                            <label>Confirme sua Senha</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '15px', left: '15px' }} />
                                <input
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
                            <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'none', alignItems: 'flex-start' }}>
                                <input type="checkbox" checked={aceitouTermos} onChange={e => setAceitouTermos(e.target.checked)} style={{ marginTop: '3px' }} />
                                <span>Li e concordo com os <a href="/termos" target="_blank" style={{ color: 'var(--neon-blue)', textDecoration: 'underline' }}>Termos de Uso</a> do sistema.</span>
                            </label>
                            <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'none', alignItems: 'flex-start' }}>
                                <input type="checkbox" checked={aceitouPrivacidade} onChange={e => setAceitouPrivacidade(e.target.checked)} style={{ marginTop: '3px' }} />
                                <span>Autorizo o processamento dos meus dados conforme a <a href="/privacidade" target="_blank" style={{ color: 'var(--neon-blue)', textDecoration: 'underline' }}>Política de Privacidade</a>.</span>
                            </label>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="neon-button"
                        disabled={loading || (!isLogin && (!aceitouTermos || !aceitouPrivacidade))}
                        style={{ opacity: (!isLogin && (!aceitouTermos || !aceitouPrivacidade)) ? 0.5 : 1 }}
                    >
                        {loading
                            ? (user ? 'REDIRECIONANDO...' : 'PROCESSANDO...')
                            : (isLogin ? 'ENTRAR' : 'REGISTRAR')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                    >
                        {isLogin ? 'Não tem conta? Registre-se.' : 'Já tem conta? Faça login.'}
                    </button>
                </div>
            </div>
        </div>
    );
}
