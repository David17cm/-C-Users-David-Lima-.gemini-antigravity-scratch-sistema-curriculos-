import React from 'react';
import { HelpCircle, CheckCircle, AlertCircle, Trophy, X } from 'lucide-react';

/**
 * NorteConfirmModal - Um modal de confirmação premium para substituir o window.confirm
 * 
 * @param {boolean} isOpen - Controla se o modal está visível
 * @param {string} title - Título do modal
 * @param {string} message - Mensagem descritiva
 * @param {function} onConfirm - Callback para ação positiva
 * @param {function} onCancel - Callback para cancelar/fechar
 * @param {string} confirmText - Texto do botão de confirmação
 * @param {string} cancelText - Texto do botão de cancelamento
 * @param {string} type - Tipo visual: 'success', 'warning', 'error', 'hiring'
 */
export function NorteConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  type = 'warning'
}) {
  if (!isOpen) return null;

  const icons = {
    warning: <HelpCircle size={48} color="var(--norte-yellow)" />,
    success: <CheckCircle size={48} color="var(--norte-green)" />,
    error: <AlertCircle size={48} color="#ef4444" />,
    hiring: <Trophy size={48} color="var(--norte-yellow)" />
  };

  const accentColor = type === 'error' ? '#ef4444' : type === 'success' || type === 'hiring' ? 'var(--norte-green)' : 'var(--norte-yellow)';

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div 
        className="modal-content glass-panel" 
        style={{ 
          maxWidth: '450px', 
          width: '100%', 
          padding: '2.5rem', 
          textAlign: 'center',
          position: 'relative',
          borderTop: `6px solid ${accentColor}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onCancel}
          style={{ 
            position: 'absolute', 
            top: '1rem', 
            right: '1rem', 
            background: 'none', 
            border: 'none', 
            color: '#94a3b8', 
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
          {icons[type] || icons.warning}
        </div>

        <h3 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 800, 
          color: 'var(--text-main)', 
          marginBottom: '1rem',
          letterSpacing: '-0.02em'
        }}>
          {title}
        </h3>

        <p style={{ 
          color: 'var(--text-muted)', 
          lineHeight: 1.6, 
          marginBottom: '2rem',
          fontSize: '1rem'
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            onClick={onCancel} 
            className="neon-button secondary" 
            style={{ 
              margin: 0, 
              flex: 1, 
              height: '48px', 
              fontSize: '0.9rem',
              fontWeight: 700 
            }}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className="neon-button" 
            style={{ 
              margin: 0, 
              flex: 1, 
              height: '48px', 
              background: accentColor, 
              color: type === 'warning' ? '#000' : '#fff',
              fontSize: '0.9rem',
              fontWeight: 800,
              boxShadow: `0 8px 15px -3px ${accentColor}40`
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
