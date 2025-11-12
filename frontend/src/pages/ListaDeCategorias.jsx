import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavProductos from '../components/NavProductos'
import api from '../api/axiosConfig';

// Base endpoint used in this page
const API_URL = '/api/categories';

/* Estilos CSS avanzados para Categorías */
const categoriasStyles = `
  <style>
    .categoria-advanced-container {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .categoria-stats-card {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-radius: 16px;
      padding: 25px;
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .categoria-stats-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }

    .categoria-stats-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
    }

    .categoria-professional-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      color: white;
      position: relative;
      overflow: hidden;
    }

    .categoria-header-decoration {
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      z-index: 1;
    }

    .categoria-icon-container {
      background: rgba(255,255,255,0.2);
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(10px);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .categoria-table-modern {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-radius: 20px;
      padding: 30px;
      border: 1px solid #e5e7eb;
      backdrop-filter: blur(10px);
    }

    .categoria-table-wrapper {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .categoria-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 12px;
      overflow: hidden;
    }

    .categoria-table thead tr {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
    }

    .categoria-table th {
      padding: 20px 15px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .categoria-table tbody tr {
      border-bottom: 1px solid #f3f4f6;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .categoria-table tbody tr:hover {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      transform: scale(1.01);
    }

    .categoria-table td {
      padding: 20px 15px;
      font-size: 14px;
      color: #374151;
    }

    .categoria-action-btn {
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

    .categoria-action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(99, 102, 241, 0.4);
    }

    .categoria-action-btn.danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    .categoria-action-btn.danger:hover {
      box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4);
    }

    .categoria-add-btn {
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

    .categoria-add-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }

    .categoria-badge {
      background: linear-gradient(135deg, #ddd6fe, #e0e7ff);
      color: #6366f1;
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
  const existingStyles = document.getElementById('categoria-advanced-styles');
  if (!existingStyles) {
    const styleElement = document.createElement('div');
    styleElement.id = 'categoria-advanced-styles';
    styleElement.innerHTML = categoriasStyles;
    document.head.appendChild(styleElement);
  }
}

import PropTypes from 'prop-types';

const CategoriaModal = ({ categoria, onClose, onSave }) => {
  const [name, setName] = useState(categoria ? categoria.name : '');
  const [description, setDescription] = useState(categoria ? categoria.description : '');

  console.log('🔍 CategoriaModal - categoria recibida:', categoria);
  console.log('🔍 CategoriaModal - categoria._id:', categoria?._id);

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      Swal.fire('Error', 'Todos los campos son obligatorios', 'warning');
      return;
    }

    try {
      const resCheck = await api.get('/api/categories');
      const resultCheck = resCheck.data || resCheck;
      const categories = resultCheck.categories || resultCheck.data || resultCheck;

      const nombreRepetido = categories.some(cat =>
        cat.name.toLowerCase() === name.toLowerCase() &&
        cat._id !== categoria?._id
      );

      if (nombreRepetido) {
        Swal.fire('Error', 'Ya existe una categoría con ese nombre', 'error');
        return;
      }

      onSave({ id: categoria?._id, name, description });
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
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
        maxWidth: '600px',
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
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
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
              <i className="fa-solid fa-tags" style={{ fontSize: '1.5rem' }}></i>
            </div>
            {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
          <p style={{
            margin: '0.5rem 0 0 4rem',
            opacity: 0.9,
            fontSize: '0.95rem'
          }}>
            {categoria ? 'Modifica la información de la categoría' : 'Crea una nueva categoría para organizar productos'}
          </p>
        </div>

        {/* Contenido scrolleable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2.5rem',
          backgroundColor: '#f8fafc'
        }}>
          {/* Nombre de la categoría */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #f59e0b'
          }}>
            <label htmlFor="nombre-categoria-agregar" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              fontWeight: '600',
              color: '#374151',
              fontSize: '1.1rem'
            }}>
              <i className="fa-solid fa-tag" style={{ color: '#f59e0b', fontSize: '1rem' }}></i>
              Nombre de la Categoría
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="nombre-categoria-agregar"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Electrónicos, Ropa, Hogar..."
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

          {/* Descripción */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #10b981'
          }}>
            <label htmlFor="descripcion-categoria-agregar" style={{
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
            <textarea
              id="descripcion-categoria-agregar"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe brevemente esta categoría y qué tipo de productos incluye..."
              rows="4"
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
                resize: 'vertical',
                minHeight: '120px'
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
            <i className="fa-solid fa-tags"></i>
            {categoria ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
};
  // PropTypes for CategoriaModal
  CategoriaModal.propTypes = {
    categoria: PropTypes.shape({
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      description: PropTypes.string,
      activo: PropTypes.bool
    }),
    onClose: PropTypes.func,
    onSave: PropTypes.func.isRequired
  };

  CategoriaModal.defaultProps = {
    categoria: null,
    onClose: () => {}
  };

const ListaDeCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategorias = categorias.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(categorias.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.get('/api/categories');
      const result = res.data || res;
      const categoriesData = result.categories || result.data || result;
      const categoriasOrdenadas = (Array.isArray(categoriesData) ? categoriesData : []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCategorias(categoriasOrdenadas);
    } catch (err) {
      console.error('Error loading categories:', err);
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleSave = async (categoriaData) => {
    try {
      console.log('📝 handleSave - categoriaData:', categoriaData);
      const method = categoriaData.id ? 'PUT' : 'POST';
      const url = categoriaData.id ? `${API_URL}/${categoriaData.id}` : API_URL;

      console.log('📝 Method:', method, 'URL:', url);

      const res = await api({
        url,
        method,
        data: { name: categoriaData.name, description: categoriaData.description }
      });

      console.log('✅ Respuesta del servidor:', res.data);

      Swal.fire('Éxito', `Categoría ${categoriaData.id ? 'actualizada' : 'creada'} correctamente`, 'success');
      setModalVisible(false);
      setCategoriaEditando(null);
      loadCategories();
    } catch (err) {
      console.error('❌ Error en handleSave:', err);
      Swal.fire('Error', err.message, 'error');
    }
  };

  const deleteCategory = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la categoría y todas sus subcategorías',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await api.delete(`/api/categories/${id}`);
      if (!(res.status >= 200 && res.status < 300)) throw new Error('No se pudo eliminar la categoría');
      Swal.fire('Eliminado', 'Categoría eliminada correctamente', 'success');
      loadCategories();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const toggleEstadoCategoria = async (id, activar = false) => {
    const confirm = await Swal.fire({
      title: activar ? '¿Activar categoría?' : '¿Desactivar categoría?',
      text: activar ? 'Estará nuevamente disponible. Deberás activar sus subcategorías y productos manualmente si así lo deseas.' : 'Sus subcategorías y productos también serán desactivados. Podrás volver a activarla más adelante.',
      icon: activar ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: activar ? 'Sí, activar' : 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await api.put(`/api/categories/${id}`, { activo: activar });
      if (!(res.status >= 200 && res.status < 300)) throw new Error('No se pudo actualizar el estado');

      Swal.fire(
        activar ? 'Activada' : 'Desactivada',
        `Categoría ${activar ? 'activada' : 'desactivada'} correctamente`,
        'success'
      );

      loadCategories();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleEdit = (categoria) => {
    setCategoriaEditando(categoria);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setCategoriaEditando(null);
  };

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavProductos />
        <div className="contenido-modulo">
          {/* Encabezado profesional */}
          <div className="categoria-professional-header">
            <div className="categoria-header-decoration"></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="categoria-icon-container">
                  <i className="fa-solid fa-tags" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                </div>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '700' }}>
                    Categorías
                  </h2>
                  <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                    Aquí podrá gestionar todas las categorías de productos
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
            <div className="categoria-stats-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
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
                    Total Categorías
                  </p>
                </div>
              </div>
            </div>

            <div className="categoria-stats-card">
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
                    {categorias.filter(c => c.activo !== false).length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Categorías Activas
                  </p>
                </div>
              </div>
            </div>

            <div className="categoria-stats-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-pause-circle" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {categorias.filter(c => c.activo === false).length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Categorías Inactivas
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botón agregar */}
          <button
            className="categoria-add-btn"
            onClick={() => { setCategoriaEditando(null); setModalVisible(true); }}
          >
            <i className="fa-solid fa-plus"></i>
            Nueva Categoría
          </button>

          {/* Tabla principal con diseño moderno */}
          <div className="categoria-table-modern">
            <div className="categoria-table-wrapper">
              <table className="categoria-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#9ca3af',
                          fontStyle: 'italic',
                          fontSize: '16px'
                        }}
                      >
                        No hay categorías disponibles
                      </td>
                    </tr>
                  ) : (
                    currentCategorias.map((cat, index) => (
                      <tr key={cat._id}>
                        <td >
                          {indexOfFirstItem + index + 1}
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
                              <i className="fa-solid fa-tag" style={{ color: 'white', fontSize: '12px' }}></i>
                            </div>
                            {cat.name}
                          </div>
                        </td>
                        <td style={{ color: '#6b7280', fontSize: '14px' }}>
                          {cat.description}
                        </td>
                        <td>
                          <label className="switch">
                            <input
                                type="checkbox"
                                checked={!!cat.activo}
                                aria-label={`Estado de la categoría ${cat.name || cat._id}`}
                                onChange={(e) => toggleEstadoCategoria(cat._id, e.target.checked)}
                              />
                            <span className="slider"></span>
                          </label>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              className="categoria-action-btn"
                              onClick={() => handleEdit(cat)}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>


          </div>
          {/* Paginación de la tabla*/}
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

        {modalVisible && (
          <CategoriaModal
            categoria={categoriaEditando}
            onClose={handleCloseModal}
            onSave={handleSave}
          />
        )}

      </div>
      <div className="custom-footer">
        <p className="custom-footer-text">
          © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default ListaDeCategorias;