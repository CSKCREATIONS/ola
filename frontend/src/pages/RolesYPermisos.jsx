import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fijo from '../components/Fijo'
import NavUsuarios from '../components/NavUsuarios'
import AgregarRol from '../components/AgregarRol';
import { openModal } from '../funciones/animaciones';
import Swal from 'sweetalert2';
import EditarRol from '../components/EditarRol';

export default function RolesYPermisos() {

  const [roles, setRoles] = useState([]);
  const [puedeCrearRol, setPuedeCrearRol] = useState(false);
  const [puedeEditarRol, setPuedeEditarRol] = useState(false);
  const [puedeInhabilitarRol, setpuedeInhabilitarRol] = useState(false);
  const navigate = useNavigate();
  const [rolSeleccionado, setRolSeleccionado] = useState(null);


  //crea paginacion de tablas
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // se renderizan 10 registros 

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = roles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(roles.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);



  const toggleEstadoRol = async (id, nuevoEstado) => {
    const confirmResult = await Swal.fire({
      title: nuevoEstado ? '¿Habilitar rol?' : '¿Inhabilitar rol?',
      text: `¿Estás seguro de que deseas ${nuevoEstado ? 'habilitar' : 'inhabilitar'} este rol?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    });

    if (!confirmResult.isConfirmed) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/roles/${id}/toggle-enabled`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify({ enabled: nuevoEstado })
      });

      if (!res.ok) throw new Error('Error al cambiar estado del rol');

      const data = await res.json();

      setRoles(prev =>
        prev.map(r => (r._id === id ? { ...r, enabled: nuevoEstado } : r))
      );

      Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `El rol ha sido ${nuevoEstado ? 'habilitado' : 'inhabilitado'} correctamente.`,
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo actualizar el estado del rol', 'error');
    }
  };

  const mostrarPermisos = (rol) => {
    Swal.fire({
      title: `Permisos de ${rol.name}`,
      html: rol.permissions.join('<br />'), // cada permiso en una línea
      icon: 'info',
      confirmButtonText: 'Cerrar',
      width: '400px',
    });
  };



  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('user'));
    if (usuario && usuario.permissions) {
      setPuedeEditarRol(usuario.permissions.includes('roles.editar'));
      setpuedeInhabilitarRol(usuario.permissions.includes('roles.inhabilitar'))
      setPuedeCrearRol(usuario.permissions.includes('roles.crear'));
    }

    const token = localStorage.getItem('token');


    // Petición al backend para obtener los roles
    fetch('http://localhost:5000/api/roles', {
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRoles(data.roles);
        } else {
          console.error('Error cargando roles');
        }
      })
      .catch(err => console.error('Error:', err));

  }, [navigate]);


  return (
    <div>
      <Fijo />
      <div className="content">
        <NavUsuarios />
        <div className="contenido-modulo">

          <div className='encabezado-modulo'>
            <div>
              <h3 className='titulo-profesional'>Roles y permisos</h3>
            </div>
            {puedeCrearRol && (
              <button id='agregar-rol' onClick={() => openModal('crear-rol')} className='btn-agregar'>
                + Crear rol
              </button>
            )}

          </div>
          <br />
          <div className='table-container'>
            <table id='tabla_roles'>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre de rol</th>
                  <th>Creado</th>
                  <th>Permisos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {currentItems.map((rol, index) => (
                  <tr key={rol._id}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>{rol.name}</td>
                    <td>{new Date(rol.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-permisos"
                        onClick={() => mostrarPermisos(rol)}
                      >
                        Ver permisos
                      </button>
                    </td>

                    <td>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={rol.enabled}
                          onChange={() => {
                            if (puedeInhabilitarRol) {
                              toggleEstadoRol(rol._id, !rol.enabled);
                            } else {
                              Swal.fire({
                                icon: 'error',
                                title: 'Acción no permitida',
                                text: 'No tienes permisos para esta accion',
                                confirmButtonText: 'Entendido'
                              });
                            }
                          }}
                        />
                        <span className="slider round"></span>
                      </label>
                    </td>


                    <td>
                      {puedeEditarRol && (
                        <button
                          className='btnTransparente'
                          onClick={() => {
                            setRolSeleccionado(rol); // <- Aquí guardamos el rol a editar
                            openModal('edit-role-modal'); // <- Abre el modal
                          }}
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                      )}
                    </td>

                  </tr>
                ))}
                {roles.length === 0 && <tr><td colSpan="9">No hay roles disponibles</td></tr>}
              </tbody>


            </table>

          </div>

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
      <AgregarRol />
      <EditarRol rol={rolSeleccionado} />
      <div className="custom-footer">
          <p className="custom-footer-text">
            © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
          </p>
        </div>
    </div>
  )
}