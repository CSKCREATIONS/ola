import React, { useState, useEffect, useRef } from 'react';

const SafeChart = ({ children, data, isReady = true }) => {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isReady && data && Array.isArray(data) && data.length > 0) {
      // Pequeño delay para asegurar que el DOM esté completamente listo
      const timer = setTimeout(() => {
        setMounted(true);
        setShouldRender(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isReady, data]);

  useEffect(() => {
    return () => {
      setMounted(false);
      setShouldRender(false);
    };
  }, []);

  if (!isReady || !data || !Array.isArray(data) || data.length === 0 || !mounted || !shouldRender) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
        <i className="fa-solid fa-chart-line" style={{ fontSize: '48px', marginBottom: '15px' }}></i>
        <p>Cargando gráfico...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  );
};

export default SafeChart;