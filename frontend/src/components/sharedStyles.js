export const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.5rem',
  fontWeight: '600',
  color: '#374151',
  fontSize: '0.95rem'
};

export const inputStyle = {
  width: '100%',
  padding: '0.875rem 1rem',
  border: '2px solid #e5e7eb',
  borderRadius: '10px',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  backgroundColor: '#ffffff',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  maxWidth: '100%',
  display: 'block'
};

export const createFocusHandler = (color) => (e) => {
  e.target.style.borderColor = color;
  e.target.style.boxShadow = `0 0 0 3px ${color}1a`;
};

export const handleBlur = (e) => {
  e.target.style.borderColor = '#e5e7eb';
  e.target.style.boxShadow = 'none';
};

// Button styles and shared hover handlers
export const btnSecondaryStyle = {
  padding: '0.875rem 1.5rem',
  border: '2px solid #e5e7eb',
  borderRadius: '10px',
  backgroundColor: 'white',
  color: '#374151',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '0.95rem',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

export const btnPrimaryStyle = {
  padding: '0.875rem 1.5rem',
  border: 'none',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  color: 'white',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '0.95rem',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
};

export const mouseEnterSecondary = (e) => {
  e.target.style.backgroundColor = '#f3f4f6';
  e.target.style.borderColor = '#d1d5db';
};

export const mouseLeaveSecondary = (e) => {
  e.target.style.backgroundColor = 'white';
  e.target.style.borderColor = '#e5e7eb';
};

export const mouseEnterPrimary = (e) => {
  e.target.style.transform = 'translateY(-1px)';
  e.target.style.boxShadow = '0 6px 12px -1px rgba(59, 130, 246, 0.4)';
};

export const mouseLeavePrimary = (e) => {
  e.target.style.transform = 'translateY(0)';
  e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
};

// Decorative header/icon box
export const gradientIconBox = {
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  borderRadius: '12px',
  padding: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export const headerCircleTop = {
  position: 'absolute',
  top: '-50%',
  right: '-10%',
  width: '200px',
  height: '200px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '50%',
  pointerEvents: 'none'
};

export const headerCircleBottom = {
  position: 'absolute',
  bottom: '-30%',
  left: '-5%',
  width: '150px',
  height: '150px',
  background: 'rgba(255,255,255,0.08)',
  borderRadius: '50%',
  pointerEvents: 'none'
};

// Status badge styles
export const badgeBase = {
  color: 'white',
  padding: '8px 12px',
  borderRadius: '20px',
  fontSize: '11px',
  fontWeight: '700',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

export const badgeRemisionadaStyle = {
  ...badgeBase,
  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)'
};

export const badgeAgendadaStyle = {
  ...badgeBase,
  backgroundColor: '#16a34a'
};

export const badgePendienteStyle = {
  ...badgeBase,
  backgroundColor: '#0ea5e9'
};

export const badgeIconStyle = {
  fontSize: '10px'
};
