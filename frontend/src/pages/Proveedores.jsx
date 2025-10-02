// src/pages/Proveedores.jsx
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavCompras from '../components/NavCompras';

const API_URL = 'http://localhost:5000/api/proveedores';
const token = localStorage.getItem('token');

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
    <div className="modal-overlay">
      <div className="modal-compact">
        <div className="modal-header">
          <h5 className="modal-title">{proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h5>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label required">Nombre</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label required">Teléfono</label>
              <input name="contacto.telefono" value={form.contacto.telefono} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label required">Correo</label>
              <input name="contacto.correo" type="email" value={form.contacto.correo} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label required">Dirección</label>
              <input name="direccion.calle" value={form.direccion.calle} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label required">País</label>
              <input name="direccion.pais" value={form.direccion.pais} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Empresa (opcional)</label>
              <input name="empresa" value={form.empresa} onChange={handleChange} className="form-input" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-save">Guardar</button>
          </div>
        </form>
      </div>
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
      const res = await fetch(API_URL, { headers: { 'x-access-token': token } });
      const result = await res.json();
      setProveedores(result.proveedores || []);
    } catch {
      Swal.fire('Error', 'No se pudieron cargar los proveedores', 'error');
    }
  };

  const guardarProveedor = async (proveedor) => {
    const url = proveedor._id ? `${API_URL}/${proveedor._id}` : API_URL;
    const method = proveedor._id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-access-token': token },
        body: JSON.stringify(proveedor)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al guardar el proveedor');
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
      const res = await fetch(`http://localhost:3000/api/proveedores/${id}/${activar ? 'activate' : 'deactivate'}`, {
        method: 'PATCH', headers: { 'x-access-token': token }
      });
      if (!res.ok) throw new Error('Error al cambiar el estado del proveedor');
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
          <div className='encabezado-modulo'><h3 className='titulo-profesional'>Lista de proveedores</h3></div><br />
          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-save" onClick={() => { setProveedorEditando(null); setModalVisible(true); }}>+ Nuevo Proveedor</button>
          </div>
          <br />
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Dirección</th><th>País</th><th>Empresa</th><th>Productos</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((prov, index) => (
                  <tr key={prov._id}>
                    <td>{index + 1 + (currentPage - 1) * itemsPerPage}</td>
                    <td>{prov.nombre}</td>
                    <td>{prov.contacto?.telefono}</td>
                    <td>{prov.contacto?.correo}</td>
                    <td>{prov.direccion?.calle}</td>
                    <td>{prov.direccion?.pais}</td>
                    <td>{prov.empresa}</td>
                    <td>
                      <button className="btn btn-info btn-sm" onClick={() => { setProductosProveedor(prov.productos || []); setProveedorNombre(prov.nombre); setModalProductosVisible(true); }}>
                        Ver Productos
                      </button>
                    </td>
                    <td>
                      <button className='btnTransparente' onClick={() => { setProveedorEditando(prov); setModalVisible(true); }}>
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>{' '}
                      {prov.activo ?
                        <button className="btn btn-warning btn-sm" onClick={() => toggleEstadoProveedor(prov._id, false)}>
                          <i className="fa-solid fa-ban"></i> Inhabilitar
                        </button>
                        :
                        <button className="btn btn-success btn-sm" onClick={() => toggleEstadoProveedor(prov._id, true)}>
                          <i className="fa-solid fa-check"></i> Habilitar
                        </button>
                      }
                    </td>
                  </tr>
                ))}
                {currentItems.length === 0 && <tr><td colSpan="9">No hay proveedores disponibles</td></tr>}
              </tbody>
            </table>
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