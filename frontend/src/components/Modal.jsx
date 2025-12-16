import React, { useEffect } from 'react';
/* global globalThis */
import PropTypes from 'prop-types';

export default function Modal({ isOpen, onClose, title, children, className, hideHeader }) {
  useEffect(() => {
    // always call the hook; only attach the listener when the modal is open
    if (isOpen) {
      const handleKey = (e) => {
        if (e.key === 'Escape') onClose?.();
      };

      // determine the event target safely, prefer `globalThis.window` for Sonar/consistency
      let target = null;
      if (typeof globalThis !== 'undefined') {
        target = globalThis?.window ?? globalThis;
      }

      if (target && typeof target.addEventListener === 'function') {
        target.addEventListener('keydown', handleKey);
        return () => target.removeEventListener('keydown', handleKey);
      }
    }
    return undefined;
  }, [isOpen, onClose]);

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
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1
  };

  const bodyStyle = {
    overflowY: 'auto',
    padding: '1rem',
    flex: 1
  };

  return (
    <div
      style={overlayStyle}
    >
      <button
        type="button"
        aria-label="Close modal"
        onClick={() => {
          // clicking the full-screen backdrop button closes the modal
          onClose?.();
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          background: 'transparent',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'default',
          zIndex: 0
        }}
      />
      <dialog style={dialogStyle} className={className || ''} open aria-label={title || 'Modal'}>
        {!hideHeader && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid #ececec' }}>
            <div style={{ fontWeight: 700 }}>{title}</div>
            <button onClick={onClose} aria-label="Cerrar" style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>&times;</button>
          </div>
        )}
        <div style={bodyStyle}>{children}</div>
      </dialog>
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


