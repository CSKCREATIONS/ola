// Perfil.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fijo from '../components/Fijo';
import { openModal } from '../funciones/animaciones';
import EditarPerfil from '../components/EditarPerfil';
import Swal from 'sweetalert2';
import '../styles/Perfil.css';

/* global globalThis */

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
    globalThis.addEventListener('storage', loadUser);
    return () => globalThis.removeEventListener('storage', loadUser);
  }, []);

  const handleClick = async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Seguro que quieres cerrar sesión?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
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

  const getInitials = () => {
    const firstName = user.firstName || '';
    const surname = user.surname || '';
    return `${firstName.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  return (
    <div>
      <Fijo />
      <div className="content">
        <div className="max-width">
          <div className="contenido-modulo">
            <div className="perfil-container">
              <div className="perfil-card">
                {/* Decoración de fondo */}
                <div className="perfil-background-decoration"></div>

                <div className="perfil-content">
                  {/* Header con avatar y nombre */}
                  <div className="perfil-header">
                    <div className="perfil-avatar-container">
                      {/* Avatar con iniciales */}
                      <div className="perfil-avatar">
                        {getInitials()}
                      </div>

                      <div className="perfil-user-info">
                        <h1>
                          {user.firstName} {user.surname}
                        </h1>
                        <p className="perfil-user-role">
                          <i className="fa-solid fa-shield-alt" style={{ color: '#6366f1' }}></i>
                          {typeof user.role === 'string' ? user.role : user.role?.name || 'Sin rol'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openModal('editar-perfil')}
                      className="perfil-edit-btn"
                    >
                      <i className="fa-solid fa-edit"></i>
                      <span>Editar Perfil</span>
                    </button>
                  </div>

                  {/* Información del usuario */}
                  <div className="perfil-grid">
                    {/* Nombres */}
                    <div className="perfil-info-card names">
                      <div className="perfil-info-header">
                        <div className="perfil-info-icon names">
                          <i className="fa-solid fa-user"></i>
                        </div>
                        <strong className="perfil-info-label">
                          Nombre(s)
                        </strong>
                      </div>
                      <p className="perfil-info-value">
                        {user.firstName} {user.secondName}
                      </p>
                    </div>

                    {/* Apellidos */}
                    <div className="perfil-info-card surnames">
                      <div className="perfil-info-header">
                        <div className="perfil-info-icon surnames">
                          <i className="fa-solid fa-id-badge"></i>
                        </div>
                        <strong className="perfil-info-label">
                          Apellidos
                        </strong>
                      </div>
                      <p className="perfil-info-value">
                        {user.surname} {user.secondSurname}
                      </p>
                    </div>

                    {/* Correo */}
                    <div className="perfil-info-card email">
                      <div className="perfil-info-header">
                        <div className="perfil-info-icon email">
                          <i className="fa-solid fa-envelope"></i>
                        </div>
                        <strong className="perfil-info-label">
                          Correo
                        </strong>
                      </div>
                      <p className="perfil-info-value">
                        {user.email}
                      </p>
                    </div>

                    {/* Usuario */}
                    <div className="perfil-info-card username">
                      <div className="perfil-info-header">
                        <div className="perfil-info-icon username">
                          <i className="fa-solid fa-at"></i>
                        </div>
                        <strong className="perfil-info-label">
                          Usuario
                        </strong>
                      </div>
                      <p className="perfil-info-value">
                        {user.username}
                      </p>
                    </div>
                  </div>

                  {/* Botón cerrar sesión */}
                  <div className="perfil-logout-section">
                    <button
                      onClick={handleClick}
                      className="perfil-logout-btn"
                    >
                      <i className="fa-solid fa-right-from-bracket"></i>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <EditarPerfil />
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