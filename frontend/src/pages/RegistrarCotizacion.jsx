import Fijo from '../components/Fijo'
import NavVentas from '../components/NavVentas'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom';
import { Editor } from "@tinymce/tinymce-react";
import React, { useRef, useState, useEffect } from 'react';
import { transform } from 'lodash';

export default function RegistrarCotizacion() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const descripcionRef = useRef(null);
  const condicionesPagoRef = useRef(null);
  const [productos, setProductos] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);

  const [notificacion, setNotificacion] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('http://localhost:5000/api/products', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setProductos(data.data || []))
      .catch(err => console.error('Error al cargar productos:', err));

  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const usuario = JSON.parse(storedUser);
      setUser(usuario);
    }
  }, []);

  const agregarProducto = () => {
    setProductosSeleccionados([...productosSeleccionados, {
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
    const cantidadNum = parseFloat(nuevosProductos[index].cantidad) || 0;
    const valorNum = parseFloat(nuevosProductos[index].valorUnitario) || 0;
    const descNum = parseFloat(nuevosProductos[index].descuento) || 0;
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

        if (descripcionRef.current) {
          descripcionRef.current.setContent('');
        }
        if (condicionesPagoRef.current) {
          condicionesPagoRef.current.setContent('');
        }
      }
    });
  };

  function obtenerFechaLocal(inputDate) {
    const date = new Date(inputDate);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const handleGuardarCotizacion = async (enviar = false, mostrarModal = false) => {
    const inputs = document.querySelectorAll('.cuadroTexto');

    const nombre = inputs[0]?.value.trim();
    const ciudad = inputs[1]?.value.trim();
    const direccion = inputs[2]?.value.trim();
    const telefono = inputs[3]?.value.trim();
    const correo = inputs[4]?.value.trim();
    const fecha = inputs[6]?.value;

    if (!nombre || !ciudad || !direccion || !telefono || !correo || !fecha) {
      Swal.fire('Error', 'Todos los campos del cliente y la fecha son obligatorios.', 'warning');
      return;
    }

    // Validación básica de formato de correo antes de enviar
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(correo)) {
      Swal.fire('Error', 'El correo del cliente debe tener un formato válido.', 'warning');
      return;
    }

    if (productosSeleccionados.length === 0) {
      Swal.fire('Error', 'Debes agregar al menos un producto a la cotización.', 'warning');
      return;
    }

    for (const prod of productosSeleccionados) {
      if (!prod.producto || !prod.cantidad || !prod.valorUnitario) {
        Swal.fire('Error', 'Todos los productos deben tener cantidad y valor unitario.', 'warning');
        return;
      }
    }

    const clienteData = { nombre, ciudad, direccion, telefono, correo, esCliente: false };

    const datosCotizacion = {
      cliente: {
        referencia: user?._id, // Si tienes el id del cliente, cámbialo aquí
        ...clienteData
      },
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
          producto: {
            id: p.producto,
            name: prodObj?.name || ''
          },
          descripcion: p.descripcion,
          cantidad: parseFloat(p.cantidad || 0),
          valorUnitario: parseFloat(p.valorUnitario || 0),
          descuento: parseFloat(p.descuento || 0),
          subtotal: parseFloat(p.valorTotal || 0)
        };
      }),
      clientePotencial: true,
      enviadoCorreo: enviar
    };

    // Añadir información de la empresa si está disponible en la UI
    try {
      const empresaNombreEl = document.getElementById('empresa-nombre');
      const empresaNombre = empresaNombreEl ? empresaNombreEl.innerText.trim() : '';
      if (empresaNombre) {
        datosCotizacion.empresa = { nombre: empresaNombre, direccion: '' };
      }
    } catch (err) {
      // no bloquear si no se puede obtener
      console.warn('No se pudo obtener información de la empresa desde la UI', err);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/cotizaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(datosCotizacion)
      });

      const result = await response.json();

      if (!response.ok) {
        Swal.fire('Error', result.message || 'No se pudo guardar la cotización.', 'error');
        return;
      }

      // MARCAR: check if client with this email exists; if not, create as prospect
      try {
        const token = localStorage.getItem('token');
        const clientesRes = await fetch('http://localhost:5000/api/clientes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const clientes = await clientesRes.json();
        const existe = Array.isArray(clientes) && clientes.some(c => (c.correo || '').toLowerCase() === correo.toLowerCase());
        if (!existe) {
          // crear prospecto (esCliente: false)
          const nuevoCliente = {
            nombre,
            correo,
            telefono,
            direccion,
            ciudad,
            esCliente: false
          };

          const createRes = await fetch('http://localhost:5000/api/clientes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(nuevoCliente)
          });

          if (createRes.ok) {
            Swal.fire('Prospecto creado', 'El correo no existía en la base de datos y se creó como prospecto.', 'success');
          } else {
            const err = await createRes.json();
            console.warn('No se pudo crear prospecto:', err);
          }
        }
      } catch (err) {
        console.warn('Error al verificar/crear prospecto:', err);
      }
  // En vez de mostrar el modal aquí, navegamos a ListaDeCotizaciones
  // y pasamos la cotización creada en el state para que la lista abra el formato
  const nuevaCot = result.data || result;
  setNotificacion('Cotización guardada');
  setTimeout(() => setNotificacion(null), 5000);
  navigate('/ListaDeCotizaciones', { state: { abrirFormato: true, cotizacion: nuevaCot } });

      // Limpiar todos los inputs de la vista después de guardar correctamente
      try {
        // Limpiar inputs con la clase usada en el formulario
        const allInputs = document.querySelectorAll('.cuadroTexto');
        if (allInputs && allInputs.length) {
          allInputs.forEach(input => {
            if (input) input.value = '';
          });
        }

        // Limpiar productos seleccionados
        setProductosSeleccionados([]);

        // Limpiar contenidos de los editores (si existen)
        if (descripcionRef.current) {
          descripcionRef.current.setContent('');
        }
        if (condicionesPagoRef.current) {
          condicionesPagoRef.current.setContent('');
        }
      } catch (err) {
        console.warn('No se pudieron limpiar todos los campos automáticamente:', err);
      }

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

            <div className="table-container">
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
                    <td><input id='cliente' type="text" className="cuadroTexto" placeholder="Nombre o razón social" /></td>
                    <td><input id='ciudad' type="text" className="cuadroTexto" placeholder="Ciudad" /></td>
                    <td><input id='direccion' type="text" className="cuadroTexto" placeholder="Dirección" /></td>
                    <td><input id='telefono' type="number" className="cuadroTexto" placeholder="Teléfono" /></td>
                    <td><input id='email' type="email" className="cuadroTexto" placeholder="Correo electrónico" /></td>
                    <td><span id='vendedor'>{user ? user.firstName : ''} {user ? user.surname : ''}</span></td>
                    <td><input id='fecha' type="date" className="cuadroTexto" /></td>
                  </tr>

                </tbody>
              </table>
            </div>

            <br />
            <label className="labelDOCS">Descripción cotización</label>
            <br /><br />
            <Editor id='descripcion-cotizacion'
              onInit={(evt, editor) => (descripcionRef.current = editor)}
              apiKey="bjhw7gemroy70lt4bgmfvl29zid7pmrwyrtx944dmm4jq39w"
              textareaName="Descripcion"
              init={{ height: 250, menubar: false }}
            />

            <br />
            <div className="table-container">
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
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <select
                          className="cuadroTexto"
                          value={prod.producto}
                          onChange={(e) => handleProductoChange(index, e.target.value)}
                        >
                          <option value="">Seleccione un producto</option>
                          {productos.map(p => (
                            <option key={p._id} value={p._id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td><input type="text" name="descripcion" className='cuadroTexto' value={prod.descripcion} onChange={(e) => handleChange(index, e)} /></td>
                      <td><input type="number" name="cantidad" className='cuadroTexto' value={prod.cantidad} onChange={(e) => handleChange(index, e)} /></td>
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
                          .reduce((acc, prod) => acc + (parseFloat(prod.subtotal) || 0), 0)
                          .toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
              <br />

            </div>
            <button className="btn" onClick={agregarProducto}>Agregar Producto</button>
            {productosSeleccionados.length > 0 && (
              <button className="btn btn-danger" onClick={eliminarTodosLosProductos} style={{ marginLeft: '10px' }}>
                Eliminar Todos
              </button>
            )}
            <br />
            <br />
            <label className="labelDOCS">Condiciones de pago</label>
            <br /><br />
            <Editor id='condiciones-pago'
              onInit={(evt, editor) => (condicionesPagoRef.current = editor)}
              apiKey="bjhw7gemroy70lt4bgmfvl29zid7pmrwyrtx944dmm4jq39w"
              textareaName="Condiciones"
              init={{ height: 300, menubar: false }}
            />

            <div className="buttons">
              <button className="btn btn-primary-cancel" onClick={handleCancelado}>Cancelar</button>
              <button className="btn btn-primary-guardar" onClick={() => handleGuardarCotizacion(false, true)}>Guardar</button>
              <button className="btn btn-primary-env">Guardar y Enviar</button>
            </div>

            {notificacion && (
              <div style={{
                position: 'fixed',
                top: '5vh',
                right: '40dvw',
                border: '2px solid #76aafdff',
                background: '#d4e3f7ff',
                color: '#3041a4ff',
                padding: '12px 24px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 9999,
                fontSize: 'small',
                transition: 'opacity 0.3s'
              }}>
                {notificacion}
              </div>
            )}
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