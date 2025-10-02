import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import Fijo from '../components/Fijo';
import ContenedorModuloUsuarios from '../components/ContenedorModuloUsuarios';
import ContenedorModuloCompras from '../components/ContenedorModuloCompras';
import ContenedorModuloVentas from '../components/ContenedorModuloVentas';
import ContenedorModuloProductos from '../components/ContenedorModuloProductos';


export default function Home() {
  const [puedeVerRoles, setPuedeVerRoles] = useState(false);
  const [puedeVerUsuarios, setPuedeVerUsuarios] = useState(false);
  const [puedeVerProveedores, setPuedeVerProveedores] = useState(false);
  const [puedeVerHCompras, setPuedeVerHCompras] = useState(false);
  const [puedeVerCategorias, setPuedeVerCategorias] = useState(false);
  const [puedeVerSubcategorias, setPuedeVerSubcategorias] = useState(false);
  const [puedeVerProductos, setPuedeVerProductos] = useState(false);
  const [puedeVerReportesProductos, setPuedeVerReportesProductos] = useState(false);
  const [puedeRegistrarCotizacion, setPuedeRegistrarCotizacion] = useState(false);
  const [puedeVerCotizaciones, setPuedeVerCotizaciones] = useState(false);
  const [puedeVerVentasAgendadas, setPuedeVerVentasAgendadas] = useState(false);
  const [puedeVerPedidosDespachados, setPuedeVerPedidosDespachados] = useState(false);
  const [puedeVerPedidosEntregados, setPuedeVerPedidosEntregados] = useState(false);
  const [puedeVerPedidosCancelados, setPuedeVerPedidosCancelados] = useState(false);
  const [puedeVerPedidosDevueltos, setPuedeVerPedidosDevueltos] = useState(false);
  const [puedeVerListaDeVentas, setPuedeVerListaDeVentas] = useState(false);
  const [puedeVerListaDeClientes, setPuedeVerListaDeClientes] = useState(false);
  const [puedeVerProspectos, setPuedeVerProspectos] = useState(false);
  const [puedeVerReportesVentas, setPuedeVerReportesVentas] = useState(false);
  const [puedeVerOrdenes, setPuedeVerOrdenes] = useState(false);

  // Estado UI para mostrar/ocultar contenedores debajo de las tarjetas
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false);
  const [mostrarCompras, setMostrarCompras] = useState(false);
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [mostrarVentas, setMostrarVentas] = useState(false);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('user'));
    if (usuario && usuario.permissions) {
      setPuedeVerRoles(usuario.permissions.includes('roles.ver'));
      setPuedeVerUsuarios(usuario.permissions.includes('usuarios.ver'));
      setPuedeVerProveedores(usuario.permissions.includes('proveedores.ver'));
      setPuedeVerHCompras(usuario.permissions.includes('hcompras.ver'));
      setPuedeVerCategorias(usuario.permissions.includes('categorias.ver'));
      setPuedeVerSubcategorias(usuario.permissions.includes('subcategorias.ver'));
      setPuedeVerProductos(usuario.permissions.includes('productos.ver'));
      setPuedeVerReportesProductos(usuario.permissions.includes('reportesProductos.ver'));
      setPuedeRegistrarCotizacion(usuario.permissions.includes('cotizaciones.crear'));
      setPuedeVerCotizaciones(usuario.permissions.includes('cotizaciones.ver'));
      setPuedeVerVentasAgendadas(usuario.permissions.includes('pedidosAgendados.ver'));
      setPuedeVerPedidosDespachados(usuario.permissions.includes('pedidosDespachados.ver'));
      setPuedeVerPedidosEntregados(usuario.permissions.includes('pedidosEntregados.ver'));
      setPuedeVerPedidosCancelados(usuario.permissions.includes('pedidosCancelados.ver'));
      setPuedeVerPedidosDevueltos(usuario.permissions.includes('pedidosDevueltos.ver'));
      setPuedeVerListaDeVentas(usuario.permissions.includes('listaDeVentas.ver'));
      setPuedeVerListaDeClientes(usuario.permissions.includes('clientes.ver'));
      setPuedeVerProspectos(usuario.permissions.includes('prospectos.ver'));
      setPuedeVerReportesVentas(usuario.permissions.includes('reportesVentas.ver'));
      setPuedeVerOrdenes(usuario.permissions.includes('ordenesCompra.ver'));
    }
  }, []);

  const usuarioActual = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  // Configuración de tarjetas del dashboard (se renderizan solo si el usuario tiene permisos del grupo)
  const tarjetas = useMemo(() => {
    const list = [];
    const puedeUsuarios = (puedeVerRoles || puedeVerUsuarios);
    const puedeCompras = (puedeVerProveedores || puedeVerHCompras);
    const puedeProductosGrupo = (puedeVerCategorias || puedeVerSubcategorias || puedeVerProductos || puedeVerReportesProductos);
    const puedeVentasGrupo = (
      puedeRegistrarCotizacion || puedeVerCotizaciones || puedeVerListaDeClientes || puedeVerListaDeVentas ||
      puedeVerPedidosCancelados || puedeVerPedidosDespachados || puedeVerPedidosDevueltos || puedeVerPedidosEntregados ||
      puedeVerProspectos || puedeVerReportesVentas || puedeVerVentasAgendadas
    );

    if (puedeUsuarios) {
      list.push({
        id: 'usuarios',
        titulo: 'Usuarios y Roles',
        desc: 'Administra roles, permisos y usuarios del sistema.',
        icono: '👥',
        onClick: () => setMostrarUsuarios(v => !v),
      });
    }
    if (puedeCompras) {
      list.push({
        id: 'compras',
        titulo: 'Compras y Proveedores',
        desc: 'Gestiona proveedores y el historial de compras.',
        icono: '🧾',
        onClick: () => setMostrarCompras(v => !v),
      });
    }
    if (puedeProductosGrupo) {
      list.push({
        id: 'productos',
        titulo: 'Productos y Catálogo',
        desc: 'Categorías, subcategorías, productos y reportes.',
        icono: '📦',
        onClick: () => setMostrarProductos(v => !v),
      });
    }
    if (puedeVentasGrupo) {
      list.push({
        id: 'ventas',
        titulo: 'Ventas y Operaciones',
        desc: 'Cotizaciones, pedidos y seguimiento de ventas.',
        icono: '📊',
        onClick: () => setMostrarVentas(v => !v),
      });
    }
    return list;
  }, [
    puedeVerRoles, puedeVerUsuarios,
    puedeVerProveedores, puedeVerHCompras,
    puedeVerCategorias, puedeVerSubcategorias, puedeVerProductos, puedeVerReportesProductos,
    puedeRegistrarCotizacion, puedeVerCotizaciones, puedeVerListaDeClientes, puedeVerListaDeVentas,
    puedeVerPedidosCancelados, puedeVerPedidosDespachados, puedeVerPedidosDevueltos, puedeVerPedidosEntregados,
    puedeVerProspectos, puedeVerReportesVentas, puedeVerVentasAgendadas
  ]);
  return (
    <div>
      <Fijo />
      <div className="content">
        <div className="max-width">
          {/* Hero de bienvenida */}
          <div style={{ marginBottom: '1rem' }}>
            <div
              className="p-4"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 12,
                border: '1px solid  #2c3e50',
                color: '#969696ff',
              }}
            >
              <div>
                <h1 className="text-3xl" style={{ marginBottom: 6 }}>Hola{usuarioActual?.firstName ? `, ${usuarioActual?.firstName}` : ''}</h1>
                <p className="text-sm" style={{ opacity: 0.9 }}>
                  Explora rápidamente los módulos disponibles según tus permisos.
                </p>
              </div>
              <div aria-hidden>
                <span style={{ fontSize: 42 }}>🚀</span>
              </div>
            </div>
          </div>

          {/* Tarjetas del dashboard */}
          <div className="max-width" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
          }}>
            {tarjetas.map((t) => (
              <div key={t.id} className="p-4" style={{ borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span aria-hidden style={{ fontSize: 28 }}>{t.icono}</span>
                  <h3 style={{ margin: 0 }}>{t.titulo}</h3>
                </div>
                <p className="text-sm" style={{ marginBottom: 12 }}>{t.desc}</p>
                <button className="btn-modern btn-edit" onClick={t.onClick}>
                  Abrir módulo
                </button>
              </div>
            ))}
          </div>

          {/* Contenido expandible de módulos (reutiliza contenedores existentes) */}
          <div className="max-width" style={{ marginTop: '1.5rem' }}>
            {mostrarUsuarios && (puedeVerRoles || puedeVerUsuarios) && (
              <div style={{ marginBottom: '1rem' }}>
                <ContenedorModuloUsuarios />
              </div>
            )}
            <br />
            {mostrarCompras && (puedeVerOrdenes || puedeVerProveedores || puedeVerHCompras) && (
              <div style={{ marginBottom: '1rem' }}>
                <ContenedorModuloCompras />
              </div>
            )}

            {mostrarProductos && (puedeVerCategorias || puedeVerSubcategorias || puedeVerProductos || puedeVerReportesProductos) && (
              <div style={{ marginBottom: '1rem' }}>
                <ContenedorModuloProductos />
              </div>
            )}

            {mostrarVentas && (puedeRegistrarCotizacion || puedeVerCotizaciones || puedeVerListaDeClientes || puedeVerListaDeVentas || puedeVerPedidosCancelados || puedeVerPedidosDespachados || puedeVerPedidosDevueltos || puedeVerPedidosEntregados || puedeVerProspectos || puedeVerReportesVentas || puedeVerVentasAgendadas) && (
              <div style={{ marginBottom: '1rem' }}>
                <ContenedorModuloVentas />
              </div>
            )}
          </div>

        </div>
        
      </div>
      <div className="custom-footer">
          <p className="custom-footer-text">
            © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
          </p>
        </div>
    </div>
  );
}

