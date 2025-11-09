import React, { useEffect, useState } from 'react';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import PedidoDevueltoPreview from '../components/PedidoDevueltoPreview';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api from '../api/axiosConfig';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


export default function PedidosDevueltos() {
  const [pedidos, setPedidos] = useState([]);
  const [datosDevuelto, setDatosDevuelto] = useState(null);
  const [mostrarDevuelto, setMostrarDevuelto] = useState(false);


  const generarFormatoDevuelto = async (pedido) => {
    try {
      console.log('Pedido original:', pedido); // Debug

      // Obtener los datos completos del pedido con productos poblados
      const resPedido = await api.get(`/api/pedidos/${pedido._id}?populate=true`);
      const pedidoCompleto = resPedido.data || resPedido;
      console.log('Pedido completo desde API:', pedidoCompleto); // Debug

      // Usar los datos del pedido original si la API no devuelve datos completos
      const datosParaUsar = pedidoCompleto.data || pedidoCompleto || pedido;

      // Crear objeto de datos para el formato devuelto
      const datosDevuelto = {
        numeroPedido: datosParaUsar.numeroPedido || pedido.numeroPedido,
        fechaEntrega: datosParaUsar.fechaEntrega || pedido.fechaEntrega,
        fechaAgendamiento: datosParaUsar.createdAt || pedido.createdAt,
        estado: datosParaUsar.estado || pedido.estado,
        cliente: datosParaUsar.cliente || pedido.cliente,
        productos: datosParaUsar.productos || pedido.productos || [],
        motivoDevolucion: datosParaUsar.motivoDevolucion || datosParaUsar.observacion || pedido.motivoDevolucion || pedido.observacion,
        empresa: { nombre: 'PANGEA', direccion: 'Dirección empresa' }
      };

      console.log('Datos devuelto finales:', datosDevuelto); // Debug

      setDatosDevuelto(datosDevuelto);
      setMostrarDevuelto(true);

    } catch (error) {
      console.error('Error al generar formato devuelto:', error);

      // Si falla la API, usar los datos del pedido directamente
      const datosDevuelto = {
        numeroPedido: pedido.numeroPedido,
        fechaEntrega: pedido.fechaEntrega,
        fechaAgendamiento: pedido.createdAt,
        estado: pedido.estado,
        cliente: pedido.cliente,
        productos: pedido.productos || [],
        motivoDevolucion: pedido.motivoDevolucion || pedido.observacion,
        empresa: { nombre: 'PANGEA', direccion: 'Dirección empresa' }
      };

      console.log('Usando datos directos del pedido:', datosDevuelto);

      setDatosDevuelto(datosDevuelto);
      setMostrarDevuelto(true);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/pedidos?populate=true');
        const data = res.data || res;
        const arr = Array.isArray(data) ? data : data.data || [];
        const devueltos = arr.filter(p => p.estado === 'devuelto');
        setPedidos(devueltos);
      } catch (err) {
        console.error('Error al cargar pedidos devueltos:', err);
      }
    };

    fetchData();
  }, []);


  const exportarPDF = () => {
    const input = document.getElementById('tabla_pedidos_devueltos');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('pedidosDevueltos.pdf');
    });
  };


  const exportToExcel = () => {
    const table = document.getElementById('tabla_pedidos_devueltos');
    if (!table) return;
    const workbook = XLSX.utils.table_to_book(table);
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'pedidosDevueltos.xlsx');
  };

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="contenido-modulo">
          <div className='encabezado-modulo'>
            <div>
              <h3 className='titulo-profesional'>Pedidos devueltos</h3>
              {/* BOTONES EXPORTAR */}
              <button
                onClick={exportToExcel}
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
                <table id="tabla_pedidos_devueltos">
                  <thead><br />
                    <tr>
                      <th>N°</th>
                      <th>identificador de Pedido</th> {/* 👈 NUEVA COLUMNA */}
                      <th>F. Agendamiento</th>
                      <th>F. Entrega</th>
                      <th>Cliente</th>
                      <th>Ciudad</th>
                      <th>Teléfono</th>
                      <th>Correo</th>
                      <th>Observaciones</th>
                      <th>Motivo Devolucion</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((pedido, index) => (
                      <tr key={pedido._id}>
                        <td>{index + 1}</td>
                        <td
                          style={{ cursor: 'pointer', color: '#2563eb', textDecoration: 'underline' }}
                          onClick={() => generarFormatoDevuelto(pedido)}
                        >
                          {pedido.numeroPedido || '---'}
                        </td>

                        <td>{new Date(pedido.createdAt).toLocaleDateString()}</td>
                        <td>{new Date(pedido.fechaEntrega).toLocaleDateString()}</td>
                        <td>{pedido.cliente?.nombre}</td>
                        <td>{pedido.cliente?.ciudad}</td>
                        <td>{pedido.cliente?.telefono}</td>
                        <td>{pedido.cliente?.correo}</td>
                        <td>{pedido.observacion || 'N/A'}</td>
                        <td>{pedido.estado === 'devuelto' ? pedido.motivoDevolucion : ''}</td>
                        <td>{pedido.estado}</td>
                      </tr>
                    ))}
                    {pedidos.length === 0 && <tr><td colSpan="9">No hay pedidos devueltos disponibles</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

      </div>
      {mostrarDevuelto && datosDevuelto && (
        <PedidoDevueltoPreview
          datos={datosDevuelto}
          onClose={() => setMostrarDevuelto(false)}
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
