import React from 'react';
import PropTypes from 'prop-types';

export default function Modal({ isOpen, onClose, title, children, className, hideHeader }) {
  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000
  };

  const dialogStyle = {
    background: 'white',
    borderRadius: 12,
    maxWidth: '1100px',
    width: '95%',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
    display: 'flex',
    flexDirection: 'column'
  };

  const bodyStyle = {
    overflowY: 'auto',
    padding: '1rem',
    flex: 1
  };

  return (
    <div
      style={overlayStyle}
      aria-label={title || 'Modal'}
      onClick={(e) => {
        // click on backdrop closes modal when clicking outside dialog
        if (e.target === e.currentTarget) onClose?.();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose?.();
      }}
    >
      <div style={dialogStyle} className={className || ''}>
        {!hideHeader && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid #ececec' }}>
            <div style={{ fontWeight: 700 }}>{title}</div>
            <button onClick={onClose} aria-label="Cerrar" style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>&times;</button>
          </div>
        )}
        <div style={bodyStyle}>{children}</div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  children: PropTypes.node,
  className: PropTypes.string,
  hideHeader: PropTypes.bool
};
Modal.defaultProps = {
  isOpen: false,
  onClose: () => {},
  title: '',
  children: null,
  className: '',
  hideHeader: false
};


