
import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// CSS para diseño avanzado
const advancedStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .clientes-container * {
    box-sizing: border-box;
  }
  
  .fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }
  
  .glassmorphism {
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
  }
`;

// Inyectar estilos una sola vez
if (!document.querySelector('#clientes-advanced-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'clientes-advanced-styles';
  styleSheet.textContent = advancedStyles;
  document.head.appendChild(styleSheet);
}

export default function ListaDeClientes() {
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState(""); // 👉 filtro agregado

  /*** PAGINACIÓN ***/
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // número de registros por página

  // 👉 primero filtramos
  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = filtroTexto.toLowerCase();
    return (
      cliente.nombre?.toLowerCase().includes(texto) ||
      cliente.correo?.toLowerCase().includes(texto)
    );
  });

  // 👉 después aplicamos paginación sobre los filtrados
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = clientesFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(clientesFiltrados.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const res = await api.get('/api/clientes');
        const data = res.data || res;
        const lista = Array.isArray(data) ? data : (data.data || []);
        const listaOrdenada = lista.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setClientes(listaOrdenada);
      } catch (err) {
        console.error('Error al cargar clientes:', err);
        setClientes([]);
      }
    };

    cargarClientes();
  }, []);

  const handleEliminar = (id) => {
    const token = localStorage.getItem('token');
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el cliente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/api/clientes/${id}`);
          setClientes(clientes.filter(c => c._id !== id));
          Swal.fire('Eliminado', 'Cliente eliminado correctamente.', 'success');
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'No se pudo eliminar el cliente.', 'error');
        }
      }
    });
  };

  const handleGuardar = async (clienteActualizado) => {
    const token = localStorage.getItem('token');
    try {
      const res = await api.put(`/api/clientes/${clienteActualizado._id}`, clienteActualizado);
      if (!(res.status >= 200 && res.status < 300)) throw new Error('Error al actualizar cliente');
      Swal.fire('Éxito', 'Cliente actualizado correctamente', 'success');
      setMostrarModal(false);
      setClientes(clientes.map(c => c._id === clienteActualizado._id ? clienteActualizado : c));
    } catch (err) {
      Swal.fire('Error', err.message || 'Error al actualizar cliente', 'error');
    }
  };

  /*** FUNCIONES EXPORTAR ***/
  const exportarPDF = () => {
    const input = document.getElementById('tabla_clientes');

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);

      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('listaClientes.pdf');
    });
  };

  const exportToExcel = (todosLosClientes) => {
    if (!todosLosClientes || todosLosClientes.length === 0) {
      Swal.fire("Error", "No hay datos para exportar", "warning");
      return;
    }

    const dataFormateada = todosLosClientes.map(cliente => ({
      'Nombre': cliente.nombre || cliente.clienteInfo?.nombre || '',
      'Ciudad': cliente.ciudad || cliente.clienteInfo?.ciudad || '',
      'Teléfono': cliente.telefono || cliente.clienteInfo?.telefono || '',
      'Correo': cliente.correo || cliente.clienteInfo?.correo || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataFormateada);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'ListaClientes.xlsx');
  };

  /*** MODAL EDITAR CLIENTE ***/
  const ModalEditarCliente = ({ cliente, onClose, onSave }) => {
    const [form, setForm] = useState({ ...cliente });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!form.nombre || !form.ciudad || !form.telefono || !form.correo) {
        Swal.fire('Campos obligatorios', 'Completa todos los campos', 'warning');
        return;
      }
      onSave(form);
    };

    return (
      <div className="modal-overlay">
        <div className="modal-compact">
          <div className="modal-header">
            <h5 className="modal-title">Editar Cliente</h5>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="input-cliente-1" className="form-label required">Nombre</label>
                <input id="input-cliente-1" name="nombre" value={form.nombre} onChange={handleChange} className="form-input" required />
              </div>
              <div className="form-group">
                <label htmlFor="input-cliente-2" className="form-label required">Ciudad</label>
                <input id="input-cliente-2" name="ciudad" value={form.ciudad} onChange={handleChange} className="form-input" required />
              </div>
              <div className="form-group">
                <label htmlFor="input-cliente-3" className="form-label required">Teléfono</label>
                <input id="input-cliente-3" name="telefono" value={form.telefono} onChange={handleChange} className="form-input" required />
              </div>
              <div className="form-group">
                <label htmlFor="input-cliente-4" className="form-label required">Correo</label>
                <input id="input-cliente-4" name="correo" value={form.correo} onChange={handleChange} className="form-input" required />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-cancel" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-save">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="clientes-container">
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="contenido-modulo">
          {/* Encabezado profesional del módulo */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '15px',
            padding: '25px 30px',
            marginBottom: '30px',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '-30%',
              left: '-5%',
              width: '150px',
              height: '150px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}></div>
            
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <h3 style={{
                    color: 'white',
                    margin: '0 0 8px 0',
                    fontSize: '2rem',
                    fontWeight: '700',
                    letterSpacing: '-0.5px'
                  }}>
                    <i className="fa-solid fa-users" style={{ marginRight: '12px', fontSize: '1.8rem' }}></i>
                    Lista de Clientes
                  </h3>
                  <p style={{
                    color: 'rgba(255,255,255,0.9)',
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: '400'
                  }}>
                    Gestión completa de clientes registrados
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => exportToExcel(clientes)}
                    style={{
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '12px 20px', 
                      border: '2px solid rgba(255,255,255,0.3)', 
                      borderRadius: '12px', 
                      background: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontSize: '14px', 
                      fontWeight: '600', 
                      cursor: 'pointer', 
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.3)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.2)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <i className="fa-solid fa-file-excel" style={{ fontSize: '16px' }}></i>
                    <span>Exportar Excel</span>
                  </button>

                  <button
                    onClick={exportarPDF}
                    style={{
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '12px 20px', 
                      border: '2px solid rgba(255,255,255,0.3)', 
                      borderRadius: '12px', 
                      background: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontSize: '14px', 
                      fontWeight: '600', 
                      cursor: 'pointer', 
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.3)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.2)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <i className="fa-solid fa-file-pdf" style={{ fontSize: '16px' }}></i>
                    <span>Exportar PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de filtros avanzado */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '25px',
            marginBottom: '30px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: '12px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-search" style={{ color: 'white', fontSize: '16px' }}></i>
                </div>
                <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1.3rem', fontWeight: '600' }}>
                  Búsqueda de Clientes
                </h4>
              </div>
              
              <div style={{
                background: '#f8fafc',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fa-solid fa-info-circle" style={{ color: '#3b82f6', fontSize: '14px' }}></i>
                <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                  {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''} encontrado{clientesFiltrados.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#374151', 
                fontSize: '14px', 
                fontWeight: '600' 
              }}>
                <i className="fa-solid fa-user-search" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                Buscar por nombre o correo:
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={filtroTexto}
                onChange={(e) => {
                  setFiltroTexto(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: 'white',
                  color: '#374151',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          {/* Tabla de clientes mejorada */}
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
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '15px'
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
                  <i className="fa-solid fa-users" style={{ color: 'white', fontSize: '16px' }}></i>
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1.3rem', fontWeight: '600' }}>
                    Clientes Registrados
                  </h4>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    Total: {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }} id='tabla_clientes'>
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
                      <i className="fa-solid fa-user" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                      CLIENTES
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-map-marker-alt" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                      CIUDAD
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-phone" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                      TELÉFONO
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-envelope" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                      CORREO
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-cogs" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((cliente) => (
                    <tr key={cliente._id} 
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
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                          {cliente.nombre || cliente.clienteInfo?.nombre || 'Sin nombre'}
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
                          {cliente.ciudad || cliente.clienteInfo?.ciudad || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                        {cliente.telefono || cliente.clienteInfo?.telefono || 'N/A'}
                      </td>
                      <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                        {cliente.correo || cliente.clienteInfo?.correo || 'N/A'}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setClienteSeleccionado(cliente);
                              setMostrarModal(true);
                            }}
                            title="Editar cliente"
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
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '80px 20px' }}>
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
                              No hay clientes disponibles
                            </h5>
                            <p style={{ 
                              color: '#9ca3af', 
                              margin: 0, 
                              fontSize: '14px',
                              lineHeight: '1.5'
                            }}>
                              No se encontraron clientes con los criterios de búsqueda
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {mostrarModal && clienteSeleccionado && (
                <ModalEditarCliente
                  cliente={clienteSeleccionado}
                  onClose={() => setMostrarModal(false)}
                  onSave={handleGuardar}
                />
              )}
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
      <div className="custom-footer">
          <p className="custom-footer-text">
            © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
          </p>
        </div>
    </div>
  );
}

