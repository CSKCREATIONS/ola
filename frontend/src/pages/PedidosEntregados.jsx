import React, { useEffect, useState } from 'react';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import html2canvas from 'html2canvas';
import SharedListHeaderCard from '../components/SharedListHeaderCard';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import RemisionPreview from '../components/RemisionPreview';

/* Estilos CSS avanzados para Pedidos Entregados */
const pedidosEntregadosStyles = `
  <style>
    .pedidos-entregados-container {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .entregados-stats-card {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-radius: 16px;
      padding: 25px;
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .entregados-stats-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }

    .entregados-stats-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      
    }

    

    .entregados-header-decoration {
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      z-index: 1;
    }

    .entregados-icon-container {
      background: rgba(255,255,255,0.2);
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(10px);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .entregados-action-btn {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin: 0 2px;
    }

    .entregados-action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(16, 185, 129, 0.4);
    }

    .entregados-action-btn.info {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
    }

    .entregados-action-btn.info:hover {
      box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
    }

    .entregados-export-btn {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin: 0 5px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .entregados-export-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
    }

    .entregados-badge {
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      color: #10b981;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
  </style>
`;

if (typeof document !== 'undefined') {
  const existingStyles = document.getElementById('pedidos-entregados-styles');
  if (!existingStyles) {
    const styleElement = document.createElement('div');
    styleElement.id = 'pedidos-entregados-styles';
    styleElement.innerHTML = pedidosEntregadosStyles;
    document.head.appendChild(styleElement);
  }
}

