import React from 'react';
import PropTypes from 'prop-types';

export default function OrderDetailsHeader({ iconClass, title, subtitle, onClose, children }) {
  return (
    <div className="modal-header-realista" style={{
      background: 'linear-gradient(135deg, #6a1b9a, #9b59b6)',
      color: 'white',
      padding: '1.5rem 2rem',
      borderTopLeftRadius: '12px',
      borderTopRightRadius: '12px',
      cursor: 'move'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {iconClass ? (
            <i className={iconClass} style={{ fontSize: '1.8rem' }} aria-hidden={true}></i>
          ) : null}
          <div>
            <h5 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>{title}</h5>
            {subtitle && (
              <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem' }}>{subtitle}</p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {children}

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                fontSize: '1.3rem',
                cursor: 'pointer',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.3)'; e.target.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.2)'; e.target.style.transform = 'scale(1)'; }}
              aria-label="Cerrar"
            >
              &times;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

OrderDetailsHeader.propTypes = {
  iconClass: PropTypes.string,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  onClose: PropTypes.func,
  children: PropTypes.node
};

OrderDetailsHeader.defaultProps = {
  iconClass: '',
  subtitle: null,
  onClose: null,
  children: null
};
