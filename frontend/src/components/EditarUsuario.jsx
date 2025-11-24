/* global globalThis */
import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import { closeModal } from '../funciones/animaciones';

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
    margin: 0,
    padding: 0
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: '20px',
    maxWidth: '800px',
    width: '95%',
    maxHeight: '95vh',
    height: '95vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    animation: 'modalSlideIn 0.3s ease-out',
    margin: 0,
    padding: 0,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    border: 'none'
  },
  header: {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    padding: '2rem',
    borderRadius: '20px 20px 0 0'
  },
  sectionWrapper: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '2rem',
    backgroundColor: '#f8fafc'
  },
  card: (borderLeft) => ({
    background: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    border: '1px solid #e2e8f0',
    borderLeft: borderLeft || '4px solid #3b82f6'
  }),
  footer: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    padding: '2rem',
    borderTop: '2px solid #e5e7eb',
    backgroundColor: 'white',
    borderRadius: '0 0 20px 20px',
    flexShrink: 0
  },
  inputBase: {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    backgroundColor: '#ffffff',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#374151',
    fontSize: '0.95rem'
  }
};

const applyFocus = (e, color = '#3b82f6', shadowColor = 'rgba(59, 130, 246, 0.1)') => {
  e.target.style.borderColor = color;
  e.target.style.boxShadow = `0 0 0 3px ${shadowColor}`;
};
const applyBlur = (e) => {
  e.target.style.borderColor = '#e5e7eb';
  e.target.style.boxShadow = 'none';
};

function Field({ id, label, iconClass, children }) {
  return (
    <div>
      <label htmlFor={id} style={styles.label}>
        <i className={iconClass} style={{ color: '#3b82f6', fontSize: '0.875rem' }} aria-hidden="true"></i>
        <span>{label}</span>
      </label>
      {children}
    </div>
  );
}

