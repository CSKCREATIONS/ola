import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import '../styles/home.css';
import Fijo from '../components/Fijo';

// Hook de permisos
const usePermisos = () => {
  const [perm, setPerm] = useState({});

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user')) || {};
      const p = Array.isArray(u.permissions) ? u.permissions : [];
      const has = (c) => p.includes(c);

      setPerm({
        // Usuarios
        usuarios: has('usuarios.ver') || has('roles.ver'),
        verUsuarios: has('usuarios.ver'),
        verRoles: has('roles.ver'),

        // Compras
        compras:
          has('proveedores.ver') ||
          has('hcompras.ver') ||
          has('reportesCompras.ver') ||
          has('ordenesCompra.ver'),
        proveedores: has('proveedores.ver'),
        hcompras: has('hcompras.ver'),
        reportesCompras: has('reportesCompras.ver'),
        ordenesCompra: has('ordenesCompra.ver'),

        // Productos
        productos:
          has('productos.ver') ||
          has('categorias.ver') || 
          has('reportesProductos.ver'),
        verCategorias: has('categorias.ver'),
        
        verProductos: has('productos.ver'),
        verReportesProductos: has('reportesProductos.ver'),

        // Ventas
        ventas:
          has('cotizaciones.crear') ||
          has('cotizaciones.ver') ||
          has('clientes.ver') ||
          has('reportesVentas.ver') ||
          has('pedidosAgendados.ver') ||
          has('pedidosDespachados.ver') ||
          has('pedidosEntregados.ver') ||
          has('pedidosCancelados.ver') ||
          has('pedidosDevueltos.ver') ||
          has('prospectos.ver') ||
          has('remisiones.ver'),
        cotCrear: has('cotizaciones.crear'),
        cotVer: has('cotizaciones.ver'),
        pedidosAg: has('pedidosAgendados.ver'),
        pedidosDesp: has('pedidosDespachados.ver'),
        pedidosEnt: has('pedidosEntregados.ver'),
        pedidosCanc: has('pedidosCancelados.ver'),
        pedidosDev: has('pedidosDevueltos.ver'),
        clientes: has('clientes.ver'),
        prospectos: has('prospectos.ver'),
        reportesVentas: has('reportesVentas.ver'),
        remisiones: has('remisiones.ver')
      });
    } catch { }
  }, []);

  return perm;
};

// Hook para stats por módulo
const useModuleStats = (permisos) => {
  return useMemo(() => {
    const groups = {
      usuarios: ['verUsuarios', 'verRoles'],
      compras: ['ordenesCompra', 'hcompras', 'proveedores', 'reportesCompras'],
      productos: ['verCategorias', 'verProductos', 'verReportesProductos'],
      ventas: [
        'cotCrear',
        'cotVer',
        'pedidosAg',
        'pedidosDesp',
        'pedidosEnt',
        'pedidosCanc',
        'pedidosDev',
        'clientes',
        'prospectos',
        'reportesVentas',
        'remisiones'
      ]
    };

    const stats = Object.keys(groups).reduce((acc, key) => {
      acc[key] = groups[key].reduce((count, permKey) => count + (permisos[permKey] ? 1 : 0), 0);
      return acc;
    }, { usuarios: 0, compras: 0, productos: 0, ventas: 0 });

    return stats;
  }, [permisos]);
};

