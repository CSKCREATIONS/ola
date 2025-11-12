// src/pages/Proveedores.jsx
import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavCompras from '../components/NavCompras';

const API_URL = '/api/proveedores';

/* Estilos CSS avanzados para Proveedores */
const proveedoresStyles = `
  <style>
    .proveedor-advanced-container {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .proveedor-stats-card {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-radius: 16px;
      padding: 25px;
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .proveedor-stats-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }

    .proveedor-stats-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
    }

    .proveedor-professional-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      color: white;
      position: relative;
      overflow: hidden;
    }

    .proveedor-header-decoration {
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      z-index: 1;
    }

    .proveedor-icon-container {
      background: rgba(255,255,255,0.2);
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(10px);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .proveedor-table-modern {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-radius: 20px;
      padding: 30px;
      border: 1px solid #e5e7eb;
      backdrop-filter: blur(10px);
    }

    .proveedor-table-wrapper {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .proveedor-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 12px;
      overflow: hidden;
    }

    .proveedor-table thead tr {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
    }

    .proveedor-table th {
      padding: 20px 15px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .proveedor-table tbody tr {
      border-bottom: 1px solid #f3f4f6;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .proveedor-table tbody tr:hover {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      transform: scale(1.01);
    }

    .proveedor-table td {
      padding: 20px 15px;
      font-size: 14px;
      color: #374151;
    }

    .proveedor-action-btn {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin: 0 2px;
    }

    .proveedor-action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(99, 102, 241, 0.4);
    }

    .proveedor-action-btn.danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    .proveedor-action-btn.danger:hover {
      box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4);
    }

    .proveedor-add-btn {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 20px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .proveedor-add-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }

    .proveedor-status-badge {
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .proveedor-status-active {
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      color: #059669;
    }

    .proveedor-contact-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .proveedor-contact-item {
      font-size: 12px;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 5px;
    }
  </style>
`;

if (typeof document !== 'undefined') {
  const existingStyles = document.getElementById('proveedor-advanced-styles');
  if (!existingStyles) {
    const styleElement = document.createElement('div');
    styleElement.id = 'proveedor-advanced-styles';
    styleElement.innerHTML = proveedoresStyles;
    document.head.appendChild(styleElement);
  }
}

