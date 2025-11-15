import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavProductos from '../components/NavProductos';
import SharedListHeaderCard from '../components/SharedListHeaderCard';
import api from '../api/axiosConfig';
import { calcularInventario } from '../utils/calculations';

// API endpoint constants used in this page
const API_PRODUCTS = '/api/products';

// CSS inyectado para diseño avanzado
const advancedStyles = `
  .productos-advanced-table {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }

  .productos-action-btn {
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

// Styles will be injected when the component mounts

const ProductoModal = ({
  producto,
  onClose,
  onSave,
  categorias = [],
  subcategorias = [],
  proveedores = [],
  onToggleEstado
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
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (Object.values(form).includes('')) {
      Swal.fire('Error', 'Todos los campos son obligatorios', 'warning');
      return;
    }
    onSave(producto ? { ...producto, ...form } : form);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          {/* Encabezado del modal */}
          <div style={{
            padding: '2rem 2.5rem',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius: '20px 20px 0 0',
            color: 'white',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '1.8rem',
              fontWeight: '700'
            }}>
              {producto ? 'Editar Producto' : 'Agregar Producto'}
            </h3>
            <button
              type="button"
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

          {/* Contenido scrolleable */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem 2.5rem'
          }}>
            {/* Información Básica */}
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
                <i className="fa-solid fa-info-circle" style={{ color: '#f59e0b' }} aria-hidden={true}></i>
                <span>Información Básica</span>
              </h4>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label htmlFor="input-producto-nombre" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-tag" style={{ color: '#3b82f6', fontSize: '0.9rem' }} aria-hidden={true}></i>
                    <span>Nombre del Producto</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="input-producto-nombre"
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
                  <label htmlFor="input-producto-precio" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-dollar-sign" style={{ color: '#10b981', fontSize: '0.9rem' }} aria-hidden={true}></i>
                    <span>Precio</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="input-producto-precio"
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
                  <label htmlFor="input-producto-descripcion" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-align-left" style={{ color: '#8b5cf6', fontSize: '0.9rem' }} aria-hidden={true}></i>
                    <span>Descripción</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="input-producto-descripcion"
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
                  <label htmlFor="input-producto-stock" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-warehouse" style={{ color: '#ef4444', fontSize: '0.9rem' }} aria-hidden={true}></i>
                    <span>Stock</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="input-producto-stock"
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
                <i className="fa-solid fa-sitemap" style={{ color: '#10b981' }} aria-hidden={true}></i>
                <span>Clasificación y Proveedor</span>
              </h4>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem'
              }}>
                <div>
                  <label htmlFor="input-producto-categoria" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-folder" style={{ color: '#3b82f6', fontSize: '0.9rem' }} aria-hidden={true}></i>
                    <span>Categoría</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="input-producto-categoria"
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
                  <label htmlFor="input-producto-subcategoria" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-folder-open" style={{ color: '#8b5cf6', fontSize: '0.9rem' }} aria-hidden={true}></i>
                    <span>Subcategoría</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="input-producto-subcategoria"
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
                  <label htmlFor="input-producto-proveedor" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-truck" style={{ color: '#f59e0b', fontSize: '0.9rem' }} aria-hidden={true}></i>
                    <span>Proveedor</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="input-producto-proveedor"
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
              <i className="fa-solid fa-times" aria-hidden={true}></i>
              <span>Cancelar</span>
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
              <i className="fa-solid fa-save" aria-hidden={true}></i>
              <span>{producto ? 'Actualizar' : 'Guardar'} Producto</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// PropTypes for ProductoModal (moved outside to avoid redefining on each render)
ProductoModal.propTypes = {
  producto: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    description: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    stock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    category: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    subcategory: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    proveedor: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
  }),
  onClose: PropTypes.func,
  onSave: PropTypes.func.isRequired,
  categorias: PropTypes.array,
  subcategorias: PropTypes.array,
  proveedores: PropTypes.array,
  onToggleEstado: PropTypes.func
};

ProductoModal.defaultProps = {
  producto: null,
  onClose: () => {},
  categorias: [],
  subcategorias: [],
  proveedores: [],
  onToggleEstado: () => {}
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
    
    // Inject styles at mount time (avoids module-level DOM access)
    if (typeof document !== 'undefined') {
      const existing = document.getElementById('productos-advanced-styles');
      if (!existing) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'productos-advanced-styles';
        styleSheet.textContent = advancedStyles;
        document.head.appendChild(styleSheet);
      }
    }

    return () => {
      try {
        const el = document.getElementById('productos-advanced-styles');
        if (el) el.remove();
      } catch (e) {
        console.warn('Failed to remove productos-advanced-styles element:', e);
      }
    };
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
      console.error('Error loading products', err);
      Swal.fire('Error', `No se pudieron cargar los productos: ${err?.message || err}`, 'error');
      setProductos([]);
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

          if (subcategoria?.activo === false) {
            return Swal.fire('Acción no permitida', 'No se puede activar el producto porque su subcategoría está desactivada', 'error');
          }


        }
      }


      // Backend define PATCH para activar/desactivar productos
      const res = await api.patch(url);
      if (res.status >= 200 && res.status < 300) {
        Swal.fire(`Producto ${accion === 'deactivate' ? 'desactivado' : 'activado'}`, '', 'success');
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
    <>
      <Fijo />
      <div className="content">
        <NavProductos />
        <div className="contenido-modulo">
          <SharedListHeaderCard
            title="Gestión de Productos"
            subtitle="Administra el inventario y catálogo de productos"
            iconClass="fa-solid fa-boxes-stacked"
          >
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
            >
              <i className="fa-solid fa-plus" aria-hidden={true}></i>
              <span>Agregar Producto</span>
            </button>
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
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
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
                  <i className="fa-solid fa-dollar-sign" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    ${calcularInventario(productos).totalValue.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
                    ${productos.length > 0 ? calcularInventario(productos).avgValuePerProduct.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
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
                    {calcularInventario(productos).totalStock.toLocaleString()}
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
                      <label className="switch">
                          <input
                            type="checkbox"
                            checked={!!prod.activo}
                            aria-label={`Estado del producto ${prod.name || prod._id}`}
                            onChange={() => handleToggleEstado(prod, prod.activo)}
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
              onToggleEstado={handleToggleEstado}
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


        <div className="custom-footer">
          <p className="custom-footer-text">
            © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </>
  );
}

export default GestionProductos;
