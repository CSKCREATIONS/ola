import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fijo from '../components/Fijo'
import NavUsuarios from '../components/NavUsuarios'
import AgregarRol from '../components/AgregarRol';
import { openModal } from '../funciones/animaciones';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import EditarRol from '../components/EditarRol';

// CSS inyectado para diseño avanzado
const advancedStyles = `
  .roles-advanced-table {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #e5e7eb;
  }
  
  .roles-header-section {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    padding: 20px 25px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .roles-table-container {
    overflow: auto;
  }
  
  .roles-advanced-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  
  .roles-advanced-table thead tr {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-bottom: 2px solid #e5e7eb;
  }
  
  .roles-advanced-table thead th {
    padding: 16px 12px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 13px;
    letter-spacing: 0.5px;
  }
  
  .roles-advanced-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }
  
  .roles-advanced-table tbody tr:hover {
    background-color: #f8fafc;
  }
  
  .roles-advanced-table tbody td {
    padding: 16px 12px;
    color: #4b5563;
    font-weight: 500;
  }
  
  .roles-permission-btn {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    color: #d97706;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);
  }
  
  .roles-permission-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(217, 119, 6, 0.3);
  }
  
  .roles-action-btn {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    color: #1e40af;
    border: none;
    border-radius: 8px;
    padding: 8px 10px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(30, 64, 175, 0.2);
  }
  
  .roles-action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(30, 64, 175, 0.3);
  }
  
  .roles-pagination-container {
    padding: 20px 25px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: center;
    gap: 8px;
  }
  
  .roles-pagination-btn {
    padding: 8px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    color: #4b5563;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .roles-pagination-btn.active {
    border-color: #6366f1;
    background: #6366f1;
    color: white;
  }
  
  .roles-pagination-btn:hover:not(.active) {
    border-color: #6366f1;
    color: #6366f1;
  }
`;

