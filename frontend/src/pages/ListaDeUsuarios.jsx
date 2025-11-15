import React, { useEffect, useState } from 'react'
import Fijo from '../components/Fijo'
import AgregarUsuario from '../components/AgregarUsuario'
import NavUsuarios from '../components/NavUsuarios'
import SharedListHeaderCard from '../components/SharedListHeaderCard'
import { openModal } from '../funciones/animaciones'
import EditarUsuario from '../components/EditarUsuario'
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// CSS inyectado para diseño avanzado
const advancedStyles = `
  .usuarios-advanced-table {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #e5e7eb;
  }
  
  .usuarios-header-section {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    padding: 20px 25px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .usuarios-title-container {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 15px;
  }
  
  .usuarios-icon-box {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 12px;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .usuarios-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }
  
  .usuarios-stat-card {
    background: linear-gradient(135deg, #ffffff, #f8fafc);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e5e7eb;
    transition: all 0.3s ease;
  }
  
  .usuarios-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  }
  
  .usuarios-filters-section {
    background: linear-gradient(135deg, #f9fafb, #f3f4f6);
    padding: 25px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .usuarios-filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }
  
  .usuarios-filter-group {
    position: relative;
  }
  
  .usuarios-filter-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    transition: all 0.3s ease;
    background: white;
  }
  
  .usuarios-filter-input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  .usuarios-table-container {
    overflow: auto;
  }
  
  .usuarios-advanced-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  
  .usuarios-advanced-table thead tr {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-bottom: 2px solid #e5e7eb;
  }
  
  .usuarios-advanced-table thead th {
    padding: 16px 12px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 13px;
    letter-spacing: 0.5px;
  }
  
  .usuarios-advanced-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }
  
  .usuarios-advanced-table tbody tr:hover {
    background-color: #f8fafc;
  }
  
  .usuarios-advanced-table tbody td {
    padding: 16px 12px;
    color: #4b5563;
    font-weight: 500;
  }
  
  .usuarios-pagination-container {
    padding: 20px 25px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: center;
    gap: 8px;
  }
  
  .usuarios-pagination-btn {
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
  
  .usuarios-pagination-btn.active {
    border-color: #6366f1;
    background: #6366f1;
    color: white;
  }
  
  .usuarios-pagination-btn:hover:not(.active) {
    border-color: #6366f1;
    color: #6366f1;
  }
  
  .usuarios-action-btn {
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
    margin-right: 6px;
  }
  
  .usuarios-action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(30, 64, 175, 0.3);
  }
  
  .usuarios-action-btn.delete {
    background: linear-gradient(135deg, #fee2e2, #fecaca);
    color: #dc2626;
    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
  }
  
  .usuarios-action-btn.delete:hover {
    box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
  }
  
  .usuarios-status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }
  
  .usuarios-status-badge.activo {
    background: #dcfce7;
    color: #16a34a;
  }
  
  .usuarios-status-badge.inactivo {
    background: #fee2e2;
    color: #dc2626;
  }
  
  .usuarios-role-badge {
    background: #fef3c7;
    color: #d97706;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }
  
  .usuarios-empty-state {
    text-align: center;
    padding: 80px 20px;
  }
  
  .usuarios-empty-icon {
    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
    border-radius: 50%;
    padding: 25px;
    margin: 0 auto 20px auto;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

// Inyectar estilos
if (!document.getElementById('usuarios-advanced-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'usuarios-advanced-styles';
  styleSheet.textContent = advancedStyles;
  document.head.appendChild(styleSheet);
}



/****Funcion para exportar a pdf*** */

const exportarPDF = () => {
  const input = document.getElementById('tabla_lista_usuarios');

  html2canvas(input).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 190;
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width; // Calcula la altura de la imagen

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);

    heightLeft -= pageHeight;

    // Mientras la imagen exceda la altura de la página, agregar nuevas páginas
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage(); // Añadir nueva página
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight; // Resta la altura de la página actual
    }

    pdf.save('listaUsuarios.pdf');// nombre del pdf a descargar
  });
};


// Funcion exportar a Excel


const exportToExcel = (todosLosUsuarios) => {
  if (!todosLosUsuarios || todosLosUsuarios.length === 0) {
    console.error("No hay datos para exportar");
    return;
  }

  const dataFormateada = todosLosUsuarios.map(usuario => ({
    'Nombre completo': `${usuario.firstName || ''} ${usuario.secondName || ''} ${usuario.surname || ''} ${usuario.secondSurname || ''}`.trim(),
    'Rol': usuario.role,
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
  const [puedeInhabilitarUsuario, setPuedeInhabilitarUsuario] = useState(false);
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
      setPuedeInhabilitarUsuario(user.permissions.includes('usuarios.inhabilitar'));
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

          Swal.fire('Eliminado', 'Usuario eliminado correctamente.', 'success');
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
        <div className="contenido-modulo">
          <SharedListHeaderCard
            title="Gestión de Usuarios"
            subtitle="Administre y supervise todos los usuarios del sistema"
            iconClass="fa-solid fa-users"
          >
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => exportToExcel(todosLosUsuarios)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-file-excel"></i><span>Exportar Excel</span>
              </button>
              <button
                onClick={exportarPDF}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-file-pdf"></i><span>Exportar PDF</span>
              </button>
              {puedeCrearUsuario && (
                <button 
                  onClick={() => openModal('agregar-usuario')}
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
                >
                  <i className="fa-solid fa-plus"></i><span>Crear Usuario</span>
                </button>
              )}
            </div>
          </SharedListHeaderCard>

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
                  <i className="fa-solid fa-users" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {todosLosUsuarios.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Total Usuarios
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
                  <i className="fa-solid fa-user-check" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {todosLosUsuarios.filter(u => u.enabled).length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Activos
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
                  <i className="fa-solid fa-user-slash" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {todosLosUsuarios.filter(u => !u.enabled).length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Inactivos
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
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
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
                    {[...new Set(todosLosUsuarios.map(u => u.role?.name))].filter(Boolean).length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Roles Diferentes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de filtros avanzado */}
          <div style={{
            background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
            borderRadius: '16px',
            padding: '25px',
            marginBottom: '30px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <i className="fa-solid fa-filter" style={{ color: '#6366f1', fontSize: '1.2rem' }}></i>
              <h4 style={{ margin: 0, color: '#374151', fontSize: '1.1rem', fontWeight: '600' }}>
                Filtros Avanzados
              </h4>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              <div style={{ position: 'relative' }}>
                <label htmlFor="input-usuarios-1" style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '12px',
                  background: '#f9fafb',
                  padding: '0 8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6366f1',
                  zIndex: 1
                }}>
                  Buscar Usuario</label>
                <input id="input-usuarios-1"
                  type="text"
                  placeholder="Nombre o correo electrónico..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    background: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <label htmlFor="input-usuarios-2" style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '12px',
                  background: '#f9fafb',
                  padding: '0 8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6366f1',
                  zIndex: 1
                }}>
                  Filtrar por Rol</label>
                <select id="input-usuarios-2"
                  value={filtroRol}
                  onChange={(e) => setFiltroRol(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
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

              <div style={{ position: 'relative' }}>
                <label htmlFor="input-usuarios-3" style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '12px',
                  background: '#f9fafb',
                  padding: '0 8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6366f1',
                  zIndex: 1
                }}>
                  Estado del Usuario</label>
                <select id="input-usuarios-3"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="habilitado">Usuarios Activos</option>
                  <option value="inhabilitado">Usuarios Inactivos</option>
                </select>
              </div>
            </div>
          </div>



          {/* Tabla de usuarios mejorada */}
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
                    Lista de Usuarios
                  </h4>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    Mostrando {usuarios.length} de {todosLosUsuarios.length} usuarios
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%'
              }} id='tabla_lista_usuarios'>
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
                      <i className="fa-solid fa-hashtag icon-gap" style={{ color: '#6366f1' }}></i><span>#</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-user icon-gap" style={{}}></i><span>NOMBRE COMPLETO</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-shield-alt icon-gap" style={{}}></i><span>ROL</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-envelope icon-gap" style={{ color: '#6366f1' }}></i><span>CORREO</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-at icon-gap" style={{ color: '#6366f1' }}></i><span>USUARIO</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-toggle-on icon-gap" style={{ color: '#6366f1' }}></i><span>ESTADO</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-calendar-plus icon-gap" style={{ color: '#6366f1' }}></i><span>CREADO</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-clock icon-gap" style={{ color: '#6366f1' }}></i><span>ÚLTIMO ACCESO</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-cogs icon-gap" style={{ color: '#6366f1' }}></i><span>ACCIONES</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((usuario, index) => (
                    <tr key={usuario._id} 
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
                          {`${usuario.firstName} ${usuario.secondName} ${usuario.surname} ${usuario.secondSurname}`}
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{
                          background: '#fef3c7',
                          color: '#d97706',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-block'
                        }}>
                          {usuario.role?.name || 'Sin rol'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                        {usuario.email}
                      </td>
                      <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                        {usuario.username}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                          <input
                            type="checkbox"
                            checked={usuario.enabled}
                            aria-label={`Estado del usuario ${usuario.username || usuario._id}`}
                            onChange={() => {
                              if (puedeInhabilitarUsuario) {
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
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: usuario.enabled ? '#10b981' : '#ef4444',
                            transition: '0.4s',
                            borderRadius: '24px'
                          }}></span>
                        </label>
                      </td>
                      <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                        {new Date(usuario.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
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
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {puedeEditarUsuario && (
                            <button
                              onClick={() => { setUsuarioEditando(usuario); openModal('editUserModal'); }}
                              title="Editar usuario"
                              style={{
                                background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                                color: '#1e40af',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 10px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(30, 64, 175, 0.2)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 8px rgba(30, 64, 175, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(30, 64, 175, 0.2)';
                              }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                          )}
                          {puedeEliminarUsuario && usuario.lastLogin === null && (
                            <button
                              onClick={() => eliminarUsuario(usuario)}
                              title="Eliminar usuario"
                              style={{
                                background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                                color: '#dc2626',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 10px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.2)';
                              }}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '80px 20px' }}>
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
                            <i className="fa-solid fa-users" style={{ 
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
                              No hay usuarios disponibles
                            </h5>
                            <p style={{ 
                              color: '#9ca3af', 
                              margin: 0, 
                              fontSize: '14px',
                              lineHeight: '1.5'
                            }}>
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
