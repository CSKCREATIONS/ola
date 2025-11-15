/* global globalThis */
import React, { useEffect, useState } from 'react';
import { closeModal } from '../funciones/animaciones';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import PropTypes from 'prop-types';
import { labelStyle, inputStyle, createFocusHandler, handleBlur, btnSecondaryStyle, btnPrimaryStyle, mouseEnterSecondary, mouseLeaveSecondary, mouseEnterPrimary, mouseLeavePrimary } from './sharedStyles';

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
        if (err?.response?.status === 403) {
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
      const payload = { ...form };
      if (passwords.new) payload.password = passwords.new;
      const id = usuario?._id || usuario?.id;
      const res = await api.put(`/api/users/${id}`, payload);
      const data = res.data || res;
      Swal.fire({
        title: 'Usuario actualizado',
        text: data.message || 'Los cambios fueron guardados correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
      closeModal('editUserModal');
      if (typeof fetchUsuarios === 'function') fetchUsuarios();
    } catch (err) {
      console.error('Error actualizando usuario:', err);
      Swal.fire({ text: err?.response?.data?.message || 'Error al actualizar usuario', icon: 'error' });
    }
  };

  return (
    <div 
      id="editUserModal"
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
        margin: 0,
        padding: 0
      }}
      onClick={(e) => {
        if (e.target.id === 'editUserModal') {
          closeModal('editUserModal');
        }
      }}
    >
      <dialog
        aria-modal="true"
        aria-labelledby="edit-user-title"
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
          flexDirection: 'column',
          border: 'none'
        }}
        open
      >
        <form onSubmit={guardarCambios} style={{ display: 'flex', flexDirection: 'column' }}>
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
              <i className="fa-solid fa-user-edit" style={{ fontSize: '1.5rem' }} aria-hidden={true}></i>
            </div>
            <span>Editar Usuario</span>
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
              <i className="fa-solid fa-id-card" style={{ color: '#3b82f6' }} aria-hidden={true}></i>
              <span>Información Personal</span>
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label htmlFor="firstName-edit" style={labelStyle}>
                  <i className="fa-solid fa-user" style={{ color: '#3b82f6', fontSize: '0.875rem' }} aria-hidden={true}></i>
                  <span>Primer nombre</span>
                </label>
                <input 
                  id="firstName-edit"
                  type="text" 
                  name="firstName" 
                  value={form.firstName} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={createFocusHandler('#3b82f6')}
                  onBlur={handleBlur}
                />
              </div>

              <div>
                <label htmlFor="secondName-edit" style={labelStyle}>
                  <i className="fa-solid fa-user" style={{ color: '#3b82f6', fontSize: '0.875rem' }} aria-hidden={true}></i>
                  <span>Segundo nombre</span>
                </label>
                <input 
                  id="secondName-edit"
                  type="text" 
                  name="secondName" 
                  value={form.secondName} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={createFocusHandler('#3b82f6')}
                  onBlur={handleBlur}
                />
              </div>

              <div>
                <label htmlFor="surname-edit" style={labelStyle}>
                  <i className="fa-solid fa-user" style={{ color: '#3b82f6', fontSize: '0.875rem' }} aria-hidden={true}></i>
                  <span>Primer apellido</span>
                </label>
                <input 
                  id="surname-edit"
                  type="text" 
                  name="surname" 
                  value={form.surname} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={createFocusHandler('#3b82f6')}
                  onBlur={handleBlur}
                />
              </div>

              <div>
                <label htmlFor="secondSurname-edit" style={labelStyle}>
                  <i className="fa-solid fa-user" style={{ color: '#3b82f6', fontSize: '0.875rem' }} aria-hidden={true}></i>
                  <span>Segundo apellido</span>
                </label>
                <input 
                  id="secondSurname-edit"
                  type="text" 
                  name="secondSurname" 
                  value={form.secondSurname} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={createFocusHandler('#3b82f6')}
                  onBlur={handleBlur}
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
                <label htmlFor="email-edit" style={labelStyle}>
                  <i className="fa-solid fa-envelope" style={{ color: '#10b981', fontSize: '0.875rem' }} aria-hidden={true}></i>
                  <span>Correo electrónico</span>
                </label>
                <input 
                  id="email-edit"
                  type="email" 
                  name="email" 
                  value={form.email} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={createFocusHandler('#10b981')}
                  onBlur={handleBlur}
                />
              </div>

              <div>
                <label htmlFor="username-edit" style={labelStyle}>
                  <i className="fa-solid fa-at" style={{ color: '#10b981', fontSize: '0.875rem' }} aria-hidden={true}></i>
                  <span>Nombre de usuario</span>
                </label>
                <input 
                  id="username-edit"
                  type="text" 
                  name="username" 
                  value={form.username} 
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={createFocusHandler('#10b981')}
                  onBlur={handleBlur}
                />
              </div>

              <div>
                <label htmlFor="role-edit" style={labelStyle}>
                  <i className="fa-solid fa-shield-alt" style={{ color: '#10b981', fontSize: '0.875rem' }} aria-hidden={true}></i>
                  <span>Rol <span style={{ color: '#ef4444' }}>*</span></span>
                </label>
                {rolesForbidden ? (
                  <div style={{ 
                    color: '#ef4444', 
                    padding: '0.875rem 1rem',
                    background: '#fee2e2',
                    borderRadius: '10px',
                    border: '2px solid #fecaca'
                  }}>
                    <i className="fa-solid fa-lock icon-gap" style={{}} aria-hidden={true}></i>
                    <span>No tienes permiso para ver roles</span>
                  </div>
                ) : (
                  <select 
                    id="role-edit"
                    name="role" 
                    value={form.role} 
                    onChange={handleChange} 
                    required
                    style={inputStyle}
                    onFocus={createFocusHandler('#10b981')}
                    onBlur={handleBlur}
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
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                <div>
                  <label htmlFor="new-password-edit" style={labelStyle}>
                    <i className="fa-solid fa-key" style={{ color: '#f59e0b', fontSize: '0.875rem' }} aria-hidden={true}></i>
                    <span>Nueva contraseña</span>
                  </label>
                  <input
                    id="new-password-edit"
                    type="password"
                    name="new"
                    value={passwords.new}
                    onChange={handlePasswordChange}
                    placeholder="Dejar vacío para no cambiar"
                    style={inputStyle}
                    onFocus={createFocusHandler('#f59e0b')}
                    onBlur={handleBlur}
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password-edit" style={labelStyle}>
                    <i className="fa-solid fa-check" style={{ color: '#f59e0b', fontSize: '0.875rem' }} aria-hidden={true}></i>
                    <span>Confirmar contraseña</span>
                  </label>
                  <input
                    id="confirm-password-edit"
                    type="password"
                    name="confirm"
                    value={passwords.confirm}
                    onChange={handlePasswordChange}
                    placeholder="Repite la contraseña"
                    style={inputStyle}
                    onFocus={createFocusHandler('#f59e0b')}
                    onBlur={handleBlur}
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
            style={btnSecondaryStyle}
            onMouseEnter={mouseEnterSecondary}
            onMouseLeave={mouseLeaveSecondary}
          >
            <i className="fa-solid fa-times" aria-hidden={true}></i>
            <span>Cancelar</span>
          </button>

          <button
            type="submit"
            style={btnPrimaryStyle}
            onMouseEnter={mouseEnterPrimary}
            onMouseLeave={mouseLeavePrimary}
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

EditarUsuario.propTypes = {
  usuario: PropTypes.shape({
    _id: PropTypes.string,
    username: PropTypes.string,
    firstName: PropTypes.string,
    secondName: PropTypes.string,
    surname: PropTypes.string,
    secondSurname: PropTypes.string,
    role: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ _id: PropTypes.string, name: PropTypes.string })
    ]),
    email: PropTypes.string,
    enabled: PropTypes.bool
  }),
  fetchUsuarios: PropTypes.func
};



