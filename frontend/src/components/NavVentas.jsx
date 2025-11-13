import React, { useEffect, useRef, useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';

export default function NavVentas() {
  const containerRef = useRef(null);
  const [visibleLinks, setVisibleLinks] = useState([]);
  const [overflowLinks, setOverflowLinks] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Estados de permisos individuales
  const [puedeRegistrarCotizacion, setPuedeRegistrarCotizacion] = useState(false);
  const [puedeVerCotizaciones, setPuedeVerCotizaciones] = useState(false);
  const [puedeVerVentasAgendadas, setPuedeVerVentasAgendadas] = useState(false);
  const [puedeVerPedidosEntregados, setPuedeVerPedidosEntregados] = useState(false);
  const [puedeVerPedidosCancelados, setPuedeVerPedidosCancelados] = useState(false);
  const [, setPuedeVerListaDeVentas] = useState(false);
  const [puedeVerListaDeClientes, setPuedeVerListaDeClientes] = useState(false);
  const [puedeVerProspectos, setPuedeVerProspectos] = useState(false);
  const [puedeVerReportesVentas, setPuedeVerReportesVentas] = useState(false);
  const [, setPuedeVerRemisiones] = useState(false);

  // Leer permisos desde localStorage
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('user'));
    if (usuario?.permissions) {
      setPuedeRegistrarCotizacion(usuario.permissions.includes('cotizaciones.crear'));
      setPuedeVerCotizaciones(usuario.permissions.includes('cotizaciones.ver'));
      setPuedeVerVentasAgendadas(usuario.permissions.includes('pedidosAgendados.ver'));
      setPuedeVerPedidosEntregados(usuario.permissions.includes('pedidosEntregados.ver'));
      setPuedeVerPedidosCancelados(usuario.permissions.includes('pedidosCancelados.ver'));
      setPuedeVerListaDeVentas(usuario.permissions.includes('listaDeVentas.ver'));
      setPuedeVerListaDeClientes(usuario.permissions.includes('clientes.ver'));
      setPuedeVerProspectos(usuario.permissions.includes('prospectos.ver'));
      setPuedeVerReportesVentas(usuario.permissions.includes('reportesVentas.ver'));
      setPuedeVerRemisiones(usuario.permissions.includes('remisiones.ver'));
    }
  }, []);

  // Links con su estado de permiso asociado
  const allLinks = useMemo(() => [
    { path: "/RegistrarCotizacion", label: "Registrar cotización", visible: puedeRegistrarCotizacion },
    { path: "/ListaDeCotizaciones", label: "Lista de cotizaciones", visible: puedeVerCotizaciones },
    { path: "/PedidosAgendados", label: "Pedidos agendados", visible: puedeVerVentasAgendadas },
    { path: "/PedidosCancelados", label: "Pedidos cancelados", visible: puedeVerPedidosCancelados },
    { path: "/PedidosEntregados", label: "Pedidos Entregados", visible: puedeVerPedidosEntregados },
    { path: "/ListaDeClientes", label: "Lista de clientes", visible: puedeVerListaDeClientes },
    { path: "/ProspectosDeClientes", label: "Prospectos de clientes", visible: puedeVerProspectos },
    { path: "/ReportessVentas", label: "Reportes", visible: puedeVerReportesVentas }
  ], [
    puedeRegistrarCotizacion,
    puedeVerCotizaciones,
    puedeVerVentasAgendadas,
    puedeVerPedidosEntregados,
    puedeVerPedidosCancelados,
    puedeVerListaDeClientes,
    puedeVerProspectos,
    puedeVerReportesVentas,
  ]);

  const filteredLinks = useMemo(() => allLinks.filter(link => link.visible), [allLinks]);

  // Calcular los visibles y desbordados
  useEffect(() => {
    const updateLayout = () => {
      const container = containerRef.current;
      if (!container) return;

      const availableWidth = container.offsetWidth;
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.visibility = 'hidden';
      tempContainer.style.height = 0;
      tempContainer.style.display = 'flex';
      tempContainer.style.gap = '0.5rem';
      tempContainer.style.top = '-9999px'; // Mover fuera de la vista

      document.body.appendChild(tempContainer);

      let usedWidth = 0;
      const visible = [];
      const hidden = [];

  try {
        filteredLinks.forEach((link) => {
          const linkElement = document.createElement('div');
          linkElement.className = 'nav-item';
          linkElement.textContent = link.label;
          tempContainer.appendChild(linkElement);

          const width = linkElement.offsetWidth;
          usedWidth += width + 12;

          if (usedWidth < availableWidth - 50) {
            visible.push(link);
          } else {
            hidden.push(link);
          }
        });
      } finally {
        // Asegurar que siempre se remueva el elemento temporal
        if (tempContainer.parentNode) {
          // prefer child.remove() over parent.removeChild(child)
          tempContainer.remove();
        }
      }
      setVisibleLinks(visible);
      setOverflowLinks(hidden);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [filteredLinks, showDropdown]);

  return (
    <div>
      <h2>Ventas</h2>
      <div className="nav-modulo-wrapper">
        <nav className="nav-modulo" ref={containerRef}>
          {visibleLinks.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
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
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) => isActive ? 'dropdown-item active' : 'dropdown-item'}
                    onClick={() => setShowDropdown(false)}>
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
