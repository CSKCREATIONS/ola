import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import exportElementToPdf from '../utils/exportToPdf';
import api from '../api/axiosConfig';
import Swal from 'sweetalert2';
import '../App.css';
import SharedListHeaderCard from '../components/SharedListHeaderCard';
import '../cotizaciones-modal.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import CotizacionPreview from '../components/CotizacionPreview';
import { calcularSubtotalProducto, calcularTotales } from '../utils/calculations';
import { formatCurrency, formatDate } from '../utils/formatters';
import DeleteButton from '../components/DeleteButton';

// Componente Field para formularios (reutilizable)
function Field({ id, label, iconClass, children }) {
  return (
    <div>
      <label htmlFor={id} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.5rem',
        fontWeight: '600',
        color: '#374151',
        fontSize: '0.95rem'
      }}>
        <i className={iconClass} style={{ color: '#3b82f6', fontSize: '0.875rem' }} aria-hidden="true"></i>
        <span>{label}</span>
      </label>
      {children}
    </div>
  );
}

Field.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  iconClass: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default function ListaDeCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [blinkOn, setBlinkOn] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroEnviado, setFiltroEnviado] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const location = useLocation();
  const navigate = useNavigate();

  const itemsPerPage = 10;

  const styles = {
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

  const stripHtml = (html) => {
    if (!html && html !== 0) return '';
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = String(html);
      return tmp.textContent || tmp.innerText || '';
    } catch (e) {
      console.warn('stripHtml DOM parsing failed, using regex fallback:', e);
      return String(html).replaceAll(/<[^>]*>/g, '');
    }
  };

  const exportToExcel = (listaCotizaciones) => {
    if (!listaCotizaciones || listaCotizaciones.length === 0) {
      Swal.fire("Error", "No hay datos para exportar", "warning");
      return;
    }

    const dataFormateada = listaCotizaciones.map(cotizacion => ({
      'Nombre': cotizacion.cliente?.nombre || cotizacion.nombre || cotizacion.clienteInfo?.nombre || '',
      'Numero de cotización': cotizacion.numeroCodigo || cotizacion.codigo || '',
      'Ciudad': cotizacion.cliente?.ciudad || cotizacion.ciudad || cotizacion.clienteInfo?.ciudad || '',
      'Teléfono': cotizacion.cliente?.telefono || cotizacion.telefono || cotizacion.clienteInfo?.telefono || '',
      'Correo': cotizacion.cliente?.correo || cotizacion.correo || cotizacion.clienteInfo?.correo || '',
      'Fecha': formatDate(cotizacion.fecha || cotizacion.fechaString || cotizacion.createdAt || ''),
      'estado': cotizacion.estado || 'N/A',
      'enviadoCorreo': cotizacion.enviadoCorreo ? 'Sí' : 'No',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataFormateada);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'ListaDeCotizaciones.xlsx');
  };

  const exportarPDF = async () => {
    try {
      await exportElementToPdf('tabla_cotizaciones', 'listaCotizaciones.pdf');
    } catch (err) {
      console.error('Error exportando PDF:', err);
      Swal.fire('Error', 'No se pudo generar el PDF', 'error');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Error', 'Sesión expirada. Vuelve a iniciar sesión.', 'warning');
      return;
    }

    const fetchData = async () => {
      try {
        const cotRes = await api.get('/api/cotizaciones');
        const cotData = cotRes.data || [];

        const prodRes = await api.get('/api/products');
        const prodData = prodRes.data?.data || prodRes.data || [];

        const cotizacionesOrdenadas = (Array.isArray(cotData) ? cotData : []).sort((a, b) => new Date(b.createdAt || b.fechaCreacion) - new Date(a.createdAt || a.fechaCreacion));
        setCotizaciones(cotizacionesOrdenadas);
        setProductos(Array.isArray(prodData) ? prodData : []);
      } catch (err) {
        console.error('Error in fetchData:', err);
        Swal.fire('Error', 'No se pudieron cargar algunos datos. La aplicación funcionará con datos limitados.', 'warning');
        setCotizaciones([]);
        setProductos([]);
      }
    };

    fetchData();
  }, []);

  const parseBoolLike = (v) => {
    if (v === true || v === 1) return true;
    if (v === false || v === 0 || v === undefined || v === null) return false;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      return ['true', '1', 'si', 'yes', 'agendada', 'agendado', 'agendar'].includes(s);
    }
    return Boolean(v);
  };

  const isEstadoAgendadoString = (estado) => {
    if (!estado || typeof estado !== 'string') return false;
    const s = estado.trim().toLowerCase();
    return s.includes('agend');
  };

  const isAgendada = (valOrCot) => {
    if (valOrCot === undefined || valOrCot === null) return false;
    if (typeof valOrCot === 'object') {
      const cot = valOrCot;
      if (isEstadoAgendadoString(cot.estado)) return true;
      if ('agendada' in cot) return parseBoolLike(cot.agendada);
      return false;
    }
    return parseBoolLike(valOrCot);
  };

  const parseApiDate = (raw) => {
    if (!raw) return null;
    try {
      if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const [y, m, d] = raw.split('-').map(n => Number.parseInt(n, 10));
        return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
      }
      const tmp = new Date(raw);
      if (Number.isNaN(tmp.getTime())) return null;
      return new Date(Date.UTC(tmp.getUTCFullYear(), tmp.getUTCMonth(), tmp.getUTCDate(), 0, 0, 0));
    } catch (e) {
      console.warn('parseApiDate: invalid input', e);
      return null;
    }
  };

  const isRemisionada = (cot) => {
    if (!cot) return false;
    if (cot.estado && typeof cot.estado === 'string') {
      const s = cot.estado.trim().toLowerCase();
      if (s === 'remisionada' || s === 'remisionado' || s === 'remision') return true;
    }
    return Boolean(cot.remision || cot.remisionId || cot.remisionada || cot.numeroRemision);
  };

  const isDeletable = (cot) => {
    try {
      const fechaBaseRaw = cot?.createdAt || cot?.fechaString || cot?.fecha;
      const fechaBase = parseApiDate(fechaBaseRaw) || (fechaBaseRaw ? new Date(fechaBaseRaw) : null);
      if (!fechaBase) return false;
      const ageMs = Date.now() - fechaBase.getTime();
      const daysOld = Math.floor(ageMs / (24 * 60 * 60 * 1000));
      return daysOld >= 15;
    } catch (err) {
      console.error('Error computing deletable for cotizacion', err);
      return false;
    }
  };

  const handleEliminarCotizacion = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta Cotización se cancelará y no podrás revertirlo',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No, mantener',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
      });

      if (!result.isConfirmed) return;

      await api.delete(`/api/cotizaciones/${id}`);
      setCotizaciones(prev => prev.filter(c => c._id !== id));
      Swal.fire('Perfecto', 'Se ha eliminado la cotización.', 'success');
    } catch (err) {
      console.error('Error deleting cotizacion:', err);
      const msg = err?.response?.data?.message || err?.response?.data || err.message;
      Swal.fire('Error', msg || 'No se pudo eliminar la cotización.', 'error');
    }
  };

  const intentarEliminarCotizacion = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return Swal.fire('Error', 'Sesión expirada. Vuelve a iniciar sesión.', 'warning');

      const res = await api.get(`/api/cotizaciones/${id}`);
      const data = res.data || res;
      const cot = data.data || data;

      const fechaBase = cot.createdAt || cot.fecha;
      if (!fechaBase) return Swal.fire('Error', 'No se puede determinar la fecha de la cotización.', 'error');

      const now = new Date();
      const ageMs = now.getTime() - new Date(fechaBase).getTime();
      const daysOld = Math.floor(ageMs / (24 * 60 * 60 * 1000));
      const minDays = 15;

      if (daysOld < minDays) {
        const daysRemaining = minDays - daysOld;
        return Swal.fire('No permitido', `No es posible eliminar la cotización. Deben pasar al menos ${minDays} días desde su creación. Faltan ${daysRemaining} día(s).`, 'warning');
      }

      handleEliminarCotizacion(id);
    } catch (err) {
      console.error('Error en intentarEliminarCotizacion:', err);
      Swal.fire('Error', 'No se pudo verificar la cotización antes de eliminar.', 'error');
    }
  };

  const resolveClienteId = (cotizacion, cot) => {
    if (!cotizacion && !cot) return null;
    if (cotizacion?.cliente?.referencia?._id) return cotizacion.cliente.referencia._id;
    if (cotizacion?.cliente?.referencia) return cotizacion.cliente.referencia;
    if (cot?.cliente?._id) return cot.cliente._id;
    if (cot?.cliente?.referencia?._id) return cot.cliente.referencia._id;
    if (cot?.cliente?.referencia) return cot.cliente.referencia;
    return null;
  };

  const getProductIdFromProductEntry = (p) => {
    if (!p) return null;
    if (p.producto?.id) return (p.producto.id._id || p.producto.id);
    if (p.producto) return p.producto;
    return null;
  };

  const mapProductosParaPedido = (productosArray) => {
    return (productosArray || []).map(p => {
      const productId = getProductIdFromProductEntry(p);
      if (!productId) return null;
      const cantidadNum = Number(p?.cantidad);
      const precioRaw = p?.valorUnitario ?? p?.producto?.price;
      const precioNum = Number(precioRaw);
      return {
        product: productId,
        cantidad: Number.isFinite(cantidadNum) && cantidadNum > 0 ? cantidadNum : 1,
        precioUnitario: Number.isFinite(precioNum) ? precioNum : 0,
      };
    }).filter(Boolean);
  };

  const computeMinAndDefaultDate = (cotizacion) => {
    let baseRaw;
    if (cotizacion?.createdAt) baseRaw = cotizacion.createdAt;
    else if (cotizacion?.fechaString) baseRaw = cotizacion.fechaString;
    else if (cotizacion?.fecha) baseRaw = cotizacion.fecha;
    else baseRaw = new Date();

    const baseDate = parseApiDate(baseRaw) || new Date(baseRaw);
    const minDateStr = baseDate.toISOString().slice(0, 10);

    let defaultDate;
    if (cotizacion?.fechaString) {
      defaultDate = cotizacion.fechaString;
    } else if (cotizacion?.fecha) {
      const parsed = parseApiDate(cotizacion.fecha);
      defaultDate = parsed ? parsed.toISOString().slice(0, 10) : minDateStr;
    } else {
      defaultDate = minDateStr;
    }

    return { minDateStr, defaultDate };
  };

  const promptFechaDescripcion = async (minDateStr, defaultDate) => {
    const { value: formValues } = await Swal.fire({
      title: 'Agendar como pedido',
      html:
        `<div style="display:flex;flex-direction:column;gap:8px;text-align:left">
           <label style="font-weight:600">Fecha de entrega</label>
           <input id="swal-fecha" type="date" class="swal2-input" value="${defaultDate}" min="${minDateStr}" />
           <label style="font-weight:600">Descripción (opcional)</label>
           <input id="swal-descripcion" type="text" class="swal2-input" placeholder="Descripción del pedido (no obligatorio)" />
           <label style="font-weight:600">Condiciones de Pago (opcional)</label>
           <input id="swal-condiciones" type="text" class="swal2-input" placeholder="Ej: 50% anticipo, 50% contra entrega" />
         </div>`,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      preConfirm: async () => {
        let fechaSeleccionada = document.getElementById('swal-fecha')?.value;
        const descripcion = document.getElementById('swal-descripcion')?.value || '';
        const condicionesPago = document.getElementById('swal-condiciones')?.value || '';
        
        if (!fechaSeleccionada) {
          fechaSeleccionada = new Date().toISOString().slice(0, 10);
        }

        try {
          if (typeof fechaSeleccionada !== 'string' || fechaSeleccionada.length < 10) {
            Swal.showValidationMessage('Fecha inválida');
            return false;
          }
          const selStr = fechaSeleccionada.slice(0, 10);
          if (selStr < minDateStr) {
            Swal.showValidationMessage(`La fecha no puede ser anterior a ${minDateStr}`);
            return false;
          }
        } catch (err) {
          console.warn('Error validating date in preConfirm:', err);
          Swal.showValidationMessage('Fecha inválida');
          return false;
        }

        return { fechaSeleccionada, descripcion, condicionesPago };
      }
    });
    return formValues;
  };

  const crearPedidoDesdeCotizacion = async ({ clienteId, productosPedido, fechaEntrega, formValues, cotizacion }) => {
    const pedidoRes = await api.post('/api/pedidos', {
      cliente: clienteId,
      productos: productosPedido,
      fechaEntrega,
      descripcion: formValues.descripcion || '',
      condicionesPago: formValues.condicionesPago || '',
      observacion: `Agendado desde cotización ${cotizacion.codigo}`,
      cotizacionReferenciada: cotizacion._id,
      cotizacionCodigo: cotizacion.codigo
    });
    const pedidoResult = pedidoRes.data || pedidoRes;
    return pedidoResult.data || pedidoResult.pedido || pedidoResult;
  };

  const actualizarOperacionClienteSiCorresponde = async (clienteId) => {
    try {
      const clienteRefId = (clienteId && (clienteId._id || clienteId)) || clienteId;
      if (!clienteRefId) return;
      const clienteRes = await api.get(`/api/clientes/${clienteRefId}`);
      const clienteData = clienteRes.data || clienteRes;
      const clienteDoc = clienteData.data || clienteData;
      if (!clienteDoc) return;
      const esClienteFlag = clienteDoc.esCliente === true || String(clienteDoc.esCliente).toLowerCase() === 'true';
      if (!esClienteFlag) {
        await api.put(`/api/clientes/${clienteRefId}`, { operacion: 'agenda' });
      }
    } catch (err) {
      console.warn('No se pudo actualizar el campo operacion del cliente:', err);
    }
  };

  const agendarCotizacion = async (cot) => {
    try {
      const res = await api.get(`/api/cotizaciones/${cot._id}`);
      const data = res.data || res;
      const cotizacion = data.data || data;

      const confirm = await Swal.fire({
        title: `¿Agendar la cotización '${cotizacion.codigo}' como pedido?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, agendar',
        cancelButtonText: 'No'
      });
      if (!confirm.isConfirmed) return;

      const clienteId = resolveClienteId(cotizacion, cot);
      const productosPedido = mapProductosParaPedido(cotizacion.productos);

      if (productosPedido.length === 0) {
        return Swal.fire('Error', 'La cotización no tiene productos.', 'warning');
      }

      const { minDateStr, defaultDate } = computeMinAndDefaultDate(cotizacion);
      const formValues = await promptFechaDescripcion(minDateStr, defaultDate);
      if (!formValues) return;

      Swal.fire({ title: 'Agendando...', allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });

      const fechaEntrega = new Date(formValues.fechaSeleccionada).toISOString();
      const nuevoPedido = await crearPedidoDesdeCotizacion({ clienteId, productosPedido, fechaEntrega, formValues, cotizacion });
      await actualizarOperacionClienteSiCorresponde(clienteId);

      setCotizaciones(prev => prev.map(c =>
        c._id === cot._id ? { ...c, estado: 'Agendada' } : c
      ));

      navigate('/PedidosAgendados', {
        state: {
          autoPreviewPedido: nuevoPedido,
          highlightPedidoId: nuevoPedido?._id,
          toast: 'cotizacion agendada'
        }
      });
    } catch (error) {
      console.error(error);
      Swal.fire('Error', error.message || 'Hubo un problema al agendar la cotización', 'error');
    }
  };

  const handleOpenPreview = async (cot) => {
    try {
      const res = await api.get(`/api/cotizaciones/${cot._id}`);
      const data = res.data || res;
      const cotizacionCompleta = data.data || data;
      setCotizacionSeleccionada(cotizacionCompleta);
      setMostrarPreview(true);
    } catch (err) {
      console.error('Error loading cotizacion:', err);
      Swal.fire('Error', 'No se pudo cargar la cotización completa.', 'error');
    }
  };

  const handleEditCotizacion = async (cot) => {
    try {
      const res = await api.get(`/api/cotizaciones/${cot._id}`);
      const data = res.data || res;
      const cotizacionCompleta = data.data || data;
      setCotizacionSeleccionada(cotizacionCompleta);
      setModoEdicion(true);
    } catch (err) {
      console.error('Error loading cotizacion for edit:', err);
      Swal.fire('Error', 'No se pudo cargar la cotización completa.', 'error');
    }
  };

  const guardarEdicion = async () => {
    Swal.fire({
      title: 'Guardando cambios...',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const cotizacionConSubtotales = {
        ...cotizacionSeleccionada,
        productos: cotizacionSeleccionada.productos?.map(p => ({
          ...p,
          subtotal: calcularSubtotalProducto(p)
        }))
      };

      const res = await api.put(`/api/cotizaciones/${cotizacionSeleccionada._id}`, cotizacionConSubtotales);
      const cotizacionActualizada = res.data || res;

      const updatedData = cotizacionActualizada.data || cotizacionActualizada;
      const nuevasCotizaciones = cotizaciones.map(c =>
        c._id === cotizacionSeleccionada._id ? {
          ...updatedData,
          ...cotizacionConSubtotales
        } : c
      );
      setCotizaciones(nuevasCotizaciones);

      setModoEdicion(false);
      const previewData = { ...updatedData, ...cotizacionConSubtotales };
      setCotizacionSeleccionada(previewData);
      setMostrarPreview(true);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Cotización editada',
        showConfirmButton: false,
        timer: 2000
      });

    } catch (error) {
      console.error('Error al guardar cotización:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'No se pudo guardar la cotización',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const agregarProducto = () => {
    const nuevoProducto = {
      producto: {
        id: '',
        name: ''
      },
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      subtotal: 0
    };

    const nuevosProductos = [...(cotizacionSeleccionada.productos || []), nuevoProducto];
    setCotizacionSeleccionada({
      ...cotizacionSeleccionada,
      productos: nuevosProductos
    });
  };

  const eliminarProducto = (index) => {
    const nuevosProductos = cotizacionSeleccionada.productos.filter((_, i) => i !== index);
    setCotizacionSeleccionada({
      ...cotizacionSeleccionada,
      productos: nuevosProductos
    });
  };

  const cotizacionesFiltradas = cotizaciones.filter(cot => {
    let fechaCompare = null;
    if (cot?.fechaString) {
      fechaCompare = cot.fechaString;
    } else if (cot?.fecha) {
      const parsed = parseApiDate(cot.fecha);
      fechaCompare = parsed ? parsed.toISOString().slice(0, 10) : null;
    }
    const coincideFecha = !filtroFecha || fechaCompare === filtroFecha;
    const coincideCliente = !filtroCliente || cot.cliente?.nombre?.toLowerCase().includes(filtroCliente.toLowerCase());
    const coincideEnviado = !filtroEnviado ||
      (filtroEnviado === 'Si' && cot.enviadoCorreo) ||
      (filtroEnviado === 'No' && !cot.enviadoCorreo);
    return coincideFecha && coincideCliente && coincideEnviado;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = cotizacionesFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(cotizacionesFiltradas.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    if (location?.state?.abrirFormato && location?.state?.cotizacion) {
      const cot = location.state.cotizacion;
      setCotizacionSeleccionada(cot);
      setMostrarPreview(true);

      const id = cot._id || cot.id;
      if (id) {
        setCotizaciones(prev => {
          if (Array.isArray(prev) && prev.some(p => p._id === id)) return prev;
          return [cot, ...(Array.isArray(prev) ? prev : [])];
        });
      }
    }
  }, [location]);

  useEffect(() => {
    if (!modoEdicion) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [modoEdicion]);

  const closeModal = () => {
    setModoEdicion(false);
    setCotizacionSeleccionada(null);
  };

  const closePreviewAndBlink = () => {
    const cot = cotizacionSeleccionada;
    const id = cot?._id || cot?.id;
    setMostrarPreview(false);
    setCotizacionSeleccionada(null);
    if (!id) return;

    setHighlightId(id);
    setBlinkOn(true);
    let visible = true;
    const interval = setInterval(() => {
      visible = !visible;
      setBlinkOn(visible);
    }, 400);

    setTimeout(() => {
      clearInterval(interval);
      setBlinkOn(false);
      setHighlightId(null);
    }, 3000);
  };

  const handleEmailSent = (cotizacionId) => {
    setCotizaciones(prevCotizaciones =>
      prevCotizaciones.map(cot =>
        cot._id === cotizacionId
          ? { ...cot, enviadoCorreo: true }
          : cot
      )
    );

    if (cotizacionSeleccionada && cotizacionSeleccionada._id === cotizacionId) {
      setCotizacionSeleccionada(prev => ({
        ...prev,
        enviadoCorreo: true
      }));
    }
  };

  const handleRemisionCreated = (cotizacionId, remisionResult) => {
    setCotizaciones(prev => prev.map(c =>
      c._id === cotizacionId
        ? { ...c, remisionada: true, numeroRemision: remisionResult?.numeroRemision || remisionResult?.remision?.numeroRemision || remisionResult?.numeroRemision }
        : c
    ));

    if (cotizacionSeleccionada && (cotizacionSeleccionada._id === cotizacionId)) {
      setCotizacionSeleccionada(prev => ({ ...prev, remisionada: true, numeroRemision: remisionResult?.numeroRemision || remisionResult?.remision?.numeroRemision || remisionResult?.numeroRemision }));
    }
  };

  return (
    <div className="cotizaciones-container">
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="max-width">
          <div className="contenido-modulo">
            <SharedListHeaderCard
              title="Lista de Cotizaciones"
              subtitle="Gestión de cotizaciones registradas en el sistema"
              iconClass="fa-solid fa-calendar-check-to-slot"
            >
              <div className="export-buttons">
                <button
                  onClick={() => exportToExcel(cotizacionesFiltradas)}
                  className="export-btn excel"
                >
                  <i className="fa-solid fa-file-excel"></i><span>Exportar Excel</span>
                </button>
                <button
                  onClick={exportarPDF}
                  className="export-btn pdf"
                >
                  <i className="fa-solid fa-file-pdf"></i><span>Exportar PDF</span>
                </button>
              </div>
            </SharedListHeaderCard>

            {/* Panel de filtros */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '25px',
              marginBottom: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    borderRadius: '12px',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i aria-hidden={true} className="fa-solid fa-filter" style={{ color: 'white', fontSize: '16px' }}></i>
                  </div>
                  <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1.3rem', fontWeight: '600' }}>
                    Filtros y Controles
                  </h4>
                </div>

                <div style={{
                  background: '#f8fafc',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i aria-hidden={true} className="fa-solid fa-info-circle" style={{ color: '#3b82f6', fontSize: '14px' }}></i>
                  <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                    {cotizacionesFiltradas.length} cotización{cotizacionesFiltradas.length === 1 ? '' : 'es'} encontrada{cotizacionesFiltradas.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                alignItems: 'end'
              }}>
                <div>
                  <label htmlFor="filter-fecha" style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    <i aria-hidden={true} className="fa-solid fa-calendar icon-gap" style={{ color: '#6366f1' }}></i>
                    <span>Fecha:</span>
                  </label>
                  <input
                    id="filter-fecha"
                    type="date"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500',
                      background: 'white',
                      color: '#374151',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label htmlFor="filter-cliente" style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    <i aria-hidden={true} className="fa-solid fa-user icon-gap" style={{ color: '#6366f1' }}></i>
                    <span>Cliente:</span>
                  </label>
                  <input
                    id="filter-cliente"
                    type="text"
                    placeholder="Buscar cliente..."
                    value={filtroCliente}
                    onChange={(e) => setFiltroCliente(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500',
                      background: 'white',
                      color: '#374151',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label htmlFor="filter-enviado" style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    <i aria-hidden={true} className="fa-solid fa-envelope icon-gap" style={{ color: '#6366f1' }}></i>
                    <span>Estado de envío:</span>
                  </label>
                  <select
                    id="filter-enviado"
                    value={filtroEnviado}
                    onChange={(e) => setFiltroEnviado(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500',
                      background: 'white',
                      color: '#374151',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  >
                    <option value="">📋 Todos</option>
                    <option value="Si">✅ Enviados</option>
                    <option value="No">❌ No enviados</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla de cotizaciones */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                padding: '20px 25px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    borderRadius: '12px',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fa-solid fa-list" style={{ color: 'white', fontSize: '16px' }}></i>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1.3rem', fontWeight: '600' }}>
                      Cotizaciones Registradas
                    </h4>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                      Total: {cotizacionesFiltradas.length} cotización{cotizacionesFiltradas.length === 1 ? '' : 'es'}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ overflow: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }} id='tabla_cotizaciones'>
                  <thead>
                    <tr style={{
                      background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      <th style={{
                        padding: '16px 12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px'
                      }}>
                        <i aria-hidden={true} className="fa-solid fa-hashtag icon-gap" style={{ color: '#6366f1' }}></i>
                        <span></span>
                      </th>
                      <th style={{
                        padding: '16px 12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px'
                      }}>
                        <i aria-hidden={true} className="fa-solid fa-code icon-gap" style={{ color: '#6366f1' }}></i>
                        <span>CÓDIGO COTIZACIÓN</span>
                      </th>
                      <th style={{
                        padding: '16px 12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px'
                      }}>
                        <i aria-hidden={true} className="fa-solid fa-calendar icon-gap" style={{ color: '#6366f1' }}></i>
                        <span>FECHA ELABORACIÓN</span>
                      </th>
                      <th style={{
                        padding: '16px 12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px'
                      }}>
                        <i aria-hidden={true} className="fa-solid fa-user icon-gap" style={{ color: '#6366f1' }}></i>
                        <span>CLIENTE</span>
                      </th>
                      <th style={{
                        padding: '16px 12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px'
                      }}>
                        <i aria-hidden={true} className="fa-solid fa-user-tie icon-gap" style={{ color: '#6366f1' }}></i>
                        <span>RESPONSABLE</span>
                      </th>
                      <th style={{
                        padding: '16px 12px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px'
                      }}>
                        <i aria-hidden={true} className="fa-solid fa-envelope icon-gap" style={{ color: '#6366f1' }}></i>
                        <span>ENVIADO</span>
                      </th>
                      <th style={{
                        padding: '16px 12px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px'
                      }}>
                        <i aria-hidden={true} className="fa-solid fa-flag icon-gap" style={{ color: '#6366f1' }}></i>
                        <span>ESTADO</span>
                      </th>
                      <th style={{
                        padding: '16px 12px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px'
                      }}>
                        <i aria-hidden={true} className="fa-solid fa-cogs icon-gap" style={{ color: '#6366f1' }}></i>
                        <span>ACCIONES</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((cot, index) => {
                      let rowClass = '';
                      if (highlightId === cot._id) {
                        rowClass = blinkOn ? 'row-blink' : 'row-blink-off';
                      }

                      const remisionadaBadge = (
                        <span style={{
                          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          <i aria-hidden={true} className="fa-solid fa-tag" style={{ fontSize: '10px' }}></i>
                          <span>REMISIONADA</span>
                        </span>
                      );

                      const agendadaBadge = (
                        <span style={{
                          backgroundColor: '#16a34a',
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          <i aria-hidden={true} className="fa-solid fa-calendar-check" style={{ fontSize: '10px' }}></i>
                          <span>AGENDADA</span>
                        </span>
                      );

                      const pendienteBadge = (
                        <span style={{
                          backgroundColor: '#0ea5e9',
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          <i aria-hidden={true} className="fa-solid fa-clock" style={{ fontSize: '10px' }}></i>
                          <span>PENDIENTE</span>
                        </span>
                      );

                      let statusBadge = pendienteBadge;
                      if (isRemisionada(cot)) {
                        statusBadge = remisionadaBadge;
                      } else if (isAgendada(cot)) {
                        statusBadge = agendadaBadge;
                      }

                      return (
                        <tr key={cot._id}
                          className={rowClass}
                          style={{
                            borderBottom: '1px solid #f3f4f6',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td style={{ padding: '16px 12px', fontWeight: '600', color: '#4b5563' }}>
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td style={{ padding: '16px 12px' }}>
                            <button
                              style={{
                                cursor: 'pointer',
                                color: '#3b82f6',
                                textDecoration: 'none',
                                fontWeight: '600',
                                fontSize: '14px',
                                transition: 'color 0.2s ease',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                font: 'inherit'
                              }}
                              onClick={() => handleOpenPreview(cot)}
                              onMouseEnter={(e) => e.target.style.color = '#1e40af'}
                              onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
                            >
                              {cot.codigo}
                            </button>
                          </td>
                          <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                            {formatDate(cot)}
                          </td>
                          <td style={{ padding: '16px 12px' }}>
                            <div style={{ fontWeight: '600', color: '#1f2937' }}>
                              {cot.cliente?.nombre || 'Sin nombre'}
                            </div>
                          </td>
                          <td style={{ padding: '16px 12px' }}>
                            <div style={{ color: '#374151', fontWeight: 600 }}>
                              {cot.responsable ? `${cot.responsable.firstName || ''} ${cot.responsable.surname || ''}`.trim() : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin responsable</span>}
                            </div>
                          </td>
                          <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                            {cot.enviadoCorreo ? (
                              <span style={{
                                background: '#dcfce7',
                                color: '#16a34a',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <i aria-hidden={true} className="fa-solid fa-check"></i>
                                <span>SÍ</span>
                              </span>
                            ) : (
                              <span style={{
                                background: '#fef2f2',
                                color: '#dc2626',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <i aria-hidden={true} className="fa-solid fa-times"></i>
                                <span>NO</span>
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                            {statusBadge}
                          </td>
                          <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              {isDeletable(cot) && (
                                <DeleteButton onClick={() => intentarEliminarCotizacion(cot._id)} title="Eliminar cotización" ariaLabel="Eliminar cotización">
                                  <i aria-hidden={true} className="fa-solid fa-trash"></i>
                                </DeleteButton>
                              )}

                              {!isAgendada(cot) && !isRemisionada(cot) && (
                                <button
                                  onClick={() => handleEditCotizacion(cot)}
                                  title="Editar cotización"
                                  aria-label="Editar cotización"
                                  style={{
                                    background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                                    color: '#1e40af',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 10px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 4px rgba(30, 64, 175, 0.2)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 8px rgba(30, 64, 175, 0.3)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 4px rgba(30, 64, 175, 0.2)';
                                  }}
                                >
                                  <i aria-hidden={true} className="fa-solid fa-pen-to-square"></i>
                                </button>
                              )}

                              {!isAgendada(cot) && !isRemisionada(cot) && (
                                <button
                                  onClick={() => agendarCotizacion(cot)}
                                  title="Agendar como pedido"
                                  aria-label="Agendar como pedido"
                                  style={{
                                    background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                                    color: '#16a34a',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 10px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 8px rgba(22, 163, 74, 0.3)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 4px rgba(22, 163, 74, 0.2)';
                                  }}
                                >
                                  <i aria-hidden={true} className="fa-solid fa-calendar-plus"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {cotizacionesFiltradas.length === 0 && (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '80px 20px' }}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '20px'
                          }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                              borderRadius: '50%',
                              padding: '25px',
                              marginBottom: '10px'
                            }}>
                              <i className="fa-solid fa-file-invoice" style={{
                                fontSize: '3.5rem',
                                color: '#9ca3af'
                              }}></i>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <h5 style={{
                                color: '#6b7280',
                                margin: '0 0 12px 0',
                                fontSize: '1.2rem',
                                fontWeight: '600'
                              }}>
                                No hay cotizaciones disponibles
                              </h5>
                              <p style={{
                                color: '#9ca3af',
                                margin: 0,
                                fontSize: '14px',
                                lineHeight: '1.5'
                              }}>
                                No se encontraron cotizaciones con los filtros aplicados
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div style={{
                  padding: '20px 25px',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      style={{
                        padding: '8px 16px',
                        border: currentPage === i + 1 ? '2px solid #6366f1' : '2px solid #e5e7eb',
                        borderRadius: '8px',
                        background: currentPage === i + 1 ? '#6366f1' : 'white',
                        color: currentPage === i + 1 ? 'white' : '#4b5563',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== i + 1) {
                          e.target.style.borderColor = '#6366f1';
                          e.target.style.color = '#6366f1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== i + 1) {
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.color = '#4b5563';
                        }
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {mostrarPreview && cotizacionSeleccionada && (
        <CotizacionPreview
          datos={cotizacionSeleccionada}
          onClose={closePreviewAndBlink}
          onEmailSent={handleEmailSent}
          onRemisionCreated={handleRemisionCreated}
          onEdit={(datos) => {
            try {
              setMostrarPreview(false);
              handleEditCotizacion(datos);
            } catch (e) {
              console.error('Error opening edit modal from preview:', e);
            }
          }}
        />
      )}

      {/* Modal de Edición */}
      {modoEdicion && cotizacionSeleccionada && (
        <div
          id="editCotizacionModal"
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            margin: 0,
            padding: 0
          }}
                  onClick={(e) => { if (e.target.id === 'editCotizacionModal') closeModal(); }}
                >
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    maxWidth: '1200px',
                    width: '95%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    position: 'relative'
                  }}>
                    {/* Modal content would go here */}
                  </div>
                </div>
              )}
            </div>
          );
        }
