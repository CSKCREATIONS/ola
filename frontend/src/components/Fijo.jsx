/* global globalThis */
import React, { useEffect, useState } from 'react';
import '../App.css';
import '../styles/Fijo.css';
import { Link, useNavigate } from 'react-router-dom';
import { mostrarMenu, toggleSubMenu, cerrarMenu } from '../funciones/animaciones.js';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';

/**
 * Resolve a user's role when the stored user has role as a string (id or name).
 * Tries GET /api/roles/:id first if the string looks like an ObjectId. If that
 * fails or returns nothing, and the current user has permission to list roles,
 * tries GET /api/roles and matches by name.
 * On success, writes the resolved role object back into localStorage.
 * Returns the possibly-updated user object.
 */
export async function resolveRoleForUser(usuario) {
  // Quick guard: nothing to do for missing/non-string role
  if (typeof usuario?.role !== 'string') return usuario;

  const roleStr = String(usuario.role);
  const looksLikeObjectId = /^[0-9a-fA-F]{24}$/.test(roleStr);

  // Helper: try to get role by id. Returns role object, null, or { forbidden: true }
  const getRoleById = async (id) => {
    try {
      const res = await api.get(`/api/roles/${id}`);
      const d = res.data || res;
      return d.role || d.data || (Array.isArray(d) ? d[0] : null);
    } catch (err) {
      if (err?.response?.status === 403) return { forbidden: true };
      // Log and return null for 404 or other errors
      console.debug('getRoleById error:', err?.response ? { status: err.response.status, data: err.response.data } : err);
      return null;
    }
  };

  // Helper: list roles and find by name (case-insensitive)
  const listAndFindRole = async (name) => {
    try {
      const res = await api.get('/api/roles');
      const d = res.data || res;
      const arr = Array.isArray(d) ? d : (d.data || []);
      return arr.find(r => r.name === name || (r.name && r.name.toLowerCase() === name.toLowerCase())) || null;
    } catch (err) {
      console.debug('listAndFindRole error:', err?.response ? { status: err.response.status, data: err.response.data } : err);
      return null;
    }
  };

  try {
    let roleObj = null;
    let forbidden = false;

    if (looksLikeObjectId) {
      const byId = await getRoleById(roleStr);
      if (byId?.forbidden) forbidden = true;
      else if (byId) roleObj = byId;
    }

    const canListRoles = Array.isArray(usuario.permissions) && usuario.permissions.includes('roles.ver');
    if (!roleObj && !forbidden && canListRoles) {
      roleObj = await listAndFindRole(roleStr);
    }

    if (roleObj) {
      usuario.role = roleObj;
      try {
        localStorage.setItem('user', JSON.stringify(usuario));
      } catch (error_) {
        console.error('Failed to save user to localStorage:', error_);
      }
    }
  } catch (error_) {
    console.error('resolveRoleForUser error:', error_);
  }

  return usuario;
}




