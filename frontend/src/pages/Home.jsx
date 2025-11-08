import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import Fijo from '../components/Fijo';

// NUEVO DISEÑO: Vista limpia, sólo saludo + secciones de módulos directamente visibles.
// Sin tarjetas clickeables, sin lista de permisos, sin fecha/hora, sin contadores.

const redesignedStyles = `
  .home-wrapper { padding: clamp(1.2rem,2vw,2rem) clamp(1rem,2vw,2rem) 4rem; }
  .home-hero { position:relative; overflow:hidden; border-radius:36px; padding: clamp(2.2rem,4vw,3.5rem) clamp(1.4rem,3vw,3.2rem); background:linear-gradient(135deg,#4f46e5,#6366f1,#8b5cf6,#ec4899); background-size:300% 300%; animation:heroGradient 12s ease-in-out infinite; color:#fff; box-shadow:0 25px 60px -22px rgba(99,102,241,.55); }
  @keyframes heroGradient { 0%{background-position:0% 50%;} 50%{background-position:100% 50%;} 100%{background-position:0% 50%;} }
  .home-hero h1 { margin:0 0 .65rem; font-size:clamp(2rem,4.2vw,3rem); letter-spacing:-1px; font-weight:800; }
  .home-hero p { margin:0; max-width:760px; font-size:clamp(.95rem,1.2vw,1.15rem); line-height:1.45; font-weight:500; opacity:.95; }
  .modules-layout { margin-top: clamp(2rem,4vw,3.5rem); display:grid; gap:38px; }
  .module-section { position:relative; background:linear-gradient(145deg,#ffffff,#f1f5f9); border:1px solid #e2e8f0; border-radius:34px; padding: clamp(1.7rem,2.4vw,2.4rem) clamp(1.4rem,2.2vw,2.2rem) clamp(1.9rem,2.6vw,2.6rem); box-shadow:0 18px 55px -20px rgba(15,23,42,.25),0 4px 8px -2px rgba(15,23,42,.08); overflow:hidden; }
  .module-section::before { content:''; position:absolute; inset:0; background:radial-gradient(circle at 18% 20%,rgba(99,102,241,.12),transparent 55%), radial-gradient(circle at 85% 75%,rgba(236,72,153,.14),transparent 60%); pointer-events:none; }
  .module-header { display:flex; align-items:center; gap:18px; margin:0 0 1.4rem; }
  .module-icon { width:68px; height:68px; flex:0 0 68px; display:grid; place-items:center; font-size:2rem; border-radius:22px; color:#fff; font-weight:600; background:linear-gradient(135deg,var(--g1),var(--g2)); box-shadow:0 10px 30px -10px var(--g1); }
  .module-title { font-size:clamp(1.15rem,1.9vw,1.6rem); margin:0; font-weight:700; letter-spacing:-.5px; color:#1e293b; display:flex; flex-direction:column; }
  .module-title small { font-size:.7rem; text-transform:uppercase; letter-spacing:2px; font-weight:600; color:#6366f1; }
  .module-body { animation:fadeUp .6s ease; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(18px);} to { opacity:1; transform:translateY(0);} }
  .section-grid-2 { display:grid; gap:32px; }
  /* Accesos rápidos estilo tarjetas para módulos internos */
  .shortcut-grid { display:grid; gap:18px; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
  .shortcut-btn { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; height:168px; border-radius:20px; background:linear-gradient(180deg, rgba(255,255,255,.65), rgba(241,245,249,.55)); border:1px solid rgba(226,232,240,.9); box-shadow:0 16px 40px -20px rgba(15,23,42,.35); transition: transform .25s ease, box-shadow .25s ease; overflow:hidden; }
  .shortcut-btn::after{ content:''; position:absolute; inset:0; background: radial-gradient(circle at 20% 15%, rgba(255,255,255,.65), transparent 45%), radial-gradient(circle at 80% 85%, rgba(255,255,255,.35), transparent 55%); pointer-events:none; }
  .shortcut-btn:hover { transform: translateY(-6px); box-shadow:0 22px 55px -20px rgba(99,102,241,.45); }
  .shortcut-icon { width:78px; height:78px; border-radius:22px; display:grid; place-items:center; font-size:1.65rem; color:#fff; background:linear-gradient(135deg, var(--c1,#6366f1), var(--c2,#4338ca)); box-shadow:0 12px 28px -14px var(--c1,#6366f1); }
  .shortcut-btn span { font-size:.95rem; font-weight:700; color:#1f2937; text-align:center; letter-spacing:.2px; }
  /* Responsive auto columns for internal module content wrappers if they use flex/columns */
  @media (min-width:1200px){ .section-grid-2 { grid-template-columns:1fr; } }
  @media (max-width:920px){ .home-hero { text-align:center; } .module-section { padding:1.6rem 1.3rem 2.1rem; border-radius:26px; } }
  @media (max-width:620px){ .module-header { flex-direction:row; align-items:flex-start; } .module-icon { width:60px; height:60px; font-size:1.6rem; } }
`;

