import { useState } from "react";
import { closeModal, toggleSubMenu } from "../funciones/animaciones";
import Swal from "sweetalert2";

export default function AgregarRol() {

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
      'roles.crear',
      'roles.editar',
      'roles.inhabilitar'
   ];
   const permisosCompras = [
      'hcompras.ver',
      'proveedores.ver',
      'reportesCompras.ver'
   ];
   const permisosProductos = [
      'productos.ver',
      'productos.crear',
      'productos.editar',
      'productos.inactivar',
      'categorias.ver',
      'subcategorias.ver',
      'reportesProductos.ver'
   ];
   const permisosVentas = [
      'cotizaciones.crear',
      'cotizaciones.ver',
      'cotizaciones.editar',
      'cotizaciones.eliminar',
      'pedidosAgendados.ver',
      'listaDeVentas.ver',
      'pedidosDespachados.ver',
      'pedidosEntregados.ver',
      'pedidosCancelados.ver',
      'pedidosDevueltos.ver',
      'reportesVentas.ver',
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
            closeModal('crear-rol');
         } else {
            Swal.fire('Error', data.message || 'No se pudo crear el rol', 'error');
         }

      } catch (error) {
         console.error('[AgregarRol]', error);
         Swal.fire('Error', 'Error del servidor al crear el rol', 'error');
      }
   };



   return (
      <form class="modal" id="crear-rol" onSubmit={handleSubmit}>
         <div className="modal-content">
            <h3>Crear rol</h3>
            <br />
            <label>Nombre de rol</label>
            <input className='entrada' type="text" style={{ marginLeft: '1.5rem' }} value={nombreRol} onChange={(e) => setNombreRol(e.target.value)} /><br /><br />
            <label >Módulos con acceso</label>
            <br />
            <br />
            <div class="checkbox-group">
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

               <input value="compras"
                  type="checkbox"
                  checked={mostrarCompras}
                  onChange={(e) => {
                     const isChecked = e.target.checked;
                     setMostrarCompras(isChecked);
                  }} /> Compras

               <input value="productos"
                  type="checkbox"
                  checked={mostrarProductos}
                  onChange={(e) => {
                     const isChecked = e.target.checked;
                     setMostrarProductos(isChecked);
                  }} /> Productos
               <input value="ventas"
                  type="checkbox"
                  checked={mostrarVentas}
                  onChange={(e) => {
                     const isChecked = e.target.checked;
                     setMostrarVentas(isChecked);
                  }} /> Ventas
            </div>
            <br />
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
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('proveedores.ver')} onChange={() => togglePermiso('proveedores.ver')} />
                           Catalogo de proveedores
                        </label>
                     </div>
                     <div className="group">
                        <label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('reportesCompras.ver')} onChange={() => togglePermiso('reportesCompras.ver')} />
                           Ver reportes
                        </label>
                        <br />

                        <label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="radio" name="comprasPermissions"
                              onClick={() => toggleGrupoPermisos(permisosCompras)}
                              checked={permisosCompras.every(p => permisos.includes(p))} />
                           Todos
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
                           Categorias
                        </label>
                        <br />
                     </div>
                     <div className="group">

                        <label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('subcategorias.ver')} onChange={() => togglePermiso('subcategorias.ver')} />
                           Subcategorias
                        </label>
                        <br />
                        <label>
                        <label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('reportesProductos.ver')} onChange={() => togglePermiso('reportesProductos.ver')} />
                           Reportes
                        </label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="radio" name="productosPermissions"
                              onClick={() => toggleGrupoPermisos(permisosProductos)}
                              checked={permisosProductos.every(p => permisos.includes(p))} />
                           Todos
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
                           checked={permisos.includes('productos.inactivar ')}
                           onChange={() => togglePermiso('productos.inactivar ')}
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
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('cotizaciones.crear')}
                              onChange={() => togglePermiso('cotizaciones.crear')} />
                           Registrar cotizacion
                        </label>
                        <br />
                        <label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" checked={permisos.includes('cotizaciones.ver')}
                              onChange={() => togglePermiso('cotizaciones.ver')} />
                           Lista de cotizaciones
                        </label>
                        <br />
                        <label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" name="agendados" checked={permisos.includes('pedidosAgendados.ver')}
                              onChange={() => togglePermiso('pedidosAgendados.ver')} />
                           Pedidos por despachar
                        </label>
                        <br />
                        <label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" name="despachados" checked={permisos.includes('pedidosDespachados.ver')}
                              onChange={() => togglePermiso('pedidosDespachados.ver')} />
                           Pedidos despachados
                        </label>
                        <br />
                        <label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" name="entregados" checked={permisos.includes('pedidosEntregados.ver')}
                              onChange={() => togglePermiso('pedidosEntregados.ver')} />
                           Pedidos por entregados
                        </label>
                        <br />
                        <label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" name="cancelados" checked={permisos.includes('pedidosCancelados.ver')}
                              onChange={() => togglePermiso('pedidosCancelados.ver')} />
                           Pedidos cancelados
                        </label>
                        <br />

                     </div>
                     <div className="group">
                        <label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" name="devueltos" checked={permisos.includes('pedidosDevueltos.ver')}
                              onChange={() => togglePermiso('pedidosDevueltos.ver')} />
                           Pedidos devueltos
                        </label>
                        <br />
                        <label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" name="ventas" checked={permisos.includes('listaDeVentas.ver')}
                              onChange={() => togglePermiso('listaDeVentas.ver')} />
                           Lista de ventas
                        </label>
                        <br />
                        <label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" name="listaClientes" checked={permisos.includes('clientes.ver')}
                              onChange={() => togglePermiso('clientes.ver')} />
                           Lista de clientes
                        </label>
                        <br />
                        <label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" name="prospectos" checked={permisos.includes('prospectos.ver')}
                              onChange={() => togglePermiso('prospectos.ver')} />
                           Prospectos de cliente
                        </label>
                        <br />
                        <label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="checkbox" name="reportesVentas" checked={permisos.includes('reportesVentas.ver')}
                              onChange={() => togglePermiso('reportesVentas.ver')} />
                           Reportes
                        </label>
                        <br />
                        <label>
                           <input style={{ marginRight: '0.5rem', marginBottom: '.5rem' }} type="radio" />
                           Todos
                        </label>
                     </div>
                  </div>
                  <br />

                  <div class="form-group-rol">
                     <label>Permisos para lista de cotizaciones</label>
                     <div class="radio-options">
                        <div>
                           <input type="radio" name="pedidosagendados" /> Solo ver
                        </div>
                        <div>
                           <input type="radio" name="pedidosagendados" /> Todos los permisos
                        </div>
                     </div>
                  </div>
               </div>
            )}


            <div className="buttons">
               <button type="button" onClick={() => closeModal('crear-rol')} className="btn btn-primary-cancel">
                  Cancelar
               </button>
               <button type="submit" className="btn btn-primary-env">
                  Crear Rol
               </button>
            </div>
         </div>


      </form>

   )
}
