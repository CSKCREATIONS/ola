/* global globalThis */
import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { toggleSubMenu } from "../funciones/animaciones";
import { registerModalRol } from "../funciones/modalController";
import Swal from "sweetalert2";
import api from '../api/axiosConfig';

/* ---------- Styles (aligned with EditarRol.jsx) ---------- */
const overlayStyle = {
   position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
   backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
   alignItems: 'center', justifyContent: 'center', zIndex: 1000,
   backdropFilter: 'blur(4px)', padding: '1rem'
};

const formStyle = {
   backgroundColor: 'white', borderRadius: '20px', maxWidth: '1200px',
   width: 'min(1200px, calc(100% - 2rem))', maxHeight: '95vh', height: '95vh',
   overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
   display: 'flex', flexDirection: 'column', margin: 0, padding: 0, border: 'none'
};

const headerStyle = {
   background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white',
   padding: '2rem', borderRadius: '20px 20px 0 0'
};

const scrollContentStyle = {
   flex: 1, minHeight: 0, overflowY: 'auto', padding: '2rem', backgroundColor: '#f8fafc'
};

const cardStyleBase = {
   padding: '1.25rem', borderRadius: '12px', transition: 'all 0.3s ease'
};

/* checkbox / radio shared styles used in EditarRol.jsx */
const checkboxLabelStyle = {
   display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem',
   cursor: 'pointer', borderRadius: '6px', transition: 'background 0.2s ease'
};

const checkboxStyle = {
   width: '18px', height: '18px', cursor: 'pointer', accentColor: '#8b5cf6'
};
/* ---------- Small components ---------- */
const IconBox = ({ children }) => (
   <div style={{
      width: '50px', height: '50px', borderRadius: '12px',
      background: 'rgba(255,255,255,0.2)', display: 'flex',
      alignItems: 'center', justifyContent: 'center'
   }}>{children}</div>
);

IconBox.propTypes = {
   children: PropTypes.node.isRequired
};


const ModuleCard = ({ bg, border, color, checked, onChange, iconClass, label }) => (
   <div style={{ ...cardStyleBase, background: bg, border }}>
      <label style={{
         display: 'flex', alignItems: 'center', gap: '0.75rem',
         cursor: 'pointer', fontWeight: 600, color
      }}>
         <input type="checkbox" checked={checked} onChange={onChange}
            style={{ width: '18px', height: '18px', accentColor: color }} />
         <i className={iconClass} style={{ color }} aria-hidden />
         <span>{label}</span>
      </label>
   </div>
);

ModuleCard.propTypes = {
   bg: PropTypes.string,
   border: PropTypes.string,
   color: PropTypes.string,
   checked: PropTypes.bool,
   onChange: PropTypes.func,
   iconClass: PropTypes.string,
   label: PropTypes.node.isRequired
};

ModuleCard.defaultProps = {
   bg: undefined,
   border: undefined,
   color: undefined,
   checked: false,
   onChange: () => { },
   iconClass: ''
};

const PermissionCheckbox = ({ checked, onChange, label }) => (
   <label className="form-option" style={{ display: 'block', marginBottom: 8 }}>
      <input className="input-gap" type="checkbox" checked={checked} onChange={onChange} />
      <span style={{ marginLeft: 8 }}>{label}</span>
   </label>
);

PermissionCheckbox.propTypes = {
   checked: PropTypes.bool,
   onChange: PropTypes.func,
   label: PropTypes.node.isRequired
};

PermissionCheckbox.defaultProps = {
   checked: false,
   onChange: () => { }
};

const PermissionRadioAll = ({ onClick, checked }) => (
   <label className="form-option form-option--no-margin" style={{ display: 'block', marginTop: 8 }}>
      <input type="radio" name="allPermissions" onClick={onClick} checked={checked} readOnly />
      <span style={{ marginLeft: 8 }}>Todos los permisos</span>
   </label>
);

PermissionRadioAll.propTypes = {
   onClick: PropTypes.func,
   checked: PropTypes.bool
};

PermissionRadioAll.defaultProps = {
   onClick: () => { },
   checked: false
};

/* ---------- Permission sets ---------- */
const permisosUsuarios = [
   'usuarios.crear', 'usuarios.editar', 'usuarios.deshabilitar', 'usuarios.eliminar'
];

const permisosRoles = [
   'roles.ver', 'roles.crear', 'roles.editar', 'roles.deshabilitar'
];