export default function Home() {
  const permisos = usePermisos();
  const moduleStats = useModuleStats(permisos);

  const usuario = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  // Determina altura de tarjeta
  const getCardHeight = (linksCount) => {
    if (linksCount > 8) return 'tall';
    if (linksCount > 4) return 'medium';
    return 'short';
  };

  // Componentes con acceso rápido
  const renderGrid = (children) => (
    <div className="quick-access-grid">{children}</div>
  );

  const modulos = useMemo(() => {
    const mods = [
      permisos.usuarios && {
        id: 'usuarios',
        icon: '👥',
        titulo: 'Módulo Usuarios ',
        subtitulo: 'Administración de cuentas y roles',
        componente: renderGrid(
          <>
            {permisos.verUsuarios && (
              <Link to="/ListaDeUsuarios" className="quick-access-btn">
                <span className="quick-access-icon">👥</span>
                <span>Lista de usuarios</span>
              </Link>
            )}
            {permisos.verRoles && (
              <Link to="/RolesYPermisos" className="quick-access-btn">
                <span className="quick-access-icon">🛡️</span>
                <span>Roles y permisos</span>
              </Link>
            )}
          </>
        ),
        linksCount: permisos.verUsuarios + permisos.verRoles
      },

      permisos.compras && {
        id: 'compras',
        icon: '🧾',
        titulo: 'Módulo de Compras ',
        subtitulo: 'Gestión de abastecimiento',
        componente: renderGrid(
          <>
            {permisos.ordenesCompra && (
              <Link to="/OrdenCompra" className="quick-access-btn">
                <span className="quick-access-icon">🧾</span>
                <span>Orden de compra</span>
              </Link>
            )}
            {permisos.hcompras && (
              <Link to="/HistorialCompras" className="quick-access-btn">
                <span className="quick-access-icon">📚</span>
                <span>Historial de compras</span>
              </Link>
            )}
            {permisos.proveedores && (
              <Link to="/Proveedores" className="quick-access-btn">
                <span className="quick-access-icon">🧑</span>
                <span>Proveedores</span>
              </Link>
            )}
            {permisos.reportesCompras && (
              <Link to="/ReporteProveedores" className="quick-access-btn">
                <span className="quick-access-icon">📈</span>
                <span>Reportes </span>
              </Link>
            )}
          </>
        ),
        linksCount: moduleStats.compras
      },

      permisos.productos && {
        id: 'productos',
        icon: '📦',
        titulo: 'Módulo de Productos',
        subtitulo: 'Gestión de inventario',
        componente: renderGrid(
          <>
            {permisos.verCategorias && (
              <Link to="/ListaDeCategorias" className="quick-access-btn">
                <span className="quick-access-icon">🗂️</span>
                <span>Categorías</span>
              </Link>
            )}
            {permisos.verProductos && (
              <Link to="/GestionProductos" className="quick-access-btn">
                <span className="quick-access-icon">📦</span>
                <span>Productos</span>
              </Link>
            )}
            {permisos.verReportesProductos && (
              <Link to="/ReporteProductos" className="quick-access-btn">
                <span className="quick-access-icon">📊</span>
                <span>Reportes</span>
              </Link>
            )}
          </>
        ),
        linksCount: moduleStats.productos
      },

      permisos.ventas && {
        id: 'ventas',
        icon: '📊',
        titulo: 'Módulo de Ventas ',
        subtitulo: 'Gestión de ventas de clientes',
        componente: renderGrid(
          <>
            {permisos.cotCrear && (
              <Link to="/RegistrarCotizacion" className="quick-access-btn">
                <span className="quick-access-icon">📝</span>
                <span>Registrar cotización</span>
              </Link>
            )}
            {permisos.cotVer && (
              <Link to="/ListaDeCotizaciones" className="quick-access-btn">
                <span className="quick-access-icon">📄</span>
                <span>Lista de cotizaciones</span>
              </Link>
            )}
            {permisos.pedidosAg && (
              <Link to="/PedidosAgendados" className="quick-access-btn">
                <span className="quick-access-icon">🗓️</span>
                <span>Pedidos agendados</span>
              </Link>
            )}
            {permisos.pedidosEnt && (
              <Link to="/PedidosEntregados" className="quick-access-btn">
                <span className="quick-access-icon">📬</span>
                <span>Pedidos entregados</span>
              </Link>
            )}
            {permisos.pedidosCanc && (
              <Link to="/PedidosCancelados" className="quick-access-btn">
                <span className="quick-access-icon">⛔</span>
                <span>Pedidos cancelados</span>
              </Link>
            )}
            {permisos.clientes && (
              <Link to="/ListaDeClientes" className="quick-access-btn">
                <span className="quick-access-icon">👤</span>
                <span>Lista de clientes</span>
              </Link>
            )}
            {permisos.prospectos && (
              <Link to="/ProspectosDeClientes" className="quick-access-btn">
                <span className="quick-access-icon">🔍</span>
                <span>Prospectos de cliente</span>
              </Link>
            )}
            {permisos.reportesVentas && (
              <Link to="/ReportessVentas" className="quick-access-btn">
                <span className="quick-access-icon">📈</span>
                <span>Reportes</span>
              </Link>
            )}
          </>
        ),
        linksCount: moduleStats.ventas
      }
    ].filter(Boolean);

    return mods.map((m) => ({
      ...m,
      heightClass: getCardHeight(m.linksCount)
    }));
  }, [permisos, moduleStats]);

  return (
    <div>
      <Fijo />

      <div className="content ">
        <div className="max-width">
          <header className="home-hero">
            <h1>Hola{usuario?.firstName ? `, ${usuario.firstName}` : ''} </h1>
            <p>
              Bienvenid@ al sistema. Estos son sus módulos disponibles.
            </p>
          </header>

          {/* Masonry Grid */}
          <div className="masonry-grid">
            {modulos.map((mod) => (
              <div key={mod.id} className={`module-card mod-${mod.id} ${mod.heightClass}`}>
                <div className="module-header">
                  <div className="module-icon">{mod.icon}</div>

                  <h2 className="module-title">
                    {mod.titulo}
                    <small>{mod.subtitulo}</small>
                  </h2>
                </div>

                {mod.componente}
              </div>
            ))}

            {modulos.length === 0 && (
              <div className="module-card tall no-permissions">
                <p>Solicita a un administrador que te asigne permisos para comenzar.</p>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Footer ya manejado desde App.css */}
      <div className="custom-footer">
        <p className="custom-footer-text">
          © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
