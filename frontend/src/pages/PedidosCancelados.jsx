import React, { useEffect, useState } from 'react';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import SharedListHeaderCard from '../components/SharedListHeaderCard';
import AdvancedStats from '../components/AdvancedStats';
import PedidoCanceladoPreview from '../components/PedidoCanceladoPreview';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import { normalizePedidosArray } from '../utils/calculations';
import DeleteButton from '../components/DeleteButton';

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

  const exportToExcel = (pedidosCancelados) => {
    if (!pedidosCancelados || pedidosCancelados.length === 0) {
      Swal.fire("Error", "No hay datos para exportar", "warning");
      return;
    }

    const dataFormateada = pedidosCancelados.map(pedido => ({
      'Nombre': pedido.cliente?.nombre || pedido.nombre || pedido.clienteInfo?.nombre || '',
      'Numero de Pedido': pedido.numeroPedido || '',
      'Ciudad': pedido.cliente?.ciudad || pedido.ciudad || pedido.clienteInfo?.ciudad || '',
      'Teléfono': pedido.cliente?.telefono || pedido.telefono || pedido.clienteInfo?.telefono || '',
      'Correo': pedido.cliente?.correo || pedido.correo || pedido.clienteInfo?.correo || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataFormateada);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'ListaPedidosCancelados.xlsx');
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

  const eliminarPedidoCancelado = async (pedidoId) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar pedido cancelado?',
      text: 'Esta acción es permanente y no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await api.delete(`/api/pedidos/cancelado/${pedidoId}`);
      if (!(res.status >= 200 && res.status < 300)) throw new Error(res.data?.message || 'Error al eliminar');
      Swal.fire('Eliminado', 'Pedido cancelado eliminado correctamente', 'success');
      // Refrescar lista
      cargarPedidosCancelados();
      // Cerrar preview si estaba mostrando el mismo pedido
      if (mostrarCancelado && datosCancelado && datosCancelado._id === pedidoId) {
        setMostrarCancelado(false);
        setDatosCancelado(null);
      }
    } catch (err) {
      console.error('Error eliminando pedido cancelado:', err);
      Swal.fire('Error', err.message || 'No se pudo eliminar el pedido', 'error');
    }
  };

  // Verificar permiso desde el JWT almacenado en localStorage (payload.permissions o payload.permisos)
  const hasPermission = (perm) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      const base64Payload = token.split('.')[1];
      if (!base64Payload) return false;
      // Normalizar base64url
      const jsonPayload = atob(base64Payload.replaceAll('-', '+').replaceAll('_', '/'));
      const payload = JSON.parse(jsonPayload);
      const perms = payload.permissions || payload.permisos || [];
      return Array.isArray(perms) && perms.includes(perm);
    } catch (e) {
      return false;
    }
  };

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="max-width">
          <div className="contenido-modulo">
            {/* Encabezado profesional */}
            <SharedListHeaderCard
              title="Pedidos Cancelados"
              subtitle="Gestión de pedidos cancelados y motivos de cancelación"
              iconClass="fa-solid fa-circle-xmark"
            >
              <div className="export-buttons">
                <button
                  onClick={() => exportToExcel(pedidosCancelados)}
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
            <AdvancedStats cards={[
              {
                iconClass: 'fa-solid fa-times-circle',
                gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
                value: pedidosCancelados.length,
                label: 'Pedidos Cancelados'
              },
              {
                iconClass: 'fa-solid fa-dollar-sign',
                gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                value: `$${pedidosCancelados.reduce((sum, p) => sum + (p.total || 0), 0).toLocaleString('es-CO')}`,
                label: 'Valor Perdido'
              },
              {
                iconClass: 'fa-solid fa-calendar-alt',
                gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                value: pedidosCancelados.filter(p => {
                  const fechaCancelacion = new Date(p.updatedAt);
                  const hoy = new Date();
                  const diferencia = hoy.getTime() - fechaCancelacion.getTime();
                  const diasDiferencia = Math.ceil(diferencia / (1000 * 3600 * 24));
                  return diasDiferencia <= 30;
                }).length,
                label: 'Este Mes'
              }
            ]} />

            {/* Tabla de pedidos cancelados */}
            <div className="table-container">
              <div className="table-header">
                <div className="table-header-content">
                  <div className="table-header-icon">
                    <i className="fa-solid fa-table" style={{ color: 'white', fontSize: '16px' }}></i>
                  </div>
                  <div>
                    <h4 className="table-title">
                      Lista de pedidos cancelados
                    </h4>
                    <p className="table-subtitle">
                      Mostrando {currentItems.length} de {pedidosCancelados.length} pedidos cancelados
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ overflow: 'auto' }}>
                <table className="data-table" id="tabla_cancelados">
                  <thead>
                    <tr>
                      <th>
                        <i className="fa-solid fa-hashtag icon-gap" style={{ color: '#6366f1' }}></i><span></span>
                      </th>
                      <th>
                        <i className="fa-solid fa-file-invoice icon-gap" style={{ color: '#6366f1' }}></i><span>IDENTIFICADOR DE PEDIDO</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-user-pen icon-gap" style={{ color: '#6366f1' }}></i><span>RESPONSABLE</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-calendar-times icon-gap" style={{ color: '#6366f1' }}></i><span>F. CANCELACIÓN</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-user icon-gap" style={{ color: '#6366f1' }}></i><span>CLIENTE</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-location-dot icon-gap" style={{ color: '#6366f1' }}></i><span>CIUDAD</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-dollar-sign icon-gap" style={{ color: '#6366f1' }}></i><span>TOTAL</span>
                      </th>
                      {hasPermission('pedidos.eliminar') && (
                        <th style={{ textAlign: 'center' }}>
                          <i className="fa-solid fa-cogs icon-gap" style={{ color: '#6366f1' }}></i><span>ACCIONES</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((pedido, index) => (
                      <tr key={pedido._id}>
                        <td style={{ fontWeight: '600', color: '#6366f1' }}>
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="table-icon-small">
                              <i className="fa-solid fa-file-invoice" style={{ color: 'white', fontSize: '12px' }}></i>
                            </div>
                            {pedido.numeroPedido ? (
                              <button
                                style={{ cursor: 'pointer', color: '#6366f1', background: 'transparent', textDecoration: 'underline' }}
                                onClick={() => verDetallesCancelado(pedido._id)}
                              >

                                <span>{pedido.numeroPedido || '---'}</span>
                              </button>
                            ) : (
                              <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>---</span>
                            )}
                          </div>

                        </td>
                        <td style={{ color: '#374151', fontWeight: 600 }}>
                          {pedido.responsableCancelacion ? (
                            (pedido.responsableCancelacion.firstName || pedido.responsableCancelacion.username)
                              ? `${pedido.responsableCancelacion.firstName || ''} ${pedido.responsableCancelacion.surname || ''}`.trim()
                              : (pedido.responsableCancelacion.username || String(pedido.responsableCancelacion))
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sistema</span>
                          )}
                        </td>
                        <td style={{ color: '#6b7280' }}>
                          {new Date(pedido.updatedAt).toLocaleDateString()}
                        </td>

                        <td style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                          {pedido.cliente?.nombre}
                        </td>
                        <td style={{ color: '#6b7280' }}>
                          {pedido.cliente?.ciudad}
                        </td>
                        <td style={{ fontWeight: '600', color: '#6366f1', fontSize: '14px' }}>
                          ${(pedido.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="no-export">
                          {hasPermission('pedidos.eliminar') && (
                            <DeleteButton
                              title="Eliminar pedido cancelado"
                              onClick={() => eliminarPedidoCancelado(pedido._id)}
                              className="action-btn delete"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </DeleteButton>
                          )}
                        </td>
                      </tr>
                    ))}
                    {pedidosCancelados.length === 0 && (
                      <tr>
                        <td colSpan={hasPermission('pedidos.eliminar') ? 8 : 7}>
                          <div className="table-empty-state">
                            <div className="table-empty-icon">
                              <i className="fa-solid fa-times-circle" style={{ fontSize: '3.5rem', color: '#9ca3af' }}></i>
                            </div>
                            <div>
                              <h5 className="table-empty-title">
                                No hay pedidos cancelados disponibles
                              </h5>
                              <p className="table-empty-text">
                                No se encontraron pedidos cancelados en el sistema
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="table-pagination">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal de vista previa de pedido cancelado */}
            {mostrarCancelado && datosCancelado && (
              <PedidoCanceladoPreview
                datos={datosCancelado}
                onClose={() => setMostrarCancelado(false)}
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