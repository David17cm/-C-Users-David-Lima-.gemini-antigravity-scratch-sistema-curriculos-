import React, { useState, useRef, useEffect } from 'react';
import { Flame, Thermometer, Sun, Wind, Snowflake, CheckCircle2, Clock, AlertCircle, Info, X } from 'lucide-react';

/**
 * Componente HeatmapBadge
 * Exibe o nível de afinidade técnica e comportamental com um checklist visual premium.
 * 
 * @param {number} score - Pontuação de 0 a 100.
 * @param {Array} breakdown - Lista de strings (ex: ["✅ Requisito", "⏳ Pendente"])
 * @param {boolean} isCompanyView - Se verdadeiro, oculta dicas voltadas ao candidato.
 */
const HeatmapBadge = ({ score = 0, breakdown = [] , isCompanyView = false }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [showMobileModal, setShowMobileModal] = useState(false);
    const [tooltipStyles, setTooltipStyles] = useState({ left: '50%', transform: 'translateX(-50%)' });
    
    const tooltipRef = useRef(null);
    const badgeRef = useRef(null);

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    // Lógica para evitar corte lateral e vertical no Desktop
    useEffect(() => {
        if (!isMobile && showTooltip && tooltipRef.current && badgeRef.current) {
            const rect = tooltipRef.current.getBoundingClientRect();
            const badgeRect = badgeRef.current.getBoundingClientRect();
            const padding = 20;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let styles = { 
                left: '50%', 
                right: 'auto', 
                transform: 'translateX(-50%)', 
                top: '135%', 
                bottom: 'auto',
                arrowPosition: 'top' 
            };

            // 1. Posicionamento Horizontal
            if (rect.left < padding) {
                styles.left = '0';
                styles.transform = 'none';
                styles.arrowLeft = `${badgeRect.width / 2}px`;
            } else if (rect.right > viewportWidth - padding) {
                styles.left = 'auto';
                styles.right = '0';
                styles.transform = 'none';
                styles.arrowLeft = `${rect.width - (badgeRect.width / 2)}px`;
            } else {
                styles.arrowLeft = '50%';
            }

            // 2. Posicionamento Vertical (Flipping)
            const spaceBelow = viewportHeight - badgeRect.bottom;
            const tooltipHeight = rect.height;

            if (spaceBelow < tooltipHeight + padding && badgeRect.top > tooltipHeight + padding) {
                styles.top = 'auto';
                styles.bottom = '135%';
                styles.arrowPosition = 'bottom';
            }

            setTooltipStyles(styles);
        }
    }, [showTooltip, isMobile]);

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
            glow: '0 0 15px rgba(239, 68, 68, 0.4)',
            className: 'heatmap-pulse'
        };
    } else if (score >= 70) {
        config = {
            label: 'AQUECIDO',
            icon: Sun,
            color: '#000',
            bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            glow: '0 0 10px rgba(245, 158, 11, 0.2)',
            className: ''
        };
    } else if (score >= 40) {
        config = {
            label: 'MORNO',
            icon: Thermometer,
            color: '#000',
            bg: 'linear-gradient(135deg, #d9f99d, #84cc16)',
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

    const renderBreakdown = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {breakdown.map((item, idx) => {
                const isMatch = item.includes('✅');
                const isPending = item.includes('⏳') || item.includes('Pendente');
                const cleanText = item.replace(/[✅⏳]|Pendente:\s*/g, '').trim();

                return (
                    <div key={idx} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ flexShrink: 0 }}>
                            {isMatch ? (
                                <CheckCircle2 size={16} color="#22c55e" />
                            ) : isPending ? (
                                <Clock size={16} color="#eab308" />
                            ) : (
                                <AlertCircle size={16} color="#94a3b8" />
                            )}
                        </div>
                        <span style={{ 
                            fontSize: '0.78rem', 
                            fontWeight: 600, 
                            color: isMatch ? '#f1f5f9' : '#cbd5e1',
                            lineHeight: '1.2'
                        }}>
                            {cleanText}
                        </span>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <style>{`
                .heatmap-pulse {
                    animation: heatmap-pulse-anim 2s infinite;
                }
                @keyframes heatmap-pulse-anim {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .heatmap-tooltip {
                    position: absolute;
                    top: ${tooltipStyles.top};
                    bottom: ${tooltipStyles.bottom};
                    background: #0f172a;
                    color: #f1f5f9;
                    padding: 16px;
                    border-radius: 16px;
                    width: 260px;
                    z-index: 10000;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
                    border: 1px solid rgba(255,255,255,0.15);
                    pointer-events: none;
                    animation: fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    backdrop-filter: blur(12px);
                }
                .heatmap-tooltip::after {
                    content: "";
                    position: absolute;
                    ${tooltipStyles.arrowPosition === 'top' ? 'bottom: 100%;' : 'top: 100%;'}
                    left: ${tooltipStyles.arrowLeft || '50%'};
                    margin-left: -6px;
                    border-width: 6px;
                    border-style: solid;
                    border-color: ${tooltipStyles.arrowPosition === 'top' 
                        ? 'transparent transparent #0f172a transparent' 
                        : '#0f172a transparent transparent transparent'};
                    transition: left 0.2s ease;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .mobile-heatmap-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(8px);
                    z-index: 99999;
                    display: flex;
                    align-items: flex-end;
                    animation: fadeInMobile 0.3s ease-out;
                }
                
                .mobile-heatmap-content {
                    background: #0f172a;
                    width: 100%;
                    border-radius: 24px 24px 0 0;
                    padding: 24px;
                    margin-bottom: env(safe-area-inset-bottom, 0);
                    animation: slideUpMobile 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    border-top: 1px solid rgba(255,255,255,0.1);
                    box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
                }

                @keyframes fadeInMobile { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUpMobile { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `}</style>

            <div 
                ref={badgeRef}
                onClick={() => {
                    if (isMobile) {
                        setShowMobileModal(true);
                    }
                }}
                onMouseEnter={() => !isMobile && setShowTooltip(true)}
                onMouseLeave={() => !isMobile && setShowTooltip(false)}
                className={config.className} 
                style={{
                    background: config.bg,
                    color: config.color,
                    padding: '6px 14px',
                    borderRadius: '24px',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: config.glow,
                    width: 'fit-content',
                    border: '1px solid rgba(255,255,255,0.1)',
                    whiteSpace: 'nowrap',
                    cursor: 'help',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    userSelect: 'none'
                }}
            >
                <config.icon size={15} fill={config.color === '#fff' ? 'currentColor' : 'none'} />
                <span style={{ letterSpacing: '0.01em' }}>{config.label} {score}%</span>
                {breakdown.length > 0 && <Info size={12} style={{ opacity: 0.6, marginLeft: '2px' }} />}
            </div>

            {/* Tooltip Desktop */}
            {!isMobile && showTooltip && breakdown.length > 0 && (
                <div 
                    ref={tooltipRef}
                    className="heatmap-tooltip"
                    style={{
                        left: tooltipStyles.left,
                        right: tooltipStyles.right,
                        transform: tooltipStyles.transform
                    }}
                >
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: config.bg }}></div>
                        <span style={{ fontWeight: 900, color: '#f8fafc', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Análise Técnica Norte
                        </span>
                    </div>
                    {renderBreakdown()}
                    {!isCompanyView && score < 70 && (
                        <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(234, 179, 8, 0.05)', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.1)' }}>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#eab308', fontWeight: 700, textAlign: 'center' }}>
                                💡 Dica: Adicione estas competências ao seu currículo!
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal/Drawer Mobile */}
            {isMobile && showMobileModal && (
                <div className="mobile-heatmap-overlay" onClick={() => setShowMobileModal(false)}>
                    <div className="mobile-heatmap-content" onClick={e => e.stopPropagation()}>
                        <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '0 auto 20px' }}></div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ 
                                background: config.bg, 
                                color: config.color, 
                                padding: '10px 16px', 
                                borderRadius: '16px',
                                fontWeight: 900,
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <config.icon size={18} fill={config.color === '#fff' ? 'currentColor' : 'none'} />
                                {config.label} {score}%
                            </div>
                            <span style={{ fontWeight: 800, color: '#94a3b8', fontSize: '0.8rem', letterSpacing: '0.05em' }}>ANÁLISE TÉCNICA</span>
                            <button onClick={() => setShowMobileModal(false)} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '8px', borderRadius: '50%' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {renderBreakdown()}
                        </div>

                        {!isCompanyView && score < 70 && (
                            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '16px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#fcd34d', fontWeight: 700, textAlign: 'center', lineHeight: '1.4' }}>
                                    💡 Dica: Adicione estas competências ao seu currículo para aumentar sua afinidade!
                                </p>
                            </div>
                        )}

                        <button 
                            onClick={() => setShowMobileModal(false)}
                            style={{ 
                                width: '100%', 
                                padding: '16px', 
                                marginTop: '24px', 
                                borderRadius: '16px', 
                                background: 'rgba(224, 231, 255, 0.05)', 
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '0.9rem'
                            }}
                        >
                            FECHAR
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeatmapBadge;
