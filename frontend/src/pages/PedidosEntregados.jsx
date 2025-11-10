import React, { useEffect, useState } from 'react';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import html2canvas from 'html2canvas';
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
      background: linear-gradient(90deg, #10b981, #059669, #047857);
    }

    .entregados-professional-header {
      background: linear-gradient(135deg, #10b981 0%, #047857 100%);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      color: white;
      position: relative;
      overflow: hidden;
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

    .entregados-table-modern {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-radius: 20px;
      padding: 30px;
      border: 1px solid #e5e7eb;
      backdrop-filter: blur(10px);
    }

    .entregados-table-wrapper {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .entregados-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 12px;
      overflow: hidden;
    }

    .entregados-table thead tr {
      background: linear-gradient(135deg, #10b981 0%, #047857 100%);
      color: white;
    }

    .entregados-table th {
      padding: 20px 15px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .entregados-table tbody tr {
      border-bottom: 1px solid #f3f4f6;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .entregados-table tbody tr:hover {
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      transform: scale(1.01);
    }

    .entregados-table td {
      padding: 20px 15px;
      font-size: 14px;
      color: #374151;
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = pedidosEntregados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(pedidosEntregados.length / itemsPerPage);

  useEffect(() => {
    cargarPedidosEntregados();
  }, []);

  const cargarPedidosEntregados = async () => {
    try {
      const res = await api.get('/api/pedidos?populate=true');
      const data = res.data || res;
      const arr = Array.isArray(data) ? data : data.data || [];
      const entregados = arr.filter(pedido => pedido.estado === 'entregado');
      const entregadosOrdenados = entregados.sort((a, b) => new Date(b.createdAt || b.fechaCreacion) - new Date(a.createdAt || a.fechaCreacion));
      setPedidosEntregados(entregadosOrdenados);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'Error de conexión', 'error');
    } finally {
      // loading eliminado por no usarse
    }
  };

  // 🆕 Función para crear remisión desde pedido
  const crearRemisionDesdePedido = async (pedidoId) => {
    try {
      // Mostrar loading
      Swal.fire({
        title: 'Creando remisión...',
        text: 'Por favor espere mientras se genera la remisión',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await api.post(`/api/remisiones/crear-desde-pedido/${pedidoId}`);
      const result = res.data || res;

      Swal.close();

        if (result.existente) {
        // Ya existe una remisión
        Swal.fire({
          icon: 'info',
          title: 'Remisión existente',
          text: `Ya existe la remisión ${result.remision?.numeroRemision || ''} para este pedido`,
          confirmButtonText: 'Ver remisión'
        }).then((r) => {
          if (r.isConfirmed) {
              // No abrimos modal local aquí; el usuario puede navegar a la remisión desde la lista
          }
        });
      } else {
        // Remisión creada exitosamente
        Swal.fire({
          icon: 'success',
          title: 'Remisión creada',
          text: `Se ha creado la remisión ${result.remision?.numeroRemision || ''}`,
          confirmButtonText: 'Ver remisión'
        }).then((swalResult) => {
          // El usuario podrá ver la remisión desde la lista; no abrimos modal local.
        });
      }

    } catch (error) {
      console.error('Error al crear remisión:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo crear la remisión'
      });
    }
  };

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

  const exportarExcel = () => {
    const elementosNoExport = document.querySelectorAll('.no-export');
    for (const el of elementosNoExport) { el.style.display = 'none'; }

    const tabla = document.getElementById("tabla_entregados");
    const workbook = XLSX.utils.table_to_book(tabla, { sheet: "Pedidos Entregados" });
    workbook.Sheets["Pedidos Entregados"]["!cols"] = Array(7).fill({ width: 20 });

    XLSX.writeFile(workbook, 'pedidos_entregados.xlsx');
    for (const el of elementosNoExport) { el.style.display = ''; }
  };
  

  // ModalProductosCotizacion eliminado por no utilizarse

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="contenido-modulo">
          {/* Encabezado profesional */}
          <div className="entregados-professional-header">
            <div className="entregados-header-decoration"></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="entregados-icon-container">
                  <i className="fa-solid fa-check-circle" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                </div>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '700' }}>
                    Pedidos Entregados
                  </h2>
                  <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                    Aquí encontrará las ventas concretadas con sus respectivas remisiones
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
            <div className="entregados-stats-card">
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
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <button className="entregados-export-btn" onClick={exportarExcel}>
              <i className="fa-solid fa-file-excel"></i>
              <span>Exportar a Excel</span>
            </button>
            <button className="entregados-export-btn" onClick={exportarPDF}>
              <i className="fa-solid fa-file-pdf"></i>
              <span>Exportar a PDF</span>
            </button>
          </div>

          {/* Tabla principal con diseño moderno */}
          <div className="entregados-table-modern">
            <div className="entregados-table-wrapper">
              <table className="entregados-table" id="tabla_entregados">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Remisión</th>
                    <th>F. Entrega</th>
                    <th>Cliente</th>
                    <th>Ciudad</th>
                    <th>Total</th>
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
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            borderRadius: '8px',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '35px'
                          }}>
                            <i className="fa-solid fa-file-invoice" style={{ color: 'white', fontSize: '12px' }}></i>
                          </div>
                          <button
                            type="button"
                            style={{
                              cursor: 'pointer',
                              color: '#10b981',
                              textDecoration: 'underline',
                              fontWeight: 'bold',
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              font: 'inherit'
                            }} 
                            onClick={async () => {
                              try {
                                // Primero intentar obtener remisión existente desde el pedido
                                // Estrategia: buscar remisión llamando endpoint crear-desde-pedido (que retorna existente si ya hay)
                                const res = await api.post(`/api/remisiones/crear-desde-pedido/${pedido._id}`);
                                const data = res.data || res;
                                if (data.remision) {
                                  setRemisionPreview(data.remision);
                                } else {
                                  // Si no viene remision detallada, intentar fallback obtener pedido completo y mapear estructura mínima
                                  const pedidoRes = await api.get(`/api/pedidos/${pedido._id}?populate=true`);
                                  const pedidoData = (pedidoRes.data || pedidoRes).data || (pedidoRes.data || pedidoRes);
                                  const remisionLike = {
                                    numeroRemision: 'REM-PED-' + (pedidoData.numeroPedido || pedidoData._id?.slice(-6)),
                                    codigoPedido: pedidoData.numeroPedido,
                                    fechaRemision: pedidoData.updatedAt || pedidoData.createdAt,
                                    fechaEntrega: pedidoData.fechaEntrega,
                                    estado: 'activa',
                                    cliente: pedidoData.cliente || {},
                                    productos: (pedidoData.productos || []).map(p => ({
                                      nombre: p.product?.name || p.product?.nombre || p.nombre || 'Producto',
                                      cantidad: p.cantidad,
                                      precioUnitario: p.precioUnitario,
                                      total: p.cantidad * (p.precioUnitario || 0),
                                      descripcion: p.product?.description || p.product?.descripcion || '',
                                      codigo: p.product?.code || p.product?.codigo || ''
                                    })),
                                    total: (pedidoData.productos || []).reduce((sum, pr) => sum + pr.cantidad * (pr.precioUnitario || 0), 0),
                                    observaciones: pedidoData.observacion || '',
                                  };
                                  setRemisionPreview(remisionLike);
                                }
                              } catch (error) {
                                console.error('Error cargando remisión/pedido para vista previa:', error);
                                Swal.fire('Error', 'No se pudo cargar la remisión del pedido', 'error');
                              }
                            }}
                          >
                            {pedido.numeroPedido || '---'}
                          </button>
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
                      <td style={{ fontWeight: '600', color: '#10b981', fontSize: '14px' }}>
                        ${(pedido.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {pedidosEntregados.length === 0 && (
                    <tr>
                      <td 
                        colSpan={6} 
                        style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#9ca3af',
                          fontStyle: 'italic',
                          fontSize: '16px'
                        }}
                      >
                        No hay pedidos entregados disponibles
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
                      'linear-gradient(135deg, #10b981, #059669)' : 
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
      <div className="custom-footer">
        <p className="custom-footer-text">
          © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}