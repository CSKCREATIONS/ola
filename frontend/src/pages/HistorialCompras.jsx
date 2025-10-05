// frontend/pages/HistorialCompras.jsx
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavCompras from '../components/NavCompras';

// CSS inyectado para diseño avanzado
const advancedStyles = `
  .historial-compras-advanced-table {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #e5e7eb;
  }
  
  .historial-compras-header-section {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    padding: 20px 25px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .historial-compras-table-container {
    overflow: auto;
  }
  
  .historial-compras-advanced-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  
  .historial-compras-advanced-table thead tr {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-bottom: 2px solid #e5e7eb;
  }
  
  .historial-compras-advanced-table thead th {
    padding: 16px 12px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 13px;
    letter-spacing: 0.5px;
  }
  
  .historial-compras-advanced-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }
  
  .historial-compras-advanced-table tbody tr:hover {
    background-color: #f8fafc;
  }
  
  .historial-compras-advanced-table tbody td {
    padding: 16px 12px;
    color: #4b5563;
    font-weight: 500;
  }
  
  .historial-compras-pagination-container {
    padding: 20px 25px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: center;
    gap: 8px;
  }
  
  .historial-compras-pagination-btn {
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
  
  .historial-compras-pagination-btn.active {
    border-color: #6366f1;
    background: #6366f1;
    color: white;
  }
  
  .historial-compras-pagination-btn:hover:not(.active) {
    border-color: #6366f1;
    color: #6366f1;
  }
  
  .historial-compras-action-btn {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    color: #1e40af;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(30, 64, 175, 0.2);
  }
  
  .historial-compras-action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(30, 64, 175, 0.3);
  }
`;