if (typeof document !== 'undefined' && !document.getElementById('home-redesigned-styles')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'home-redesigned-styles';
  styleTag.textContent = redesignedStyles;
  document.head.appendChild(styleTag);
}

// Hook para detectar permisos y decidir qué secciones mostrar
const usePermisos = () => {
  const [perm, setPerm] = useState({});
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user')) || {};
      const p = Array.isArray(u.permissions) ? u.permissions : [];
      const has = (c) => p.includes(c);
      // Compras
      const proveedores = has('proveedores.ver');
      const hcompras = has('hcompras.ver');
      const reportesCompras = has('reportesCompras.ver');
      const ordenesCompra = has('ordenesCompra.ver');
      // Usuarios
      const verUsuarios = has('usuarios.ver');
      const verRoles = has('roles.ver');
      // Productos
      const verCategorias = has('categorias.ver');
      const verSubcategorias = has('subcategorias.ver');
      const verProductos = has('productos.ver');
      const verReportesProductos = has('reportesProductos.ver');
      // Ventas
      const cotCrear = has('cotizaciones.crear');
      const cotVer = has('cotizaciones.ver');
      const pedidosAg = has('pedidosAgendados.ver');
      const pedidosDesp = has('pedidosDespachados.ver');
      const pedidosEnt = has('pedidosEntregados.ver');
      const pedidosCanc = has('pedidosCancelados.ver');
      const pedidosDev = has('pedidosDevueltos.ver');
      const clientes = has('clientes.ver');
      const prospectos = has('prospectos.ver');
      const reportesVentas = has('reportesVentas.ver');
      const remisiones = has('remisiones.ver');
      setPerm({
        // Usuarios
        usuarios: verUsuarios || verRoles,
        verUsuarios,
        verRoles,
        // Compras breakdown
        compras: proveedores || hcompras || reportesCompras || ordenesCompra,
        proveedores,
        hcompras,
        reportesCompras,
        ordenesCompra,
        // Productos y Ventas
        productos: verProductos || verCategorias || verSubcategorias || verReportesProductos,
        verCategorias,
        verSubcategorias,
        verProductos,
        verReportesProductos,
        ventas: cotVer || cotCrear || clientes || reportesVentas || pedidosAg || pedidosDesp || pedidosEnt || pedidosCanc || pedidosDev || prospectos || remisiones,
        cotCrear,
        cotVer,
        pedidosAg,
        pedidosDesp,
        pedidosEnt,
        pedidosCanc,
        pedidosDev,
        clientes,
        prospectos,
        reportesVentas,
        remisiones
      });
    } catch { /* ignore */ }
  }, []);
  return perm;
};

