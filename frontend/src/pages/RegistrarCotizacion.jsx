import Fijo from '../components/Fijo'
import NavVentas from '../components/NavVentas'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom';
import { Editor } from "@tinymce/tinymce-react";
import { useRef, useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/RegistrarCotizacion.css';

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

function normalizar(arr, esClienteFlag) {
  if (!Array.isArray(arr)) return [];
  return arr.map(c => ({ ...c, esCliente: !!esClienteFlag }));
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
  // Errores inline para formulario
  const [errors, setErrors] = useState({});
  // Errores por producto (array paralelo a `productosSeleccionados`)
  const [productErrors, setProductErrors] = useState([]);


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

        // Normalizar y marcar tipo usando el helper de módulo
        const todos = [...normalizar(listaClientes, true), ...normalizar(listaProspectos, false)];

        // De-duplicar por correo (preferir cliente real sobre prospecto si coincide)
        const dedupMap = new Map();
        for (const c of todos) {
          const key = (c.correo || '').toLowerCase().trim() || c._id;
          if (dedupMap.has(key)) {
            const existente = dedupMap.get(key);
            // Si el existente es prospecto y el nuevo es cliente, reemplazar
            if (existente.esCliente === false && c.esCliente) {
              dedupMap.set(key, c);
            }
          } else {
            dedupMap.set(key, c);
          }
        }
        const resultado = Array.from(dedupMap.values()).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
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

  // Establecer valor mínimo y default del input fecha al cargar la página
  useEffect(() => {
    try {
      const hoy = new Date();
      const minStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      const fechaEl = document.getElementById('fecha');
      if (fechaEl) {
        fechaEl.min = minStr;
        if (!fechaEl.value) fechaEl.value = minStr;
      }
    } catch (err) {
      console.warn('No se pudo establecer fecha mínima por defecto:', err);
    }
  }, []);

  const agregarProducto = () => {
    // create a lightweight stable id for React keys so re-orders/removals don't rely on index
    const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    setProductosSeleccionados(prev => ([...prev, {
      uid,
      producto: '', descripcion: '', cantidad: '', valorUnitario: '', descuento: '', valorTotal: ''
    }]));
    setProductErrors(prev => ([...prev, {}]));
  };

  const eliminarProducto = (index) => {
    const nuevosProductos = [...productosSeleccionados];
    nuevosProductos.splice(index, 1);
    setProductosSeleccionados(nuevosProductos);
    const nuevosErrores = [...productErrors];
    nuevosErrores.splice(index, 1);
    setProductErrors(nuevosErrores);
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
        setProductErrors([]);
        setProductErrors([]);
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
    // clear producto error for this row when a selection is made
    setProductErrors(prev => {
      const copy = [...prev];
      copy[index] = { ...(copy[index] || {}) };
      delete copy[index].producto;
      return copy;
    });
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
    // clear field-specific error as user types
    const field = name;
    setProductErrors(prev => {
      const copy = [...prev];
      copy[index] = { ...(copy[index] || {}) };
      delete copy[index][field];
      return copy;
    });
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
        for (const id of inputIds) {
          const input = document.getElementById(id);
          if (input) input.value = '';
        }

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
    const newErrors = {};
    const newProductErrors = productosSeleccionados.map(() => ({}));

    const nombre = clienteNombre?.trim();
    const ciudad = clienteCiudad?.trim();
    const direccion = clienteDireccion?.trim();
    const telefono = clienteTelefono?.trim();
    const correo = clienteCorreo?.trim();
    const fechaEl = document.getElementById('fecha');
    const fecha = fechaEl ? fechaEl.value : '';

    if (!nombre) newErrors.cliente = 'El nombre o razón social es requerido.';
    if (!ciudad) newErrors.ciudad = 'La ciudad es requerida.';
    if (!direccion) newErrors.direccion = 'La dirección es requerida.';
    if (!telefono) newErrors.telefono = 'El teléfono es requerido.';
    if (!correo) newErrors.correo = 'El correo es requerido.';
    if (!fecha) newErrors.fecha = 'La fecha es requerida.';

    if (correo && !isValidEmail(correo)) newErrors.correo = 'El correo tiene un formato inválido.';

    if (productosSeleccionados.length === 0) newErrors.productos = 'Debes agregar al menos un producto a la cotización.';

    // fecha no puede ser anterior a hoy
    try {
      const hoy = new Date();
      const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      if (fecha && fecha < hoyStr) newErrors.fecha = 'La fecha no puede ser anterior a la fecha actual.';
    } catch (err) {
      console.warn('Error validando fecha localmente:', err);
    }

    // productos: validar por fila
    productosSeleccionados.forEach((p, i) => {
      if (!p.producto) newProductErrors[i].producto = 'Seleccione un producto.';
      if (!p.cantidad || Number.parseFloat(p.cantidad) <= 0) newProductErrors[i].cantidad = 'Ingrese una cantidad válida.';
      if (!p.valorUnitario || Number.parseFloat(p.valorUnitario) <= 0) newProductErrors[i].valorUnitario = 'Valor unitario inválido.';
      if (p.stock !== undefined && p.cantidad && Number(p.cantidad) > Number(p.stock)) newProductErrors[i].cantidad = 'Cantidad no disponible en stock.';
    });

    const hasProductRowErrors = newProductErrors.some(obj => Object.keys(obj).length > 0);

    if (Object.keys(newErrors).length > 0 || hasProductRowErrors) {
      setErrors(newErrors);
      setProductErrors(newProductErrors);
      return null;
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
      // Enviar la fecha en formato YYYY-MM-DD (fechaString). El backend parseará y creará Date UTC.
      fecha: fecha,
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
      // use a for...of loop which works with NodeList and avoids relying on .forEach
      // (and potential lint rules that require for...of).
      for (const input of allInputs) { if (input) input.value = ''; }
      setProductosSeleccionados([]);
      setProductErrors([]);
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
      // limpiar errores inline
      setErrors({});
      setProductErrors([]);
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
        <div className="contenido-modulo registrar-cotizacion-modulo">
          <div className="max-width">
            <div className='encabezado-modulo'>
              <h3 className='titulo-profesional'>Registrar cotizacion</h3>
            </div>
            
            {/* Sección Información del Cliente */}
            <div className="seccion-compacta">
              <div className="seccion-header-compacto">
                <div className="seccion-icono-compacto" style={{background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'}}>
                  <i className="fa-solid fa-user"></i>
                </div>
                <h4 className="seccion-titulo-compacto">Información del Cliente</h4>
              </div>

              <div className="grid-formulario-compacto">
                {/* Campo Cliente */}
                <div className="grupo-campo-compacto campo-full-width">
                  <label htmlFor="cliente" className="label-campo-compacto">
                    <i className="fa-solid fa-building" style={{ color: '#3b82f6' }}></i>
                    <span>Nombre o Razón Social</span>
                    <span className="texto-requerido">*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id='cliente'
                      type="text"
                      className="cuadroTexto input-compacto"
                      placeholder="Ingrese el nombre completo o razón social"
                      value={clienteNombre}
                      onChange={(e) => {
                        const q = e.target.value;
                        setClienteNombre(q);
                        setErrors(prev => { const copy = { ...(prev || {}) }; delete copy.cliente; return copy; });
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
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        if (filteredClientes.length > 0) setShowDropdown(true);
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        setTimeout(() => setShowDropdown(false), 150);
                      }}
                    />
                    {errors.cliente && (
                      <div style={{ color: '#ef4444', marginTop: '0.25rem', fontSize: '0.9rem' }}>{errors.cliente}</div>
                    )}
                    {showDropdown && filteredClientes.length > 0 && (
                      <div className="dropdown-clientes-compacto">
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
                              // clear inline errors when a cliente is selected from dropdown
                              setErrors({});
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
                            className="item-dropdown-compacto"
                          >
                            <span className="nombre-dropdown">
                              {c.nombre}
                              {!c.esCliente && (
                                <span className="badge-prospecto-compacto">PROSPECTO</span>
                              )}
                            </span>
                            <span className="ciudad-dropdown">
                              {c.ciudad || 'Ciudad no especificada'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Campo Ciudad */}
                <div className="grupo-campo-compacto">
                  <label htmlFor="ciudad" className="label-campo-compacto">
                    <i className="fa-solid fa-location-dot" style={{ color: '#10b981' }}></i>
                    <span>Ciudad</span>
                  </label>
                  <input
                    id='ciudad'
                    type="text"
                    className="cuadroTexto input-compacto"
                    placeholder="Ciudad de residencia"
                    value={clienteCiudad}
                      onChange={(e) => { setClienteCiudad(e.target.value); setErrors(prev => { const copy = { ...(prev || {}) }; delete copy.ciudad; return copy; }); }}
                  />
                    {errors.ciudad && (
                      <div style={{ color: '#ef4444', marginTop: '0.25rem', fontSize: '0.9rem' }}>{errors.ciudad}</div>
                    )}
                </div>

                {/* Campo Dirección */}
                <div className="grupo-campo-compacto">
                  <label htmlFor="direccion" className="label-campo-compacto">
                    <i className="fa-solid fa-map-marker-alt" style={{ color: '#f59e0b' }}></i>
                    <span>Dirección</span>
                  </label>
                  <input
                    id='direccion'
                    type="text"
                    className="cuadroTexto input-compacto"
                    placeholder="Dirección completa"
                    value={clienteDireccion}
                      onChange={(e) => { setClienteDireccion(e.target.value); setErrors(prev => { const copy = { ...(prev || {}) }; delete copy.direccion; return copy; }); }}
                  />
                    {errors.direccion && (
                      <div style={{ color: '#ef4444', marginTop: '0.25rem', fontSize: '0.9rem' }}>{errors.direccion}</div>
                    )}
                </div>

                {/* Campo Teléfono */}
                <div className="grupo-campo-compacto">
                  <label htmlFor="telefono" className="label-campo-compacto">
                    <i className="fa-solid fa-phone" style={{ color: '#8b5cf6' }}></i>
                    <span>Teléfono</span>
                    <span className="texto-requerido">*</span>
                  </label>
                  <input
                    id='telefono'
                    type="tel"
                    className="cuadroTexto input-compacto"
                    placeholder="+51 999 888 777"
                    value={clienteTelefono}
                    onChange={(e) => {
                      // Solo permitir números y caracteres válidos para teléfonos: +, espacios, guiones, paréntesis
                      const valor = e.target.value;
                      const valorFiltrado = valor.replaceAll(/[^0-9+\-() ]/g, '');
                      setClienteTelefono(valorFiltrado);
                      setErrors(prev => { const copy = { ...(prev || {}) }; delete copy.telefono; return copy; });
                    }}
                    onKeyDown={(e) => {
                      // Prevenir entrada de letras en tiempo real usando onKeyDown (reemplazo de onKeyPress deprecado)
                      const char = e.key;
                      // Permitir teclas de control como Backspace, Delete, Tab, Escape, Enter, flechas
                      if (
                        char.length === 1 && 
                        !/[0-9+\-() ]/.test(char) &&
                        !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(char)
                      ) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {errors.telefono && (
                    <div style={{ color: '#ef4444', marginTop: '0.25rem', fontSize: '0.9rem' }}>{errors.telefono}</div>
                  )}
                </div>

                {/* Campo Email */}
                <div className="grupo-campo-compacto">
                  <label htmlFor="email" className="label-campo-compacto">
                    <i className="fa-solid fa-envelope" style={{ color: '#ef4444' }}></i>
                    <span>Correo Electrónico</span>
                    <span className="texto-requerido">*</span>
                  </label>
                  <input
                    id='email'
                    type="email"
                    className="cuadroTexto input-compacto"
                    placeholder="cliente@ejemplo.com"
                    value={clienteCorreo}
                      onChange={(e) => { setClienteCorreo(e.target.value); setErrors(prev => { const copy = { ...(prev || {}) }; delete copy.correo; return copy; }); }}
                  />
                    {errors.correo && (
                      <div style={{ color: '#ef4444', marginTop: '0.25rem', fontSize: '0.9rem' }}>{errors.correo}</div>
                    )}
                </div>

                {/* Campo Responsable */}
                <div className="grupo-campo-compacto">
                  <label htmlFor="vendedor" className="label-campo-compacto">
                    <i className="fa-solid fa-user-tie" style={{ color: '#06b6d4' }}></i>
                    <span>Responsable</span>
                  </label>
                  <div className="input-compacto input-solo-lectura">
                    <i className="fa-solid fa-badge-check" style={{ color: '#10b981', marginRight: '0.5rem' }}></i>
                    <input
                      id='vendedor'
                      type='text'
                      readOnly
                      className="input-vendedor-texto"
                      value={user ? `${user.firstName} ${user.surname}` : ''}
                      aria-readonly="true"
                    />
                  </div>
                </div>

                {/* Campo Fecha */}
                <div className="grupo-campo-compacto">
                  <label htmlFor="fecha" className="label-campo-compacto">
                    <i className="fa-solid fa-calendar" style={{ color: '#f59e0b' }}></i>
                    <span>Fecha de Cotización</span>
                    <span className="texto-requerido">*</span>
                  </label>
                  <input
                    id='fecha'
                    type="date"
                    className="cuadroTexto input-compacto"
                    onChange={() => setErrors(prev => { const copy = { ...(prev || {}) }; delete copy.fecha; return copy; })}
                  />
                  {errors.fecha && (
                    <div style={{ color: '#ef4444', marginTop: '0.25rem', fontSize: '0.9rem' }}>{errors.fecha}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Tablas ocultas (se mantienen igual) */}
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

            {/* Sección Descripción */}
            <div className="seccion-compacta">
              <div className="seccion-header-compacto">
                <div className="seccion-icono-compacto" style={{background: 'linear-gradient(135deg, #10b981, #059669)'}}>
                  <i className="fa-solid fa-edit"></i>
                </div>
                <h4 className="seccion-titulo-compacto">Descripción de la Cotización</h4>
              </div>
              <div className="contenedor-editor-compacto">
                <Editor 
                  id='descripcion-cotizacion'
                  onInit={(evt, editor) => (descripcionRef.current = editor)}
                  apiKey="bjhw7gemroy70lt4bgmfvl29zid7pmrwyrtx944dmm4jq39w"
                  textareaName="Descripcion"
                  init={{ height: 200, menubar: false }}
                />
              </div>
            </div>

            {/* Sección Productos */}
            <div className="seccion-compacta">
              <div className="seccion-header-compacto">
                <div className="seccion-icono-compacto" style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}>
                  <i className="fa-solid fa-box"></i>
                </div>
                <h4 className="seccion-titulo-compacto">Productos a Cotizar</h4>
              </div>

              <div className="botones-accion-compactos">
                <button onClick={agregarProducto} className="btn-agregar-compacto">
                  <i className="fa-solid fa-plus"></i>
                  <span>Agregar Producto</span>
                </button>
                
                {productosSeleccionados.length > 0 && (
                  <button onClick={eliminarTodosLosProductos} className="btn-limpiar-compacto">
                    <i className="fa-solid fa-trash-can"></i>
                    <span>Limpiar Todo</span>
                  </button>
                )}
              </div>

              <div className="contenedor-tabla-productos">
                {errors.productos && (
                  <div style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{errors.productos}</div>
                )}
                <div className="tabla-scroll-compacto">
                  <table className="tabla-productos-compacta">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Producto</th>
                        <th>Descripción</th>
                        <th>Cantidad</th>
                        <th>Valor Unit.</th>
                        <th>% Desc.</th>
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
                              style={{ borderColor: (productErrors[index] && productErrors[index].producto) ? '#ef4444' : undefined }}
                            >
                              <option value="">Seleccione un producto</option>
                              {productos.filter(p => p.activo !== false && p.activo !== 'false').map(p => (
                                <option key={p._id} value={p._id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            {productErrors[index] && productErrors[index].producto && (
                              <div style={{ color: '#ef4444', marginTop: '0.25rem', fontSize: '0.85rem' }}>{productErrors[index].producto}</div>
                            )}
                          </td>
                          <td>
                            <input 
                              type="text" 
                              name="descripcion" 
                              className='cuadroTexto' 
                              value={prod.descripcion} 
                              onChange={(e) => handleChange(index, e)}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              name="cantidad" 
                              className='cuadroTexto input-cantidad-compacto' 
                              value={prod.cantidad} 
                              onChange={(e) => handleChange(index, e)}
                              style={{ borderColor: (productErrors[index] && productErrors[index].cantidad) ? '#ef4444' : undefined }}
                            />
                            {prod.cantidad && prod.stock !== undefined && Number(prod.cantidad) > Number(prod.stock) && (
                              <span className="alerta-stock-compacto">cantidad no disponible</span>
                            )}
                            {productErrors[index] && productErrors[index].cantidad && (
                              <div style={{ color: '#ef4444', marginTop: '0.25rem', fontSize: '0.85rem' }}>{productErrors[index].cantidad}</div>
                            )}
                          </td>
                          <td>
                            <input 
                              type="number" 
                              name="valorUnitario" 
                              className='cuadroTexto input-precio-compacto' 
                              value={prod.valorUnitario} 
                              onChange={(e) => handleChange(index, e)} 
                              readOnly
                              style={{ borderColor: (productErrors[index] && productErrors[index].valorUnitario) ? '#ef4444' : undefined }}
                            />
                            {productErrors[index] && productErrors[index].valorUnitario && (
                              <div style={{ color: '#ef4444', marginTop: '0.25rem', fontSize: '0.85rem' }}>{productErrors[index].valorUnitario}</div>
                            )}
                          </td>
                          <td>
                            <input 
                              type="number" 
                              name="descuento" 
                              className='cuadroTexto input-descuento-compacto' 
                              value={prod.descuento} 
                              onChange={(e) => handleChange(index, e)}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              name="subtotal" 
                              className='cuadroTexto input-subtotal-compacto' 
                              value={prod.subtotal} 
                              readOnly
                            />
                          </td>
                          <td>
                            <button onClick={() => eliminarProducto(index)} className="btn-eliminar-compacto">
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      
                      {productosSeleccionados.length === 0 && (
                        <tr>
                          <td colSpan={8} className="estado-vacio-compacto">
                            <i className="fa-solid fa-box-open"></i>
                            <div>No hay productos agregados</div>
                          </td>
                        </tr>
                      )}
                      
                      {productosSeleccionados.length > 0 && (
                        <tr className="fila-total-compacta">
                          <td colSpan={6} style={{textAlign: 'right', fontWeight: '700'}}>
                            Total General:
                          </td>
                          <td className="valor-total-compacto">
                            S/. {productosSeleccionados
                              .reduce((acc, prod) => acc + (Number.parseFloat(prod.subtotal) || 0), 0)
                              .toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Tabla oculta de productos */}
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
                </tbody>
              </table>
            </div>

            {/* Botones ocultos */}
            <button className="btn" onClick={agregarProducto} style={{ display: 'none' }}>Agregar Producto</button>
            {productosSeleccionados.length > 0 && (
              <button className="btn btn-danger" onClick={eliminarTodosLosProductos} style={{ marginLeft: '10px', display: 'none' }}>
                Eliminar Todos
              </button>
            )}

            {/* Sección Condiciones de Pago */}
            <div className="seccion-compacta">
              <div className="seccion-header-compacto">
                <div className="seccion-icono-compacto" style={{background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'}}>
                  <i className="fa-solid fa-credit-card"></i>
                </div>
                <div>
                  <h4 className="seccion-titulo-compacto">Condiciones de Pago</h4>
                  <p style={{margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.8rem'}}>
                    Especifique las condiciones comerciales y términos de pago
                  </p>
                </div>
              </div>
              <div className="contenedor-editor-compacto">
                <Editor 
                  id='condiciones-pago'
                  onInit={(evt, editor) => (condicionesPagoRef.current = editor)}
                  apiKey="bjhw7gemroy70lt4bgmfvl29zid7pmrwyrtx944dmm4jq39w"
                  textareaName="Condiciones"
                  init={{ height: 200, menubar: false }}
                />
              </div>
            </div>

            {/* Botones Finales */}
            <div className="seccion-compacta">
              <div className="botones-finales-compactos">
                <button onClick={handleCancelado} className="btn-cancelar-compacto">
                  <i className="fa-solid fa-times"></i>
                  <span>Cancelar</span>
                </button>
                
                <button onClick={() => handleGuardarCotizacion(false, true)} className="btn-guardar-compacto">
                  <i className="fa-solid fa-save"></i>
                  <span>Guardar</span>
                </button>
                
                <button onClick={() => handleGuardarCotizacion(true, true)} className="btn-enviar-compacto">
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>Guardar y Enviar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="custom-footer">
          <p className="custom-footer-text">
            © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}