// Inyectar estilos
if (!document.getElementById('historial-compras-advanced-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'historial-compras-advanced-styles';
  styleSheet.textContent = advancedStyles;
  document.head.appendChild(styleSheet);
}

export default function HistorialCompras() {
  const [compras, setCompras] = useState([]);
  const [modalDetallesVisible, setModalDetallesVisible] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = compras.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(compras.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const fetchCompras = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/compras', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCompras(data.data || data);
      } else {
        Swal.fire('Error', data.message || 'No se pudieron cargar las compras', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  const verDetallesCompra = (compra) => {
    setCompraSeleccionada(compra);
    setModalDetallesVisible(true);
  };

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavCompras />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '16px',
                  padding: '20px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <i className="fa-solid fa-history" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                </div>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '700' }}>
                    Historial de Compras
                  </h2>
                  <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                    Compras realizadas a partir de órdenes de compra
                  </p>
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
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
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
                  <i className="fa-solid fa-shopping-cart" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {compras.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Total Compras
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
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
                  <i className="fa-solid fa-dollar-sign" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    ${compras.reduce((sum, c) => sum + (c.total || 0), 0).toLocaleString()}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Valor Total Compras
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
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
                  <i className="fa-solid fa-chart-bar" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {compras.length > 0 ? (compras.reduce((sum, c) => sum + (c.total || 0), 0) / compras.length).toLocaleString() : 0}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Promedio por Compra
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Tabla principal con diseño moderno */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid #e5e7eb',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              overflowX: 'auto',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white'
                  }}>
                    <th style={{
                      padding: '20px 15px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>#</th>
                    <th style={{
                      padding: '20px 15px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Número Orden</th>
                    <th style={{
                      padding: '20px 15px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Proveedor</th>
                    <th style={{
                      padding: '20px 15px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Total</th>
                    <th style={{
                      padding: '20px 15px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Fecha</th>
                    <th style={{
                      padding: '20px 15px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Solicitado Por</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((compra, index) => (
                    <tr 
                      key={compra._id} 
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc, #f1f5f9)';
                        e.currentTarget.style.transform = 'scale(1.01)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <td style={{
                        padding: '20px 15px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td style={{
                        padding: '20px 15px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1f2937'
                      }}>
                        <button
                          onClick={() => verDetallesCompra(compra)}
                          style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            textDecoration: 'none'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 5px 15px rgba(99, 102, 241, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          {compra.numeroOrden || 'N/A'}
                        </button>
                      </td>
                      <td style={{
                        padding: '20px 15px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        {compra.proveedor?.nombre || compra.proveedor || 'Proveedor no especificado'}
                      </td>
                      <td style={{
                        padding: '20px 15px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#059669'
                      }}>
                        ${compra.total?.toLocaleString()}
                      </td>
                      <td style={{
                        padding: '20px 15px',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        {new Date(compra.fecha || compra.fechaCompra).toLocaleDateString()}
                      </td>
                      <td style={{
                        padding: '20px 15px',
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        {compra.solicitadoPor || compra.responsable || 'No especificado'}
                      </td>
                    </tr>
                  ))}
                  {compras.length === 0 && (
                    <tr>
                      <td 
                        colSpan="6" 
                        style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#9ca3af',
                          fontStyle: 'italic',
                          fontSize: '16px'
                        }}
                      >
                        No hay compras registradas en el historial
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación moderna */}
          {compras.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              marginTop: '30px',
              padding: '20px'
            }}>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  background: currentPage === 1 ? '#f3f4f6' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: currentPage === 1 ? '#9ca3af' : 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                ← Anterior
              </button>

              <div style={{ display: 'flex', gap: '5px' }}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    style={{
                      background: currentPage === i + 1 ? 
                        'linear-gradient(135deg, #6366f1, #8b5cf6)' : 
                        'white',
                      color: currentPage === i + 1 ? 'white' : '#6b7280',
                      border: '1px solid #e5e7eb',
                      padding: '10px 15px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minWidth: '45px'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== i + 1) {
                        e.target.style.background = '#f8fafc';
                        e.target.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== i + 1) {
                        e.target.style.background = 'white';
                        e.target.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  background: currentPage === totalPages ? '#f3f4f6' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: currentPage === totalPages ? '#9ca3af' : 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Siguiente →
              </button>
            </div>
          )}

          {/* Modal de detalles de la compra */}
          {modalDetallesVisible && compraSeleccionada && (
    <div className="modal-overlay">
        <div className="modal-realista modal-lg" style={{ 
            maxWidth: '900px', 
            width: '95%',
            cursor: 'move'
        }} id="modalCompraMovible">
            
            {/* Header mejorado */}
            <div className="modal-header-realista" style={{
                background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                color: 'white',
                padding: '1.5rem 2rem',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
                cursor: 'move'
            }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    width: '100%'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <i className="fa-solid fa-receipt" style={{ fontSize: '1.8rem' }}></i>
                        <div>
                            <h5 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>
                                COMPRA CONFIRMADA
                            </h5>
                            <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem' }}>
                                N°: <strong>{compraSeleccionada.numeroOrden}</strong>
                            </p>
                        </div>
                    </div>
                    <button 
                        className="modal-close-realista" 
                        onClick={() => setModalDetallesVisible(false)}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.8rem',
                            cursor: 'pointer',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.3)';
                            e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.2)';
                            e.target.style.transform = 'scale(1)';
                        }}
                    >
                        &times;
                    </button>
                </div>
            </div>

            {/* Body con diseño mejorado */}
            <div className="modal-body" style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
                
                {/* Información principal en cards */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    {/* Card Proveedor */}
                    <div style={{
                        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                        padding: '1.5rem',
                        borderRadius: '10px',
                        border: '1px solid #e0e0e0'
                    }}>
                        <h6 style={{ 
                            color: '#2c3e50', 
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <i className="fa-solid fa-truck" style={{ color: '#e74c3c' }}></i>
                            PROVEEDOR
                        </h6>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {compraSeleccionada.proveedor?.nombre || compraSeleccionada.proveedor || 'No especificado'}
                        </p>
                    </div>

                    {/* Card Fecha y Responsable */}
                    <div style={{
                        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                        padding: '1.5rem',
                        borderRadius: '10px',
                        border: '1px solid #e0e0e0'
                    }}>
                        <h6 style={{ 
                            color: '#2c3e50', 
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <i className="fa-solid fa-calendar-alt" style={{ color: '#3498db' }}></i>
                            INFORMACIÓN
                        </h6>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <div>
                                <span style={{ color: '#666' }}>Fecha: </span>
                                <strong>{new Date(compraSeleccionada.fecha || compraSeleccionada.fechaCompra).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#666' }}>Responsable: </span>
                                <strong>{compraSeleccionada.solicitadoPor || compraSeleccionada.responsable || 'No especificado'}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen financiero */}
                <div style={{
                    background: 'linear-gradient(135deg, #2c3e50, #34495e)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '10px',
                    marginBottom: '2rem'
                }}>
                    <h6 style={{ 
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <i className="fa-solid fa-chart-bar"></i>
                        RESUMEN FINANCIERO
                    </h6>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '1rem',
                        textAlign: 'center'
                    }}>
                        <div>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>SUBTOTAL</p>
                            <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>
                                ${compraSeleccionada.subtotal?.toLocaleString() || '0'}
                            </p>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>IVA (19%)</p>
                            <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>
                                ${compraSeleccionada.impuestos?.toLocaleString() || '0'}
                            </p>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>TOTAL</p>
                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#f39c12' }}>
                                ${compraSeleccionada.total?.toLocaleString() || '0'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Observaciones */}
                {compraSeleccionada.observaciones && (
                    <div style={{
                        background: '#fffbf0',
                        border: '1px solid #ffeaa7',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        <h6 style={{ 
                            color: '#f39c12',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <i className="fa-solid fa-sticky-note"></i>
                            OBSERVACIONES
                        </h6>
                        <p style={{ margin: 0, color: '#856404', lineHeight: '1.5' }}>
                            {compraSeleccionada.observaciones}
                        </p>
                    </div>
                )}

                {/* Tabla de productos mejorada */}
                <h6 style={{ 
                    color: '#2c3e50',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <i className="fa-solid fa-boxes"></i>
                    DETALLE DE PRODUCTOS ({compraSeleccionada.productos?.length || 0})
                </h6>

                <div className="table-responsive" style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <table className="table-profesional" style={{ 
                        width: '100%',
                        minWidth: '700px'
                    }}>
                        <thead>
                            <tr style={{ 
                                background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                                color: 'white'
                            }}>
                                <th style={{ padding: '1rem', fontWeight: '600', width: '5%' }}>#</th>
                                <th style={{ padding: '1rem', fontWeight: '600', width: '25%' }}>PRODUCTO</th>
                                <th style={{ padding: '1rem', fontWeight: '600', width: '30%' }}>DESCRIPCIÓN</th>
                                <th style={{ padding: '1rem', fontWeight: '600', width: '10%', textAlign: 'center' }}>CANTIDAD</th>
                                <th style={{ padding: '1rem', fontWeight: '600', width: '15%', textAlign: 'right' }}>PRECIO UNIT.</th>
                                <th style={{ padding: '1rem', fontWeight: '600', width: '15%', textAlign: 'right' }}>SUBTOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {compraSeleccionada.productos?.map((p, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #e9ecef' }}>
                                    <td style={{ padding: '1rem', color: '#666' }}>{i + 1}</td>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>
                                        {p.producto?.name || p.producto || 'Producto no especificado'}
                                    </td>
                                    <td style={{ padding: '1rem', color: '#666' }}>
                                        {p.descripcion || p.producto?.description || 'N/A'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{ 
                                            background: '#e3f2fd', 
                                            color: '#1976d2',
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '15px',
                                            fontWeight: '600',
                                            fontSize: '0.8rem'
                                        }}>
                                            {p.cantidad}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500' }}>
                                        ${p.precioUnitario?.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#2c3e50' }}>
                                        ${((p.cantidad || 0) * (p.precioUnitario || 0))?.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {(!compraSeleccionada.productos || compraSeleccionada.productos.length === 0) && (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '2rem',
                        color: '#666',
                        fontStyle: 'italic'
                    }}>
                        <i className="fa-solid fa-inbox" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
                        No hay productos registrados en esta compra
                    </div>
                )}
            </div>

            {/* Footer mejorado */}
            <div className="modal-footer" style={{
                padding: '1.5rem 2rem',
                borderTop: '1px solid #e0e0e0',
                background: '#f8f9fa',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666' }}>
                    <i className="fa-solid fa-circle-check" style={{ color: '#27ae60' }}></i>
                    <span>Compra confirmada y procesada</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn-profesional btn-primary-profesional"
                        onClick={() => window.print()}
                    >
                        <i className="fa-solid fa-print"></i>
                        Imprimir
                    </button>
                    <button
                        className="btn-profesional"
                        onClick={() => setModalDetallesVisible(false)}
                        style={{ 
                            background: '#95a5a6', 
                            color: 'white',
                            padding: '0.5rem 1.5rem'
                        }}
                    >
                        <i className="fa-solid fa-times"></i>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    </div>
)}

          
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