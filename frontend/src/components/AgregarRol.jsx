import { useState, useEffect } from "react";
import { toggleSubMenu } from "../funciones/animaciones";
import { registerModalRol } from "../funciones/modalController";
import Swal from "sweetalert2";

export default function AgregarRol() {
   const [isVisible, setIsVisible] = useState(false);
   const [nombreRol, setNombreRol] = useState('');
   const [permisos, setPermisos] = useState([]);

   const [mostrarUsuarios, setMostrarUsuarios] = useState(false);
   const [mostrarListaUsuarios, setMostrarListaUsuarios] = useState(false);
   const [mostrarListaRoles, setMostrarListaRoles] = useState(false);
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
      'roles.ver',
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


   // Manejo de cambios en checkboxes
   const togglePermiso = (permiso) => {
      setPermisos(prev =>
         prev.includes(permiso)
            ? prev.filter(p => p !== permiso)
            : [...prev, permiso]
      );
   };

   const toggleGrupoPermisos = (grupoPermisos) => {
      const todosMarcados = grupoPermisos.every(p => permisos.includes(p));
      if (todosMarcados) {
         // Si todos ya están marcados → los quitamos
         setPermisos(prev => prev.filter(p => !grupoPermisos.includes(p)));
      } else {
         // Si hay al menos uno sin marcar → los agregamos todos
         setPermisos(prev => [...new Set([...prev, ...grupoPermisos])]);
      }
   };


   // Función para cerrar el modal
   const closeModal = () => {
      setIsVisible(false);
   };

   // Registrar el modal al montar el componente
   useEffect(() => {
      registerModalRol(setIsVisible);
   }, []);

   // Función para abrir el modal (puede ser llamada desde el componente padre)
   window.openModalRol = () => {
      setIsVisible(true);
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
         const token = localStorage.getItem('token');

         const response = await fetch('/api/roles', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ name: nombreRol, permissions: permisos })
         });

         const data = await response.json();

         if (data.success) {
            Swal.fire('Éxito', 'Rol creado correctamente', 'success');
            setNombreRol('');
            setPermisos([]);
            closeModal();
         } else {
            Swal.fire('Error', data.message || 'No se pudo crear el rol', 'error');
         }

      } catch (error) {
         console.error('[AgregarRol]', error);
         Swal.fire('Error', 'Error del servidor al crear el rol', 'error');
      }
   };



   return (
      <>
         {isVisible && (
            <div style={{
               position: 'fixed',
               top: 0,
               left: 0,
               right: 0,
               bottom: 0,
               backgroundColor: 'rgba(0, 0, 0, 0.6)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               zIndex: 1000,
               backdropFilter: 'blur(4px)',
               margin: 0,
               padding: 0
            }}>
               <form onSubmit={handleSubmit} style={{
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  maxWidth: '1200px',
                  width: '95%',
                  maxHeight: '95vh',
                  overflow: 'hidden',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  animation: 'modalSlideIn 0.3s ease-out',
                  margin: 0,
                  padding: 0,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column'
               }}>
                  {/* Header del modal */}
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
                           <i className="fa-solid fa-shield-alt" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        Crear Nuevo Rol
                     </h3>
                     <p style={{ 
                        margin: '0.5rem 0 0 4rem', 
                        opacity: 0.9, 
                        fontSize: '0.95rem' 
                     }}>
                        Configure los permisos y accesos para el nuevo rol de usuario
                     </p>
                  </div>

                  {/* Contenido scrolleable */}
                  <div style={{ 
                     flex: 1,
                     overflowY: 'auto',
                     padding: '2.5rem',
                     backgroundColor: '#f8fafc'
                  }}>
                  {/* Nombre del rol */}
                  <div style={{
                     background: 'white',
                     padding: '2rem',
                     borderRadius: '12px',
                     marginBottom: '2rem',
                     border: '1px solid #e2e8f0',
                     borderLeft: '4px solid #8b5cf6'
                  }}>
                     <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '1.1rem'
                     }}>
                        <i className="fa-solid fa-tag" style={{ color: '#8b5cf6', fontSize: '1rem' }}></i>
                        Nombre del Rol
                        <span style={{ color: '#ef4444' }}>*</span>
                     </label>
                     <input 
                        className='entrada' 
                        type="text" 
                        value={nombreRol} 
                        onChange={(e) => setNombreRol(e.target.value)}
                        placeholder="Ej: Administrador, Vendedor, Supervisor..."
                        style={{
                           width: '100%',
                           padding: '0.875rem 1rem',
                           border: '2px solid #e5e7eb',
                           borderRadius: '10px',
                           fontSize: '1rem',
                           transition: 'all 0.3s ease',
                           backgroundColor: '#ffffff',
                           fontFamily: 'inherit',
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

                  {/* Selección de módulos */}
                  <div style={{
                     background: 'white',
                     padding: '2rem',
                     borderRadius: '12px',
                     marginBottom: '2rem',
                     border: '1px solid #e2e8f0',
                     borderLeft: '4px solid #10b981'
                  }}>
                     <h4 style={{
                        margin: '0 0 1.5rem 0',
                        color: '#1e293b',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                     }}>
                        <i className="fa-solid fa-cube" style={{ color: '#10b981' }}></i>
                        Módulos con Acceso
                     </h4>
                     
                     <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '1.5rem'
                     }}>
                        {/* Módulo Usuarios */}
                        <div style={{
                           background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                           border: '2px solid #bae6fd',
                           borderRadius: '10px',
                           padding: '1.25rem',
                           transition: 'all 0.3s ease'
                        }}>
                           <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: '600',
                              color: '#0c4a6e'
                           }}>
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
                                 }}
                                 style={{
                                    width: '18px',
                                    height: '18px',
                                    accentColor: '#0284c7'
                                 }}
                              />
                              <i className="fa-solid fa-users" style={{ color: '#0284c7' }}></i>
                              Usuarios
                           </label>
                        </div>

                        {/* Módulo Compras */}
                        <div style={{
                           background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                           border: '2px solid #bbf7d0',
                           borderRadius: '10px',
                           padding: '1.25rem',
                           transition: 'all 0.3s ease'
                        }}>
                           <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: '600',
                              color: '#14532d'
                           }}>
                              <input
                                 type="checkbox"
                                 checked={mostrarCompras}
                                 onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setMostrarCompras(isChecked);
                                 }}
                                 style={{
                                    width: '18px',
                                    height: '18px',
                                    accentColor: '#059669'
                                 }}
                              />
                              <i className="fa-solid fa-shopping-cart" style={{ color: '#059669' }}></i>
                              Compras
                           </label>
                        </div>

                        {/* Módulo Productos */}
                        <div style={{
                           background: 'linear-gradient(135deg, #fefce8, #fef3c7)',
                           border: '2px solid #fde68a',
                           borderRadius: '10px',
                           padding: '1.25rem',
                           transition: 'all 0.3s ease'
                        }}>
                           <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: '600',
                              color: '#92400e'
                           }}>
                              <input
                                 type="checkbox"
                                 checked={mostrarProductos}
                                 onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setMostrarProductos(isChecked);
                                 }}
                                 style={{
                                    width: '18px',
                                    height: '18px',
                                    accentColor: '#d97706'
                                 }}
                              />
                              <i className="fa-solid fa-box" style={{ color: '#d97706' }}></i>
                              Productos
                           </label>
                        </div>

                        {/* Módulo Ventas */}
                        <div style={{
                           background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
                           border: '2px solid #f9a8d4',
                           borderRadius: '10px',
                           padding: '1.25rem',
                           transition: 'all 0.3s ease'
                        }}>
                           <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: '600',
                              color: '#831843'
                           }}>
                              <input
                                 type="checkbox"
                                 checked={mostrarVentas}
                                 onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setMostrarVentas(isChecked);
                                 }}
                                 style={{
                                    width: '18px',
                                    height: '18px',
                                    accentColor: '#be185d'
                                 }}
                              />
                              <i className="fa-solid fa-chart-line" style={{ color: '#be185d' }}></i>
                              Ventas
                           </label>
                        </div>
                     </div>
                  </div>
               {mostrarUsuarios && (
                  <div className="section" id='permisos-usuarios'>
                     <h4>Permisos módulo usuarios</h4>
                     <br />
                     <div class="permissions">
                        <div className="group">
                           <label >
                              <input
                                 style={{ marginRight: '0.5rem', marginBottom: '.5rem' }}
                                 type="checkbox"
                                 checked={permisos.includes('usuarios.ver')}
                                 onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    togglePermiso('usuarios.ver');
                                    setMostrarListaUsuarios(prev => !prev);
                                    if (!isChecked) {
                                       // Filtra los permisos eliminando los relacionados con lista de usuarios 
                                       setPermisos(prev =>
                                          prev.filter(p =>
                                             !p.startsWith('usuarios.')
                                          )
                                       );
                                    }
                                 }}
                              />
                              Lista de usuarios

                           </label>
                           <br />

                        </div>
                        <div className="group">
                           <label>
                              <input
                                 style={{ marginRight: '0.5rem', marginBottom: '.5rem' }}
                                 type="checkbox"
                                 checked={permisos.includes('roles.ver')}
                                 onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    togglePermiso('roles.ver');
                                    setMostrarListaRoles(prev => !prev);
                                    if (!isChecked) {
                                       // Filtra los permisos eliminando los relacionados con lista de roles
                                       setPermisos(prev =>
                                          prev.filter(p =>
                                             !p.startsWith('roles.')
                                          )
                                       );
                                    }
                                 }} />
                              Roles y permisos
                           </label>
                           <br />
                        </div>
                        <br />

                     </div>
                     <br />
                     {mostrarListaUsuarios && (
                        <div class="form-group-rol" id='lista-usuarios'>
                           <label>Permisos para lista de usuarios</label>
                           <div class="radio-options">
                              <input type="checkbox"
                                 checked={permisos.includes('usuarios.crear')}
                                 onChange={() => togglePermiso('usuarios.crear')}
                              /> Crear usuarios
                              <input type="checkbox"
                                 checked={permisos.includes('usuarios.editar')}
                                 onChange={() => togglePermiso('usuarios.editar')}
                              /> Editar usuarios
                              <input type="checkbox"
                                 checked={permisos.includes('usuarios.inhabilitar')}
                                 onChange={() => togglePermiso('usuarios.inhabilitar')}
                              /> Habilitar / Inhabilitar
                              <input type="checkbox"
                                 checked={permisos.includes('usuarios.eliminar')}
                                 onChange={() => togglePermiso('usuarios.eliminar')}
                              /> Eliminar usuarios
                              <input
                                 type="radio"
                                 name="usersListPermissions"
                                 onClick={() => toggleGrupoPermisos(permisosUsuarios)}
                                 checked={permisosUsuarios.every(p => permisos.includes(p))}
                              /> Todos los permisos

                           </div>
                        </div>
                     )}

                     {mostrarListaRoles && (
                        <div class="form-group-rol" id='roles-y-permisos'>
                           <label>Permisos para roles y permisos</label>
                           <div className="radio-options">
                              <input
                                 type="checkbox"
                                 checked={permisos.includes('roles.crear')}
                                 onChange={() => togglePermiso('roles.crear')}
                              /> Crear roles

                              <input
                                 type="checkbox"
                                 checked={permisos.includes('roles.editar')}
                                 onChange={() => togglePermiso('roles.editar')}
                              /> Editar roles

                              <input
                                 type="checkbox"
                                 checked={permisos.includes('roles.inhabilitar')}
                                 onChange={() => togglePermiso('roles.inhabilitar')}
                              /> Habilitar / Inhabilitar

                              <input
                                 type="radio"
                                 name="rolesPermissions"
                                 onClick={() => toggleGrupoPermisos(permisosRoles)}
                                 checked={permisosRoles.every(p => permisos.includes(p))}
                              /> Todos los permisos
                           </div>
                        </div>
                     )}

                  </div>
               )}

               {mostrarCompras && (
                  <div className="section" id='permisos-compras'>
                     <h4>Permisos módulo compras</h4>
                     <br />
                     <div class="permissions">
                        <div className="group">
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" name="hcompras" checked={permisos.includes('hcompras.ver')}
                                 onChange={() => togglePermiso('hcompras.ver')} />
                              Historial de compras
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('compras.crear')} onChange={() => togglePermiso('compras.crear')} />
                              Registrar compras
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('proveedores.ver')} onChange={() => togglePermiso('proveedores.ver')} />
                              Catálogo de proveedores
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('proveedores.crear')} onChange={() => togglePermiso('proveedores.crear')} />
                              Crear proveedores
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('proveedores.editar')} onChange={() => togglePermiso('proveedores.editar')} />
                              Editar proveedores
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('proveedores.inactivar')} onChange={() => togglePermiso('proveedores.inactivar')} />
                              Inactivar proveedores
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('proveedores.activar')} onChange={() => togglePermiso('proveedores.activar')} />
                              Activar proveedores
                           </label>
                        </div>
                        <div className="group">
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('ordenesCompra.ver')} onChange={() => togglePermiso('ordenesCompra.ver')} />
                              Ver órdenes de compra
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('ordenes.generar')} onChange={() => togglePermiso('ordenes.generar')} />
                              Generar órdenes
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('ordenes.editar')} onChange={() => togglePermiso('ordenes.editar')} />
                              Editar órdenes
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('ordenes.eliminar')} onChange={() => togglePermiso('ordenes.eliminar')} />
                              Eliminar órdenes
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('ordenes.aprobar')} onChange={() => togglePermiso('ordenes.aprobar')} />
                              Aprobar órdenes
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('reportesCompras.ver')} onChange={() => togglePermiso('reportesCompras.ver')} />
                              Ver reportes
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="radio" name="comprasPermissions"
                                 onClick={() => toggleGrupoPermisos(permisosCompras)}
                                 checked={permisosCompras.every(p => permisos.includes(p))} />
                              Todos los permisos
                           </label>
                        </div>
                     </div>
                     <br />

                  </div>
               )}

               {mostrarProductos && (
                  <div className="section" id='permisos-productos'>
                     <h4>Permisos módulo productos</h4>
                     <br />
                     <div class="permissions">

                        <div className="group">
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('productos.ver')} onChange={() => { toggleSubMenu('lista-productos'); togglePermiso('productos.ver') }} />
                              Lista de productos
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('categorias.ver')} onChange={() => togglePermiso('categorias.ver')} />
                              Ver categorías
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('categorias.crear')} onChange={() => togglePermiso('categorias.crear')} />
                              Crear categorías
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('categorias.editar')} onChange={() => togglePermiso('categorias.editar')} />
                              Editar categorías
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('categorias.inactivar')} onChange={() => togglePermiso('categorias.inactivar')} />
                              Inactivar categorías
                           </label>
                        </div>
                        <div className="group">
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('subcategorias.ver')} onChange={() => togglePermiso('subcategorias.ver')} />
                              Ver subcategorías
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('subcategorias.crear')} onChange={() => togglePermiso('subcategorias.crear')} />
                              Crear subcategorías
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('subcategorias.editar')} onChange={() => togglePermiso('subcategorias.editar')} />
                              Editar subcategorías
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('subcategorias.inactivar')} onChange={() => togglePermiso('subcategorias.inactivar')} />
                              Inactivar subcategorías
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('reportesProductos.ver')} onChange={() => togglePermiso('reportesProductos.ver')} />
                              Reportes
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="radio" name="productosPermissions"
                                 onClick={() => toggleGrupoPermisos(permisosProductos)}
                                 checked={permisosProductos.every(p => permisos.includes(p))} />
                              Todos los permisos
                           </label>
                        </div>
                     </div>
                     <br />

                     <div class="form-group-rol " id="lista-productos">
                        <label>Permisos para lista de productos</label>
                        <div className="radio-options">
                           <input
                              type="checkbox"
                              checked={permisos.includes('productos.crear')}
                              onChange={() => togglePermiso('productos.crear')}
                           /> Agregar Productos

                           <input
                              type="checkbox"
                              checked={permisos.includes('productos.editar')}
                              onChange={() => togglePermiso('productos.editar')}
                           /> Editar productos

                           <input
                              type="checkbox"
                              checked={permisos.includes('productos.inactivar')}
                              onChange={() => togglePermiso('productos.inactivar')}
                           /> Activar/Inactivar

                           <input
                              type="radio"
                           /> Todos los permisos
                        </div>
                     </div>
                  </div>
               )}


               {mostrarVentas && (
                  <div className="section" id='permisos-ventas'>
                     <h4>Permisos módulo ventas</h4>
                     <br />
                     <div class="permissions">
                        <div className="group">
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('ventas.crear')}
                                 onChange={() => togglePermiso('ventas.crear')} />
                              Crear ventas
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('listaDeVentas.ver')}
                                 onChange={() => togglePermiso('listaDeVentas.ver')} />
                              Lista de ventas
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('pedidos.ver')}
                                 onChange={() => togglePermiso('pedidos.ver')} />
                              Ver pedidos
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('pedidos.remisionar')}
                                 onChange={() => togglePermiso('pedidos.remisionar')} />
                              Remisionar pedidos
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('pedidos.enviar')}
                                 onChange={() => togglePermiso('pedidos.enviar')} />
                              Enviar pedidos
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('pedidosAgendados.ver')}
                                 onChange={() => togglePermiso('pedidosAgendados.ver')} />
                              Pedidos agendados
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('pedidosDespachados.ver')}
                                 onChange={() => togglePermiso('pedidosDespachados.ver')} />
                              Pedidos despachados
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('pedidosEntregados.ver')}
                                 onChange={() => togglePermiso('pedidosEntregados.ver')} />
                              Pedidos entregados
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('pedidosCancelados.ver')}
                                 onChange={() => togglePermiso('pedidosCancelados.ver')} />
                              Pedidos cancelados
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('pedidosDevueltos.ver')}
                                 onChange={() => togglePermiso('pedidosDevueltos.ver')} />
                              Pedidos devueltos
                           </label>
                        </div>
                        <div className="group">
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('cotizaciones.ver')}
                                 onChange={() => togglePermiso('cotizaciones.ver')} />
                              Ver cotizaciones
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('cotizaciones.crear')}
                                 onChange={() => togglePermiso('cotizaciones.crear')} />
                              Crear cotizaciones
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('cotizaciones.editar')}
                                 onChange={() => togglePermiso('cotizaciones.editar')} />
                              Editar cotizaciones
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('cotizaciones.eliminar')}
                                 onChange={() => togglePermiso('cotizaciones.eliminar')} />
                              Eliminar cotizaciones
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('cotizaciones.enviar')}
                                 onChange={() => togglePermiso('cotizaciones.enviar')} />
                              Enviar cotizaciones
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('cotizaciones.remisionar')}
                                 onChange={() => togglePermiso('cotizaciones.remisionar')} />
                              Remisionar cotizaciones
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('remisiones.ver')}
                                 onChange={() => togglePermiso('remisiones.ver')} />
                              Ver remisiones
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('remisiones.crear')}
                                 onChange={() => togglePermiso('remisiones.crear')} />
                              Crear remisiones
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('remisiones.editar')}
                                 onChange={() => togglePermiso('remisiones.editar')} />
                              Editar remisiones
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('remisiones.eliminar')}
                                 onChange={() => togglePermiso('remisiones.eliminar')} />
                              Eliminar remisiones
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('remisiones.enviar')}
                                 onChange={() => togglePermiso('remisiones.enviar')} />
                              Enviar remisiones
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('clientes.ver')}
                                 onChange={() => togglePermiso('clientes.ver')} />
                              Ver clientes
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('clientes.crear')}
                                 onChange={() => togglePermiso('clientes.crear')} />
                              Crear clientes
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('clientes.editar')}
                                 onChange={() => togglePermiso('clientes.editar')} />
                              Editar clientes
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('clientes.inactivar')}
                                 onChange={() => togglePermiso('clientes.inactivar')} />
                              Inactivar clientes
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('prospectos.ver')}
                                 onChange={() => togglePermiso('prospectos.ver')} />
                              Ver prospectos
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('reportesVentas.ver')}
                                 onChange={() => togglePermiso('reportesVentas.ver')} />
                              Reportes de ventas
                           </label>
                           <br />
                           <label>
                              <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="radio" name="ventasPermissions"
                                 onClick={() => toggleGrupoPermisos(permisosVentas)}
                                 checked={permisosVentas.every(p => permisos.includes(p))} />
                              Todos los permisos
                           </label>
                        </div>
                     </div>
                     <br />
                  </div>
               )}
               
               </div> {/* Fin del contenido scrolleable */}

               {/* Botones de acción mejorados */}
               <div style={{ 
                  display: 'flex', 
                  gap: '1.5rem', 
                  justifyContent: 'flex-end',
                  padding: '2rem 2.5rem',
                  borderTop: '2px solid #e5e7eb',
                  backgroundColor: 'white',
                  borderRadius: '0 0 20px 20px',
                  flexShrink: 0
               }}>
                  <button 
                     type="button" 
                     onClick={() => closeModal()}
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
                     <i className="fa-solid fa-times"></i>
                     Cancelar
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
                     <i className="fa-solid fa-shield-alt"></i>
                     Crear Rol
                  </button>
               </div>

               </form>
            </div>
         )}
      </>
   )
}
