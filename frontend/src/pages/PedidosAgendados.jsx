import React, { useEffect, useState, useRef } from 'react';
import { Editor } from "@tinymce/tinymce-react";
import { useNavigate } from 'react-router-dom';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import Swal from 'sweetalert2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import EditarPedido from '../components/EditarPedido';
import CotizacionPreview from '../components/CotizacionPreview';

export default function Despachos() {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const [cotizacionPreview, setCotizacionPreview] = useState(null);
  const [pedidoPreview, setPedidoPreview] = useState(null);
  const descripcionRef = useRef(null);
  const condicionesPagoRef = useRef(null);

  // Form state to allow agendar without a cotización (fields copied from RegistrarCotizacion)
  const [user, setUser] = useState(null);
  const [productos, setProductos] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteCiudad, setClienteCiudad] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteCorreo, setClienteCorreo] = useState('');
  const [fechaPedido, setFechaPedido] = useState('');

  const mostrarProductos = (pedido) => {
    setPedidoSeleccionado(pedido);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/pedidos', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPedidos(data.filter(p => p.estado === 'agendado')))
      .catch(err => console.error('Error al cargar pedidos:', err));
  }, []);

  // Load products for selection and current user info
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/products', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setProductos(data.data || data || []))
      .catch(err => console.error('Error al cargar productos:', err));

    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const agregarProducto = () => {
    setProductosSeleccionados([...productosSeleccionados, { producto: '', descripcion: '', cantidad: '', valorUnitario: '', descuento: '', subtotal: '' }]);
  };

  const eliminarProducto = (index) => {
    const nuevos = [...productosSeleccionados];
    nuevos.splice(index, 1);
    setProductosSeleccionados(nuevos);
  };

  const eliminarTodosLosProductos = () => {
    if (productosSeleccionados.length === 0) return;
    Swal.fire({
      title: '¿Eliminar todos los productos?',
      text: 'Esta acción eliminará todos los productos seleccionados del pedido.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar todos',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) setProductosSeleccionados([]);
    });
  };

  const handleProductoChange = (index, value) => {
    const prod = productos.find(p => p._id === value);
    const nuevos = [...productosSeleccionados];
    nuevos[index] = {
      ...nuevos[index],
      producto: value,
      descripcion: prod?.description || '',
      valorUnitario: prod?.price || '',
      cantidad: '',
      descuento: '',
      subtotal: ''
    };
    setProductosSeleccionados(nuevos);
  };

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const nuevos = [...productosSeleccionados];
    nuevos[index][name] = value;

    const cantidadNum = parseFloat(nuevos[index].cantidad) || 0;
    const valorNum = parseFloat(nuevos[index].valorUnitario) || 0;
    const descNum = parseFloat(nuevos[index].descuento) || 0;
    const subtotal = cantidadNum * valorNum * (1 - descNum / 100);
    nuevos[index].subtotal = subtotal.toFixed(2);
    setProductosSeleccionados(nuevos);
  };

  function obtenerFechaLocal(inputDate) {
    if (!inputDate) return '';
    const date = new Date(inputDate);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const exportarPDF = () => {
    const input = document.getElementById('tabla_despachos');
    const originalWidth = input.style.width;
    input.style.width = '100%';

    html2canvas(input, { scale: 1, width: input.offsetWidth, windowWidth: input.scrollWidth })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save('despachos.pdf');

        input.style.width = originalWidth;
      });
  };

  const exportToExcel = () => {
    const table = document.getElementById('tabla_despachos');
    if (!table) return;

    const elementosNoExport = table.querySelectorAll('.no-export');
    elementosNoExport.forEach(el => el.style.display = 'none');

    const workbook = XLSX.utils.table_to_book(table, { sheet: "Despachos" });
    workbook.Sheets["Despachos"]["!cols"] = Array(10).fill({ width: 20 });

    XLSX.writeFile(workbook, 'despachos.xlsx');
    elementosNoExport.forEach(el => el.style.display = '');
  };



  const cancelarPedido = async (id) => {
    const token = localStorage.getItem('token');
    const confirm = await Swal.fire({
      title: '¿Cancelar pedido?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/pedidos/${id}/cancelar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });

      const result = await res.json();

      if (res.ok) {
        Swal.fire('Cancelado', 'El pedido ha sido cancelado', 'success');
        setPedidos(prev => prev.filter(p => p._id !== id));
      } else {
        throw new Error(result.message || 'No se pudo cancelar');
      }
    } catch (error) {
      console.error('Error al cancelar pedido:', error);
      Swal.fire('Error', 'No se pudo cancelar el pedido', 'error');
    }
  };

  // Marcar pedido como entregado: actualiza estado en backend, actualiza la lista local y navega a PedidosEntregados
  const marcarComoEntregado = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/pedidos/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: 'entregado' })
      });

      const result = await res.json().catch(() => ({}));

      if (res.ok) {
        // Remover de la lista actual de agendados
        setPedidos(prev => prev.filter(p => p._id !== id));
        await Swal.fire('Entregado', 'El pedido ha sido marcado como entregado.', 'success');
        navigate('/PedidosEntregados');
      } else {
        throw new Error(result.message || 'No se pudo marcar como entregado');
      }
    } catch (error) {
      console.error('Error al marcar como entregado:', error);
      Swal.fire('Error', error.message || 'No se pudo marcar como entregado', 'error');
    }
  };

  const ModalProductosCotizacion = ({ visible, onClose, productos, cotizacionId }) => {
    if (!visible) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-compact modal-lg">
          <div className="modal-header">
            <h5 className="modal-title">Productos del Pedido #{cotizacionId?.slice(-5)}</h5>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            {productos?.length > 0 ? (
              <ul className="list-group">
                {productos.map((prod, idx) => (
                  <li key={idx} className="list-group-item">
                    <strong>{prod?.product?.name || 'Producto desconocido'}</strong><br />
                    Cantidad: {prod?.cantidad}<br />
                    Precio unitario: ${prod?.precioUnitario?.toFixed(2) || 0}<br />
                    <em>Total: ${(prod?.cantidad * prod?.precioUnitario).toFixed(2)}</em>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay productos asociados a este pedido.</p>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-cancel" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    );
  };

  const totalPages = Math.ceil(pedidos.length / itemsPerPage);
  const currentItems = pedidos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // State and handlers for 'Agendar Pedido' modal
  const [mostrarModalAgendar, setMostrarModalAgendar] = useState(false);
  const [agendarCotizacionId, setAgendarCotizacionId] = useState('');
  const [agendarFechaEntrega, setAgendarFechaEntrega] = useState('');
  const [agendarLoading, setAgendarLoading] = useState(false);

  const abrirModalAgendar = () => {
    setAgendarCotizacionId('');
    setAgendarFechaEntrega('');
    // set fechaPedido default to today
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    setFechaPedido(`${yyyy}-${mm}-${dd}`);
    setMostrarModalAgendar(true);
  };

  const cerrarModalAgendar = () => {
    setMostrarModalAgendar(false);
  };

  const enviarAgendarPedido = async (e) => {
    e.preventDefault();

    // Validate client fields
    if (!clienteNombre || !clienteCiudad || !clienteDireccion || !clienteTelefono || !clienteCorreo || !fechaPedido) {
      Swal.fire('Error', 'Todos los campos del cliente y la fecha son obligatorios.', 'warning');
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(clienteCorreo)) {
      Swal.fire('Error', 'El correo del cliente debe tener un formato válido.', 'warning');
      return;
    }

    if (productosSeleccionados.length === 0) {
      Swal.fire('Error', 'Debes agregar al menos un producto al pedido.', 'warning');
      return;
    }

    for (const prod of productosSeleccionados) {
      if (!prod.producto || !prod.cantidad || !prod.valorUnitario) {
        Swal.fire('Error', 'Todos los productos deben tener cantidad y valor unitario.', 'warning');
        return;
      }
    }

    setAgendarLoading(true);
    try {
      const token = localStorage.getItem('token');

      const clienteData = { nombre: clienteNombre, ciudad: clienteCiudad, direccion: clienteDireccion, telefono: clienteTelefono, correo: clienteCorreo, esCliente: false };

      const datosPedido = {
        cliente: { referencia: user?._id, ...clienteData },
        responsable: { id: user?._id, firstName: user?.firstName, secondName: user?.secondName, surname: user?.surname, secondSurname: user?.secondSurname },
        fecha: obtenerFechaLocal(fechaPedido),
        descripcion: descripcionRef.current?.getContent({ format: 'html' }) || '',
        condicionesPago: condicionesPagoRef.current?.getContent({ format: 'html' }) || '',
        productos: productosSeleccionados.map(p => {
          const prodObj = productos.find(x => x._id === p.producto);
          return {
            producto: { id: p.producto, name: prodObj?.name || '' },
            descripcion: p.descripcion,
            cantidad: parseFloat(p.cantidad || 0),
            precioUnitario: parseFloat(p.valorUnitario || 0),
            descuento: parseFloat(p.descuento || 0),
            subtotal: parseFloat(p.subtotal || 0)
          };
        }),
        fechaEntrega: obtenerFechaLocal(fechaPedido),
        estado: 'agendado',
        clientePotencial: true
      };

      const res = await fetch('http://localhost:5000/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(datosPedido)
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'No se pudo crear el pedido');
      }

      const nuevoPedido = result.data || result;
      setPedidos(prev => [nuevoPedido, ...prev]);
      setCurrentPage(1);
      Swal.fire('Pedido agendado', '', 'success');
      // clear the form
      setClienteNombre(''); setClienteCiudad(''); setClienteDireccion(''); setClienteTelefono(''); setClienteCorreo(''); setFechaPedido('');
      setProductosSeleccionados([]);
      if (descripcionRef.current) descripcionRef.current.setContent('');
      if (condicionesPagoRef.current) condicionesPagoRef.current.setContent('');
      cerrarModalAgendar();
    } catch (err) {
      console.error('Error creando pedido:', err);
      Swal.fire('Error', err.message || 'No se pudo crear el pedido', 'error');
    } finally {
      setAgendarLoading(false);
    }
  };

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="contenido-modulo">
          <div className='encabezado-modulo'>
            <div>
              <h3 className='titulo-profesional'>Pedidos agendados</h3>
              {/* BOTONES EXPORTAR */}
              <button
                onClick={() => exportToExcel(pedidos)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.45rem 0.9rem', border: '1.5px solid #16a34a', borderRadius: '8px', background: 'transparent', color: '#16a34a',
                  fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.3s ease'
                }}
              >
                <i className="fa-solid fa-file-excel" style={{ color: 'inherit', fontSize: '16px' }}></i>
                <span>Exportar a Excel</span>
              </button>

              <button
                onClick={exportarPDF}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.45rem 0.9rem', border: '1.5px solid #dc2626', borderRadius: '8px', background: 'transparent', color: '#dc2626',
                  fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.3s ease'
                }}
              >
                <i className="fa-solid fa-file-pdf" style={{ color: 'inherit', fontSize: '16px' }}></i>
                <span>Exportar a PDF</span>
              </button>
            </div>
            <div>
              <button className='btn-agregar' onClick={() => abrirModalAgendar ? abrirModalAgendar() : setMostrarModalAgendar(true)}>+ Agendar Pedido</button>
            </div>
          </div>

          <div className="max-width">

            <div className="container-tabla">
              <div className="table-container">
                <table id="tabla_despachos">
                  <thead><br />
                    <tr>
                      <th>No</th>
                      <th>Identificador de Pedido</th>
                      <th>F. Agendamiento</th>
                      <th>F. Entrega</th>
                      <th>Cliente</th>
                      <th>Ciudad</th>
                      <th>Total</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((pedido, index) => (
                      <tr key={pedido._id}>
                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>
                          {pedido.numeroPedido ? (
                            <a
                              style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline', fontWeight: 'bold' }}
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token');
                                  const cotId = pedido.cotizacionReferenciada || pedido.cotizacionId;

                                  // If there is a cotizacion linked, try to load it and merge; otherwise build a preview from pedido
                                  if (cotId) {
                                    const res = await fetch(`http://localhost:5000/api/cotizaciones/${cotId}`, {
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    if (!res.ok) throw new Error('No se pudo obtener la cotización');
                                    const data = await res.json();
                                    const cotizacionCompleta = data.data || data;

                                    const pedidoConCotizacion = {
                                      ...cotizacionCompleta,
                                      codigo: pedido.numeroPedido,
                                      tipo: 'pedido',
                                      estadoPedido: pedido.estado,
                                      fechaEntrega: pedido.fechaEntrega,
                                      fechaAgendamiento: pedido.createdAt,
                                      cotizacionCodigo: pedido.cotizacionCodigo || cotizacionCompleta.codigo || ''
                                    };

                                    setCotizacionPreview(pedidoConCotizacion);
                                    setMostrarPreview(true);
                                    return;
                                  }

                                  // Build a preview-compatible object from pedido when no cotizacion is present
                                  const pedidoPreviewObj = {
                                    tipo: 'pedido',
                                    codigo: pedido.numeroPedido || '',
                                    estadoPedido: pedido.estado || '',
                                    fechaEntrega: pedido.fechaEntrega || pedido.fecha || '',
                                    fechaAgendamiento: pedido.createdAt || pedido.fecha || '',
                                    descripcion: pedido.descripcion || '',
                                    condicionesPago: pedido.condicionesPago || '',
                                    cliente: pedido.cliente || {},
                                    empresa: pedido.empresa || {},
                                    productos: (pedido.productos || pedido.productosSeleccionados || []).map(p => {
                                      // Normalize product shape expected by CotizacionPreview
                                      return {
                                        cantidad: p.cantidad || p.cant || 0,
                                        producto: p.producto?.id ? { name: p.producto.name || p.producto?.id } : (p.producto || p.nombre ? { name: p.producto?.name || p.nombre || '' } : {}),
                                        descripcion: p.descripcion || p.producto?.description || '',
                                        valorUnitario: p.precioUnitario || p.valorUnitario || p.precio || 0,
                                        descuento: p.descuento || 0
                                      };
                                    }),
                                    cotizacionCodigo: pedido.cotizacionCodigo || ''
                                  };

                                  setCotizacionPreview(pedidoPreviewObj);
                                  setMostrarPreview(true);
                                } catch (err) {
                                  console.error('Error al abrir preview del pedido:', err);
                                  Swal.fire('Error', 'No se pudo cargar la información del pedido.', 'error');
                                }
                              }}
                              title="Clic para ver información del pedido"
                            >
                              {pedido.numeroPedido}
                            </a>
                          ) : '---'}
                        </td>

                        <td>{new Date(pedido.createdAt).toLocaleDateString()}</td>
                        <td>{new Date(pedido.fechaEntrega).toLocaleDateString()}</td>
                        <td>{pedido.cliente?.nombre}</td>
                        <td>{pedido.cliente?.ciudad}</td>
                        <td>
                          <strong style={{ color: '#28a745', fontSize: '14px' }}>
                            ${(pedido.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </td>
                        <td className="no-export">
                          <button
                            className='btnTransparente'
                            onClick={() => marcarComoEntregado(pedido._id)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { marcarComoEntregado(pedido._id); } }}
                            style={{ color: '#28a745' }}>
                            <i
                              className="fas fa-check"
                              title="Marcar como entregado"
                              aria-label="Marcar como entregado"
                              role="button"
                              tabIndex={0}
                            />
                          </button>

                          <button
                            onClick={() => cancelarPedido(pedido._id)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { cancelarPedido(pedido._id); } }}
                            className='btnTransparente'
                            style={{ color: '#dc2626' }}>
                            <i
                              className="fas fa-times"
                              title="Marcar como cancelado"
                              aria-label="Marcar como cancelado"
                              role="button"
                              tabIndex={0}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pedidos.length === 0 && <tr><td colSpan="8">No hay pedidos disponibles</td></tr>}
                  </tbody>
                </table>

                <EditarPedido />
              </div>
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={currentPage === i + 1 ? 'active-page' : ''}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>


        </div>
      </div>
      {/** Modal: Agendar Pedido **/}
      {mostrarModalAgendar && (
        <div className="modal-overlay">
          <div className="modal-compact modal-lg">
            <div className="modal-header">
              <h5 className="modal-title">Agendar Pedido </h5>
              <button className="modal-close" onClick={cerrarModalAgendar}>&times;</button>
            </div>
            <form onSubmit={enviarAgendarPedido}>
              <div className="modal-body">
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
                          <th>Responsable</th>
                          <th>Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><input id='cliente-ag' type="text" className="cuadroTexto" placeholder="Nombre o razón social" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} /></td>
                          <td><input id='ciudad-ag' type="text" className="cuadroTexto" placeholder="Ciudad" value={clienteCiudad} onChange={e => setClienteCiudad(e.target.value)} /></td>
                          <td><input id='direccion-ag' type="text" className="cuadroTexto" placeholder="Dirección" value={clienteDireccion} onChange={e => setClienteDireccion(e.target.value)} /></td>
                          <td><input id='telefono-ag' type="number" className="cuadroTexto" placeholder="Teléfono" value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} /></td>
                          <td><input id='email-ag' type="email" className="cuadroTexto" placeholder="Correo electrónico" value={clienteCorreo} onChange={e => setClienteCorreo(e.target.value)} /></td>
                          <td><span id='vendedor-ag'>{user ? `${user.firstName} ${user.surname}` : ''}</span></td>
                          <td><input id='fecha-ag' type="date" className="cuadroTexto" value={fechaPedido} onChange={e => setFechaPedido(e.target.value)} /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <br />
                  <label className="labelDOCS">Descripción pedido</label>
                  <br /><br />
                  <Editor
                    id='descripcion-pedido'
                    onInit={(evt, editor) => (descripcionRef.current = editor)}
                    apiKey="bjhw7gemroy70lt4bgmfvl29zid7pmrwyrtx944dmm4jq39w"
                    textareaName="Descripcion"
                    init={{ height: 200, menubar: false }}
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
                              <select className="cuadroTexto" value={prod.producto} onChange={(e) => handleProductoChange(index, e.target.value)}>
                                <option value="">Seleccione un producto</option>
                                {productos.map(p => (
                                  <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                              </select>
                            </td>
                            <td><input type="text" name="descripcion" className='cuadroTexto' value={prod.descripcion} onChange={(e) => handleChange(index, e)} /></td>
                            <td><input type="number" name="cantidad" className='cuadroTexto' value={prod.cantidad} onChange={(e) => handleChange(index, e)} /></td>
                            <td><input type="number" name="valorUnitario" className='cuadroTexto' value={prod.valorUnitario} onChange={(e) => handleChange(index, e)} readOnly /></td>
                            <td><input type="number" name="descuento" className='cuadroTexto' value={prod.descuento} onChange={(e) => handleChange(index, e)} /></td>
                            <td><input type="number" name="subtotal" className='cuadroTexto' value={prod.subtotal} readOnly /></td>
                            <td><button type="button" className="btn btn-danger" onClick={() => eliminarProducto(index)}>Eliminar</button></td>
                          </tr>
                        ))}
                        {productosSeleccionados.length > 0 && (
                          <tr>
                            <td colSpan={5}></td>
                            <td style={{ fontWeight: 'bold', textAlign: 'right' }}>Total</td>
                            <td style={{ fontWeight: 'bold' }}>
                              {productosSeleccionados.reduce((acc, prod) => acc + (parseFloat(prod.subtotal) || 0), 0).toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <br />
                    <button type="button" className="btn" onClick={agregarProducto}>Agregar Producto</button>
                    {productosSeleccionados.length > 0 && (
                      <button type="button" className="btn btn-danger" onClick={eliminarTodosLosProductos} style={{ marginLeft: '10px' }}>Eliminar Todos</button>
                    )}
                  </div>

                  <br />
                  <label className="labelDOCS">Condiciones de pago</label>
                  <br /><br />
                  <Editor id='condiciones-pago-ag' onInit={(evt, editor) => (condicionesPagoRef.current = editor)} apiKey="bjhw7gemroy70lt4bgmfvl29zid7pmrwyrtx944dmm4jq39w" textareaName="Condiciones" init={{ height: 200, menubar: false }} />

                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-cancel" onClick={cerrarModalAgendar}>Cancelar</button>
                <button type="submit" className="btn-agregar" disabled={agendarLoading}>{agendarLoading ? 'Creando...' : 'Agendar Pedido'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ModalProductosCotizacion
        visible={!!pedidoSeleccionado}
        onClose={() => setPedidoSeleccionado(null)}
        productos={pedidoSeleccionado?.productos || []}
        cotizacionId={pedidoSeleccionado?._id}
      />
      {mostrarPreview && cotizacionPreview && (
        <CotizacionPreview
          datos={cotizacionPreview}
          onClose={() => { setMostrarPreview(false); setCotizacionPreview(null); }}
        />
      )}
      <div className="custom-footer">
        <p className="custom-footer-text">
          © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}