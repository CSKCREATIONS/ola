import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import html2canvas from 'html2canvas';
import SharedListHeaderCard from '../components/SharedListHeaderCard';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import RemisionPreview from '../components/RemisionPreview';
import * as TinyMCE from "@tinymce/tinymce-react";

/* Estilos CSS avanzados para Pedidos Entregados */
const pedidosEntregadosStyles = `
  <style>
    .pedidos-entregados-container {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .entregados-stats-card {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-radius: 16px;
      padding: 25px;
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .entregados-stats-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }

    .entregados-stats-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      
    }

    

    .entregados-header-decoration {
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      z-index: 1;
    }

    .entregados-icon-container {
      background: rgba(255,255,255,0.2);
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(10px);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .entregados-action-btn {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin: 0 2px;
    }

    .entregados-action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(16, 185, 129, 0.4);
    }

    .entregados-action-btn.info {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
    }

    .entregados-action-btn.info:hover {
      box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
    }

    .entregados-export-btn {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin: 0 5px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .entregados-export-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
    }

    .entregados-badge {
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      color: #10b981;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
  </style>
`;

if (typeof document !== 'undefined') {
  const existingStyles = document.getElementById('pedidos-entregados-styles');
  if (!existingStyles) {
    const styleElement = document.createElement('div');
    styleElement.id = 'pedidos-entregados-styles';
    styleElement.innerHTML = pedidosEntregadosStyles;
    document.head.appendChild(styleElement);
  }
}

