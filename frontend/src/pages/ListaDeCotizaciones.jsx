import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import Modal from '../components/Modal';
import { calcularSubtotalProducto, calcularTotales } from '../utils/calculations';
import { formatCurrency, formatDate } from '../utils/formatters';
import DeleteButton from '../components/DeleteButton';

export default function ListaDeCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [blinkOn, setBlinkOn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  // Helper para detectar si una cotización está marcada como agendada.
  // Acepta tanto el objeto cotización completo como valores primitivos (compatibilidad backwards).
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
    // objeto cotización
    if (typeof valOrCot === 'object') {
      const cot = valOrCot;
      if (isEstadoAgendadoString(cot.estado)) return true;
      if ('agendada' in cot) return parseBoolLike(cot.agendada);
      return false;
    }
    // primitivo
    return parseBoolLike(valOrCot);
  };

  // Helper: parsear fechas que vienen desde la API evitando shifts de zona horaria.
  // Acepta: fechaString 'YYYY-MM-DD', ISO date string, Date object.
  const parseApiDate = (raw) => {
    if (!raw) return null;
    try {
      if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const [y, m, d] = raw.split('-').map(n => Number.parseInt(n, 10));
        return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
      }
      const tmp = new Date(raw);
      if (Number.isNaN(tmp.getTime())) return null;
      // Usar los componentes UTC para evitar shifts por zona horaria
      return new Date(Date.UTC(tmp.getUTCFullYear(), tmp.getUTCMonth(), tmp.getUTCDate(), 0, 0, 0));
    } catch (e) {
      return null;
    }
  };

  // Helper para detectar si una cotización ya fue remisionada
  const isRemisionada = (cot) => {
    if (!cot) return false;
    if (cot.estado && typeof cot.estado === 'string') {
      const s = cot.estado.trim().toLowerCase();
      if (s === 'remisionada' || s === 'remisionado' || s === 'remision') return true;
    }
    return Boolean(cot.remision || cot.remisionId || cot.remisionada || cot.numeroRemision);
  };

  // Helper para determinar si han pasado al menos 15 días desde la creación/fecha
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
      // Si el backend confirma la eliminación, actualizar estado local
      setCotizaciones(prev => prev.filter(c => c._id !== id));
      Swal.fire('Perfecto', 'Se ha eliminado la cotización.', 'success');
    } catch (err) {
      console.error('Error deleting cotizacion:', err);
      const msg = err?.response?.data?.message || err?.response?.data || err.message;
      Swal.fire('Error', msg || 'No se pudo eliminar la cotización.', 'error');
    }
  };

  // Intentar eliminar: primero validar antigüedad (15 días) en el frontend
  const intentarEliminarCotizacion = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return Swal.fire('Error', 'Sesión expirada. Vuelve a iniciar sesión.', 'warning');

      const res = await api.get(`/api/cotizaciones/${id}`);
      const data = res.data || res;
      const cot = data.data || data;

      // Determinar fecha base: preferir createdAt, si no existe usar fecha
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

      // Si cumple, proceder a llamar al handler que muestra confirmación y borra
      handleEliminarCotizacion(id);
    } catch (err) {
      console.error('Error en intentarEliminarCotizacion:', err);
      Swal.fire('Error', 'No se pudo verificar la cotización antes de eliminar.', 'error');
    }
  };

  // Agendar una cotización como pedido (extraído para evitar nesting profundo en JSX)
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

      const clienteId = (
        cotizacion?.cliente?.referencia?._id ||
        cotizacion?.cliente?.referencia ||
        cot?.cliente?._id ||
        cot?.cliente?.referencia?._id ||
        cot?.cliente?.referencia
      );

      // Mapear productos al formato de pedido
      const productosPedido = (cotizacion.productos || []).map(p => {
        const productId = (p?.producto?.id && (p.producto.id._id || p.producto.id)) || p?.producto;
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

      if (productosPedido.length === 0) {
        return Swal.fire('Error', 'La cotización no tiene productos.', 'warning');
      }

      // Pedir al usuario la fecha de entrega y campos opcionales (descripcion, condiciones de pago)
      const baseRaw = cotizacion.createdAt ? cotizacion.createdAt : (cotizacion.fechaString ? cotizacion.fechaString : (cotizacion.fecha ? cotizacion.fecha : new Date()));
      const baseDate = parseApiDate(baseRaw) || new Date(baseRaw);
      const minDateStr = baseDate.toISOString().slice(0, 10);
      const defaultDate = cotizacion.fechaString ? cotizacion.fechaString : (cotizacion.fecha ? parseApiDate(cotizacion.fecha)?.toISOString().slice(0,10) || minDateStr : minDateStr); // YYYY-MM-DD

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
        preConfirm: () => {
          const fechaSeleccionada = document.getElementById('swal-fecha')?.value;
          const descripcion = document.getElementById('swal-descripcion')?.value || '';
          const condicionesPago = document.getElementById('swal-condiciones')?.value || '';

          if (!fechaSeleccionada) {
            Swal.showValidationMessage('Por favor seleccione la fecha de entrega');
            return false;
          }

          // Validar que la fecha no sea anterior a la fecha de registro/fecha de la cotización
          try {
            const sel = new Date(fechaSeleccionada);
            const minDate = new Date(minDateStr + 'T00:00:00');
            if (sel < minDate) {
              Swal.showValidationMessage(`La fecha no puede ser anterior a ${minDateStr}`);
              return false;
            }
          } catch (err) {
            Swal.showValidationMessage('Fecha inválida');
            return false;
          }

          return { fechaSeleccionada, descripcion, condicionesPago };
        }
      });

      if (!formValues) return;

      const fechaEntrega = new Date(formValues.fechaSeleccionada).toISOString();

      await api.post('/api/pedidos', {
        cliente: clienteId,
        productos: productosPedido,
        fechaEntrega,
        descripcion: formValues.descripcion || '',
        condicionesPago: formValues.condicionesPago || '',
        observacion: `Agendado desde cotización ${cotizacion.codigo}`,
        cotizacionReferenciada: cotizacion._id,
        cotizacionCodigo: cotizacion.codigo
      });

      // Si el cliente existe en la colección 'clientes', actualizar solo el campo 'operacion'
      // cuando su flag 'esCliente' sea false. No modificar 'esCliente'.
      try {
        const clienteRefId = (clienteId && (clienteId._id || clienteId)) || clienteId;
        if (clienteRefId) {
          const clienteRes = await api.get(`/api/clientes/${clienteRefId}`);
          const clienteData = clienteRes.data || clienteRes;
          const clienteDoc = clienteData.data || clienteData;
          if (clienteDoc) {
            const esClienteFlag = clienteDoc.esCliente === true || String(clienteDoc.esCliente).toLowerCase() === 'true';
            if (!esClienteFlag) {
              // Actualizar solo 'operacion' a 'agenda'
              await api.put(`/api/clientes/${clienteRefId}`, { operacion: 'agenda' });
            }
          }
        }
      } catch (err) {
        console.warn('No se pudo actualizar el campo operacion del cliente:', err);
      }

      // Actualizar el estado local de la cotización (usar campo 'estado')
      setCotizaciones(prev => prev.map(c =>
        c._id === cot._id ? { ...c, estado: 'Agendada' } : c
      ));

      await Swal.fire('Agendado', 'La cotización fue agendada como pedido.', 'success');
      navigate('/PedidosAgendados');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', error.message || 'Hubo un problema al agendar la cotización', 'error');
    }
  };

  // Handler para abrir preview de una cotización (extraído para evitar async inline)
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

  // Handler para abrir edición de una cotización (extraído para evitar async inline)
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
    // token eliminado por no usarse directamente

    // Mostrar loading
    Swal.fire({
      title: 'Guardando cambios...',
      text: 'Por favor espera mientras se actualiza la cotización',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Calcular subtotales antes de guardar usando helper compartido
      const cotizacionConSubtotales = {
        ...cotizacionSeleccionada,
        productos: cotizacionSeleccionada.productos?.map(p => ({
          ...p,
          subtotal: calcularSubtotalProducto(p)
        }))
      };

      const res = await api.put(`/api/cotizaciones/${cotizacionSeleccionada._id}`, cotizacionConSubtotales);
      const cotizacionActualizada = res.data || res;

      // Actualizar la lista local
      const updatedData = cotizacionActualizada.data || cotizacionActualizada;
      const nuevasCotizaciones = cotizaciones.map(c =>
        c._id === cotizacionSeleccionada._id ? {
          ...updatedData,
          ...cotizacionConSubtotales
        } : c
      );
      setCotizaciones(nuevasCotizaciones);

      // Cerrar modal
      setModoEdicion(false);
      setCotizacionSeleccionada(null);

      // Mostrar éxito
      await Swal.fire({
        title: '¡Guardado!',
        text: 'La cotización ha sido actualizada correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
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
    Swal.fire({
      title: '¿Eliminar producto?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        const nuevosProductos = cotizacionSeleccionada.productos.filter((_, i) => i !== index);
        setCotizacionSeleccionada({
          ...cotizacionSeleccionada,
          productos: nuevosProductos
        });

        Swal.fire({
          title: 'Eliminado',
          text: 'El producto ha sido eliminado',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroEnviado, setFiltroEnviado] = useState('');

  const cotizacionesFiltradas = cotizaciones.filter(cot => {
    const fechaCompare = cot.fechaString ? cot.fechaString : (cot.fecha ? parseApiDate(cot.fecha)?.toISOString().slice(0, 10) : null);
    const coincideFecha = !filtroFecha || fechaCompare === filtroFecha;
    const coincideCliente = !filtroCliente || cot.cliente?.nombre?.toLowerCase().includes(filtroCliente.toLowerCase());
    const coincideEnviado = !filtroEnviado ||
      (filtroEnviado === 'Si' && cot.enviadoCorreo) ||
      (filtroEnviado === 'No' && !cot.enviadoCorreo);
    return coincideFecha && coincideCliente && coincideEnviado;
  });



  /*** PAGINACIÓN ***/
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = cotizacionesFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(cotizacionesFiltradas.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Si venimos con state desde RegistrarCotizacion: abrir formato y marcar pending highlight
  useEffect(() => {
    if (location?.state?.abrirFormato && location?.state?.cotizacion) {
      const cot = location.state.cotizacion;
      setCotizacionSeleccionada(cot);
      setMostrarPreview(true);

      const id = cot._id || cot.id;
      if (id) {
        // Insertar la cotización en la lista si no existe para asegurar que la fila esté renderizada
        setCotizaciones(prev => {
          if (Array.isArray(prev) && prev.some(p => p._id === id)) return prev;
          return [cot, ...(Array.isArray(prev) ? prev : [])];
        });

        // Marcarla como pendiente para que al cerrar el preview se produzca el titileo

        // Limpieza eventual del history.state para evitar reaperturas

      }
    }
  }, [location]);

  // Manejar tecla Escape para cerrar el modal de edición desde el documento
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

  // Helper para cerrar el modal de edición desde varios lugares
  const closeModal = () => {
    setModoEdicion(false);
    setCotizacionSeleccionada(null);
  };

  // Cálculo de subtotales usando helper compartido

  // enviarCorreo, imprimir y abrirFormato eliminados (no usados)

  // Cierra el preview y hace titilar la fila correspondiente por 3s
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

  // Función para manejar cuando se envía un correo y actualizar el estado
  const handleEmailSent = (cotizacionId) => {
    // Actualizar el estado de la cotización en la lista
    setCotizaciones(prevCotizaciones =>
      prevCotizaciones.map(cot =>
        cot._id === cotizacionId
          ? { ...cot, enviadoCorreo: true }
          : cot
      )
    );

    // También actualizar la cotización seleccionada si es la misma
    if (cotizacionSeleccionada && cotizacionSeleccionada._id === cotizacionId) {
      setCotizacionSeleccionada(prev => ({
        ...prev,
        enviadoCorreo: true
      }));
    }
  };

  // Callback cuando una cotización fue remisionada (actualiza la lista y la selección si aplica)
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

  // abrirEdicion eliminado (no utilizado; edición se maneja inline en botones)


  // limpiarHTML eliminado (sin referencia en el JSX)


  return (
    <div className="cotizaciones-container">
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="max-width">
          <div className="contenido-modulo">
            {/* Encabezado profesional del módulo */}
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

            {/* Panel de filtros avanzado */}
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


            {/* Tabla de cotizaciones mejorada */}
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
                      // Compute row class in a clear, statement-based way (avoid nested ternary)
                      let rowClass = '';
                      if (highlightId === cot._id) {
                        rowClass = blinkOn ? 'row-blink' : 'row-blink-off';
                      }

                      // Precompute badge variants to keep the JSX clean and avoid nested ternaries
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

              {/* Paginación mejorada */}
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
        />
      )}

      {/* Modal de Edición */}
      {modoEdicion && cotizacionSeleccionada && (
        <Modal isOpen={modoEdicion} onClose={closeModal} title={`Editar Cotización`} className="modal-content-large cotizacion-modal-container">
          <div style={{ marginBottom: '8px' }}>
            <div className="header-info">
              <span className="cotizacion-codigo">#{cotizacionSeleccionada.codigo}</span>
              <span className="fecha-cotizacion" style={{ marginLeft: '12px' }}>
                <i aria-hidden={true} className="fa-solid fa-calendar"></i>
                  <span style={{ marginLeft: '6px' }}>{formatDate(cotizacionSeleccionada)}</span>
              </span>
            </div>
          </div>

          <div className="modal-body">
            <div className="form-section">
              <div className="section-title">
                <i aria-hidden={true} className="fa-solid fa-user-circle"></i>
                <h4>Información del Cliente</h4>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '15px', alignItems: 'end' }}>
                <div className="form-group" style={{ flex: '1' }}>
                  <label htmlFor="input-lista-cot-1"><i aria-hidden={true} className="fa-solid fa-id-badge"></i> <span>Nombre Completo *</span></label>
                  <input id="input-lista-cot-1"
                    type="text"
                    placeholder="Ingrese el nombre completo del cliente"
                    value={cotizacionSeleccionada.cliente?.nombre || ''}
                    onChange={(e) => setCotizacionSeleccionada({
                      ...cotizacionSeleccionada,
                      cliente: { ...cotizacionSeleccionada.cliente, nombre: e.target.value }
                    })}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: '1' }}>
                  <label htmlFor="input-lista-cot-2"><i aria-hidden={true} className="fa-solid fa-at"></i> <span>Correo Electrónico *</span></label>
                  <input id="input-lista-cot-2"
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={cotizacionSeleccionada.cliente?.correo || ''}
                    onChange={(e) => setCotizacionSeleccionada({
                      ...cotizacionSeleccionada,
                      cliente: { ...cotizacionSeleccionada.cliente, correo: e.target.value }
                    })}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: '1' }}>
                  <label htmlFor="input-lista-cot-3"><i aria-hidden={true} className="fa-solid fa-mobile-screen-button"></i> <span>Teléfono</span></label>
                  <input id="input-lista-cot-3"
                    type="tel"
                    placeholder="+57 300 123 4567"
                    value={cotizacionSeleccionada.cliente?.telefono || ''}
                    onChange={(e) => setCotizacionSeleccionada({
                      ...cotizacionSeleccionada,
                      cliente: { ...cotizacionSeleccionada.cliente, telefono: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group" style={{ flex: '1' }}>
                  <label htmlFor="input-lista-cot-4"><i aria-hidden={true} className="fa-solid fa-map-location-dot"></i> <span>Ciudad</span></label>
                  <input id="input-lista-cot-4"
                    type="text"
                    placeholder="Ciudad"
                    value={cotizacionSeleccionada.cliente?.ciudad || ''}
                    onChange={(e) => setCotizacionSeleccionada({
                      ...cotizacionSeleccionada,
                      cliente: { ...cotizacionSeleccionada.cliente, ciudad: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '15px' }}>
                <label htmlFor="input-lista-cot-5"><i aria-hidden={true} className="fa-solid fa-location-arrow"></i> <span>Dirección Completa</span></label>
                <input id="input-lista-cot-5"
                  type="text"
                  placeholder="Calle, número, barrio, referencias adicionales"
                  value={cotizacionSeleccionada.cliente?.direccion || ''}
                  onChange={(e) => setCotizacionSeleccionada({
                    ...cotizacionSeleccionada,
                    cliente: { ...cotizacionSeleccionada.cliente, direccion: e.target.value }
                  })}
                />
              </div>
            </div>

            <div className="form-section">
              <div className="section-title">
                <i aria-hidden={true} className="fa-solid fa-file-contract"></i>
                <h4>Detalles de la Cotización</h4>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="input-lista-cot-6"><i aria-hidden={true} className="fa-solid fa-file-text"></i> <span>Descripción del Proyecto</span></label>
                  <textarea id="input-lista-cot-6"
                    placeholder="Detalle los servicios o productos incluidos en esta cotización..."
                    value={cotizacionSeleccionada.descripcion || ''}
                    onChange={(e) => setCotizacionSeleccionada({
                      ...cotizacionSeleccionada,
                      descripcion: e.target.value
                    })}
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="input-lista-cot-7"><i aria-hidden={true} className="fa-solid fa-hand-holding-dollar"></i> <span>Condiciones de Pago</span></label>
                  <textarea id="input-lista-cot-7"
                    placeholder="Ej: 50% anticipo al firmar contrato, 50% contra entrega final..."
                    value={cotizacionSeleccionada.condicionesPago || ''}
                    onChange={(e) => setCotizacionSeleccionada({
                      ...cotizacionSeleccionada,
                      condicionesPago: e.target.value
                    })}
                    rows="4"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cotizacion-enviadoCorreo-checkbox"><i aria-hidden={true} className="fa-solid fa-envelope"></i> <span>Estado de Envío</span></label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        id="cotizacion-enviadoCorreo-checkbox"
                        type="checkbox"
                        checked={cotizacionSeleccionada.enviadoCorreo || false}
                        onChange={(e) => setCotizacionSeleccionada({
                          ...cotizacionSeleccionada,
                          enviadoCorreo: e.target.checked
                        })}
                      />
                      <span>Enviado por correo electrónico</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section products-section">
              <div className="section-header">
                <div className="section-title">
                  <i aria-hidden={true} className="fa-solid fa-shopping-cart"></i>
                  <h4>Productos y Servicios</h4>
                  <span className="productos-count">
                    {cotizacionSeleccionada.productos?.length || 0} elemento{(cotizacionSeleccionada.productos?.length || 0) === 1 ? '' : 's'}
                  </span>
                </div>
                <button className="btn-add" onClick={agregarProducto}>
                  <i aria-hidden={true} className="fa-solid fa-plus-circle"></i>
                  <span>Agregar Producto</span>
                </button>
              </div>

              {(!cotizacionSeleccionada.productos || cotizacionSeleccionada.productos?.length === 0) ? (
                <div className="empty-products">
                  <i aria-hidden={true} className="fa-solid fa-shopping-basket"></i>
                  <p>No hay productos agregados</p>
                  <p className="empty-subtitle">Comience agregando productos o servicios a esta cotización</p>
                </div>
              ) : (
                <div className="productos-list">
                  {cotizacionSeleccionada.productos?.map((producto, index) => (
                    <div key={producto.producto?.id || producto._id || producto.codigo || index} className="producto-item">
                      <div className="producto-header">
                        <span className="producto-numero">#{index + 1}</span>
                        <button
                          className="btn-remove"
                          onClick={() => eliminarProducto(index)}
                          title="Eliminar producto"
                          aria-label="Eliminar producto"
                        >
                          <i aria-hidden={true} className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                      <div className="producto-row">
                        <div className="form-group producto-select">
                          <label htmlFor="input-lista-cot-8"><i aria-hidden={true} className="fa-solid fa-box"></i> <span>Producto *</span></label>
                          <select id="input-lista-cot-8"
                            value={producto.producto?.id || ''}
                            onChange={(e) => {
                              const selectedProduct = productos.find(p => p._id === e.target.value);
                              const nuevosProductos = [...cotizacionSeleccionada.productos];
                              nuevosProductos[index] = {
                                ...nuevosProductos[index],
                                producto: {
                                  id: e.target.value,
                                  name: selectedProduct?.name || ''
                                },
                                valorUnitario: selectedProduct?.price || 0
                              };
                              setCotizacionSeleccionada({
                                ...cotizacionSeleccionada,
                                productos: nuevosProductos
                              });
                            }}
                            required
                          >
                            <option value="">Seleccionar producto...</option>
                            {productos.map(prod => (
                              <option key={prod._id} value={prod._id}>
                                {prod.name} - ${Number(prod.price).toLocaleString()}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label htmlFor="input-lista-cot-9"><i aria-hidden={true} className="fa-solid fa-hashtag"></i> <span>Cantidad *</span></label>
                          <input id="input-lista-cot-9"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="1"
                            value={producto.cantidad || ''}
                            onChange={(e) => {
                              const nuevosProductos = [...cotizacionSeleccionada.productos];
                              nuevosProductos[index] = {
                                ...nuevosProductos[index],
                                cantidad: e.target.value
                              };
                              setCotizacionSeleccionada({
                                ...cotizacionSeleccionada,
                                productos: nuevosProductos
                              });
                            }}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="input-lista-cot-10"><i aria-hidden={true} className="fa-solid fa-dollar-sign"></i> <span>Precio Unitario *</span></label>
                          <input id="input-lista-cot-10"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={producto.valorUnitario || ''}
                            onChange={(e) => {
                              const nuevosProductos = [...cotizacionSeleccionada.productos];
                              nuevosProductos[index] = {
                                ...nuevosProductos[index],
                                valorUnitario: e.target.value
                              };
                              setCotizacionSeleccionada({
                                ...cotizacionSeleccionada,
                                productos: nuevosProductos
                              });
                            }}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="input-lista-cot-11"><i aria-hidden={true} className="fa-solid fa-percent"></i> <span>Descuento (%)</span></label>
                          <input id="input-lista-cot-11"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0"
                            value={producto.descuento || ''}
                            onChange={(e) => {
                              const nuevosProductos = [...cotizacionSeleccionada.productos];
                              nuevosProductos[index] = {
                                ...nuevosProductos[index],
                                descuento: e.target.value
                              };
                              setCotizacionSeleccionada({
                                ...cotizacionSeleccionada,
                                productos: nuevosProductos
                              });
                            }}
                          />
                        </div>
                      </div>
                      <div className="producto-info">
                        <div className="subtotal-producto">
                          <span>Subtotal: </span>
                          <strong>
                            {formatCurrency(calcularSubtotalProducto(producto))}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="total-section">
                <div className="total-breakdown">
                  {(() => {
                    const totales = calcularTotales(cotizacionSeleccionada.productos || []);
                    return (
                      <>
                        <div className="total-row">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(totales.subtotal)}</span>
                        </div>
                        <div className="total-row descuentos">
                          <span>Descuentos aplicados:</span>
                          <span>{formatCurrency(totales.descuentos)}</span>
                        </div>
                        <div className="total-row total-final">
                          <span>Total Final:</span>
                          <strong>{formatCurrency(totales.total)}</strong>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <div className="footer-info">
              <i aria-hidden={true} className="fa-solid fa-info-circle"></i>
              <span>Los campos marcados con * son obligatorios</span>
            </div>
            <div className="footer-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  Swal.fire({
                    title: '¿Descartar cambios?',
                    text: 'Se perderán todos los cambios no guardados',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, descartar',
                    cancelButtonText: 'Continuar editando',
                    confirmButtonColor: '#dc3545'
                  }).then((result) => {
                    if (result.isConfirmed) {
                      setModoEdicion(false);
                      setCotizacionSeleccionada(null);
                    }
                  });
                }}
              >
                <i aria-hidden={true} className="fa-solid fa-times"></i>
                <span>Cancelar</span>
              </button>
              <button
                className="btn-preview"
                onClick={() => {
                  setModoEdicion(false);
                  setMostrarPreview(true);
                }}
              >
                <i aria-hidden={true} className="fa-solid fa-eye"></i>
                <span>Vista Previa</span>
              </button>
              <button
                className="btn-save"
                onClick={async () => {
                  // Validación básica
                  if (!cotizacionSeleccionada.cliente?.nombre || !cotizacionSeleccionada.cliente?.correo) {
                    Swal.fire('Error', 'El nombre y correo del cliente son obligatorios', 'error');
                    return;
                  }

                  if (!cotizacionSeleccionada.productos || cotizacionSeleccionada.productos.length === 0) {
                    Swal.fire('Error', 'Debe agregar al menos un producto', 'error');
                    return;
                  }

                  // Validar productos
                  const productosInvalidos = cotizacionSeleccionada.productos.some(p =>
                    !p.producto?.id || !p.cantidad || !p.valorUnitario || p.cantidad <= 0 || p.valorUnitario <= 0
                  );

                  if (productosInvalidos) {
                    Swal.fire('Error', 'Todos los productos deben tener seleccionado un item, cantidad y precio válidos', 'error');
                    return;
                  }

                  await guardarEdicion();
                }}
              >
                <i aria-hidden={true} className="fa-solid fa-save"></i>
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="custom-footer">
        <p className="custom-footer-text">
          © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
        </p>
      </div>

    </div>
  )
}

