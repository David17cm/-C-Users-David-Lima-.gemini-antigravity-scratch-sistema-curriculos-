import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Briefcase, List, LogOut, ChevronDown, FileText, Scale, Shield, Trash2, Brain, Compass } from 'lucide-react';
import { supabase } from '../../services/supabase';
import Navbar from './Navbar';
import BrandLogo from './BrandLogo';

export default function CandidateNavbar({ subtitle, profilePhoto }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    // Fecha o menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const dropdownItemStyle = (path) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        width: '100%',
        background: isActive(path) ? 'rgba(0, 91, 50, 0.1)' : 'transparent',
        color: isActive(path) ? 'var(--norte-dark-green)' : 'var(--text-main)',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.9rem',
        fontWeight: isActive(path) ? 700 : 500,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    });

    return (
        <Navbar icon={<BrandLogo size={24} />} title="NORTE EMPREGOS" subtitle={subtitle}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', position: 'relative' }} ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="neon-button secondary"
                    style={{ 
                        margin: 0, 
                        padding: '6px 12px', 
                        width: 'auto', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        border: isMenuOpen ? '1px solid var(--norte-green)' : '1px solid rgba(0,91,50,0.1)',
                        background: isMenuOpen ? 'rgba(0, 91, 50, 0.05)' : 'transparent'
                    }}
                >
                    <div style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%', 
                        overflow: 'hidden', 
                        background: 'var(--norte-green)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        {profilePhoto ? (
                            <img src={profilePhoto} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <User size={16} color="#fff" />
                        )}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>MENU</span>
                    <ChevronDown size={16} style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
                </button>

                {/* BOTÃO TESTE DISC ABAIXO DO MENU */}
                {!isActive('/vagas') && !isActive('/minhas-candidaturas') && (
                    <button 
                        onClick={() => navigate('/dashboard', { state: { openDisc: true } })}
                        style={{
                            background: 'linear-gradient(135deg, rgba(235,191,33,0.2), rgba(0,141,76,0.2))',
                            border: '1px solid var(--norte-yellow)',
                            borderRadius: '20px',
                            padding: '4px 12px',
                            color: 'var(--norte-dark-green)',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            animation: 'pulse 2s infinite',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <Brain size={12} /> TESTE DISC
                    </button>
                )}

                {isMenuOpen && (
                    <div className="glass-panel" style={{
                        position: 'fixed',
                        top: '70px',
                        right: '1rem',
                        left: 'auto',
                        width: '240px',
                        maxWidth: 'calc(100vw - 2rem)',
                        padding: '8px',
                        zIndex: 1000,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        border: '1px solid var(--norte-green)',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <button style={dropdownItemStyle('/dashboard')} onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }}>
                            <User size={18} /> MEU PERFIL (CV)
                        </button>
                        <button style={dropdownItemStyle('/minhas-candidaturas')} onClick={() => { navigate('/minhas-candidaturas'); setIsMenuOpen(false); }}>
                            <List size={18} /> MINHAS CANDIDATURAS
                        </button>
                        <button style={dropdownItemStyle('/vagas')} onClick={() => { navigate('/vagas'); setIsMenuOpen(false); }}>
                            <Briefcase size={18} /> VAGAS
                        </button>

                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 8px' }} />

                        <button style={dropdownItemStyle('/legal')} onClick={() => { navigate('/legal'); setIsMenuOpen(false); }}>
                            <Scale size={18} /> CENTRAL LEGAL
                        </button>
                        <button 
                            style={dropdownItemStyle('/legal?doc=meus-dados')} 
                            onClick={() => { navigate('/legal?doc=meus-dados'); setIsMenuOpen(false); }}
                        >
                            <Shield size={18} /> MEUS DADOS (LGPD)
                        </button>
                        <button 
                            style={{ ...dropdownItemStyle('/legal?doc=excluir-conta'), color: '#fca5a5' }} 
                            onClick={() => { navigate('/legal?doc=excluir-conta'); setIsMenuOpen(false); }}
                        >
                            <Trash2 size={18} /> EXCLUIR CONTA
                        </button>

                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 8px' }} />

                        <button style={{ ...dropdownItemStyle('/logout'), color: '#ef4444' }} onClick={handleLogout}>
                            <LogOut size={18} /> SAIR
                        </button>
                    </div>
                )}
            </div>
        </Navbar>
    );
}
