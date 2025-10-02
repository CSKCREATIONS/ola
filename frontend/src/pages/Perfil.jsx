import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fijo from '../components/Fijo';
import { openModal } from '../funciones/animaciones';
import EditarPerfil from '../components/EditarPerfil';
import Swal from 'sweetalert2';

export default function Perfil() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };

    loadUser();
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, []);

  const handleClick = async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Seguro que quieres cerrar sesión?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      localStorage.clear();
      navigate('/');
    }
  };

  if (!user) {
    return (
      <div className="contenido-modulo text-center py-10">
        <p className="text-gray-400">Inicie sesión primero 🐝</p>
      </div>
    );
  }

  return (
    <div>
      <Fijo />
      <div class="content">
        <div className="contenido-modulo">
          <div className="content flex justify-center items-center">
            <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-xl transform rotate-1">

              {/* Encabezado */}
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                  {user.firstName} {user.surname}
                </h1><br />
                <button
                  onClick={() => openModal('editar-perfil')}
                  className="btn-modern btn-edit"
                >
                  ✏️ Editar
                </button>
              </div>
              <br />
              {/* Información */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                  <strong className="block text-gray-500">Nombre(s)</strong>
                  <p className="font-medium">{user.firstName} {user.secondName}</p>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                  <strong className="block text-gray-500">Apellidos</strong>
                  <p className="font-medium">{user.surname} {user.secondSurname}</p>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                  <strong className="block text-gray-500">Correo</strong>
                  <p className="font-medium">{user.email}</p>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                  <strong className="block text-gray-500">Usuario</strong>
                  <p className="font-medium">{user.username}</p>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg shadow-sm sm:col-span-2">
                  <strong className="block text-gray-500">Rol</strong>
                  <p className="font-medium">
                    {typeof user.role === 'string' ? user.role : user.role?.name || 'Sin rol'}
                  </p>
                </div>
              </div>
              <br />
              {/* Botón cerrar sesión */}
              <div className="text-center mt-8">
                <button
                  onClick={handleClick}
                  className="btn-modern btn-logout"
                >
                  🚪 Cerrar sesión
                </button>
              </div>
            </div>
            <br /><br />
            
          </div>
          <EditarPerfil />

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