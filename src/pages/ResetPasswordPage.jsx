import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertTriangle, Eye, EyeOff, Key } from 'lucide-react';
import BrandLogo from '../components/layout/BrandLogo';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Verificar se há um hash na URL que indique recuperação de senha
        // O Supabase Auth lida com isso automaticamente, mas é bom para feedback visual
        const hash = window.location.hash;
        if (!hash || !hash.includes('type=recovery')) {
            // Se não for recuperação, talvez logar erro ou redirecionar
            console.warn('Acesso à página de reset sem token de recuperação válido no hash.');
        }
    }, []);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validação de senha
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
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => {
                navigate('/auth?mode=login');
            }, 3000);
        } catch (err) {
            setError(err.message || 'Erro ao atualizar senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-center">
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', border: '1px solid var(--norte-green)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ background: 'var(--norte-green)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', transform: 'rotate(5deg)', boxShadow: '0 10px 20px rgba(0, 141, 76, 0.2)' }}>
                        <BrandLogo size={32} />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--norte-dark-green)', margin: 0 }}>
                        NOVA SENHA
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                        Defina sua nova senha de acesso
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
                        <span>{error}</span>
                    </div>
                ) : success ? (
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
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontWeight: '500'
                    }}>
                        <CheckCircle2 size={24} />
                        <span>Senha alterada com sucesso!</span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Redirecionando para o login...</span>
                    </div>
                ) : null}

                {!success && (
                    <form onSubmit={handleResetPassword}>
                        <div className="input-group">
                            <label htmlFor="password">Nova Senha</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '15px', left: '15px' }} />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="neon-input"
                                    style={{ paddingLeft: '45px', paddingRight: '45px' }}
                                    placeholder="Mínimo 8 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '15px',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                                Mínimo 8 caracteres, com ao menos 1 número.
                            </p>
                        </div>

                        <div className="input-group">
                            <label htmlFor="confirmPassword">Confirme a Nova Senha</label>
                            <div style={{ position: 'relative' }}>
                                <Key size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '15px', left: '15px' }} />
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className="neon-input"
                                    style={{ paddingLeft: '45px', paddingRight: '45px' }}
                                    placeholder="Repita a nova senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '15px',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="neon-button"
                            disabled={loading}
                        >
                            {loading ? 'ATUALIZANDO...' : 'REDEFINIR SENHA'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
