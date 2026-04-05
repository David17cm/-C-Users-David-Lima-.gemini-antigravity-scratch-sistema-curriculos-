import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { supabase } from '../../services/supabase';

const VAPID_PUBLIC_KEY = "BC9KZkAlYTcLvIihtDBjHZhUE83aZQxlVgB6Eoo2gVIwMWjvfF12ZZMfdfZQFm9gSnykYJBbCOqfH4vWy6Z5CGs";

export default function NotificationPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [show, setShow] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, asking, success, denied

    useEffect(() => {
        // Detecção de iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        const hasDecided = localStorage.getItem('norte-pwa-notif-decided');
        if (hasDecided) return;

        const timer = setTimeout(() => {
            setShow(true);
        }, 40000); 

        return () => clearTimeout(timer);
    }, []);

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const handleAccept = async () => {
        if (isIOS && !window.navigator.standalone) {
            // No iOS, se não estiver em modo standalone (PWA instalado), avisa o usuário
            alert('Para receber notificações no iPhone, clique no botão de "Compartilhar" (quadrado com seta) e escolha "Adicionar à Tela de Início". Depois, abra o app por lá!');
            return;
        }

        setStatus('asking');
        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                localStorage.setItem('norte-pwa-notif-decided', 'granted');
                setStatus('success');
                setTimeout(() => setShow(false), 3000);

                (async () => {
                    try {
                        const registration = await navigator.serviceWorker.ready;
                        const subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                        });

                        const { data: { user } } = await supabase.auth.getUser();
                        
                        await supabase.from('push_subscriptions').upsert({
                            user_id: user?.id || null,
                            email: user?.email || 'anonimo',
                            subscription_json: subscription,
                            status: 'active',
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'subscription_json' });
                    } catch (bgErr) {
                        console.error('Erro em background ao salvar inscrição push:', bgErr);
                    }
                })();
            } else {
                localStorage.setItem('norte-pwa-notif-decided', 'denied');
                setStatus('denied');
                setTimeout(() => setShow(false), 2000);
            }
        } catch (err) {
            console.error("Erro ao solicitar permissão de notificações:", err);
            setStatus('denied');
        }
    };

    const handleDecline = () => {
        localStorage.setItem('norte-pwa-notif-decided', 'denied');
        setShow(false);
    };

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: 'calc(100% - 40px)',
            maxWidth: '360px',
            background: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--norte-green)',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(0, 141, 76, 0.25)',
            animation: 'slideUpNotif 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            <button onClick={handleDecline} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ 
                    width: '60px', height: '60px', background: 'rgba(0, 141, 76, 0.15)', 
                    borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '0.25rem', transform: 'rotate(-5deg)'
                }}>
                    <Bell size={32} color="var(--norte-green)" />
                </div>

                {status === 'idle' || status === 'asking' ? (
                    <>
                        <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1.3rem', fontWeight: '700' }}>Vagas no seu bolso! 🚀</h4>
                        <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            {isIOS 
                                ? "Usuário de iPhone? Para receber alertas em tempo real, você precisa adicionar este site à sua Tela de Início!" 
                                : "Gostaria de receber notificações imediatas sobre novas oportunidades do seu perfil?"}
                        </p>
                        
                        <button 
                            onClick={handleAccept} 
                            disabled={status === 'asking'}
                            className="neon-button" 
                            style={{ 
                                width: '100%', 
                                margin: '0.5rem 0 0 0', 
                                background: 'linear-gradient(135deg, var(--norte-dark-green), var(--norte-green))', 
                                color: '#fff', 
                                border: 'none', 
                                padding: '15px', 
                                borderRadius: '15px', 
                                fontWeight: '800',
                                boxShadow: '0 10px 20px rgba(0, 141, 76, 0.3)',
                                letterSpacing: '0.5px'
                            }}
                        >
                            {status === 'asking' ? 'CONECTANDO...' : isIOS ? 'COMO ATIVAR NO IPHONE 🍎' : 'SIM, ME AVISE! ✅'}
                        </button>
                    </>
                ) : status === 'success' ? (
                    <div style={{ padding: '1.5rem', animation: 'scaleIn 0.4s' }}>
                        <div style={{ width: '60px', height: '60px', background: '#008d4c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                            <Check size={32} color="#fff" strokeWidth={3} />
                        </div>
                        <h4 style={{ color: '#ffffff', margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Conectamos com sucesso!</h4>
                        <p style={{ color: '#e2e8f0', fontSize: '0.85rem', marginTop: '8px' }}>Fique atento ao seu celular.</p>
                    </div>
                ) : (
                    <div style={{ padding: '1.5rem' }}>
                        <p style={{ color: '#f87171', margin: 0, fontWeight: '600' }}>Inscrição pausada. Você pode ativar nas configurações do site depois!</p>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideUpNotif {
                    from { transform: translate(-50%, 100px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
