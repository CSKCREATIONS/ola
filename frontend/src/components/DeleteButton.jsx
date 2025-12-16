import React from 'react';
import PropTypes from 'prop-types';

export default function DeleteButton({ onClick, title = 'Eliminar', disabled = false, ariaLabel = 'Eliminar', children, className = '', style = {} }) {
  const baseStyle = {
    background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
    color: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 10px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const combinedStyle = { ...baseStyle, ...style };

  const handleMouseEnter = (e) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.3)';
  };

  const handleMouseLeave = (e) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.2)';
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={combinedStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
}

DeleteButton.propTypes = {
  onClick: PropTypes.func,
  title: PropTypes.string,
  disabled: PropTypes.bool,
  ariaLabel: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object
};
