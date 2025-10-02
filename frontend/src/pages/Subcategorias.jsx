import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavProductos from '../components/NavProductos';

const API_URL = 'http://localhost:5000/api/subcategories';
const CATEGORY_API_URL = 'http://localhost:5000/api/categories';
const token = localStorage.getItem('token');

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
    <div className="modal-overlay">
      <div className="modal-compact">
        <div className="modal-header">
          <h5 className="modal-title">
            {subcategoria ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
          </h5>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label required">Nombre</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label required">Descripción</label>
              <input className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label required">Categoría</label>
              <select
                id="category"
                className="form-select"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Seleccione una categoría</option>
                {categorias.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-save">{subcategoria ? 'Actualizar' : 'Guardar'}</button>
          </div>
        </form>
      </div>
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
      const res = await fetch(API_URL, {
        headers: { 'x-access-token': token }
      });

      const result = await res.json();
      const data = result.subcategories || result.data || result || [];
      setSubcategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      Swal.fire('Error', 'No se pudieron cargar las subcategorías', 'error');
    }
  };

  const loadCategorias = async () => {
    try {
      const res = await fetch(CATEGORY_API_URL, {
        headers: { 'x-access-token': token }
      });

      const result = await res.json();
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
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify({ name, description, category: categoryId })
      });

      if (!res.ok) throw new Error('Error al guardar');
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
      const res = await fetch(
        `${API_URL}/${id}/${activar ? 'activate' : 'deactivate'}`,
        {
          method: 'PATCH',
          headers: { 'x-access-token': localStorage.getItem('token') }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && data && data.message) {
          // Mostrar mensaje del servidor (por ejemplo: categoría padre desactivada)
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
      const subRes = await fetch(`${API_URL}/${subcatId}`, {
        headers: { 'x-access-token': token }
      });

      const subData = await subRes.json();
      const parentCategoryId = subData?.data?.category?._id || subData?.category?._id || subData?.data?.category;

      if (wantToActivate && parentCategoryId) {
        // Consultar la categoría padre
        const catRes = await fetch(`${CATEGORY_API_URL}/${parentCategoryId}`, {
          headers: { 'x-access-token': token }
        });
        const catData = await catRes.json();

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
          <div className='encabezado-modulo'>
            <h3 className='titulo-profesional'>Gestión de Subcategorías</h3>
          </div>
          <br />
          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-save" onClick={() => { setSubcategoriaEditando(null); setModalVisible(true); }}>
              + Nueva Subcategoría
            </button>
          </div>
          <br />
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((subcat) => (
                  <tr key={subcat._id}>
                    <td>{subcat.name}</td>
                    <td>{subcat.description}</td>
                    <td>{subcat.category?.name || 'Sin categoría'}</td>
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
                      <button className="btnTransparente" onClick={() => handleEdit(subcat)} title="Editar">
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      &nbsp;
                      
                    </td>
                  </tr>
                ))}
                {subcategorias.length === 0 && <tr><td colSpan="9">No hay subcategorias disponibles</td></tr>}
              </tbody>
            </table>
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