// Inyectar estilos
if (!document.getElementById('roles-advanced-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'roles-advanced-styles';
  styleSheet.textContent = advancedStyles;
  document.head.appendChild(styleSheet);
}

export default function RolesYPermisos() {

  const [roles, setRoles] = useState([]);
  const [puedeCrearRol, setPuedeCrearRol] = useState(false);
  const [puedeEditarRol, setPuedeEditarRol] = useState(false);
  const [puedeInhabilitarRol, setpuedeInhabilitarRol] = useState(false);
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



  const toggleEstadoRol = async (id, nuevoEstado) => {
    const confirmResult = await Swal.fire({
      title: nuevoEstado ? '¿Habilitar rol?' : '¿Inhabilitar rol?',
      text: `¿Estás seguro de que deseas ${nuevoEstado ? 'habilitar' : 'inhabilitar'} este rol?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const res = await api.patch(`/api/roles/${id}/toggle-enabled`, { enabled: nuevoEstado });

      const data = res.data;

      setRoles(prev => prev.map(r => (r._id === id ? { ...r, enabled: nuevoEstado } : r)));

      Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `El rol ha sido ${nuevoEstado ? 'habilitado' : 'inhabilitado'} correctamente.`,
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
      console.log('👤 Usuario en localStorage:', usuario);
      console.log('🔑 Permisos del usuario:', usuario?.permissions);
      if (usuario?.permissions) {
        const tieneEditarRol = usuario.permissions.includes('roles.editar');
        const tieneInhabilitarRol = usuario.permissions.includes('roles.inhabilitar');
        const tieneCrearRol = usuario.permissions.includes('roles.crear');
        console.log('✅ Puede editar rol:', tieneEditarRol);
        console.log('✅ Puede inhabilitar rol:', tieneInhabilitarRol);
        console.log('✅ Puede crear rol:', tieneCrearRol);
        setPuedeEditarRol(tieneEditarRol);
        setpuedeInhabilitarRol(tieneInhabilitarRol);
        setPuedeCrearRol(tieneCrearRol);
      }

      try {
        console.log('🔍 RolesYPermisos: Iniciando carga de roles...');
        const res = await api.get('/api/roles');
        console.log('📋 RolesYPermisos: Respuesta del servidor:', res);
        console.log('📋 RolesYPermisos: data.success =', res.data?.success, 'data.roles =', res.data?.roles);
        if (res.data?.success) {
          const rolesOrdenados = res.data.roles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setRoles(rolesOrdenados);
          console.log('✅ RolesYPermisos: Roles cargados correctamente:', res.data.roles.length);
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
        <div className="contenido-modulo">
          {/* Encabezado profesional */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '300px',
              height: '300px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              zIndex: 1
            }}></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <i className="fa-solid fa-shield-alt" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                  </div>
                  <div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '700' }}>
                      Roles y Permisos
                    </h2>
                    <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                      Gestiona roles de usuario y permisos del sistema
                    </p>
                  </div>
                </div>
                <div>
                  {puedeCrearRol && (
                    <button 
                      onClick={() => openModal('crear-rol')}
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                      }}
                    >
                      <i className="fa-solid fa-plus"></i>
                      <span>Crear Rol</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas avanzadas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-shield-alt" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {roles.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Total Roles
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-check-circle" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {roles.filter(r => r.enabled).length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Roles Activos
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-ban" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {roles.filter(r => !r.enabled).length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Roles Inactivos
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Tabla de roles mejorada */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
              padding: '20px 25px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: '12px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-table" style={{ color: 'white', fontSize: '16px' }}></i>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#1f2937', fontSize: '1.3rem', fontWeight: '600' }}>
                    Lista de Roles
                  </h4>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    Mostrando {currentItems.length} de {roles.length} roles
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }} id='tabla_roles'>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-hashtag icon-gap" style={{ color: '#6366f1' }}></i>
                      <span>#</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-shield-alt icon-gap" style={{ color: '#6366f1' }}></i>
                      <span>NOMBRE DE ROL</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-calendar-plus icon-gap" style={{ color: '#6366f1' }}></i>
                      <span>CREADO</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-key icon-gap" style={{ color: '#6366f1' }}></i>
                      <span>PERMISOS</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-toggle-on icon-gap" style={{ color: '#6366f1' }}></i>
                      <span>ESTADO</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-cogs icon-gap" style={{ color: '#6366f1' }}></i>
                      <span>ACCIONES</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((rol, index) => (
                    <tr key={rol._id} 
                        style={{
                          borderBottom: '1px solid #f3f4f6',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                      <td style={{ padding: '16px 12px', fontWeight: '600', color: '#6366f1' }}>
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                          {rol.name}
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                        {new Date(rol.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <button
                          onClick={() => mostrarPermisos(rol)}
                          style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.3)';
                          }}
                        >
                          <i className="fa-solid fa-key"></i>
                          <span>Ver permisos</span>
                        </button>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                          <input
                            type="checkbox"
                            checked={rol.enabled}
                            aria-label={`Estado del rol ${rol.name || rol._id}`}
                            onChange={() => {
                              if (puedeInhabilitarRol) {
                                toggleEstadoRol(rol._id, !rol.enabled);
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
                          <span className="slider round" style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: rol.enabled ? '#10b981' : '#ef4444',
                            transition: '0.4s',
                            borderRadius: '24px'
                          }}></span>
                        </label>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {puedeEditarRol && (
                            <button
                              onClick={() => {
                                setRolSeleccionado(rol);
                                openModal('edit-role-modal');
                              }}
                              title="Editar rol"
                              style={{
                                background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                              }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                              <span>Editar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {roles.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '20px'
                        }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                            borderRadius: '50%',
                            padding: '25px',
                            marginBottom: '10px'
                          }}>
                            <i className="fa-solid fa-shield-alt" style={{ 
                              fontSize: '3.5rem', 
                              color: '#9ca3af'
                            }}></i>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <h5 style={{ 
                              color: '#6b7280', 
                              margin: '0 0 12px 0',
                              fontSize: '1.2rem',
                              fontWeight: '600'
                            }}>
                              No hay roles disponibles
                            </h5>
                            <p style={{ 
                              color: '#9ca3af', 
                              margin: 0, 
                              fontSize: '14px',
                              lineHeight: '1.5'
                            }}>
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
            
            {/* Paginación mejorada */}
            {totalPages > 1 && (
              <div style={{
                padding: '20px 25px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'center',
                gap: '8px'
              }}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    style={{
                      padding: '8px 16px',
                      border: currentPage === i + 1 ? '2px solid #6366f1' : '2px solid #e5e7eb',
                      borderRadius: '8px',
                      background: currentPage === i + 1 ? '#6366f1' : 'white',
                      color: currentPage === i + 1 ? 'white' : '#4b5563',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== i + 1) {
                        e.target.style.borderColor = '#6366f1';
                        e.target.style.color = '#6366f1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== i + 1) {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.color = '#4b5563';
                      }
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
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