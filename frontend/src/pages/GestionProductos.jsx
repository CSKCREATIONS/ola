import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavProductos from '../components/NavProductos';
import api from '../api/axiosConfig';

// API endpoint constants used in this page
const API_PRODUCTS = '/api/products';
const API_CATEGORIES = '/api/categories';
const API_SUBCATEGORIES = '/api/subcategories';

// CSS inyectado para diseño avanzado
const advancedStyles = `
  .productos-advanced-table {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #e5e7eb;
  }
  
  .productos-header-section {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    padding: 20px 25px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .productos-filters-section {
    background: linear-gradient(135deg, #f9fafb, #f3f4f6);
    padding: 25px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .productos-filter-select {
    width: 100%;
    max-width: 250px;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    transition: all 0.3s ease;
    background: white;
    cursor: pointer;
  }
  
  .productos-filter-select:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  .productos-table-container {
    overflow: auto;
  }
  
  .productos-advanced-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  
  .productos-advanced-table thead tr {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-bottom: 2px solid #e5e7eb;
  }
  
  .productos-advanced-table thead th {
    padding: 16px 12px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 13px;
    letter-spacing: 0.5px;
  }
  
  .productos-advanced-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }
  
  .productos-advanced-table tbody tr:hover {
    background-color: #f8fafc;
  }
  
  .productos-advanced-table tbody td {
    padding: 16px 12px;
    color: #4b5563;
    font-weight: 500;
  }
  
  .productos-action-btn {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    color: #1e40af;
    border: none;
    border-radius: 8px;
    padding: 8px 10px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(30, 64, 175, 0.2);
    margin-right: 6px;
  }
  
  .productos-action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(30, 64, 175, 0.3);
  }
  
  .productos-action-btn.delete {
    background: linear-gradient(135deg, #fee2e2, #fecaca);
    color: #dc2626;
    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
  }
  
  .productos-action-btn.delete:hover {
    box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
  }
  
  .productos-status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }
  
  .productos-status-badge.activo {
    background: #dcfce7;
    color: #16a34a;
  }
  
  .productos-status-badge.inactivo {
    background: #fee2e2;
    color: #dc2626;
  }
  
  .productos-category-badge {
    background: #fef3c7;
    color: #d97706;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }
  
  .productos-pagination-container {
    padding: 20px 25px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: center;
    gap: 8px;
  }
  
  .productos-pagination-btn {
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
  
  .productos-pagination-btn.active {
    border-color: #6366f1;
    background: #6366f1;
    color: white;
  }
  
  .productos-pagination-btn:hover:not(.active) {
    border-color: #6366f1;
    color: #6366f1;
  }
`;

