import { useEffect, useState } from 'react';
import { closeModal } from "../funciones/animaciones";
import Swal from "sweetalert2";
import api from '../api/axiosConfig';
import PropTypes from 'prop-types';

export default function EditarRol({ rol }) {
   const [nombreRol, setNombreRol] = useState('');
   const [permisos, setPermisos] = useState([]);

   const [mostrarUsuarios, setMostrarUsuarios] = useState(false);
   const mostrarListaUsuarios = permisos.includes('usuarios.ver');
   const mostrarListaRoles = permisos.includes('roles.ver');
   const [mostrarCompras, setMostrarCompras] = useState(false);
   const [mostrarProductos, setMostrarProductos] = useState(false);
   const [mostrarVentas, setMostrarVentas] = useState(false);

   const permisosUsuarios = [
      'usuarios.crear',
      'usuarios.editar',
      'usuarios.inhabilitar',
      'usuarios.eliminar'
   ];

   const permisosRoles = [
      'roles.crear',
      'roles.editar',
      'roles.inhabilitar'
   ];
   const permisosCompras = [
      'hcompras.ver',
      'compras.crear',
      'proveedores.ver',
      'proveedores.crear',
      'proveedores.editar',
      'proveedores.inactivar',
      'proveedores.activar',
      'ordenesCompra.ver',
      'ordenes.generar',
      'ordenes.editar',
      'ordenes.eliminar',
      'ordenes.aprobar',
      'reportesCompras.ver'
   ];
   const permisosProductos = [
      'productos.ver',
      'productos.crear',
      'productos.editar',
      'productos.inactivar',
      'categorias.ver',
      'categorias.crear',
      'categorias.editar',
      'categorias.inactivar',
      'subcategorias.ver',
      'subcategorias.crear',
      'subcategorias.editar',
      'subcategorias.inactivar',
      'reportesProductos.ver'
   ];
   const permisosVentas = [
      'ventas.crear',
      'listaDeVentas.ver',
      'pedidos.ver',
      'pedidos.remisionar',
      'pedidos.enviar',
      'pedidosAgendados.ver',
      'pedidosDespachados.ver',
      'pedidosEntregados.ver',
      'pedidosCancelados.ver',
      'pedidosDevueltos.ver',
      'cotizaciones.ver',
      'cotizaciones.crear',
      'cotizaciones.editar',
      'cotizaciones.eliminar',
      'cotizaciones.enviar',
      'cotizaciones.remisionar',
      'remisiones.ver',
      'remisiones.crear',
      'remisiones.editar',
      'remisiones.eliminar',
      'remisiones.enviar',
      'clientes.ver',
      'clientes.crear',
      'clientes.editar',
      'clientes.inactivar',
      'prospectos.ver',
      'reportesVentas.ver'
   ];

   const tienePermisosUsuarios = () => {
      return permisos.includes('usuarios.ver') || permisos.includes('roles.ver');
   };
   const tienePermisosCompras = () => {
      return permisos.includes('hcompras.ver') || permisos.includes('proveedores.ver') || permisos.includes('reportesCompras.ver');
   };
   const tienePermisosProductos = () => {
      return permisos.includes('productos.ver') || permisos.includes('productos.crear') || permisos.includes('productos.editar') || permisos.includes('productos.inactivar') || permisos.includes('categorias.ver') || permisos.includes('categorias.crear') || permisos.includes('categorias.editar') || permisos.includes('categorias.inactivar') || permisos.includes('subcategorias.ver') || permisos.includes('subcategorias.crear') || permisos.includes('subcategorias.editar') || permisos.includes('subcategorias.inactivar') || permisos.includes('reportesProductos.ver');
   };
   const tienePermisosVentas = () => {
      return permisos.includes('cotizaciones.crear') || permisos.includes('cotizaciones.ver') || permisos.includes('cotizaciones.editar') || permisos.includes('cotizaciones.eliminar') || permisos.includes('pedidosAgendados.ver') || permisos.includes('listaDeVentas.ver') || permisos.includes('pedidosDespachados.ver') || permisos.includes('pedidosEntregados.ver') || permisos.includes('pedidosCancelados.ver')|| permisos.includes('pedidosDevueltos.ver') || permisos.includes('reportesVentas.ver') || permisos.includes('clientes.ver') || permisos.includes('clientes.crear') || permisos.includes('clientes.editar') || permisos.includes('clientes.inactivar') || permisos.includes('prospectos.ver') || permisos.includes('reportesVentas.ver');
   };


   useEffect(() => {
      if (rol) {
         setNombreRol(rol.name || '');
         setPermisos(rol.permissions || []);
      }
   }, [rol]);

   useEffect(() => {
      if (tienePermisosUsuarios()) {
         setMostrarUsuarios(true);
      } else {
         setMostrarUsuarios(false);
      }
      if (tienePermisosCompras()) {
         setMostrarCompras(true);
      } else {
         setMostrarCompras(false);
      }
      if (tienePermisosProductos()) {
         setMostrarProductos(true);
      } else {
         setMostrarProductos(false);
      }
      if (tienePermisosVentas()) {
         setMostrarVentas(true);
      } else {
         setMostrarVentas(false);
      }
   }, [permisos]);

   const togglePermiso = (permiso) => {
      setPermisos(prev => {
         const yaIncluido = prev.includes(permiso);

         if (permiso === 'usuarios.ver' && yaIncluido) {
            return prev.filter(p => p !== 'usuarios.ver' && !permisosUsuarios.includes(p));
         }

         if (permiso === 'roles.ver' && yaIncluido) {
            return prev.filter(p => p !== 'roles.ver' && !permisosRoles.includes(p));
         }

         return yaIncluido
            ? prev.filter(p => p !== permiso)
            : [...prev, permiso];
      });
   };

   const toggleGrupoPermisos = (grupoPermisos) => {
      const todosMarcados = grupoPermisos.every(p => permisos.includes(p));
      if (todosMarcados) {
         setPermisos(prev => prev.filter(p => !grupoPermisos.includes(p)));
      } else {
         setPermisos(prev => [...new Set([...prev, ...grupoPermisos])]);
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!nombreRol.trim()) {
         return Swal.fire('Error', 'El nombre del rol es obligatorio', 'error');
      }

      if (permisos.length === 0) {
         return Swal.fire('Error', 'Selecciona al menos un permiso', 'error');
      }

      try {
         const res = await api.patch(`/api/roles/${rol._id}`, {
            name: nombreRol,
            permissions: permisos
         });

         const data = res.data || res;

         if (res.status >= 200 && res.status < 300 && data.success) {
            Swal.fire('Éxito', 'Rol actualizado correctamente', 'success');
            closeModal('edit-role-modal');
         } else {
            Swal.fire('Error', data.message || 'No se pudo actualizar el rol', 'error');
         }

      } catch (error) {
         console.error('[EditarRol]', error);
         Swal.fire('Error', 'Error del servidor al actualizar el rol', 'error');
      }
   };

   const checkboxLabelStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem',
      cursor: 'pointer',
      borderRadius: '6px',
      transition: 'background 0.2s ease'
   };

   const checkboxStyle = {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
      accentColor: '#8b5cf6'
   };

   return (
      <div 
         id="edit-role-modal"
         role="dialog"
         aria-modal="true"
         aria-labelledby="edit-role-title"
         tabIndex={0}
         style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            padding: '1rem'
         }}
         // Make backdrop focusable so click handler is keyboard-accessible
         onClick={(e) => {
            if (e.target.id === 'edit-role-modal') {
               closeModal('edit-role-modal');
            }
         }}
         onKeyDown={(e) => {
            if ((e.key === 'Escape' || e.key === 'Esc') && e.target.id === 'edit-role-modal') {
               e.preventDefault();
               closeModal('edit-role-modal');
            }
         }}
      >
         <form 
            onSubmit={handleSubmit}
            style={{
               backgroundColor: 'white',
               borderRadius: '20px',
               maxWidth: '1200px',
               width: '95%',
               maxHeight: '95vh',
               overflow: 'hidden',
               boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
               display: 'flex',
               flexDirection: 'column'
            }}
         >
            {/* Header */}
            <div style={{
               background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
               color: 'white',
               padding: '2rem',
               borderRadius: '20px 20px 0 0'
            }}>
               <h3 style={{ 
                  margin: 0, 
                  fontSize: '1.5rem', 
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
               }}>
                  <div style={{
                     width: '50px',
                     height: '50px',
                     borderRadius: '12px',
                     background: 'rgba(255, 255, 255, 0.2)',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center'
                  }}>
                     <i className="fa-solid fa-shield-alt" style={{ fontSize: '1.5rem' }} aria-hidden={true}></i>
                  </div>
                  <span>Editar Rol</span>
               </h3>
               <p style={{ 
                  margin: '0.5rem 0 0 4rem', 
                  opacity: 0.9, 
                  fontSize: '0.95rem' 
               }}>
                  Modificar permisos y configuración del rol
               </p>
            </div>

            {/* Contenido scrolleable */}
            <div style={{ 
               flex: 1,
               overflowY: 'auto',
               padding: '2rem',
               backgroundColor: '#f8fafc'
            }}>
               {/* Nombre del Rol */}
               <div style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  border: '1px solid #e2e8f0',
                  borderLeft: '4px solid #8b5cf6'
               }}>
                  <label htmlFor="nombreRol" style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.5rem',
                     marginBottom: '0.75rem',
                     fontWeight: '600',
                     color: '#374151',
                     fontSize: '0.95rem'
                  }}>
                     <i className="fa-solid fa-tag" style={{ color: '#8b5cf6' }} aria-hidden={true}></i>
                    <span>Nombre del Rol <span style={{ color: '#ef4444' }}>*</span></span>
                  </label>
                  <input 
                     id="nombreRol"
                     type="text" 
                     value={nombreRol} 
                     onChange={(e) => setNombreRol(e.target.value)}
                     required
                     style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease',
                        boxSizing: 'border-box'
                     }}
                     onFocus={(e) => {
                        e.target.style.borderColor = '#8b5cf6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                     }}
                     onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                     }}
                  />
               </div>

               {/* Selección de Módulos */}
               <div style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  border: '1px solid #e2e8f0'
               }}>
                  <h4 style={{
                     margin: '0 0 1rem 0',
                     color: '#1e293b',
                     fontSize: '1.05rem',
                     fontWeight: '600'
                  }}>
                     <i className="fa-solid fa-cubes icon-gap" style={{ color: '#8b5cf6' }} aria-hidden={true}></i>
                    <span>Módulos con Acceso</span>
                  </h4>
                  <div style={{
                     display: 'grid',
                     gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                     gap: '1rem'
                  }}>
                     <label style={checkboxLabelStyle}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                     >
                        <input
                           type="checkbox"
                           checked={mostrarUsuarios}
                           onChange={(e) => {
                              const isChecked = e.target.checked;
                              setMostrarUsuarios(isChecked);
                              if (!isChecked) {
                                 setPermisos(prev =>
                                    prev.filter(p =>
                                       !p.startsWith('usuarios.') && !p.startsWith('roles.')
                                    )
                                 );
                              }

                                 EditarRol.propTypes = {
                                    rol: PropTypes.shape({
                                       _id: PropTypes.string,
                                       name: PropTypes.string,
                                       permissions: PropTypes.arrayOf(PropTypes.string)
                                    })
                                 };

                           }}
                           style={checkboxStyle}
                        />
                        <i className="fa-solid fa-users" style={{ color: '#3b82f6' }} aria-hidden={true}></i>
                        <span style={{ fontWeight: '500' }}>Usuarios</span>
                     </label>

                     <label style={checkboxLabelStyle}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                     >
                        <input
                           type="checkbox"
                           checked={mostrarCompras}
                           onChange={(e) => setMostrarCompras(e.target.checked)}
                           style={checkboxStyle}
                        />
                        <i className="fa-solid fa-shopping-cart" style={{ color: '#10b981' }} aria-hidden={true}></i>
                        <span style={{ fontWeight: '500' }}>Compras</span>
                     </label>

                     <label style={checkboxLabelStyle}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                     >
                        <input
                           type="checkbox"
                           checked={mostrarProductos}
                           onChange={(e) => setMostrarProductos(e.target.checked)}
                           style={checkboxStyle}
                        />
                        <i className="fa-solid fa-box" style={{ color: '#f59e0b' }} aria-hidden={true}></i>
                        <span style={{ fontWeight: '500' }}>Productos</span>
                     </label>

                     <label style={checkboxLabelStyle}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                     >
                        <input
                           type="checkbox"
                           checked={mostrarVentas}
                           onChange={(e) => setMostrarVentas(e.target.checked)}
                           style={checkboxStyle}
                        />
                        <i className="fa-solid fa-chart-line" style={{ color: '#ec4899' }} aria-hidden={true}></i>
                        <span style={{ fontWeight: '500' }}>Ventas</span>
                     </label>
                  </div>
               </div>

               {/* Módulo Usuarios */}
               {mostrarUsuarios && (
                  <div style={{
                     background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.1))',
                     padding: '1.5rem',
                     borderRadius: '12px',
                     marginBottom: '1.5rem',
                     border: '2px solid #3b82f6',
                     borderLeft: '6px solid #3b82f6'
                  }}>
                     <h4 style={{
                        margin: '0 0 1.25rem 0',
                        color: '#1e40af',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                     }}>
                        <i className="fa-solid fa-users" aria-hidden={true}></i>
                        <span>Permisos Módulo Usuarios</span>
                     </h4>

                     <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1rem'
                     }}>
                        <label style={checkboxLabelStyle}
                           onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)'}
                           onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                           <input
                              type="checkbox"
                              checked={permisos.includes('usuarios.ver')}
                              onChange={() => togglePermiso('usuarios.ver')}
                              style={checkboxStyle}
                           />
                           <span style={{ fontWeight: '500' }}>Lista de usuarios</span>
                        </label>

                        <label style={checkboxLabelStyle}
                           onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)'}
                           onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                           <input
                              type="checkbox"
                              checked={permisos.includes('roles.ver')}
                              onChange={() => togglePermiso('roles.ver')}
                              style={checkboxStyle}
                           />
                           <span style={{ fontWeight: '500' }}>Roles y permisos</span>
                        </label>
                     </div>

                     {mostrarListaUsuarios && (
                        <div style={{
                           backgroundColor: 'white',
                           padding: '1.25rem',
                           borderRadius: '10px',
                           marginTop: '1rem',
                           border: '1px solid #dbeafe'
                        }}>
                           <p style={{
                              margin: '0 0 1rem 0',
                              fontWeight: '600',
                              color: '#1e40af',
                              fontSize: '0.95rem'
                           }}>
                              Permisos para Lista de Usuarios
                           </p>
                           <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '0.75rem'
                           }}>
                              {[
                                 { key: 'usuarios.crear', label: 'Crear usuarios' },
                                 { key: 'usuarios.editar', label: 'Editar usuarios' },
                                 { key: 'usuarios.inhabilitar', label: 'Habilitar / Inhabilitar' },
                                 { key: 'usuarios.eliminar', label: 'Eliminar usuarios' }
                              ].map(p => (
                                 <label key={p.key} style={checkboxLabelStyle}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                 >
                                    <input
                                       type="checkbox"
                                       checked={permisos.includes(p.key)}
                                       onChange={() => togglePermiso(p.key)}
                                       style={checkboxStyle}
                                    />
                                    <span>{p.label}</span>
                                 </label>
                              ))}
                              <label style={{
                                 ...checkboxLabelStyle,
                                 backgroundColor: '#eff6ff',
                                 border: '2px solid #3b82f6',
                                 fontWeight: '600'
                              }}>
                                 <input
                                    type="radio"
                                    name="usersListPermissions"
                                    onClick={() => toggleGrupoPermisos(permisosUsuarios)}
                                    checked={permisosUsuarios.every(p => permisos.includes(p))}
                                    style={{ ...checkboxStyle, accentColor: '#3b82f6' }}
                                 />
                                 <span>Todos los permisos</span>
                              </label>
                           </div>
                        </div>
                     )}

                     {mostrarListaRoles && (
                        <div style={{
                           backgroundColor: 'white',
                           padding: '1.25rem',
                           borderRadius: '10px',
                           marginTop: '1rem',
                           border: '1px solid #dbeafe'
                        }}>
                           <p style={{
                              margin: '0 0 1rem 0',
                              fontWeight: '600',
                              color: '#1e40af',
                              fontSize: '0.95rem'
                           }}>
                              Permisos para Roles y Permisos
                           </p>
                           <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '0.75rem'
                           }}>
                              {[
                                 { key: 'roles.crear', label: 'Crear roles' },
                                 { key: 'roles.editar', label: 'Editar roles' },
                                 { key: 'roles.inhabilitar', label: 'Habilitar / Inhabilitar' }
                              ].map(p => (
                                 <label key={p.key} style={checkboxLabelStyle}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                 >
                                    <input
                                       type="checkbox"
                                       checked={permisos.includes(p.key)}
                                       onChange={() => togglePermiso(p.key)}
                                       style={checkboxStyle}
                                    />
                                    <span>{p.label}</span>
                                 </label>
                              ))}
                              <label style={{
                                 ...checkboxLabelStyle,
                                 backgroundColor: '#eff6ff',
                                 border: '2px solid #3b82f6',
                                 fontWeight: '600'
                              }}>
                                 <input
                                    type="radio"
                                    name="rolesPermissions"
                                    onClick={() => toggleGrupoPermisos(permisosRoles)}
                                    checked={permisosRoles.every(p => permisos.includes(p))}
                                    style={{ ...checkboxStyle, accentColor: '#3b82f6' }}
                                 />
                                 <span>Todos los permisos</span>
                              </label>
                           </div>
                        </div>
                     )}
                  </div>
               )}

               {/* Módulo Compras */}
               {mostrarCompras && (
                  <div style={{
                     background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.1))',
                     padding: '1.5rem',
                     borderRadius: '12px',
                     marginBottom: '1.5rem',
                     border: '2px solid #10b981',
                     borderLeft: '6px solid #10b981'
                  }}>
                     <h4 style={{
                        margin: '0 0 1.25rem 0',
                        color: '#065f46',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                     }}>
                        <i className="fa-solid fa-shopping-cart" aria-hidden={true}></i>
                        <span>Permisos Módulo Compras</span>
                     </h4>

                     <div style={{
                        backgroundColor: 'white',
                        padding: '1.25rem',
                        borderRadius: '10px',
                        border: '1px solid #d1fae5'
                     }}>
                        <div style={{
                           display: 'grid',
                           gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                           gap: '0.75rem'
                        }}>
                           {[
                              { key: 'hcompras.ver', label: 'Historial de compras' },
                              { key: 'compras.crear', label: 'Registrar compras' },
                              { key: 'proveedores.ver', label: 'Catálogo de proveedores' },
                              { key: 'proveedores.crear', label: 'Crear proveedores' },
                              { key: 'proveedores.editar', label: 'Editar proveedores' },
                              { key: 'proveedores.inactivar', label: 'Inactivar proveedores' },
                              { key: 'proveedores.activar', label: 'Activar proveedores' },
                              { key: 'ordenesCompra.ver', label: 'Ver órdenes de compra' },
                              { key: 'ordenes.generar', label: 'Generar órdenes' },
                              { key: 'ordenes.editar', label: 'Editar órdenes' },
                              { key: 'ordenes.eliminar', label: 'Eliminar órdenes' },
                              { key: 'ordenes.aprobar', label: 'Aprobar órdenes' },
                              { key: 'reportesCompras.ver', label: 'Ver reportes' }
                           ].map(p => (
                              <label key={p.key} style={checkboxLabelStyle}
                                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                 <input
                                    type="checkbox"
                                    checked={permisos.includes(p.key)}
                                    onChange={() => togglePermiso(p.key)}
                                    style={checkboxStyle}
                                 />
                                 <span>{p.label}</span>
                              </label>
                           ))}
                           <label style={{
                              ...checkboxLabelStyle,
                              backgroundColor: '#d1fae5',
                              border: '2px solid #10b981',
                              fontWeight: '600'
                           }}>
                              <input
                                 type="radio"
                                 name="comprasPermissions"
                                 onClick={() => toggleGrupoPermisos(permisosCompras)}
                                 checked={permisosCompras.every(p => permisos.includes(p))}
                                 style={{ ...checkboxStyle, accentColor: '#10b981' }}
                              />
                              <span>Todos los permisos</span>
                           </label>
                        </div>
                     </div>
                  </div>
               )}

               {/* Módulo Productos */}
               {mostrarProductos && (
                  <div style={{
                     background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.1))',
                     padding: '1.5rem',
                     borderRadius: '12px',
                     marginBottom: '1.5rem',
                     border: '2px solid #f59e0b',
                     borderLeft: '6px solid #f59e0b'
                  }}>
                     <h4 style={{
                        margin: '0 0 1.25rem 0',
                        color: '#92400e',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                     }}>
                        <i className="fa-solid fa-box" aria-hidden={true}></i>
                        <span>Permisos Módulo Productos</span>
                     </h4>

                     <div style={{
                        backgroundColor: 'white',
                        padding: '1.25rem',
                        borderRadius: '10px',
                        border: '1px solid #fef3c7'
                     }}>
                        <div style={{
                           display: 'grid',
                           gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                           gap: '0.75rem',
                           marginBottom: '1rem'
                        }}>
                           {[
                              { key: 'productos.ver', label: 'Lista de productos' },
                              { key: 'categorias.ver', label: 'Ver categorías' },
                              { key: 'categorias.crear', label: 'Crear categorías' },
                              { key: 'categorias.editar', label: 'Editar categorías' },
                              { key: 'categorias.inactivar', label: 'Inactivar categorías' },
                              { key: 'subcategorias.ver', label: 'Ver subcategorías' },
                              { key: 'subcategorias.crear', label: 'Crear subcategorías' },
                              { key: 'subcategorias.editar', label: 'Editar subcategorías' },
                              { key: 'subcategorias.inactivar', label: 'Inactivar subcategorías' },
                              { key: 'reportesProductos.ver', label: 'Reportes' }
                           ].map(p => (
                              <label key={p.key} style={checkboxLabelStyle}
                                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                 <input
                                    type="checkbox"
                                    checked={permisos.includes(p.key)}
                                    onChange={() => togglePermiso(p.key)}
                                    style={checkboxStyle}
                                 />
                                 <span>{p.label}</span>
                              </label>
                           ))}
                        </div>

                        <div style={{
                           borderTop: '2px solid #fef3c7',
                           paddingTop: '1rem'
                        }}>
                           <p style={{
                              margin: '0 0 0.75rem 0',
                              fontWeight: '600',
                              color: '#92400e',
                              fontSize: '0.95rem'
                           }}>
                              Permisos para Lista de Productos
                           </p>
                           <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '0.75rem'
                           }}>
                              {[
                                 { key: 'productos.crear', label: 'Agregar Productos' },
                                 { key: 'productos.editar', label: 'Editar productos' },
                                 { key: 'productos.inactivar', label: 'Activar/Inactivar' }
                              ].map(p => (
                                 <label key={p.key} style={checkboxLabelStyle}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                 >
                                    <input
                                       type="checkbox"
                                       checked={permisos.includes(p.key)}
                                       onChange={() => togglePermiso(p.key)}
                                       style={checkboxStyle}
                                    />
                                    <span>{p.label}</span>
                                 </label>
                              ))}
                              <label style={{
                                 ...checkboxLabelStyle,
                                 backgroundColor: '#fef3c7',
                                 border: '2px solid #f59e0b',
                                 fontWeight: '600'
                              }}>
                                 <input
                                    type="radio"
                                    name="productosPermissions"
                                    onClick={() => toggleGrupoPermisos(permisosProductos)}
                                    checked={permisosProductos.every(p => permisos.includes(p))}
                                    style={{ ...checkboxStyle, accentColor: '#f59e0b' }}
                                 />
                                 <span>Todos los permisos</span>
                              </label>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* Módulo Ventas */}
               {mostrarVentas && (
                  <div style={{
                     background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05), rgba(236, 72, 153, 0.1))',
                     padding: '1.5rem',
                     borderRadius: '12px',
                     marginBottom: '1.5rem',
                     border: '2px solid #ec4899',
                     borderLeft: '6px solid #ec4899'
                  }}>
                     <h4 style={{
                        margin: '0 0 1.25rem 0',
                        color: '#9f1239',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                     }}>
                        <i className="fa-solid fa-chart-line" aria-hidden={true}></i>
                        <span>Permisos Módulo Ventas</span>
                     </h4>

                     <div style={{
                        backgroundColor: 'white',
                        padding: '1.25rem',
                        borderRadius: '10px',
                        border: '1px solid #fce7f3'
                     }}>
                        <div style={{
                           display: 'grid',
                           gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                           gap: '0.75rem'
                        }}>
                           {[
                              { key: 'ventas.crear', label: 'Crear ventas' },
                              { key: 'listaDeVentas.ver', label: 'Lista de ventas' },
                              { key: 'pedidos.ver', label: 'Ver pedidos' },
                              { key: 'pedidos.remisionar', label: 'Remisionar pedidos' },
                              { key: 'pedidos.enviar', label: 'Enviar pedidos' },
                              { key: 'pedidosAgendados.ver', label: 'Pedidos agendados' },
                              { key: 'pedidosDespachados.ver', label: 'Pedidos despachados' },
                              { key: 'pedidosEntregados.ver', label: 'Pedidos entregados' },
                              { key: 'pedidosCancelados.ver', label: 'Pedidos cancelados' },
                              { key: 'pedidosDevueltos.ver', label: 'Pedidos devueltos' },
                              { key: 'cotizaciones.ver', label: 'Ver cotizaciones' },
                              { key: 'cotizaciones.crear', label: 'Crear cotizaciones' },
                              { key: 'cotizaciones.editar', label: 'Editar cotizaciones' },
                              { key: 'cotizaciones.eliminar', label: 'Eliminar cotizaciones' },
                              { key: 'cotizaciones.enviar', label: 'Enviar cotizaciones' },
                              { key: 'cotizaciones.remisionar', label: 'Remisionar cotizaciones' },
                              { key: 'remisiones.ver', label: 'Ver remisiones' },
                              { key: 'remisiones.crear', label: 'Crear remisiones' },
                              { key: 'remisiones.editar', label: 'Editar remisiones' },
                              { key: 'remisiones.eliminar', label: 'Eliminar remisiones' },
                              { key: 'remisiones.enviar', label: 'Enviar remisiones' },
                              { key: 'clientes.ver', label: 'Ver clientes' },
                              { key: 'clientes.crear', label: 'Crear clientes' },
                              { key: 'clientes.editar', label: 'Editar clientes' },
                              { key: 'clientes.inactivar', label: 'Inactivar clientes' },
                              { key: 'prospectos.ver', label: 'Ver prospectos' },
                              { key: 'reportesVentas.ver', label: 'Reportes de ventas' }
                           ].map(p => (
                              <label key={p.key} style={checkboxLabelStyle}
                                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                 <input
                                    type="checkbox"
                                    checked={permisos.includes(p.key)}
                                    onChange={() => togglePermiso(p.key)}
                                    style={checkboxStyle}
                                 />
                                 <span>{p.label}</span>
                              </label>
                           ))}
                           <label style={{
                              ...checkboxLabelStyle,
                              backgroundColor: '#fce7f3',
                              border: '2px solid #ec4899',
                              fontWeight: '600'
                           }}>
                              <input
                                 type="radio"
                                 name="ventasPermissions"
                                 onClick={() => toggleGrupoPermisos(permisosVentas)}
                                 checked={permisosVentas.every(p => permisos.includes(p))}
                                 style={{ ...checkboxStyle, accentColor: '#ec4899' }}
                              />
                              <span>Todos los permisos</span>
                           </label>
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {/* Footer con botones */}
            <div style={{ 
               display: 'flex', 
               gap: '1rem', 
               justifyContent: 'flex-end',
               padding: '2rem',
               borderTop: '2px solid #e5e7eb',
               backgroundColor: 'white',
               borderRadius: '0 0 20px 20px'
            }}>
               <button 
                  type="button" 
                  onClick={() => closeModal('edit-role-modal')}
                  style={{
                     padding: '0.875rem 1.5rem',
                     border: '2px solid #e5e7eb',
                     borderRadius: '10px',
                     backgroundColor: 'white',
                     color: '#374151',
                     cursor: 'pointer',
                     fontWeight: '600',
                     fontSize: '0.95rem',
                     transition: 'all 0.3s ease',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                     e.target.style.backgroundColor = '#f3f4f6';
                     e.target.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                     e.target.style.backgroundColor = 'white';
                     e.target.style.borderColor = '#e5e7eb';
                  }}
               >
                  <i className="fa-solid fa-times" aria-hidden={true}></i>
                  <span>Cancelar</span>
               </button>
               
               <button 
                  type="submit"
                  style={{
                     padding: '0.875rem 1.5rem',
                     border: 'none',
                     borderRadius: '10px',
                     background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                     color: 'white',
                     cursor: 'pointer',
                     fontWeight: '600',
                     fontSize: '0.95rem',
                     transition: 'all 0.3s ease',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.5rem',
                     boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                     e.target.style.transform = 'translateY(-1px)';
                     e.target.style.boxShadow = '0 6px 12px -1px rgba(139, 92, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                     e.target.style.transform = 'translateY(0)';
                     e.target.style.boxShadow = '0 4px 6px -1px rgba(139, 92, 246, 0.3)';
                  }}
               >
                  <i className="fa-solid fa-save" aria-hidden={true}></i>
                  <span>Guardar Cambios</span>
               </button>
            </div>
         </form>
      </div>
   );
}