export default function PedidosEntregados() {

  const [user, setUser] = useState(null);
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (err) { console.error('Error reading stored user from localStorage:', err); }
  }, []);



  const [mostrarModalNuevaRemision, setMostrarModalNuevaRemision] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingHighlightId, setPendingHighlightId] = useState(null);
  const [blinkRemisionId, setBlinkRemisionId] = useState(null);
  const [pedidosEntregados, setPedidosEntregados] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [remisionPreview, setRemisionPreview] = useState(null);

  // Estado del formulario de agendamiento (sólo UI)
  const [remisionarCliente, setRemisionarCliente] = useState('');
  const [remisionarCiudad, setRemisionarCiudad] = useState('');
  const [remisionarDireccion, setRemisionarDireccion] = useState('');
  const [remisionarTelefono, setRemisionarTelefono] = useState('');
  const [remisionarCorreo, setRemisionarCorreo] = useState('');
  const [remisionarFechaRem, setRemisionarFechaRem] = useState('');
  // Simple, deterministic email validator (copied pattern from PedidosAgendados)
  const isValidEmail = (email) => {
    if (typeof email !== 'string') return false;
    const trimmed = email.trim();
    if (trimmed.length === 0 || trimmed.length > 254) return false;
    const at = trimmed.indexOf('@');
    if (at <= 0 || trimmed.includes('@', at + 1)) return false;
    const local = trimmed.slice(0, at);
    const domain = trimmed.slice(at + 1);
    if (!local || !domain) return false;
    if (local.length > 64 || domain.length > 253) return false;
    if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
    if (domain.includes('..')) return false;
    const labels = domain.split('.');
    if (labels.length < 2) return false;
    const labelAllowed = /^[A-Za-z0-9-]+$/;
    return labels.every(lab => lab && lab.length <= 63 && !lab.startsWith('-') && !lab.endsWith('-') && labelAllowed.test(lab));
  };
    // Guardar remisión: crea documento en collection 'remisions'
    // Helpers para reducir complejidad cognitiva
    const buildClientePayload = () => ({
      nombre: remisionarCliente,
      ciudad: remisionarCiudad || '',
      direccion: remisionarDireccion || '',
      telefono: remisionarTelefono || '',
      correo: (remisionarCorreo || '').toLowerCase().trim(),
      esCliente: true,
      operacion: 'compra'
    });

    const buildProductosPayload = () => (remisionarProductos || []).map(p => ({
      producto: p.producto || null,
      nombre: p.nombre || p.descripcion || '',
      cantidad: Number.parseFloat(p.cantidad || 0) || 0,
      valorUnitario: Number.parseFloat(p.valorUnitario || p.precioUnitario || 0) || 0,
      descripcion: p.descripcion || '',
      codigo: p.codigo || ''
    }));

    const validateRemisionInputs = () => {
      const newErrors = {};
      if (!remisionarCliente?.trim()) newErrors.cliente = 'Nombre o razón social es obligatorio.';
      if (!remisionarTelefono?.trim()) newErrors.telefono = 'Teléfono es obligatorio.';
      if (!remisionarCorreo?.trim()) newErrors.correo = 'Correo es obligatorio.';
      else if (!isValidEmail(remisionarCorreo)) newErrors.correo = 'Formato de correo inválido.';
      if (!remisionarFechaRem) newErrors.fechaRem = 'Fecha de entrega es obligatoria.';
      if (!remisionarProductos || remisionarProductos.length === 0) newErrors.productos = 'Agrega al menos un producto a la remisión.';

      const newProductErrors = (remisionarProductos || []).map(() => ({}));
      let i = 0;
      for (const p of (remisionarProductos || [])) {
        if (!p.producto && !p.descripcion && !p.nombre) newProductErrors[i].producto = 'Ingrese nombre o seleccione un producto.';
        if (!p.cantidad || Number.parseFloat(p.cantidad) <= 0) newProductErrors[i].cantidad = 'Cantidad debe ser mayor a 0.';
        if (!p.valorUnitario && !p.precioUnitario) newProductErrors[i].valorUnitario = 'Valor unitario inválido.';
        i++;
      }
      return { newErrors, newProductErrors };
    };

    const handleGuardarRemision = async () => {
      try {
          // Ensure user token exists before calling protected endpoint
          const token = localStorage.getItem('token');
          if (!token) {
            Swal.fire('Error', 'Debe iniciar sesión para crear una remisión.', 'warning');
            return;
          }
        const { newErrors, newProductErrors } = validateRemisionInputs();

        const hasProductRowErrors = newProductErrors.some(pe => Object.keys(pe).length > 0);
        if (Object.keys(newErrors).length > 0 || hasProductRowErrors) {
          setErrors(newErrors);
          setProductErrors(newProductErrors);
          return;
        }

        const clientePayload = buildClientePayload();
        const productosPayload = buildProductosPayload();

        const body = {
          cliente: clientePayload,
          productos: productosPayload,
          fechaEntrega: remisionarFechaRem,
          descripcion: descripcionRef.current?.getContent?.({ format: 'html' }) || '',
          condicionesPago: condicionesRef.current?.getContent?.({ format: 'html' }) || ''
        };

        let res;
        try {
          res = await api.post('/api/remisiones', body);
        } catch (error_) {
          console.error('Request error creating remision:', error_);
          const serverMsg = error_?.response?.data?.message || error_?.response?.data || error_.message;
          Swal.fire('Error', serverMsg || 'Error de red al guardar remisión.', 'error');
          return;
        }

        if (res && res.status >= 200 && res.status < 300) {
          const raw = res?.data || res;
          let nuevaRemision = raw?.remision || raw?.data || raw;
          if (nuevaRemision?.remision) nuevaRemision = nuevaRemision.remision;

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Remisión creada', showConfirmButton: false, timer: 1800, timerProgressBar: true });

          // limpiar y cerrar modal
          setMostrarModalNuevaRemision(false);
          setRemisionarCliente(''); setRemisionarCiudad(''); setRemisionarDireccion(''); setRemisionarTelefono(''); setRemisionarCorreo(''); setRemisionarFechaRem(''); setRemisionarProductos([]);
          setErrors({}); setProductErrors([]);
          descripcionRef.current?.setContent('');
          condicionesRef.current?.setContent('');

          // Agregar al listado local si no existe y abrir vista previa (con datos completos)
          if (nuevaRemision?._id) {
            let fullRemision = nuevaRemision;
            try {
              const fres = await api.get(`/api/remisiones/${nuevaRemision._id}`);
              const fdata = fres.data || fres;
              fullRemision = fdata.remision || fdata || nuevaRemision;
            } catch (e) {
              console.warn('No se pudo hidratar remisión recién creada. Usando datos de respuesta.', e);
            }

            setPedidosEntregados(prev => {
              const exists = prev.some(r => r._id === (fullRemision._id || nuevaRemision._id));
              if (exists) return prev;
              const merged = [fullRemision, ...prev];
              return merged.sort((a, b) => new Date(b.fechaRemision || b.updatedAt || b.createdAt || 0) - new Date(a.fechaRemision || a.updatedAt || a.createdAt || 0));
            });
            setRemisionPreview(fullRemision);
            setPendingHighlightId(fullRemision._id || nuevaRemision._id);
          }

          // Refrescar del servidor en segundo plano (mejora consistencia)
          cargarRemisionesEntregadas().catch(() => { /* non-blocking refresh */ });
        } else {
          Swal.fire('Error', res.data?.message || 'No se pudo crear la remisión', 'error');
        }
      } catch (err) {
        console.error('Error guardando remisión:', err);
        Swal.fire('Error', err?.response?.data?.message || 'Error de red al guardar remisión.', 'error');
      }
    };
  // Errores de validación inline
  const [errors, setErrors] = useState({});
  // Errores por producto (array paralelo a `agendarProductos`)
  const [productErrors, setProductErrors] = useState([]);

  // Limpiar errores al abrir/cerrar el modal para evitar mensajes residuales
  useEffect(() => {
    if (mostrarModalNuevaRemision) {
      setErrors({});
      setProductErrors([]);
    }
  }, [mostrarModalNuevaRemision]);

  // Editors (UI only)
  const descripcionRef = useRef(null);
  const condicionesRef = useRef(null);

  // Productos (UI only dentro del modal)
  const [remisionarProductos, setRemisionarProductos] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const agregarProductoRemisionar = () => {
    const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    setRemisionarProductos(prev => ([...prev, {
      uid,
      producto: '',
      nombre: '', descripcion: '', cantidad: '', valorUnitario: '', descuento: '', subtotal: ''
    }]));
    setProductErrors(prev => ([...prev, {}]));
  };
  const eliminarProductoRemisionar = (index) => {
    setRemisionarProductos(prev => prev.filter((_, i) => i !== index));
    setProductErrors(prev => prev.filter((_, i) => i !== index));
  };
  const limpiarProductosRemisionados = () => {
    if (remisionarProductos.length === 0) return;
    setRemisionarProductos([]);
    setProductErrors([]);
  };
  const handleProductoRemisionarChange = (index, e) => {
    const { name, value } = e.target;
    setRemisionarProductos(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [name]: value };
      const cantidadNum = Number.parseFloat(next[index].cantidad) || 0;
      const valorNum = Number.parseFloat(next[index].valorUnitario) || 0;
      const descNum = Number.parseFloat(next[index].descuento) || 0;
      const subtotal = cantidadNum * valorNum * (1 - descNum / 100);
      next[index].subtotal = subtotal ? subtotal.toFixed(2) : '';
      // limpiar errores del campo cambiado
      setProductErrors(prevErrors => {
        const ne = [...(prevErrors || [])];
        ne[index] = { ...ne[index] };
        if (ne[index]?.[name]) delete ne[index][name];
        return ne;
      });
      return next;
    });
  };

  // Cargar productos activos para el select (igual que RegistrarCotizacion)
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.get('/api/products');
        const lista = res.data?.data || res.data || [];
        setProductosDisponibles(Array.isArray(lista) ? lista : []);
      } catch (err) {
        console.error('Error al cargar productos disponibles (remisionar):', err);
      }
    };
    loadProducts();
  }, []);

  const handleProductoSelectRemisionar = (index, productId) => {
    const producto = productosDisponibles.find(p => (p._id || p.id) === productId);
    setRemisionarProductos(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        producto: productId,
        nombre: producto?.name || '',
        descripcion: producto?.description || next[index].descripcion || '',
        valorUnitario: (producto?.price ?? next[index].valorUnitario) || '',
        stock: producto?.stock ?? next[index].stock ?? undefined,
        cantidad: '',
        descuento: '',
        subtotal: ''
      };
      return next;
    });
    // limpiar errores para ese producto
    setProductErrors(prev => {
      const next = [...(prev || [])];
      next[index] = {};
      return next;
    });
  };

  // Autocompletado de cliente (igual a RegistrarCotizacion)
  const [clientesRemisionar, setClientesRemisionar] = useState([]);
  const [filteredClientesRemisionar, setFilteredClientesRemisionar] = useState([]);
  const [showDropdownRemisionar, setShowDropdownRemisionar] = useState(false);

  // Cargar clientes y prospectos (deduplicados) para autocompletar
  useEffect(() => {
    const deduplicateClientes = (todos) => {
      const dedupMap = new Map();
      for (const c of todos) {
        const key = ((c.correo || '').toLowerCase().trim()) || c._id;
        if (dedupMap.has(key)) {
          const existente = dedupMap.get(key);
          if (existente.esCliente === false && c.esCliente) dedupMap.set(key, c);
        } else {
          dedupMap.set(key, c);
        }
      }
      return Array.from(dedupMap.values()).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    };

    const normalizar = (arr, esClienteFlag) => (Array.isArray(arr) ? arr.map(c => ({ ...c, esCliente: !!esClienteFlag })) : []);

    const cargarClientesYProspectos = async () => {
      try {
        const [clientesRes, prospectosRes] = await Promise.all([
          api.get('/api/clientes'),
          api.get('/api/clientes/prospectos')
        ]);

        const listaClientes = clientesRes.data?.data || clientesRes.data || [];
        const listaProspectos = prospectosRes.data?.data || prospectosRes.data || [];

        const todos = [...normalizar(listaClientes, true), ...normalizar(listaProspectos, false)];

        const resultado = deduplicateClientes(todos);
        setClientesRemisionar(resultado);
      } catch (err) {
        console.error('Error al cargar clientes/prospectos (remisionar):', err);
      }
    };
    cargarClientesYProspectos();
  }, []);

  const handleDropdownSelectClienteRemisionar = (c) => {
    setRemisionarCliente(c.nombre || '');
    setRemisionarCiudad(c.ciudad || '');
    setRemisionarDireccion(c.direccion || '');
    setRemisionarTelefono(c.telefono || '');
    setRemisionarCorreo(c.correo || '');
    setShowDropdownRemisionar(false);
  };

  const handleRemisionarClienteChange = (e) => {
    const q = e.target.value;
    setRemisionarCliente(q);
    if (errors.cliente) setErrors(prev => ({ ...prev, cliente: undefined }));
    if (q && q.trim().length >= 1) {
      const ql = q.trim().toLowerCase();
      const matches = clientesRemisionar
        .filter(c => (c?.nombre || '').toLowerCase().includes(ql))
        .slice(0, 10);
      setFilteredClientesRemisionar(matches);
      setShowDropdownRemisionar(matches.length > 0);
    } else {
      setFilteredClientesRemisionar([]);
      setShowDropdownRemisionar(false);
    }
  };

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentItems = pedidosEntregados.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);
  const totalPages = Math.ceil(pedidosEntregados.length / itemsPerPage);

  useEffect(() => {
    cargarRemisionesEntregadas();
  }, []);

  // Efecto para procesar estado proveniente de navegación (CotizacionPreview/PedidosAgendados)
  useEffect(() => {
    const openWith = async (doc) => {
      setPedidosEntregados(prev => {
        const exists = prev.some(r => r._id === doc._id);
        if (!exists) {
          const merged = [doc, ...prev];
          return merged.sort((a, b) => new Date(b.fechaRemision || b.updatedAt || b.createdAt || 0) - new Date(a.fechaRemision || a.updatedAt || a.createdAt || 0));
        }
        return prev;
      });
      setRemisionPreview(doc);
      setPendingHighlightId(doc._id);
    };

    const hydrateRemision = async (nueva) => {
      try {
        const fres = await api.get(`/api/remisiones/${nueva._id}`);
        const fdata = fres.data || fres;
        const fullDoc = fdata.remision || fdata || nueva;
        await openWith(fullDoc);
      } catch (e) {
        console.warn('No se pudo hidratar remisión navegada. Usando objeto recibido.', e);
        await openWith(nueva);
      }
    };

    try {
      const navState = location?.state;
      if (navState?.autoPreviewRemision) {
        const nueva = navState.autoPreviewRemision;

        if (nueva?._id) {
          hydrateRemision(nueva);
        } else {
          openWith(nueva);
        }
        if (navState.toast) {
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: navState.toast, showConfirmButton: false, timer: 2000, timerProgressBar: true });
        }
        // Limpiar el estado de navegación para evitar reprocesos en refresh
        navigate('/PedidosEntregados', { replace: true });
      }
    } catch (e) {
      console.error('Error procesando estado de navegación remision:', e);
    }
  }, [location?.state]);

  // Activar parpadeo cuando se cierra la vista previa
  const handleCloseRemisionPreview = () => {
    setRemisionPreview(null);
    if (pendingHighlightId) setBlinkRemisionId(pendingHighlightId);
  };

  // Inyectar estilos de animación una vez que se necesiten
  useEffect(() => {
    if (blinkRemisionId) {
      if (!document.getElementById('blink-style')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'blink-style';
        styleEl.textContent = '@keyframes rowBlink {0%{background-color:#ffffff;}50%{background-color:#fef9c3;}100%{background-color:#ffffff;}} .blink-row{animation:rowBlink 1.2s ease-in-out 6;}';
        document.head.appendChild(styleEl);
      }
      // Remover efecto después de su duración (~1.2s * 6 ≈ 7.2s)
      const timeout = setTimeout(() => setBlinkRemisionId(null), 7500);
      return () => clearTimeout(timeout);
    }
  }, [blinkRemisionId]);
  const cargarRemisionesEntregadas = async () => {
    try {
      // Usar el endpoint del controlador de remisiones. Cargar todas las remisiones (sin filtrar)
      const res = await api.get('/api/remisiones?limite=1000');
      const data = res.data || res;
      const remisionesArr = Array.isArray(data) ? data : data.remisiones || data.data || [];

      // Normalizar y ordenar por fechaRemision (fallback a updatedAt/createdAt)
      const entregadasOrdenadas = (remisionesArr || []).slice().sort((a, b) => {
        const da = new Date(a.fechaRemision || a.updatedAt || a.createdAt || 0);
        const db = new Date(b.fechaRemision || b.updatedAt || b.createdAt || 0);
        return db - da;
      });

      setPedidosEntregados(entregadasOrdenadas);
    } catch (error) {
      console.error('Error cargando remisiones:', error);
      Swal.fire('Error', 'Error de conexión al cargar remisiones', 'error');
    }
  };

  // Función para ver/obtener remisión (separada para reducir anidamiento en JSX)
  const verRemisionPreview = async (remision) => {
    try {
      // Si la remisión tiene un _id, intentar obtener la versión completa desde el servidor
      if (remision?._id) {
        try {
          const res = await api.get(`/api/remisiones/${remision._id}`);
          const data = res.data || res;
          const rem = data.remision || data;
          setRemisionPreview(rem);
          return;
        } catch (e) {
          // Si falla el fetch, caer al fallback y usar el objeto que ya tenemos
          console.warn('No se pudo obtener remisión por id, usando datos disponibles', e);
        }
      }

      // Fallback: usar el objeto que llegó desde la lista
      setRemisionPreview(remision);
    } catch (error) {
      console.error('Error cargando remisión para vista previa:', error);
      Swal.fire('Error', 'No se pudo cargar la remisión', 'error');
    }
  };

  // Note: crearRemisionDesdePedido removed — not referenced anywhere in this file. Kept pagination and preview handlers.

  const exportarPDF = () => {
    const elementosNoExport = document.querySelectorAll('.no-export');
    for (const el of elementosNoExport) { el.style.display = 'none'; }

    const input = document.getElementById('tabla_entregados');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('pedidos_entregados.pdf');
      for (const el of elementosNoExport) { el.style.display = ''; }
    });
  };

  const exportToExcel = (pedidosEntregados) => {
    if (!pedidosEntregados || pedidosEntregados.length === 0) {
      Swal.fire("Error", "No hay datos para exportar", "warning");
      return;
    }

    const dataFormateada = pedidosEntregados.map(pedido => ({
      'Nombre': pedido.cliente?.nombre || pedido.nombre || pedido.clienteInfo?.nombre || '',
      'Remisión': pedido.numeroRemision || pedido.remision || '',
      'Ciudad': pedido.cliente?.ciudad || pedido.ciudad || pedido.clienteInfo?.ciudad || '',
      'Teléfono': pedido.cliente?.telefono || pedido.telefono || pedido.clienteInfo?.telefono || '',
      'Correo': pedido.cliente?.correo || pedido.correo || pedido.clienteInfo?.correo || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataFormateada);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'ListaPedidosEntregados.xlsx');
  };


  // ModalProductosCotizacion eliminado por no utilizarse

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="max-width">
          <div className="contenido-modulo">
            {/* Encabezado profesional */}
            <SharedListHeaderCard
              title="Pedidos Entregados"
              subtitle="Aquí encontrará las remisiones con sus respectivos detalles"
              iconClass="fa-solid fa-check-circle"
            >
              <div className="export-buttons">
                <button
                  onClick={exportToExcel.bind(this, pedidosEntregados)}
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

                <button
                  onClick={() => setMostrarModalNuevaRemision(true)}
                  className="export-btn create"
                >
                  <i className="fa-solid fa-plus"></i>{' '}<span>Nueva remisión</span>
                </button>
              </div>
            </SharedListHeaderCard>

            {/* Estadísticas avanzadas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div className="entregados-stats-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{

                    borderRadius: '12px',
                    padding: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fa-solid fa-check-circle" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                      {pedidosEntregados.length}
                    </h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                      Pedidos Entregados
                    </p>
                  </div>
                </div>
              </div>

              <div className="entregados-stats-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    borderRadius: '12px',
                    padding: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fa-solid fa-dollar-sign" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                      ${pedidosEntregados.reduce((sum, p) => sum + (p.total || 0), 0).toLocaleString('es-CO')}
                    </h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                      Ingresos Totales
                    </p>
                  </div>
                </div>
              </div>

              <div className="entregados-stats-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    borderRadius: '12px',
                    padding: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fa-solid fa-calendar-alt" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                      {pedidosEntregados.filter(p => {
                        const fechaEntrega = new Date(p.updatedAt);
                        const hoy = new Date();
                        const diferencia = hoy.getTime() - fechaEntrega.getTime();
                        const diasDiferencia = Math.ceil(diferencia / (1000 * 3600 * 24));
                        return diasDiferencia <= 30;
                      }).length}
                    </h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                      Este Mes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controles de exportación */}


            {/* Tabla principal con diseño moderno */}
            <div className="table-container">
              <div className="table-header">
                <div className="table-header-content">
                  <div className="table-header-icon">
                    <i className="fa-solid fa-table" style={{ color: 'white', fontSize: '16px' }}></i>
                  </div>
                  <div>
                    <h4 className="table-title">
                      Lista de remisiones
                    </h4>
                    <p className="table-subtitle">
                      Mostrando {currentItems.length} de {pedidosEntregados.length} remisiones
                    </p>
                  </div>
                </div>
              </div  >
              <div style={{ overflow: 'auto' }}>
                <table className="data-table" id="tabla_entregados">
                  <thead>
                    <tr>
                      <th>
                        <i className="fa-solid fa-hashtag icon-gap" style={{ color: '#6366f1' }}></i><span></span>
                      </th>
                      <th>
                        <i className="fa-solid fa-file-invoice icon-gap" style={{ color: '#6366f1' }}></i><span>REMISIÓN</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-user-pen icon-gap" style={{ color: '#6366f1' }}></i><span>RESPONSABLE</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-user icon-gap" style={{ color: '#6366f1' }}></i><span>CLIENTE</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-calendar-check icon-gap" style={{ color: '#6366f1' }}></i><span>F. ENTREGA</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-location-dot icon-gap" style={{ color: '#6366f1' }}></i><span>CIUDAD</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-dollar-sign icon-gap" style={{ color: '#6366f1' }}></i><span>TOTAL</span>
                      </th>

                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((remision, index) => (
                      <tr key={remision._id} className={remision._id === blinkRemisionId ? 'blink-row' : ''}>
                        <td style={{ fontWeight: '600', color: '#6366f1' }}>
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="table-icon-small">
                              <i className="fa-solid fa-file-invoice" style={{ color: 'white', fontSize: '12px' }}></i>
                            </div>
                            {remision.numeroRemision ? (
                              <button
                                style={{ cursor: 'pointer', color: '#6366f1', background: 'transparent', textDecoration: 'underline' }}
                                onClick={() => verRemisionPreview(remision)}
                              >

                                <span>{remision.numeroRemision || '---'}</span>
                              </button>
                            ) : (
                              <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>---</span>
                            )}
                          </div>
                        </td>
                        <td style={{ color: '#374151', fontWeight: 600 }}>
                          {(() => {
                            if (!remision.responsable) {
                              return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sistema</span>;
                            }
                            const hasName = remision.responsable.firstName || remision.responsable.username;
                            if (hasName) {
                              return `${remision.responsable.firstName || ''} ${remision.responsable.surname || ''}`.trim();
                            }
                            return remision.responsable.username || String(remision.responsable);
                          })()}
                        </td>

                        <td style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                          {remision.cliente?.nombre || remision.cliente?.nombreCliente || remision.cliente?.nombreCompleto || ''}
                        </td>
                        <td style={{ color: '#6b7280' }}>
                          {new Date(remision.fechaEntrega || remision.fechaRemision || remision.updatedAt || remision.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ color: '#6b7280' }}>
                          {remision.cliente?.ciudad || remision.cliente?.direccion?.ciudad || ''}
                        </td>
                        <td style={{ fontWeight: '600', color: '#6366f1', fontSize: '14px' }}>
                          ${(remision.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                      </tr>
                    ))}
                    {pedidosEntregados.length === 0 && (
                      <tr>
                        <td colSpan="8">
                          <div className="table-empty-state">
                            <div className="table-empty-icon">
                              <i className="fa-solid fa-times-circle" style={{ fontSize: '3.5rem', color: '#9ca3af' }}></i>
                            </div>
                            <div>
                              <h5 className="table-empty-title">
                                No hay pedidos entregados disponibles
                              </h5>
                              <p className="table-empty-text">
                                No se encontraron pedidos entregados en el sistema
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>


            {/* Paginación */}
            {totalPages > 1 && (
              <div className="pagination" style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '20px',
                gap: '5px'
              }}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: currentPage === i + 1 ?
                        'linear-gradient(135deg, #6366f1, #6366f1)' :
                        '#f3f4f6',
                      color: currentPage === i + 1 ? 'white' : '#374151',
                      fontWeight: '500'
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}

            {remisionPreview && (
              <RemisionPreview
                datos={remisionPreview}
                onClose={handleCloseRemisionPreview}
              />
            )}




            {mostrarModalNuevaRemision && (
              <div className="modal-overlay">
                <div className="modal-lg">
                  <div className="modal-header">
                    <h5 className="modal-title">Nueva remisión</h5>
                    <button
                      className="modal-close"
                      onClick={() => setMostrarModalNuevaRemision(false)}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="modal-body">
                    {/* Sección: Información del Cliente */}
                    <div className="modal-section">
                      <div className="modal-section-header">
                        <div className="modal-section-icon blue">
                          <i className="fa-solid fa-user"></i>
                        </div>
                        <h4 className="modal-section-title">Información del Cliente</h4>
                      </div>

                      <div className="modal-grid">
                        <div className="modal-grid-item">
                          <label htmlFor="remisionar-cliente" className="modal-label">
                            Nombre o Razón Social
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              id="remisionar-cliente"
                              type="text"
                              className="modal-input"
                              style={{ border: errors.cliente ? '2px solid #ef4444' : undefined }}
                              placeholder="Nombre o razón social"
                              value={remisionarCliente}

                                onFocus={(e) => {
                                  if (filteredClientesRemisionar.length > 0) setShowDropdownRemisionar(true);
                                }}
                                onChange={handleRemisionarClienteChange}
                              onBlur={() => setTimeout(() => setShowDropdownRemisionar(false), 150)}
                              required
                            />
                            {errors.cliente && (
                              <div style={{ color: '#ef4444', marginTop: 6, fontSize: '0.9rem' }}>{errors.cliente}</div>
                            )}
                            {showDropdownRemisionar && filteredClientesRemisionar.length > 0 && (
                              <div className="modal-dropdown">
                                {filteredClientesRemisionar.map((c) => (
                                  <button
                                    type="button"
                                    key={c._id}
                                    onMouseDown={(ev) => { ev.preventDefault(); }}
                                    onClick={() => handleDropdownSelectClienteRemisionar(c)}
                                    className="modal-dropdown-item"
                                  >
                                    <span className="dropdown-item-main">
                                      {c.nombre}
                                      {!c.esCliente && (
                                        <span className="prospect-badge">PROSPECTO</span>
                                      )}
                                    </span>
                                    <span className="dropdown-item-sub">
                                      {c.ciudad || 'Ciudad no especificada'}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="modal-grid-item">
                          <label htmlFor="remisionar-ciudad" className="modal-label">Ciudad</label>
                          <input
                            id="remisionar-ciudad"
                            type="text"
                            className="modal-input"
                            placeholder="Ciudad de residencia"
                            value={remisionarCiudad}
                            onChange={(e) => setRemisionarCiudad(e.target.value)}
                            required
                          />
                        </div>

                        <div className="modal-grid-item">
                          <label htmlFor="remisionar-direccion" className="modal-label">Dirección</label>
                          <input
                            id="remisionar-direccion"
                            type="text"
                            className="modal-input"
                            placeholder="Dirección completa"
                            value={remisionarDireccion}
                            onChange={(e) => setRemisionarDireccion(e.target.value)}
                            required
                          />
                        </div>

                        <div className="modal-grid-item">
                          <label htmlFor="remisionar-telefono" className="modal-label">
                            Teléfono
                          </label>
                          <input
                            id="remisionar-telefono"
                            type="tel"
                            className="modal-input"
                            placeholder="+57 000 000 0000"
                            value={remisionarTelefono}
                            inputMode="tel"
                            autoComplete="tel"
                            pattern="^[+]?\d[\d ]{3,}$"
                            onKeyDown={(e) => {
                              // Bloquear letras directamente al tipear
                              if (/^[a-zA-Z]$/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onPaste={(e) => {
                              // Sanitizar contenido pegado eliminando letras y símbolos no permitidos
                              const pasted = (e.clipboardData.getData('text') || '').replaceAll(/[^\d+ ]/g, '');
                              e.preventDefault();
                              setRemisionarTelefono(prev => (prev + pasted)
                                .replaceAll(/(?!^)[+]/g, '')
                                .replaceAll(/[^\d+ ]/g, ''));
                            }}
                            onChange={(e) => {
                              const raw = e.target.value;
                              // Permitir sólo dígitos, espacios y un '+' inicial opcional
                              let sanitized = raw.replaceAll(/[^\d+ ]/g, '');
                              // Si hay más de un '+', conservar sólo el primero al inicio
                              sanitized = sanitized.replaceAll(/(?!^)\+/g, '');
                              // Si '+' aparece y no está al inicio, moverlo al inicio
                              if (/\+/.test(sanitized) && sanitized[0] !== '+') {
                                sanitized = '+' + sanitized.replaceAll('+', '');
                              }
                              setRemisionarTelefono(sanitized);
                              if (errors.telefono) setErrors(prev => ({ ...prev, telefono: undefined }));
                            }}
                            required
                          />
                          {errors.telefono && (
                            <div style={{ color: '#ef4444', marginTop: 6, fontSize: '0.9rem' }}>{errors.telefono}</div>
                          )}
                        </div>

                        <div className="modal-grid-item">
                          <label htmlFor="remisionar-correo" className="modal-label">
                            Correo Electrónico
                          </label>
                          <input
                            id="remisionar-correo"
                            type="email"
                            className="modal-input"
                            style={{ border: errors.correo ? '2px solid #ef4444' : undefined }}
                            placeholder="cliente@ejemplo.com"
                            value={remisionarCorreo}
                            onChange={(e) => { setRemisionarCorreo(e.target.value); if (errors.correo) setErrors(prev => ({ ...prev, correo: undefined })); }}
                            required
                          />
                          {errors.correo && (
                            <div style={{ color: '#ef4444', marginTop: 6, fontSize: '0.9rem' }}>{errors.correo}</div>
                          )}
                        </div>

                        <div className="modal-grid-item">
                          <div className="modal-label">Responsable</div>
                          <div className="modal-readonly">
                            <i className="fa-solid fa-user-tie"></i>
                            <span>{user ? `${user.firstName || ''} ${user.surname || ''}` : ''}</span>
                          </div>
                        </div>



                        <div className="modal-grid-item">
                          <label htmlFor="fecha-remision" className="modal-label">Fecha de entrega</label>
                          <input
                            id="fecha-remision"
                            type="date"
                            className="modal-input"
                            style={{ border: errors.fechaRem ? '2px solid #ef4444' : undefined }}
                            value={remisionarFechaRem}
                            onChange={(e) => { setRemisionarFechaRem(e.target.value); if (errors.fechaRem) setErrors(prev => ({ ...prev, fechaRem: undefined })); }}
                            required
                          />
                          {errors.fechaRem && (
                            <div style={{ color: '#ef4444', marginTop: 6, fontSize: '0.9rem' }}>{errors.fechaRem}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sección: Descripción */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      border: '1px solid #e2e8f0',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        borderBottom: '2px solid #e2e8f0',
                        paddingBottom: '.75rem',
                        marginBottom: '1rem',
                        display: 'flex', alignItems: 'center', gap: '.75rem'
                      }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                          <i className="fa-solid fa-edit"></i>
                        </div>
                        <h4 style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>Descripción de la remisión</h4>
                      </div>
                      <div style={{ background: '#fff', borderRadius: 10, padding: '0.75rem', border: '2px solid #e5e7eb' }}>
                        <TinyMCE.Editor
                          id="remisionar-descripcion"
                          onInit={(evt, editor) => (descripcionRef.current = editor)}
                          apiKey="bjhw7gemroy70lt4bgmfvl29zid7pmrwyrtx944dmm4jq39w"
                          textareaName="Descripcion"
                          init={{ height: 220, menubar: false }}
                        />
                      </div>
                    </div>

                    {/* Sección de productos (UI) */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      border: '1px solid #e2e8f0',
                      marginTop: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '2px solid #e2e8f0',
                        paddingBottom: '.75rem',
                        marginBottom: '1rem'
                      }}>
                        <h4 style={{ margin: 0, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <i className="fa-solid fa-box"></i>
                          </div>
                          Productos a remisionar
                        </h4>
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                          <button
                            type="button"
                            onClick={agregarProductoRemisionar}
                            style={{
                              padding: '.6rem 1rem',
                              border: 'none',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: '#fff', fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            <i className="fa-solid fa-plus" style={{ marginRight: 8 }}></i>{' '}
                            Agregar Producto
                          </button>
                          {remisionarProductos.length > 0 && (
                            <button
                              type="button"
                              onClick={limpiarProductosRemisionados}
                              style={{
                                padding: '.6rem 1rem',
                                borderRadius: '10px',
                                border: '2px solid #ef4444',
                                background: '#fff', color: '#ef4444', fontWeight: 600, cursor: 'pointer'
                              }}
                            >
                              <i className="fa-solid fa-trash" style={{ marginRight: 8 }}></i>{' '}
                              Limpiar Todo
                            </button>
                          )}
                        </div>
                      </div>

                      {errors.productos && (
                        <div style={{ color: '#ef4444', margin: '0.5rem 0 1rem 0', fontSize: '0.95rem' }}>{errors.productos}</div>
                      )}

                      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto', maxHeight: 360 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)' }}>
                                <th style={{ padding: '0.9rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '.9rem', borderBottom: '2px solid #e2e8f0' }}>#</th>
                                <th style={{ padding: '0.9rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '.9rem', borderBottom: '2px solid #e2e8f0', minWidth: 160 }}>Producto</th>
                                <th style={{ padding: '0.9rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '.9rem', borderBottom: '2px solid #e2e8f0', minWidth: 150 }}>Descripción</th>
                                <th style={{ padding: '0.9rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '.9rem', borderBottom: '2px solid #e2e8f0' }}>Cantidad</th>
                                <th style={{ padding: '0.9rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '.9rem', borderBottom: '2px solid #e2e8f0' }}>Valor Unit.</th>
                                <th style={{ padding: '0.9rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '.9rem', borderBottom: '2px solid #e2e8f0' }}>% Desc.</th>
                                <th style={{ padding: '0.9rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '.9rem', borderBottom: '2px solid #e2e8f0' }}>Subtotal</th>
                                <th style={{ padding: '0.9rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '.9rem', borderBottom: '2px solid #e2e8f0' }}>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {remisionarProductos.map((prod, index) => (
                                <tr key={prod.uid || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '.8rem .75rem', color: '#64748b', fontWeight: 500 }}>{index + 1}</td>
                                  <td style={{ padding: '.5rem .75rem' }}>
                                    <select
                                      className="cuadroTexto"
                                      name="producto"
                                      value={prod.producto || ''}
                                      onChange={(e) => handleProductoSelectRemisionar(index, e.target.value)}
                                      style={{ border: productErrors[index]?.producto ? '2px solid #ef4444' : '2px solid #e5e7eb', borderRadius: 6, padding: '8px' }}
                                    >
                                      <option value="">Seleccione un producto</option>
                                      {productosDisponibles.filter(p => p.activo !== false && p.activo !== 'false').map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                      ))}
                                    </select>
                                    {productErrors[index]?.producto && (
                                      <div style={{ color: '#ef4444', marginTop: 6, fontSize: '0.85rem' }}>{productErrors[index].producto}</div>
                                    )}
                                  </td>
                                  <td style={{ padding: '.5rem .75rem' }}>
                                    <input
                                      type="text"
                                      name="descripcion"
                                      className="cuadroTexto"
                                      value={prod.descripcion}
                                      onChange={(e) => handleProductoRemisionarChange(index, e)}
                                      style={{ border: '2px solid #e5e7eb', borderRadius: 6 }}
                                    />
                                  </td>
                                  <td style={{ padding: '.5rem .75rem' }}>
                                    <input
                                      type="number"
                                      name="cantidad"
                                      className="cuadroTexto"
                                      value={prod.cantidad}
                                      onChange={(e) => handleProductoRemisionarChange(index, e)}
                                      style={{ border: productErrors[index]?.cantidad ? '2px solid #ef4444' : '2px solid #e5e7eb', borderRadius: 6, textAlign: 'center' }}
                                    />
                                    {productErrors[index]?.cantidad && (
                                      <div style={{ color: '#ef4444', marginTop: 6, fontSize: '0.85rem' }}>{productErrors[index].cantidad}</div>
                                    )}
                                  </td>
                                  <td style={{ padding: '.5rem .75rem' }}>
                                    <input
                                      type="number"
                                      name="valorUnitario"
                                      className="cuadroTexto"
                                      value={prod.valorUnitario}
                                      onChange={(e) => handleProductoRemisionarChange(index, e)}
                                      readOnly
                                      style={{ border: productErrors[index]?.valorUnitario ? '2px solid #ef4444' : '2px solid #e5e7eb', borderRadius: 6, textAlign: 'center' }}
                                    />
                                    {productErrors[index]?.valorUnitario && (
                                      <div style={{ color: '#ef4444', marginTop: 6, fontSize: '0.85rem' }}>{productErrors[index].valorUnitario}</div>
                                    )}
                                  </td>
                                  <td style={{ padding: '.5rem .75rem' }}>
                                    <input
                                      type="number"
                                      name="descuento"
                                      className="cuadroTexto"
                                      value={prod.descuento}
                                      onChange={(e) => handleProductoRemisionarChange(index, e)}
                                      style={{ border: '2px solid #e5e7eb', borderRadius: 6, textAlign: 'center' }}
                                    />
                                  </td>
                                  <td style={{ padding: '.5rem .75rem' }}>
                                    <input
                                      type="number"
                                      name="subtotal"
                                      className="cuadroTexto"
                                      value={prod.subtotal}
                                      readOnly
                                      style={{ border: '2px solid #e5e7eb', borderRadius: 6, textAlign: 'center', backgroundColor: '#f8fafc', fontWeight: 600, color: '#059669' }}
                                    />
                                  </td>
                                  <td style={{ padding: '.5rem .75rem', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => eliminarProductoRemisionar(index)}
                                      style={{
                                        padding: '.5rem', border: 'none', borderRadius: 6, background: '#ef4444', color: '#fff', cursor: 'pointer', width: '2rem', height: '2rem'
                                      }}
                                    >
                                      <i className="fa-solid fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}

                              {remisionarProductos.length === 0 && (
                                <tr>
                                  <td colSpan={8} style={{ padding: '1.25rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                                    No hay productos agregados. Haga clic en "Agregar Producto" para comenzar.
                                  </td>
                                </tr>
                              )}

                              {remisionarProductos.length > 0 && (
                                <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)' }}>
                                  <td colSpan={6} style={{ padding: '0.9rem .75rem', fontWeight: 700, textAlign: 'right', color: '#1e293b' }}>Total General:</td>
                                  <td style={{ padding: '0.9rem .75rem', fontWeight: 700, textAlign: 'center', color: '#059669' }}>
                                    {remisionarProductos.reduce((acc, p) => acc + (Number.parseFloat(p.subtotal) || 0), 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td></td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Sección: Condiciones/Observaciones */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      border: '1px solid #e2e8f0',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                          <i className="fa-solid fa-clipboard-list"></i>
                        </div>
                        <h4 style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>Condiciones de pago</h4>
                      </div>
                      <div style={{ background: '#fff', borderRadius: 10, padding: '0.75rem', border: '2px solid #e5e7eb' }}>
                        <TinyMCE.Editor
                          id="remisionar-condiciones"
                          onInit={(evt, editor) => (condicionesRef.current = editor)}
                          apiKey="bjhw7gemroy70lt4bgmfvl29zid7pmrwyrtx944dmm4jq39w"
                          textareaName="Condiciones"
                          init={{ height: 260, menubar: false }}
                        />
                      </div>
                    </div>

                    {/* Botones de acción (sin lógica) */}
                    <div style={{
                      background: '#fff',
                      borderRadius: '12px',
                      padding: '1rem',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '.75rem'
                    }}>
                      <button
                        type="button"
                        onClick={() => setMostrarModalNuevaRemision(false)}
                        style={{
                          padding: '0.7rem 1.25rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '10px',
                          background: '#fff',
                          color: '#374151',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={handleGuardarRemision}
                        style={{
                          padding: '0.7rem 1.4rem',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          color: '#fff',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Remisionar
                      </button>

                      <button
                        type="button"
                        style={{
                          padding: '0.7rem 1.4rem',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#fff',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Remisionar y Enviar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}




          </div>
        </div>

      </div>
      <div className="custom-footer">
        <p className="custom-footer-text">
          © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}