const ProveedorModal = ({ proveedor, onClose, onSave }) => {
  const [form, setForm] = useState({
    nombre: proveedor?.nombre || '',
    contacto: {
      telefono: proveedor?.contacto?.telefono || '',
      correo: proveedor?.contacto?.correo || ''
    },
    direccion: {
      calle: proveedor?.direccion?.calle || '',
      pais: proveedor?.direccion?.pais || ''
    },
    empresa: proveedor?.empresa || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('contacto.')) {
      const key = name.split('.')[1];
      setForm(prev => ({ ...prev, contacto: { ...prev.contacto, [key]: value } }));
    } else if (name.startsWith('direccion.')) {
      const key = name.split('.')[1];
      setForm(prev => ({ ...prev, direccion: { ...prev.direccion, [key]: value } }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { nombre, contacto, direccion } = form;
    if (!nombre.trim() || !contacto.telefono.trim() || !contacto.correo.trim() || !direccion.calle.trim() || !direccion.pais.trim()) {
      Swal.fire('Error', 'Todos los campos obligatorios deben estar completos', 'warning');
      return;
    }
    onSave({ ...proveedor, ...form });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
      margin: 0,
      padding: 0
    }}>
      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'modalSlideIn 0.3s ease-out',
        margin: 0,
        padding: 0,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header del modal */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          padding: '2rem',
          borderRadius: '20px 20px 0 0'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="fa-solid fa-truck" style={{ fontSize: '1.5rem' }}></i>
            </div>
            {proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h3>
          <p style={{ 
            margin: '0.5rem 0 0 4rem', 
            opacity: 0.9, 
            fontSize: '0.95rem' 
          }}>
            {proveedor ? 'Modifica la información del proveedor' : 'Registra un nuevo proveedor para la gestión de inventario'}
          </p>
        </div>

        {/* Contenido scrolleable */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: '2.5rem',
          backgroundColor: '#f8fafc'
        }}>
          {/* Información básica */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #10b981'
          }}>
            <h4 style={{
              margin: '0 0 1.5rem 0',
              color: '#1e293b',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fa-solid fa-user" style={{ color: '#10b981' }}></i>
              <span>Información Básica</span>
            </h4>
            
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label htmlFor="input-proveedor-nombre" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '1rem'
                }}>
                  <i className="fa-solid fa-signature" style={{ color: '#10b981', fontSize: '0.9rem' }}></i>
                  <span>Nombre del Proveedor</span>
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="input-proveedor-nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Distribuidora ABC"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#ffffff',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10b981';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="input-proveedor-empresa" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '1rem'
                }}>
                  <i className="fa-solid fa-building" style={{ color: '#10b981', fontSize: '0.9rem' }}></i>
                  <span>Empresa (opcional)</span>
                </label>
                <input
                  id="input-proveedor-empresa"
                  name="empresa"
                  value={form.empresa}
                  onChange={handleChange}
                  placeholder="Ej: Corporación XYZ"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#ffffff',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10b981';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Información de contacto */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #3b82f6'
          }}>
            <h4 style={{
              margin: '0 0 1.5rem 0',
              color: '#1e293b',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fa-solid fa-phone" style={{ color: '#3b82f6' }}></i>
              <span>Información de Contacto</span>
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label htmlFor="input-proveedor-telefono" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '1rem'
                }}>
                  <i className="fa-solid fa-phone" style={{ color: '#3b82f6', fontSize: '0.9rem' }}></i>
                  <span>Teléfono</span>
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="input-proveedor-telefono"
                  name="contacto.telefono"
                  value={form.contacto.telefono}
                  onChange={handleChange}
                  placeholder="Ej: +57 300 123 4567"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#ffffff',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="input-proveedor-correo" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '1rem'
                }}>
                  <i className="fa-solid fa-envelope" style={{ color: '#3b82f6', fontSize: '0.9rem' }}></i>
                  <span>Correo Electrónico</span>
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="input-proveedor-correo"
                  name="contacto.correo"
                  type="email"
                  value={form.contacto.correo}
                  onChange={handleChange}
                  placeholder="Ej: contacto@proveedor.com"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#ffffff',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #f59e0b'
          }}>
            <h4 style={{
              margin: '0 0 1.5rem 0',
              color: '#1e293b',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fa-solid fa-map-marker-alt" style={{ color: '#f59e0b' }}></i>
              <span>Dirección</span>
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              <div>
                <label htmlFor="input-proveedor-calle" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '1rem'
                }}>
                  <i className="fa-solid fa-road" style={{ color: '#f59e0b', fontSize: '0.9rem' }}></i>
                  <span>Dirección</span>
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="input-proveedor-calle"
                  name="direccion.calle"
                  value={form.direccion.calle}
                  onChange={handleChange}
                  placeholder="Ej: Calle 123 #45-67, Barrio Centro"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#ffffff',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#f59e0b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="input-proveedor-pais" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '1rem'
                }}>
                  <i className="fa-solid fa-globe" style={{ color: '#f59e0b', fontSize: '0.9rem' }}></i>
                  <span>País</span>
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="input-proveedor-pais"
                  name="direccion.pais"
                  value={form.direccion.pais}
                  onChange={handleChange}
                  placeholder="Ej: Colombia"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#ffffff',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#f59e0b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem', 
          justifyContent: 'flex-end',
          padding: '2rem 2.5rem',
          borderTop: '2px solid #e5e7eb',
          backgroundColor: 'white',
          borderRadius: '0 0 20px 20px',
          flexShrink: 0
        }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              padding: '0.875rem 1.5rem',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
              e.target.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            <i className="fa-solid fa-times"></i>
            <span>Cancelar</span>
          </button>
          
          <button 
            type="submit"
            style={{
              padding: '0.875rem 1.5rem',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 12px -1px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.3)';
            }}
          >
            <i className="fa-solid fa-truck"></i>
            <span>Guardar</span>
          </button>
        </div>
      </form>
    </div>
  );
};

