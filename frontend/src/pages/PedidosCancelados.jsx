import React, { useEffect, useState } from 'react';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import PedidoCanceladoPreview from '../components/PedidoCanceladoPreview';
import exportElementToPdf from '../utils/exportToPdf';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import { formatDateIso, calculateTotal, sumarTotalesLista } from '../utils/emailHelpers';
import AdvancedStats from '../components/AdvancedStats';

// Styles are handled in central CSS files; avoid injecting HTML/CSS from JS.

export default function PedidosCancelados() {
  const [pedidosCancelados, setPedidosCancelados] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [mostrarCancelado, setMostrarCancelado] = useState(false);
  const [datosCancelado, setDatosCancelado] = useState(null);
  const itemsPerPage = 10;

  const statsCards = [
    { iconClass: 'fa-solid fa-times-circle', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', value: pedidosCancelados.length, label: 'Pedidos Cancelados' },
    { iconClass: 'fa-solid fa-dollar-sign', gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)', value: `$${sumarTotalesLista(pedidosCancelados).toLocaleString('es-CO')}`, label: 'Valor Perdido' },
    { iconClass: 'fa-solid fa-calendar-alt', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', value: pedidosCancelados.filter(p => {
      const fechaCancelacion = new Date(p.updatedAt || p.createdAt || 0);
      const hoy = new Date();
      const diferencia = hoy.getTime() - fechaCancelacion.getTime();
      const diasDiferencia = Math.ceil(diferencia / (1000 * 3600 * 24));
      return diasDiferencia <= 30;
    }).length, label: 'Este Mes' }
  ];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = pedidosCancelados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(pedidosCancelados.length / itemsPerPage);

  useEffect(() => {
    cargarPedidosCancelados();
    // no DOM style injection — rely on global CSS
    return () => {};
  }, []);

  const cargarPedidosCancelados = async () => {
    try {
      const res = await api.get('/api/pedidos?populate=true');
      const data = res.data || res;
      const arr = Array.isArray(data) ? data : data.data || [];
      const cancelados = arr.filter(pedido => pedido.estado === 'cancelado');
      const canceladosOrdenados = cancelados.sort((a, b) => new Date(b.createdAt || b.fechaCreacion) - new Date(a.createdAt || a.fechaCreacion));
      setPedidosCancelados(canceladosOrdenados);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'Error de conexión', 'error');
    } finally {
      // loading eliminado por no usarse
    }
  };

  const exportarPDF = async () => {
    const elementosNoExport = document.querySelectorAll('.no-export');
    for (const el of elementosNoExport) { el.style.display = 'none'; }

    const input = document.getElementById('tabla_cancelados');
    if (!input) {
      for (const el of elementosNoExport) { el.style.display = ''; }
      return;
    }

    try {
      await exportElementToPdf(input, 'pedidos_cancelados.pdf');
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      for (const el of elementosNoExport) { el.style.display = ''; }
    }
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
          {/* Estadísticas avanzadas */}
          <AdvancedStats cards={statsCards} />

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
                        {formatDateIso(pedido.updatedAt)}
                      </td>
                      <td style={{ fontWeight: '500', color: '#1f2937' }}>
                        {pedido.cliente?.nombre}
                      </td>
                      <td style={{ color: '#6b7280' }}>
                        {pedido.cliente?.ciudad}
                      </td>
                      <td style={{ fontWeight: '600', color: '#ef4444', fontSize: '14px' }}>
                        ${(calculateTotal(pedido) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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