import React from 'react';
import PropTypes from 'prop-types';

export default function SharedListHeaderCard({ title, subtitle, iconClass, children }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '20px',
      padding: '30px',
      marginBottom: '30px',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '300px',
        height: '300px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        zIndex: 1
      }}></div>
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '16px',
              padding: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              {iconClass ? <i className={iconClass} style={{ fontSize: '2.5rem', color: 'white' }} aria-hidden={true}></i> : null}
            </div>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '700' }}>{title}</h2>
              {subtitle && <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>{subtitle}</p>}
            </div>
          </div>
          <div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

SharedListHeaderCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  iconClass: PropTypes.string,
  children: PropTypes.node
};

SharedListHeaderCard.defaultProps = {
  subtitle: '',
  iconClass: '',
  children: null
};