const ModalProductosProveedor = ({ visible, onClose, productos, proveedor }) => {
  if (!visible) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* Header */}
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="fas fa-boxes"></i> Productos de {proveedor}
          </h5>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {productos.length > 0 ? (
            <ul className="product-list">
              {productos.map((prod) => (
                <li key={prod._id} className="product-item">
                  <div className="product-info">
                    <strong>{prod.name}</strong>
                    <span className="price">${prod.price}</span>
                  </div>
                  <span className="stock">Stock: {prod.stock}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">
              <i className="fas fa-exclamation-circle"></i> Este proveedor no tiene productos asociados.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

};

const GestionProveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalProductosVisible, setModalProductosVisible] = useState(false);
  const [productosProveedor, setProductosProveedor] = useState([]);
  const [proveedorNombre, setProveedorNombre] = useState('');
  const [proveedorEditando, setProveedorEditando] = useState(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = proveedores.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(proveedores.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => { cargarProveedores(); }, []);

  const cargarProveedores = async () => {
    try {
      const res = await api.get(API_URL);
      const result = res.data;
      const listaProveedores = result.proveedores || result.data || [];
      const proveedoresOrdenados = (Array.isArray(listaProveedores) ? listaProveedores : []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setProveedores(proveedoresOrdenados);
    } catch {
      Swal.fire('Error', 'No se pudieron cargar los proveedores', 'error');
    }
  };

  const guardarProveedor = async (proveedor) => {
    const url = proveedor._id ? `${API_URL}/${proveedor._id}` : API_URL;
    const method = proveedor._id ? 'PUT' : 'POST';
    try {
      const res = await api({ method, url, data: proveedor });
      if (res.status < 200 || res.status >= 300) {
        throw new Error(res.data?.message || 'Error al guardar el proveedor');
      }
      Swal.fire('Éxito', 'Proveedor guardado correctamente', 'success');
      setModalVisible(false);
      cargarProveedores();
    } catch (err) { Swal.fire('Error', err.message, 'error'); }
  };

  const toggleEstadoProveedor = async (id, activar = false) => {
    const confirm = await Swal.fire({
      title: activar ? '¿Activar proveedor?' : '¿Desactivar proveedor?',
      text: activar ? 'Este proveedor volverá a estar disponible.' : 'Este proveedor ya no estará disponible.',
      icon: activar ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: activar ? 'Sí, activar' : 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await api.patch(`/api/proveedores/${id}/${activar ? 'activate' : 'deactivate'}`);
      if (res.status < 200 || res.status >= 300) throw new Error('Error al cambiar el estado del proveedor');
      Swal.fire(activar ? 'Proveedor activado' : 'Proveedor desactivado', '', 'success');
      cargarProveedores();
    } catch (err) { Swal.fire('Error', err.message, 'error'); }
  };

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavCompras />
        <div className="contenido-modulo">
          {/* Encabezado profesional */}
          <div className="proveedor-professional-header">
            <div className="proveedor-header-decoration"></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="proveedor-icon-container">
                  <i className="fa-solid fa-truck" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                </div>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '700' }}>
                    Lista de Proveedores
                  </h2>
                  <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                    Gestión integral de proveedores y servicios
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
            <div className="proveedor-stats-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-truck" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {proveedores.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Total Proveedores
                  </p>
                </div>
              </div>
            </div>

            <div className="proveedor-stats-card">
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
                    {proveedores.filter(p => p.activo !== false).length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Proveedores Activos
                  </p>
                </div>
              </div>
            </div>

            <div className="proveedor-stats-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-boxes" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {proveedores.reduce((sum, p) => sum + (p.productos?.length || 0), 0)}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Total Productos
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botón agregar */}
          <button 
            className="proveedor-add-btn" 
            onClick={() => { setProveedorEditando(null); setModalVisible(true); }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Nuevo Proveedor</span>
          </button>
          {/* Tabla principal con diseño moderno */}
          <div className="proveedor-table-modern">
            <div className="proveedor-table-wrapper">
              <table className="proveedor-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Proveedor</th>
                    <th>Contacto</th>
                    <th>Dirección</th>
                    <th>Empresa</th>
                    <th>Estado</th>
                    <th>Productos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((prov, index) => (
                    <tr key={prov._id}>
                      <td style={{ fontWeight: '500', color: '#6b7280' }}>
                        {index + 1 + (currentPage - 1) * itemsPerPage}
                      </td>
                      <td style={{ fontWeight: '600', color: '#1f2937' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            borderRadius: '8px',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '35px'
                          }}>
                            <i className="fa-solid fa-truck" style={{ color: 'white', fontSize: '12px' }}></i>
                          </div>
                          {prov.nombre}
                        </div>
                      </td>
                      <td>
                        <div className="proveedor-contact-info">
                          <div className="proveedor-contact-item">
                            <i className="fa-solid fa-phone" style={{ color: '#10b981' }}></i>
                            {prov.contacto?.telefono || 'N/A'}
                          </div>
                          <div className="proveedor-contact-item">
                            <i className="fa-solid fa-envelope" style={{ color: '#6366f1' }}></i>
                            {prov.contacto?.correo || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: '#6b7280' }}>
                        <div>
                          <div>{prov.direccion?.calle || 'N/A'}</div>
                          <div style={{ fontWeight: '600', color: '#374151', marginTop: '2px' }}>
                            {prov.direccion?.pais || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: '500', color: '#374151' }}>
                        {prov.empresa || 'N/A'}
                      </td>
                      <td>
                        <span className={`proveedor-status-badge ${prov.activo !== false ? 'proveedor-status-active' : ''}`}
                          style={{
                            background: prov.activo !== false ? 
                              'linear-gradient(135deg, #dcfce7, #bbf7d0)' : 
                              'linear-gradient(135deg, #fef2f2, #fecaca)',
                            color: prov.activo !== false ? '#059669' : '#dc2626'
                          }}
                        >
                          {prov.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="proveedor-action-btn"
                          onClick={() => { 
                            setProductosProveedor(prov.productos || []); 
                            setProveedorNombre(prov.nombre); 
                            setModalProductosVisible(true); 
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            fontSize: '11px'
                          }}
                        >
                          <i className="fa-solid fa-boxes icon-gap"></i>
                          <span>Ver ({prov.productos?.length || 0})</span>
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            className="proveedor-action-btn"
                            onClick={() => { setProveedorEditando(prov); setModalVisible(true); }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          
                          {prov.activo ? (
                            <button 
                              className="proveedor-action-btn danger"
                              onClick={() => toggleEstadoProveedor(prov._id, false)}
                            >
                              <i className="fa-solid fa-ban"></i>
                            </button>
                          ) : (
                            <button 
                              className="proveedor-action-btn"
                              onClick={() => toggleEstadoProveedor(prov._id, true)}
                              style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)'
                              }}
                            >
                              <i className="fa-solid fa-check"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td 
                        colSpan="8" 
                        style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#9ca3af',
                          fontStyle: 'italic',
                          fontSize: '16px'
                        }}
                      >
                        No hay proveedores disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} onClick={() => paginate(i + 1)} className={currentPage === i + 1 ? 'active-page' : ''}>
                {i + 1}
              </button>
            ))}
          </div>

          {modalVisible && <ProveedorModal proveedor={proveedorEditando} onClose={() => setModalVisible(false)} onSave={guardarProveedor} />}
          <ModalProductosProveedor visible={modalProductosVisible} onClose={() => setModalProductosVisible(false)} productos={productosProveedor} proveedor={proveedorNombre} />
        </div>

      </div>
      <div className="custom-footer">
        <p className="custom-footer-text">
          © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default GestionProveedores;
