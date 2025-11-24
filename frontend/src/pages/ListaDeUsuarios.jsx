import React, { useEffect, useState } from 'react'
import Fijo from '../components/Fijo'
import AgregarUsuario from '../components/AgregarUsuario'
import NavUsuarios from '../components/NavUsuarios'
import SharedListHeaderCard from '../components/SharedListHeaderCard'
import DeleteButton from '../components/DeleteButton'
import { openModal } from '../funciones/animaciones'
import EditarUsuario from '../components/EditarUsuario'
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import AdvancedStats from '../components/AdvancedStats';




/****Funcion para exportar a pdf*** */

const exportarPDF = async () => {
  try {
    const exportElementToPdf = (await import('../utils/exportToPdf')).default;
    await exportElementToPdf('tabla_lista_usuarios', 'listaUsuarios.pdf');
  } catch (err) {
    console.error('Error exportando PDF:', err);
    Swal.fire('Error', 'No se pudo generar el PDF', 'error');
  }
};


// Funcion exportar a Excel


const exportToExcel = (todosLosUsuarios) => {
  if (!todosLosUsuarios || todosLosUsuarios.length === 0) {
    console.error("No hay datos para exportar");
    return;
  }
  // Build a quick lookup of roleId -> roleName from available user objects
  const roleLookup = {};
  for (const u of todosLosUsuarios) {
    const r = u.role;
    if (!r) continue;
    const id = (typeof r === 'string') ? r : (r._id || r.id || null);
    const name = (typeof r === 'string') ? null : (r.name || null);
    if (id && name) roleLookup[id.toString()] = name;
  }

  const resolveRoleName = (usuario) => {
    if (!usuario) return 'Sin rol';
    if (usuario.role && typeof usuario.role !== 'string' && usuario.role.name) return usuario.role.name;
    const roleId = typeof usuario.role === 'string' ? usuario.role : (usuario.role && (usuario.role._id || usuario.role.id));
    if (roleId && roleLookup[roleId.toString()]) return roleLookup[roleId.toString()];
    // Try to find any user that has the same role object and a name
    if (roleId) {
      const found = todosLosUsuarios.find(u => u.role && typeof u.role !== 'string' && (u.role._id || u.role.id) && String(u.role._id || u.role.id) === String(roleId) && u.role.name);
      if (found) return found.role.name;
    }
    return 'Sin rol';
  };

  const dataFormateada = todosLosUsuarios.map(usuario => ({
    'Nombre completo': `${usuario.firstName || ''} ${usuario.secondName || ''} ${usuario.surname || ''} ${usuario.secondSurname || ''}`.trim(),
    'Rol': resolveRoleName(usuario),
    'Correo': usuario.email,
    'Usuario': usuario.username,
    'Estado': usuario.enabled ? 'Habilitado' : 'Inhabilitado',
    'Fecha de creación': new Date(usuario.createdAt).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataFormateada);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(data, 'ListaUsuarios.xlsx');
};


export default function ListaDeUsuarios() {

  const [todosLosUsuarios, setTodosLosUsuarios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [puedeEditarUsuario, setPuedeEditarUsuario] = useState(false);
  const [puedeinhabilitarUsuario, setPuedeinhabilitarUsuario] = useState(false);
  const [puedeCrearUsuario, setPuedeCrearUsuario] = useState(false);
  const [puedeEliminarUsuario, setPuedeEliminarUsuario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');


  /***esto se encarga de la paginacion de la tabla*****/
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; //numero de registros que se renderizan

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = usuarios.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(usuarios.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const fetchUsuarios = async () => {
    try {
      const response = await api.get('/api/users');
      const data = response.data || response;
      if (data.success || Array.isArray(data)) {
        const usuariosOrdenados = (data.data || data).sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setTodosLosUsuarios(usuariosOrdenados);
      } else {
        console.error('Error al obtener usuarios:', data.message);
      }
    } catch (error) {
      console.error('Error al conectar con el backend:', error.message);
    }
  };



  useEffect(() => {
    fetchUsuarios();

    const user = JSON.parse(localStorage.getItem('user'));
    // Prefer optional chaining for concise guard checks
    if (user?.permissions) {
      setPuedeCrearUsuario(user.permissions.includes('usuarios.crear'));
      setPuedeEditarUsuario(user.permissions.includes('usuarios.editar'));
      setPuedeinhabilitarUsuario(user.permissions.includes('usuarios.inhabilitar'));
      setPuedeEliminarUsuario(user.permissions.includes('usuarios.eliminar'));
    }
  }, []);



  useEffect(() => {
    const texto = filtroTexto.toLowerCase();

    const filtrados = todosLosUsuarios.filter((usuario) => {
      const nombreCompleto = `${usuario.firstName} ${usuario.secondName} ${usuario.surname} ${usuario.secondSurname}`.toLowerCase();
      const correo = usuario.email.toLowerCase();

      const coincideTexto =
        nombreCompleto.includes(texto) || correo.includes(texto);

      const coincideRol = filtroRol === 'todos' || usuario.role?._id === filtroRol;


      const coincideEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'habilitado' && usuario.enabled) ||
        (filtroEstado === 'inhabilitado' && !usuario.enabled);

      return coincideTexto && coincideRol && coincideEstado;
    });

    setUsuarios(filtrados);
    setCurrentPage(1); // Reiniciar paginación cuando se filtra
  }, [filtroTexto, filtroRol, filtroEstado, todosLosUsuarios]);




  const toggleEstadoUsuario = async (id, estadoActual, username) => {

    const accion = estadoActual ? 'inhabilitar' : 'habilitar';
    const participio = estadoActual ? 'inhabilitado' : 'habilitado';

    const confirmacion = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Quieres ${accion} al usuario "${username}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      try {
        const res = await api.patch(`/api/users/${id}/toggle-enabled`, { enabled: !estadoActual });
        const data = res.data || res;

        if (data.success || (res.status >= 200 && res.status < 300)) {
          setUsuarios(prev =>
            prev.map(usuario =>
              usuario._id === id ? { ...usuario, enabled: !estadoActual } : usuario
            )
          );

          Swal.fire({
            icon: 'success',
            text: `Usuario ${participio} correctamente`,
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.fire('Error', data.message, 'error');
        }
      } catch (error) {
        console.error('Error en toggleEstadoUsuario:', error.message);
        Swal.fire('Error', 'No se pudo cambiar el estado del usuario', 'error');
      }
    }
  };


  const eliminarUsuario = async (usuario) => {
    const confirmacion = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `Esta acción eliminará permanentemente al usuario "${usuario.username}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (confirmacion.isConfirmed) {
      try {
        const res = await api.delete(`/api/users/${usuario._id}`);
        const data = res.data || res;

        if (res.status >= 200 && res.status < 300) {
          // Remueve el usuario del estado actual
          setUsuarios(prev => prev.filter(u => u._id !== usuario._id));
          setTodosLosUsuarios(prev => prev.filter(u => u._id !== usuario._id));

          Swal.fire({
            icon: 'success',
            text: `Usuario eliminado`,
            timer: 2000,
            showConfirmButton: false
          });
          
        } else {
          Swal.fire('Error', data.message || 'No se pudo eliminar el usuario.', 'error');
        }
      } catch (error) {
        console.error('Error al eliminar usuario:', error.message);
        Swal.fire('Error', 'Error en la conexión con el servidor.', 'error');
      }
    }
  };



  return (
    <div>
      <Fijo />
      <div className="content">
        <NavUsuarios />
        <div className="max-width">
          <div className="contenido-modulo">
            <SharedListHeaderCard
              title="Gestión de Usuarios"
              subtitle="Administre y supervise todos los usuarios del sistema"
              iconClass="fa-solid fa-users"
            >
              <div className="export-buttons">
                <button
                  onClick={() => exportToExcel(todosLosUsuarios)}
                  className="export-btn excel"
                >
                  <i className="fa-solid fa-file-excel"></i><span>Exportar Excel</span>
                </button>
                <button
                  onClick={exportarPDF}
                  className="export-btn pdf"
                >
                  <i className="fa-solid fa-file-pdf"></i><span>Exportar PDF</span>
                </button>
                {puedeCrearUsuario && (
                  <button
                    onClick={() => openModal('agregar-usuario')}
                    className="export-btn create"
                  >
                    <i className="fa-solid fa-plus"></i><span>Crear Usuario</span>
                  </button>
                )}
              </div>
            </SharedListHeaderCard>

            {/* Estadísticas avanzadas */}
            <AdvancedStats cards={[
              { iconClass: 'fa-solid fa-users', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', value: todosLosUsuarios.length, label: 'Total Usuarios' },
              { iconClass: 'fa-solid fa-user-check', gradient: 'linear-gradient(135deg, #10b981, #059669)', value: todosLosUsuarios.filter(u => u.enabled).length, label: 'Activos' },
              { iconClass: 'fa-solid fa-user-slash', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', value: todosLosUsuarios.filter(u => !u.enabled).length, label: 'Inactivos' },
              { iconClass: 'fa-solid fa-shield-alt', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', value: [...new Set(todosLosUsuarios.map(u => u.role?.name))].filter(Boolean).length, label: 'Roles Diferentes' }
            ]} />

            {/* Panel de filtros avanzado */}
            <div className="filters-panel">
              <div className="filters-header">
                <i className="fa-solid fa-filter" style={{ color: '#6366f1', fontSize: '1.2rem' }}></i>
                <h4 className="filters-title">
                  Filtros Avanzados
                </h4>
              </div>

              <div className="filters-grid">
                <div className="filter-group">
                  <label htmlFor="input-usuarios-1" className="filter-label">
                    Buscar Usuario
                  </label>
                  <input 
                    id="input-usuarios-1"
                    type="text"
                    placeholder="Nombre o correo electrónico..."
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="input-usuarios-2" className="filter-label">
                    Filtrar por Rol
                  </label>
                  <select 
                    id="input-usuarios-2"
                    value={filtroRol}
                    onChange={(e) => setFiltroRol(e.target.value)}
                    className="filter-input"
                  >
                    <option value="todos">Todos los roles</option>
                    {[...new Set(todosLosUsuarios.map((u) => u.role?._id))].map((rolId) => {
                      const rol = todosLosUsuarios.find(u => u.role?._id === rolId)?.role;
                      return (
                        <option key={rolId} value={rolId}>
                          {rol?.name || 'Sin rol'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="input-usuarios-3" className="filter-label">
                    Estado del Usuario
                  </label>
                  <select 
                    id="input-usuarios-3"
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="filter-input"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="habilitado">Usuarios Activos</option>
                    <option value="inhabilitado">Usuarios Inactivos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla de usuarios */}
            <div className="table-container">
              <div className="table-header">
                <div className="table-header-content">
                  <div className="table-header-icon">
                    <i className="fa-solid fa-table" style={{ color: 'white', fontSize: '16px' }}></i>
                  </div>
                  <div>
                    <h4 className="table-title">
                      Lista de Usuarios
                    </h4>
                    <p className="table-subtitle">
                      Mostrando {usuarios.length} de {todosLosUsuarios.length} usuarios
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ overflow: 'auto' }}>
                <table className="data-table" id='tabla_lista_usuarios'>
                  <thead>
                    <tr>
                      <th>
                        <i className="fa-solid fa-hashtag icon-gap" style={{ color: '#6366f1' }}></i><span>#</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-user icon-gap"></i><span>NOMBRE COMPLETO</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-shield-alt icon-gap"></i><span>ROL</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-envelope icon-gap" style={{ color: '#6366f1' }}></i><span>CORREO</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-at icon-gap" style={{ color: '#6366f1' }}></i><span>USUARIO</span>
                      </th>
                      <th style={{ textAlign: 'center' }}>
                        <i className="fa-solid fa-toggle-on icon-gap" style={{ color: '#6366f1' }}></i><span>ESTADO</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-calendar-plus icon-gap" style={{ color: '#6366f1' }}></i><span>CREADO</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-clock icon-gap" style={{ color: '#6366f1' }}></i><span>ÚLTIMO ACCESO</span>
                      </th>
                      <th style={{ textAlign: 'center' }}>
                        <i className="fa-solid fa-cogs icon-gap" style={{ color: '#6366f1' }}></i><span>ACCIONES</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((usuario, index) => (
                      <tr key={usuario._id}>
                        <td style={{ fontWeight: '600', color: '#6366f1' }}>
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                            {`${usuario.firstName} ${usuario.secondName} ${usuario.surname} ${usuario.secondSurname}`}
                          </div>
                        </td>
                        <td>
                          <span className="role-badge">
                            {usuario.role?.name || 'Sin rol'}
                          </span>
                        </td>
                        <td>
                          {usuario.email}
                        </td>
                        <td>
                          {usuario.username}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={usuario.enabled}
                              aria-label={`Estado del usuario ${usuario.username || usuario._id}`}
                              onChange={() => {
                                if (puedeinhabilitarUsuario) {
                                  toggleEstadoUsuario(usuario._id, usuario.enabled, usuario.username);
                                } else {
                                  Swal.fire({
                                    icon: 'error',
                                    title: 'Acción no permitida',
                                    text: 'No tienes permisos para esta accion',
                                    confirmButtonText: 'Entendido'
                                  });
                                }
                              }}
                              style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span className="slider" style={{
                              backgroundColor: usuario.enabled ? '#10b981' : '#ef4444'
                            }}></span>
                          </label>
                        </td>
                        <td>
                          {new Date(usuario.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          {usuario.lastLogin
                            ? new Date(usuario.lastLogin).toLocaleString('es-CO', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                            : 'Nunca'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            {puedeEditarUsuario && (
                              <button
                                onClick={() => { setUsuarioEditando(usuario); openModal('editUserModal'); }}
                                title="Editar usuario"
                                className="action-btn edit"
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>
                            )}
                            {puedeEliminarUsuario && usuario.lastLogin === null && (
                              <DeleteButton 
                                onClick={() => eliminarUsuario(usuario)} 
                                title="Eliminar usuario" 
                                ariaLabel={`Eliminar usuario ${usuario.username || usuario._id}`}
                                className="action-btn delete"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </DeleteButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {usuarios.length === 0 && (
                      <tr>
                        <td colSpan="9">
                          <div className="table-empty-state">
                            <div className="table-empty-icon">
                              <i className="fa-solid fa-users" style={{ fontSize: '3.5rem', color: '#9ca3af' }}></i>
                            </div>
                            <div>
                              <h5 className="table-empty-title">
                                No hay usuarios disponibles
                              </h5>
                              <p className="table-empty-text">
                                No se encontraron usuarios con los criterios de búsqueda
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="table-pagination">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <EditarUsuario usuario={usuarioEditando} fetchUsuarios={fetchUsuarios} />
        <AgregarUsuario />
      </div>
      <div className="custom-footer">
        <p className="custom-footer-text">
          © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
