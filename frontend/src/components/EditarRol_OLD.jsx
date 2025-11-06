import { useEffect, useState } from 'react';
import { closeModal } from "../funciones/animaciones";
import Swal from "sweetalert2";
import api from '../api/axiosConfig';

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
      // Cuando los permisos cambian (después del primer useEffect), revisamos si debe mostrarse el submenú
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

   // Manejo de cambios en checkboxes
   const togglePermiso = (permiso) => {
      setPermisos(prev => {
         const yaIncluido = prev.includes(permiso);

         // Si se desactiva 'usuarios.ver', también quitamos los hijos
         if (permiso === 'usuarios.ver' && yaIncluido) {
            return prev.filter(p => p !== 'usuarios.ver' && !permisosUsuarios.includes(p));
         }

         // Si se desactiva 'roles.ver', también quitamos los hijos de roles
         if (permiso === 'roles.ver' && yaIncluido) {
            return prev.filter(p => p !== 'roles.ver' && !permisosRoles.includes(p));
         }

         // Normal toggle
         return yaIncluido
            ? prev.filter(p => p !== permiso)
            : [...prev, permiso];
      });
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
   return (
   <form className="modal" id="edit-role-modal" onSubmit={handleSubmit}>
         <h3>Editar rol</h3>
         <br />
         <label>Nombre de rol</label>
         <input className='entrada' type="text" style={{ marginLeft: '1.5rem' }} value={nombreRol} onChange={(e) => setNombreRol(e.target.value)} /><br /><br />
         <label >Módulos con acceso</label>
         <br />
         <br />
         <div className="checkbox-group">
            <input
               value="usuarios"
               type="checkbox"
               checked={mostrarUsuarios}
               onChange={(e) => {
                  const isChecked = e.target.checked;
                  setMostrarUsuarios(isChecked);

                  if (!isChecked) {
                     // Filtra los permisos eliminando los relacionados con usuarios y roles
                     setPermisos(prev =>
                        prev.filter(p =>
                           !p.startsWith('usuarios.') && !p.startsWith('roles.')
                        )
                     );
                  }
               }}

            /> Usuarios


            <input value="compras" type="checkbox"
               checked={mostrarCompras}
               onChange={(e) => {
                  const isChecked = e.target.checked;
                  setMostrarCompras(isChecked);
               }} /> Compras
            <input value="productos" type="checkbox" /> Productos
            <input value="ventas" type="checkbox" 
            checked={mostrarVentas}
               onChange={(e) => {
                  const isChecked = e.target.checked;
                  setMostrarVentas(isChecked);
               }}
               /> Ventas
         </div>
         <br />
         {mostrarUsuarios && (
            <div className="section" id='permisos-usuarios'>
               <h4>Permisos módulo usuarios</h4>
               <br />
               <div className="permissions">
                  <div className="group">
                     <label>
                        <input
                           style={{ marginRight: '0.5rem', marginBottom: '.5rem' }}
                           type="checkbox"
                           checked={permisos.includes('usuarios.ver')}
                           onChange={() => togglePermiso('usuarios.ver')}
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
                           onChange={() => togglePermiso('roles.ver')}
                        />
                        Roles y permisos
                     </label>
                     <br />
                  </div>
                  <br />

               </div>
               <br />
               {mostrarListaUsuarios && (
                  <div className="form-group-rol" id="lista-usuarios">
                     <label>Permisos para lista de usuarios</label>
                     <div className="radio-options">
                        <input
                           type="checkbox"
                           checked={permisos.includes('usuarios.crear')}
                           onChange={() => togglePermiso('usuarios.crear')}
                        /> Crear usuarios

                        <input
                           type="checkbox"
                           checked={permisos.includes('usuarios.editar')}
                           onChange={() => togglePermiso('usuarios.editar')}
                        /> Editar usuarios

                        <input
                           type="checkbox"
                           checked={permisos.includes('usuarios.inhabilitar')}
                           onChange={() => togglePermiso('usuarios.inhabilitar')}
                        /> Habilitar / Inhabilitar

                        <input
                           type="checkbox"
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
                  <div className="form-group-rol" id='roles-y-permisos'>
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
               <div className="permissions">
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
               <div className="permissions">
                  <div className="group">
                     <label>
                        <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('productos.ver')} onChange={() => togglePermiso('productos.ver')} />
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

               <div className="form-group-rol " id="lista-productos">
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
               <div className="permissions">
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
                           onChange={() => togglePermiso('clientes.ver')}/>
                        Ver clientes
                     </label>
                     <br />
                     <label>
                        <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('clientes.crear')}
                           onChange={() => togglePermiso('clientes.crear')}/>
                        Crear clientes
                     </label>
                     <br />
                     <label>
                        <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('clientes.editar')}
                           onChange={() => togglePermiso('clientes.editar')}/>
                        Editar clientes
                     </label>
                     <br />
                     <label>
                        <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('clientes.inactivar')}
                           onChange={() => togglePermiso('clientes.inactivar')}/>
                        Inactivar clientes
                     </label>
                     <br />
                     <label>
                        <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('prospectos.ver')}
                           onChange={() => togglePermiso('prospectos.ver')}/>
                        Ver prospectos
                     </label>
                     <br />
                     <label>
                        <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('reportesVentas.ver')}
                           onChange={() => togglePermiso('reportesVentas.ver')}/>
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




         <div className="buttons">
            <button type="button" onClick={() => closeModal('edit-role-modal')} className="btn btn-primary-cancel">
               Cancelar
            </button>
            <button type="submit" className="btn btn-primary-env">
               Guardar cambios
            </button>
         </div>


      </form>
   )
}