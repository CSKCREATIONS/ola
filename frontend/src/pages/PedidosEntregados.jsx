import React, { useEffect, useState } from 'react';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import exportElementToPdf from '../utils/exportToPdf';
import api from '../api/axiosConfig';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { sumarProp } from '../utils/calculations';
import RemisionPreview from '../components/RemisionPreview';

export default function PedidosEntregados() {
  const [pedidosEntregados, setPedidosEntregados] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [remisionPreview, setRemisionPreview] = useState(null);

  const countThisMonth = pedidosEntregados.filter(p => {
    const fechaEntrega = new Date(p.updatedAt || p.fechaRemision || p.createdAt || 0);
    const hoy = new Date();
    const diferencia = hoy.getTime() - fechaEntrega.getTime();
    const diasDiferencia = Math.ceil(diferencia / (1000 * 3600 * 24));
    return diasDiferencia <= 30;
  }).length;

  const statsCards = [
    { iconClass: 'fa-solid fa-check-circle', gradient: 'linear-gradient(135deg, #10b981, #059669)', value: pedidosEntregados.length, label: 'Pedidos Entregados' },
    { iconClass: 'fa-solid fa-dollar-sign', gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)', value: `$${sumarProp(pedidosEntregados, 'total').toLocaleString('es-CO')}`, label: 'Ingresos Totales' },
    { iconClass: 'fa-solid fa-calendar-alt', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', value: countThisMonth, label: 'Este Mes' }
  ];

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
      // Si la remisión tiene un _id, intentar obtener l;a versión completa desde el servidor
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

      const styleElement = document.createElement('style');
      setRemisionPreview(remision);
    } catch (error) {
      console.error('Error cargando remisión para vista previa:', error);
      Swal.fire('Error', 'No se pudo cargar la remisión', 'error');
    }
  };

  // Note: crearRemisionDesdePedido removed — not referenced anywhere in this file. Kept pagination and preview handlers.

  const exportarPDF = async () => {
    const elementosNoExport = document.querySelectorAll('.no-export');
    for (const el of elementosNoExport) { el.style.display = 'none'; }

    const input = document.getElementById('tabla_entregados');
    if (!input) {
      for (const el of elementosNoExport) { el.style.display = ''; }
      return;
    }

    try {
      await exportElementToPdf(input, 'pedidos_entregados.pdf');
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      for (const el of elementosNoExport) { el.style.display = ''; }
    }
  };

  const exportarExcel = () => {
    const elementosNoExport = document.querySelectorAll('.no-export');
    for (const el of elementosNoExport) { el.style.display = 'none'; }

    const tabla = document.getElementById("tabla_entregados");
  const workbook = XLSX.utils.table_to_book(tabla, { sheet: "Pedidos Entregados" });
  workbook.Sheets["Pedidos Entregados"]["!cols"] = new Array(7).fill({ width: 20 });

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
                    ${sumarProp(pedidosEntregados, 'total').toLocaleString('es-CO')}
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
                  {currentItems.map((remision, index) => (
                    <tr key={remision._id}>
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
                            onClick={() => verRemisionPreview(remision)}
                          >
                            {remision.numeroRemision || '---'}
                          </button>
                        </div>
                      </td>
                      <td style={{ color: '#6b7280' }}>
                        {new Date(remision.fechaEntrega || remision.fechaRemision || remision.updatedAt || remision.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: '500', color: '#1f2937' }}>
                        {remision.cliente?.nombre || remision.cliente?.nombreCliente || remision.cliente?.nombreCompleto || ''}
                      </td>
                      <td style={{ color: '#6b7280' }}>
                        {remision.cliente?.ciudad || remision.cliente?.direccion?.ciudad || ''}
                      </td>
                      <td style={{ fontWeight: '600', color: '#10b981', fontSize: '14px' }}>
                        ${(remision.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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