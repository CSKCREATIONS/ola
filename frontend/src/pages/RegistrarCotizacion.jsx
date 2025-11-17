import Fijo from '../components/Fijo'
import NavVentas from '../components/NavVentas'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom';
import { Editor } from "@tinymce/tinymce-react";
import { useRef, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

// Move small pure helpers to module scope to avoid re-creating them on each render
function obtenerFechaLocal(inputDate) {
  const date = new Date(inputDate);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Deterministic, linear-time email validator to avoid catastrophic backtracking
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;

  const at = trimmed.indexOf('@');
  // single @ and not first/last
  if (at <= 0 || trimmed.includes('@', at + 1)) return false;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!local || !domain) return false;

  // length constraints
  if (local.length > 64 || domain.length > 253) return false;

  // allowed char sets
  const localAllowed = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  const labelAllowed = /^[A-Za-z0-9-]+$/;

  // local checks
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if (!localAllowed.test(local)) return false;

  // domain checks
  if (domain.includes('..')) return false;
  const labels = domain.split('.');
  if (labels.length < 2) return false;

  const allLabelsValid = labels.every(lab => {
    if (!lab || lab.length > 63) return false;
    if (lab.startsWith('-') || lab.endsWith('-')) return false;
    return labelAllowed.test(lab);
  });

  return allLabelsValid;
}

