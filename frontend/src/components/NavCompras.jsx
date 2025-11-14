import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NavUsuarios() {
  const [puedeVerOrdenes, setPuedeVerOrdenes] = useState(false);
  const [puedeRegistrarCompras, setPuedeRegistrarCompras] = useState(false);
  const [puedeVerProveedores, setPuedeVerProveedores] = useState(false);
  const [puedeVerHCompras, setPuedeVerHCompras] = useState(false);
  const [puedeVerReportesCompras, setPuedeVerReportesCompras] = useState(false);
  
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const usuario = JSON.parse(storedUser);
      if (usuario.permissions) {
        setPuedeVerOrdenes(usuario.permissions.includes('ordenesCompra.ver'));
        setPuedeRegistrarCompras(usuario.permissions.includes('compras.crear'));
        setPuedeVerHCompras(usuario.permissions.includes('hcompras.ver'));
        setPuedeVerProveedores(usuario.permissions.includes('proveedores.ver'));
        setPuedeVerReportesCompras(usuario.permissions.includes('reportesCompras.ver'));
      }
    }
  }, []);

  return (
    <div>
      <h2>Compras</h2>
      <div className="nav-modulo-wrapper">
        <nav className="nav-modulo" id="usuarios-nav">
          {puedeVerOrdenes && (
            <Link
              to="/OrdenCompra"
              className={
                location.pathname === '/OrdenCompra' ? 'nav-item active' : 'nav-item'
              }
            >
                Orden de compras
            </Link>
          )}
          {puedeVerHCompras && (
            <Link
              to="/HistorialCompras"
              className={
                location.pathname === '/HistorialCompras' ? 'nav-item active' : 'nav-item'
              }
            >
                Historial de Compras
            </Link>
          )}
          {puedeVerProveedores && (
            <Link
              to="/Proveedores"
              className={
                location.pathname === '/Proveedores' ? 'nav-item active' : 'nav-item'
              }
            >
              Lista de Proveedores
            </Link>
          )}

          {puedeVerReportesCompras && (
            <Link
              to="/ReporteProveedores"
              className={
                location.pathname === '/ReporteProveedores' ? 'nav-item active' : 'nav-item'
              }
            >
                Reportes de Compras
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}