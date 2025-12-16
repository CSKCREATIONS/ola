import React from 'react';
import PropTypes from 'prop-types';

export default function LabeledInput({ id, label, iconClass, name, type = 'text', value, onChange, required = false }) {
  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#374151',
    fontSize: '0.95rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    backgroundColor: '#f9fafb'
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = '#2563eb';
    e.target.style.backgroundColor = 'white';
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = '#e5e7eb';
    e.target.style.backgroundColor = '#f9fafb';
  };

  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {iconClass ? <i className={iconClass} style={{ color: '#2563eb' }} aria-hidden="true"></i> : null}
        <span>{label}</span>
        {required ? <span style={{ color: '#ef4444' }}>*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        style={inputStyle}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </div>
  );
}

LabeledInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  iconClass: PropTypes.string,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool
};
