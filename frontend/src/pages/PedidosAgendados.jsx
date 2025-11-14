import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import EditarPedido from '../components/EditarPedido';
import PedidoAgendadoPreview from '../components/PedidoAgendadoPreview';

/* Estilos CSS avanzados para Pedidos Agendados */
const pedidosAgendadosStyles = `
  <style>
    .pedidos-agendados-container {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .pedidos-stats-card {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-radius: 16px;
      padding: 25px;
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .pedidos-stats-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }

    .pedidos-stats-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #f59e0b, #f97316, #ea580c);
    }

    .pedidos-professional-header {
      background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      color: white;
      position: relative;
      overflow: hidden;
    }

    .pedidos-header-decoration {
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      z-index: 1;
    }

    .pedidos-icon-container {
      background: rgba(255,255,255,0.2);
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(10px);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .pedidos-table-modern {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-radius: 20px;
      padding: 30px;
      border: 1px solid #e5e7eb;
      backdrop-filter: blur(10px);
    }

    .pedidos-table-wrapper {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .pedidos-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 12px;
      overflow: hidden;
    }

    .pedidos-table thead tr {
      background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
      color: white;
    }

    .pedidos-table th {
      padding: 20px 15px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .pedidos-table tbody tr {
      border-bottom: 1px solid #f3f4f6;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .pedidos-table tbody tr:hover {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      transform: scale(1.01);
    }

    .pedidos-table td {
      padding: 20px 15px;
      font-size: 14px;
      color: #374151;
    }

    .pedidos-action-btn {
      background: linear-gradient(135deg, #f59e0b, #ea580c);
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

    .pedidos-action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(245, 158, 11, 0.4);
    }

    .pedidos-action-btn.success {
      background: linear-gradient(135deg, #10b981, #059669);
    }

    .pedidos-action-btn.success:hover {
      box-shadow: 0 5px 15px rgba(16, 185, 129, 0.4);
    }

    .pedidos-action-btn.danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    .pedidos-action-btn.danger:hover {
      box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4);
    }

    .pedidos-add-btn {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 20px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .pedidos-add-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }

    .pedidos-export-btn {
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

    .pedidos-export-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
    }

    .pedidos-badge {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #f59e0b;
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
  const existingStyles = document.getElementById('pedidos-agendados-styles');
  if (!existingStyles) {
    const styleElement = document.createElement('div');
    styleElement.id = 'pedidos-agendados-styles';
    styleElement.innerHTML = pedidosAgendadosStyles;
    document.head.appendChild(styleElement);
  }
}

export default function PedidosAgendados() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [mostrarModalAgendar, setMostrarModalAgendar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [cotizacionPreview, setCotizacionPreview] = useState(null);

  // Función para manejar cuando se envía un email
  const handleEmailSent = (pedidoId) => {
    // Actualizar el estado local si es necesario
    setPedidos(prev => prev.map(p => 
      p._id === pedidoId ? { ...p, enviadoCorreo: true } : p
    ));
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = pedidos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(pedidos.length / itemsPerPage);

  // Cargar pedidos (reutilizable)
  const fetchPedidosAgendados = async () => {
    try {
      const pedidosRes = await api.get('/api/pedidos?populate=true');
      const pedidosData = pedidosRes.data || pedidosRes;
      const agendados = (Array.isArray(pedidosData) ? pedidosData : pedidosData.data || []).filter(p => p.estado === 'agendado');
      const agendadosOrdenados = agendados.sort((a, b) => new Date(b.createdAt || b.fechaCreacion) - new Date(a.createdAt || a.fechaCreacion));
      setPedidos(agendadosOrdenados);
    } catch (error_) {
      console.error('❌ Error al cargar pedidos agendados:', error_);
    }
  };

  useEffect(() => { fetchPedidosAgendados(); }, []);

  const exportarPDF = () => {
    const elementosNoExport = document.querySelectorAll('.no-export');
    for (const el of elementosNoExport) {
      el.style.display = 'none';
    }

    const input = document.getElementById('tabla_despachos');
    if (!input) {
      for (const el of elementosNoExport) {
        el.style.display = '';
      }
      return;
    }

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

      pdf.save('pedidos_agendados.pdf');
      for (const el of elementosNoExport) {
        el.style.display = '';
      }
    }).catch((err) => {
      console.error('Error exporting PDF:', err);
      for (const el of elementosNoExport) {
        el.style.display = '';
      }
    });
  };

  const exportarExcel = () => {
    const elementosNoExport = document.querySelectorAll('.no-export');
    for (const el of elementosNoExport) {
      el.style.display = 'none';
    }

    const tabla = document.getElementById("tabla_despachos");
    if (!tabla) {
      for (const el of elementosNoExport) {
        el.style.display = '';
      }
      return;
    }

    const workbook = XLSX.utils.table_to_book(tabla, { sheet: "Pedidos Agendados" });
    workbook.Sheets["Pedidos Agendados"]["!cols"] = new Array(8).fill({ width: 20 });

    XLSX.writeFile(workbook, 'pedidos_agendados.xlsx');
    for (const el of elementosNoExport) {
      el.style.display = '';
    }
  };

  const cancelarPedido = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Cancelar pedido?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await api.patch(`/api/pedidos/${id}/cancelar`, { });
      const result = res.data || res;
      if (res.status >= 200 && res.status < 300) {
        Swal.fire('Cancelado', 'El pedido ha sido cancelado', 'success');
        setPedidos(prev => prev.filter(p => p._id !== id));
      } else {
        throw new Error(result.message || 'No se pudo cancelar');
      }
    } catch (error) {
      console.error('Error al cancelar pedido:', error);
      Swal.fire('Error', 'No se pudo cancelar el pedido', 'error');
    }
  };

  const remisionarPedido = async (id) => {
    // Mostrar modal para seleccionar fecha de entrega y luego llamar al endpoint de remisión
    try {
      const defaultDate = pedidoDefaultDateForSwal(id);
      const { value: fechaSeleccionada } = await Swal.fire({
        title: 'Seleccione la fecha de entrega',
        input: 'date',
        inputLabel: 'Fecha de entrega',
        inputValue: defaultDate,
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar'
      });

      if (!fechaSeleccionada) return; // usuario canceló o no escogió

      // Llamar al backend para crear la remisión desde el pedido
      const res = await api.post(`/api/pedidos/${id}/remisionar`, { fechaEntrega: fechaSeleccionada });
      const data = res.data || res;
      if (res.status >= 200 && res.status < 300) {
        setPedidos(prev => prev.filter(p => p._id !== id));
        await Swal.fire('Remisión creada', 'La remisión se ha creado correctamente.', 'success');
        navigate('/PedidosEntregados');
      } else {
        throw new Error(data.message || 'No se pudo crear la remisión');
      }
    } catch (error) {
      console.error('Error al remisionar pedido:', error);
      Swal.fire('Error', error.message || 'No se pudo remisionar el pedido', 'error');
    }
  };

  // Helper: compute YYYY-MM-DD default date for Swal input from pedido fechaEntrega if available
  const pedidoDefaultDateForSwal = (pedidoId) => {
    try {
  const p = pedidos.find(x => x._id === pedidoId) || {};
  if (!p?.fechaEntrega) return '';
      const d = new Date(p.fechaEntrega);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch (error_) {
      return '';
    }
  };

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="contenido-modulo">
          {/* Encabezado profesional */}
          <div className="pedidos-professional-header">
            <div className="pedidos-header-decoration"></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="pedidos-icon-container">
                  <i className="fa-solid fa-calendar-check" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                </div>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '700' }}>
                    Pedidos Agendados
                  </h2>
                  <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                    Control y gestión de pedidos programados para entrega
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
            <div className="pedidos-stats-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-calendar-check" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {pedidos.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Pedidos Agendados
                  </p>
                </div>
              </div>
            </div>

            <div className="pedidos-stats-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-chart-line" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    ${pedidos.reduce((sum, p) => sum + (p.total || 0), 0).toLocaleString('es-CO')}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Total en Ventas
                  </p>
                </div>
              </div>
            </div>

            <div className="pedidos-stats-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-clock" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {pedidos.filter(p => new Date(p.fechaEntrega) <= new Date(Date.now() + 24*60*60*1000)).length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Entregas Próximas
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controles de exportación y acciones */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="pedidos-export-btn" onClick={exportarExcel}>
                <i className="fa-solid fa-file-excel"></i>
                <span>Exportar a Excel</span>
              </button>
              <button className="pedidos-export-btn" onClick={exportarPDF}>
                <i className="fa-solid fa-file-pdf"></i>
                <span>Exportar a PDF</span>
              </button>
            </div>
            <div>
              <button 
                className='pedidos-add-btn' 
                onClick={() => setMostrarModalAgendar(true)}
              >
                <i className="fa-solid fa-plus"></i>
                <span>Agendar Pedido</span>
              </button>
            </div>
          </div>

          {/* Tabla principal con diseño moderno */}
          <div className="pedidos-table-modern">
            <div className="pedidos-table-wrapper">
              <table className="pedidos-table" id="tabla_despachos">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Identificador de Pedido</th>
                    <th>F. Agendamiento</th>
                    <th>F. Entrega</th>
                    <th>Cliente</th>
                    <th>Ciudad</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((pedido, index) => (
                    <tr key={pedido._id}>
                      <td style={{ fontWeight: '500', color: '#6b7280' }}>
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td style={{ fontWeight: '600', color: '#1f2937' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                            borderRadius: '8px',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '35px'
                          }}>
                            <i className="fa-solid fa-file-invoice" style={{ color: 'white', fontSize: '12px' }}></i>
                          </div>
                          {pedido.numeroPedido ? (
                              <button
                                type="button"
                                style={{
                                  cursor: 'pointer',
                                  color: '#f59e0b',
                                  textDecoration: 'underline',
                                  fontWeight: 'bold',
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  font: 'inherit'
                                }}
                                onClick={async () => {
                                      try {
                                        const res = await api.get(`/api/pedidos/${pedido._id}?populate=true`);
                                        // normalize response shape
                                        const data = res.data || res;
                                        const pedidoCompleto = data.data || data;
                                        setCotizacionPreview(pedidoCompleto);
                                      } catch (error) {
                                        console.error('Error loading pedido:', error);
                                        Swal.fire('Error', 'No se pudo cargar la información del pedido.', 'error');
                                      }
                                    }}
                                title="Clic para ver información del pedido"
                              >
                                {pedido.numeroPedido}
                              </button>
                          ) : '---'}
                        </div>
                      </td>
                      <td style={{ color: '#6b7280' }}>
                        {new Date(pedido.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ color: '#6b7280' }}>
                        {new Date(pedido.fechaEntrega).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: '500', color: '#1f2937' }}>
                        {pedido.cliente?.nombre}
                      </td>
                      <td style={{ color: '#6b7280' }}>
                        {pedido.cliente?.ciudad}
                      </td>
                      <td style={{ fontWeight: '600', color: '#059669', fontSize: '14px' }}>
                        ${(pedido.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="no-export">
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            className='pedidos-action-btn success'
                            onClick={() => remisionarPedido(pedido._id)}
                            title="Marcar como entregado"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            className='pedidos-action-btn danger'
                            onClick={() => cancelarPedido(pedido._id)}
                            title="Marcar como cancelado"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pedidos.length === 0 && (
                    <tr>
                      <td 
                        colSpan={8} 
                        style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#9ca3af',
                          fontStyle: 'italic',
                          fontSize: '16px'
                        }}
                      >
                        No hay pedidos agendados disponibles
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
                      'linear-gradient(135deg, #f59e0b, #ea580c)' : 
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

          {/* Modal de vista previa de pedido agendado */}
          {cotizacionPreview && (
            <PedidoAgendadoPreview
              datos={cotizacionPreview}
              onClose={() => setCotizacionPreview(null)}
              onEmailSent={handleEmailSent}
              onRemisionar={() => remisionarPedido(cotizacionPreview._id)}
            />
          )}

          <EditarPedido />

          {/** Modal: Agendar Pedido **/}
          {mostrarModalAgendar && (
            <div className="modal-overlay">
              <div className="modal-compact modal-lg">
                <div className="modal-header">
                  <h5 className="modal-title">Agendar Pedido</h5>
                  <button 
                    className="modal-close" 
                    onClick={() => setMostrarModalAgendar(false)}
                  >
                    &times;
                  </button>
                </div>
                <div className="modal-body">
                  <p style={{ 
                    textAlign: 'center', 
                    color: '#6b7280',
                    fontSize: '16px',
                    padding: '20px',
                    fontStyle: 'italic'
                  }}>
                    Esta funcionalidad estará disponible próximamente.
                  </p>
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