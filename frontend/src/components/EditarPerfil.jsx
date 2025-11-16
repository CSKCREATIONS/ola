import React, { useEffect, useState, useCallback, useMemo } from 'react';
/* global globalThis */
import Swal from 'sweetalert2';
import { closeModal } from '../funciones/animaciones';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

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
    padding: '1rem'
  },
  dialog: {
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
  },
  header: {
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: 'white',
    padding: '2rem',
    borderRadius: '20px 20px 0 0'
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '2rem',
    backgroundColor: '#f8fafc'
  },
  section: (accent) => ({
    background: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    border: '1px solid #e2e8f0',
    borderLeft: `4px solid ${accent}`
  }),
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#374151',
    fontSize: '0.95rem'
  },
  input: {
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
  footer: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    padding: '2rem',
    borderTop: '2px solid #e5e7eb',
    backgroundColor: 'white',
    borderRadius: '0 0 20px 20px'
  },
  btnCancel: {
    padding: '0.875rem 1.5rem',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    backgroundColor: 'white',
    color: '#374151',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  btnSave: {
    padding: '0.875rem 1.5rem',
    border: 'none',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3)'
  }
};
function TextInput({
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  focusColor,
  focusBox,
  style = {}
}) {
  const handleFocus = useCallback((e) => {
    const color = focusColor || '#6366f1';
    const box = focusBox || 'rgba(99, 102, 241, 0.1)';
    if (e?.target?.style) {
      e.target.style.borderColor = color;
      e.target.style.boxShadow = `0 0 0 3px ${box}`;
    }
  }, [focusColor, focusBox]);

  const handleBlur = useCallback((e) => {
    if (e?.target?.style) {
      e.target.style.borderColor = '#e5e7eb';
      e.target.style.boxShadow = 'none';
    } else {
      // If style is not available, optionally log for debugging:
      // console.warn('handleBlur: event target has no style property', e);
    }
  }, []);

  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{ ...styles.input, ...(disabled ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' } : {}), ...style }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-focus-color={focusColor}
      data-focus-box={focusBox}
    />
  );
}

TextInput.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  focusColor: PropTypes.string,
  focusBox: PropTypes.string,
  style: PropTypes.object
};

TextInput.defaultProps = {
  id: undefined,
  name: undefined,
  type: 'text',
  value: '',
  onChange: () => {},
  placeholder: undefined,
  disabled: false,
  focusColor: undefined,
  focusBox: undefined,
  style: {}
};


function Section({ titleIcon, title, accent = '#6366f1', children, collapsible = false, open = true, onToggle }) {
  return (
    <div style={styles.section(accent)}>
      {collapsible ? (
        <button
          type="button"
          onClick={onToggle}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: open ? '1.5rem' : 0, background: 'transparent', border: 'none', padding: 0, width: '100%' }}
        >
          <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.05rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className={titleIcon} style={{ color: accent }} aria-hidden />
            <span>{title}</span>
          </h4>
          <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} style={{ color: '#6b7280' }} aria-hidden />
        </button>
      ) : (
        <h4 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.05rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className={titleIcon} style={{ color: accent }} aria-hidden />
          <span>{title}</span>
        </h4>
      )}

      {children}
    </div>
  );
}

Section.propTypes = {
  titleIcon: PropTypes.string,
  title: PropTypes.string,
  accent: PropTypes.string,
  children: PropTypes.node,
  collapsible: PropTypes.bool,
  open: PropTypes.bool,
  onToggle: PropTypes.func
};

Section.defaultProps = {
  titleIcon: undefined,
  title: undefined,
  accent: '#6366f1',
  children: null,
  collapsible: false,
  open: true,
  onToggle: () => {}
};

