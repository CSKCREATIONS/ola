import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import '../App.css';
import Fijo from '../components/Fijo';
import NavProductos from '../components/NavProductos';

const API_URL = '/api/subcategories';
const CATEGORY_API_URL = '/api/categories';

/* Estilos CSS avanzados para Subcategorías */
const subcategoriasStyles = `
  <style>
    .subcategoria-advanced-container {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .subcategoria-stats-card {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-radius: 16px;
      padding: 25px;
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .subcategoria-stats-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }

    .subcategoria-stats-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
    }

    .subcategoria-professional-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      color: white;
      position: relative;
      overflow: hidden;
    }

    .subcategoria-header-decoration {
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      z-index: 1;
    }

    .subcategoria-icon-container {
      background: rgba(255,255,255,0.2);
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(10px);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .subcategoria-table-modern {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-radius: 20px;
      padding: 30px;
      border: 1px solid #e5e7eb;
      backdrop-filter: blur(10px);
    }

    .subcategoria-table-wrapper {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .subcategoria-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 12px;
      overflow: hidden;
    }

    .subcategoria-table thead tr {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
    }

    .subcategoria-table th {
      padding: 20px 15px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .subcategoria-table tbody tr {
      border-bottom: 1px solid #f3f4f6;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .subcategoria-table tbody tr:hover {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      transform: scale(1.01);
    }

    .subcategoria-table td {
      padding: 20px 15px;
      font-size: 14px;
      color: #374151;
    }

    .subcategoria-action-btn {
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

    .subcategoria-action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(99, 102, 241, 0.4);
    }

    .subcategoria-action-btn.danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    .subcategoria-action-btn.danger:hover {
      box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4);
    }

    .subcategoria-add-btn {
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

    .subcategoria-add-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }

    .subcategoria-category-badge {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #d97706;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
  </style>
`;

if (typeof document !== 'undefined') {
  const existingStyles = document.getElementById('subcategoria-advanced-styles');
  if (!existingStyles) {
    const styleElement = document.createElement('div');
    styleElement.id = 'subcategoria-advanced-styles';
    styleElement.innerHTML = subcategoriasStyles;
    document.head.appendChild(styleElement);
  }
}

