import React, { useEffect, useState } from 'react';
import '../App.css';
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
  try {
    if (!usuario || !usuario.role || typeof usuario.role !== 'string') return usuario;

    let roleObj = null;
    const looksLikeObjectId = /^[0-9a-fA-F]{24}$/.test(String(usuario.role));
    let forbidden = false;

    if (looksLikeObjectId) {
      try {
        const res = await api.get(`/api/roles/${usuario.role}`);
        const d = res.data || res;
        roleObj = d.role || d.data || (Array.isArray(d) ? d[0] : null);
      } catch (err) {
        if (err && err.response && err.response.status === 403) {
          forbidden = true;
          console.debug('No tiene permisos para obtener role by id (403)');
        } else if (err && err.response && err.response.status === 404) {
          console.debug('Role not found by id (404)');
        } else {
          console.debug('Error getting role by id:', err && err.response ? { status: err.response.status, data: err.response.data } : err);
        }
      }
    }

    if (!roleObj && !forbidden && Array.isArray(usuario.permissions) && usuario.permissions.includes('roles.ver')) {
      try {
        const listRes = await api.get('/api/roles');
        const listData = listRes.data || listRes;
        const rolesArr = Array.isArray(listData) ? listData : (listData.data || []);
        roleObj = rolesArr.find(r => r.name === usuario.role || (r.name && r.name.toLowerCase() === String(usuario.role).toLowerCase()));
      } catch (err) {
        console.debug('Error listing roles:', err && err.response ? { status: err.response.status, data: err.response.data } : err);
      }
    }

    if (roleObj) {
      usuario.role = roleObj;
      try { localStorage.setItem('user', JSON.stringify(usuario)); } catch (e) { /* ignore storage errors */ }
    }

    return usuario;
  } catch (error) {
    console.error('resolveRoleForUser error:', error);
    return usuario;
  }
}


// Helper: intenta resolver el objeto role a partir del valor almacenado en user.role
// Mantiene la lógica de intentos por id, listado (si hay permiso) y maneja 403/404 sin romper el flujo.
async function resolveRoleForUser(usuario) {
  try {
    if (!usuario || !usuario.role || typeof usuario.role !== 'string') return usuario;

    let roleObj = null;
    const looksLikeObjectId = /^[0-9a-fA-F]{24}$/.test(String(usuario.role));
    let forbidden = false;

    if (looksLikeObjectId) {
      try {
        const res = await api.get(`/api/roles/${usuario.role}`);
        const d = res.data || res;
        roleObj = d.role || d.data || (Array.isArray(d) ? d[0] : null);
      } catch (err) {
        if (err && err.response && err.response.status === 403) {
          forbidden = true;
          console.debug('No tiene permisos para obtener/listar roles (403). Manteniendo rol como string.');
        } else if (err && err.response && err.response.status === 404) {
          console.debug('Rol no encontrado por id (404), intentaremos buscar por nombre si está permitido.');
        } else {
          console.debug('Error al obtener role by id:', err && err.response ? { status: err.response.status, data: err.response.data } : err);
        }
      }
    }

    // Solo intentar listar roles si no encontramos roleObj y no fue forbidden y el usuario tiene permiso
    if (!roleObj && !forbidden && Array.isArray(usuario.permissions) && usuario.permissions.includes('roles.ver')) {
      try {
        const listRes = await api.get('/api/roles');
        const listData = listRes.data || listRes;
        const rolesArr = Array.isArray(listData) ? listData : (listData.data || []);
        roleObj = rolesArr.find(r => r.name === usuario.role || (r.name && r.name.toLowerCase() === String(usuario.role).toLowerCase()));
      } catch (err) {
        if (err && err.response) {
          console.debug('Error al listar roles:', err.response.status, err.response.data);
        } else {
          console.debug('Error al listar roles:', err);
        }
      }
    }

    if (roleObj) {
      usuario.role = roleObj;
      try { localStorage.setItem('user', JSON.stringify(usuario)); } catch (e) { /* ignore */ }
    }

    return usuario;
  } catch (error) {
    console.error('Error al cargar rol:', error);
    return usuario;
  }
}