export default function Fijo() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [puedeVerRoles, setPuedeVerRoles] = useState(false);
  const [puedeVerUsuarios, setPuedeVerUsuarios] = useState(false);
  const [puedeGenerarOrden, setPuedeGenerarOrden] = useState(false);
  const [puedeVerOrdenes, setPuedeVerOrdenes] = useState(false);
  const [puedeVerProveedores, setPuedeVerProveedores] = useState(false);
  const [puedeVerHCompras, setPuedeVerHCompras] = useState(false);
  const [puedeVerReportesCompras, setPuedeVerReportesCompras] = useState(false);
  const [puedeVerCategorias, setPuedeVerCategorias] = useState(false);
  const [puedeVerSubcategorias, setPuedeVerSubcategorias] = useState(false);
  const [puedeVerProductos, setPuedeVerProductos] = useState(false);
  const [puedeVerReportesProductos, setPuedeVerReportesProductos] = useState(false);
  const [puedeRegistrarCotizacion, setPuedeRegistrarCotizacion] = useState(false);
  const [puedeVerCotizaciones, setPuedeVerCotizaciones] = useState(false);
  const [puedeVerVentasAgendadas, setPuedeVerVentasAgendadas] = useState(false);
  const [puedeVerPedidosEntregados, setPuedeVerPedidosEntregados] = useState(false);
  const [puedeVerPedidosCancelados, setPuedeVerPedidosCancelados] = useState(false);
  const [puedeVerPedidosDevueltos, setPuedeVerPedidosDevueltos] = useState(false);
  const [puedeVerListaDeClientes, setPuedeVerListaDeClientes] = useState(false);
  const [puedeVerProspectos, setPuedeVerProspectos] = useState(false);
  const [puedeVerReportesVentas, setPuedeVerReportesVentas] = useState(false);

  useEffect(() => {
    // 1. Cargar datos del usuario y permisos
    const loadUserAndPermissions = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      let usuario = JSON.parse(storedUser);

      // Resolver role si está como string (id o nombre)
      usuario = await resolveRoleForUser(usuario);

      setUser(usuario);

      const permissions = usuario.permissions || [];
      const has = (perm) => permissions.includes(perm);

      setPuedeVerUsuarios(has('usuarios.ver'));
      setPuedeVerRoles(has('roles.ver'));
      setPuedeGenerarOrden(has('ordenes.generar'));
      setPuedeGenerarOrden(has('ordenes.generar'));
      setPuedeVerOrdenes(has('ordenesCompra.ver'));
      setPuedeVerHCompras(has('hcompras.ver'));
      setPuedeVerProveedores(has('proveedores.ver'));
      setPuedeVerReportesCompras(has('reportesCompras.ver'));
      setPuedeVerCategorias(has('categorias.ver'));
      setPuedeVerSubcategorias(has('subcategorias.ver'));
      setPuedeVerProductos(has('productos.ver'));
      setPuedeVerReportesProductos(has('reportesProductos.ver'));
      setPuedeRegistrarCotizacion(has('cotizaciones.crear'));
      setPuedeVerCotizaciones(has('cotizaciones.ver'));
      setPuedeVerVentasAgendadas(has('pedidosAgendados.ver'));
      setPuedeVerPedidosEntregados(has('pedidosEntregados.ver'));
      setPuedeVerPedidosCancelados(has('pedidosCancelados.ver'));
      setPuedeVerPedidosDevueltos(has('pedidosDevueltos.ver'));
      setPuedeVerListaDeClientes(has('clientes.ver'));
      setPuedeVerProspectos(has('prospectos.ver'));
      setPuedeVerReportesVentas(has('reportesVentas.ver'));
    };

    // Cargar datos iniciales
    loadUserAndPermissions();

    // 2. Configurar evento para cambios en localStorage
    const handleStorageChange = () => {
      loadUserAndPermissions();
    };
    globalThis.addEventListener('storage', handleStorageChange);

    // 3. Manejar click fuera del menú (código original preservado)
    const handleClickOutside = (event) => {
      const menu = document.getElementById('menu');
      const btnMenu = document.getElementById('btn-menu');

      if (menu.classList.contains('mostrar-menu') &&
        !menu.contains(event.target) &&
        !btnMenu.contains(event.target)) {
        cerrarMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);

    // Cleanup
    return () => {
      globalThis.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleClick = async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Seguro que quieres cerrar sesión?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      //remueve el token
      localStorage.removeItem('token');
      //quita el logueo del usuario
      localStorage.removeItem('user');

      //redirige al login
      navigate('/');
    }
  };
  return (
    <div className="fijo">
      <header className='header'>
        <div className="izquierda">
          <button onClick={(e) => {
            e.stopPropagation();
            mostrarMenu();
          }} id="btn-menu">
            <div className="palito"></div>
            <div className="palito"></div>
            <div className="palito"></div>
          </button>
          <Link as={Link} to='/Home' className='empresa-nombre'>

            JLA Global Company
          </Link>
        </div>
        <div className="user">
          {user && (
            <Link as={Link} to="/Perfil" className="user-link">
              <span >{user.firstName}</span>
            </Link>
          )}
          <Link as={Link} to="/Perfil" >
            <img
              src="https://cdn-icons-png.freepik.com/256/17740/17740782.png?ga=GA1.1.755740385.1744083497&semt=ais_hybrid"
              alt="Perfil"
              className='user-icon'
            />
          </Link>
        </div>
      </header>

      <div id='menu' className="menu">
        <Link as={Link} to="/Perfil" className="preview-usuario">
          <img
            src="https://cdn-icons-png.freepik.com/256/17740/17740782.png?ga=GA1.1.755740385.1744083497&semt=ais_hybrid"
            alt="Perfil"
            className="preview-usuario-img"
          />
          <div className="datos-usuario">
            {user && (
              <span className="usuario-nombre">{user.firstName} {user.surname}</span>
            )}
            <br />
            {user && (
              <span className="usuario-rol">
                {typeof user.role === 'object' ? user.role.name : user.role}
              </span>
            )}
          </div>

        </Link>
        <div className="menu-title">MÓDULOS</div>
        <div className="modulos-menu">
          {(puedeVerUsuarios || puedeVerRoles) && (
            <nav>
              <button
                type="button"
                onClick={() => toggleSubMenu('submenuUsuarios')}
                className="menu-toggle-button"
                aria-controls="submenuUsuarios"
                // Use a boolean for aria-expanded. We derive it from the submenu element's visibility class.
                // Fallback to false if the element isn't present yet (initial render).
                aria-expanded={
                  typeof document !== 'undefined' && document.getElementById('submenuUsuarios')
                    ? document.getElementById('submenuUsuarios').classList.contains('visible')
                    : false
                }
              >
                <i className="fas fa-users" aria-hidden={true}></i>
                <span>Usuarios</span>
              </button>

              <ul className="dropdown" id="submenuUsuarios">
                {puedeVerUsuarios && (
                  <Link to="/ListaDeUsuarios" className="dropdown-link"><li><i className="fas fa-list" aria-hidden={true}></i> <span>Lista de Usuarios</span></li></Link>
                )}
                {puedeVerRoles && (
                  <Link to="/RolesYPermisos" className="dropdown-link"><li><i className="fas fa-user-shield" aria-hidden={true}></i> <span>Roles y permisos</span></li></Link>
                )}
              </ul>
            </nav>
          )}

          {(puedeGenerarOrden || puedeVerHCompras || puedeVerProveedores || puedeVerReportesCompras || puedeVerOrdenes) && (
            <nav>
              <button
                type="button"
                onClick={() => toggleSubMenu('submenuCompras')}
                className="menu-toggle-button"
                aria-controls="submenuCompras"
                aria-expanded={
                  typeof document !== 'undefined' && document.getElementById('submenuCompras')
                    ? document.getElementById('submenuCompras').classList.contains('visible')
                    : false
                }
              >
                <i className="fas fa-shopping-cart" aria-hidden={true}></i>
                <span>Compras</span>
              </button>
              <ul id="submenuCompras" className="dropdown" >
                {puedeGenerarOrden && (
                  <Link as={Link} to="/OrdenCompra" className="dropdown-link"><li><i className="fas fa-history" aria-hidden={true}></i> <span>Ordenes de compra</span></li></Link>
                )}
                {puedeVerHCompras && (
                  <Link as={Link} to="/HistorialCompras" className="dropdown-link"><li><i className="fas fa-history" aria-hidden={true}></i> <span>Historial de compras</span></li></Link>
                )}
                {puedeVerProveedores && (
                  <Link as={Link} to="/Proveedores" className="dropdown-link"><li><i className="fas fa-truck" aria-hidden={true}></i> <span>Lista de proveedores</span></li></Link>
                )}
                {puedeVerReportesCompras && (
                  <Link as={Link} to="/ReporteProveedores" className="dropdown-link"><li> <i className="fas fa-chart-bar" aria-hidden={true}></i> <span>Reportes de compras</span></li></Link>
                )}
              </ul>
            </nav>
          )}

          {(puedeVerCategorias || puedeVerSubcategorias || puedeVerProductos) && (
            <nav>
              <button
                type="button"
                onClick={() => toggleSubMenu('submenuProductos')}
                className="menu-toggle-button"
                aria-controls="submenuProductos"
                aria-expanded={
                  typeof document !== 'undefined' && document.getElementById('submenuProductos')
                    ? document.getElementById('submenuProductos').classList.contains('visible')
                    : false
                }
              >
                <i className="fas fa-boxes" aria-hidden={true}></i>
                <span>Productos</span>
              </button>
              <ul id="submenuProductos" className="dropdown">
                {puedeVerCategorias && (
                  <Link as={Link} to="/ListaDeCategorias" className="dropdown-link"><li><i className="fas fa-tags" aria-hidden={true}></i> <span>Categorias</span></li></Link>
                )}
                {puedeVerSubcategorias && (
                  <Link as={Link} to="/Subcategorias" className="dropdown-link"><li><i className="fas fa-tag" aria-hidden={true}></i> <span>Subcategorias</span></li></Link>
                )}
                {puedeVerProductos && (
                  <Link as={Link} to="/GestionProductos" className="dropdown-link"><li><i className="fas fa-box" aria-hidden={true}></i> <span>Lista de productos</span></li></Link>
                )}
                {puedeVerReportesProductos && (
                  <Link as={Link} to="/ReporteProductos" className="dropdown-link"><li> <i className="fas fa-chart-bar" aria-hidden={true}></i> <span>Reportes de productos</span></li></Link>
                )}
              </ul>
            </nav>
          )}



          {(puedeRegistrarCotizacion || puedeVerCotizaciones || puedeVerListaDeClientes || puedeVerPedidosCancelados || puedeVerPedidosDevueltos || puedeVerPedidosEntregados || puedeVerProspectos || puedeVerReportesVentas || puedeVerVentasAgendadas) && (
            <nav>
              <button
                type="button"
                onClick={() => toggleSubMenu('submenuVentas')}
                className="menu-toggle-button"
                aria-controls="submenuVentas"
                aria-expanded={
                  typeof document !== 'undefined' && document.getElementById('submenuVentas')
                    ? document.getElementById('submenuVentas').classList.contains('visible')
                    : false
                }
              >
                <i className="fas fa-cash-register" aria-hidden={true}></i>
                <span>Ventas</span>
              </button>
              <ul id="submenuVentas" className="dropdown">
                {puedeRegistrarCotizacion && (
                  <Link as={Link} to="/RegistrarCotizacion" className="dropdown-link"><li><i className="fas fa-file-invoice-dollar" aria-hidden={true}></i> <span>Registrar cotizacion</span></li></Link>
                )}
                {puedeVerCotizaciones && (
                  <Link as={Link} to="/ListaDeCotizaciones" className="dropdown-link"><li><i className="fas fa-list-alt" aria-hidden={true}></i> <span>Lista de cotizaciones</span></li></Link>
                )}
                {puedeVerVentasAgendadas && (
                  <Link as={Link} to="/PedidosAgendados" className="dropdown-link"><li><i className="fas fa-calendar-check" aria-hidden={true}></i> <span>Pedidos agendados</span></li></Link>
                )}
                {puedeVerPedidosEntregados && (
                  <Link as={Link} to="/PedidosEntregados" className="dropdown-link"><li><i className="fas fa-check-circle" aria-hidden={true}></i> <span>Pedidos entregados</span></li></Link>
                )}
                {puedeVerPedidosCancelados && (
                  <Link as={Link} to="/PedidosCancelados" className="dropdown-link"><li><i className="fas fa-times-circle" aria-hidden={true}></i> <span>Pedidos cancelados</span></li></Link>
                )}
                {puedeVerPedidosDevueltos && (
                  <Link as={Link} to="/PedidosDevueltos" className="dropdown-link"><li><i className="fas fa-undo-alt" aria-hidden={true}></i> <span>Pedidos devueltos</span></li></Link>
                )}
                {puedeVerListaDeClientes && (
                  <Link as={Link} to="/ListaDeClientes" className="dropdown-link"><li> <i className="fas fa-address-book" aria-hidden={true}></i> <span>Lista de clientes</span></li></Link>
                )}
                {puedeVerProspectos && (
                  <Link as={Link} to="/ProspectosDeClientes" className="dropdown-link"><li><i className="fas fa-user-plus" aria-hidden={true}></i> <span>Prospectos de cliente</span></li></Link>
                )}
                {puedeVerReportesVentas && (
                  <Link as={Link} to="/ReporteVentas" className="dropdown-link"><li><i className="fas fa-chart-bar" aria-hidden={true}></i> <span>Reportes</span></li></Link>
                )}
              </ul>
            </nav>
          )}
          <button className="logout-btn" onClick={handleClick}>
            Cerrar sesión
          </button>
        </div>



      </div>
    </div>
  )
}