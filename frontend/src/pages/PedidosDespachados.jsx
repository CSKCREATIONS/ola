import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import Swal from 'sweetalert2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function PedidosDespachados() {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  const mostrarProductos = (pedido) => {
    setPedidoSeleccionado(pedido);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/pedidos', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPedidos(data.filter(p => p.estado === 'despachado')))
      .catch(err => console.error('Error al cargar pedidos:', err));
  }, []);

  const exportarPDF = () => {
    const input = document.getElementById('tabla_despachados');
    const originalWidth = input.style.width;
    input.style.width = '100%';

    html2canvas(input, { scale: 1, width: input.offsetWidth, windowWidth: input.scrollWidth })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save('pedidos_despachados.pdf');

        input.style.width = originalWidth;
      })
      .catch(err => console.error('Error al generar PDF:', err));
  };

  const exportarExcel = () => {
    const datosExcel = pedidos.map(pedido => ({
      'ID': pedido._id,
      'Cliente': pedido.cliente?.nombre || 'N/A',
      'Total': `$${pedido.total?.toLocaleString()}`,
      'Fecha': new Date(pedido.fecha).toLocaleDateString(),
      'Estado': pedido.estado,
      'Productos': pedido.productos?.map(p => p.producto?.name).join(', ')
    }));

    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos Despachados");
    XLSX.writeFile(wb, "pedidos_despachados.xlsx");
  };

  const marcarComoEntregado = async (pedidoId) => {
    const confirm = await Swal.fire({
      title: '¿Marcar como entregado?',
      text: 'Este pedido se moverá a la sección de entregados.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar como entregado',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/pedidos/${pedidoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: 'entregado' })
      });

      if (res.ok) {
        Swal.fire('¡Éxito!', 'Pedido marcado como entregado', 'success');
        setPedidos(pedidos.filter(p => p._id !== pedidoId));
      } else {
        Swal.fire('Error', 'No se pudo actualizar el pedido', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Error de conexión', 'error');
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = pedidos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(pedidos.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="contenido-modulo">
          <div className='encabezado-modulo'>
            <div>
              <h3 className='titulo-profesional'>Pedidos Despachados</h3>
              <p className='subtitulo'>Gestión de pedidos que han sido despachados</p>
            </div>
            <div className="acciones-modulo">
              <button className="btn btn-outline-primary" onClick={exportarPDF}>
                <i className="fa-solid fa-file-pdf"></i> Exportar PDF
              </button>
              <button className="btn btn-outline-success" onClick={exportarExcel}>
                <i className="fa-solid fa-file-excel"></i> Exportar Excel
              </button>
            </div>
          </div>

          <br />

          <div className="table-container" id="tabla_despachados">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Fecha Despacho</th>
                  <th>Productos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((pedido, index) => (
                  <tr key={pedido._id}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>{pedido.cliente?.nombre || 'Cliente no especificado'}</td>
                    <td>${pedido.total?.toLocaleString()}</td>
                    <td>{new Date(pedido.fechaDespacho || pedido.fecha).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => mostrarProductos(pedido)}
                        className="btn btn-info btn-sm"
                      >
                        Ver Productos ({pedido.productos?.length || 0})
                      </button>
                    </td>
                    <td>
                      <span className="badge bg-warning">
                        <i className="fa-solid fa-truck"></i> Despachado
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => marcarComoEntregado(pedido._id)}
                        className="btn btn-success btn-sm"
                        title="Marcar como entregado"
                      >
                        <i className="fa-solid fa-check"></i> Entregar
                      </button>
                    </td>
                  </tr>
                ))}
                {pedidos.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No hay pedidos despachados en este momento
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
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

          {/* Modal de productos */}
          {pedidoSeleccionado && (
            <div className="modal-overlay">
              <div className="modal-compact modal-lg">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Productos del Pedido - {pedidoSeleccionado.cliente?.nombre}
                  </h5>
                  <button 
                    className="modal-close" 
                    onClick={() => setPedidoSeleccionado(null)}
                  >
                    &times;
                  </button>
                </div>
                <div className="modal-body">
                  <div className="info-pedido">
                    <p><strong>Cliente:</strong> {pedidoSeleccionado.cliente?.nombre}</p>
                    <p><strong>Total:</strong> ${pedidoSeleccionado.total?.toLocaleString()}</p>
                    <p><strong>Fecha:</strong> {new Date(pedidoSeleccionado.fecha).toLocaleDateString()}</p>
                  </div>
                  
                  <h6>Productos:</h6>
                  <div className="productos-list">
                    {pedidoSeleccionado.productos?.map((item, index) => (
                      <div key={index} className="producto-item">
                        <div className="producto-info">
                          <h6>{item.producto?.name}</h6>
                          <p>Cantidad: {item.cantidad}</p>
                          <p>Precio: ${item.precio?.toLocaleString()}</p>
                          <p>Subtotal: ${(item.cantidad * item.precio)?.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn btn-cancel" 
                    onClick={() => setPedidoSeleccionado(null)}
                  >
                    Cerrar
                  </button>
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