
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function ListaDeClientes() {
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState(""); // 👉 filtro agregado

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
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/clientes', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          console.error('Error o respuesta inesperada:', data);
          return setClientes([]);
        }
        setClientes(data);
      })
      .catch(err => {
        console.error('Error al cargar clientes:', err);
        setClientes([]);
      });
  }, []);

  const handleEliminar = (id) => {
    const token = localStorage.getItem('token');
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el cliente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`http://localhost:3000/api/clientes/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(() => {
            setClientes(clientes.filter(c => c._id !== id));
            Swal.fire('Eliminado', 'Cliente eliminado correctamente.', 'success');
          })
          .catch(err => {
            console.error(err);
            Swal.fire('Error', 'No se pudo eliminar el cliente.', 'error');
          });
      }
    });
  };

  const handleGuardar = async (clienteActualizado) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3000/api/clientes/${clienteActualizado._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(clienteActualizado)
      });

      if (!res.ok) throw new Error('Error al actualizar cliente');
      Swal.fire('Éxito', 'Cliente actualizado correctamente', 'success');
      setMostrarModal(false);
      setClientes(clientes.map(c => c._id === clienteActualizado._id ? clienteActualizado : c));
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  /*** FUNCIONES EXPORTAR ***/
  const exportarPDF = () => {
    const input = document.getElementById('tabla_clientes');

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);

      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('listaClientes.pdf');
    });
  };

  const exportToExcel = (todosLosClientes) => {
    if (!todosLosClientes || todosLosClientes.length === 0) {
      Swal.fire("Error", "No hay datos para exportar", "warning");
      return;
    }

    const dataFormateada = todosLosClientes.map(cliente => ({
      'Nombre': cliente.nombre || cliente.clienteInfo?.nombre || '',
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

  /*** MODAL EDITAR CLIENTE ***/
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

    return (
      <div className="modal-overlay">
        <div className="modal-compact">
          <div className="modal-header">
            <h5 className="modal-title">Editar Cliente</h5>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">Nombre</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label required">Ciudad</label>
                <input name="ciudad" value={form.ciudad} onChange={handleChange} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label required">Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={handleChange} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label required">Correo</label>
                <input name="correo" value={form.correo} onChange={handleChange} className="form-input" required />
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

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="contenido-modulo">
          <div className='encabezado-modulo'>
            <div>
              <h3 className='titulo-profesional'>Lista de clientes</h3>

              {/* BOTONES EXPORTAR */}
              <button
                onClick={() => exportToExcel(clientes)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.45rem 0.9rem', border: '1.5px solid #16a34a', borderRadius: '8px', background: 'transparent', color: '#16a34a',
                  fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.3s ease'
                }}
              >
                <i className="fa-solid fa-file-excel" style={{ color: 'inherit', fontSize: '16px' }}></i>
                <span>Exportar a Excel</span>
              </button>

              <button
                onClick={exportarPDF}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.45rem 0.9rem', border: '1.5px solid #dc2626', borderRadius: '8px', background: 'transparent', color: '#dc2626',
                  fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.3s ease'
                }}
              >
                <i className="fa-solid fa-file-pdf" style={{ color: 'inherit', fontSize: '16px' }}></i>
                <span>Exportar a PDF</span>
              </button>
            </div>
          </div><br />

          {/* FILTRO DE BÚSQUEDA */}
          <div className="filtros-tabla">
            <div className="filtro-grupo">
              <input
                className='filtro-input'
                type="text"
                placeholder="Buscar por nombre o correo"
                value={filtroTexto}
                onChange={(e) => {
                  setFiltroTexto(e.target.value);
                  setCurrentPage(1); // reset a la página 1 cuando filtras
                }}
                style={{ marginRight: '10px' }}
              />
            </div>
          </div>

          <div className="max-width">
            <div className="table-container">
              <table id='tabla_clientes'>
                <thead>
                  <tr>
                    <th>Clientes</th>
                    <th>Ciudad</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((cliente) => (
                    <tr key={cliente._id}>
                      <td>{cliente.nombre || cliente.clienteInfo?.nombre || 'Sin nombre'}</td>
                      <td>{cliente.ciudad || cliente.clienteInfo?.ciudad || 'N/A'}</td>
                      <td>{cliente.telefono || cliente.clienteInfo?.telefono || 'N/A'}</td>
                      <td>{cliente.correo || cliente.clienteInfo?.correo || 'N/A'}</td>
                      <td>
                        <button className='btnTransparente' onClick={() => {
                          setClienteSeleccionado(cliente);
                          setMostrarModal(true);
                        }}>
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && <tr><td colSpan="9">No hay clientes disponibles</td></tr>}
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
          </div>



          {/* PAGINACIÓN */}
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
        
      </div>
      <div className="custom-footer">
          <p className="custom-footer-text">
            © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
          </p>
        </div>
    </div>
  );
}