export default function Home() {
  const permisos = usePermisos();
  const usuario = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
  }, []);

  // Render de accesos rápidos de Compras (lógica migrada desde ContenedorModuloCompras.jsx)
  const renderCompras = () => (
    <section className="section-grid-2">
      <div className="shortcut-grid">
        {permisos.ordenesCompra && (
          <Link to="/OrdenCompra">
            <button className="shortcut-btn" title="Orden de compra" style={{ '--c1':'#0ea5e9','--c2':'#0369a1' }}>
              <div className="shortcut-icon">🧾</div>
              <span>Orden de compra</span>
            </button>
          </Link>
        )}
        {permisos.hcompras && (
          <Link to="/HistorialCompras">
            <button className="shortcut-btn" title="Historial de compras" style={{ '--c1':'#38bdf8','--c2':'#0284c7' }}>
              <div className="shortcut-icon">📚</div>
              <span>Historial de compras</span>
            </button>
          </Link>
        )}
        {permisos.proveedores && (
          <Link to="/Proveedores">
            <button className="shortcut-btn" title="Catálogo de proveedores" style={{ '--c1':'#06b6d4','--c2':'#0e7490' }}>
              <div className="shortcut-icon">🧑‍💼</div>
              <span>Catálogo de proveedores</span>
            </button>
          </Link>
        )}
        {permisos.reportesCompras && (
          <Link to="/ReporteProveedores">
            <button className="shortcut-btn" title="Reportes de compras" style={{ '--c1':'#22d3ee','--c2':'#0891b2' }}>
              <div className="shortcut-icon">📈</div>
              <span>Reportes de compras</span>
            </button>
          </Link>
        )}
      </div>
    </section>
  );

  // Render de accesos rápidos de Usuarios
  const renderUsuarios = () => (
    <section className="section-grid-2">
      <div className="shortcut-grid">
        {permisos.verUsuarios && (
          <Link to="/ListaDeUsuarios">
            <button className="shortcut-btn" title="Lista de usuarios" style={{ '--c1':'#6366f1','--c2':'#4338ca' }}>
              <div className="shortcut-icon">👥</div>
              <span>Lista de usuarios</span>
            </button>
          </Link>
        )}
        {permisos.verRoles && (
          <Link to="/RolesYPermisos">
            <button className="shortcut-btn" title="Roles y permisos" style={{ '--c1':'#4f46e5','--c2':'#7c3aed' }}>
              <div className="shortcut-icon">🛡️</div>
              <span>Roles y permisos</span>
            </button>
          </Link>
        )}
      </div>
    </section>
  );

  // Render de accesos rápidos de Productos
  const renderProductos = () => (
    <section className="section-grid-2">
      <div className="shortcut-grid">
        {permisos.verCategorias && (
          <Link to="/ListaDeCategorias">
            <button className="shortcut-btn" title="Categorías" style={{ '--c1':'#10b981','--c2':'#047857' }}>
              <div className="shortcut-icon">🗂️</div>
              <span>Categorías</span>
            </button>
          </Link>
        )}
        {permisos.verSubcategorias && (
          <Link to="/subcategorias">
            <button className="shortcut-btn" title="Subcategorías" style={{ '--c1':'#0d9488','--c2':'#115e59' }}>
              <div className="shortcut-icon">📁</div>
              <span>Subcategorías</span>
            </button>
          </Link>
        )}
        {permisos.verProductos && (
          <Link to="/GestionProductos">
            <button className="shortcut-btn" title="Productos" style={{ '--c1':'#059669','--c2':'#065f46' }}>
              <div className="shortcut-icon">📦</div>
              <span>Productos</span>
            </button>
          </Link>
        )}
        {permisos.verReportesProductos && (
          <Link to="/ReporteProductos">
            <button className="shortcut-btn" title="Reportes productos" style={{ '--c1':'#34d399','--c2':'#10b981' }}>
              <div className="shortcut-icon">📊</div>
              <span>Reportes productos</span>
            </button>
          </Link>
        )}
      </div>
    </section>
  );

  // Render de accesos rápidos de Ventas
  const renderVentas = () => (
    <section className="section-grid-2">
      <div className="shortcut-grid">
        {permisos.cotCrear && (
          <Link to="/RegistrarCotizacion">
            <button className="shortcut-btn" title="Registrar cotización" style={{ '--c1':'#f43f5e','--c2':'#be123c' }}>
              <div className="shortcut-icon">📝</div>
              <span>Registrar cotización</span>
            </button>
          </Link>
        )}
        {permisos.cotVer && (
          <Link to="/ListaDeCotizaciones">
            <button className="shortcut-btn" title="Lista de cotizaciones" style={{ '--c1':'#fb7185','--c2':'#e11d48' }}>
              <div className="shortcut-icon">📄</div>
              <span>Lista de cotizaciones</span>
            </button>
          </Link>
        )}
        {permisos.pedidosAg && (
          <Link to="/PedidosAgendados">
            <button className="shortcut-btn" title="Pedidos agendados" style={{ '--c1':'#f97316','--c2':'#c2410c' }}>
              <div className="shortcut-icon">🗓️</div>
              <span>Pedidos agendados</span>
            </button>
          </Link>
        )}
        {permisos.pedidosEnt && (
          <Link to="/PedidosEntregados">
            <button className="shortcut-btn" title="Pedidos entregados" style={{ '--c1':'#22c55e','--c2':'#15803d' }}>
              <div className="shortcut-icon">📬</div>
              <span>Pedidos entregados</span>
            </button>
          </Link>
        )}
        {permisos.pedidosCanc && (
          <Link to="/PedidosCancelados">
            <button className="shortcut-btn" title="Pedidos cancelados" style={{ '--c1':'#ef4444','--c2':'#b91c1c' }}>
              <div className="shortcut-icon">⛔</div>
              <span>Pedidos cancelados</span>
            </button>
          </Link>
        )}
        {permisos.remisiones && (
          <Link to="/ListaDeRemisiones">
            <button className="shortcut-btn" title="Lista de remisiones" style={{ '--c1':'#3b82f6','--c2':'#1d4ed8' }}>
              <div className="shortcut-icon">🚚</div>
              <span>Lista de remisiones</span>
            </button>
          </Link>
        )}
        {permisos.clientes && (
          <Link to="/ListaDeClientes">
            <button className="shortcut-btn" title="Lista de clientes" style={{ '--c1':'#8b5cf6','--c2':'#6d28d9' }}>
              <div className="shortcut-icon">👤</div>
              <span>Lista de clientes</span>
            </button>
          </Link>
        )}
        {permisos.prospectos && (
          <Link to="/ProspectosDeClientes">
            <button className="shortcut-btn" title="Prospectos de cliente" style={{ '--c1':'#14b8a6','--c2':'#0d9488' }}>
              <div className="shortcut-icon">🔍</div>
              <span>Prospectos de cliente</span>
            </button>
          </Link>
        )}
        {permisos.reportesVentas && (
          <Link to="/ReportessVentas">
            <button className="shortcut-btn" title="Reportes" style={{ '--c1':'#f59e0b','--c2':'#d97706' }}>
              <div className="shortcut-icon">📈</div>
              <span>Reportes</span>
            </button>
          </Link>
        )}
      </div>
    </section>
  );

  // Configuración declarativa de secciones (todas visibles si el permiso aplica)
  const secciones = useMemo(() => [
    permisos.usuarios && { id: 'usuarios', icon: '👥', g1: '#6366f1', g2: '#4338ca', titulo: 'Usuarios & Roles', subtitulo: 'Administración de cuentas y roles', componente: renderUsuarios() },
    permisos.compras && { id: 'compras', icon: '🧾', g1: '#0ea5e9', g2: '#0369a1', titulo: 'Compras & Proveedores', subtitulo: 'Gestión de abastecimiento', componente: renderCompras() },
    permisos.productos && { id: 'productos', icon: '📦', g1: '#10b981', g2: '#047857', titulo: 'Catálogo de Productos', subtitulo: 'Estructura y stock', componente: renderProductos() },
    permisos.ventas && { id: 'ventas', icon: '📊', g1: '#f59e0b', g2: '#d97706', titulo: 'Ventas & Operaciones', subtitulo: 'Flujo comercial', componente: renderVentas() }
  ].filter(Boolean), [permisos]);

  return (
    <div>
      <Fijo />
      <div className="content home-wrapper">
        <header className="home-hero">
          <h1>Hola{usuario?.firstName ? `, ${usuario.firstName}` : ''} 👋</h1>
          <p>Te damos la bienvenida a tu espacio de trabajo. Accede directamente a cada área; todo está desplegado para que avances sin pasos extra.</p>
        </header>

        <main className="modules-layout">
          {secciones.map(s => (
            <section key={s.id} className="module-section" style={{ '--g1': s.g1, '--g2': s.g2 }} id={`mod-${s.id}`}>
              <div className="module-header">
                <div className="module-icon" aria-hidden>{s.icon}</div>
                <h2 className="module-title">{s.titulo}<small>{s.subtitulo}</small></h2>
              </div>
              <div className="module-body">
                {s.componente}
              </div>
            </section>
          ))}

          {secciones.length === 0 && (
            <div style={{ textAlign:'center', padding:'90px 30px', border:'2px dashed #cbd5e1', borderRadius:32, background:'linear-gradient(145deg,#ffffff,#f8fafc)' }}>
              <h3 style={{ margin:0, fontSize:'1.6rem', color:'#334155' }}>No tienes módulos disponibles</h3>
              <p style={{ margin:'12px 0 0', color:'#64748b', fontWeight:500 }}>Solicita a un administrador que te asigne permisos para comenzar.</p>
            </div>
          )}
        </main>
      </div>
      <div className="custom-footer">
        <p className="custom-footer-text">© 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}