const SubcategoriaModal = ({ subcategoria, categorias, onClose, onSave }) => {
  const [name, setName] = useState(subcategoria?.name || '');
  const [description, setDescription] = useState(subcategoria?.description || '');
  const [categoryId, setCategoryId] = useState(subcategoria?.category?._id || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !description || !categoryId) {
      Swal.fire('Error', 'Todos los campos son obligatorios', 'warning');
      return;
    }
    onSave({ id: subcategoria?._id, name, description, categoryId });
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
        maxWidth: '650px',
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
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
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
              <i className="fa-solid fa-layer-group" style={{ fontSize: '1.5rem' }}></i>
            </div>
            {subcategoria ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
          </h3>
          <p style={{ 
            margin: '0.5rem 0 0 4rem', 
            opacity: 0.9, 
            fontSize: '0.95rem' 
          }}>
            {subcategoria ? 'Modifica la información de la subcategoría' : 'Crea una nueva subcategoría para organizar productos'}
          </p>
        </div>

        {/* Contenido scrolleable */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: '2.5rem',
          backgroundColor: '#f8fafc'
        }}>
          {/* Nombre */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #8b5cf6'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              fontWeight: '600',
              color: '#374151',
              fontSize: '1.1rem'
            }}>
              <i className="fa-solid fa-tag" style={{ color: '#8b5cf6', fontSize: '1rem' }}></i>
              Nombre de la Subcategoría
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Smartphones, Laptops, Camisetas..."
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
                e.target.style.borderColor = '#8b5cf6';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          {/* Categoría */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #f59e0b'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              fontWeight: '600',
              color: '#374151',
              fontSize: '1.1rem'
            }}>
              <i className="fa-solid fa-tags" style={{ color: '#f59e0b', fontSize: '1rem' }}></i>
              Categoría Principal
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                backgroundColor: '#ffffff',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                cursor: 'pointer'
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
            >
              <option value="">Seleccione una categoría principal</option>
              {categorias.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #10b981'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              fontWeight: '600',
              color: '#374151',
              fontSize: '1.1rem'
            }}>
              <i className="fa-solid fa-align-left" style={{ color: '#10b981', fontSize: '1rem' }}></i>
              Descripción
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe brevemente esta subcategoría..."
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
            Cancelar
          </button>
          
          <button 
            type="submit"
            style={{
              padding: '0.875rem 1.5rem',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 12px -1px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px -1px rgba(139, 92, 246, 0.3)';
            }}
          >
            <i className="fa-solid fa-layer-group"></i>
            {subcategoria ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

const GestionSubcategorias = () => {
  const [subcategorias, setSubcategorias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [subcategoriaEditando, setSubcategoriaEditando] = useState(null);

  // 🔹 Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Cambia este valor para mostrar más/menos filas

  useEffect(() => {
    loadSubcategorias();
    loadCategorias();
  }, []);

  const loadSubcategorias = async () => {
    try {
      const res = await api.get(API_URL);
      const result = res.data;
      const data = result.subcategories || result.data || result || [];
      setSubcategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      Swal.fire('Error', 'No se pudieron cargar las subcategorías', 'error');
    }
  };

  const loadCategorias = async () => {
    try {
      const res = await api.get(CATEGORY_API_URL);
      const result = res.data;
      const data = result.categories || result.data || result || [];
      const activas = Array.isArray(data) ? data.filter(cat => cat.activo) : [];
      setCategorias(activas);
    } catch (err) {
      Swal.fire('Error', 'No se pudieron cargar las categorías', 'error');
    }
  };

  const handleSave = async ({ id, name, description, categoryId }) => {
    const url = id ? `${API_URL}/${id}` : API_URL;
    const method = id ? 'PUT' : 'POST';

    try {
      let res;
      if (method === 'POST') res = await api.post(API_URL, { name, description, category: categoryId });
      else res = await api.put(url.replace(API_URL, '/api/subcategories'), { name, description, category: categoryId });

      const ok = res.status >= 200 && res.status < 300;
      if (!ok) throw new Error('Error al guardar');
      Swal.fire('Éxito', id ? 'Subcategoría actualizada' : 'Subcategoría creada', 'success');
      setModalVisible(false);
      loadSubcategorias();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleEdit = (subcat) => {
    setSubcategoriaEditando(subcat);
    setModalVisible(true);
  };

  const toggleEstadoSubcategoria = async (id, activar = false) => {
    const confirm = await Swal.fire({
      title: activar ? '¿Activar subcategoría?' : '¿Desactivar subcategoría?',
      text: activar
        ? 'Esto hará que vuelva a estar disponible. Deberás activar manualmente sus productos si lo deseas.'
        : 'Esto también deshabilitará sus productos asociados.',
      icon: activar ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: activar ? 'Sí, activar' : 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await api.patch(`${API_URL}/${id}/${activar ? 'activate' : 'deactivate'}`);
      const data = res.data;
      if (res.status < 200 || res.status >= 300) {
        if (res.status === 400 && data && data.message) {
          await Swal.fire('Acción no permitida', data.message, 'error');
          return;
        }
        throw new Error(data?.message || 'Error al cambiar estado de la subcategoría');
      }

      Swal.fire(
        activar ? 'Subcategoría activada' : 'Subcategoría desactivada',
        '',
        'success'
      );

      await loadSubcategorias();
    } catch (error) {
      console.error('Error al cambiar estado de subcategoría:', error);
      Swal.fire('Error', error.message, 'error');
    }
  };

  // Nueva función: verifica el estado de la categoría padre antes de intentar activar la subcategoría
  const handleToggleWithParentCheck = async (subcatId, wantToActivate) => {
    try {
      // Obtener la subcategoría para conocer su categoría padre
      const subRes = await api.get(`${API_URL}/${subcatId}`);
      const subData = subRes.data;
      const parentCategoryId = subData?.data?.category?._id || subData?.category?._id || subData?.data?.category;

      if (wantToActivate && parentCategoryId) {
        // Consultar la categoría padre
        const catRes = await api.get(`${CATEGORY_API_URL}/${parentCategoryId}`);
        const catData = catRes.data;

        const categoria = catData?.data || catData;
        if (catRes.ok && categoria && categoria.activo === false) {
          // Mostrar mensaje del backend o personalizado
          return Swal.fire('Acción no permitida', 'No se puede activar la subcategoría porque la categoría padre está desactivada', 'error');
        }
      }

      // Si pasa las comprobaciones, ejecutar la función original
      await toggleEstadoSubcategoria(subcatId, wantToActivate);
    } catch (error) {
      console.error('Error al verificar categoría padre:', error);
      Swal.fire('Error', 'No se pudo verificar la categoría padre', 'error');
    }
  };

  // 🔹 Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = subcategorias.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(subcategorias.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavProductos />
        <div className="contenido-modulo">
          {/* Encabezado profesional */}
          <div className="subcategoria-professional-header">
            <div className="subcategoria-header-decoration"></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="subcategoria-icon-container">
                  <i className="fa-solid fa-sitemap" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                </div>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '700' }}>
                    Subcategorías
                  </h2>
                  <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                    Aquí podrá gestionar todas las subcategorías de productos
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
            <div className="subcategoria-stats-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-sitemap" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {subcategorias.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Total Subcategorías
                  </p>
                </div>
              </div>
            </div>

            <div className="subcategoria-stats-card">
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
                    {subcategorias.filter(s => s.activo !== false).length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Subcategorías Activas
                  </p>
                </div>
              </div>
            </div>

            <div className="subcategoria-stats-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-tags" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {categorias.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Categorías Disponibles
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botón agregar */}
          <button 
            className="subcategoria-add-btn" 
            onClick={() => { setSubcategoriaEditando(null); setModalVisible(true); }}
          >
            <i className="fa-solid fa-plus"></i>
            Nueva Subcategoría
          </button>
          {/* Tabla principal con diseño moderno */}
          <div className="subcategoria-table-modern">
            <div className="subcategoria-table-wrapper">
              <table className="subcategoria-table">
                <thead>
                  <tr>
                    <th>Subcategoría</th>
                    <th>Descripción</th>
                    <th>Categoría Padre</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((subcat) => (
                    <tr key={subcat._id}>
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
                            <i className="fa-solid fa-sitemap" style={{ color: 'white', fontSize: '12px' }}></i>
                          </div>
                          {subcat.name}
                        </div>
                      </td>
                      <td style={{ color: '#6b7280', fontSize: '14px' }}>
                        {subcat.description}
                      </td>
                      <td>
                        <span className="subcategoria-category-badge">
                          <i className="fa-solid fa-tag"></i>
                          {subcat.category?.name || 'Sin categoría'}
                        </span>
                      </td>
                      <td>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={!!subcat.activo}
                            onChange={(e) => handleToggleWithParentCheck(subcat._id, e.target.checked)}
                          />
                          <span className="slider"></span>
                        </label>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            className="subcategoria-action-btn"
                            onClick={() => handleEdit(subcat)}
                            title="Editar"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {subcategorias.length === 0 && (
                    <tr>
                      <td 
                        colSpan="5" 
                        style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#9ca3af',
                          fontStyle: 'italic',
                          fontSize: '16px'
                        }}
                      >
                        No hay subcategorías disponibles
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
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={currentPage === i + 1 ? 'active-page' : ''}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {modalVisible && (
            <SubcategoriaModal
              subcategoria={subcategoriaEditando}
              categorias={categorias}
              onClose={() => setModalVisible(false)}
              onSave={handleSave}
            />
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
};

export default GestionSubcategorias;