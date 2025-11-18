import React, { useEffect, useRef, useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';

export default function NavCompras() {
  const containerRef = useRef(null);
  const [visibleLinks, setVisibleLinks] = useState([]);
  const [overflowLinks, setOverflowLinks] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [puedeVerOrdenes, setPuedeVerOrdenes] = useState(false);
  const [puedeVerProveedores, setPuedeVerProveedores] = useState(false);
  const [puedeVerHCompras, setPuedeVerHCompras] = useState(false);
  const [puedeVerReportesCompras, setPuedeVerReportesCompras] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const usuario = JSON.parse(storedUser);
      if (usuario.permissions) {
        setPuedeVerOrdenes(usuario.permissions.includes('ordenesCompra.ver'));
        setPuedeVerHCompras(usuario.permissions.includes('hcompras.ver'));
        setPuedeVerProveedores(usuario.permissions.includes('proveedores.ver'));
        setPuedeVerReportesCompras(usuario.permissions.includes('reportesCompras.ver'));
      }
    }
  }, []);

  const allLinks = useMemo(() => [
    { path: '/OrdenCompra', label: 'Orden de compras', visible: puedeVerOrdenes },
    { path: '/HistorialCompras', label: 'Historial de Compras', visible: puedeVerHCompras },
    { path: '/Proveedores', label: 'Lista de Proveedores', visible: puedeVerProveedores },
    { path: '/ReporteProveedores', label: 'Reportes', visible: puedeVerReportesCompras }
  ], [puedeVerOrdenes, puedeVerHCompras, puedeVerProveedores, puedeVerReportesCompras]);

  const filteredLinks = useMemo(() => allLinks.filter(l => l.visible), [allLinks]);

  useEffect(() => {
    const updateLayout = () => {
      const container = containerRef.current;
      if (!container) return;

      const availableWidth = container.offsetWidth;
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.visibility = 'hidden';
      tempContainer.style.height = '0';
      tempContainer.style.display = 'flex';
      tempContainer.style.gap = '0.5rem';
      tempContainer.style.top = '-9999px';
      document.body.appendChild(tempContainer);

      let usedWidth = 0;
      const visible = [];
      const hidden = [];

      try {
        for (const link of filteredLinks) {
          const el = document.createElement('div');
          el.className = 'nav-item';
          el.textContent = link.label;
          tempContainer.appendChild(el);

          const w = el.offsetWidth;
          usedWidth += w + 12; // small gap/safety

          if (usedWidth < availableWidth - 50) {
            visible.push(link);
          } else {
            hidden.push(link);
          }
        }
      } finally {
        if (tempContainer.parentNode) tempContainer.remove();
      }

      setVisibleLinks(visible);
      setOverflowLinks(hidden);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [filteredLinks, showDropdown]);

  return (
    <div className='encabezado'>
      <h2>Compras</h2>
      <div className="nav-modulo-wrapper">
        <nav className="nav-modulo" ref={containerRef}>
          {visibleLinks.map(link => (
            <NavLink key={link.path} to={link.path} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {overflowLinks.length > 0 && (
          <div className="nav-dropdown">
            <button onClick={() => setShowDropdown(!showDropdown)} className="nav-dropdown-toggle">⋯</button>
            {showDropdown && (
              <div className="nav-dropdown-menu">
                {overflowLinks.map(link => (
                  <NavLink key={link.path} to={link.path} className={({ isActive }) => isActive ? 'dropdown-item active' : 'dropdown-item'} onClick={() => setShowDropdown(false)}>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}