Field.propTypes = {
  id: PropTypes.string,
  label: PropTypes.node,
  iconClass: PropTypes.string,
  children: PropTypes.node
};

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
    enabled: true
  });

  const [passwords, setPasswords] = useState({ new: '', confirm: '' });

  // Fetch roles on mount
  useEffect(() => {
    let mounted = true;
    async function loadRoles() {
      try {
        const res = await api.get('/api/roles');
        const data = res.data ?? res;
        const roles = Array.isArray(data) ? data : data.roles ?? data.data ?? [];
        if (mounted) {
          setRolesDisponibles(roles);
          setRolesForbidden(false);
        }
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
    }
    loadRoles();
    return () => { mounted = false; };
  }, []);

  // Initialize form when usuario changes
  useEffect(() => {
    if (!usuario) return;
    setForm({
      firstName: usuario.firstName ?? '',
      secondName: usuario.secondName ?? '',
      surname: usuario.surname ?? '',
      secondSurname: usuario.secondSurname ?? '',
      role: usuario.role?._id ?? usuario.role ?? '',
      email: usuario.email ?? '',
      username: usuario.username ?? '',
      enabled: usuario.enabled ?? true
    });
    setPasswords({ new: '', confirm: '' });
    setMostrarCambiarPassword(false);
  }, [usuario]);

  // Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') closeModal('editUserModal');
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswords((p) => ({ ...p, [name]: value }));
  }, []);

  const guardarCambios = async (e) => {
    e.preventDefault();
    try {
      if (passwords.new && passwords.new !== passwords.confirm) {
        return Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
      }

      const res = await api.patch(`/api/users/${usuario._id}`, form);
      const resData = res.data ?? res;
      if (!(res.status >= 200 && res.status < 300)) throw new Error(resData.message || 'Error al actualizar el usuario');

      let nuevaContrasena = null;

      if (passwords.new && passwords.confirm && passwords.new === passwords.confirm) {
        const resPassword = await api.patch(`/api/users/${usuario._id}/change-password`, { newPassword: passwords.new });
        const data = resPassword.data ?? resPassword;
        if (!(resPassword.status >= 200 && resPassword.status < 300)) {
          throw new Error(data.message || 'Error al cambiar la contraseña');
        }
        nuevaContrasena = passwords.new;
      }

      await fetchUsuarios();
      closeModal('editUserModal');
      setPasswords({ new: '', confirm: '' });
      setMostrarCambiarPassword(false);

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
        globalThis.dispatchEvent(new Event('storage'));
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

  return (
    <div
      id="editUserModal"
      aria-hidden="true"
      style={styles.overlay}
      onClick={(e) => { if (e.target.id === 'editUserModal') closeModal('editUserModal'); }}
    >
      <dialog aria-modal="true" aria-labelledby="edit-user-title" style={styles.dialog} open>
        <form onSubmit={guardarCambios} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={styles.header}>
            <h3 id="edit-user-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-user-edit" style={{ fontSize: '1.5rem' }} aria-hidden="true"></i>
              </div>
              <span>Editar Usuario</span>
            </h3>
            <p style={{ margin: '0.5rem 0 0 4rem', opacity: 0.9, fontSize: '0.95rem' }}>
              {usuario?.username || 'Usuario'}
            </p>
          </div>

          <div style={styles.sectionWrapper}>
            <div style={styles.card('4px solid #3b82f6')}>
              <h4 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-id-card" style={{ color: '#3b82f6' }} aria-hidden="true"></i>
                <span>Información Personal</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <Field id="firstName-edit" label="Primer nombre" iconClass="fa-solid fa-user">
                  <input id="firstName-edit" name="firstName" type="text" value={form.firstName} onChange={handleChange} style={styles.inputBase}
                    onFocus={(e) => applyFocus(e, '#3b82f6', 'rgba(59, 130, 246, 0.1)')} onBlur={applyBlur} />
                </Field>

                <Field id="secondName-edit" label="Segundo nombre" iconClass="fa-solid fa-user">
                  <input id="secondName-edit" name="secondName" type="text" value={form.secondName} onChange={handleChange} style={styles.inputBase}
                    onFocus={(e) => applyFocus(e, '#3b82f6', 'rgba(59, 130, 246, 0.1)')} onBlur={applyBlur} />
                </Field>

                <Field id="surname-edit" label="Primer apellido" iconClass="fa-solid fa-user">
                  <input id="surname-edit" name="surname" type="text" value={form.surname} onChange={handleChange} style={styles.inputBase}
                    onFocus={(e) => applyFocus(e, '#3b82f6', 'rgba(59, 130, 246, 0.1)')} onBlur={applyBlur} />
                </Field>

                <Field id="secondSurname-edit" label="Segundo apellido" iconClass="fa-solid fa-user">
                  <input id="secondSurname-edit" name="secondSurname" type="text" value={form.secondSurname} onChange={handleChange} style={styles.inputBase}
                    onFocus={(e) => applyFocus(e, '#3b82f6', 'rgba(59, 130, 246, 0.1)')} onBlur={applyBlur} />
                </Field>
              </div>
            </div>

            <div style={styles.card('4px solid #10b981')}>
              <h4 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-key" style={{ color: '#10b981' }} aria-hidden="true"></i>
                <span>Información de Cuenta</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <Field id="email-edit" label="Correo electrónico" iconClass="fa-solid fa-envelope">
                  <input id="email-edit" name="email" type="email" value={form.email} onChange={handleChange} style={styles.inputBase}
                    onFocus={(e) => applyFocus(e, '#10b981', 'rgba(16, 185, 129, 0.1)')} onBlur={applyBlur} />
                </Field>

                <Field id="username-edit" label="Nombre de usuario" iconClass="fa-solid fa-at">
                  <input id="username-edit" name="username" type="text" value={form.username} onChange={handleChange} style={styles.inputBase}
                    onFocus={(e) => applyFocus(e, '#10b981', 'rgba(16, 185, 129, 0.1)')} onBlur={applyBlur} />
                </Field>

                <div>
                  <label htmlFor="role-edit" style={styles.label}>
                    <i className="fa-solid fa-shield-alt" style={{ color: '#10b981', fontSize: '0.875rem' }} aria-hidden="true"></i>
                    <span>Rol <span style={{ color: '#ef4444' }}>*</span></span>
                  </label>

                  {rolesForbidden ? (
                    <div style={{ color: '#ef4444', padding: '0.875rem 1rem', background: '#fee2e2', borderRadius: '10px', border: '2px solid #fecaca' }}>
                      <i className="fa-solid fa-lock icon-gap" aria-hidden="true"></i>
                      <span>No tienes permiso para ver roles</span>
                    </div>
                  ) : (
                    <select id="role-edit" name="role" value={form.role} onChange={handleChange} required style={styles.inputBase}
                      onFocus={(e) => applyFocus(e, '#10b981', 'rgba(16, 185, 129, 0.1)')} onBlur={applyBlur}>
                      <option value="" disabled>Seleccione un rol</option>
                      {Array.isArray(rolesDisponibles) && rolesDisponibles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.card('4px solid #f59e0b')}>
              <button type="button" onClick={() => setMostrarCambiarPassword(!mostrarCambiarPassword)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: mostrarCambiarPassword ? '1.5rem' : 0, background: 'transparent', border: 'none', padding: 0, width: '100%'
              }}>
                <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-lock" style={{ color: '#f59e0b' }} aria-hidden="true"></i>
                  <span>Cambiar Contraseña</span>
                </h4>
                <i className={`fa-solid fa-chevron-${mostrarCambiarPassword ? 'up' : 'down'}`} style={{ color: '#6b7280' }} aria-hidden="true"></i>
              </button>

              {mostrarCambiarPassword && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <Field id="new-password-edit" label="Nueva contraseña" iconClass="fa-solid fa-key">
                    <input id="new-password-edit" name="new" type="password" value={passwords.new} onChange={handlePasswordChange}
                      placeholder="Dejar vacío para no cambiar" style={styles.inputBase}
                      onFocus={(e) => applyFocus(e, '#f59e0b', 'rgba(245, 158, 11, 0.1)')} onBlur={applyBlur} />
                  </Field>

                  <Field id="confirm-password-edit" label="Confirmar contraseña" iconClass="fa-solid fa-check">
                    <input id="confirm-password-edit" name="confirm" type="password" value={passwords.confirm} onChange={handlePasswordChange}
                      placeholder="Repite la contraseña" style={styles.inputBase}
                      onFocus={(e) => applyFocus(e, '#f59e0b', 'rgba(245, 158, 11, 0.1)')} onBlur={applyBlur} />
                  </Field>
                </div>
              )}
            </div>
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={() => closeModal('editUserModal')} style={{
              padding: '0.875rem 1.5rem', border: '2px solid #e5e7eb', borderRadius: '10px', backgroundColor: 'white', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = '#f3f4f6'; e.target.style.borderColor = '#d1d5db'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.borderColor = '#e5e7eb'; }}>
              <i className="fa-solid fa-times" aria-hidden="true"></i>
              <span>Cancelar</span>
            </button>

            <button type="submit" style={{
              padding: '0.875rem 1.5rem', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
            }}
              onMouseEnter={(e) => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 12px -1px rgba(59, 130, 246, 0.4)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)'; }}>
              <i className="fa-solid fa-save" aria-hidden="true"></i>
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
