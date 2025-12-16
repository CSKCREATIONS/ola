import React from 'react';
import PropTypes from 'prop-types';

export default function PrimaryButton({ onClick, children, title = '', disabled = false, className = '', style = {} }) {
  const baseStyle = {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const combinedStyle = { ...baseStyle, ...style };

  const handleMouseEnter = (e) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
  };

  const handleMouseLeave = (e) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title || undefined}
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

PrimaryButton.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node,
  title: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object
};