const permisosCompras = [
   'compras.ver', 'compras.crear', 'proveedores.ver', 'proveedores.crear', 'proveedores.editar',
   'proveedores.inactivar', 'proveedores.activar', 'ordenesCompra.ver', 'ordenes.generar',
   'ordenes.editar', 'ordenes.eliminar', 'ordenes.aprobar', 'reportesCompras.ver'
];

const permisosProductos = [
   'productos.ver', 'productos.crear', 'productos.editar', 'productos.inactivar',
   'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.inactivar', 'reportesProductos.ver'
];

const permisosVentas = [
   'pedidos.agendar', 'pedidos.ver', 'pedidos.remisionar', 'pedidos.enviar',
   'pedidosAgendados.ver', 'pedidosCancelados.ver', 'cotizaciones.ver', 'cotizaciones.crear', 'cotizaciones.editar',
   'cotizaciones.eliminar', 'cotizaciones.enviar', 'cotizaciones.remisionar',
   'remisiones.ver', 'remisiones.crear', 'remisiones.editar', 'remisiones.eliminar', 'remisiones.enviar',
   'clientes.ver', 'clientes.crear', 'clientes.editar', 'clientes.inactivar', 'prospectos.ver',
   'reportesVentas.ver'
];

/* ---------- Main component ---------- */
export default function AgregarRol() {
   const [isVisible, setIsVisible] = useState(false);
   const [nombreRol, setNombreRol] = useState('');
   const [permisos, setPermisos] = useState([]);

   const [mostrarUsuarios, setMostrarUsuarios] = useState(false);
   const [mostrarListaUsuarios, setMostrarListaUsuarios] = useState(false);
   const [mostrarOrdenesCompra, setMostrarOrdenesCompra] = useState(false);
   const [mostrarHistorialCompras, setMostrarHistorialCompras] = useState(false);
   const [mostrarProveedores, setMostrarProveedores] = useState(false);
   const [mostrarCategorias, setMostrarCategorias] = useState(false);
   const [mostrarInventario, setMostrarInventario] = useState(false);
   const [mostrarCotizaciones, setMostrarCotizaciones] = useState(false);
   const [mostrarPedidos, setMostrarPedidos] = useState(false);
   const [mostrarPedidosAgendados, setMostrarPedidosAgendados] = useState(false);
   const [mostrarRemisiones, setMostrarRemisiones] = useState(false);
   const [mostrarClientes, setMostrarClientes] = useState(false);
   const [mostrarListaRoles, setMostrarListaRoles] = useState(false);
   const [mostrarCompras, setMostrarCompras] = useState(false);
   const [mostrarProductos, setMostrarProductos] = useState(false);
   const [mostrarVentas, setMostrarVentas] = useState(false);

   useEffect(() => {
      registerModalRol(setIsVisible);
      try {
         if (typeof globalThis !== 'undefined') {
            globalThis.openModalRol = () => setIsVisible(true);
         }
      } catch (e) {
         console.debug('attach openModalRol failed:', e?.message || e);
      }
      return () => {
         try {
            if (typeof globalThis !== 'undefined' && globalThis.openModalRol) {
               try {
                  delete globalThis.openModalRol;
               } catch (err) {
                  // Log the error when attempting to delete the global to aid debugging
                  console.debug('Failed to delete global.openModalRol during cleanup:', err);
               }
            }
         } catch (err) {
            // Log any unexpected errors during cleanup
            console.debug('Unexpected error during modal cleanup:', err);
         }
      };
   }, []);

   const togglePermiso = useCallback((perm) => {
      setPermisos(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
   }, []);

   const toggleGrupoPermisos = useCallback((grupoPermisos) => {
      setPermisos(prev => {
         const allOn = grupoPermisos.every(p => prev.includes(p));
         if (allOn) return prev.filter(p => !grupoPermisos.includes(p));
         // add missing
         return [...new Set([...prev, ...grupoPermisos])];
      });
   }, []);

   const closeModal = () => setIsVisible(false);

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!nombreRol.trim()) return Swal.fire('Error', 'El nombre del rol es obligatorio', 'error');
      if (permisos.length === 0) return Swal.fire('Error', 'Selecciona al menos un permiso', 'error');
      try {
         const res = await api.post('/api/roles', { name: nombreRol, permissions: permisos });
         const data = res.data || res;
         if (res.status >= 200 && res.status < 300 && data.success) {
            Swal.fire('Éxito', 'Rol creado correctamente', 'success');
            setNombreRol(''); setPermisos([]); closeModal();
         } else {
            Swal.fire('Error', data.message || 'No se pudo crear el rol', 'error');
         }
      } catch (error) {
         console.error('[AgregarRol]', error);
         Swal.fire('Error', 'Error del servidor al crear el rol', 'error');
      }
   };

   /* ---------- Module toggle handlers (preserve original removal behavior) ---------- */
   const onToggleUsuariosModule = (checked) => {
      setMostrarUsuarios(checked);
      if (!checked) {
         // remove permissions related to usuarios.* and roles.*
         setPermisos(prev => prev.filter(p => !p.startsWith('usuarios.') && !p.startsWith('roles.')));
         setMostrarListaUsuarios(false);
         setMostrarListaRoles(false);
      }
   };

   /* Smaller helper to render permissions lists */
   return (
      <>
         {isVisible && (
            <div style={overlayStyle}>
               <form onSubmit={handleSubmit} style={formStyle}>
                  <div style={headerStyle}>
                     <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <IconBox><i className="fa-solid fa-shield-alt icon-gap" style={{ fontSize: '1.5rem' }} /></IconBox>
                        Crear Nuevo Rol
                     </h3>
                     <p style={{ margin: '0.5rem 0 0 4rem', opacity: .9, fontSize: '.95rem' }}>
                        Configure los permisos y accesos para el nuevo rol de usuario
                     </p>
                  </div>

                  <div style={scrollContentStyle}>
                     {/* Nombre del rol */}
                     <div style={{
                        background: 'white', padding: '2rem', borderRadius: 12, marginBottom: '2rem',
                        border: '1px solid #e2e8f0', borderLeft: '4px solid #8b5cf6'
                     }}>
                        <label htmlFor="nombre-rol-agregar" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem', fontWeight: 600, color: '#374151', fontSize: '1.1rem' }}>
                           <i className="fa-solid fa-tag icon-gap" style={{ color: '#8b5cf6', fontSize: '1rem' }} aria-hidden />
                           <span>Nombre del Rol <span style={{ color: '#ef4444' }}>*</span></span>
                        </label>
                        <input
                           id="nombre-rol-agregar"
                           className='entrada'
                           type="text"
                           value={nombreRol}
                           onChange={(e) => setNombreRol(e.target.value)}
                           placeholder="Ej: Administrador, Vendedor, Supervisor..."
                           style={{
                              width: '100%', padding: '0.875rem 1rem', border: '2px solid #e5e7eb',
                              borderRadius: '10px', fontSize: '1rem', transition: 'all 0.3s ease',
                              backgroundColor: '#fff', fontFamily: 'inherit', boxSizing: 'border-box'
                           }}
                           onFocus={(e) => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)'; }}
                           onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                        />
                     </div>

                     {/* Módulos */}
                     <div style={{
                        background: 'white', padding: '2rem', borderRadius: 12, marginBottom: '2rem',
                        border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981'
                     }}>
                        <h4 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                           <i className="fa-solid fa-cube icon-gap" style={{ color: '#10b981' }} aria-hidden />
                           <span>Módulos con Acceso</span>
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                           <ModuleCard
                              bg="linear-gradient(135deg, #f0f9ff, #e0f2fe)"
                              border="2px solid #bae6fd"
                              color="#0284c7"
                              checked={mostrarUsuarios}
                              onChange={(e) => onToggleUsuariosModule(e.target.checked)}
                              iconClass="fa-solid fa-users icon-gap"
                              label="Usuarios"
                           />
                           <ModuleCard
                              bg="linear-gradient(135deg, #f0fdf4, #dcfce7)"
                              border="2px solid #bbf7d0"
                              color="#059669"
                              checked={mostrarCompras}
                              onChange={(e) => setMostrarCompras(e.target.checked)}
                              iconClass="fa-solid fa-shopping-cart icon-gap"
                              label="Compras"
                           />
                           <ModuleCard
                              bg="linear-gradient(135deg, #fefce8, #fef3c7)"
                              border="2px solid #fde68a"
                              color="#d97706"
                              checked={mostrarProductos}
                              onChange={(e) => setMostrarProductos(e.target.checked)}
                              iconClass="fa-solid fa-box icon-gap"
                              label="Productos"
                           />
                           <ModuleCard
                              bg="linear-gradient(135deg, #fdf2f8, #fce7f3)"
                              border="2px solid #f9a8d4"
                              color="#be185d"
                              checked={mostrarVentas}
                              onChange={(e) => setMostrarVentas(e.target.checked)}
                              iconClass="fa-solid fa-chart-line icon-gap"
                              label="Ventas"
                           />
                        </div>
                     </div>

                     {/* Usuarios section */}
                     {mostrarUsuarios && (
                        <section id="permisos-usuarios" style={{ marginBottom: 20 }}>
                           <h4>Permisos módulo usuarios</h4>
                           <div style={{ display: 'flex', gap: 24, marginTop: 12, flexWrap: 'wrap' }}>
                              <div style={{ minWidth: 260 }}>
                                 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input
                                       className="input-gap"
                                       type="checkbox"
                                       checked={permisos.includes('usuarios.ver')}
                                       onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          togglePermiso('usuarios.ver');
                                          setMostrarListaUsuarios(prev => !prev);
                                          if (!isChecked) {
                                             setPermisos(prev => prev.filter(p => !p.startsWith('usuarios.')));
                                             setMostrarListaUsuarios(false);
                                          }
                                       }}
                                    />
                                    <span>Lista de usuarios</span>
                                 </label>

                                 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 12 }}>
                                    <input
                                       className="input-gap"
                                       type="checkbox"
                                       checked={permisos.includes('roles.ver')}
                                       onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          togglePermiso('roles.ver');
                                          setMostrarListaRoles(prev => !prev);
                                          if (!isChecked) {
                                             setPermisos(prev => prev.filter(p => !p.startsWith('roles.')));
                                             setMostrarListaRoles(false);
                                          }
                                       }}
                                    />
                                    <span>Roles y permisos</span>
                                 </label>
                              </div>

                              {mostrarListaUsuarios && (
                                 <div id="lista-usuarios" style={{ minWidth: 260 }}>
                                    <h5 style={{ margin: '0 0 .5rem 0', fontWeight: 600, color: '#374151' }}>Permisos para lista de usuarios</h5>
                                    <PermissionCheckbox checked={permisos.includes('usuarios.ver')} onChange={() => togglePermiso('usuarios.ver')} label="Ver lista de usuarios" />
                                    <PermissionCheckbox checked={permisos.includes('usuarios.crear')} onChange={() => togglePermiso('usuarios.crear')} label="Crear usuarios" />
                                    <PermissionCheckbox checked={permisos.includes('usuarios.editar')} onChange={() => togglePermiso('usuarios.editar')} label="Editar usuarios" />
                                    <PermissionCheckbox checked={permisos.includes('usuarios.deshabilitar')} onChange={() => togglePermiso('usuarios.deshabilitar')} label="Habilitar / deshabilitar" />
                                    <PermissionCheckbox checked={permisos.includes('usuarios.eliminar')} onChange={() => togglePermiso('usuarios.eliminar')} label="Eliminar usuarios" />
                                    <PermissionRadioAll onClick={() => toggleGrupoPermisos(permisosUsuarios)} checked={permisosUsuarios.every(p => permisos.includes(p))} />
                                 </div>
                              )}

                              {mostrarListaRoles && (
                                 <div id="roles-y-permisos" style={{ minWidth: 260 }}>
                                    <h5 style={{ margin: '0 0 .5rem 0', fontWeight: 600, color: '#374151' }}>Permisos para roles y permisos</h5>
                                    <PermissionCheckbox checked={permisos.includes('roles.ver')} onChange={() => togglePermiso('roles.ver')} label="Ver lista de roles" />
                                    <PermissionCheckbox checked={permisos.includes('roles.crear')} onChange={() => togglePermiso('roles.crear')} label="Crear roles" />
                                    <PermissionCheckbox checked={permisos.includes('roles.editar')} onChange={() => togglePermiso('roles.editar')} label="Editar roles" />
                                    <PermissionCheckbox checked={permisos.includes('roles.deshabilitar')} onChange={() => togglePermiso('roles.deshabilitar')} label="Habilitar / deshabilitar" />
                                    <PermissionRadioAll onClick={() => toggleGrupoPermisos(permisosRoles)} checked={permisosRoles.every(p => permisos.includes(p))} />
                                 </div>
                              )}
                           </div>
                        </section>
                     )}

                     {/* Compras */}
                     {mostrarCompras && (
                        <section id="permisos-compras" style={{ marginBottom: 20 }}>
                           <h4>Permisos módulo compras</h4>
                           <div style={{ display: 'flex', gap: 24, marginTop: 12, flexWrap: 'wrap' }}>
                              <div style={{ minWidth: 260 }}>
                                 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input
                                       className="input-gap"
                                       type="checkbox"
                                       checked={permisos.includes('ordenesCompra.ver')}
                                       onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          togglePermiso('ordenesCompra.ver');
                                          setMostrarOrdenesCompra(prev => !prev);
                                          if (!isChecked) {
                                             setPermisos(prev => prev.filter(p => !p.startsWith('ordenes.')));
                                             setMostrarOrdenesCompra(false);
                                          }
                                       }}
                                    />
                                    <span>Órdenes de compra</span>
                                 </label>


                                 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 10 }}>
                                    <input
                                       className="input-gap"
                                       type="checkbox"
                                       checked={permisos.includes('compras.ver')}
                                       onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          togglePermiso('compras.ver');
                                          setMostrarHistorialCompras(prev => !prev);
                                          if (!isChecked) {
                                             setPermisos(prev => prev.filter(p => !p.startsWith('compras.')));
                                             setMostrarHistorialCompras(false);
                                          }
                                       }}
                                    />
                                    <span>Historial de compras</span>
                                 </label>

                                 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 10 }}>
                                    <input
                                       className="input-gap"
                                       type="checkbox"
                                       checked={permisos.includes('proveedores.ver')}
                                       onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          togglePermiso('proveedores.ver');
                                          setMostrarProveedores(prev => !prev);
                                          if (!isChecked) {
                                             setPermisos(prev => prev.filter(p => !p.startsWith('proveedores.')));
                                             setMostrarProveedores(false);
                                          }
                                       }}
                                    />
                                    <span>Proveedores</span>
                                 </label>

                              </div>

                              <div style={{ minWidth: 260 }}>

                                 <PermissionCheckbox checked={permisos.includes('reportesCompras.ver')} onChange={() => togglePermiso('reportesCompras.ver')} label="Ver reportes" />
                                 <PermissionRadioAll onClick={() => toggleGrupoPermisos(permisosCompras)} checked={permisosCompras.every(p => permisos.includes(p))} />

                              </div>


                              {mostrarOrdenesCompra && (
                                 <div id="ordenes-de-compra" style={{ minWidth: 260 }}>
                                    <h5 style={{ margin: '0 0 .5rem 0', fontWeight: 600, color: '#374151' }}>Permisos para Órdenes de compra</h5>
                                    <PermissionCheckbox checked={permisos.includes('ordenes.generar')} onChange={() => togglePermiso('ordenes.generar')} label="Generar órdenes" />
                                    <PermissionCheckbox checked={permisos.includes('ordenes.editar')} onChange={() => togglePermiso('ordenes.editar')} label="Editar órdenes" />
                                    <PermissionCheckbox checked={permisos.includes('ordenes.eliminar')} onChange={() => togglePermiso('ordenes.eliminar')} label="Eliminar órdenes" />
                                    <PermissionCheckbox checked={permisos.includes('ordenes.aprobar')} onChange={() => togglePermiso('ordenes.aprobar')} label="Aprobar órdenes" />
                                 </div>
                              )}

                              {mostrarHistorialCompras && (
                                 <div id="historial-de-compras" style={{ minWidth: 260 }}>
                                    <h5 style={{ margin: '0 0 .5rem 0', fontWeight: 600, color: '#374151' }}>Permisos para Historial de compras</h5>
                                    <PermissionCheckbox checked={permisos.includes('compras.ver')} onChange={() => togglePermiso('compras.ver')} label="Ver historial de compras" />
                                    <PermissionCheckbox checked={permisos.includes('compras.crear')} onChange={() => togglePermiso('compras.crear')} label="Registrar compras" />
                                 </div>
                              )}

                              {mostrarProveedores && (
                                 <div id="proveedores" style={{ minWidth: 260 }}>
                                    <h5 style={{ margin: '0 0 .5rem 0', fontWeight: 600, color: '#374151' }}>Permisos para Proveedores</h5>

                                    <PermissionCheckbox checked={permisos.includes('proveedores.ver')} onChange={() => togglePermiso('proveedores.ver')} label="Ver proveedores" />
                                    <PermissionCheckbox checked={permisos.includes('proveedores.crear')} onChange={() => togglePermiso('proveedores.crear')} label="Crear proveedores" />
                                    <PermissionCheckbox checked={permisos.includes('proveedores.editar')} onChange={() => togglePermiso('proveedores.editar')} label="Editar proveedores" />
                                    <PermissionCheckbox checked={permisos.includes('proveedores.inactivar')} onChange={() => togglePermiso('proveedores.inactivar')} label="Inactivar proveedores" />
                                    <PermissionCheckbox checked={permisos.includes('proveedores.activar')} onChange={() => togglePermiso('proveedores.activar')} label="Activar proveedores" />
                                 </div>
                              )}

                           </div>

                        </section>
                     )}

                     {/* Productos */}
                     {mostrarProductos && (
                        <section id="permisos-productos" style={{ marginBottom: 20 }}>
                           <h4>Permisos módulo productos</h4>
                           <div style={{ display: 'flex', gap: 24, marginTop: 12, flexWrap: 'wrap' }}>
                              <div style={{ minWidth: 260 }}>

                                 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 10 }}>
                                    <input
                                       className="input-gap"
                                       type="checkbox"
                                       checked={permisos.includes('categorias.ver')}
                                       onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          togglePermiso('categorias.ver');
                                          setMostrarCategorias(prev => !prev);
                                          if (!isChecked) {
                                             setPermisos(prev => prev.filter(p => !p.startsWith('categorias.')));
                                             setMostrarCategorias(false);
                                          }
                                       }}
                                    />
                                    <span>Categorias</span>
                                 </label>

                                 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 10 }}>
                                    <input className="input-gap"
                                       type="checkbox"
                                       checked={permisos.includes('productos.ver')}
                                       onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          togglePermiso('productos.ver');
                                          setMostrarInventario(prev => !prev);
                                          if (!isChecked) {
                                             setPermisos(prev => prev.filter(p => !p.startsWith('productos.')));
                                             setMostrarInventario(false);
                                          }
                                       }}
                                    />
                                    <span style={{ marginLeft: 8 }}>Control de inventario</span>
                                 </label>





                              </div>
                              <div style={{ minWidth: 260 }}>
                                 <PermissionCheckbox checked={permisos.includes('reportesProductos.ver')} onChange={() => togglePermiso('reportesProductos.ver')} label="Reportes" />
                                 <PermissionRadioAll onClick={() => toggleGrupoPermisos(permisosProductos)} checked={permisosProductos.every(p => permisos.includes(p))} />
                              </div>


                              {mostrarCategorias && (
                                 <div id="categorias" style={{ minWidth: 320 }}>
                                    <h5 style={{ margin: '0 0 .5rem 0', fontWeight: 600, color: '#374151' }}>Permisos para Categorias</h5>

                                    <PermissionCheckbox checked={permisos.includes('categorias.ver')} onChange={() => togglePermiso('categorias.ver')} label="Ver categorías" />
                                    <PermissionCheckbox checked={permisos.includes('categorias.crear')} onChange={() => togglePermiso('categorias.crear')} label="Crear categorías" />
                                    <PermissionCheckbox checked={permisos.includes('categorias.editar')} onChange={() => togglePermiso('categorias.editar')} label="Editar categorías" />
                                    <PermissionCheckbox checked={permisos.includes('categorias.inactivar')} onChange={() => togglePermiso('categorias.inactivar')} label="Inactivar categorías" />
                                 </div>
                              )}


                              {mostrarInventario && (
                                 <div id="lista-productos" style={{ marginTop: 12 }}>
                                    <h5 style={{ margin: '0 0 .5rem 0', fontWeight: 600, color: '#374151' }}>Permisos para Control de Inventario</h5>
                                    <PermissionCheckbox checked={permisos.includes('productos.ver')} onChange={() => togglePermiso('productos.ver')} label="Ver inventario" />
                                    <PermissionCheckbox checked={permisos.includes('productos.crear')} onChange={() => togglePermiso('productos.crear')} label="Agregar Productos" />
                                    <PermissionCheckbox checked={permisos.includes('productos.editar')} onChange={() => togglePermiso('productos.editar')} label="Editar productos" />
                                    <PermissionCheckbox checked={permisos.includes('productos.inactivar')} onChange={() => togglePermiso('productos.inactivar')} label="Activar/Inactivar" />

                                 </div>
                              )}
                           </div>
                        </section>
                     )}

                     {/* Ventas */}
                     {mostrarVentas && (
                        <section id="permisos-ventas" style={{ marginBottom: 20 }}>
                           <h4>Permisos módulo ventas</h4>
                           <div style={{ display: 'flex', gap: 24, marginTop: 12, flexWrap: 'wrap' }}>
                              <div style={{ minWidth: 260 }}>

                                 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 10 }}>
                                    <input
                                       className="input-gap"
                                       type="checkbox"
                                       checked={permisos.includes('cotizaciones.ver')}
                                       onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          togglePermiso('cotizaciones.ver');
                                          setMostrarCotizaciones(prev => !prev);
                                          if (!isChecked) {
                                             setPermisos(prev => prev.filter(p => !p.startsWith('cotizaciones.')));
                                             setMostrarCotizaciones(false);
                                          }
                                       }}
                                    />
                                    <span>Lista de cotizaciones</span>
                                 </label>

                                 <PermissionCheckbox checked={permisos.includes('cotizaciones.crear')} onChange={() => togglePermiso('cotizaciones.crear')} label="Registrar cotizaciones" />


                                 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 10 }}>
                                    <input
                                       className="input-gap"
                                       type="checkbox"
                                       checked={permisos.includes('pedidos.ver')}
                                       onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          togglePermiso('pedidos.ver');
                                          setMostrarPedidos(prev => !prev);
                                          if (!isChecked) {
                                             setPermisos(prev => prev.filter(p => !p.startsWith('pedidos.')));
                                             setMostrarPedidos(false);
                                          }
                                       }}
                                    />
                                    <span>Ver pedidos</span>
                                 </label>

                                 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 10 }}>
                                    <input
                                       className="input-gap"
                                       type="checkbox"
                                       checked={permisos.includes('clientes.ver')}
                                       onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          togglePermiso('clientes.ver');
                                          setMostrarClientes(prev => !prev);
                                          if (!isChecked) {
                                             setPermisos(prev => prev.filter(p => !p.startsWith('clientes.')));
                                             setMostrarClientes(false);
                                          }
                                       }}
                                    />
                                    <span>Clientes</span>
                                 </label>

                              </div>

                              <div style={{ minWidth: 320 }}>
                                 <PermissionCheckbox checked={permisos.includes('prospectos.ver')} onChange={() => togglePermiso('prospectos.ver')} label="Ver prospectos" />
                                 <PermissionCheckbox checked={permisos.includes('reportesVentas.ver')} onChange={() => togglePermiso('reportesVentas.ver')} label="Reportes de ventas" />
                                 <PermissionRadioAll onClick={() => toggleGrupoPermisos(permisosVentas)} checked={permisosVentas.every(p => permisos.includes(p))} />
                              </div>

                              {mostrarCotizaciones && (
                                 <div id="lista-de-cotizaciones" style={{ minWidth: 260 }}>
                                    <h5 style={{ margin: '0 0 .5rem 0', fontWeight: 600, color: '#374151' }}>Permisos para Lista de cotizaciones</h5>
                                    <PermissionCheckbox checked={permisos.includes('cotizaciones.ver')} onChange={() => togglePermiso('cotizaciones.ver')} label="Ver cotizaciones" />
                                    <PermissionCheckbox checked={permisos.includes('cotizaciones.editar')} onChange={() => togglePermiso('cotizaciones.editar')} label="Editar cotizaciones" />
                                    <PermissionCheckbox checked={permisos.includes('cotizaciones.eliminar')} onChange={() => togglePermiso('cotizaciones.eliminar')} label="Eliminar cotizaciones" />
                                    <PermissionCheckbox checked={permisos.includes('cotizaciones.enviar')} onChange={() => togglePermiso('cotizaciones.enviar')} label="Enviar cotizaciones" />
                                    <PermissionCheckbox checked={permisos.includes('cotizaciones.remisionar')} onChange={() => togglePermiso('cotizaciones.remisionar')} label="Remisionar cotizaciones" />
                                 </div>
                              )}

                              {mostrarPedidos && (
                                 <div id="pedidos" style={{ minWidth: 260 }}>
                                    <h5 style={{ margin: '0 0 .5rem 0', fontWeight: 600, color: '#374151' }}>Permisos para Pedidos</h5>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 10 }}>
                                       <input
                                          className="input-gap"
                                          type="checkbox"
                                          checked={permisos.includes('pedidosAgendados.ver')}
                                          onChange={(e) => {
                                             const isChecked = e.target.checked;
                                             togglePermiso('pedidosAgendados.ver');
                                             setMostrarPedidosAgendados(prev => !prev);
                                             if (!isChecked) {
                                                setMostrarPedidosAgendados(false);
                                             }
                                          }}
                                       />
                                       <span>Pedidos agendados</span>
                                    </label>


                                    <PermissionCheckbox checked={permisos.includes('pedidosCancelados.ver')} onChange={() => togglePermiso('pedidosCancelados.ver')} label="Pedidos cancelados" />

                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 10 }}>
                                       <input
                                          className="input-gap"
                                          type="checkbox"
                                          checked={permisos.includes('remisiones.ver')}
                                          onChange={(e) => {
                                             const isChecked = e.target.checked;
                                             togglePermiso('remisiones.ver');
                                             setMostrarRemisiones(prev => !prev);
                                             if (!isChecked) {
                                                setPermisos(prev => prev.filter(p => !p.startsWith('remisiones.')));
                                                setMostrarRemisiones(false);
                                             }
                                          }}
                                       />
                                       <span>Pedidos entregados</span>
                                    </label>


                                    <PermissionCheckbox checked={permisos.includes('pedidos.enviar')} onChange={() => togglePermiso('pedidos.enviar')} label="Enviar pedidos por correo" />



                                 </div>



                              )}
                              {mostrarPedidosAgendados && (
                                 <div id="lista-productos" style={{ marginTop: 12 }}>
                                    <h6 style={{ margin: '0 0 .5rem 0', fontWeight: 600, color: '#374151' }}>Permisos para Pedidos agendados</h6>
                                    <PermissionCheckbox checked={permisos.includes('pedidosAgendados.ver')} onChange={() => togglePermiso('pedidosAgendados.ver')} label="Ver pedidos agendados" />
                                    <PermissionCheckbox checked={permisos.includes('pedidos.agendar')} onChange={() => togglePermiso('pedidos.agendar')} label="Agendar pedidos" />
                                    <PermissionCheckbox checked={permisos.includes('pedidos.remisionar')} onChange={() => togglePermiso('pedidos.remisionar')} label="Remisionar pedidos" />
                                 </div>
                              )}
                              {mostrarRemisiones && (
                                 <div id="remisiones" style={{ minWidth: 260 }}>
                                    <h6 style={{ margin: '0 0 .5rem 0', fontWeight: 600, color: '#374151' }}>Permisos para pedidos entregados</h6>
                                    <PermissionCheckbox checked={permisos.includes('remisiones.ver')} onChange={() => togglePermiso('remisiones.ver')} label="Ver remisiones" />
                                    <PermissionCheckbox checked={permisos.includes('remisiones.crear')} onChange={() => togglePermiso('remisiones.crear')} label="Crear remisiones" />
                                    <PermissionCheckbox checked={permisos.includes('remisiones.editar')} onChange={() => togglePermiso('remisiones.editar')} label="Editar remisiones" />
                                    <PermissionCheckbox checked={permisos.includes('remisiones.eliminar')} onChange={() => togglePermiso('remisiones.eliminar')} label="Eliminar remisiones" />
                                    <PermissionCheckbox checked={permisos.includes('remisiones.enviar')} onChange={() => togglePermiso('remisiones.enviar')} label="Enviar remisiones" />
                                 </div>
                              )}

                              {mostrarClientes && (
                                 <div id="lista-productos" style={{ marginTop: 12 }}>
                                    <h6 style={{ margin: '0 0 .5rem 0', fontWeight: 600, color: '#374151' }}>Permisos para Clientes</h6>
                                    <PermissionCheckbox checked={permisos.includes('clientes.crear')} onChange={() => togglePermiso('clientes.crear')} label="Crear clientes" />
                                    <PermissionCheckbox checked={permisos.includes('clientes.editar')} onChange={() => togglePermiso('clientes.editar')} label="Editar clientes" />
                                    <PermissionCheckbox checked={permisos.includes('clientes.inactivar')} onChange={() => togglePermiso('clientes.inactivar')} label="Inactivar clientes" />

                                 </div>
                              )}
                           </div>
                        </section>
                     )}

                  </div>{/* end scroll area */}

                  {/* Footer actions */}
                  <div style={{
                     display: 'flex', gap: '1.5rem', justifyContent: 'flex-end',
                     padding: '2rem 2.5rem', borderTop: '2px solid #e5e7eb',
                     backgroundColor: 'white', borderRadius: '0 0 20px 20px', flexShrink: 0
                  }}>
                     <button type="button" onClick={closeModal} style={{
                        padding: '.875rem 1.5rem', border: '2px solid #e5e7eb', borderRadius: 10,
                        backgroundColor: 'white', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: '.95rem',
                        transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '.5rem'
                     }}>
                        <i className="fa-solid fa-times icon-gap" /> <span>Cancelar</span>
                     </button>

                     <button type="submit" style={{
                        padding: '.875rem 1.5rem', border: 'none', borderRadius: 10,
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white',
                        cursor: 'pointer', fontWeight: 600, fontSize: '.95rem', transition: 'all 0.3s ease',
                        display: 'flex', alignItems: 'center', gap: '.5rem', boxShadow: '0 4px 6px -1px rgba(139,92,246,0.3)'
                     }}>
                        <i className="fa-solid fa-shield-alt icon-gap" /> <span>Crear Rol</span>
                     </button>
                  </div>
               </form>
            </div>
         )}
      </>
   );
}