export default function Fijo() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [puedeVerRoles, setPuedeVerRoles] = useState(false);
  const [puedeVerUsuarios, setPuedeVerUsuarios] = useState(false);
  const [puedeGenerarOrden, setPuedeGenerarOrden] = useState(false);
  const [puedeVerOrdenes, setPuedeVerOrdenes] = useState(false);
  const [puedeRegistrarCompras, setPuedeRegistrarCompras] = useState(false);
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
      setPuedeVerOrdenes(has('ordenesCompra.ver'));
      setPuedeRegistrarCompras(has('compras.crear'));
      setPuedeVerProveedores(has('proveedores.ver'));
      setPuedeVerHCompras(has('hcompras.ver'));
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
    window.addEventListener('storage', handleStorageChange);

    // 3. Manejar click fuera del menú (código original preservado)
    const handleClickOutside = (event) => {
      const menu = document.getElementById('menu');
      const closeBtn = document.getElementById('close-menu');
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
      window.removeEventListener('storage', handleStorageChange);
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
          <Link as={Link} to='/Home'>
            <span
              id='empresa-nombre'
              style={{ cursor: 'pointer', color: 'white', fontFamily: "'Poppins', sans-serif", fontStyle: 'italic' }}
            >
              JLA Global Company
            </span>
          </Link>
        </div>
        <div className="user">
          {user && (
            <Link as={Link} to="/Perfil">
              <span style={{ color: 'white' }}>{user.firstName}</span>
            </Link>
          )}
          <Link as={Link} to="/Perfil"><img style={{ color: 'white' }} src="https://cdn-icons-png.freepik.com/256/17740/17740782.png?ga=GA1.1.755740385.1744083497&semt=ais_hybrid" alt="" className='icono' /></Link>
        </div>
      </header>

      <div id='menu' className="menu">
        <div className="usuarioYModulos" style={{ width: '100%' }}>
          <Link as={Link} to="/Perfil"><div className="preview-usuario">
            <img src="https://cdn-icons-png.freepik.com/256/17740/17740782.png?ga=GA1.1.755740385.1744083497&semt=ais_hybrid" alt="" style={{ width: "80px" }} />
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
          </div>
          </Link>
          <div className="menu-title">MÓDULOS</div>
          <div className="modulos-menu">
            {(puedeVerUsuarios || puedeVerRoles) && (
              <nav>
                <li style={{ padding: "10px 0" }} onClick={() => toggleSubMenu('submenuUsuarios')}>
                  <i className="fas fa-users"></i> Usuarios
                </li>
                <ul className="dropdown" id="submenuUsuarios">
                  {puedeVerUsuarios && (
                    <Link to="/ListaDeUsuarios"><li><i className="fas fa-list"></i> Lista de Usuarios</li></Link>
                  )}
                  {puedeVerRoles && (
                    <Link to="/RolesYPermisos"><li><i className="fas fa-user-shield"></i> Roles y permisos</li></Link>
                  )}
                </ul>
              </nav>
            )}

            {(puedeGenerarOrden || puedeVerHCompras || puedeVerProveedores || puedeVerReportesCompras || puedeVerOrdenes) && (
              <nav>
                <li style={{ padding: "10px 0" }} onClick={() => toggleSubMenu('submenuCompras')}><i className="fas fa-shopping-cart"></i> Compras</li>
                <ul id="submenuCompras" className="dropdown" >
                  {puedeGenerarOrden && (
                    <Link as={Link} to="/OrdenCompra"><li><i className="fas fa-history"></i> Ordenes de compra</li></Link>
                  )}
                  {puedeVerHCompras && (
                    <Link as={Link} to="/HistorialCompras"><li><i className="fas fa-history"></i> Historial de compras</li></Link>
                  )}
                  {puedeVerProveedores && (
                    <Link as={Link} to="/Proveedores"><li><i className="fas fa-truck"></i> Lista de proveedores</li></Link>
                  )}
                  {puedeVerReportesCompras && (
                    <Link as={Link} to="/ReporteProveedores"><li> <i className="fas fa-chart-bar"></i> Reportes de compras</li></Link>
                  )}
                </ul>
              </nav>
            )}

            {(puedeVerCategorias || puedeVerSubcategorias || puedeVerProductos) && (
              <nav>
                <li style={{ padding: "10px 0" }} onClick={() => toggleSubMenu('submenuProductos')}><i className="fas fa-boxes"></i> Productos</li>
                <ul id="submenuProductos" className="dropdown">
                  {puedeVerCategorias && (
                    <Link as={Link} to="/ListaDeCategorias"><li><i className="fas fa-tags"></i> Categorias</li></Link>
                  )}
                  {puedeVerSubcategorias && (
                    <Link as={Link} to="/Subcategorias"><li><i className="fas fa-tag"></i> Subcategorias</li></Link>
                  )}
                  {puedeVerProductos && (
                    <Link as={Link} to="/GestionProductos"><li><i className="fas fa-box"></i> Lista de productos</li></Link>
                  )}
                  {puedeVerReportesProductos && (
                    <Link as={Link} to="/ReporteProductos"><li> <i className="fas fa-chart-bar"></i> Reportes de productos</li></Link>
                  )}
                </ul>
              </nav>
            )}



            {(puedeRegistrarCotizacion || puedeVerCotizaciones || puedeVerListaDeClientes || puedeVerPedidosCancelados || puedeVerPedidosDevueltos || puedeVerPedidosEntregados || puedeVerProspectos || puedeVerReportesVentas || puedeVerVentasAgendadas) && (
              <nav>
                <li style={{ padding: "10px 0" }} onClick={() => toggleSubMenu('submenuVentas')}><i className="fas fa-cash-register"></i> Ventas</li>
                <ul id="submenuVentas" className="dropdown">
                  {puedeRegistrarCotizacion && (
                    <Link as={Link} to="/RegistrarCotizacion"><li><i className="fas fa-file-invoice-dollar"></i> Registrar cotizacion</li></Link>
                  )}
                  {puedeVerCotizaciones && (
                    <Link as={Link} to="/ListaDeCotizaciones"><li><i className="fas fa-list-alt"></i> Lista de cotizaciones</li></Link>
                  )}
                  {puedeVerVentasAgendadas && (
                    <Link as={Link} to="/PedidosAgendados"><li><i className="fas fa-calendar-check"></i> Pedidos agendados</li></Link>
                  )}
                  {puedeVerPedidosEntregados && (
                    <Link as={Link} to="/PedidosEntregados"><li><i className="fas fa-check-circle"></i> Pedidos entregados</li></Link>
                  )}
                  {puedeVerPedidosCancelados && (
                    <Link as={Link} to="/PedidosCancelados"><li><i className="fas fa-times-circle"></i> Pedidos cancelados</li></Link>
                  )}
                  {puedeVerPedidosDevueltos && (
                    <Link as={Link} to="/PedidosDevueltos"><li><i className="fas fa-undo-alt"></i> Pedidos devueltos</li></Link>
                  )}
                  {puedeVerListaDeClientes && (
                    <Link as={Link} to="/ListaDeClientes"><li> <i className="fas fa-address-book"></i> Lista de clientes</li></Link>
                  )}
                  {puedeVerProspectos && (
                    <Link as={Link} to="/ProspectosDeClientes"><li><i className="fas fa-user-plus"></i> Prospectos de cliente</li></Link>
                  )}
                  {puedeVerReportesVentas && (
                    <Link as={Link} to="/ReporteVentas"><li><i className="fas fa-chart-bar"></i> Reportes</li></Link>
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
    </div>
  )
}