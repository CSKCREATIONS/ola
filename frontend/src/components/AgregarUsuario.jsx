import { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from 'prop-types';
/* global globalThis */
import { registerModalUsuario } from "../funciones/modalController";
import Swal from "sweetalert2";
import api from '../api/axiosConfig';
import { randomInt } from '../utils/secureRandom';

const STYLES = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    backdropFilter: 'blur(4px)', margin: 0, padding: 0
  },
  form: {
    backgroundColor: 'white', borderRadius: '20px', maxWidth: '1200px',
    width: '95%', maxHeight: '95vh', overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    animation: 'modalSlideIn 0.3s ease-out', margin: 0, padding: 0,
    position: 'relative', display: 'flex', flexDirection: 'column'
  },
  header: {
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white',
    padding: '2rem', borderRadius: '20px 20px 0 0'
  },
  sectionCard: (accent) => ({
    background: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '2rem',
    border: '1px solid #e2e8f0', borderLeft: `4px solid ${accent}`
  }),
  inputBase: (disabled) => ({
    width: '100%', padding: '0.875rem 1rem', border: '2px solid #e5e7eb',
    borderRadius: '10px', fontSize: '1rem', transition: 'all 0.3s ease',
    backgroundColor: disabled ? '#f3f4f6' : '#ffffff', fontFamily: 'inherit',
    boxSizing: 'border-box'
  }),
  footer: {
    display: 'flex', gap: '1.5rem', justifyContent: 'flex-end',
    padding: '2rem 2.5rem', borderTop: '2px solid #e5e7eb', backgroundColor: 'white',
    borderRadius: '0 0 20px 20px', flexShrink: 0
  }
};
function FieldLabel({ htmlFor, children, iconColor, iconClass = 'fa-solid fa-user' }) {
  return (
    <label htmlFor={htmlFor} style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem',
      fontWeight: '600', color: '#374151', fontSize: '0.95rem'
    }}>
      <i className={iconClass} style={{ color: iconColor, fontSize: '0.9rem' }} aria-hidden={true}></i>
      <span>{children}</span>
    </label>
  );
}

FieldLabel.propTypes = {
  htmlFor: PropTypes.string,
  children: PropTypes.node,
  iconColor: PropTypes.string,
  iconClass: PropTypes.string
};

FieldLabel.defaultProps = {
  iconClass: 'fa-solid fa-user',
  iconColor: undefined
};