export default function RegistrarCotizacion() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const descripcionRef = useRef(null);
  const condicionesPagoRef = useRef(null);
  const [productos, setProductos] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);

  // Autocompletado de cliente (buscar por nombre y completar ciudad)
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteCiudad, setClienteCiudad] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteCorreo, setClienteCorreo] = useState('');
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);


  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.get('/api/products');
        setProductos(res.data.data || res.data || []);
      } catch (err) {
        console.error('Error al cargar productos:', err);
      }
    };

    loadProducts();
  }, []);

  // Cargar clientes y prospectos (esCliente:true y esCliente:false) una sola vez
  useEffect(() => {
    const loadClientes = async () => {
      try {
        const [clientesRes, prospectosRes] = await Promise.all([
          api.get('/api/clientes'), // sólo esCliente:true
          api.get('/api/clientes/prospectos') // esCliente:false
        ]);

        const listaClientes = clientesRes.data?.data || clientesRes.data || [];
        const listaProspectos = prospectosRes.data?.data || prospectosRes.data || [];

        // Normalizar y marcar tipo
        const normalizar = (arr, esClienteFlag) => (Array.isArray(arr) ? arr.map(c => ({ ...c, esCliente: !!esClienteFlag })) : []);
        const todos = [...normalizar(listaClientes, true), ...normalizar(listaProspectos, false)];

        // De-duplicar por correo (preferir cliente real sobre prospecto si coincide)
        const dedupMap = new Map();
        for (const c of todos) {
          const key = (c.correo || '').toLowerCase().trim() || c._id;
          if (!dedupMap.has(key)) {
            dedupMap.set(key, c);
          } else {
            const existente = dedupMap.get(key);
            // Si el existente es prospecto y el nuevo es cliente, reemplazar
            if (!existente.esCliente && c.esCliente) dedupMap.set(key, c);
          }
        }
        const resultado = Array.from(dedupMap.values()).sort((a,b) => (a.nombre || '').localeCompare(b.nombre || ''));
        setClientes(resultado);
      } catch (err) {
        console.error('Error al cargar clientes y prospectos:', err);
      }
    };
    loadClientes();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const usuario = JSON.parse(storedUser);
      setUser(usuario);
    }
  }, []);

  const agregarProducto = () => {
    // create a lightweight stable id for React keys so re-orders/removals don't rely on index
    const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
    setProductosSeleccionados([...productosSeleccionados, {
      uid,
      producto: '', descripcion: '', cantidad: '', valorUnitario: '', descuento: '', valorTotal: ''
    }]);
  };

  const eliminarProducto = (index) => {
    const nuevosProductos = [...productosSeleccionados];
    nuevosProductos.splice(index, 1);
    setProductosSeleccionados(nuevosProductos);
  };

  const eliminarTodosLosProductos = () => {
    if (productosSeleccionados.length === 0) return;
    Swal.fire({
      title: '¿Eliminar todos los productos?',
      text: 'Esta acción eliminará todos los productos seleccionados de la cotización.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar todos',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        setProductosSeleccionados([]);
      }
    });
  };

  const handleProductoChange = (index, value) => {
    const producto = productos.find(p => p._id === value);
    const nuevosProductos = [...productosSeleccionados];
    nuevosProductos[index] = {
      ...nuevosProductos[index],
      producto: value,
      descripcion: producto?.description || '',
      valorUnitario: producto?.price || '',
      // store stock for this selected product so we can validate cantidad against it
      stock: producto?.stock ?? 0,
      cantidad: '',
      descuento: '',
      valorTotal: ''
    };
    setProductosSeleccionados(nuevosProductos);
  };

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const nuevosProductos = [...productosSeleccionados];
    nuevosProductos[index][name] = value;

    // Calcular subtotal y valorTotal
    const cantidadNum = Number.parseFloat(nuevosProductos[index].cantidad) || 0;
    const valorNum = Number.parseFloat(nuevosProductos[index].valorUnitario) || 0;
    const descNum = Number.parseFloat(nuevosProductos[index].descuento) || 0;
    const subtotal = cantidadNum * valorNum * (1 - descNum / 100);
    nuevosProductos[index].subtotal = subtotal.toFixed(2);
    nuevosProductos[index].valorTotal = subtotal.toFixed(2);

    setProductosSeleccionados(nuevosProductos);
  };

  const handleCancelado = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas borrar el contenido de esta cotización?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No, mantener',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        const inputIds = ['cliente', 'ciudad', 'direccion', 'telefono', 'email', 'fecha'];
        inputIds.forEach(id => {
          const input = document.getElementById(id);
          if (input) input.value = '';
        });

        setProductosSeleccionados([]);

        // limpiar estado controlado de cliente
        setClienteNombre('');
        setClienteCiudad('');
  setClienteDireccion('');
  setClienteTelefono('');
  setClienteCorreo('');
        setFilteredClientes([]);
        setShowDropdown(false);

        if (descripcionRef.current) {
          descripcionRef.current.setContent('');
        }
        if (condicionesPagoRef.current) {
          condicionesPagoRef.current.setContent('');
        }
      }
    });
  };

  
  // Helpers to reduce cognitive complexity of guardar flow
  const validarClienteYProductos = () => {
    const inputs = document.querySelectorAll('.cuadroTexto');
    const nombre = inputs[0]?.value.trim();
    const ciudad = inputs[1]?.value.trim();
    const direccion = inputs[2]?.value.trim();
    const telefono = inputs[3]?.value.trim();
    const correo = inputs[4]?.value.trim();
    const fecha = inputs[5]?.value;

    if (!nombre || !ciudad || !direccion || !telefono || !correo || !fecha) {
      Swal.fire('Error', 'Todos los campos del cliente y la fecha son obligatorios.', 'warning');
      return null;
    }

    // Use deterministic validator to avoid regex backtracking
    if (!isValidEmail(correo)) {
      Swal.fire('Error', 'El correo del cliente debe tener un formato válido.', 'warning');
      return null;
    }

    if (productosSeleccionados.length === 0) {
      Swal.fire('Error', 'Debes agregar al menos un producto a la cotización.', 'warning');
      return null;
    }

    for (const prod of productosSeleccionados) {
      if (!prod.producto || !prod.cantidad || !prod.valorUnitario) {
        Swal.fire('Error', 'Todos los productos deben tener cantidad y valor unitario.', 'warning');
        return null;
      }
    }

    return { nombre, ciudad, direccion, telefono, correo, fecha };
  };

  const construirDatosCotizacion = (clienteVals, enviarFlag) => {
    const { nombre, ciudad, direccion, telefono, correo, fecha } = clienteVals;
    const clienteData = { nombre, ciudad, direccion, telefono, correo, esCliente: false };

    return {
      cliente: { referencia: user?._id, ...clienteData },
      responsable: {
        id: user?._id,
        firstName: user?.firstName,
        secondName: user?.secondName,
        surname: user?.surname,
        secondSurname: user?.secondSurname
      },
      fecha: obtenerFechaLocal(fecha),
      descripcion: descripcionRef.current?.getContent({ format: 'html' }) || '',
      condicionesPago: condicionesPagoRef.current?.getContent({ format: 'html' }) || '',
      productos: productosSeleccionados.map(p => {
        const prodObj = productos.find(prod => prod._id === p.producto);
        return {
          producto: { id: p.producto, name: prodObj?.name || '' },
          descripcion: p.descripcion,
          cantidad: Number.parseFloat(p.cantidad || 0),
          valorUnitario: Number.parseFloat(p.valorUnitario || 0),
          descuento: Number.parseFloat(p.descuento || 0),
          subtotal: Number.parseFloat(p.valorTotal || 0)
        };
      }),
      clientePotencial: true,
      enviadoCorreo: !!enviarFlag
    };
  };

  const anexarEmpresaSiExiste = (datos) => {
    try {
      const empresaNombreEl = document.getElementById('empresa-nombre');
      const empresaNombre = empresaNombreEl ? empresaNombreEl.innerText.trim() : '';
      if (empresaNombre) datos.empresa = { nombre: empresaNombre, direccion: '' };
    } catch (err) {
      console.warn('No se pudo obtener información de la empresa desde la UI', err);
    }
  };

  const asegurarProspecto = async (correo, nombre, telefono, direccion, ciudad) => {
    try {
      const clientesRes = await api.get('/api/clientes');
      const clientes = clientesRes.data;
      const existe = Array.isArray(clientes) && clientes.some(c => (c.correo || '').toLowerCase() === correo.toLowerCase());
      if (!existe) {
        const nuevoCliente = { nombre, correo, telefono, direccion, ciudad, esCliente: false };
        const createRes = await api.post('/api/clientes', nuevoCliente);
        if (createRes.status >= 200 && createRes.status < 300) {
          Swal.fire('Prospecto creado', 'El correo no existía en la base de datos y se creó como prospecto.', 'success');
        } else {
          console.warn('No se pudo crear prospecto:', createRes.data);
        }
      }
    } catch (err) {
      console.warn('Error al verificar/crear prospecto:', err);
    }
  };

  const limpiarFormulario = () => {
    try {
      const allInputs = document.querySelectorAll('.cuadroTexto');
      // use optional chaining: querySelectorAll never returns null, but this is concise and
      // avoids a verbose length check while remaining safe if APIs change.
      allInputs?.forEach(input => { if (input) input.value = ''; });
      setProductosSeleccionados([]);
      if (descripcionRef.current) descripcionRef.current.setContent('');
      if (condicionesPagoRef.current) condicionesPagoRef.current.setContent('');
    } catch (err) {
      console.warn('No se pudieron limpiar todos los campos automáticamente:', err);
    }
  };

  const handleGuardarCotizacion = async (enviar = false, mostrarModal = false) => {
    const clienteVals = validarClienteYProductos();
    if (!clienteVals) return;

    const datosCotizacion = construirDatosCotizacion(clienteVals, enviar);
    anexarEmpresaSiExiste(datosCotizacion);

    try {
      const response = await api.post('/api/cotizaciones', datosCotizacion);
      const result = response.data;
      if (response.status < 200 || response.status >= 300) {
        Swal.fire('Error', result.message || 'No se pudo guardar la cotización.', 'error');
        return;
      }

      // Asegurar prospecto (no bloqueante para el flujo principal)
      await asegurarProspecto(clienteVals.correo, clienteVals.nombre, clienteVals.telefono, clienteVals.direccion, clienteVals.ciudad);

      const nuevaCot = result.data || result;
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cotización guardada', showConfirmButton: false, timer: 2000, timerProgressBar: true, didOpen: (toast) => { toast.addEventListener('mouseenter', Swal.stopTimer); toast.addEventListener('mouseleave', Swal.resumeTimer); } });
      navigate('/ListaDeCotizaciones', { state: { abrirFormato: true, cotizacion: nuevaCot } });

      limpiarFormulario();
    } catch (error) {
      console.error('Error en la solicitud de cotización:', error);
      Swal.fire('Error', 'Error de red al guardar cotización.', 'error');
    }
  };

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="contenido-modulo">
          <div className='encabezado-modulo'>
            <h3 className='titulo-profesional'>Registrar cotizacion</h3>
          </div>
          <br /><br />

          {/* FORMULARIO ORIGINAL A INSERTAR AQUÍ */}
          {/* ... tu formulario completo sigue aquí como ya está construido */}
          <div className="max-width">
            
            {/* Formulario moderno con diseño mejorado */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              marginBottom: '2rem'
            }}>
              {/* Header del formulario */}
              <div style={{
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '1rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{
                  margin: 0,
                  color: '#1e293b',
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <i className="fa-solid fa-user" style={{ fontSize: '1.2rem' }}></i>
                  </div>
                  Información del Cliente
                </h4>
              </div>

              {/* Grid del formulario */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                {/* Campo Cliente */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="cliente" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-building" style={{ color: '#3b82f6', fontSize: '0.9rem' }}></i><span>Nombre o Razón Social</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id='cliente'
                      type="text"
                      className="cuadroTexto"
                      placeholder="Ingrese el nombre completo o razón social"
                      value={clienteNombre}
                      onChange={(e) => {
                        const q = e.target.value;
                        setClienteNombre(q);
                        if (q && q.trim().length >= 1) {
                          const ql = q.trim().toLowerCase();
                          const matches = clientes
                            .filter(c => (c?.nombre || '').toLowerCase().includes(ql))
                            .slice(0, 10);
                          setFilteredClientes(matches);
                          setShowDropdown(matches.length > 0);
                        } else {
                          setFilteredClientes([]);
                          setShowDropdown(false);
                        }
                      }}
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
                        if (filteredClientes.length > 0) setShowDropdown(true);
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                        // pequeño retraso para permitir click en dropdown
                        setTimeout(() => setShowDropdown(false), 150);
                      }}
                    />
                    {showDropdown && filteredClientes.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: 50,
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderTop: 'none',
                          borderRadius: '0 0 10px 10px',
                          maxHeight: '240px',
                          overflowY: 'auto',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                        }}
                      >
                        {filteredClientes.map((c) => (
                          <button
                            type="button"
                            key={c._id}
                            onMouseDown={(ev) => { ev.preventDefault(); }}
                            onClick={() => {
                              setClienteNombre(c.nombre || '');
                              const ciudad = c.ciudad || '';
                              setClienteCiudad(ciudad);
                              const direccion = c.direccion || '';
                              const telefono = c.telefono || '';
                              const correo = c.correo || '';
                              setClienteDireccion(direccion);
                              setClienteTelefono(telefono);
                              setClienteCorreo(correo);
                              const ciudadEl = document.getElementById('ciudad');
                              if (ciudadEl) ciudadEl.value = ciudad;
                              const direccionEl = document.getElementById('direccion');
                              if (direccionEl) direccionEl.value = direccion;
                              const telefonoEl = document.getElementById('telefono');
                              if (telefonoEl) telefonoEl.value = telefono;
                              const emailEl = document.getElementById('email');
                              if (emailEl) emailEl.value = correo;
                              setShowDropdown(false);
                            }}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              borderTop: '1px solid #f1f5f9',
                              border: 'none',
                              background: 'white',
                              textAlign: 'left',
                              width: '100%'
                            }}
                            onMouseEnter={(ev) => {
                              ev.currentTarget.style.background = '#f8fafc';
                            }}
                            onMouseLeave={(ev) => {
                              ev.currentTarget.style.background = 'white';
                            }}
                            aria-label={`Seleccionar cliente ${c.nombre || ''}`}
                          >
                            <span style={{ fontWeight: 600, color: '#111827' }}>
                              {c.nombre}
                              {!c.esCliente && (
                                <span
                                  style={{
                                    marginLeft: '6px',
                                    background: '#6366f1',
                                    color: '#ffffff',
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    borderRadius: '12px',
                                    fontWeight: 600
                                  }}
                                >PROSPECTO</span>
                              )}
                            </span>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>
                              {c.ciudad || 'Ciudad no especificada'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Campo Ciudad */}
                <div>
                  <label htmlFor="ciudad" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-location-dot" style={{ color: '#10b981', fontSize: '0.9rem' }}></i><span>Ciudad</span>
                  </label>
                  <input
                    id='ciudad'
                    type="text"
                    className="cuadroTexto"
                    placeholder="Ciudad de residencia"
                    value={clienteCiudad}
                    onChange={(e) => setClienteCiudad(e.target.value)}
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

                {/* Campo Dirección */}
                <div>
                  <label htmlFor="direccion" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-map-marker-alt" style={{ color: '#f59e0b', fontSize: '0.9rem' }}></i><span>Dirección</span>
                  </label>
                  <input
                    id='direccion'
                    type="text"
                    className="cuadroTexto"
                    placeholder="Dirección completa"
                    value={clienteDireccion}
                    onChange={(e) => setClienteDireccion(e.target.value)}
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

                {/* Campo Teléfono */}
                <div>
                  <label htmlFor="telefono" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-phone" style={{ color: '#8b5cf6', fontSize: '0.9rem' }}></i><span>Teléfono</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id='telefono'
                    type="tel"
                    className="cuadroTexto"
                    placeholder="+51 999 888 777"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
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

                {/* Campo Email */}
                <div>
                  <label htmlFor="email" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-envelope" style={{ color: '#ef4444', fontSize: '0.9rem' }}></i><span>Correo Electrónico</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id='email'
                    type="email"
                    className="cuadroTexto"
                    placeholder="cliente@ejemplo.com"
                    value={clienteCorreo}
                    onChange={(e) => setClienteCorreo(e.target.value)}
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

                {/* Campo Responsable */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-user-tie" style={{ color: '#06b6d4', fontSize: '0.9rem' }}></i><span>Responsable</span>
                  </div>
                  <div style={{
                    padding: '0.875rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                    color: '#64748b',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <i className="fa-solid fa-badge-check" style={{ color: '#10b981' }}></i>
                    <span id='vendedor'>{user ? user.firstName : ''} {user ? user.surname : ''}</span>
                  </div>
                </div>

                {/* Campo Fecha */}
                <div>
                  <label htmlFor="fecha" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem'
                  }}>
                    <i className="fa-solid fa-calendar" style={{ color: '#f59e0b', fontSize: '0.9rem' }}></i>
                    <span>Fecha de Cotización</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id='fecha'
                    type="date"
                    className="cuadroTexto"
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

            <div className="table-container" style={{ display: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Ciudad</th>
                    <th>Dirección</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Responsable cotización</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><input id='cliente-hidden' type="text" className="cuadroTexto" placeholder="Nombre o razón social" style={{ display: 'none' }} /></td>
                    <td><input id='ciudad-hidden' type="text" className="cuadroTexto" placeholder="Ciudad" style={{ display: 'none' }} /></td>
                    <td><input id='direccion-hidden' type="text" className="cuadroTexto" placeholder="Dirección" style={{ display: 'none' }} /></td>
                    <td><input id='telefono-hidden' type="number" className="cuadroTexto" placeholder="Teléfono" style={{ display: 'none' }} /></td>
                    <td><input id='email-hidden' type="email" className="cuadroTexto" placeholder="Correo electrónico" style={{ display: 'none' }} /></td>
                    <td><span id='vendedor-hidden' style={{ display: 'none' }}>{user ? user.firstName : ''} {user ? user.surname : ''}</span></td>
                    <td><input id='fecha-hidden' type="date" className="cuadroTexto" style={{ display: 'none' }} /></td>
                  </tr>

                </tbody>
              </table>
            </div>

            <br />
            
            {/* Sección de descripción mejorada */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              marginBottom: '2rem'
            }}>
              <div style={{
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '1rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{
                  margin: 0,
                  color: '#1e293b',
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
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
                    <i className="fa-solid fa-edit" style={{ fontSize: '1.2rem' }}></i>
                  </div>
                  Descripción de la Cotización
                </h4>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '10px',
                padding: '1rem',
                border: '2px solid #e5e7eb'
              }}>
                <Editor id='descripcion-cotizacion'
                  onInit={(evt, editor) => (descripcionRef.current = editor)}
                  apiKey="bjhw7gemroy70lt4bgmfvl29zid7pmrwyrtx944dmm4jq39w"
                  textareaName="Descripcion"
                  init={{ height: 250, menubar: false }}
                />
              </div>
            </div>

            {/* Sección de productos mejorada */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              marginBottom: '2rem'
            }}>
              {/* Header de productos */}
              <div style={{
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{
                      margin: 0,
                      color: '#1e293b',
                      fontSize: '1.3rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
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
                        <i className="fa-solid fa-box" style={{ fontSize: '1.2rem' }}></i>
                      </div>
                      Productos a cotizar
                    </h4>
                  </div>
                  
                  {/* Botones de acción */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={agregarProducto}
                      style={{
                        padding: '0.75rem 1.25rem',
                        border: 'none',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 12px -1px rgba(16, 185, 129, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.3)';
                      }}
                    >
                      <i className="fa-solid fa-plus"></i>
                      <span>Agregar Producto</span>
                    </button>
                    
                    {productosSeleccionados.length > 0 && (
                      <button
                        onClick={eliminarTodosLosProductos}
                        style={{
                          padding: '0.75rem 1.25rem',
                          border: '2px solid #ef4444',
                          borderRadius: '10px',
                          background: 'white',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#ef4444';
                          e.target.style.color = 'white';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'white';
                          e.target.style.color = '#ef4444';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                        <span>Limpiar Todo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabla de productos mejorada */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  overflowX: 'auto',
                  maxHeight: '400px'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)' }}>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.9rem', borderBottom: '2px solid #e2e8f0' }}>#</th>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.9rem', borderBottom: '2px solid #e2e8f0', minWidth: '200px' }}>Producto</th>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.9rem', borderBottom: '2px solid #e2e8f0', minWidth: '150px' }}>Descripción</th>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.9rem', borderBottom: '2px solid #e2e8f0' }}>Cantidad</th>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.9rem', borderBottom: '2px solid #e2e8f0' }}>Valor Unit.</th>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.9rem', borderBottom: '2px solid #e2e8f0' }}>% Desc.</th>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.9rem', borderBottom: '2px solid #e2e8f0' }}>Subtotal</th>
                        <th style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.9rem', borderBottom: '2px solid #e2e8f0' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosSeleccionados.map((prod, index) => (
                        <tr key={prod.uid || prod.producto || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem 0.75rem', color: '#64748b', fontWeight: '500' }}>{index + 1}</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <select
                              className="cuadroTexto"
                              value={prod.producto}
                              onChange={(e) => handleProductoChange(index, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                backgroundColor: 'white',
                                transition: 'border-color 0.3s ease'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            >
                              <option value="">Seleccione un producto</option>
                              {productos.filter(p => p.activo !== false && p.activo !== 'false').map(p => (
                                <option key={p._id} value={p._id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <input 
                              type="text" 
                              name="descripcion" 
                              className='cuadroTexto' 
                              value={prod.descripcion} 
                              onChange={(e) => handleChange(index, e)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                transition: 'border-color 0.3s ease'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <input 
                              type="number" 
                              name="cantidad" 
                              className='cuadroTexto' 
                              value={prod.cantidad} 
                              onChange={(e) => handleChange(index, e)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                textAlign: 'center',
                                transition: 'border-color 0.3s ease'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                              <span style={{ color: '#ef4444', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                                {prod.cantidad && prod.stock !== undefined && Number(prod.cantidad) > Number(prod.stock) ? 'cantidad no disponible' : ''}
                              </span>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <input 
                              type="number" 
                              name="valorUnitario" 
                              className='cuadroTexto' 
                              value={prod.valorUnitario} 
                              onChange={(e) => handleChange(index, e)} 
                              readOnly
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                textAlign: 'center',
                                backgroundColor: '#f8fafc'
                              }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <input 
                              type="number" 
                              name="descuento" 
                              className='cuadroTexto' 
                              value={prod.descuento} 
                              onChange={(e) => handleChange(index, e)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                textAlign: 'center',
                                transition: 'border-color 0.3s ease'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <input 
                              type="number" 
                              name="subtotal" 
                              className='cuadroTexto' 
                              value={prod.subtotal} 
                              readOnly
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                textAlign: 'center',
                                backgroundColor: '#f8fafc',
                                fontWeight: '600',
                                color: '#059669'
                              }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                            <button 
                              onClick={() => eliminarProducto(index)}
                              style={{
                                padding: '0.5rem',
                                border: 'none',
                                borderRadius: '6px',
                                background: '#ef4444',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '2rem',
                                height: '2rem'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#dc2626';
                                e.target.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#ef4444';
                                e.target.style.transform = 'scale(1)';
                              }}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      
                      {/* Mensaje cuando no hay productos */}
                      {productosSeleccionados.length === 0 && (
                        <tr>
                          <td colSpan={8} style={{ 
                            padding: '2rem', 
                            textAlign: 'center',
                            color: '#64748b',
                            fontStyle: 'italic'
                          }}>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <i className="fa-solid fa-box-open" style={{ fontSize: '2rem', color: '#cbd5e1' }}></i>
                              <span>No hay productos agregados. Haga clic en "Agregar Producto" para comenzar.</span>
                            </div>
                          </td>
                        </tr>
                      )}
                      
                      {/* Fila de total */}
                      {productosSeleccionados.length > 0 && (
                        <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', borderTop: '2px solid #e2e8f0' }}>
                          <td colSpan={6} style={{ 
                            padding: '1rem 0.75rem', 
                            fontWeight: '700', 
                            textAlign: 'right',
                            color: '#1e293b',
                            fontSize: '1.1rem'
                          }}>
                            Total General:
                          </td>
                          <td style={{ 
                            padding: '1rem 0.75rem', 
                            fontWeight: '700',
                            textAlign: 'center',
                            color: '#059669',
                            fontSize: '1.2rem'
                          }}>
                            S/. {productosSeleccionados
                              .reduce((acc, prod) => acc + (Number.parseFloat(prod.subtotal) || 0), 0)
                              .toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '1rem 0.75rem' }}></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="table-container" style={{ display: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Producto</th>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Valor unitario</th>
                    <th>% Descuento</th>
                    <th>Subtotal</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosSeleccionados.map((prod, index) => (
                    <tr key={prod.uid || prod.producto || index}>
                      <td>{index + 1}</td>
                      <td>
                        <select
                          className="cuadroTexto"
                          value={prod.producto}
                          onChange={(e) => handleProductoChange(index, e.target.value)}
                        >
                          <option value="">Seleccione un producto</option>
                          {productos.filter(p => p.activo !== false && p.activo !== 'false').map(p => (
                            <option key={p._id} value={p._id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td><input type="text" name="descripcion" className='cuadroTexto' value={prod.descripcion} onChange={(e) => handleChange(index, e)} /></td>
                      <td>
                        <input type="number" name="cantidad" className='cuadroTexto' value={prod.cantidad} onChange={(e) => handleChange(index, e)} />
                        <span style={{ color: '#ef4444', marginLeft: '0.5rem', fontSize: '0.85rem' }}>{prod.cantidad && prod.stock !== undefined && Number(prod.cantidad) > Number(prod.stock) ? 'cantidad no disponible' : ''}</span>
                      </td>
                      <td><input type="number" name="valorUnitario" className='cuadroTexto' value={prod.valorUnitario} onChange={(e) => handleChange(index, e)} readOnly /></td>
                      <td><input type="number" name="descuento" className='cuadroTexto' value={prod.descuento} onChange={(e) => handleChange(index, e)} /></td>
                      <td><input type="number" name="subtotal" className='cuadroTexto' value={prod.subtotal} readOnly /></td>
                      <td><button className="btn btn-danger" onClick={() => eliminarProducto(index)}>Eliminar</button></td>
                    </tr>
                  ))}
                  {/* Fila de total */}
                  {productosSeleccionados.length > 0 && (
                    <tr>
                      <td colSpan={5}></td>
                      <td style={{ fontWeight: 'bold', textAlign: 'right' }}>Total</td>
                      <td style={{ fontWeight: 'bold' }}>
                        {productosSeleccionados
                          .reduce((acc, prod) => acc + (Number.parseFloat(prod.subtotal) || 0), 0)
                          .toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
              <br />

            </div>
            
            <button className="btn" onClick={agregarProducto} style={{ display: 'none' }}>Agregar Producto</button>
            {productosSeleccionados.length > 0 && (
              <button className="btn btn-danger" onClick={eliminarTodosLosProductos} style={{ marginLeft: '10px', display: 'none' }}>
                Eliminar Todos
              </button>
            )}
            
            {/* Sección de condiciones de pago mejorada */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              marginBottom: '2rem'
            }}>
              <div style={{
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '1rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{
                  margin: 0,
                  color: '#1e293b',
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <i className="fa-solid fa-credit-card" style={{ fontSize: '1.2rem' }}></i>
                  </div>
                  Condiciones de Pago
                </h4>
                <p style={{
                  margin: '0.5rem 0 0 3.25rem',
                  color: '#64748b',
                  fontSize: '0.9rem'
                }}>
                  Especifique las condiciones comerciales y términos de pago
                </p>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '10px',
                padding: '1rem',
                border: '2px solid #e5e7eb'
              }}>
                <Editor id='condiciones-pago'
                  onInit={(evt, editor) => (condicionesPagoRef.current = editor)}
                  apiKey="bjhw7gemroy70lt4bgmfvl29zid7pmrwyrtx944dmm4jq39w"
                  textareaName="Condiciones"
                  init={{ height: 300, menubar: false }}
                />
              </div>
            </div>

            {/* Botones de acción mejorados */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              marginBottom: '2rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={handleCancelado}
                  style={{
                    padding: '0.875rem 2rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minWidth: '140px',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6';
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <i className="fa-solid fa-times"></i>
                  <span>Cancelar</span>
                </button>
                
                <button 
                  onClick={() => handleGuardarCotizacion(false, true)}
                  style={{
                    padding: '0.875rem 2rem',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
                    minWidth: '140px',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px -1px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  <i className="fa-solid fa-save"></i>
                  <span>Guardar</span>
                </button>
                
                <button 
                  onClick={() => handleGuardarCotizacion(true, true)}
                  style={{
                    padding: '0.875rem 2rem',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
                    minWidth: '180px',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px -1px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>Guardar y Enviar</span>
                </button>
              </div>
            </div>
            

            
          </div>
        </div >
        <div className="custom-footer">
          <p className="custom-footer-text">
            © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
          </p>
        </div>
      </div >
    </div>
  );
}