import React from 'react';

export const Skeleton = ({ width, height, borderRadius = '4px', className = '' }) => {
    return (
        <div
            className={`skeleton-shimmer ${className}`}
            style={{
                width,
                height,
                borderRadius,
                background: 'rgba(255, 255, 255, 0.05)',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            <div className="shimmer-effect"></div>
            <style>{`
                .skeleton-shimmer {
                    display: inline-block;
                    vertical-align: middle;
                }
                .shimmer-effect {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(0, 240, 255, 0.1),
                        transparent
                    );
                    animation: shimmer 1.5s infinite;
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export const CardSkeleton = () => (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <Skeleton width="60%" height="24px" style={{ marginBottom: '1rem' }} />
        <Skeleton width="100%" height="16px" style={{ marginBottom: '0.5rem' }} />
        <Skeleton width="90%" height="16px" style={{ marginBottom: '1.5rem' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
            <Skeleton width="80px" height="32px" borderRadius="10px" />
            <Skeleton width="80px" height="32px" borderRadius="10px" />
        </div>
    </div>
);
