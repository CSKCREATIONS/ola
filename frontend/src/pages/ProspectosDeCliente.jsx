import Fijo from '../components/Fijo'
import NavVentas from '../components/NavVentas'
import SharedListHeaderCard from '../components/SharedListHeaderCard'
import { useLocation } from 'react-router-dom';
import exportElementToPdf from '../utils/exportToPdf';

import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import CotizacionPreview from '../components/CotizacionPreview';
import { contarLongitudesObjetoValues } from '../utils/calculations';

// CSS inyectado para diseño avanzado
const advancedStyles = `
  .prospectos-advanced-table {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #e5e7eb;
  }
  
  .prospectos-header-section {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    padding: 20px 25px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .prospectos-filters-section {
    background: linear-gradient(135deg, #f9fafb, #f3f4f6);
    padding: 25px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .prospectos-filter-input {
    width: 100%;
    max-width: 350px;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    transition: all 0.3s ease;
    background: white;
  }
  
  .prospectos-filter-input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  .prospectos-table-container {
    overflow: auto;
  }
  
  .prospectos-advanced-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  
  .prospectos-advanced-table thead tr {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-bottom: 2px solid #e5e7eb;
  }
  
  .prospectos-advanced-table thead th {
    padding: 16px 12px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 13px;
    letter-spacing: 0.5px;
  }
  
  .prospectos-advanced-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }
  
  .prospectos-advanced-table tbody tr:hover {
    background-color: #f8fafc;
  }
  
  .prospectos-advanced-table tbody td {
    padding: 16px 12px;
    color: #4b5563;
    font-weight: 500;
  }
  
  .prospectos-pagination-container {
    padding: 20px 25px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: center;
    gap: 8px;
  }
  
  .prospectos-pagination-btn {
    padding: 8px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    color: #4b5563;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .prospectos-pagination-btn.active {
    border-color: #6366f1;
    background: #6366f1;
    color: white;
  }
  
  .prospectos-pagination-btn:hover:not(.active) {
    border-color: #6366f1;
    color: #6366f1;
  }
  
  .prospectos-cotizacion-link {
    color: #6366f1;
    text-decoration: none;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
    font-weight: 500;
    display: inline-block;
    margin-bottom: 4px;
  }
  
  .prospectos-cotizacion-link:hover {
    background: rgba(99, 102, 241, 0.1);
    text-decoration: underline;
  }
  
  .prospectos-expand-link {
    color: #8b5cf6;
    text-decoration: none;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  
  .prospectos-expand-link:hover {
    background: rgba(139, 92, 246, 0.1);
    text-decoration: underline;
  }
  
  .prospectos-empty-state {
    text-align: center;
    padding: 80px 20px;
  }
  
  .prospectos-empty-icon {
    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
    border-radius: 50%;
    padding: 25px;
    margin: 0 auto 20px auto;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

// Inyectar estilos
if (!document.getElementById('prospectos-advanced-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'prospectos-advanced-styles';
  styleSheet.textContent = advancedStyles;
  document.head.appendChild(styleSheet);
}
 
export default function ProspectosDeCliente() {
/*** Funcion para exportar a pdf ***/
const exportarPDF = async () => {
  const input = document.getElementById('tabla_prospectos');
  if (!input) {
    console.error('Elemento para exportar no encontrado: tabla_prospectos');
    return;
  }

  try {
    await exportElementToPdf(input, 'prospectos.pdf');
  } catch (err) {
    console.error('Error exportando PDF:', err);
  }
};

  const location = useLocation();

  // Estado local
  const [prospectos, setProspectos] = useState([]);
  const [cotizacionesMap, setCotizacionesMap] = useState({});
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [expandedEmails, setExpandedEmails] = useState({});
  const [filtroTexto, setFiltroTexto] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  // Exportar tabla a Excel
  const exportToExcel = () => {
    try {
      const table = document.getElementById('tabla_prospectos');
      if (!table) {
        console.error('Tabla de prospectos no encontrada para exportar');
        return;
      }
      const wb = XLSX.utils.table_to_book(table, { raw: true });
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'prospectos.xlsx');
    } catch (err) {
      console.error('Error exportando Excel:', err);
    }
  };

  const fetchProspectos = async () => {
    try {
      // Usa el nuevo endpoint de prospectos; agrega cache-buster para evitar 304
      const clientesRes = await api.get(`/api/clientes/prospectos?t=${Date.now()}`);
      const data = clientesRes.data;
      // controller returns array of clientes
      const listaProspectos = Array.isArray(data) ? data : (data.data || []);
      const prospectosOrdenados = listaProspectos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setProspectos(prospectosOrdenados);

      // Also fetch cotizaciones once and build a map by client email
      try {
        const cotRes = await api.get(`/api/cotizaciones?t=${Date.now()}`);
        const cotData = cotRes.data;
        const cotList = Array.isArray(cotData) ? cotData : (cotData.data || []);
        const map = {};
        for (const cot of cotList) {
          const email = (cot.cliente?.correo || '').toLowerCase();
          if (!email) continue;
          if (!map[email]) map[email] = [];
          if (cot.codigo) map[email].push({ codigo: cot.codigo, id: cot._id });
        }
        setCotizacionesMap(map);
      } catch (err) {
        console.error('Error al cargar cotizaciones:', err);
      }
    } catch (err) {
      console.error('Error al cargar prospectos', err);
      setProspectos([]);
    }
  };

  // Manejar apertura de preview de cotización (extraído para reducir anidamiento)
  const abrirCotizacionPreview = async (cotId) => {
    try {
      const res = await api.get(`/api/cotizaciones/${cotId}`);
      const data = res.data || res;
      setCotizacionSeleccionada(data);
      setMostrarPreview(true);
    } catch (err) {
      console.warn('No se pudo cargar la cotización', err);
      Swal.fire('Error', 'No se pudo cargar la cotización', 'error');
    }
  };

  const toggleExpandEmails = (emailKey) => {
    setExpandedEmails(prev => ({ ...prev, [emailKey]: !prev[emailKey] }));
  };

  // Renderizar lista de cotizaciones para un cliente (extraído para mantener JSX limpio)
  const renderCotizacionesForCliente = (cliente) => {
    const emailKey = (cliente.correo || '').toLowerCase();
    const list = cotizacionesMap[emailKey] || [];
    const isExpanded = !!expandedEmails[emailKey];
    const toShow = isExpanded ? list : list.slice(0, 3);

    return (
      <div>
        {toShow.map((c) => (
          <div key={c.id} style={{ display: 'block', marginBottom: 6 }}>
            <button
              type="button"
              onClick={() => abrirCotizacionPreview(c.id)}
              className="prospectos-cotizacion-link"
              aria-label={`Abrir cotización ${c.codigo}`}
            >
              {c.codigo}
            </button>
          </div>
        ))}

        {list.length > 3 && (
          <div>
            <button
              type="button"
              onClick={() => toggleExpandEmails(emailKey)}
              className="prospectos-expand-link"
              aria-expanded={isExpanded}
              aria-controls={`cotizaciones-${emailKey}`}
            >
              {isExpanded ? 'mostrar menos' : `...ver ${list.length - 3} más`}
            </button>
          </div>
        )}
      </div>
    );
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
          <SharedListHeaderCard
            title="Prospectos de Clientes"
            subtitle="Gestiona y supervisa los clientes potenciales"
            iconClass="fa-solid fa-chart-line"
          >
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={exportToExcel}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-file-excel"></i>
                <span>Exportar Excel</span>
              </button>
              <button
                onClick={exportarPDF}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-file-pdf"></i>
                <span>Exportar PDF</span>
              </button>
            </div>
          </SharedListHeaderCard>

          {/* Estadísticas avanzadas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-chart-line" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {prospectos.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Total Prospectos
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-file-alt" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {contarLongitudesObjetoValues(cotizacionesMap)}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Cotizaciones Asociadas
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-filter" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {prospectosFiltrados.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Resultados Filtrados
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de filtros avanzado */}
          <div style={{
            background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
            borderRadius: '16px',
            padding: '25px',
            marginBottom: '30px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <i className="fa-solid fa-search" style={{ color: '#6366f1', fontSize: '1.2rem' }}></i>
              <h4 style={{ margin: 0, color: '#374151', fontSize: '1.1rem', fontWeight: '600' }}>
                Buscar Prospectos
              </h4>
            </div>
            
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <label htmlFor="input-prospectos-1" style={{
                position: 'absolute',
                top: '-8px',
                left: '12px',
                background: '#f9fafb',
                padding: '0 8px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6366f1',
                zIndex: 1
              }}>
                Filtrar por Cliente</label>
              <input id="input-prospectos-1"
                type="text"
                placeholder="Buscar por nombre, ciudad, teléfono o correo..."
                value={filtroTexto}
                onChange={(e) => {
                  setFiltroTexto(e.target.value);
                  setPaginaActual(1);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  background: 'white'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
          {/* Tabla de prospectos mejorada */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
              padding: '20px 25px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: '12px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-table" style={{ color: 'white', fontSize: '16px' }}></i>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#1f2937', fontSize: '1.3rem', fontWeight: '600' }}>
                    Lista de Prospectos
                  </h4>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    Mostrando {prospectosPaginados.length} de {prospectosFiltrados.length} prospectos
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }} id='tabla_prospectos'>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <th>#</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-file-alt icon-gap" style={{ color: '#6366f1' }}></i>
                      <span>COTIZACIONES</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-user icon-gap" style={{ color: '#6366f1' }}></i>
                      <span>CLIENTE</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-map-marker-alt icon-gap" style={{ color: '#6366f1' }}></i>
                      <span>CIUDAD</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-phone icon-gap" style={{ color: '#6366f1' }}></i>
                      <span>TELÉFONO</span>
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-envelope icon-gap" style={{ color: '#6366f1' }}></i>
                      <span>CORREO</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prospectosPaginados.length === 0 ? (
                    <tr>
                      <td>
                        
                      </td>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '20px'
                        }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                            borderRadius: '50%',
                            padding: '25px',
                            marginBottom: '10px'
                          }}>
                            <i className="fa-solid fa-chart-line" style={{ 
                              fontSize: '3.5rem', 
                              color: '#9ca3af'
                            }}></i>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <h5 style={{ 
                              color: '#6b7280', 
                              margin: '0 0 12px 0',
                              fontSize: '1.2rem',
                              fontWeight: '600'
                            }}>
                              No hay prospectos registrados
                            </h5>
                            <p style={{ 
                              color: '#9ca3af', 
                              margin: 0, 
                              fontSize: '14px',
                              lineHeight: '1.5'
                            }}>
                              No se encontraron prospectos con los criterios de búsqueda
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    prospectosPaginados.map((cliente, index) => (
                      <tr key={cliente._id || cliente.id || index} 
                          style={{
                            borderBottom: '1px solid #f3f4f6',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                      >
                        <td></td>
                        <td style={{ padding: '16px 12px', whiteSpace: 'nowrap' }}>
                          {renderCotizacionesForCliente(cliente)}
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                            {cliente.nombre}
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <span style={{
                            background: '#fef3c7',
                            color: '#d97706',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'inline-block'
                          }}>
                            {cliente.ciudad}
                          </span>
                        </td>
                        <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                          {cliente.telefono}
                        </td>
                        <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                          {cliente.correo}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Paginación mejorada */}
            {totalPaginas > 1 && (
              <div style={{
                padding: '20px 25px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'center',
                gap: '8px'
              }}>
                {Array.from({ length: totalPaginas }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPaginaActual(i + 1)}
                    style={{
                      padding: '8px 16px',
                      border: paginaActual === i + 1 ? '2px solid #6366f1' : '2px solid #e5e7eb',
                      borderRadius: '8px',
                      background: paginaActual === i + 1 ? '#6366f1' : 'white',
                      color: paginaActual === i + 1 ? 'white' : '#4b5563',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (paginaActual !== i + 1) {
                        e.target.style.borderColor = '#6366f1';
                        e.target.style.color = '#6366f1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (paginaActual !== i + 1) {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.color = '#4b5563';
                      }
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
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

