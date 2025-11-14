import React, { useEffect, useState } from 'react';
/* global globalThis */
import Swal from 'sweetalert2';
import { closeModal } from '../funciones/animaciones';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

export default function EditarPerfil() {
  const [form, setForm] = useState({});
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [mostrarCambiarPassword, setMostrarCambiarPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    setForm({
      firstName: user.firstName || '',
      secondName: user.secondName || '',
      surname: user.surname || '',
      secondSurname: user.secondSurname || '',
      email: user.email || '',
      username: user.username || '',
      role: typeof user.role === 'object' ? user.role.name : user.role
    });
  }, []);

  // Attach Escape key handler at document level to avoid adding keyboard
  // listeners directly to non-interactive elements (satisfies a11y lint rules)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        closeModal('editar-perfil');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));

    if (passwords.new || passwords.confirm) {
      if (passwords.new !== passwords.confirm) {
        return Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
      }
      if (passwords.new.length < 6) {
        return Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
      }
    }

    try {
      const res = await api.patch('/api/users/me', form);
      const resData = res.data || res;
      if (!(res.status >= 200 && res.status < 300)) {
        throw new Error(resData.message || 'Error al actualizar el perfil');
      }

      if (passwords.new && passwords.confirm && passwords.new === passwords.confirm) {
        const resPassword = await api.patch('/api/users/change-password', {
          newPassword: passwords.new
        });
        const data = resPassword.data || resPassword;
        if (!(resPassword.status >= 200 && resPassword.status < 300)) {
          throw new Error(data.message || 'Error al cambiar la contraseña');
        }

        await Swal.fire({
          title: 'Contraseña actualizada',
          text: 'Tu sesión expirará. Debes iniciar sesión nuevamente.',
          icon: 'info',
          confirmButtonText: 'OK'
        }).then(() => {
          navigate('/');
        });

        return;
      }

      const updatedUser = {
        ...user,
        ...form,
        role: user.role
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      globalThis.dispatchEvent(new Event('storage'));

      Swal.fire('Éxito', 'Perfil actualizado correctamente', 'success');
      closeModal('editar-perfil');
      setPasswords({ new: '', confirm: '' });
      setMostrarCambiarPassword(false);

    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    backgroundColor: '#ffffff',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#374151',
    fontSize: '0.95rem'
  };

  return (
    <div 
      id="editar-perfil"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target.id === 'editar-perfil') {
          closeModal('editar-perfil');
        }
      }}
      // Keyboard handling (Escape) is attached at document level via useEffect.
    >
      <dialog
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          maxWidth: '900px',
          width: '95%',
          maxHeight: '95vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          border: 'none',
          padding: 0
        }}
        open
      >
        <form onSubmit={guardarCambios} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header del modal */}
        <div style={{
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: 'white',
          padding: '2rem',
          borderRadius: '20px 20px 0 0'
        }}>
          <h3 
            id="edit-profile-title"
            style={{ 
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
              <i className="fa-solid fa-user-circle" style={{ fontSize: '1.5rem' }} aria-hidden={true}></i>
            </div>
            <span>Editar Mi Perfil</span>
          </h3>
          <p style={{ 
            margin: '0.5rem 0 0 4rem', 
            opacity: 0.9, 
            fontSize: '0.95rem' 
          }}>
            Actualiza tu información personal
          </p>
        </div>

        {/* Contenido scrolleable */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          backgroundColor: '#f8fafc'
        }}>
          {/* Información Personal */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #6366f1'
          }}>
            <h4 style={{
              margin: '0 0 1.5rem 0',
              color: '#1e293b',
              fontSize: '1.05rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fa-solid fa-id-card" style={{ color: '#6366f1' }} aria-hidden={true}></i>
              <span>Información Personal</span>
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label htmlFor="firstName" style={labelStyle}><i className="fa-solid fa-user" style={{ color: '#6366f1', fontSize: '0.875rem' }} aria-hidden={true}></i><span>Primer nombre</span></label><input id="firstName" 
                  type="text" 
                  name="firstName" 
                  value={form.firstName || ''} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label htmlFor="secondName" style={labelStyle}><i className="fa-solid fa-user" style={{ color: '#6366f1', fontSize: '0.875rem' }} aria-hidden={true}></i><span>Segundo nombre</span></label><input id="secondName" 
                  type="text" 
                  name="secondName" 
                  value={form.secondName || ''} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label htmlFor="surname" style={labelStyle}>
                  <i className="fa-solid fa-user" style={{ color: '#6366f1', fontSize: '0.875rem' }} aria-hidden={true}></i>
                  <span>Primer apellido</span>
                </label>
                <input 
                  id="surname"
                  type="text" 
                  name="surname" 
                  value={form.surname || ''} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label htmlFor="secondSurname" style={labelStyle}>
                  <i className="fa-solid fa-user" style={{ color: '#6366f1', fontSize: '0.875rem' }} aria-hidden={true}></i>
                  <span>Segundo apellido</span>
                </label>
                <input 
                  id="secondSurname"
                  type="text" 
                  name="secondSurname" 
                  value={form.secondName || ''} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Información de Cuenta */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #10b981'
          }}>
              <h4 style={{
              margin: '0 0 1.5rem 0',
              color: '#1e293b',
              fontSize: '1.05rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fa-solid fa-key" style={{ color: '#10b981' }} aria-hidden={true}></i>
              <span>Información de Cuenta</span>
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label htmlFor="email-perfil" style={labelStyle}>
                  <i className="fa-solid fa-envelope" style={{ color: '#10b981', fontSize: '0.875rem' }} aria-hidden={true}></i>
                  <span>Correo electrónico</span>
                </label>
                <input 
                  id="email-perfil"
                  type="email" 
                  name="email" 
                  value={form.email || ''} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10b981';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label htmlFor="username-perfil" style={labelStyle}>
                  <i className="fa-solid fa-at" style={{ color: '#10b981', fontSize: '0.875rem' }} aria-hidden={true}></i>
                  <span>Nombre de usuario</span>
                </label>
                <input 
                  id="username-perfil"
                  type="text" 
                  name="username" 
                  value={form.username || ''} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10b981';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label htmlFor="role-perfil" style={labelStyle}>
                  <i className="fa-solid fa-shield-alt" style={{ color: '#10b981', fontSize: '0.875rem' }} aria-hidden={true}></i>
                  <span>Rol asignado</span>
                </label>
                <input 
                  id="role-perfil"
                  type="text" 
                  value={form.role || ''} 
                  readOnly 
                  disabled
                  style={{
                    ...inputStyle,
                    backgroundColor: '#f3f4f6',
                    cursor: 'not-allowed',
                    color: '#6b7280'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Cambiar contraseña */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #f59e0b'
          }}>
              <button
              type="button"
              onClick={() => setMostrarCambiarPassword(!mostrarCambiarPassword)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginBottom: mostrarCambiarPassword ? '1.5rem' : 0,
                background: 'transparent',
                border: 'none',
                padding: 0,
                width: '100%'
              }}
            >
              <h4 style={{
                margin: 0,
                color: '#1e293b',
                fontSize: '1.05rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fa-solid fa-lock" style={{ color: '#f59e0b' }} aria-hidden={true}></i>
                <span>Cambiar Contraseña</span>
              </h4>
          <i className={`fa-solid fa-chevron-${mostrarCambiarPassword ? 'up' : 'down'}`} 
            style={{ color: '#6b7280' }} aria-hidden={true}></i>
            </button>

            {mostrarCambiarPassword && (
              <div>
                <div style={{
                  backgroundColor: '#fef3c7',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid #fde68a'
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.875rem', 
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <i className="fa-solid fa-info-circle" aria-hidden={true}></i>
                    <span>Al cambiar tu contraseña, deberás iniciar sesión nuevamente</span>
                  </p>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                    <label htmlFor="new-password-perfil" style={labelStyle}>
                      <i className="fa-solid fa-key" style={{ color: '#f59e0b', fontSize: '0.875rem' }} aria-hidden={true}></i>
                      <span>Nueva contraseña</span>
                    </label>
                    <input
                      id="new-password-perfil"
                      type="password"
                      name="new"
                      value={passwords.new}
                      onChange={handlePasswordChange}
                      placeholder="Mínimo 6 caracteres"
                      style={inputStyle}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#f59e0b';
                        e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password-perfil" style={labelStyle}>
                      <i className="fa-solid fa-check" style={{ color: '#f59e0b', fontSize: '0.875rem' }} aria-hidden={true}></i>
                      <span>Confirmar contraseña</span>
                    </label>
                    <input
                      id="confirm-password-perfil"
                      type="password"
                      name="confirm"
                      value={passwords.confirm}
                      onChange={handlePasswordChange}
                      placeholder="Repite la contraseña"
                      style={inputStyle}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#f59e0b';
                        e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer con botones */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'flex-end',
          padding: '2rem',
          borderTop: '2px solid #e5e7eb',
          backgroundColor: 'white',
          borderRadius: '0 0 20px 20px'
        }}>
          <button 
            type="button" 
            onClick={() => closeModal('editar-perfil')}
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
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 12px -1px rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px -1px rgba(99, 102, 241, 0.3)';
            }}
          >
            <i className="fa-solid fa-save" aria-hidden={true}></i>
            <span>Guardar Cambios</span>
          </button>
        </div>
      </form>
      </dialog>
    </div>
  );
}

