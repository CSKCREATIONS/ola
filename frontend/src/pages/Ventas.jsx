import React, { useState, useEffect } from 'react';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import EncabezadoModulo from '../components/EncabezadoModulo';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const exportarPDF = () => {
  const input = document.getElementById('lista-ventas');
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

    pdf.save('listaVentas.pdf');
  });
};


const exportToExcel = () => {
  const table = document.getElementById('lista-ventas');
  if (!table) return;
  const workbook = XLSX.utils.table_to_book(table);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(data, 'listaVentas.xlsx');
}

  useEffect(() => {
    const cargarVentasInicial = async () => {
      try {
        const res = await api.get('/api/ventas');
        console.log('✅ Ventas recibidas:', res.data);
        setVentas(res.data);
      } catch (err) {
        console.error('Error al cargar ventas:', err);
      }
    };

    cargarVentasInicial();
  }, []);


  const ventasFiltradas = ventas.filter(venta => {
    const coincideFecha = !filtroFecha || new Date(venta.fecha).toISOString().slice(0, 10) === filtroFecha;
    const coincideCliente = !filtroCliente || venta.cliente?.nombre?.toLowerCase().includes(filtroCliente.toLowerCase());
    const coincideEstado = !filtroEstado || venta.estado === filtroEstado;

    return coincideFecha && coincideCliente && coincideEstado;
  });

  /*** PAGINACIÓN ***/
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
  
    const totalPages = Math.ceil(ventasFiltradas.length / itemsPerPage);
  
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // cargarVentas: single async function used by effect
  const cargarVentas = async () => {
    try {
      const res = await api.get('/api/ventas');
      setVentas(res.data);
    } catch (err) {
      console.error('Error al cargar ventas:', err);
    }
  };

  useEffect(() => {
    cargarVentas();
  }, []);


  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="contenido-modulo">
          <div className='encabezado-modulo'>
            <div>
              <h3 className='titulo-profesional'>Lista de ventas</h3>
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
          <div className="filtros-tabla">
            <div className="filtro-grupo">
              <label htmlFor="filtro-fecha-ventas">Fecha:</label>
              <input
                id="filtro-fecha-ventas"
                type="date"
                className="filtro-input"
                value={filtroFecha}
                onChange={e => setFiltroFecha(e.target.value)}
              />
            </div>
            &nbsp;&nbsp;
            <div className="filtro-grupo">
              <label htmlFor="filtro-cliente-ventas">Cliente:</label>
              <input
                id="filtro-cliente-ventas"
                type="text"
                className="filtro-input"
                placeholder="Buscar cliente..."
                value={filtroCliente}
                onChange={e => setFiltroCliente(e.target.value)}
              />
            </div>
            &nbsp;&nbsp;
            <div className="filtro-grupo">
              <label htmlFor="filtro-estado-ventas">Estado:</label>
              <select
                id="filtro-estado-ventas"
                className="filtro-select"
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="completado">Completado</option>
              </select>
            </div>
            
          </div>
            


          <div className="container-tabla">
            <div className="table-container">
              <table id='lista-ventas'>
                <thead>
                  <tr>
                    <th># Venta</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'red' }}>
                        No se encontraron ventas con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    ventasFiltradas.map((venta, index) => (
                      <tr key={venta._id}>
                        <td>V-{venta._id.slice(-5)}</td>
                        <td>{new Date(venta.fecha).toLocaleDateString()}</td>
                        <td>{venta.cliente?.nombre || 'N/A'}</td>
                        <td>${venta.total?.toFixed(2) || 0}</td>
                        <td>{venta.estado}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {/* PAGINACIÓN */}
      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => paginate(i + 1)}
            className={currentPage === i + 1 ? 'active-page' : ''}
          >
            {i + 1}
          </button>
        ))}
      </div>
            </div>
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