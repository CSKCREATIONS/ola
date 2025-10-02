import Fijo from '../components/Fijo'
import NavVentas from '../components/NavVentas'
import { Link, useLocation } from 'react-router-dom';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import React, { useState, useEffect } from 'react';
import CotizacionPreview from '../components/CotizacionPreview';

/**** Funcion para exportar a pdf ***/
const exportarPDF = () => {
  const input = document.getElementById('tabla_prospectos');

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

    pdf.save('listaProspectos.pdf');
  });
};

const exportToExcel = () => {
  const table = document.getElementById('tabla_prospectos');
  if (!table) {
    console.error("Tabla no encontrada");
    return;
  }
  const workbook = XLSX.utils.table_to_book(table);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(data, 'listaProspectos.xlsx');
};

export default function ListaDeClientes() {
  const [prospectos, setProspectos] = useState([]);
  const [cotizacionesMap, setCotizacionesMap] = useState({});
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [expandedEmails, setExpandedEmails] = useState({});
  const [filtroTexto, setFiltroTexto] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  const location = useLocation();

  const fetchProspectos = async () => {
    const token = localStorage.getItem('token');
    try {
      // avoid cached 304 responses by forcing no-store and adding a cache-buster
      const url = `http://localhost:5000/api/clientes?esCliente=false&t=${Date.now()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        method: 'GET'
      });

      if (!res.ok) {
        console.error('Error fetching prospectos:', res.status, res.statusText);
        setProspectos([]);
        return;
      }

      const data = await res.json();
      // controller returns array of clientes
      const listaProspectos = Array.isArray(data) ? data : (data.data || []);
      setProspectos(listaProspectos);

      // Also fetch cotizaciones once and build a map by client email
      try {
        const cotRes = await fetch(`http://localhost:5000/api/cotizaciones?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        });
        if (cotRes.ok) {
          const cotData = await cotRes.json();
          const cotList = Array.isArray(cotData) ? cotData : (cotData.data || []);
          const map = {};
          cotList.forEach(cot => {
            const email = (cot.cliente?.correo || '').toLowerCase();
            if (!email) return;
            if (!map[email]) map[email] = [];
            if (cot.codigo) map[email].push({ codigo: cot.codigo, id: cot._id });
          });
          setCotizacionesMap(map);
        } else {
          console.warn('No se pudieron cargar cotizaciones para el listado de prospectos');
        }
      } catch (err) {
        console.error('Error al cargar cotizaciones:', err);
      }
    } catch (err) {
      console.error('Error al cargar prospectos', err);
    }
  };

  useEffect(() => {
    fetchProspectos();
  }, [location]);

  // Filtrado por cliente
  const prospectosFiltrados = prospectos.filter((cliente) =>
    cliente.nombre.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  // Paginación
  const indiceUltimo = paginaActual * registrosPorPagina;
  const indicePrimero = indiceUltimo - registrosPorPagina;
  const prospectosPaginados = prospectosFiltrados.slice(indicePrimero, indiceUltimo);

  const totalPaginas = Math.ceil(prospectosFiltrados.length / registrosPorPagina);

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="contenido-modulo">
          <div className='encabezado-modulo'>
            <div>
              <h3 className='titulo-profesional'>Prospectos de clientes</h3>

              {/* BOTONES EXPORTAR */}
              <button
                onClick={() => exportToExcel(prospectos)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '0.45rem 0.9rem', border: '1.5px solid #16a34a',
                  borderRadius: '8px', background: 'transparent', color: '#16a34a',
                  fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <i className="fa-solid fa-file-excel" style={{ color: 'inherit', fontSize: '16px' }}></i>
                <span>Exportar a Excel</span>
              </button>

              <button
                onClick={exportarPDF}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '0.45rem 0.9rem', border: '1.5px solid #dc2626',
                  borderRadius: '8px', background: 'transparent', color: '#dc2626',
                  fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <i className="fa-solid fa-file-pdf" style={{ color: 'inherit', fontSize: '16px' }}></i>
                <span>Exportar a PDF</span>
              </button>
            </div>
          </div>

          {/* FILTRO */}
          <div style={{ margin: "15px 0" }}>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={filtroTexto}
              onChange={(e) => {
                setFiltroTexto(e.target.value);
                setPaginaActual(1);
              }}
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                width: "250px"
              }}
            />
          </div>
          <div className="max-width">
            {/* TABLA */}
            <div className="container-tabla">
              <div className="table-container">
                <table id='tabla_prospectos'>
                  <thead>
                    <tr>
                      <th>Cotización</th>
                      <th>Cliente</th>
                      <th>Ciudad</th>
                      <th>Teléfono</th>
                      <th>Correo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prospectosPaginados.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center' }}>No hay prospectos registrados.</td>
                      </tr>
                    ) : (
                      prospectosPaginados.map((cliente, index) => (
                        <tr key={index}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {(() => {
                              const emailKey = (cliente.correo || '').toLowerCase();
                              const list = cotizacionesMap[emailKey] || [];
                              const isExpanded = !!expandedEmails[emailKey];
                              const toShow = isExpanded ? list : list.slice(0, 3);

                              return (
                                <div>
                                  {toShow.map((c) => (
                                    <div key={c.id} style={{ display: 'block', marginBottom: 6 }}>
                                      <a href="#" onClick={async (e) => {
                                        e.preventDefault();
                                        try {
                                          const token = localStorage.getItem('token');
                                          const res = await fetch(`http://localhost:5000/api/cotizaciones/${c.id}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
                                          if (res.ok) {
                                            const data = await res.json();
                                            setCotizacionSeleccionada(data);
                                            setMostrarPreview(true);
                                          } else {
                                            console.warn('No se pudo cargar la cotización');
                                          }
                                        } catch (err) { console.error(err); }
                                      }} style={{ color: '#1f6feb', cursor: 'pointer', textDecoration: 'underline' }}>{c.codigo}</a>
                                    </div >
                                  ))
                                  }

                                  {
                                    list.length > 3 && (
                                      <div>
                                        <a href="#" onClick={(e) => { e.preventDefault(); setExpandedEmails(prev => ({ ...prev, [emailKey]: !prev[emailKey] })); }} style={{ color: '#1f6feb', cursor: 'pointer', textDecoration: 'underline' }}>
                                          {isExpanded ? 'mostrar menos' : '...'}
                                        </a>
                                      </div>
                                    )
                                  }
                                </div >
                              );
                            })()}
                          </td >
                          <td>{cliente.nombre}</td>
                          <td>{cliente.ciudad}</td>
                          <td>{cliente.telefono}</td>
                          <td>{cliente.correo}</td>
                        </tr >
                      ))
                    )}
                  </tbody>
                </table>
              </div >
            </div >


            {/* PAGINACIÓN */}
            < div style={{ marginTop: "15px", display: "flex", justifyContent: "center", gap: "8px" }}>
              {
                Array.from({ length: totalPaginas }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPaginaActual(i + 1)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      background: paginaActual === i + 1 ? "#5a3badff" : "white",
                      color: paginaActual === i + 1 ? "white" : "#333",
                      cursor: "pointer"
                    }}
                  >
                    {i + 1}
                  </button>
                ))
              }
            </div >
          </div >
          {
            mostrarPreview && cotizacionSeleccionada && (
              <CotizacionPreview datos={cotizacionSeleccionada} onClose={() => { setMostrarPreview(false); setCotizacionSeleccionada(null); }} />
            )
          }
          <div className="custom-footer">
            <p className="custom-footer-text">
              © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.

            </p>
          </div>
        </div>
      </div>
    </div>
  )
}