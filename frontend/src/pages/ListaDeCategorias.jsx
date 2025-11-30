import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../App.css';
import SharedListHeaderCard from '../components/SharedListHeaderCard';
import Fijo from '../components/Fijo';
import NavProductos from '../components/NavProductos'
import AdvancedStats from '../components/AdvancedStats';
import api from '../api/axiosConfig';
import PropTypes from 'prop-types';

// Base endpoint used in this page
const API_URL = '/api/categories';

const CategoriaModal = ({ categoria, onClose, onSave }) => {
  const [name, setName] = useState(categoria ? categoria.name : '');
  const [description, setDescription] = useState(categoria ? categoria.description : '');

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
              <i className="fa-solid fa-tags" style={{ fontSize: '1.5rem' }} aria-hidden={true}></i>
            </div>
            <span>{categoria ? 'Editar Categoría' : 'Nueva Categoría'}</span>
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
              <i className="fa-solid fa-tag" style={{ color: '#f59e0b', fontSize: '1rem' }} aria-hidden={true}></i>
              <span>Nombre de la Categoría</span>
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
              <i className="fa-solid fa-align-left" style={{ color: '#10b981', fontSize: '1rem' }} aria-hidden={true}></i>
              <span>Descripción</span>
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
  onClose: () => { }
};

const ListaDeCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const statsCards = [
    { iconClass: 'fa-solid fa-tags', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', value: categorias.length, label: 'Total Categorías' },
    { iconClass: 'fa-solid fa-check-circle', gradient: 'linear-gradient(135deg, #10b981, #059669)', value: categorias.filter(c => c.activo !== false).length, label: 'Categorías Activas' },
    { iconClass: 'fa-solid fa-pause-circle', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', value: categorias.filter(c => c.activo === false).length, label: 'Categorías Inactivas' }
  ];
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
      const method = categoriaData.id ? 'PUT' : 'POST';
      const url = categoriaData.id ? `${API_URL}/${categoriaData.id}` : API_URL;

      await api({
        url,
        method,
        data: { name: categoriaData.name, description: categoriaData.description }
      });

      Swal.fire('Éxito', `Categoría ${categoriaData.id ? 'actualizada' : 'creada'} correctamente`, 'success');
      setModalVisible(false);
      setCategoriaEditando(null);
      loadCategories();
    } catch (err) {
      console.error('❌ Error en handleSave:', err);
      Swal.fire('Error', err.message, 'error');
    }
  };

  const toggleEstadoCategoria = async (id, activar = false) => {
    const confirm = await Swal.fire({
      title: activar ? '¿Activar categoría?' : '¿Desactivar categoría?',
      text: activar ? 'Estará nuevamente disponible. Deberás activar sus productos manualmente si así lo deseas.' : 'Sus productos también serán desactivados. Podrás volver a activarla más adelante.',
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
        <div className="max-width">
          <div className="contenido-modulo">
            <SharedListHeaderCard
              title="Gestión de Categorías"
              subtitle="Administra el catálogo de categorías de productos"
              iconClass="fa-solid fa-tags"
            >
              <div className="export-buttons">
                <button
                  onClick={() => {
                    setCategoriaEditando(null); 
                    setModalVisible(true);
                  }}
                  className="export-btn create"
                >
                  <i className="fa-solid fa-plus"></i><span>Agregar Categoría</span>
                </button>
              </div>
            </SharedListHeaderCard>

            {/* Estadísticas avanzadas */}
            <AdvancedStats cards={statsCards} />

            {/* Tabla de categorías */}
            <div className="table-container">
              <div className="table-header">
                <div className="table-header-content">
                  <div className="table-header-icon">
                    <i className="fa-solid fa-table" style={{ color: 'white', fontSize: '16px' }}></i>
                  </div>
                  <div>
                    <h4 className="table-title">
                      Lista de categorias
                    </h4>
                    <p className="table-subtitle">
                      Mostrando {currentCategorias.length} de {categorias.length} categorías
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ overflow: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>
                        <i className="fa-solid fa-hashtag icon-gap" style={{ color: '#6366f1' }}></i>
                        <span>#</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-tag icon-gap"></i><span>CATEGORÍA</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-align-left icon-gap" style={{ color: '#6366f1' }}></i><span>DESCRIPCIÓN</span>
                      </th>
                      <th style={{ textAlign: 'center' }}>
                        <i className="fa-solid fa-toggle-on icon-gap"></i><span>ESTADO</span>
                      </th>
                      <th style={{ textAlign: 'center' }}>
                        <i className="fa-solid fa-cogs icon-gap" style={{ color: '#6366f1' }}></i><span>ACCIONES</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCategorias.map((cat, index) => (
                      <tr key={cat._id}>
                        <td style={{ fontWeight: '600', color: '#6366f1' }}>
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="table-icon-small">
                              <i className="fa-solid fa-tag" style={{ color: 'white', fontSize: '12px' }}></i>
                            </div>
                            <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                              {cat.name}
                            </div>
                          </div>
                        </td>
                        <td style={{ color: '#6b7280', fontSize: '14px' }}>
                          {cat.description}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={!!cat.activo}
                              aria-label={`Estado de la categoría ${cat.name || cat._id}`}
                              onChange={(e) => toggleEstadoCategoria(cat._id, e.target.checked)}
                              style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span className="slider" style={{
                              backgroundColor: cat.activo ? '#10b981' : '#ef4444'
                            }}></span>
                          </label>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn edit"
                              onClick={() => handleEdit(cat)}
                              title="Editar categoría"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {categorias.length === 0 && (
                      <tr>
                        <td colSpan="5">
                          <div className="table-empty-state">
                            <div className="table-empty-icon">
                              <i className="fa-solid fa-tags" style={{ fontSize: '3.5rem', color: '#9ca3af' }}></i>
                            </div>
                            <div>
                              <h5 className="table-empty-title">
                                No hay categorías disponibles
                              </h5>
                              <p className="table-empty-text">
                                No se encontraron categorías en el sistema
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="table-pagination">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
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