import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavProductos from '../components/NavProductos'

const API_URL = 'http://localhost:5000/api/categories';
const token = localStorage.getItem('token');

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
      const resCheck = await fetch(API_URL, {
        headers: { 'x-access-token': token }
      });
      const resultCheck = await resCheck.json();
      const categories = resultCheck.categories || resultCheck.data || resultCheck;

      const nombreRepetido = categories.some(cat =>
        cat.name.toLowerCase() === name.toLowerCase() &&
        cat._id !== categoria?.id
      );

      if (nombreRepetido) {
        Swal.fire('Error', 'Ya existe una categoría con ese nombre', 'error');
        return;
      }

      onSave({ id: categoria?.id, name, description });
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-compact">
        <div className="modal-header">
          <h5 className="modal-title">
            {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
          </h5>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label required">Nombre de la categoría</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Tecnología"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Descripción</label>
              <input
                type="text"
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Equipos electrónicos y software"
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-save">
              {categoria ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GestionCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch(API_URL, {
        headers: { 'x-access-token': token }
      });

      const result = await res.json();
      const categories = result.categories || result.data || result;
      setCategorias(categories);
    } catch (err) {
      Swal.fire('Error', 'No se pudieron cargar las categorías', 'error');
    }
  };

  const handleSave = async (categoria) => {
    const url = categoria.id ? `${API_URL}/${categoria.id}` : API_URL;
    const method = categoria.id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify({ name: categoria.name, description: categoria.description })
      });

      if (!res.ok) throw new Error(categoria.id ? 'Error al actualizar la categoría' : 'Error al crear la categoría');

      Swal.fire('Éxito', categoria.id ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente', 'success');
      setModalVisible(false);
      loadCategories();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleEdit = (categoria) => {
    setCategoriaEditando({ id: categoria._id, name: categoria.name, description: categoria.description });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la categoría permanentemente',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'x-access-token': token }
      });

      if (!res.ok) throw new Error('No se pudo eliminar la categoría');
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
    const res = await fetch(`${API_URL}/${id}/${activar ? 'activate' : 'deactivate'}`, {
      method: 'PATCH',
      headers: { 'x-access-token': token }
    });

    if (!res.ok) throw new Error(`No se pudo ${activar ? 'activar' : 'desactivar'} la categoría`);

    await Swal.fire(
      activar ? 'Categoría activada' : 'Categoría desactivada',
      '',
      'success'
    );

    // ✅ IMPORTANTE: vuelve a cargar los datos actualizados
    await loadCategories();
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
};


  return (
    <div>
      <Fijo />
      <div className="content">
        <NavProductos/>
        <div className="contenido-modulo">
          <div className='encabezado-modulo'>
            <h3 className='titulo-profesional'>Lista de categorias</h3>
          </div>
          <br />
          <br />

          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-save" onClick={() => { setCategoriaEditando(null); setModalVisible(true); }}>+ Nueva Categoría</button>
          </div>
          <br />
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>
                      No hay categorías disponibles
                    </td>
                  </tr>
                ) : (
                  categorias.map((cat, index) => (
                    <tr key={cat._id}>
                      <td>{index + 1}</td>
                      <td>{cat.name}</td>
                      <td>{cat.description}</td>
                      <td>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={!!cat.activo}
                            onChange={(e) => toggleEstadoCategoria(cat._id, e.target.checked)}
                          />
                          <span className="slider"></span>
                        </label>
                      </td>
                      <td>
                        <button className="btnTransparente" onClick={() => handleEdit(cat)}>
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {modalVisible && (
          <CategoriaModal
            categoria={categoriaEditando}
            onClose={() => setModalVisible(false)}
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

export default GestionCategorias;