import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar', 
  type = 'warning', // 'warning', 'danger', 'success', 'info'
  loading = false
}) {
  if (!isOpen) return null;

  const colors = {
    warning: 'var(--norte-yellow)',
    danger: '#ef4444',
    success: 'var(--norte-green)',
    info: '#3b82f6'
  };

  const icons = {
    warning: <HelpCircle size={32} />,
    danger: <AlertTriangle size={32} />,
    success: <CheckCircle size={32} />,
    info: <Info size={32} />
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="glass-panel modal-content" style={{ 
        maxWidth: '450px', 
        width: '100%', 
        padding: '2.5rem', 
        position: 'relative',
        borderTop: `6px solid ${colors[type]}`
      }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.5 }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-flex', 
            padding: '16px', 
            background: `${colors[type]}10`, 
            borderRadius: '50%', 
            marginBottom: '1.5rem', 
            color: colors[type] 
          }}>
            {icons[type]}
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--norte-dark-green)' }}>
            {title}
          </h3>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            {message}
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={onClose}
              className="neon-button secondary"
              style={{ flex: 1, margin: 0, padding: '12px' }}
              disabled={loading}
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              className="neon-button"
              style={{ 
                flex: 1, 
                margin: 0, 
                padding: '12px',
                background: colors[type], 
                color: type === 'warning' ? '#000' : '#fff',
                border: 'none',
                opacity: loading ? 0.7 : 1
              }}
              disabled={loading}
            >
              {loading ? 'Processando...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
