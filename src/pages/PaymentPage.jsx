import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, ShieldCheck, Zap } from 'lucide-react';

export default function PaymentPage() {
    const { user, setPago } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [paymentUrl, setPaymentUrl] = useState(null);

    const handlePagarReal = async () => {
        setLoading(true);
        // Aqui chamaremos a Edge Function do Supabase que David criará
        // Ex: const { data } = await supabase.functions.invoke('create-preference');
        // Por enquanto, simulamos o link:
        setTimeout(() => {
            setPaymentUrl("https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=12345");
            setLoading(false);
        }, 1000);
    };

    const handleSimularPagamento = async () => {
        setLoading(true);
        try {
            // Registra a transação no banco antes de liberar
            await supabase.from('transacoes').insert([{
                user_id: user.id,
                valor: 19.90,
                status: 'confirmado'
            }]);

            const { error } = await supabase
                .from('user_roles')
                .update({ pago: true })
                .eq('user_id', user.id);

            if (error) throw error;

            setPago(true);
            alert('Pagamento confirmado com sucesso! Seu acesso vitalício foi liberado.');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Erro ao processar pagamento simulado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem', background: '#0a0a0c' }}>
            <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
                <Zap size={48} color="var(--neon-blue)" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 10px var(--neon-blue))' }} />
                <h1 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem' }}>Acesso Vitalício</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Para garantir a qualidade das vagas e a segurança dos dados, solicitamos uma taxa única de ativação.
                </p>

                <div style={{ textAlign: 'left', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ShieldCheck size={20} color="#00ff88" />
                        <span style={{ fontSize: '0.9rem' }}>Acesso ilimitado às melhores vagas</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CheckCircle size={20} color="#00ff88" />
                        <span style={{ fontSize: '0.9rem' }}>Currículo em destaque para empresas</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CreditCard size={20} color="#00ff88" />
                        <span style={{ fontSize: '0.9rem' }}>Pagamento único, sem mensalidades</span>
                    </div>
                </div>

                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.05)', marginBottom: '2rem', padding: '1.5rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>VALOR DO INVESTIMENTO</p>
                    <h2 style={{ fontSize: '2.5rem', margin: 0 }}>R$ 19,90</h2>
                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Taxa única de ativação</span>
                </div>

                {paymentUrl ? (
                    <div style={{ marginBottom: '2rem' }}>
                        <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="neon-button" style={{ background: '#009ee3', color: '#fff', textDecoration: 'none', display: 'block' }}>
                            ABRIR CHECKOUT MERCADO PAGO
                        </a>
                        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#00ff88' }}>Clique no botão acima para concluir o pagamento real.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={handlePagarReal}
                            className="neon-button"
                            disabled={loading}
                            style={{ background: '#fff', color: '#000', fontWeight: 'bold' }}
                        >
                            {loading ? 'GERANDO LINK...' : 'PAGAR COM MERCADO PAGO'}
                        </button>

                        <button
                            onClick={handleSimularPagamento}
                            className="neon-button secondary"
                            disabled={loading}
                            style={{ fontSize: '0.8rem', opacity: 0.7 }}
                        >
                            {loading ? 'PROCESSANDO...' : 'SIMULAR PAGAMENTO (MODO TESTE)'}
                        </button>
                    </div>
                )}

                <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    O acesso será liberado instantaneamente após a confirmação do Mercado Pago.
                </p>
            </div>
        </div>
    );
}
