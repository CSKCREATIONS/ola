import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fijo from '../components/Fijo'
import NavUsuarios from '../components/NavUsuarios'
import SharedListHeaderCard from '../components/SharedListHeaderCard'
import AgregarRol from '../components/AgregarRol';
import AdvancedStats from '../components/AdvancedStats';
import { openModal } from '../funciones/animaciones';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import EditarRol from '../components/EditarRol';

export default function RolesYPermisos() {

  const [roles, setRoles] = useState([]);
  const [puedeCrearRol, setPuedeCrearRol] = useState(false);
  const [puedeEditarRol, setPuedeEditarRol] = useState(false);
  const [puedeinhabilitarRol, setpuedeinhabilitarRol] = useState(false);
  const navigate = useNavigate();
  const [rolSeleccionado, setRolSeleccionado] = useState(null);

  //crea paginacion de tablas
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // se renderizan 10 registros 

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = roles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(roles.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const toggleEstadoRol = async (id, nuevoEstado, roleName) => {
    const confirmResult = await Swal.fire({
      title: nuevoEstado ? `¿Habilitar rol "${roleName || ''}"?` : `¿Deshabilitar rol "${roleName || ''}?`,
      text: "Esta accion le impidirá el ingreso al sistema a los usuarios con este rol.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    });

    if (!confirmResult.isConfirmed) return;

    try {
      await api.patch(`/api/roles/${id}/toggle-enabled`, { enabled: nuevoEstado });

      setRoles(prev => prev.map(r => (r._id === id ? { ...r, enabled: nuevoEstado } : r)));

      Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `El rol "${roleName || ''}" ha sido ${nuevoEstado ? 'habilitado' : 'inhabilitado'} correctamente.`,
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo actualizar el estado del rol', 'error');
    }
  };

  const mostrarPermisos = (rol) => {
    Swal.fire({
      title: `Permisos de ${rol.name}`,
      html: rol.permissions.join('<br />'), // cada permiso en una línea
      icon: 'info',
      confirmButtonText: 'Cerrar',
      width: '400px',
    });
  };

  useEffect(() => {
    const init = async () => {
      const usuario = JSON.parse(localStorage.getItem('user'));
      if (usuario?.permissions) {
        const tieneEditarRol = usuario.permissions.includes('roles.editar');
        const tieneinhabilitarRol = usuario.permissions.includes('roles.inhabilitar');
        const tieneCrearRol = usuario.permissions.includes('roles.crear');
        setPuedeEditarRol(tieneEditarRol);
        setpuedeinhabilitarRol(tieneinhabilitarRol);
        setPuedeCrearRol(tieneCrearRol);
      }

        try {
        const res = await api.get('/api/roles');
        if (res.data?.success) {
          const rolesOrdenados = res.data.roles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setRoles(rolesOrdenados);
        } else {
          console.error('❌ RolesYPermisos: Error cargando roles - data.success es false');
        }
      } catch (err) {
        console.error('❌ RolesYPermisos: Error al cargar roles:', err);
        if (err.response) {
          console.error('❌ RolesYPermisos: Status:', err.response.status);
          console.error('❌ RolesYPermisos: Data:', err.response.data);
        }
      }
    };

    init();
  }, [navigate]);

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavUsuarios />
        <div className="max-width">
          <div className="contenido-modulo">
            <SharedListHeaderCard
              title="Roles y Permisos"
              subtitle="Gestiona roles de usuario y permisos del sistema"
              iconClass="fa-solid fa-shield-alt"
            >
              {puedeCrearRol && (
                <div className="export-buttons">
                  <button
                    onClick={() => openModal('crear-rol')}
                    className="export-btn create"
                  >
                    <i className="fa-solid fa-plus"></i><span>Crear Rol</span>
                  </button>
                </div>
              )}
            </SharedListHeaderCard>

            {/* Estadísticas avanzadas */}
            <AdvancedStats cards={[
              { iconClass: 'fa-solid fa-shield-alt', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', value: roles.length, label: 'Total Roles' },
              { iconClass: 'fa-solid fa-check-circle', gradient: 'linear-gradient(135deg, #10b981, #059669)', value: roles.filter(r => r.enabled).length, label: 'Roles Activos' },
              { iconClass: 'fa-solid fa-ban', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', value: roles.filter(r => !r.enabled).length, label: 'Roles Inactivos' }
            ]} />

            {/* Tabla de roles */}
            <div className="table-container">
              <div className="table-header">
                <div className="table-header-content">
                  <div className="table-header-icon">
                    <i className="fa-solid fa-table" style={{ color: 'white', fontSize: '16px' }}></i>
                  </div>
                  <div>
                    <h4 className="table-title">
                      Lista de Roles
                    </h4>
                    <p className="table-subtitle">
                      Mostrando {currentItems.length} de {roles.length} roles
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ overflow: 'auto' }}>
                <table className="data-table" id='tabla_roles'>
                  <thead>
                    <tr>
                      <th>
                        <i className="fa-solid fa-hashtag icon-gap" style={{ color: '#6366f1' }}></i><span>#</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-shield-alt icon-gap"></i><span>NOMBRE DE ROL</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-calendar-plus icon-gap" style={{ color: '#6366f1' }}></i><span>CREADO</span>
                      </th>
                      <th style={{ textAlign: 'center' }}>
                        <i className="fa-solid fa-key icon-gap"></i><span>PERMISOS</span>
                      </th>
                      <th style={{ textAlign: 'center' }}>
                        <i className="fa-solid fa-toggle-on icon-gap" style={{ color: '#6366f1' }}></i><span>ESTADO</span>
                      </th>
                      <th style={{ textAlign: 'center' }}>
                        <i className="fa-solid fa-cogs icon-gap" style={{ color: '#6366f1' }}></i><span>ACCIONES</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((rol, index) => (
                      <tr key={rol._id}>
                        <td style={{ fontWeight: '600', color: '#6366f1' }}>
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                            {rol.name}
                          </div>
                        </td>
                        <td style={{ color: '#4b5563', fontWeight: '500' }}>
                          {new Date(rol.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => mostrarPermisos(rol)}
                            className="action-btn view"
                          >
                            <i className="fa-solid fa-key"></i>
                            <span>Ver permisos</span>
                          </button>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={rol.enabled}
                              aria-label={`Estado del rol ${rol.name || rol._id}`}
                              onChange={() => {
                                if (puedeinhabilitarRol) {
                                  toggleEstadoRol(rol._id, !rol.enabled, rol.name);
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
                              backgroundColor: rol.enabled ? '#10b981' : '#ef4444'
                            }}></span>
                          </label>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {puedeEditarRol && (
                              <button
                                onClick={() => {
                                  setRolSeleccionado(rol);
                                  openModal('edit-role-modal');
                                }}
                                title="Editar rol"
                                className="action-btn edit"
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {roles.length === 0 && (
                      <tr>
                        <td colSpan="6">
                          <div className="table-empty-state">
                            <div className="table-empty-icon">
                              <i className="fa-solid fa-shield-alt" style={{ fontSize: '3.5rem', color: '#9ca3af' }}></i>
                            </div>
                            <div>
                              <h5 className="table-empty-title">
                                No hay roles disponibles
                              </h5>
                              <p className="table-empty-text">
                                No se encontraron roles en el sistema
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
        
      </div>
      <AgregarRol />
      <EditarRol rol={rolSeleccionado} />
      <div className="custom-footer">
        <p className="custom-footer-text">
          © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}