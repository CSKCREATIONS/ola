import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fijo from '../components/Fijo';
import { openModal } from '../funciones/animaciones';
import EditarPerfil from '../components/EditarPerfil';
import Swal from 'sweetalert2';

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
        <div className="contenido-modulo">
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 200px)',
            padding: '2rem 1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '3rem',
              width: '100%',
              maxWidth: '1000px',
              boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decoración de fondo */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '300px',
                height: '300px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.05))',
                borderRadius: '50%',
                transform: 'translate(30%, -30%)',
                zIndex: 0
              }}></div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Header con avatar y nombre */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '3rem',
                  flexWrap: 'wrap',
                  gap: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Avatar con iniciales */}
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      fontWeight: '700',
                      color: 'white',
                      boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
                    }}>
                      {getInitials()}
                    </div>

                    <div>
                      <h1 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        {user.firstName} {user.surname}
                      </h1>
                      <p style={{
                        margin: 0,
                        fontSize: '1rem',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <i className="fa-solid fa-shield-alt" style={{ color: '#6366f1' }}></i>
                        {typeof user.role === 'string' ? user.role : user.role?.name || 'Sin rol'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => openModal('editar-perfil')}
                    style={{
                      padding: '0.875rem 1.5rem',
                      border: 'none',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 12px -1px rgba(99, 102, 241, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 6px -1px rgba(99, 102, 241, 0.3)';
                    }}
                  >
                    <i className="fa-solid fa-edit"></i>
                    <span>Editar Perfil</span>
                  </button>
                </div>

                {/* Información del usuario */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  {/* Nombres */}
                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(99, 102, 241, 0.1))',
                    border: '2px solid rgba(99, 102, 241, 0.2)',
                    boxShadow: '0 2px 4px rgba(99, 102, 241, 0.05)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <i className="fa-solid fa-user"></i>
                      </div>
                      <strong style={{ color: '#475569', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Nombre(s)
                      </strong>
                    </div>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '1.1rem', 
                      fontWeight: '600', 
                      color: '#1e293b',
                      paddingLeft: '3rem'
                    }}>
                      {user.firstName} {user.secondName}
                    </p>
                  </div>

                  {/* Apellidos */}
                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.1))',
                    border: '2px solid rgba(16, 185, 129, 0.2)',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.05)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <i className="fa-solid fa-id-badge"></i>
                      </div>
                      <strong style={{ color: '#475569', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Apellidos
                      </strong>
                    </div>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '1.1rem', 
                      fontWeight: '600', 
                      color: '#1e293b',
                      paddingLeft: '3rem'
                    }}>
                      {user.surname} {user.secondSurname}
                    </p>
                  </div>

                  {/* Correo */}
                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.1))',
                    border: '2px solid rgba(245, 158, 11, 0.2)',
                    boxShadow: '0 2px 4px rgba(245, 158, 11, 0.05)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <i className="fa-solid fa-envelope"></i>
                      </div>
                      <strong style={{ color: '#475569', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Correo
                      </strong>
                    </div>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '1.1rem', 
                      fontWeight: '600', 
                      color: '#1e293b',
                      paddingLeft: '3rem',
                      wordBreak: 'break-word'
                    }}>
                      {user.email}
                    </p>
                  </div>

                  {/* Usuario */}
                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05), rgba(236, 72, 153, 0.1))',
                    border: '2px solid rgba(236, 72, 153, 0.2)',
                    boxShadow: '0 2px 4px rgba(236, 72, 153, 0.05)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #ec4899, #db2777)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <i className="fa-solid fa-at"></i>
                      </div>
                      <strong style={{ color: '#475569', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Usuario
                      </strong>
                    </div>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '1.1rem', 
                      fontWeight: '600', 
                      color: '#1e293b',
                      paddingLeft: '3rem'
                    }}>
                      {user.username}
                    </p>
                  </div>
                </div>

                {/* Botón cerrar sesión */}
                <div style={{
                  paddingTop: '2rem',
                  borderTop: '2px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={handleClick}
                    style={{
                      padding: '1rem 2rem',
                      border: '2px solid #ef4444',
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#ef4444';
                      e.target.style.color = 'white';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 12px -2px rgba(239, 68, 68, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.color = '#ef4444';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
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

      <div className="custom-footer">
        <p className="custom-footer-text">
          © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
