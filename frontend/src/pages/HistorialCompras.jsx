// frontend/pages/HistorialCompras.jsx
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavCompras from '../components/NavCompras';

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
          <div className='encabezado-modulo'>
            <div>
              <h3 className='titulo-profesional'>Historial de Compras</h3>
              <p className='subtitulo'>Compras realizadas a partir de órdenes de compra</p>
            </div>
          </div>

          <br />
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Número Orden</th>
                  <th>Proveedor</th>
                  <th>Total</th>
                  <th>Fecha</th>
                  <th>Solicitado Por</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((compra, index) => (
                  <tr key={compra._id}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>
                      <button
                        onClick={() => verDetallesCompra(compra)}
                        className="btn btn-link btn-sm p-0"
                        style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}
                      >
                        {compra.numeroOrden || 'N/A'}
                      </button>
                    </td>
                    <td>{compra.proveedor?.nombre || compra.proveedor || 'Proveedor no especificado'}</td>
                    <td>${compra.total?.toLocaleString()}</td>
                    <td>{new Date(compra.fecha || compra.fechaCompra).toLocaleDateString()}</td>
                    <td>{compra.solicitadoPor || compra.responsable || 'No especificado'}</td>
                  </tr>
                ))}
                {compras.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">No hay compras registradas en el historial</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {compras.length > 0 && (
            <div className="pagination">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Anterior
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={currentPage === i + 1 ? 'active-page' : 'pagination-btn'}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Siguiente
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