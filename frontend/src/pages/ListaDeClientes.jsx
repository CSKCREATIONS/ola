
import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';
import PropTypes from 'prop-types';
import LabeledInput from '../components/LabeledInput';
import Swal from 'sweetalert2';
import '../App.css';
import SharedListHeaderCard from '../components/SharedListHeaderCard';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import RemisionPreview from '../components/RemisionPreview';
import Modal from '../components/Modal';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// CSS para diseño avanzado
const advancedStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .clientes-container * {
    box-sizing: border-box;
  }
  
  .fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }
  
  .glassmorphism {
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
  }
`;

// Inyectar estilos una sola vez
if (!document.querySelector('#clientes-advanced-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'clientes-advanced-styles';
  styleSheet.textContent = advancedStyles;
  document.head.appendChild(styleSheet);
}

/*** MODAL EDITAR CLIENTE (moved to module scope) ***/
const ModalEditarCliente = ({ cliente, onClose, onSave }) => {
  const [form, setForm] = useState({ ...cliente });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre || !form.ciudad || !form.telefono || !form.correo) {
      Swal.fire('Campos obligatorios', 'Completa todos los campos', 'warning');
      return;
    }
    onSave(form);
  };

  // Cerrar al presionar ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <Modal isOpen={true} onClose={onClose} hideHeader className="clientes-edit-modal">
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden'
        }}
      >
        {/* Header del modal (custom styled) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: 'white',
            padding: '1.5rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="fa-solid fa-user-pen" style={{ fontSize: '1.5rem' }} aria-hidden="true"></i>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
              Editar Cliente
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              width: '40px',
              height: '40px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
            aria-label="Cerrar modal"
          >
            <i className="fa-solid fa-times" aria-hidden="true"></i>
          </button>
        </div>

        {/* Contenido scrolleable - formulario */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <LabeledInput
              id="input-cliente-nombre"
              label="Nombre"
              iconClass="fa-solid fa-user"
              name="nombre"
              value={form.nombre || ''}
              onChange={handleChange}
              required
            />

            <LabeledInput
              id="input-cliente-ciudad"
              label="Ciudad"
              iconClass="fa-solid fa-city"
              name="ciudad"
              value={form.ciudad || ''}
              onChange={handleChange}
              required
            />

            <LabeledInput
              id="input-cliente-telefono"
              label="Teléfono"
              iconClass="fa-solid fa-phone"
              name="telefono"
              value={form.telefono || ''}
              onChange={handleChange}
              required
            />

            <LabeledInput
              id="input-cliente-correo"
              label="Correo"
              iconClass="fa-solid fa-envelope"
              name="correo"
              type="email"
              value={form.correo || ''}
              onChange={handleChange}
              required
            />
          </div>

          {/* Footer con botones (dentro del formulario para que el submit funcione correctamente) */}
          <div
            style={{
              padding: '1.5rem 2rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end',
              flexShrink: 0,
              backgroundColor: 'white'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#9ca3af';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)';
              }}
            >
              <i className="fa-solid fa-floppy-disk" aria-hidden="true"></i>
              <span>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// PropTypes for ModalEditarCliente
ModalEditarCliente.propTypes = {
  cliente: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nombre: PropTypes.string,
    ciudad: PropTypes.string,
    telefono: PropTypes.string,
    correo: PropTypes.string,
  }),
  onClose: PropTypes.func,
  onSave: PropTypes.func.isRequired,
};

ModalEditarCliente.defaultProps = {
  cliente: null,
  onClose: () => { },
};

export default function ListaDeClientes() {
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState(""); // 👉 filtro agregado
  const [remisionesMap, setRemisionesMap] = useState({}); // clienteId -> [{_id, numeroRemision}]
  const [remisionPreviewData, setRemisionPreviewData] = useState(null);
  const [showRemisionPreview, setShowRemisionPreview] = useState(false);

  /*** PAGINACIÓN ***/
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // número de registros por página

  // 👉 primero filtramos
  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = filtroTexto.toLowerCase();
    return (
      cliente.nombre?.toLowerCase().includes(texto) ||
      cliente.correo?.toLowerCase().includes(texto)
    );
  });

  // 👉 después aplicamos paginación sobre los filtrados
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = clientesFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(clientesFiltrados.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const res = await api.get('/api/clientes');
        const data = res.data || res;
        const lista = Array.isArray(data) ? data : (data.data || []);
        const listaOrdenada = lista.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setClientes(listaOrdenada);
      } catch (err) {
        console.error('Error al cargar clientes:', err);
        setClientes([]);
      }
    };

    cargarClientes();
  }, []);

  // Helper: Extraer ID del cliente de diferentes formatos
  const extractClientId = (cli) => {
    if (!cli) return null;
    
    if (typeof cli === 'string') {
      return cli;
    }
    
    if (cli._id) {
      try {
        return typeof cli._id === 'string' ? cli._id : cli._id.toString();
      } catch (e) {
        console.error('Error converting cli._id to string:', e);
        return String(cli._id);
      }
    }
    
    if (cli.id) {
      try {
        return typeof cli.id === 'string' ? cli.id : cli.id.toString();
      } catch (e) {
        console.error('Error converting cli.id to string:', e);
        return String(cli.id);
      }
    }
    
    // último recurso: serializar el objeto cliente
    try {
      return String(cli);
    } catch (e) {
      console.error('Error serializing cliente object:', e);
      return null;
    }
  };

  // Helper: Agrupar remisiones por cliente
  const groupRemisionesByCliente = (remisiones) => {
    const grouped = {};
    const remisionesArray = Array.isArray(remisiones) ? remisiones : [];
    
    for (const r of remisionesArray) {
      const cli = r?.cliente;
      const idStr = extractClientId(cli);
      
      if (!idStr) continue;
      
      if (!grouped[idStr]) grouped[idStr] = [];
      grouped[idStr].push({ _id: r._id, numeroRemision: r.numeroRemision });
    }
    
    // Ordenar remisiones por numeroRemision (desc) dentro de cada cliente
    for (const k of Object.keys(grouped)) {
      grouped[k].sort((a, b) => String(b.numeroRemision).localeCompare(String(a.numeroRemision)));
    }
    
    return grouped;
  };

  // Cargar remisiones y agruparlas por cliente
  useEffect(() => {
    const cargarRemisiones = async () => {
      try {
        const res = await api.get('/api/remisiones?limite=1000');
        const payload = res.data || res;
        // soportar varias formas de respuesta por si cambia el backend
        const remisiones = payload.remisiones || payload.data?.remisiones || payload.data || [];
        // pequeño log para depuración en el navegador
        if (globalThis.console?.debug) {
          console.debug('[ListaDeClientes] remisiones fetched count=', Array.isArray(remisiones) ? remisiones.length : 0, remisiones?.slice?.(0, 5) ?? remisiones);
        }

        const grouped = groupRemisionesByCliente(remisiones);
        setRemisionesMap(grouped);
      } catch (err) {
        console.error('Error al cargar remisiones:', err);
        setRemisionesMap({});
      }
    };
    cargarRemisiones();
  }, []);

  const abrirRemisionPreview = useCallback(async (remisionId) => {
    try {
      const res = await api.get(`/api/remisiones/${remisionId}`);
      const data = (res.data && (res.data.remision || res.data.data || res.data)) || null;
      if (!data) throw new Error('Remisión no encontrada');
      setRemisionPreviewData(data);
      setShowRemisionPreview(true);
    } catch (err) {
      console.error('Error abriendo remisión:', err);
      const SwalLib = (await import('sweetalert2')).default;
      SwalLib.fire('Error', 'No se pudo cargar la remisión', 'error');
    }
  }, []);

  const cerrarRemisionPreview = useCallback(() => {
    setShowRemisionPreview(false);
    setRemisionPreviewData(null);
  }, []);



  const handleGuardar = async (clienteActualizado) => {
    try {
      const res = await api.put(`/api/clientes/${clienteActualizado._id}`, clienteActualizado);
      if (!(res.status >= 200 && res.status < 300)) throw new Error('Error al actualizar cliente');
      Swal.fire('Éxito', 'Cliente actualizado correctamente', 'success');
      setMostrarModal(false);
      setClientes(clientes.map(c => c._id === clienteActualizado._id ? clienteActualizado : c));
    } catch (err) {
      Swal.fire('Error', err.message || 'Error al actualizar cliente', 'error');
    }
  };

  /*** FUNCIONES EXPORTAR ***/
  const exportarPDF = async () => {
    try {
      const module = await import('../utils/exportToPdf');
      const exportElementToPdf = module.default || module;
      await exportElementToPdf('tabla_clientes', 'listaClientes.pdf');
    } catch (err) {
      console.error('Error exportando PDF:', err);
    }
  };

  const exportToExcel = (todosLosClientes) => {
    if (!todosLosClientes || todosLosClientes.length === 0) {
      Swal.fire("Error", "No hay datos para exportar", "warning");
      return;
    }

    const dataFormateada = todosLosClientes.map(cliente => ({
      'Nombre': cliente.nombre || cliente.clienteInfo?.nombre || '',
      'Remisiones asociadas': (remisionesMap[cliente._id]?.map(r => r.numeroRemision).join(', ')) || '',
      'Ciudad': cliente.ciudad || cliente.clienteInfo?.ciudad || '',
      'Teléfono': cliente.telefono || cliente.clienteInfo?.telefono || '',
      'Correo': cliente.correo || cliente.clienteInfo?.correo || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataFormateada);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'ListaClientes.xlsx');
  };

  // Mostrar remisiones adicionales en un modal Swal
  const handleVerMasRemisiones = useCallback((clienteId) => {
    const rems = remisionesMap[clienteId] || [];
    if (rems.length <= 3) return;
    const restantes = rems.slice(3);
    const listadoHTML = restantes
      .map(r => `<button data-remision="${r._id}" style="display:inline-block;margin:4px;padding:6px 10px;border:1px solid #6366f1;border-radius:6px;background:#fff;color:#1e40af;font-size:12px;font-weight:600;cursor:pointer;">Remisión ${r.numeroRemision}</button>`)
      .join('');
    Swal.fire({
      title: 'Remisiones adicionales',
      html: `<div style="text-align:left;max-height:300px;overflow:auto">${listadoHTML}</div>`,
      showCloseButton: true,
      focusConfirm: false,
      showConfirmButton: false,
      width: 500
    });
    // Delegar clicks
    setTimeout(() => {
      const container = document.querySelector('.swal2-html-container');
      if (!container) return;
      const buttons = container.querySelectorAll('button[data-remision]');
      for (const btn of buttons) {
        btn.addEventListener('click', () => {
          const id = btn.dataset.remision;
          abrirRemisionPreview(id);
          Swal.close();
        });
      }
    }, 0);
  }, [remisionesMap, abrirRemisionPreview]);



  return (
    <div className="clientes-container">
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="max-width">
          <div className="contenido-modulo">
            {/* Encabezado profesional del módulo */}
            <SharedListHeaderCard
              title="Lista de Clientes"
              subtitle="Gestión de Clientes registrados en el sistema"
              iconClass="fa-solid fa-users"
            >
              <div className="export-buttons">
                <button
                  onClick={() => exportToExcel(clientesFiltrados)}
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

            {/* Panel de filtros avanzado */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '25px',
              marginBottom: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    borderRadius: '12px',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fa-solid fa-search" style={{ color: 'white', fontSize: '16px' }}></i>
                  </div>
                  <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1.3rem', fontWeight: '600' }}>
                    Búsqueda de Clientes
                  </h4>
                </div>

                <div style={{
                  background: '#f8fafc',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="fa-solid fa-info-circle" style={{ color: '#3b82f6', fontSize: '14px' }}></i>
                  <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                    {clientesFiltrados.length} cliente{clientesFiltrados.length === 1 ? '' : 's'} encontrado{clientesFiltrados.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="buscar-clientes-input" style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  <i className="fa-solid fa-user-search icon-gap" style={{ color: '#6366f1' }} aria-hidden={true}></i>
                  <span>Buscar por nombre o correo:</span>
                </label>
                <input
                  id="buscar-clientes-input"
                  type="text"
                  placeholder="Buscar por nombre o correo..."
                  value={filtroTexto}
                  onChange={(e) => {
                    setFiltroTexto(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    background: 'white',
                    color: '#374151',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            {/* Tabla de clientes mejorada */}
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
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px'
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
                    <i className="fa-solid fa-users" style={{ color: 'white', fontSize: '16px' }}></i>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1.3rem', fontWeight: '600' }}>
                      Clientes Registrados
                    </h4>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                      Total: {clientesFiltrados.length} cliente{clientesFiltrados.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ overflow: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }} id='tabla_clientes'>
                  <thead>
                    <tr style={{
                      background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      <th ><i className="fa-solid fa-hashtag icon-gap" style={{ color: '#6366f1' }}></i>{' '}<span></span></th>
                      <th><i className="fa-solid fa-file-invoice icon-gap" style={{ color: '#6366f1' }}></i>{' '}<span>SOPORTE</span></th>
                      <th style={{
                        padding: '16px 12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fa-solid fa-user icon-gap" style={{ color: '#6366f1' }} aria-hidden={true}></i>
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
                        <i className="fa-solid fa-map-marker-alt icon-gap" style={{ color: '#6366f1' }} aria-hidden={true}></i>
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
                        <i className="fa-solid fa-phone icon-gap" style={{ color: '#6366f1' }} aria-hidden={true}></i>
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
                        <i className="fa-solid fa-envelope icon-gap" style={{ color: '#6366f1' }} aria-hidden={true}></i>
                        <span>CORREO</span>
                      </th>
                      <th style={{
                        padding: '16px 12px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px'
                      }}>
                        <i className="fa-solid fa-cogs icon-gap" style={{ color: '#6366f1' }} aria-hidden={true}></i>
                        <span>ACCIONES</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((cliente, index) => (
                      <tr key={cliente._id}
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
                        <td style={{ padding: '16px 12px', fontWeight: '700', color: '#374151', textAlign: 'left' }}>
                          {index + 1 + (currentPage - 1) * itemsPerPage}
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          {Array.isArray(remisionesMap[cliente._id]) && remisionesMap[cliente._id].length > 0 ? (
                            <div>
                              {remisionesMap[cliente._id].slice(0, 2).map(rm => (

                                <button
                                  key={rm._id}
                                  title={`Ver remisión ${rm.numeroRemision}`}
                                  onClick={() => abrirRemisionPreview(rm._id)}
                                  style={{ cursor: 'pointer', color: '#6366f1', background: 'transparent', textDecoration: 'underline', display: 'flex', alignItems: 'center', marginBottom: '0.3rem' }}
                                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(30,64,175,0.3)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(30,64,175,0.2)'; }}
                                >
                                  <div className="table-icon-small" style={{marginRight: '0.2rem'}}>
                                    <i className="fa-solid fa-file-invoice" style={{ color: 'white', fontSize: '12px', marginRight: '0.2rem' }}></i>
                                  </div>
                                  <span>{rm.numeroRemision}</span>
                                </button>
                              ))}
                              {remisionesMap[cliente._id].length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => handleVerMasRemisiones(cliente._id)}
                                  style={{
                                    background: 'none',
                                    border: '1px dashed #6366f1',
                                    borderRadius: '8px',
                                    padding: '6px 8px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: '#6366f1',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#eef2ff'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                                >ver más</button>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Sin remisiones</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                            {cliente.nombre || cliente.clienteInfo?.nombre || 'Sin nombre'}
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
                            {cliente.ciudad || cliente.clienteInfo?.ciudad || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                          {cliente.telefono || cliente.clienteInfo?.telefono || 'N/A'}
                        </td>
                        <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                          {cliente.correo || cliente.clienteInfo?.correo || 'N/A'}
                        </td>
                        <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => {
                                setClienteSeleccionado(cliente);
                                setMostrarModal(true);
                              }}
                              title="Editar cliente"
                              style={{
                                background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                                color: '#1e40af',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 10px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(30, 64, 175, 0.2)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 8px rgba(30, 64, 175, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(30, 64, 175, 0.2)';
                              }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {currentItems.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '80px 20px' }}>
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
                              <i className="fa-solid fa-users" style={{
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
                                No hay clientes disponibles
                              </h5>
                              <p style={{
                                color: '#9ca3af',
                                margin: 0,
                                fontSize: '14px',
                                lineHeight: '1.5'
                              }}>
                                No se encontraron clientes con los criterios de búsqueda
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {mostrarModal && clienteSeleccionado && (
                  <ModalEditarCliente
                    cliente={clienteSeleccionado}
                    onClose={() => setMostrarModal(false)}
                    onSave={handleGuardar}
                  />
                )}
              </div>

              {/* Paginación mejorada */}
              {totalPages > 1 && (
                <div style={{
                  padding: '20px 25px',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      style={{
                        padding: '8px 16px',
                        border: currentPage === i + 1 ? '2px solid #6366f1' : '2px solid #e5e7eb',
                        borderRadius: '8px',
                        background: currentPage === i + 1 ? '#6366f1' : 'white',
                        color: currentPage === i + 1 ? 'white' : '#4b5563',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== i + 1) {
                          e.target.style.borderColor = '#6366f1';
                          e.target.style.color = '#6366f1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== i + 1) {
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
          </div>
        </div>


      </div>
      <div className="custom-footer">
        <p className="custom-footer-text">
          © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
        </p>
      </div>
      {showRemisionPreview && remisionPreviewData && (
        <RemisionPreview datos={remisionPreviewData} onClose={cerrarRemisionPreview} />
      )}
    </div>
  );
}