function TextInput({ id, type = 'text', value, onChange, placeholder, required, autoFocus }) {
  return (
    <input
      id={id}
      className='entrada'
      type={type}
      autoFocus={autoFocus}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      style={STYLES.inputBase(false)}
      onFocus={(e) => {
        e.target.style.borderColor = '#3b82f6';
        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#e5e7eb';
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}

TextInput.propTypes = {
  id: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  autoFocus: PropTypes.bool
};

TextInput.defaultProps = {
  id: undefined,
  type: 'text',
  value: '',
  onChange: () => {},
  placeholder: '',
  required: false,
  autoFocus: false
};

function SelectInput({ id, value, onChange, disabled, children, placeholderText }) {
  return (
    <select
      id={id}
      className='entrada'
      value={value}
      onChange={onChange}
      required
      disabled={disabled}
      style={STYLES.inputBase(disabled)}
      onFocus={(e) => {
        if (!disabled) {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        }
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#e5e7eb';
        e.target.style.boxShadow = 'none';
      }}
    >
      <option value="" disabled>{placeholderText}</option>
      {children}
    </select>
  );
}

SelectInput.propTypes = {
  id: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  children: PropTypes.node,
  placeholderText: PropTypes.string
};

SelectInput.defaultProps = {
  id: undefined,
  value: '',
  onChange: () => {},
  disabled: false,
  children: null,
  placeholderText: ''
};

export default function AgregarUsuario() {
  const [isVisible, setIsVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [surname, setSurname] = useState('');
  const [secondSurname, setSecondSurname] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [cargandoRoles, setCargandoRoles] = useState(true);
  const [rolesForbidden, setRolesForbidden] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const closeModal = useCallback(() => setIsVisible(false), []);

  useEffect(() => registerModalUsuario(setIsVisible), []);

  useEffect(() => {
    // expose opener in window once
    if (globalThis?.window) globalThis.window.openModalUsuario = () => setIsVisible(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token');
    setCargandoRoles(true);

    if (!token) {
      setRolesDisponibles([]);
      setCargandoRoles(false);
      return;
    }

    (async () => {
      try {
        try {
          const res = await api.get('/api/roles');
          if (!mounted) return;
          const data = res.data || res;
          const roles = Array.isArray(data) ? data : (data.roles || data.data || []);
          setRolesDisponibles(roles);
          setRolesForbidden(false);
        } catch (err) {
          if (!mounted) return;
          if (err?.response?.status === 403) {
            setRolesDisponibles([]);
            setRolesForbidden(true);
          } else {
            setRolesDisponibles([]);
            setRolesForbidden(false);
            console.error('Error al cargar roles:', err);
          }
        }
      } finally {
        if (mounted) setCargandoRoles(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const generarPassword = useCallback(() => {
    const secureRandomInt = randomInt;
    const mayus = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const minus = 'abcdefghijklmnopqrstuvwxyz';
    const nums = '0123456789';

    const pick = (s) => s.charAt(secureRandomInt(s.length));
    const twoUpper = pick(mayus) + pick(mayus);

    const pool = (minus + nums).split('');
    for (let i = pool.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const resto = pool.slice(0, 4).join('');
    const combined = (twoUpper + resto).split('');
    for (let i = combined.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    return combined.join('');
  }, []);

  const generarUsername = useCallback(() => {
    const secureRandomInt = randomInt;
    const random = 100 + secureRandomInt(900);
    return `jla${random}`;
  }, []);

  const rolesFiltered = useMemo(() => rolesDisponibles.filter(r => r.enabled !== false), [rolesDisponibles]);

  const roleOptions = useMemo(() => {
    if (cargandoRoles) return [<option key="loading" disabled>Cargando...</option>];
    if (rolesDisponibles.length === 0) return [<option key="none" disabled>No hay roles disponibles</option>];
    return rolesFiltered.map(r => <option key={r._id} value={r.name}>{r.name}</option>);
  }, [cargandoRoles, rolesDisponibles, rolesFiltered]);

  const rolesInfo = useMemo(() => {
    if (cargandoRoles) {
      return (
        <span style={{ color: '#3b82f6' }}>
          <i className="fa-solid fa-spinner fa-spin icon-gap" aria-hidden={true}></i>
          <span>Cargando roles...</span>
        </span>
      );
    }
    if (rolesDisponibles.length === 0) {
      return rolesForbidden ? (
        <span style={{ color: '#ef4444' }}>
          <i className="fa-solid fa-lock icon-gap" aria-hidden={true}></i>
          <span>No tienes permiso para ver la lista de roles.</span>
        </span>
      ) : (
        <span style={{ color: '#ef4444' }}>
          <i className="fa-solid fa-exclamation-triangle icon-gap" aria-hidden={true}></i>
          <span>No se encontraron roles. Verifica tu conexión o permisos.</span>
        </span>
      );
    }
    return (
      <span style={{ color: '#10b981' }}>
        <i className="fa-solid fa-check-circle icon-gap" aria-hidden={true}></i>
        <span>{rolesFiltered.length} roles disponibles</span>
      </span>
    );
  }, [cargandoRoles, rolesDisponibles, rolesForbidden, rolesFiltered]);

  const handleSubmit = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (submitting) return;

    const usuarioNombre = generarUsername();
    const nuevaPassword = generarPassword();
    const usuario = {
      firstName,
      secondName,
      surname,
      secondSurname,
      email,
      username: usuarioNombre,
      password: nuevaPassword,
      role // must be role name string (backend expects a string)
    };

    setSubmitting(true);
    try {
      const res = await api.post('/api/users', usuario);
      // axios resolves only for 2xx; treat as success
      Swal.fire({
        title: 'Usuario creado correctamente',
        html: `<p><strong>Nombre de usuario:</strong> ${usuarioNombre}</p>
               <p><strong>Contraseña:</strong> ${nuevaPassword}</p>`,
        icon: 'success', confirmButtonText: 'Aceptar'
      });
      closeModal();
    } catch (err) {
      console.error('Error al enviar usuario:', err);
      const serverMessage = err?.response?.data?.message || err?.message || 'Error del servidor';
      Swal.fire({ text: serverMessage, icon: 'error' });
    } finally {
      setSubmitting(false);
    }
  }, [firstName, secondName, surname, secondSurname, email, role, generarUsername, generarPassword, closeModal, submitting]);

  if (!isVisible) return null;

  return (
    <div style={STYLES.overlay}>
      <form onSubmit={handleSubmit} style={STYLES.form}>
        <div style={STYLES.header}>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-user-plus" style={{ fontSize: '1.5rem' }} aria-hidden={true}></i>
            </div>
            <span>Crear Nuevo Usuario</span>
          </h3>
          <p style={{ margin: '0.5rem 0 0 4rem', opacity: 0.9, fontSize: '0.95rem' }}>
            Complete la información del nuevo usuario del sistema
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem', backgroundColor: '#f8fafc' }}>
          <div style={STYLES.sectionCard('#3b82f6')}>
            <h4 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-id-card" style={{ color: '#3b82f6' }} aria-hidden={true}></i>
              <span>Información Personal</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <FieldLabel htmlFor="firstName-agregar" iconColor="#10b981">Primer Nombre <span style={{ color: '#ef4444' }}>*</span></FieldLabel>
                <TextInput id="firstName-agregar" value={firstName} onChange={e => setFirstName(e.target.value)} required autoFocus placeholder="Ingrese el primer nombre" />
              </div>
              <div>
                <FieldLabel htmlFor="secondName-agregar" iconColor="#10b981">Segundo Nombre</FieldLabel>
                <TextInput id="secondName-agregar" value={secondName} onChange={e => setSecondName(e.target.value)} placeholder="Segundo nombre (opcional)" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <FieldLabel htmlFor="surname-agregar" iconColor="#f59e0b">Primer Apellido <span style={{ color: '#ef4444' }}>*</span></FieldLabel>
                <TextInput id="surname-agregar" value={surname} onChange={e => setSurname(e.target.value)} required placeholder="Ingrese el primer apellido" />
              </div>
              <div>
                <FieldLabel htmlFor="secondSurname-agregar" iconColor="#f59e0b">Segundo Apellido</FieldLabel>
                <TextInput id="secondSurname-agregar" value={secondSurname} onChange={e => setSecondSurname(e.target.value)} placeholder="Segundo apellido (opcional)" />
              </div>
            </div>
          </div>

          <div style={STYLES.sectionCard('#10b981')}>
            <h4 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-cog" style={{ color: '#10b981' }} aria-hidden={true}></i>
              <span>Configuración de la Cuenta</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <FieldLabel htmlFor="role-agregar" iconColor="#8b5cf6" iconClass="fa-solid fa-shield-alt">Rol del Usuario <span style={{ color: '#ef4444' }}>*</span></FieldLabel>
                <SelectInput id="role-agregar" value={role} onChange={e => setRole(e.target.value)} disabled={cargandoRoles} placeholderText={cargandoRoles ? 'Cargando roles...' : 'Seleccione un rol'}>
                  {roleOptions}
                </SelectInput>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>{rolesInfo}</div>
              </div>

              <div>
                <FieldLabel htmlFor="email-agregar" iconColor="#ef4444" iconClass="fa-solid fa-envelope">Correo Electrónico <span style={{ color: '#ef4444' }}>*</span></FieldLabel>
                <TextInput id="email-agregar" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="usuario@ejemplo.com" />
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '1px solid #bae6fd', borderRadius: '8px', padding: '1.5rem', marginTop: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0c4a6e', fontSize: '0.9rem' }}>
                <i className="fa-solid fa-info-circle" style={{ color: '#0284c7' }} aria-hidden={true}></i>
                <strong>Información importante:</strong>
              </div>
              <p style={{ margin: '0.5rem 0 0 0', color: '#0c4a6e', fontSize: '0.85rem', lineHeight: '1.4' }}>
                Se generarán automáticamente un nombre de usuario y una contraseña temporal para el nuevo usuario. Estos datos se mostrarán al completar el registro.
              </p>
            </div>
          </div>
        </div>

        <div style={STYLES.footer}>
          <button type="button" onClick={closeModal} style={{
            padding: '0.875rem 1.5rem', border: '2px solid #e5e7eb', borderRadius: '10px',
            backgroundColor: 'white', color: '#374151', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem',
            transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
          onMouseEnter={(e) => { e.target.style.backgroundColor = '#f3f4f6'; e.target.style.borderColor = '#d1d5db'; }}
          onMouseLeave={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.borderColor = '#e5e7eb'; }}>
            <i className="fa-solid fa-times" aria-hidden={true}></i>
            <span>Cancelar</span>
          </button>

          <button
            type="submit"
            
            disabled={submitting || cargandoRoles}
            style={{
              padding: '0.875rem 1.5rem', border: 'none', borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white',
              cursor: submitting || cargandoRoles ? 'not-allowed' : 'pointer',
              opacity: submitting || cargandoRoles ? 0.7 : 1,
              fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.3s ease', display: 'flex',
              alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => { if (!(submitting || cargandoRoles)) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 12px -1px rgba(59, 130, 246, 0.4)'; } }}
            onMouseLeave={(e) => { if (!(submitting || cargandoRoles)) { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)'; } }}
          >
            {submitting ? (
              <i className="fa-solid fa-spinner fa-spin" aria-hidden={true}></i>
            ) : (
              <i className="fa-solid fa-user-plus" aria-hidden={true}></i>
            )}
            <span>{submitting ? 'Creando...' : 'Crear Usuario'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
