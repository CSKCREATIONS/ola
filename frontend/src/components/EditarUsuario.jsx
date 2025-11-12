import React, { useEffect, useState } from 'react';
import { closeModal } from '../funciones/animaciones';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';

export default function EditarUsuario({ usuario, fetchUsuarios }) {
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [rolesForbidden, setRolesForbidden] = useState(false);
  const [mostrarCambiarPassword, setMostrarCambiarPassword] = useState(false);
  
  const [form, setForm] = useState({
    firstName: '',
    secondName: '',
    surname: '',
    secondSurname: '',
    role: '',
    email: '',
    username: '',
    enabled: true,
  });

  const [passwords, setPasswords] = useState({
    new: '',
    confirm: '',
  });

  // Fetch roles and initialize form when `usuario` changes
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/roles');
        const data = res.data || res;
        const roles = Array.isArray(data) ? data : (data.roles || data.data || []);
        setRolesDisponibles(roles);
        setRolesForbidden(false);
      } catch (err) {
        if (err && err.response && err.response.status === 403) {
          console.debug('403 al obtener /api/roles — el usuario no tiene permiso para ver roles');
          setRolesDisponibles([]);
          setRolesForbidden(true);
        } else {
          console.error('Error al cargar roles:', err);
          setRolesDisponibles([]);
          setRolesForbidden(false);
        }
      }
    })();

    if (usuario) {
      setForm({
        firstName: usuario.firstName || '',
        secondName: usuario.secondName || '',
        surname: usuario.surname || '',
        secondSurname: usuario.secondSurname || '',
        role: usuario.role?._id || usuario.role || '',
        email: usuario.email || '',
        username: usuario.username || '',
        enabled: usuario.enabled ?? true,
      });
    }

  }, [usuario]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    
    try {
      if (passwords.new && passwords.new !== passwords.confirm) {
        return Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
      }

      const res = await api.patch(`/api/users/${usuario._id}`, form);
      const resData = res.data || res;
      if (!(res.status >= 200 && res.status < 300)) {
        throw new Error(resData.message || 'Error al actualizar el usuario');
      }

      let nuevaContrasena = null;

      // Cambiar contraseña si aplica
      if (passwords.new && passwords.confirm && passwords.new === passwords.confirm) {
        const resPassword = await api.patch(`/api/users/${usuario._id}/change-password`, { 
          newPassword: passwords.new 
        });
        const data = resPassword.data || resPassword;
        if (!(resPassword.status >= 200 && resPassword.status < 300)) {
          throw new Error(data.message || 'Error al cambiar la contraseña');
        }
        nuevaContrasena = passwords.new;
      }

      await fetchUsuarios();
      closeModal('editUserModal');
      setPasswords({ new: '', confirm: '' });
      setMostrarCambiarPassword(false);

      // Actualizar localStorage si el usuario editado es el mismo que está logueado
      const userLogged = JSON.parse(localStorage.getItem('user'));
      if (userLogged && userLogged._id === usuario._id) {
        const rolActualizado = rolesDisponibles.find(r => r._id === form.role);
        localStorage.setItem('user', JSON.stringify({
          ...userLogged,
          ...form,
          role: {
            _id: form.role,
            name: rolActualizado ? rolActualizado.name : userLogged.role?.name || ''
          }
        }));
        window.dispatchEvent(new Event('storage'));
      }

      Swal.fire({
        icon: 'success',
        title: 'Usuario actualizado',
        html: nuevaContrasena ? `<p>Contraseña actualizada:<br><b>${nuevaContrasena}</b></p>` : '',
        timer: 2500,
        showConfirmButton: false
      });

    } catch (error) {
      Swal.fire('Error', error.message, 'error');
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
      id="editUserModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
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
        margin: 0,
        padding: 0
      }}
      onClick={(e) => {
        if (e.target.id === 'editUserModal') {
          closeModal('editUserModal');
        }
      }}
    >
      <form 
        onSubmit={guardarCambios}
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          maxWidth: '800px',
          width: '95%',
          maxHeight: '95vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'modalSlideIn 0.3s ease-out',
          margin: 0,
          padding: 0,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header del modal */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: 'white',
          padding: '2rem',
          borderRadius: '20px 20px 0 0'
        }}>
          <h3 
            id="edit-user-title"
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
              <i className="fa-solid fa-user-edit" style={{ fontSize: '1.5rem' }}></i>
            </div>
            Editar Usuario
          </h3>
          <p style={{ 
            margin: '0.5rem 0 0 4rem', 
            opacity: 0.9, 
            fontSize: '0.95rem' 
          }}>
            {usuario?.username || 'Actualizar información del usuario'}
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
            borderLeft: '4px solid #3b82f6'
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
              <i className="fa-solid fa-id-card" style={{ color: '#3b82f6' }}></i>
              Información Personal
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label htmlFor="firstName-edit" style={labelStyle}>
                  <i className="fa-solid fa-user" style={{ color: '#3b82f6', fontSize: '0.875rem' }}></i>
                  Primer nombre
                </label>
                <input 
                  id="firstName-edit"
                  type="text" 
                  name="firstName" 
                  value={form.firstName} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label htmlFor="secondName-edit" style={labelStyle}><i className="fa-solid fa-user" style={{ color: '#3b82f6', fontSize: '0.875rem' }}></i>Segundo nombre</label><input id="secondName-edit" type="text" name="secondName" 
                  value={form.secondName} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label htmlFor="surname-edit" style={labelStyle}>
                  <i className="fa-solid fa-user" style={{ color: '#3b82f6', fontSize: '0.875rem' }}></i>
                  Primer apellido
                </label>
                <input 
                  id="surname-edit"
                  type="text" 
                  name="surname" 
                  value={form.surname} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label htmlFor="secondSurname-edit" style={labelStyle}>
                  <i className="fa-solid fa-user" style={{ color: '#3b82f6', fontSize: '0.875rem' }}></i>
                  Segundo apellido
                </label>
                <input 
                  id="secondSurname-edit"
                  type="text" 
                  name="secondSurname" 
                  value={form.secondSurname} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
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
              <i className="fa-solid fa-key" style={{ color: '#10b981' }}></i>
              Información de Cuenta
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label htmlFor="email-edit" style={labelStyle}>
                  <i className="fa-solid fa-envelope" style={{ color: '#10b981', fontSize: '0.875rem' }}></i>
                  Correo electrónico
                </label>
                <input 
                  id="email-edit"
                  type="email" 
                  name="email" 
                  value={form.email} 
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
                <label htmlFor="username-edit" style={labelStyle}>
                  <i className="fa-solid fa-at" style={{ color: '#10b981', fontSize: '0.875rem' }}></i>
                  Nombre de usuario
                </label>
                <input 
                  id="username-edit"
                  type="text" 
                  name="username" 
                  value={form.username} 
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
                <label htmlFor="role-edit" style={labelStyle}>
                  <i className="fa-solid fa-shield-alt" style={{ color: '#10b981', fontSize: '0.875rem' }}></i>
                  Rol
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {rolesForbidden ? (
                  <div style={{ 
                    color: '#ef4444', 
                    padding: '0.875rem 1rem',
                    background: '#fee2e2',
                    borderRadius: '10px',
                    border: '2px solid #fecaca'
                  }}>
                    <i className="fa-solid fa-lock icon-gap" style={{}}></i>
                    No tienes permiso para ver roles
                  </div>
                ) : (
                  <select 
                    id="role-edit"
                    name="role" 
                    value={form.role} 
                    onChange={handleChange} 
                    required
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#10b981';
                      e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="" disabled>Seleccione un rol</option>
                    {Array.isArray(rolesDisponibles) && rolesDisponibles.map(r => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </select>
                )}
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
            <div 
              role="button"
              tabIndex={0}
              onClick={() => setMostrarCambiarPassword(!mostrarCambiarPassword)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setMostrarCambiarPassword(!mostrarCambiarPassword);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginBottom: mostrarCambiarPassword ? '1.5rem' : 0
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
                <i className="fa-solid fa-lock" style={{ color: '#f59e0b' }}></i>
                Cambiar Contraseña
              </h4>
              <i className={`fa-solid fa-chevron-${mostrarCambiarPassword ? 'up' : 'down'}`} 
                 style={{ color: '#6b7280' }}></i>
            </div>

            {mostrarCambiarPassword && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                <div>
                  <label htmlFor="new-password-edit" style={labelStyle}>
                    <i className="fa-solid fa-key" style={{ color: '#f59e0b', fontSize: '0.875rem' }}></i>
                    Nueva contraseña
                  </label>
                  <input
                    id="new-password-edit"
                    type="password"
                    name="new"
                    value={passwords.new}
                    onChange={handlePasswordChange}
                    placeholder="Dejar vacío para no cambiar"
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
                  <label htmlFor="confirm-password-edit" style={labelStyle}>
                    <i className="fa-solid fa-check" style={{ color: '#f59e0b', fontSize: '0.875rem' }}></i>
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirm-password-edit"
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
          borderRadius: '0 0 20px 20px',
          flexShrink: 0
        }}>
          <button 
            type="button" 
            onClick={() => closeModal('editUserModal')}
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
            <i className="fa-solid fa-times"></i>
            Cancelar
          </button>
          
          <button 
            type="submit"
            style={{
              padding: '0.875rem 1.5rem',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 12px -1px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
            }}
          >
            <i className="fa-solid fa-save"></i>
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}


