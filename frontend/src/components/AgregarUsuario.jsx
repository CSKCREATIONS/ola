import React, { useState, useEffect } from "react";
import { registerModalUsuario } from "../funciones/modalController";
import Swal from "sweetalert2";
import api from '../api/axiosConfig';

export default function AgregarUsuario() {
  const [isVisible, setIsVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [surname, setSurname] = useState('');
  const [secondSurname, setSecondSurname] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [rolesSeleccionados, setRolesSeleccionados] = useState([]);
  const [cargandoRoles, setCargandoRoles] = useState(true);
  const [rolesForbidden, setRolesForbidden] = useState(false);

  // Función para cerrar el modal
  const closeModal = () => {
    setIsVisible(false);
  };

  // Registrar el modal al montar el componente
  useEffect(() => {
    registerModalUsuario(setIsVisible);
  }, []);

  // Función para abrir el modal (puede ser llamada desde el componente padre)
  window.openModalUsuario = () => {
    setIsVisible(true);
  };

  const toggleRole = (roleName) => {
    setRolesSeleccionados(prev => {
      if (prev.includes(roleName)) {
        return prev.filter(r => r !== roleName);
      } else {
        return [...prev, roleName];
      }
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('🔍 AgregarUsuario: Iniciando carga de roles...');
    console.log('🔑 Token disponible:', !!token);

    if (!token) {
      console.error('❌ No hay token disponible');
      setRolesDisponibles([]);
      setCargandoRoles(false);
      return;
    }

    setCargandoRoles(true);

    (async () => {
      try {
        // Check cached user permissions to avoid unauthorized /api/roles calls
        const rawUser = localStorage.getItem('user');
        let permisos = [];
        try {
          const parsed = rawUser ? JSON.parse(rawUser) : null;
          permisos = parsed && parsed.permissions ? parsed.permissions : [];
        } catch (e) {
          console.warn('⚠️ AgregarUsuario: no se pudo parsear localStorage.user', e);
        }

        // Attempt to fetch roles even if permisos doesn't include roles.ver. The server
        // may still return them (e.g., admin token) or return 403. We'll handle 403
        // gracefully and surface a message to the user.
        try {
          const res = await api.get('/api/roles');
          const data = res.data || res;
          const roles = Array.isArray(data) ? data : (data.roles || data.data || []);
          console.log('📋 Respuesta del servidor roles:', roles);
          setRolesDisponibles(roles);
          setRolesForbidden(false);
        } catch (err) {
          // If the server forbids access, show a friendly message instead of noisy errors
          if (err && err.response && err.response.status === 403) {
            console.debug('403 al obtener /api/roles — el usuario no tiene permiso para ver roles');
            setRolesDisponibles([]);
            setRolesForbidden(true);
          } else {
            console.error('❌ Error al cargar roles:', err);
            setRolesDisponibles([]);
            setRolesForbidden(false);
          }
        }
      } catch (err) {
        console.error('❌ Error al cargar roles (outer):', err);
        setRolesDisponibles([]);
      } finally {
        setCargandoRoles(false);
      }
    })();
  }, []);

  //genera password automaticamente
  const generarPassword = () => {
    const letrasMayus = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letrasMinus = 'abcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';

    const mayus = letrasMayus.charAt(Math.floor(Math.random() * letrasMayus.length)) +
      letrasMayus.charAt(Math.floor(Math.random() * letrasMayus.length));
    const resto = (letrasMinus + numeros)
      .split('')
      .sort(() => 0.5 - Math.random())
      .slice(0, 4)
      .join('');

    return (mayus + resto).split('').sort(() => 0.5 - Math.random()).join('');
  };


  //genera nombre de usuario automaticamente con prefigo jla
  const generarUsername = () => {
    const random = Math.floor(100 + Math.random() * 900);
    return `jla${random}`;
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    const usuarioNombre = generarUsername()
    const nuevaPassword = generarPassword();
    const usuario = {
      firstName,
      secondName,
      surname,
      secondSurname,
      email,
      username: usuarioNombre,
      password: nuevaPassword,
      role
    };

    try {
      const res = await api.post('/api/users', usuario);
      const data = res.data || res;
      if (res.status >= 200 && res.status < 300) {
        console.log('Password generada: ', nuevaPassword)
        Swal.fire({
          title: 'Usuario creado correctamente',
          html: `
            <p><strong>Nombre de usuario:</strong> ${usuarioNombre}</p>
            <p><strong>Contraseña:</strong> ${nuevaPassword}</p>`,
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });

        closeModal();
      } else {
        Swal.fire({
          text: data.message || 'Error al crear usuario',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('Error al enviar usuario:', error);
      Swal.fire({
        text: 'Error del servidor',
        icon: 'error'
      });
    }
  };

  return (
    <>
      {isVisible && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          margin: 0,
          padding: 0
        }}>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }} style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            maxWidth: '1200px',
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
          }}>
          {/* Header del modal */}
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white',
            padding: '2rem',
            borderRadius: '20px 20px 0 0'
          }}>
            <h3 style={{ 
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
                <i className="fa-solid fa-user-plus" style={{ fontSize: '1.5rem' }}></i>
              </div>
              Crear Nuevo Usuario
            </h3>
            <p style={{ 
              margin: '0.5rem 0 0 4rem', 
              opacity: 0.9, 
              fontSize: '0.95rem' 
            }}>
              Complete la información del nuevo usuario del sistema
            </p>
          </div>

          {/* Contenido scrolleable */}
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: '2.5rem',
            backgroundColor: '#f8fafc'
          }}>
            {/* Información personal */}
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #3b82f6'
            }}>
              <h4 style={{
                margin: '0 0 1.5rem 0',
                color: '#1e293b',
                fontSize: '1.1rem',
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
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                marginBottom: '2rem'
              }}>
                <div>
                  <label htmlFor="firstName-agregar" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-user" style={{ color: '#10b981', fontSize: '0.9rem' }}></i>
                    Primer Nombre
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    id="firstName-agregar"
                    className='entrada' 
                    type="text" 
                    autoFocus 
                    value={firstName} 
                    onChange={e => setFirstName(e.target.value)} 
                    required
                    placeholder="Ingrese el primer nombre"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#ffffff',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
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
                  <label htmlFor="secondName-agregar" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-user" style={{ color: '#10b981', fontSize: '0.9rem' }}></i>
                    Segundo Nombre
                  </label>
                  <input 
                    id="secondName-agregar"
                    className='entrada' 
                    type="text" 
                    value={secondName} 
                    onChange={e => setSecondName(e.target.value)}
                    placeholder="Segundo nombre (opcional)"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#ffffff',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
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

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem'
              }}>
                <div>
                  <label htmlFor="surname-agregar" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-user" style={{ color: '#f59e0b', fontSize: '0.9rem' }}></i>
                    Primer Apellido
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    id="surname-agregar"
                    className='entrada' 
                    type="text" 
                    value={surname} 
                    onChange={e => setSurname(e.target.value)} 
                    required
                    placeholder="Ingrese el primer apellido"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#ffffff',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
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
                  <label htmlFor="secondSurname-agregar" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-user" style={{ color: '#f59e0b', fontSize: '0.9rem' }}></i>
                    Segundo Apellido
                  </label>
                  <input 
                    id="secondSurname-agregar"
                    className='entrada' 
                    type="text" 
                    value={secondSurname} 
                    onChange={e => setSecondSurname(e.target.value)}
                    placeholder="Segundo apellido (opcional)"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#ffffff',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
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

            {/* Información de la cuenta */}
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #10b981'
            }}>
              <h4 style={{
                margin: '0 0 1.5rem 0',
                color: '#1e293b',
                fontSize: '1.1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fa-solid fa-cog" style={{ color: '#10b981' }}></i>
                Configuración de la Cuenta
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem'
              }}>
                <div>
                  <label htmlFor="role-agregar" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-shield-alt" style={{ color: '#8b5cf6', fontSize: '0.9rem' }}></i>
                    Rol del Usuario
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select 
                    id="role-agregar"
                    className='entrada' 
                    value={role} 
                    onChange={e => setRole(e.target.value)} 
                    required
                    disabled={cargandoRoles}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      backgroundColor: cargandoRoles ? '#f3f4f6' : '#ffffff',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      opacity: cargandoRoles ? 0.6 : 1
                    }}
                    onFocus={(e) => {
                      if (!cargandoRoles) {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="" disabled>
                      {cargandoRoles ? 'Cargando roles...' : 'Seleccione un rol'}
                    </option>
                    {cargandoRoles ? (
                      <option disabled>Cargando...</option>
                    ) : rolesDisponibles.length === 0 ? (
                      <option disabled>No hay roles disponibles</option>
                    ) : (
                      rolesDisponibles
                        .filter(r => r.enabled !== false) // Solo mostrar roles habilitados
                        .map(r => (
                          <option key={r._id} value={r.name}>
                            {r.name}
                          </option>
                        ))
                    )}
                  </select>
                  
                  {/* Información de debug para roles */}
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#6b7280'
                  }}>
                    {cargandoRoles ? (
                      <span style={{ color: '#3b82f6' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                        Cargando roles...
                      </span>
                    ) : rolesDisponibles.length === 0 ? (
                      rolesForbidden ? (
                        <span style={{ color: '#ef4444' }}>
                          <i className="fa-solid fa-lock" style={{ marginRight: '0.5rem' }}></i>
                          No tienes permiso para ver la lista de roles.
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444' }}>
                          <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                          No se encontraron roles. Verifica tu conexión o permisos.
                        </span>
                      )
                    ) : (
                      <span style={{ color: '#10b981' }}>
                        <i className="fa-solid fa-check-circle" style={{ marginRight: '0.5rem' }}></i>
                        {rolesDisponibles.filter(r => r.enabled !== false).length} roles disponibles
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email-agregar" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-envelope" style={{ color: '#ef4444', fontSize: '0.9rem' }}></i>
                    Correo Electrónico
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    id="email-agregar"
                    className='entrada' 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required
                    placeholder="usuario@ejemplo.com"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#ffffff',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
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

              {/* Nota informativa */}
              <div style={{
                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '1.5rem',
                marginTop: '2rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#0c4a6e',
                  fontSize: '0.9rem'
                }}>
                  <i className="fa-solid fa-info-circle" style={{ color: '#0284c7' }}></i>
                  <strong>Información importante:</strong>
                </div>
                <p style={{
                  margin: '0.5rem 0 0 0',
                  color: '#0c4a6e',
                  fontSize: '0.85rem',
                  lineHeight: '1.4'
                }}>
                  Se generarán automáticamente un nombre de usuario y una contraseña temporal para el nuevo usuario. 
                  Estos datos se mostrarán al completar el registro.
                </p>
              </div>
            </div>

            </div> {/* Fin del contenido scrolleable */}

            {/* Botones de acción */}
            <div style={{ 
              display: 'flex', 
              gap: '1.5rem', 
              justifyContent: 'flex-end',
              padding: '2rem 2.5rem',
              borderTop: '2px solid #e5e7eb',
              backgroundColor: 'white',
              borderRadius: '0 0 20px 20px',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => closeModal()}
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
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
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
                <i className="fa-solid fa-user-plus"></i>
                Crear Usuario
              </button>
            </div>
        </form>
        </div>
      )}
    </>
  );
}