export default function PedidosEntregados() {
  const [pedidosEntregados, setPedidosEntregados] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [remisionPreview, setRemisionPreview] = useState(null);

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentItems = pedidosEntregados.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);
  const totalPages = Math.ceil(pedidosEntregados.length / itemsPerPage);

  useEffect(() => {
    cargarRemisionesEntregadas();
  }, []);
  const cargarRemisionesEntregadas = async () => {
    try {
      // Usar el endpoint del controlador de remisiones. Cargar todas las remisiones (sin filtrar)
      const res = await api.get('/api/remisiones?limite=1000');
      const data = res.data || res;
      const remisionesArr = Array.isArray(data) ? data : data.remisiones || data.data || [];

      // Normalizar y ordenar por fechaRemision (fallback a updatedAt/createdAt)
      const entregadasOrdenadas = (remisionesArr || []).slice().sort((a, b) => {
        const da = new Date(a.fechaRemision || a.updatedAt || a.createdAt || 0);
        const db = new Date(b.fechaRemision || b.updatedAt || b.createdAt || 0);
        return db - da;
      });

      setPedidosEntregados(entregadasOrdenadas);
    } catch (error) {
      console.error('Error cargando remisiones:', error);
      Swal.fire('Error', 'Error de conexión al cargar remisiones', 'error');
    }
  };

  // Función para ver/obtener remisión (separada para reducir anidamiento en JSX)
  const verRemisionPreview = async (remision) => {
    try {
      // Si la remisión tiene un _id, intentar obtener la versión completa desde el servidor
      if (remision?._id) {
        try {
          const res = await api.get(`/api/remisiones/${remision._id}`);
          const data = res.data || res;
          const rem = data.remision || data;
          setRemisionPreview(rem);
          return;
        } catch (e) {
          // Si falla el fetch, caer al fallback y usar el objeto que ya tenemos
          console.warn('No se pudo obtener remisión por id, usando datos disponibles', e);
        }
      }

      // Fallback: usar el objeto que llegó desde la lista
      setRemisionPreview(remision);
    } catch (error) {
      console.error('Error cargando remisión para vista previa:', error);
      Swal.fire('Error', 'No se pudo cargar la remisión', 'error');
    }
  };

  // Note: crearRemisionDesdePedido removed — not referenced anywhere in this file. Kept pagination and preview handlers.

  const exportarPDF = () => {
    const elementosNoExport = document.querySelectorAll('.no-export');
    for (const el of elementosNoExport) { el.style.display = 'none'; }

    const input = document.getElementById('tabla_entregados');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('pedidos_entregados.pdf');
      for (const el of elementosNoExport) { el.style.display = ''; }
    });
  };

  const exportToExcel = (pedidosEntregados) => {
    if (!pedidosEntregados || pedidosEntregados.length === 0) {
      Swal.fire("Error", "No hay datos para exportar", "warning");
      return;
    }

    const dataFormateada = pedidosEntregados.map(pedido => ({
      'Nombre': pedido.cliente?.nombre || pedido.nombre || pedido.clienteInfo?.nombre || '',
      'Remisión': pedido.numeroRemision || pedido.remision || '',
      'Ciudad': pedido.cliente?.ciudad || pedido.ciudad || pedido.clienteInfo?.ciudad || '',
      'Teléfono': pedido.cliente?.telefono || pedido.telefono || pedido.clienteInfo?.telefono || '',
      'Correo': pedido.cliente?.correo || pedido.correo || pedido.clienteInfo?.correo || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataFormateada);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'ListaPedidosEntregados.xlsx');
  };


  // ModalProductosCotizacion eliminado por no utilizarse

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="max-width">
          <div className="contenido-modulo">
            {/* Encabezado profesional */}
            <SharedListHeaderCard
              title="Pedidos Entregados"
              subtitle="Gestión de pedidos entregados y detalles de entrega"
              iconClass="fa-solid fa-check-circle"
            >
              <div className="export-buttons">
                <button
                  onClick={exportToExcel.bind(this, pedidosEntregados)}
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
              </div>
            </SharedListHeaderCard>

            {/* Estadísticas avanzadas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div className="entregados-stats-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    
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
                      {pedidosEntregados.length}
                    </h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                      Pedidos Entregados
                    </p>
                  </div>
                </div>
              </div>

              <div className="entregados-stats-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
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
                      ${pedidosEntregados.reduce((sum, p) => sum + (p.total || 0), 0).toLocaleString('es-CO')}
                    </h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                      Ingresos Totales
                    </p>
                  </div>
                </div>
              </div>

              <div className="entregados-stats-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    borderRadius: '12px',
                    padding: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fa-solid fa-calendar-alt" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                      {pedidosEntregados.filter(p => {
                        const fechaEntrega = new Date(p.updatedAt);
                        const hoy = new Date();
                        const diferencia = hoy.getTime() - fechaEntrega.getTime();
                        const diasDiferencia = Math.ceil(diferencia / (1000 * 3600 * 24));
                        return diasDiferencia <= 30;
                      }).length}
                    </h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                      Este Mes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controles de exportación */}
            

            {/* Tabla principal con diseño moderno */}
              <div className="table-container">
                <div className="table-header">
                <div className="table-header-content">
                  <div className="table-header-icon">
                    <i className="fa-solid fa-table" style={{ color: 'white', fontSize: '16px' }}></i>
                  </div>
                  <div>
                    <h4 className="table-title">
                      Lista de pedidos entregados
                    </h4>
                    <p className="table-subtitle">
                      Mostrando {currentItems.length} de {pedidosEntregados.length} pedidos entregados
                    </p>
                  </div>
                </div>
              </div  >
                <div style={{ overflow: 'auto' }}>
                  <table className="data-table" id="tabla_entregados">
                    <thead>
                      <tr>
                        <th>
                          <i className="fa-solid fa-hashtag icon-gap" style={{ color: '#6366f1' }}></i><span></span>
                        </th>
                        <th>
                          <i className="fa-solid fa-file-invoice icon-gap" style={{ color: '#6366f1' }}></i><span>REMISIÓN</span>
                        </th>
                        <th>
                          <i className="fa-solid fa-user-pen icon-gap" style={{ color: '#6366f1' }}></i><span>RESPONSABLE</span>
                        </th>
                        <th>
                          <i className="fa-solid fa-user icon-gap" style={{ color: '#6366f1' }}></i><span>CLIENTE</span>
                        </th>
                        <th>
                          <i className="fa-solid fa-calendar-check icon-gap" style={{ color: '#6366f1' }}></i><span>F. ENTREGA</span>
                        </th>
                        <th>
                          <i className="fa-solid fa-location-dot icon-gap" style={{ color: '#6366f1' }}></i><span>CIUDAD</span>
                        </th>
                        <th>
                          <i className="fa-solid fa-dollar-sign icon-gap" style={{ color: '#6366f1' }}></i><span>TOTAL</span>
                        </th>
                        
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((remision, index) => (
                        <tr key={remision._id}>
                          <td style={{ fontWeight: '600', color: '#6366f1' }}>
                            {indexOfFirstItem + index + 1}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="table-icon-small">
                                <i className="fa-solid fa-file-invoice" style={{ color: 'white', fontSize: '12px' }}></i>
                              </div>
                              {remision.numeroRemision ? (
                              <button
                                style={{ cursor: 'pointer', color: '#6366f1', background: 'transparent', textDecoration: 'underline' }}
                                onClick={() => verRemisionPreview(remision)}
                              >
                                
                                <span>{remision.numeroRemision || '---'}</span>
                              </button>
                              ) : (
                                <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>---</span>
                              )}
                            </div>
                          </td>
                          <td style={{ color: '#374151', fontWeight: 600 }}>
                            {remision.responsable ? (
                              (remision.responsable.firstName || remision.responsable.username)
                                ? `${remision.responsable.firstName || ''} ${remision.responsable.surname || ''}`.trim()
                                : (remision.responsable.username || String(remision.responsable))
                            ) : (
                              <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sistema</span>
                            )}
                          </td>
                       
                          <td style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                            {remision.cliente?.nombre || remision.cliente?.nombreCliente || remision.cliente?.nombreCompleto || ''}
                          </td>
                          <td style={{ color: '#6b7280' }}>
                            {new Date(remision.fechaEntrega || remision.fechaRemision || remision.updatedAt || remision.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ color: '#6b7280' }}>
                            {remision.cliente?.ciudad || remision.cliente?.direccion?.ciudad || ''}
                          </td>
                          <td style={{ fontWeight: '600', color: '#6366f1', fontSize: '14px' }}>
                            ${(remision.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          
                        </tr>
                      ))}
                      {pedidosEntregados.length === 0 && (
                        <tr>
                          <td colSpan="8">
                            <div className="table-empty-state">
                              <div className="table-empty-icon">
                                <i className="fa-solid fa-times-circle" style={{ fontSize: '3.5rem', color: '#9ca3af' }}></i>
                              </div>
                              <div>
                                <h5 className="table-empty-title">
                                  No hay pedidos entregados disponibles
                                </h5>
                                <p className="table-empty-text">
                                  No se encontraron pedidos entregados en el sistema
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="pagination" style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '20px',
                gap: '5px'
              }}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: currentPage === i + 1 ?
                        'linear-gradient(135deg, #6366f1, #6366f1)' :
                        '#f3f4f6',
                      color: currentPage === i + 1 ? 'white' : '#374151',
                      fontWeight: '500'
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}

            {remisionPreview && (
              <RemisionPreview
                datos={remisionPreview}
                onClose={() => setRemisionPreview(null)}
              />
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