// Inyectar estilos
if (!document.getElementById('productos-advanced-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'productos-advanced-styles';
  styleSheet.textContent = advancedStyles;
  document.head.appendChild(styleSheet);
}

const ProductoModal = ({
  producto,
  onClose,
  onSave,
  categorias = [],
  subcategorias = [],
  proveedores = []
}) => {

  const [form, setForm] = useState({
    name: producto?.name || '',
    description: producto?.description || '',
    price: producto?.price || '',
    stock: producto?.stock || '',
    category: producto?.category?._id || producto?.category || '',
    subcategory: producto?.subcategory?._id || producto?.subcategory || '',
    proveedor: producto?.proveedor?._id || producto?.proveedor || ''
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (Object.values(form).some(field => field === '')) {
      Swal.fire('Error', 'Todos los campos son obligatorios', 'warning');
      return;
    }
    onSave({ ...producto, ...form });
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
      backdropFilter: 'blur(4px)'
    }}>
      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        maxWidth: '800px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'modalSlideIn 0.3s ease-out',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header del modal */}
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: 'white',
          padding: '2rem',
          borderRadius: '20px 20px 0 0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fa-solid fa-box" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '1.5rem', 
                  fontWeight: '600'
                }}>
                  {producto ? 'Editar Producto' : 'Agregar Producto'}
                </h3>
                <p style={{ 
                  margin: '0.25rem 0 0 0', 
                  opacity: 0.9, 
                  fontSize: '0.95rem' 
                }}>
                  {producto ? 'Modifica la información del producto' : 'Complete los datos del nuevo producto'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1.5rem',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              &times;
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          backgroundColor: '#f8fafc'
        }}>
            {/* Información básica */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
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
                <i className="fa-solid fa-info-circle" style={{ color: '#f59e0b' }}></i>
                Información Básica
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-tag" style={{ color: '#3b82f6', fontSize: '0.9rem' }}></i>
                    Nombre del Producto
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    placeholder="Ingrese el nombre del producto"
                    required
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
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-dollar-sign" style={{ color: '#10b981', fontSize: '0.9rem' }}></i>
                    Precio
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="price" 
                    value={form.price} 
                    onChange={handleChange} 
                    placeholder="0.00"
                    required
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
                  />
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-align-left" style={{ color: '#8b5cf6', fontSize: '0.9rem' }}></i>
                    Descripción
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    name="description" 
                    value={form.description} 
                    onChange={handleChange} 
                    placeholder="Descripción detallada del producto"
                    required
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
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-warehouse" style={{ color: '#ef4444', fontSize: '0.9rem' }}></i>
                    Stock
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="number" 
                    name="stock" 
                    value={form.stock} 
                    onChange={handleChange} 
                    placeholder="0"
                    required
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
                  />
                </div>
              </div>
            </div>

            {/* Clasificación */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
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
                <i className="fa-solid fa-sitemap" style={{ color: '#10b981' }}></i>
                Clasificación y Proveedor
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-folder" style={{ color: '#3b82f6', fontSize: '0.9rem' }}></i>
                    Categoría
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select 
                    name="category" 
                    value={form.category} 
                    onChange={handleChange} 
                    required
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
                  >
                    <option value="">Seleccione Categoría</option>
                    {categorias.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-folder-open" style={{ color: '#8b5cf6', fontSize: '0.9rem' }}></i>
                    Subcategoría
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select 
                    name="subcategory" 
                    value={form.subcategory} 
                    onChange={handleChange} 
                    required
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
                  >
                    <option value="">Seleccione Subcategoría</option>
                    {subcategorias.map(sub => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name} {sub.category?.name ? `(${sub.category.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-truck" style={{ color: '#f59e0b', fontSize: '0.9rem' }}></i>
                    Proveedor
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select 
                    name="proveedor" 
                    value={form.proveedor} 
                    onChange={handleChange} 
                    required
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
                  >
                    <option value="">Seleccione Proveedor</option>
                    {Array.isArray(proveedores) && proveedores.map(prov => (
                      <option key={prov._id} value={prov._id}>
                        {prov.nombre} ({prov.empresa || 'Sin empresa'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            </div> {/* Fin del contenido scrolleable */}

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
                Cancelar
              </button>
              
              <button 
                type="submit"
                style={{
                  padding: '0.875rem 1.5rem',
                  border: 'none',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 12px -1px rgba(245, 158, 11, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(245, 158, 11, 0.3)';
                }}
              >
                <i className="fa-solid fa-save"></i>
                {producto ? 'Actualizar' : 'Guardar'} Producto
              </button>
            </div>
      </form>
    </div>
  );
};

const GestionProductos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  const productosFiltrados = productos.filter(prod => {
    if (filtroEstado === 'activos') return prod.activo;
    if (filtroEstado === 'inactivos') return !prod.activo;
    return true;
  });

  const totalPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const productosPaginados = productosFiltrados.slice(indiceInicio, indiceFin);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroEstado]);


  useEffect(() => {
    loadProductos();
    loadCategorias();
    loadSubcategorias();
  }, []);

useEffect(() => {
  const fetchProveedores = async () => {
    try {
      const res = await api.get('/api/proveedores/activos');
      const data = res.data || res;
      setProveedores(data.proveedores || data.data || []);
    } catch (error) {
      console.error('Error al cargar proveedores', error);
    }
  };

  fetchProveedores();
}, []);


  const loadProductos = async () => {
    try {
      const res = await api.get('/api/products');
      const result = res.data || res;
      const lista = result.products || result.data || result;
      const productosOrdenados = (Array.isArray(lista) ? lista : []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setProductos(productosOrdenados);
    } catch (err) {
      Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
    }
  };

  const handleSave = async (producto) => {
    const url = producto._id ? `${API_PRODUCTS}/${producto._id}` : API_PRODUCTS;
    const method = producto._id ? 'PUT' : 'POST';

    const dataToSend = {
      ...producto,
      proveedor: typeof producto.proveedor === 'object' ? producto.proveedor._id : producto.proveedor,
      category: typeof producto.category === 'object' ? producto.category._id : producto.category,
      subcategory: typeof producto.subcategory === 'object' ? producto.subcategory._id : producto.subcategory
    };

    try {
      const res = await api({ url, method, data: dataToSend });
      if (!(res.status >= 200 && res.status < 300)) throw new Error('Error al guardar el producto');
      Swal.fire('Éxito', 'Producto guardado correctamente', 'success');
      setModalVisible(false);
      loadProductos();
    } catch (err) {
      Swal.fire('Error', err.message || 'Error al guardar el producto', 'error');
    }
  };

  const handleEdit = producto => {
    setProductoEditando(producto);
    setModalVisible(true);
  };

  const handleToggleEstado = async (producto, estadoActual) => {
    const productoId = producto._id;
    const accion = estadoActual ? 'deactivate' : 'activate';
    const url = `${API_PRODUCTS}/${productoId}/${accion}`;

    try {
      // Si vamos a activar, validar subcategoria y categoria padre
      if (!estadoActual) { // estadoActual === false -> queremos activar
        const subcatId = producto.subcategory?._id || producto.subcategory;

        if (subcatId) {
          // Obtener subcategoria para comprobar su estado
          const subRes = await api.get(`/api/subcategories/${subcatId}`);
          const subData = subRes.data || subRes;
          const subcategoria = subData.data || subData;

          if (subcategoria && subcategoria.activo === false) {
            return Swal.fire('Acción no permitida', 'No se puede activar el producto porque su subcategoría está desactivada', 'error');
          }

          const parentCatId = subcategoria?.category?._id || subcategoria?.category;
          if (parentCatId) {
            const catRes = await api.get(`/api/categories/${parentCatId}`);
            const catData = catRes.data || catRes;
            const categoria = catData.data || catData;
            if (categoria && categoria.activo === false) {
              return Swal.fire('Acción no permitida', 'No se puede activar el producto porque la categoría padre está desactivada', 'error');
            }
          }
        }
      }


      const res = await api.put(url);
      if (res.status >= 200 && res.status < 300) {
        Swal.fire(`Producto ${accion === 'deactivate' ? 'desactivado' : 'activado'} correctamente`, '', 'success');
        loadProductos();
      } else {
        throw new Error(res.data?.message || `No se pudo ${accion} el producto`);
      }
    } catch (error) {
      Swal.fire('Error', error.message || 'Error inesperado', 'error');
    }
  };

  

  const loadCategorias = async () => {
    try {
      const res = await api.get('/api/categories');
      const result = res.data || res;
      const data = result.categories || result.data || result;
      setCategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading categories', err);
      setCategorias([]);
    }
  };

  const loadSubcategorias = async () => {
    try {
      const res = await api.get('/api/subcategories');
      const result = res.data || res;
      const data = result.subcategories || result.data || result;
      setSubcategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading subcategories', err);
      setSubcategorias([]);
    }
  };

  

 
  return (
    <div>
      <Fijo />
      <div className="content">
        <NavProductos />
        <div className="contenido-modulo">
          {/* Encabezado profesional */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '300px',
              height: '300px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              zIndex: 1
            }}></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <i className="fa-solid fa-boxes-stacked" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                  </div>
                  <div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '700' }}>
                      Gestión de Productos
                    </h2>
                    <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                      Administra el inventario y catálogo de productos
                    </p>
                  </div>
                </div>
                <div>
                  <button 
                    onClick={() => {
                      setProductoEditando(null);
                      setModalVisible(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                    }}
                  >
                    <i className="fa-solid fa-plus"></i>
                    Agregar Producto
                  </button>
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
            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
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
                  <i className="fa-solid fa-boxes-stacked" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {productos.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Total Productos
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
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
                  <i className="fa-solid fa-check-circle" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {productos.filter(p => p.activo).length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Productos Activos
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-exclamation-triangle" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {productos.filter(p => p.stock < 10).length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Stock Bajo
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
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
                  <i className="fa-solid fa-dollar-sign" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    ${productos.reduce((sum, p) => {
                      const price = Number.parseFloat(p.price) || 0;
                      const stock = Number.parseInt(p.stock) || 0;
                      return sum + (price * stock);
                    }, 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Valor Total del Inventario
                  </p>
                  <p style={{ margin: '5px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>
                    {productos.length} productos en inventario
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas adicionales del inventario */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* Valor promedio por producto */}
            <div style={{
              background: 'linear-gradient(135deg, #e0f2fe, #b3e5fc)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #81d4fa'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #0288d1, #0277bd)',
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-calculator" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.8rem', fontWeight: '700', color: '#1f2937' }}>
                    ${productos.length > 0 ? 
                      (productos.reduce((sum, p) => {
                        const price = Number.parseFloat(p.price) || 0;
                        const stock = Number.parseInt(p.stock) || 0;
                        return sum + (price * stock);
                      }, 0) / productos.length).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                      : '0'
                    }
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Valor Promedio por Producto
                  </p>
                </div>
              </div>
            </div>

            {/* Stock total */}
            <div style={{
              background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #c4b5fd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-boxes-stacked" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.8rem', fontWeight: '700', color: '#1f2937' }}>
                    {productos.reduce((sum, p) => sum + (Number.parseInt(p.stock) || 0), 0).toLocaleString()}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Unidades en Stock Total
                  </p>
                </div>
              </div>
            </div>

            {/* Productos con bajo stock */}
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #f59e0b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.8rem', fontWeight: '700', color: '#1f2937' }}>
                    {productos.filter(p => (Number.parseInt(p.stock) || 0) < 10).length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Productos con Bajo Stock
                  </p>
                  <p style={{ margin: '5px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>
                    Menos de 10 unidades
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
              <i className="fa-solid fa-filter" style={{ color: '#6366f1', fontSize: '1.2rem' }}></i>
              <h4 style={{ margin: 0, color: '#374151', fontSize: '1.1rem', fontWeight: '600' }}>
                Filtros de Productos
              </h4>
            </div>
            
            <div style={{ position: 'relative', maxWidth: '300px' }}>
              <label htmlFor="input-gestion-prod-1" style={{
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
                Estado del Producto
              </label>
              <select id="input-gestion-prod-1"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  background: 'white',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="todos">Todos los estados</option>
                <option value="activos">Productos Activos</option>
                <option value="inactivos">Productos Inactivos</option>
              </select>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Categoría</th>
                  <th>Subcategoría</th>
                  <th>Proveedor</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosPaginados.map(prod => (
                  <tr key={prod._id}>
                    <td>{prod.name}</td>
                    <td>{prod.description}</td>
                    <td>{prod.price}</td>
                    <td>{prod.stock}</td>
                    <td>{prod.category?.name || '-'}</td>
                    <td>{prod.subcategory?.name || '-'}</td>
                    <td>{prod.proveedor?.nombre || '-'}</td>
                    <td>
                      <label className="switch me-1">
                          <input
                            type="checkbox"
                            checked={!!prod.activo}
                            onChange={async () => {
                              // If we're trying to activate the product, first validate that
                              // its subcategory and parent category are active. If not, show
                              // an informative Swal and don't even ask for confirmation.
                              const tryingToActivate = !prod.activo;

                              if (tryingToActivate) {
                                const subcatId = prod.subcategory?._id || prod.subcategory;
                                if (subcatId) {
                                  try {
                                    const subRes = await api.get(`/api/subcategories/${subcatId}`);
                                    if (!(subRes.status >= 200 && subRes.status < 300)) {
                                      const err = subRes.data || {};
                                      return Swal.fire('Error', err.message || 'No se pudo verificar la subcategoría', 'error');
                                    }
                                    const subcategoria = subRes.data || subRes;

                                    if (subcategoria && subcategoria.activo === false) {
                                      return Swal.fire('Acción no permitida', 'No se puede activar el producto porque su subcategoría está desactivada', 'error');
                                    }

                                    const parentCatId = subcategoria?.category?._id || subcategoria?.category;
                                    if (parentCatId) {
                                      const catRes = await api.get(`/api/categories/${parentCatId}`);
                                      if (!(catRes.status >= 200 && catRes.status < 300)) {
                                        const err = catRes.data || {};
                                        return Swal.fire('Error', err.message || 'No se pudo verificar la categoría padre', 'error');
                                      }
                                      const categoria = catRes.data || catRes;
                                      if (categoria && categoria.activo === false) {
                                        return Swal.fire('Acción no permitida', 'No se puede activar el producto porque la categoría padre está desactivada', 'error');
                                      }
                                    }
                                  } catch (err) {
                                    return Swal.fire('Error', 'Error verificando subcategoría/categoría', 'error');
                                  }
                                }
                              }

                              // If we reach here, either we're deactivating (no pre-check needed)
                              // or the pre-checks for activation passed — now ask for confirmation.
                              const accion = prod.activo ? 'desactivar' : 'activar';
                              const confirmResult = await Swal.fire({
                                title: `¿Estás seguro?`,
                                text: `¿Deseas ${accion} el producto "${prod.name}"?`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Sí',
                                cancelButtonText: 'Cancelar'
                              });

                              if (confirmResult.isConfirmed) {
                                // Proceed with existing flow (this will reload products on success)
                                handleToggleEstado(prod, prod.activo);
                              }
                            }}
                          />
                          <span className="slider"></span>
                        </label>
                    </td>
                    <td>
                      <button className="btnTransparente" onClick={() => handleEdit(prod)}>
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                        
                      
                    </td>
                  </tr>
                ))}
                {productos.length === 0 && <tr><td colSpan="9">No hay productos disponibles</td></tr>}
              </tbody>

            </table>
          </div>
          {modalVisible && (
            <ProductoModal
              producto={productoEditando}
              onClose={() => setModalVisible(false)}
              onSave={handleSave}
              categorias={categorias || []}
              subcategorias={subcategorias || []}
              proveedores={proveedores || []}
                        />
          )}
          <div className="pagination">
            {Array.from({ length: totalPaginas }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => cambiarPagina(i + 1)}
                className={paginaActual === i + 1 ? 'active-page' : ''}
              >
                {i + 1}
              </button>
            ))}
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
};

export default GestionProductos;
