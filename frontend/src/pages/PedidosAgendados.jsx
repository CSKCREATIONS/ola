import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import exportElementToPdf from '../utils/exportToPdf';
import * as XLSX from 'xlsx';
import EditarPedido from '../components/EditarPedido';
import PedidoAgendadoPreview from '../components/PedidoAgendadoPreview';
import { sumarProp } from '../utils/calculations';
import AdvancedStats from '../components/AdvancedStats';
import Modal from '../components/Modal';

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

  const exportarPDF = async () => {
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

    try {
      await exportElementToPdf(input, 'pedidos_agendados.pdf');
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      for (const el of elementosNoExport) {
        el.style.display = '';
      }
    }
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
      if (!p?.fechaEntrega) {
        return '';
      }
      const d = new Date(p.fechaEntrega);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch (error_) {
      console.error('Error computing default date for pedido:', error_);
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
          <AdvancedStats
            cards={[
              {
                iconClass: 'fa-solid fa-calendar-check',
                gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                value: pedidos.length,
                label: 'Pedidos Agendados'
              },
              {
                iconClass: 'fa-solid fa-chart-line',
                gradient: 'linear-gradient(135deg, #10b981, #059669)',
                value: '$' + sumarProp(pedidos, 'total').toLocaleString('es-CO'),
                label: 'Total en Ventas'
              },
              {
                iconClass: 'fa-solid fa-clock',
                gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                value: pedidos.filter(p => new Date(p.fechaEntrega) <= new Date(Date.now() + 24*60*60*1000)).length,
                label: 'Entregas Próximas'
              }
            ]}
          />

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
          <Modal isOpen={mostrarModalAgendar} onClose={() => setMostrarModalAgendar(false)} title="Agendar Pedido" className="modal-compact modal-lg">
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
          </Modal>
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