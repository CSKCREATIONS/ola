import React, { useEffect, useState } from 'react';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import PedidoCanceladoPreview from '../components/PedidoCanceladoPreview';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import { normalizePedidosArray } from '../utils/calculations';

/* Estilos CSS avanzados para Pedidos Cancelados */
const pedidosCanceladosStyles = `
  <style>
    .pedidos-cancelados-container {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .cancelados-stats-card {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-radius: 16px;
      padding: 25px;
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .cancelados-stats-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }

    .cancelados-stats-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #ef4444, #dc2626, #b91c1c);
    }

    .cancelados-professional-header {
      background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      color: white;
      position: relative;
      overflow: hidden;
    }

    .cancelados-header-decoration {
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      z-index: 1;
    }

    .cancelados-icon-container {
      background: rgba(255,255,255,0.2);
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(10px);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .cancelados-table-modern {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-radius: 20px;
      padding: 30px;
      border: 1px solid #e5e7eb;
      backdrop-filter: blur(10px);
    }

    .cancelados-table-wrapper {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .cancelados-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 12px;
      overflow: hidden;
    }

    .cancelados-table thead tr {
      background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
      color: white;
    }

    .cancelados-table th {
      padding: 20px 15px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cancelados-table tbody tr {
      border-bottom: 1px solid #f3f4f6;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .cancelados-table tbody tr:hover {
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      transform: scale(1.01);
    }

    .cancelados-table td {
      padding: 20px 15px;
      font-size: 14px;
      color: #374151;
    }

    .cancelados-action-btn {
      background: linear-gradient(135deg, #ef4444, #dc2626);
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

    .cancelados-action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4);
    }

    .cancelados-action-btn.info {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
    }

    .cancelados-action-btn.info:hover {
      box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
    }

    .cancelados-export-btn {
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

    .cancelados-export-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
    }

    .cancelados-badge {
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      color: #ef4444;
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
  const existingStyles = document.getElementById('pedidos-cancelados-styles');
  if (!existingStyles) {
    const styleElement = document.createElement('div');
    styleElement.id = 'pedidos-cancelados-styles';
    styleElement.innerHTML = pedidosCanceladosStyles;
    document.head.appendChild(styleElement);
  }
}

export default function PedidosCancelados() {
  const [pedidosCancelados, setPedidosCancelados] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [mostrarCancelado, setMostrarCancelado] = useState(false);
  const [datosCancelado, setDatosCancelado] = useState(null);
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = pedidosCancelados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(pedidosCancelados.length / itemsPerPage);

  useEffect(() => {
    cargarPedidosCancelados();
  }, []);

  const cargarPedidosCancelados = async () => {
    try {
      const res = await api.get('/api/pedidos?populate=true');
      const raw = res?.data ?? res;
      let arr = [];
      if (Array.isArray(raw)) arr = raw;
      else if (Array.isArray(raw.data)) arr = raw.data;
      else if (Array.isArray(raw.pedidos)) arr = raw.pedidos;
      else if (raw.data && Array.isArray(raw.data.pedidos)) arr = raw.data.pedidos;
      else {
        const candidate = Object.values(raw || {}).find(v => Array.isArray(v));
        arr = Array.isArray(candidate) ? candidate : [];
      }

      const normalized = normalizePedidosArray(arr);
      const cancelados = normalized.filter(pedido => pedido?.estado === 'cancelado');
      const canceladosOrdenados = cancelados.slice();
      canceladosOrdenados.sort((a, b) => new Date(b.createdAt || b.fechaCreacion) - new Date(a.createdAt || a.fechaCreacion));
      setPedidosCancelados(canceladosOrdenados);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'Error de conexión', 'error');
    } finally {
      // loading eliminado por no usarse
    }
  };

  const exportarPDF = () => {
    const elementosNoExport = document.querySelectorAll('.no-export');
    for (const el of elementosNoExport) { el.style.display = 'none'; }

    const input = document.getElementById('tabla_cancelados');
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

      pdf.save('pedidos_cancelados.pdf');
      for (const el of elementosNoExport) { el.style.display = ''; }
    });
  };

  const exportarExcel = () => {
    const elementosNoExport = document.querySelectorAll('.no-export');
    for (const el of elementosNoExport) { el.style.display = 'none'; }

    const tabla = document.getElementById("tabla_cancelados");
    const workbook = XLSX.utils.table_to_book(tabla, { sheet: "Pedidos Cancelados" });
  workbook.Sheets["Pedidos Cancelados"]["!cols"] = new Array(7).fill({ width: 20 });

    XLSX.writeFile(workbook, 'pedidos_cancelados.xlsx');
    for (const el of elementosNoExport) { el.style.display = ''; }
  };

  const verDetallesCancelado = async (pedidoId) => {
    try {
      const res = await api.get(`/api/pedidos/${pedidoId}?populate=true`);
      const pedidoCompleto = res.data || res;
      setDatosCancelado(pedidoCompleto);
      setMostrarCancelado(true);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'Error al cargar detalles del pedido', 'error');
    }
  };

  // ModalProductosCotizacion eliminado por no utilizarse

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="contenido-modulo">
          {/* Encabezado profesional */}
          <div className="cancelados-professional-header">
            <div className="cancelados-header-decoration"></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="cancelados-icon-container">
                  <i className="fa-solid fa-times-circle" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                </div>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '700' }}>
                    Pedidos Cancelados
                  </h2>
                  <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                    Gestión de pedidos cancelados y motivos de cancelación
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
            <div className="cancelados-stats-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-times-circle" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {pedidosCancelados.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Pedidos Cancelados
                  </p>
                </div>
              </div>
            </div>

            <div className="cancelados-stats-card">
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
                    ${pedidosCancelados.reduce((sum, p) => sum + (p.total || 0), 0).toLocaleString('es-CO')}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Valor Perdido
                  </p>
                </div>
              </div>
            </div>

            <div className="cancelados-stats-card">
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
                    {pedidosCancelados.filter(p => {
                      const fechaCancelacion = new Date(p.updatedAt);
                      const hoy = new Date();
                      const diferencia = hoy.getTime() - fechaCancelacion.getTime();
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
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <button className="cancelados-export-btn" onClick={exportarExcel}>
              <i className="fa-solid fa-file-excel"></i>
              <span>Exportar a Excel</span>
            </button>
            <button className="cancelados-export-btn" onClick={exportarPDF}>
              <i className="fa-solid fa-file-pdf"></i>
              <span>Exportar a PDF</span>
            </button>
          </div>

          {/* Tabla principal con diseño moderno */}
          <div className="cancelados-table-modern">
            <div className="cancelados-table-wrapper">
              <table className="cancelados-table" id="tabla_cancelados">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Identificador de Pedido</th>
                    <th>F. Cancelación</th>
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
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            borderRadius: '8px',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '35px'
                          }}>
                            <i className="fa-solid fa-file-invoice" style={{ color: 'white', fontSize: '12px' }}></i>
                          </div>
                          <span>{pedido.numeroPedido || '---'}</span>
                        </div>
                      </td>
                      <td style={{ color: '#6b7280' }}>
                        {new Date(pedido.updatedAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: '500', color: '#1f2937' }}>
                        {pedido.cliente?.nombre}
                      </td>
                      <td style={{ color: '#6b7280' }}>
                        {pedido.cliente?.ciudad}
                      </td>
                      <td style={{ fontWeight: '600', color: '#ef4444', fontSize: '14px' }}>
                        ${(pedido.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="no-export">
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            className='cancelados-action-btn info'
                            onClick={() => verDetallesCancelado(pedido._id)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pedidosCancelados.length === 0 && (
                    <tr>
                      <td 
                        colSpan={7} 
                        style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#9ca3af',
                          fontStyle: 'italic',
                          fontSize: '16px'
                        }}
                      >
                        No hay pedidos cancelados disponibles
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
                      'linear-gradient(135deg, #ef4444, #dc2626)' : 
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

          {/* Modal de vista previa de pedido cancelado */}
          {mostrarCancelado && datosCancelado && (
            <PedidoCanceladoPreview
              datos={datosCancelado}
              onClose={() => setMostrarCancelado(false)}
            />
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