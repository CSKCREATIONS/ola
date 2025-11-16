import React from 'react';
import PropTypes from 'prop-types';

export default function AdvancedStats({ cards }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    }}>
      {cards.map((c, idx) => (
        <div key={idx} style={{
          background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
          borderRadius: '16px',
          padding: '25px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              background: c.gradient || 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              borderRadius: '12px',
              padding: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className={c.iconClass} style={{ color: 'white', fontSize: '1.5rem' }} aria-hidden={true}></i>
            </div>
            <div>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                {c.value}
              </h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                {c.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

AdvancedStats.propTypes = {
  cards: PropTypes.arrayOf(PropTypes.shape({
    iconClass: PropTypes.string.isRequired,
    gradient: PropTypes.string,
    value: PropTypes.node.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired
};