export default function EditarPerfil() {
  const [form, setForm] = useState({});
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [mostrarCambiarPassword, setMostrarCambiarPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : null;
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') closeModal('editar-perfil');
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  }, []);

  const guardarCambios = useCallback(
    async (e) => {
      e.preventDefault();
      const user = JSON.parse(localStorage.getItem('user') || '{}');

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
        if (!(res.status >= 200 && res.status < 300)) throw new Error(resData.message || 'Error al actualizar el perfil');

        if (passwords.new && passwords.confirm && passwords.new === passwords.confirm) {
          const resPassword = await api.patch('/api/users/change-password', { newPassword: passwords.new });
          const data = resPassword.data || resPassword;
          if (!(resPassword.status >= 200 && resPassword.status < 300)) throw new Error(data.message || 'Error al cambiar la contraseña');

          await Swal.fire({
            title: 'Contraseña actualizada',
            text: 'Tu sesión expirará. Debes iniciar sesión nuevamente.',
            icon: 'info',
            confirmButtonText: 'OK'
          });
          navigate('/');
          return;
        }

        const updatedUser = { ...user, ...form, role: user.role };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        globalThis.dispatchEvent(new Event('storage'));

        Swal.fire('Éxito', 'Perfil actualizado correctamente', 'success');
        closeModal('editar-perfil');
        setPasswords({ new: '', confirm: '' });
        setMostrarCambiarPassword(false);
      } catch (err) {
        Swal.fire('Error', err.message || 'Error', 'error');
      }
    },
    [form, passwords, navigate]
  );

  const gridCommon = useMemo(
    () => ({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }),
    []
  );

  return (
    <div
      id="editar-perfil"
      aria-hidden="true"
      style={styles.overlay}
      onClick={(e) => {
        if (e.target.id === 'editar-perfil') closeModal('editar-perfil');
      }}
    >
      <dialog aria-modal="true" aria-labelledby="edit-profile-title" style={styles.dialog} open>
        <form onSubmit={guardarCambios} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={styles.header}>
            <h3 id="edit-profile-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-user-circle" style={{ fontSize: '1.5rem' }} aria-hidden />
              </div>
              <span>Editar Mi Perfil</span>
            </h3>
            <p style={{ margin: '0.5rem 0 0 4rem', opacity: 0.9, fontSize: '0.95rem' }}>Actualiza tu información personal</p>
          </div>

          <div style={styles.content}>
            <Section titleIcon="fa-solid fa-id-card" title="Información Personal" accent="#6366f1">
              <div style={gridCommon}>
                <div>
                  <label htmlFor="firstName" style={styles.label}><i className="fa-solid fa-user" style={{ color: '#6366f1', fontSize: '0.875rem' }} aria-hidden /><span>Primer nombre</span></label>
                  <TextInput id="firstName" name="firstName" value={form.firstName || ''} onChange={handleChange} focusColor="#6366f1" focusBox="rgba(99, 102, 241, 0.1)" />
                </div>

                <div>
                  <label htmlFor="secondName" style={styles.label}><i className="fa-solid fa-user" style={{ color: '#6366f1', fontSize: '0.875rem' }} aria-hidden /><span>Segundo nombre</span></label>
                  <TextInput id="secondName" name="secondName" value={form.secondName || ''} onChange={handleChange} focusColor="#6366f1" focusBox="rgba(99, 102, 241, 0.1)" />
                </div>

                <div>
                  <label htmlFor="surname" style={styles.label}><i className="fa-solid fa-user" style={{ color: '#6366f1', fontSize: '0.875rem' }} aria-hidden /><span>Primer apellido</span></label>
                  <TextInput id="surname" name="surname" value={form.surname || ''} onChange={handleChange} focusColor="#6366f1" focusBox="rgba(99, 102, 241, 0.1)" />
                </div>

                <div>
                  <label htmlFor="secondSurname" style={styles.label}><i className="fa-solid fa-user" style={{ color: '#6366f1', fontSize: '0.875rem' }} aria-hidden /><span>Segundo apellido</span></label>
                  <TextInput id="secondSurname" name="secondSurname" value={form.secondSurname || ''} onChange={handleChange} focusColor="#6366f1" focusBox="rgba(99, 102, 241, 0.1)" />
                </div>
              </div>
            </Section>

            <Section titleIcon="fa-solid fa-key" title="Información de Cuenta" accent="#10b981">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <label htmlFor="email-perfil" style={styles.label}><i className="fa-solid fa-envelope" style={{ color: '#10b981', fontSize: '0.875rem' }} aria-hidden /><span>Correo electrónico</span></label>
                  <TextInput id="email-perfil" name="email" type="email" value={form.email || ''} onChange={handleChange} focusColor="#10b981" focusBox="rgba(16, 185, 129, 0.1)" />
                </div>

                <div>
                  <label htmlFor="username-perfil" style={styles.label}><i className="fa-solid fa-at" style={{ color: '#10b981', fontSize: '0.875rem' }} aria-hidden /><span>Nombre de usuario</span></label>
                  <TextInput id="username-perfil" name="username" value={form.username || ''} onChange={handleChange} focusColor="#10b981" focusBox="rgba(16, 185, 129, 0.1)" />
                </div>

                <div>
                  <label htmlFor="role-perfil" style={styles.label}><i className="fa-solid fa-shield-alt" style={{ color: '#10b981', fontSize: '0.875rem' }} aria-hidden /><span>Rol asignado</span></label>
                  <TextInput id="role-perfil" name="role" value={form.role || ''} disabled />
                </div>
              </div>
            </Section>

            <Section titleIcon="fa-solid fa-lock" title="Cambiar Contraseña" accent="#f59e0b" collapsible open={mostrarCambiarPassword} onToggle={() => setMostrarCambiarPassword((s) => !s)}>
              {mostrarCambiarPassword && (
                <>
                  <div style={{ backgroundColor: '#fef3c7', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fde68a' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-info-circle" aria-hidden />
                      <span>Al cambiar tu contraseña, deberás iniciar sesión nuevamente</span>
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label htmlFor="new-password-perfil" style={styles.label}><i className="fa-solid fa-key" style={{ color: '#f59e0b', fontSize: '0.875rem' }} aria-hidden /><span>Nueva contraseña</span></label>
                      <TextInput id="new-password-perfil" name="new" type="password" value={passwords.new} onChange={handlePasswordChange} placeholder="Mínimo 6 caracteres" focusColor="#f59e0b" focusBox="rgba(245, 158, 11, 0.1)" />
                    </div>
                    <div>
                      <label htmlFor="confirm-password-perfil" style={styles.label}><i className="fa-solid fa-check" style={{ color: '#f59e0b', fontSize: '0.875rem' }} aria-hidden /><span>Confirmar contraseña</span></label>
                      <TextInput id="confirm-password-perfil" name="confirm" type="password" value={passwords.confirm} onChange={handlePasswordChange} placeholder="Repite la contraseña" focusColor="#f59e0b" focusBox="rgba(245, 158, 11, 0.1)" />
                    </div>
                  </div>
                </>
              )}
            </Section>
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={() => closeModal('editar-perfil')} style={styles.btnCancel}>
              <i className="fa-solid fa-times" aria-hidden />
              <span>Cancelar</span>
            </button>

            <button type="submit" style={styles.btnSave}>
              <i className="fa-solid fa-save" aria-hidden />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
