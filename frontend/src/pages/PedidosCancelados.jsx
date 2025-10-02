import React, { useEffect, useState } from 'react';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import EncabezadoModulo from '../components/EncabezadoModulo';
import PedidoCanceladoPreview from '../components/PedidoCanceladoPreview';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';

export default function PedidosCancelados() {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [datosCancelado, setDatosCancelado] = useState(null);
  const [mostrarCancelado, setMostrarCancelado] = useState(false);

  const mostrarProductos = (pedido) => {
    setPedidoSeleccionado(pedido);
  };

  const generarFormatoCancelado = async (pedido) => {
    try {
      const token = localStorage.getItem('token');

      console.log('Pedido original:', pedido); // Debug

      // Obtener los datos completos del pedido con productos poblados
      const resPedido = await fetch(`http://localhost:5000/api/pedidos/${pedido._id}?populate=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!resPedido.ok) {
        throw new Error('No se pudo obtener el pedido completo');
      }

      const pedidoCompleto = await resPedido.json();
      console.log('Pedido completo desde API:', pedidoCompleto); // Debug

      // Usar los datos del pedido original si la API no devuelve datos completos
      const datosParaUsar = pedidoCompleto.data || pedidoCompleto || pedido;

      // Crear objeto de datos para el formato cancelado
      const datosCancelado = {
        numeroPedido: datosParaUsar.numeroPedido || pedido.numeroPedido,
        fechaEntrega: datosParaUsar.fechaEntrega || pedido.fechaEntrega,
        fechaAgendamiento: datosParaUsar.createdAt || pedido.createdAt,
        estado: datosParaUsar.estado || pedido.estado,
        cliente: datosParaUsar.cliente || pedido.cliente,
        productos: datosParaUsar.productos || pedido.productos || [],
        motivoCancelacion: datosParaUsar.motivoCancelacion || datosParaUsar.observacion || pedido.motivoCancelacion || pedido.observacion,
        empresa: { nombre: 'PANGEA', direccion: 'Dirección empresa' }
      };

      console.log('Datos cancelado finales:', datosCancelado); // Debug

      setDatosCancelado(datosCancelado);
      setMostrarCancelado(true);

    } catch (error) {
      console.error('Error al generar formato cancelado:', error);

      // Si falla la API, usar los datos del pedido directamente
      const datosCancelado = {
        numeroPedido: pedido.numeroPedido,
        fechaEntrega: pedido.fechaEntrega,
        fechaAgendamiento: pedido.createdAt,
        cliente: pedido.cliente,
        productos: pedido.productos || [],
        motivoCancelacion: pedido.motivoCancelacion || pedido.observacion,
        empresa: { nombre: 'PANGEA', direccion: 'Dirección empresa' }
      };

      console.log('Usando datos directos del pedido:', datosCancelado);

      setDatosCancelado(datosCancelado);
      setMostrarCancelado(true);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/pedidos?populate=true', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        console.log('Datos de pedidos cancelados:', data); // Debug
        const cancelados = data.filter(p => p.estado === 'cancelado');
        console.log('Pedidos cancelados filtrados:', cancelados); // Debug
        setPedidos(cancelados);
      })
      .catch(err => console.error('Error al cargar pedidos cancelados:', err));
  }, []);

  const exportarPDF = () => {
    const input = document.getElementById('tabla_cancelados');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save('pedidos_cancelados.pdf');
    });
  };

  const exportToExcel = () => {
    const table = document.getElementById('tabla_cancelados');
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Cancelados" });
    XLSX.writeFile(workbook, 'pedidos_cancelados.xlsx');
  };

  const ModalProductosCotizacion = ({ visible, onClose, productos, cotizacionId }) => {
    if (!visible) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-compact modal-lg">
          <div className="modal-header">
            <h5 className="modal-title">Productos del Pedido #{cotizacionId?.slice(-5)}</h5>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            {productos && productos.length > 0 ? (
              <ul className="list-group">
                {productos.map((prod, idx) => (
                  <li key={idx} className="list-group-item">
                    <strong>{prod?.product?.name || 'Producto desconocido'}</strong><br />
                    Cantidad: {prod?.cantidad}<br />
                    Precio unitario: ${prod?.precioUnitario?.toFixed(2) || 0}<br />
                    <em>Total: ${(prod?.cantidad * prod?.precioUnitario).toFixed(2)}</em>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay productos asociados a este pedido.</p>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-cancel" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="contenido-modulo">
          <div className='encabezado-modulo'>
            <div>
              <h3 className='titulo-profesional'>Pedidos cancelados</h3>
              {/* BOTONES EXPORTAR */}
              <button
                onClick={() => exportToExcel(pedidos)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.45rem 0.9rem', border: '1.5px solid #16a34a', borderRadius: '8px', background: 'transparent', color: '#16a34a',
                  fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.3s ease'
                }}
              >
                <i className="fa-solid fa-file-excel" style={{ color: 'inherit', fontSize: '16px' }}></i>
                <span>Exportar a Excel</span>
              </button>

              <button
                onClick={exportarPDF}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.45rem 0.9rem', border: '1.5px solid #dc2626', borderRadius: '8px', background: 'transparent', color: '#dc2626',
                  fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.3s ease'
                }}
              >
                <i className="fa-solid fa-file-pdf" style={{ color: 'inherit', fontSize: '16px' }}></i>
                <span>Exportar a PDF</span>
              </button>
            </div>
          </div>
          <div className="max-width">
            <div className="container-tabla">
              <div className="table-container">
                <table id="tabla_cancelados">
                  <thead><br />
                    <tr>
                      <th>No</th>
                      <th># Pedido</th>
                      <th>F. Agendamiento</th>
                      <th>F. Entrega</th>
                      <th>Cliente</th>
                      <th>Ciudad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((pedido, index) => (
                      <tr key={pedido._id}>
                        <td>{index + 1}</td>
                        <td
                          style={{ cursor: 'pointer', color: '#2563eb', textDecoration: 'underline' }}
                          onClick={() => generarFormatoCancelado(pedido)}
                        >
                          {pedido.numeroPedido || '---'}
                        </td>
                        <td>{new Date(pedido.createdAt).toLocaleDateString()}</td>
                        <td>{new Date(pedido.fechaEntrega).toLocaleDateString()}</td>
                        <td>{pedido.cliente?.nombre}</td>
                        <td>{pedido.cliente?.ciudad}</td>
                      </tr>
                    ))}
                    {pedidos.length === 0 && <tr><td colSpan="9">No hay pedidos cancelados disponibles</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

      </div>
      <ModalProductosCotizacion
        visible={!!pedidoSeleccionado}
        onClose={() => setPedidoSeleccionado(null)}
        productos={pedidoSeleccionado?.productos || []}
        cotizacionId={pedidoSeleccionado?._id}
      />

      {mostrarCancelado && datosCancelado && (
        <PedidoCanceladoPreview
          datos={datosCancelado}
          onClose={() => setMostrarCancelado(false)}
        />
      )}
      <div className="custom-footer">
        <p className="custom-footer-text">
          © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
