import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import EditarPedido from '../components/EditarPedido';
import PedidoAgendadoPreview from '../components/PedidoAgendadoPreview';
import RemisionPreview from '../components/RemisionPreview';
import SharedListHeaderCard from '../components/SharedListHeaderCard';
import AdvancedStats from '../components/AdvancedStats';
import * as TinyMCE from "@tinymce/tinymce-react";

/* Estilos CSS avanzados para Pedidos Agendados */
const pedidosAgendadosStyles = `
  <style>
    .pedidos-agendados-container {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .pedidos-stats-card {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-radius: 16px;
      padding: 25px;
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .pedidos-stats-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }

    .pedidos-stats-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #f59e0b, #f97316, #ea580c);
    }

    .pedidos-professional-header {
      background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      color: white;
      position: relative;
      overflow: hidden;
    }

    .pedidos-header-decoration {
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      z-index: 1;
    }

    .pedidos-icon-container {
      background: rgba(255,255,255,0.2);
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(10px);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .pedidos-action-btn {
      background: linear-gradient(135deg, #f59e0b, #ea580c);
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

    .pedidos-action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(245, 158, 11, 0.4);
    }

    .pedidos-action-btn.success {
      background: linear-gradient(135deg, #10b981, #059669);
    }

    .pedidos-action-btn.success:hover {
      box-shadow: 0 5px 15px rgba(16, 185, 129, 0.4);
    }

    .pedidos-action-btn.danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    .pedidos-action-btn.danger:hover {
      box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4);
    }

    .pedidos-add-btn {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 20px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .pedidos-add-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }

    .pedidos-export-btn {
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

    .pedidos-export-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
    }

    .pedidos-badge {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #f59e0b;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1.25rem;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
    }

    .modal-lg {
      background: white;
      border-radius: 12px;
      width: min(1100px, 100%);
      max-width: 1100px;
      max-height: calc(100vh - 80px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .modal-body {
      padding: 1rem 1.25rem;
      overflow: auto;
      max-height: calc(100vh - 240px);
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.4rem;
      line-height: 1;
      cursor: pointer;
      color: #374151;
    }

    .modal-body table { width: 100%; border-collapse: collapse; }
    .modal-body .overflow-auto { overflow: auto; }
  </style>
`;

if (typeof document !== 'undefined') {
  const existingStyles = document.getElementById('pedidos-agendados-styles');
  if (existingStyles == null) {
    const styleElement = document.createElement('div');
    styleElement.id = 'pedidos-agendados-styles';
    styleElement.innerHTML = pedidosAgendadosStyles;
    document.head.appendChild(styleElement);
  }
}

// ==================== CONSTANTES Y HELPERS ====================

// Estilos reutilizables
const MODAL_STYLES = {
  section: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    borderRadius: '14px',
    padding: '1.25rem',
    border: '1px solid #e2e8f0',
    marginBottom: '1rem'
  },
  sectionHeader: {
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '.75rem',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '.75rem'
  },
  sectionTitle: {
    margin: 0,
    fontWeight: 600,
    color: '#1e293b'
  },
  inputContainer: {
    background: '#fff',
    borderRadius: 10,
    padding: '0.75rem',
    border: '2px solid #e5e7eb'
  }
};

const BUTTON_STYLES = {
  cancel: {
    padding: '0.7rem 1.25rem',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    background: '#fff',
    color: '#374151',
    fontWeight: 600,
    cursor: 'pointer'
  },
  primary: {
    padding: '0.7rem 1.4rem',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer'
  },
  success: {
    padding: '0.7rem 1.4rem',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer'
  }
};

// Helper: Normalizar respuestas de API
const normalizeApiResponse = (response) => {
  const data = response.data || response;
  return data.data || data;
};

// Helper: Validar email
const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  const at = trimmed.indexOf('@');
  if (at <= 0 || trimmed.includes('@', at + 1)) return false;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!local || !domain || local.length > 64 || domain.length > 253) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if (domain.includes('..')) return false;
  const labels = domain.split('.');
  if (labels.length < 2) return false;
  const labelAllowed = /^[A-Za-z0-9-]+$/;
  return labels.every(lab => lab && lab.length <= 63 && !lab.startsWith('-') && !lab.endsWith('-') && labelAllowed.test(lab));
};

// Helper: Limpiar campo de error
const clearFieldError = (setErrors, fieldName) => {
  setErrors(prev => {
    const next = { ...prev };
    delete next[fieldName];
    return next;
  });
};

// Helper: Toast de éxito
const showSuccessToast = (title) => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });
};

// Helper: Deduplicar clientes
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
  return Array.from(dedupMap.values()).sort((a, b) => 
    (a.nombre || '').localeCompare(b.nombre || '')
  );
};

// Helper: Normalizar array de clientes
const normalizeClientes = (arr, esClienteFlag) => 
  (Array.isArray(arr) ? arr.map(c => ({ ...c, esCliente: !!esClienteFlag })) : []);

// Helper: Sanitizar teléfono
const sanitizePhone = (value) => {
  let sanitized = value.replaceAll(/[^\d+ ]/g, '');
  sanitized = sanitized.replaceAll(/(?!^)\+/g, '');
  if (/\+/.test(sanitized) && sanitized[0] !== '+') {
    sanitized = '+' + sanitized.replaceAll('+', '');
  }
  return sanitized;
};

// ==================== COMPONENTES ====================

// Componente: Icono de sección de modal
const ModalSectionIcon = ({ icon, gradient }) => (
  <div style={{
    width: 36,
    height: 36,
    borderRadius: 10,
    background: gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff'
  }}>
    <i className={icon}></i>
  </div>
);

ModalSectionIcon.propTypes = {
  icon: PropTypes.string.isRequired,
  gradient: PropTypes.string.isRequired
};

// Componente: Error de campo
const FieldError = ({ error }) => 
  error ? (
    <div style={{ color: '#ef4444', marginTop: 6, fontSize: '0.9rem' }}>
      {error}
    </div>
  ) : null;

FieldError.propTypes = {
  error: PropTypes.string
};

// Componente: Fila de pedido
const PedidoRow = ({ 
  pedido, 
  index, 
  indexOfFirstItem, 
  blinkPedidoId, 
  handleViewPedido, 
  remisionarPedido, 
  cancelarPedido 
}) => (
  <tr key={pedido._id} className={pedido._id === blinkPedidoId ? 'blink-row-pedido' : ''}>
    <td style={{ fontWeight: '600', color: '#6366f1' }}>{indexOfFirstItem + index + 1}</td>
    <td>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="table-icon-small">
          <i className="fa-solid fa-file-invoice" style={{ color: 'white', fontSize: '12px' }}></i>
        </div>
        {pedido.numeroPedido ? (
          <button
            type="button"
            className="orden-numero-link"
            onClick={() => handleViewPedido(pedido._id)}
            title="Clic para ver información del pedido"
          >
            {pedido.numeroPedido}
          </button>
        ) : (
          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>---</span>
        )}
      </div>
    </td>
    <td style={{ color: '#6b7280' }}>{pedido.fechaAgendamiento}</td>
    <td style={{ color: '#6b7280' }}>{pedido.fechaEntrega}</td>
    <td style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
      {pedido.cliente?.nombre}
    </td>
    <td style={{ color: '#6b7280' }}>{pedido.cliente?.ciudad}</td>
    <td style={{ fontWeight: '600', color: '#059669', fontSize: '14px' }}>
      {(pedido.total || 0).toLocaleString('es-CO', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}
    </td>
    <td className="no-export">
      <div className="action-buttons">
        <button
          className="action-btn success"
          onClick={() => remisionarPedido(pedido._id)}
          title="Marcar como entregado"
        >
          <i className="fas fa-check"></i>
        </button>
        <button
          className="action-btn danger"
          onClick={() => cancelarPedido(pedido._id)}
          title="Marcar como cancelado"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </td>
  </tr>
);

PedidoRow.propTypes = {
  pedido: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    numeroPedido: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fechaAgendamiento: PropTypes.string,
    fechaEntrega: PropTypes.string,
    cliente: PropTypes.shape({
      nombre: PropTypes.string,
      ciudad: PropTypes.string,
    }),
    total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  index: PropTypes.number.isRequired,
  indexOfFirstItem: PropTypes.number.isRequired,
  blinkPedidoId: PropTypes.string,
  handleViewPedido: PropTypes.func.isRequired,
  remisionarPedido: PropTypes.func.isRequired,
  cancelarPedido: PropTypes.func.isRequired,
};

// ==================== COMPONENTE PRINCIPAL ====================

function PedidosAgendados() {
  const [pedidos, setPedidos] = useState([]);
  const [mostrarModalAgendar, setMostrarModalAgendar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [cotizacionPreview, setCotizacionPreview] = useState(null);
  const [remisionPreviewData, setRemisionPreviewData] = useState(null);
  const [showRemisionPreview, setShowRemisionPreview] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingHighlightId, setPendingHighlightId] = useState(null);
  const [blinkPedidoId, setBlinkPedidoId] = useState(null);
  const [user, setUser] = useState(null);

  // Estado del formulario
  const [agendarCliente, setAgendarCliente] = useState('');
  const [agendarCiudad, setAgendarCiudad] = useState('');
  const [agendarDireccion, setAgendarDireccion] = useState('');
  const [agendarTelefono, setAgendarTelefono] = useState('');
  const [agendarCorreo, setAgendarCorreo] = useState('');
  const [agendarFechaAg, setAgendarFechaAg] = useState('');
  const [agendarFechaEnt, setAgendarFechaEnt] = useState('');
  const [errors, setErrors] = useState({});
  const [productErrors, setProductErrors] = useState([]);

  const descripcionRef = useRef(null);
  const condicionesRef = useRef(null);

  const [agendarProductos, setAgendarProductos] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [clientesAgendar, setClientesAgendar] = useState([]);
  const [filteredClientesAgendar, setFilteredClientesAgendar] = useState([]);
  const [showDropdownAgendar, setShowDropdownAgendar] = useState(false);

  // Cargar usuario
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (err) {
      console.error('Error reading stored user:', err);
    }
  }, []);

  // Limpiar errores al abrir modal
  useEffect(() => {
    if (mostrarModalAgendar) {
      setErrors({});
      setProductErrors([]);
    }
  }, [mostrarModalAgendar]);

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.get('/api/products');
        const lista = normalizeApiResponse(res);
        setProductosDisponibles(Array.isArray(lista) ? lista : []);
      } catch (err) {
        console.error('Error al cargar productos:', err);
      }
    };
    loadProducts();
  }, []);

  // Cargar clientes y prospectos
  useEffect(() => {
    const cargarClientesYProspectos = async () => {
      try {
        const [clientesRes, prospectosRes] = await Promise.all([
          api.get('/api/clientes'),
          api.get('/api/clientes/prospectos')
        ]);

        const listaClientes = normalizeApiResponse(clientesRes);
        const listaProspectos = normalizeApiResponse(prospectosRes);

        const todos = [
          ...normalizeClientes(listaClientes, true),
          ...normalizeClientes(listaProspectos, false)
        ];

        setClientesAgendar(deduplicateClientes(todos));
      } catch (err) {
        console.error('Error al cargar clientes/prospectos:', err);
      }
    };
    cargarClientesYProspectos();
  }, []);

  // Cargar pedidos agendados
  const fetchPedidosAgendados = async () => {
    try {
      const pedidosRes = await api.get('/api/pedidos?populate=true');
      const pedidosData = normalizeApiResponse(pedidosRes);
      const agendados = (Array.isArray(pedidosData) ? pedidosData : [])
        .filter(p => p.estado === 'agendado')
        .sort((a, b) => new Date(b.createdAt || b.fechaCreacion) - 
                       new Date(a.createdAt || a.fechaCreacion));
      setPedidos(agendados);
    } catch (error) {
      console.error('Error al cargar pedidos agendados:', error);
    }
  };

  useEffect(() => {
    fetchPedidosAgendados();
  }, []);

  // Procesar navegación con auto-preview
  useEffect(() => {
    try {
      const navState = location?.state;
      if (navState?.autoPreviewPedido) {
        const nuevo = navState.autoPreviewPedido;
        setPedidos(prev => {
          const exists = prev.some(p => p._id === nuevo._id);
          if (!exists) {
            const merged = [nuevo, ...prev];
            return merged.sort((a, b) => 
              new Date(b.createdAt || b.fechaCreacion || 0) - 
              new Date(a.createdAt || a.fechaCreacion || 0)
            );
          }
          return prev;
        });
        setCotizacionPreview(nuevo);
        setPendingHighlightId(nuevo._id);
        if (navState.toast) showSuccessToast(navState.toast);
        navigate('/PedidosAgendados', { replace: true });
      }
    } catch (e) {
      console.error('Error procesando navegación:', e);
    }
  }, [location?.state, navigate]);

  // Animación de parpadeo
  useEffect(() => {
    if (blinkPedidoId) {
      if (!document.getElementById('blink-style-pedidos')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'blink-style-pedidos';
        styleEl.textContent = '@keyframes rowBlinkPedido {0%{background-color:#ffffff;}50%{background-color:#fef9c3;}100%{background-color:#ffffff;}} .blink-row-pedido{animation:rowBlinkPedido 1.2s ease-in-out 6;}';
        document.head.appendChild(styleEl);
      }
      const timeout = setTimeout(() => setBlinkPedidoId(null), 7500);
      return () => clearTimeout(timeout);
    }
  }, [blinkPedidoId]);

  // Handlers de productos
  const agregarProductoAgendar = () => {
    const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    setAgendarProductos(prev => [...prev, {
      uid,
      producto: '',
      nombre: '',
      descripcion: '',
      cantidad: '',
      valorUnitario: '',
      descuento: '',
      subtotal: ''
    }]);
    setProductErrors(prev => [...prev, {}]);
  };

  const eliminarProductoAgendar = (index) => {
    setAgendarProductos(prev => prev.filter((_, i) => i !== index));
    setProductErrors(prev => prev.filter((_, i) => i !== index));
  };

  const limpiarProductosAgendados = () => {
    if (agendarProductos.length === 0) return;
    setAgendarProductos([]);
    setProductErrors([]);
  };

  const handleProductoAgendarChange = (index, e) => {
    const { name, value } = e.target;
    setAgendarProductos(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [name]: value };
      const cantidadNum = Number.parseFloat(next[index].cantidad) || 0;
      const valorNum = Number.parseFloat(next[index].valorUnitario) || 0;
      const descNum = Number.parseFloat(next[index].descuento) || 0;
      const subtotal = cantidadNum * valorNum * (1 - descNum / 100);
      next[index].subtotal = subtotal ? subtotal.toFixed(2) : '';
      
      setProductErrors(prevErrors => {
        const ne = [...(prevErrors || [])];
        ne[index] = ne[index] || {};
        if (ne[index]?.[name]) delete ne[index][name];
        return ne;
      });
      
      return next;
    });
  };

  const handleProductoSelectAgendar = (index, productId) => {
    const producto = productosDisponibles.find(p => (p._id || p.id) === productId);
    setAgendarProductos(prev => {
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
    setProductErrors(prev => {
      const next = [...(prev || [])];
      next[index] = {};
      return next;
    });
  };

  // Handlers de cliente
  const handleDropdownSelectCliente = (c) => {
    setAgendarCliente(c.nombre || '');
    setAgendarCiudad(c.ciudad || '');
    setAgendarDireccion(c.direccion || '');
    setAgendarTelefono(c.telefono || '');
    setAgendarCorreo(c.correo || '');
    setShowDropdownAgendar(false);
  };

  const handleAgendarClienteChange = (e) => {
    const q = e.target.value;
    setAgendarCliente(q);
    clearFieldError(setErrors, 'cliente');
    
    if (q && q.trim().length >= 1) {
      const ql = q.trim().toLowerCase();
      const matches = clientesAgendar
        .filter(c => (c?.nombre || '').toLowerCase().includes(ql))
        .slice(0, 10);
      setFilteredClientesAgendar(matches);
      setShowDropdownAgendar(matches.length > 0);
    } else {
      setFilteredClientesAgendar([]);
      setShowDropdownAgendar(false);
    }
  };

  const handleViewPedido = async (pedidoId) => {
    try {
      const res = await api.get(`/api/pedidos/${pedidoId}?populate=true`);
      const pedidoCompleto = normalizeApiResponse(res);
      setCotizacionPreview(pedidoCompleto);
    } catch (error) {
      console.error('Error loading pedido:', error);
      Swal.fire('Error', 'No se pudo cargar la información del pedido.', 'error');
    }
  };

  const handleEmailSent = (pedidoId) => {
    setPedidos(prev => prev.map(p =>
      p._id === pedidoId ? { ...p, enviadoCorreo: true } : p
    ));
  };

  const handleGuardarAgendar = async () => {
    try {
      const newErrors = {};
      const newProductErrors = [];

      if (!agendarCliente?.trim()) newErrors.cliente = 'Nombre o razón social es obligatorio.';
      if (!agendarTelefono?.trim()) newErrors.telefono = 'Teléfono es obligatorio.';
      if (!agendarCorreo?.trim()) newErrors.correo = 'Correo es obligatorio.';
      else if (!isValidEmail(agendarCorreo)) newErrors.correo = 'Formato de correo inválido.';
      if (!agendarFechaAg) newErrors.fechaAg = 'Fecha de agendamiento es obligatoria.';
      if (!agendarFechaEnt) newErrors.fechaEnt = 'Fecha de entrega es obligatoria.';

      if (agendarProductos?.length) {
        for (let i = 0; i < agendarProductos.length; i++) {
          const p = agendarProductos[i];
          const pe = {};
          if (!p.producto) pe.producto = 'Seleccione un producto.';
          if (!p.cantidad || Number.parseFloat(p.cantidad) <= 0) 
            pe.cantidad = 'Cantidad debe ser mayor a 0.';
          if (!p.valorUnitario || Number.parseFloat(p.valorUnitario) <= 0) 
            pe.valorUnitario = 'Valor unitario inválido.';
          newProductErrors[i] = pe;
        }
      } else {
        newErrors.productos = 'Agrega al menos un producto al pedido.';
      }

      const hasFieldErrors = Object.keys(newErrors).length > 0 || 
        newProductErrors.some(pe => pe && Object.keys(pe).length > 0);
      
      if (hasFieldErrors) {
        setErrors(newErrors);
        setProductErrors(newProductErrors);
        return;
      }

      const body = {
        cliente: {
          nombre: agendarCliente,
          ciudad: agendarCiudad || '',
          direccion: agendarDireccion || '',
          telefono: agendarTelefono,
          correo: agendarCorreo,
          esCliente: false,
          operacion: 'agenda'
        },
        productos: agendarProductos.map(p => ({
          producto: p.producto || null,
          descripcion: p.descripcion || '',
          cantidad: Number.parseFloat(p.cantidad) || 0,
          valorUnitario: Number.parseFloat(p.valorUnitario) || 0,
          descuento: Number.parseFloat(p.descuento) || 0,
          subtotal: Number.parseFloat(p.subtotal) || 0
        })),
        fechaAgendamiento: agendarFechaAg || new Date().toISOString(),
        fechaEntrega: agendarFechaEnt || new Date().toISOString(),
        descripcion: descripcionRef.current?.getContent({ format: 'html' }) || '',
        condicionesPago: condicionesRef.current?.getContent({ format: 'html' }) || '',
        observacion: '',
        estado: 'agendado'
      };

      const res = await api.post('/api/pedidos', body);
      if (res.status >= 200 && res.status < 300) {
        const nuevoPedido = normalizeApiResponse(res);
        await handlePostCreate(nuevoPedido);
      } else {
        Swal.fire('Error', res.data?.message || 'No se pudo crear el pedido.', 'error');
      }
    } catch (err) {
      console.error('Error creando pedido agendado:', err);
      Swal.fire('Error', err?.response?.data?.message || 'Error de red al crear el pedido.', 'error');
    }
  };

  const handlePostCreate = async (nuevoPedido) => {
    setMostrarModalAgendar(false);
    setAgendarCliente('');
    setAgendarCiudad('');
    setAgendarDireccion('');
    setAgendarTelefono('');
    setAgendarCorreo('');
    setAgendarFechaAg('');
    setAgendarFechaEnt('');
    setAgendarProductos([]);
    setErrors({});
    setProductErrors([]);
    
    if (descripcionRef.current) descripcionRef.current.setContent('');
    if (condicionesRef.current) condicionesRef.current.setContent('');

    await fetchPedidosAgendados();
    setCotizacionPreview(nuevoPedido);
    showSuccessToast('Pedido agendado');
  };

  const handleClosePedidoPreview = () => {
    setCotizacionPreview(null);
    if (pendingHighlightId) setBlinkPedidoId(pendingHighlightId);
  };

  const exportarPDF = () => {
    const elementosNoExport = document.querySelectorAll('.no-export');
    elementosNoExport.forEach(el => el.style.display = 'none');

    const input = document.getElementById('tabla_despachos');
    if (!input) {
      elementosNoExport.forEach(el => el.style.display = '');
      return;
    }

    const restoreElements = () => {
      elementosNoExport.forEach(el => el.style.display = '');
    };

    html2canvas(input)
      .then(canvas => {
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

        pdf.save('pedidos_agendados.pdf');
        restoreElements();
      })
      .catch(err => {
        console.error('Error exporting PDF:', err);
        restoreElements();
      });
  };

  const exportToExcel = () => {
    if (!pedidos || pedidos.length === 0) {
      Swal.fire("Error", "No hay datos para exportar", "warning");
      return;
    }

    const dataFormateada = pedidos.map(pedido => ({
      'Nombre': pedido.cliente?.nombre || pedido.nombre || pedido.clienteInfo?.nombre || '',
      'Numero de Pedido': pedido.numeroPedido || '',
      'Ciudad': pedido.cliente?.ciudad || pedido.ciudad || pedido.clienteInfo?.ciudad || '',
      'Teléfono': pedido.cliente?.telefono || pedido.telefono || pedido.clienteInfo?.telefono || '',
      'Correo': pedido.cliente?.correo || pedido.correo || pedido.clienteInfo?.correo || '',
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataFormateada);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'ListaPedidosAgendados.xlsx');
  };

  const cancelarPedido = async (id) => {
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
      const res = await api.patch(`/api/pedidos/${id}/cancelar`, { 
        fechaCancelacion: new Date().toISOString() 
      });
      
      if (res.status >= 200 && res.status < 300) {
        Swal.fire('Cancelado', 'El pedido ha sido cancelado', 'success');
        setPedidos(prev => prev.filter(p => p._id !== id));
      } else {
        throw new Error(res.data?.message || 'No se pudo cancelar');
      }
    } catch (error) {
      console.error('Error al cancelar pedido:', error);
      Swal.fire('Error', 'No se pudo cancelar el pedido', 'error');
    }
  };

  const remisionarPedido = async (id) => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const pedido = pedidos.find(p => p._id === id);
      let fechaInicial = hoy;
      
      if (pedido?.fechaEntrega) {
        try {
          const d = new Date(pedido.fechaEntrega);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const fechaDefault = `${yyyy}-${mm}-${dd}`;
          if (fechaDefault >= hoy) fechaInicial = fechaDefault;
        } catch (e) {
          console.error('Error procesando fecha:', e);
        }
      }
      
      const { value: fechaSeleccionada } = await Swal.fire({
        title: 'Seleccione la fecha de entrega',
        input: 'date',
        inputLabel: 'Fecha de entrega',
        inputValue: fechaInicial,
        inputAttributes: {
          min: hoy,
          max: '2099-12-31'
        },
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        preConfirm: (fecha) => {
          if (!fecha) {
            Swal.showValidationMessage('Debe seleccionar una fecha');
            return false;
          }
          if (fecha < hoy) {
            Swal.showValidationMessage('No puede seleccionar una fecha pasada');
            return false;
          }
          return fecha;
        }
      });

      if (!fechaSeleccionada) return;

      const res = await api.post(`/api/pedidos/${id}/remisionar`, { 
        fechaEntrega: fechaSeleccionada 
      });
      
      if (res.status >= 200 && res.status < 300) {
        setPedidos(prev => prev.filter(p => p._id !== id));
        setCotizacionPreview(null);
        
        const remision = res?.data?.remision || res?.data?.data?.remision || null;
        
        if (remision) {
          Swal.fire({ 
            title: 'Remisionando pedido',
            allowOutsideClick: false, 
            allowEscapeKey: false, 
            showConfirmButton: false, 
            didOpen: () => Swal.showLoading() 
          });
          
          navigate('/PedidosEntregados', {
            state: {
              autoPreviewRemision: remision,
              highlightRemisionId: remision._id,
              toast: 'Pedido remisionado'
            }
          });
        } else {
          navigate('/PedidosEntregados', {
            state: { toast: 'pedido remisionado' }
          });
        }
      } else {
        throw new Error(res.data?.message || 'No se pudo crear la remisión');
      }
    } catch (error) {
      console.error('Error al remisionar pedido:', error);
      const responseData = error?.response?.data;
      
      if (responseData?.codigo === 'STOCK_INSUFICIENTE') {
        Swal.fire({
          icon: 'error',
          title: 'Stock insuficiente',
          html: `<p style="font-size:14px;line-height:1.4;margin:0;">${responseData.message || 'El stock disponible no cubre la cantidad solicitada.'}</p>`
        });
        return;
      }
      
      Swal.fire('Error', responseData?.message || error.message || 'No se pudo remisionar el pedido', 'error');
    }
  };

  // Cálculos de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = pedidos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(pedidos.length / itemsPerPage);

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="max-width">
          <div className="contenido-modulo">
            <SharedListHeaderCard
              title="Pedidos Agendados"
              subtitle="Control y gestión de pedidos programados para entrega"
              iconClass="fa-solid fa-calendar-check"
            >
              <div className="export-buttons">
                <button onClick={exportToExcel} className="export-btn excel">
                  <i className="fa-solid fa-file-excel"></i>{' '}
                  <span>Exportar Excel</span>
                </button>
                <button onClick={exportarPDF} className="export-btn pdf">
                  <i className="fa-solid fa-file-pdf"></i>{' '}
                  <span>Exportar PDF</span>
                </button>
                <button 
                  onClick={() => setMostrarModalAgendar(true)} 
                  className="export-btn create"
                >
                  <i className="fa-solid fa-plus"></i>{' '}
                  <span>Agendar Pedido</span>
                </button>
              </div>
            </SharedListHeaderCard>

            <AdvancedStats cards={[
              {
                iconClass: 'fa-solid fa-calendar-check',
                gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                value: pedidos.length,
                label: 'Pedidos Agendados'
              },
              {
                iconClass: 'fa-solid fa-chart-line',
                gradient: 'linear-gradient(135deg, #10b981, #059669)',
                value: `$${pedidos.reduce((sum, p) => sum + (p.total || 0), 0).toLocaleString('es-CO')}`,
                label: 'Total en Ventas'
              },
              {
                iconClass: 'fa-solid fa-clock',
                gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                value: pedidos.filter(p => 
                  new Date(p.fechaEntrega) <= new Date(Date.now() + 24 * 60 * 60 * 1000)
                ).length,
                label: 'Entregas Próximas'
              }
            ]} />

            <div className="table-container">
              <div className="table-header">
                <div className="table-header-content">
                  <div className="table-header-icon">
                    <i className="fa-solid fa-table" style={{ color: 'white', fontSize: '16px' }}></i>
                  </div>
                  <div>
                    <h4 className="table-title">Pedidos pendientes</h4>
                    <p className="table-subtitle">
                      Mostrando {currentItems.length} de {pedidos.length} pedidos
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ overflow: 'auto' }}>
                <table className="data-table" id="tabla_despachos">
                  <thead>
                    <tr>
                      <th>
                        <i className="fa-solid fa-hashtag icon-gap" style={{ color: '#6366f1' }}></i>
                      </th>
                      <th>
                        <i className="fa-solid fa-file-invoice icon-gap" style={{ color: '#6366f1' }}></i>
                        <span>NO. PEDIDO</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-calendar-plus icon-gap" style={{ color: '#6366f1' }}></i>
                        <span>F. AGENDAMIENTO</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-truck icon-gap" style={{ color: '#6366f1' }}></i>
                        <span>F. ENTREGA</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-user icon-gap" style={{ color: '#6366f1' }}></i>
                        <span>CLIENTE</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-location-dot icon-gap" style={{ color: '#6366f1' }}></i>
                        <span>CIUDAD</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-dollar-sign icon-gap" style={{ color: '#6366f1' }}></i>
                        <span>TOTAL</span>
                      </th>
                      <th style={{ textAlign: 'center' }}>
                        <i className="fa-solid fa-cogs icon-gap" style={{ color: '#6366f1' }}></i>
                        <span>ACCIONES</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((pedido, index) => (
                      <PedidoRow
                        key={pedido._id}
                        pedido={pedido}
                        index={index}
                        indexOfFirstItem={indexOfFirstItem}
                        blinkPedidoId={blinkPedidoId}
                        handleViewPedido={handleViewPedido}
                        remisionarPedido={remisionarPedido}
                        cancelarPedido={cancelarPedido}
                      />
                    ))}
                    {pedidos.length === 0 && (
                      <tr>
                        <td colSpan="8">
                          <div className="table-empty-state">
                            <div className="table-empty-icon">
                              <i className="fa-solid fa-calendar-check" 
                                style={{ fontSize: '3.5rem', color: '#9ca3af' }}>
                              </i>
                            </div>
                            <div>
                              <h5 className="table-empty-title">
                                No hay pedidos agendados disponibles
                              </h5>
                              <p className="table-empty-text">
                                No se encontraron pedidos con los criterios de búsqueda
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="table-pagination">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {cotizacionPreview && (
              <PedidoAgendadoPreview
                datos={cotizacionPreview}
                onClose={handleClosePedidoPreview}
                onEmailSent={handleEmailSent}
                onRemisionar={() => remisionarPedido(cotizacionPreview._id)}
              />
            )}

            {showRemisionPreview && remisionPreviewData && (
              <RemisionPreview
                datos={remisionPreviewData}
                onClose={() => {
                  setShowRemisionPreview(false);
                  setRemisionPreviewData(null);
                }}
              />
            )}

            <EditarPedido />

            {mostrarModalAgendar && (
              <div className="modal-overlay">
                <div className="modal-lg">
                  <div className="modal-header">
                    <h5 className="modal-title">Agendar Pedido</h5>
                    <button
                      className="modal-close"
                      onClick={() => setMostrarModalAgendar(false)}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="modal-body">
                    {/* Información del Cliente */}
                    <div style={MODAL_STYLES.section}>
                      <div style={MODAL_STYLES.sectionHeader}>
                        <ModalSectionIcon 
                          icon="fa-solid fa-user" 
                          gradient="linear-gradient(135deg, #3b82f6, #1d4ed8)" 
                        />
                        <h4 style={MODAL_STYLES.sectionTitle}>Información del Cliente</h4>
                      </div>

                      <div className="modal-grid">
                        <div className="modal-grid-item">
                          <label htmlFor="agendar-cliente" className="modal-label">
                            Nombre o Razón Social
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              id="agendar-cliente"
                              type="text"
                              className="modal-input"
                              style={{ border: errors.cliente ? '2px solid #ef4444' : undefined }}
                              placeholder="Nombre o razón social"
                              value={agendarCliente}
                              onChange={handleAgendarClienteChange}
                              onFocus={() => {
                                if (filteredClientesAgendar.length > 0) 
                                  setShowDropdownAgendar(true);
                              }}
                              onBlur={() => setTimeout(() => setShowDropdownAgendar(false), 150)}
                              required
                            />
                            <FieldError error={errors.cliente} />
                            {showDropdownAgendar && filteredClientesAgendar.length > 0 && (
                              <div className="modal-dropdown">
                                {filteredClientesAgendar.map((c) => (
                                  <button
                                    type="button"
                                    key={c._id}
                                    onMouseDown={(ev) => ev.preventDefault()}
                                    onClick={() => handleDropdownSelectCliente(c)}
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
                          <label htmlFor="agendar-ciudad" className="modal-label">Ciudad</label>
                          <input
                            id="agendar-ciudad"
                            type="text"
                            className="modal-input"
                            placeholder="Ciudad de residencia"
                            value={agendarCiudad}
                            onChange={(e) => setAgendarCiudad(e.target.value)}
                          />
                        </div>

                        <div className="modal-grid-item">
                          <label htmlFor="agendar-direccion" className="modal-label">Dirección</label>
                          <input
                            id="agendar-direccion"
                            type="text"
                            className="modal-input"
                            placeholder="Dirección completa"
                            value={agendarDireccion}
                            onChange={(e) => setAgendarDireccion(e.target.value)}
                          />
                        </div>

                        <div className="modal-grid-item">
                          <label htmlFor="agendar-telefono" className="modal-label">Teléfono</label>
                          <input
                            id="agendar-telefono"
                            type="tel"
                            className="modal-input"
                            style={{ border: errors.telefono ? '2px solid #ef4444' : undefined }}
                            placeholder="+57 000 000 0000"
                            value={agendarTelefono}
                            inputMode="tel"
                            autoComplete="tel"
                            pattern="^[+]?\d[\d ]{3,}$"
                            onKeyDown={(e) => {
                              if (/^[a-zA-Z]$/.test(e.key)) e.preventDefault();
                            }}
                            onPaste={(e) => {
                              const pasted = (e.clipboardData.getData('text') || '')
                                .replaceAll(/[^\d+ ]/g, '');
                              e.preventDefault();
                              setAgendarTelefono(prev => 
                                sanitizePhone(prev + pasted)
                              );
                            }}
                            onChange={(e) => {
                              setAgendarTelefono(sanitizePhone(e.target.value));
                              clearFieldError(setErrors, 'telefono');
                            }}
                            required
                          />
                          <FieldError error={errors.telefono} />
                        </div>

                        <div className="modal-grid-item">
                          <label htmlFor="agendar-correo" className="modal-label">
                            Correo Electrónico
                          </label>
                          <input
                            id="agendar-correo"
                            type="email"
                            className="modal-input"
                            style={{ border: errors.correo ? '2px solid #ef4444' : undefined }}
                            placeholder="cliente@ejemplo.com"
                            value={agendarCorreo}
                            onChange={(e) => {
                              setAgendarCorreo(e.target.value);
                              clearFieldError(setErrors, 'correo');
                            }}
                            required
                          />
                          <FieldError error={errors.correo} />
                        </div>

                        <div className="modal-grid-item">
                          <div className="modal-label">Responsable</div>
                          <div className="modal-readonly">
                            <i className="fa-solid fa-user-tie"></i>
                            <span>
                              {user ? `${user.firstName || ''} ${user.surname || ''}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="modal-grid-item">
                          <label htmlFor="fecha-agendamiento" className="modal-label">
                            Fecha de agendamiento
                          </label>
                          <input
                            id="fecha-agendamiento"
                            type="date"
                            className="modal-input"
                            style={{ border: errors.fechaAg ? '2px solid #ef4444' : undefined }}
                            value={agendarFechaAg}
                            onChange={(e) => {
                              setAgendarFechaAg(e.target.value);
                              clearFieldError(setErrors, 'fechaAg');
                            }}
                            required
                          />
                          <FieldError error={errors.fechaAg} />
                        </div>

                        <div className="modal-grid-item">
                          <label htmlFor="fecha-entrega" className="modal-label">
                            Fecha de entrega
                          </label>
                          <input
                            id="fecha-entrega"
                            type="date"
                            className="modal-input"
                            style={{ border: errors.fechaEnt ? '2px solid #ef4444' : undefined }}
                            value={agendarFechaEnt}
                            onChange={(e) => {
                              setAgendarFechaEnt(e.target.value);
                              clearFieldError(setErrors, 'fechaEnt');
                            }}
                            required
                          />
                          <FieldError error={errors.fechaEnt} />
                        </div>
                      </div>
                    </div>

                    {/* Descripción */}
                    <div style={MODAL_STYLES.section}>
                      <div style={MODAL_STYLES.sectionHeader}>
                        <ModalSectionIcon 
                          icon="fa-solid fa-edit" 
                          gradient="linear-gradient(135deg, #10b981, #059669)" 
                        />
                        <h4 style={MODAL_STYLES.sectionTitle}>Descripción del Pedido</h4>
                      </div>
                      <div style={MODAL_STYLES.inputContainer}>
                        <TinyMCE.Editor
                          id="agendar-descripcion"
                          onInit={(evt, editor) => (descripcionRef.current = editor)}
                          apiKey="2o32797pg92f9dkmfu7lag00dumqni4pik6xv30ds3v5nq9o"
                          textareaName="Descripcion"
                          init={{ height: 220, menubar: false }}
                        />
                      </div>
                    </div>

                    {/* Productos */}
                    <div style={MODAL_STYLES.section}>
                      <div style={{
                        ...MODAL_STYLES.sectionHeader,
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem'
                        }}>
                                      <ModalSectionIcon 
                                      icon="fa-solid fa-boxes" 
                                      gradient="linear-gradient(135deg, #f59e0b, #ea580c)" 
                                      />
                                      <h4 style={MODAL_STYLES.sectionTitle}>Productos del Pedido</h4>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button
                                      type="button"
                                      style={{
                                        ...BUTTON_STYLES.success,
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.9rem'
                                      }}
                                      onClick={agregarProductoAgendar}
                                      >
                                      <i className="fa-solid fa-plus" style={{ marginRight: '6px' }} />
                                      Agregar
                                      </button>
                                      {agendarProductos.length > 0 && (
                                      <button
                                        type="button"
                                        style={{
                                        ...BUTTON_STYLES.cancel,
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.9rem'
                                        }}
                                        onClick={limpiarProductosAgendados}
                                      >
                                        <i className="fa-solid fa-trash" style={{ marginRight: '6px' }}></i>
                                        Limpiar
                                      </button>
                                      )}
                                    </div>
                                    </div>
                                    
                                    {errors.productos && (
                                    <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                      {errors.productos}
                                    </div>
                                    )}

                                    {agendarProductos.length > 0 && (
                                    <div style={{ overflow: 'auto' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                      <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem' }}>
                                          Producto
                                        </th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem' }}>
                                          Descripción
                                        </th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem' }}>
                                          Cantidad
                                        </th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem' }}>
                                          Valor Unit.
                                        </th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem' }}>
                                          Desc. %
                                        </th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem' }}>
                                          Subtotal
                                        </th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem' }}>
                                          Acción
                                        </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {agendarProductos.map((prod, idx) => (
                                        <tr key={prod.uid} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                          <td style={{ padding: '0.75rem' }}>
                                          <select
                                            className="modal-input"
                                            style={{ 
                                            border: productErrors[idx]?.producto ? '2px solid #ef4444' : undefined,
                                            minWidth: '150px'
                                            }}
                                            value={prod.producto}
                                            onChange={(e) => handleProductoSelectAgendar(idx, e.target.value)}
                                          >
                                            <option value="">Seleccionar...</option>
                                            {productosDisponibles.map((p) => (
                                            <option key={p._id || p.id} value={p._id || p.id}>
                                              {p.name}
                                            </option>
                                            ))}
                                          </select>
                                          <FieldError error={productErrors[idx]?.producto} />
                                          </td>
                                          <td style={{ padding: '0.75rem' }}>
                                          <input
                                            type="text"
                                            className="modal-input"
                                            placeholder="Descripción"
                                            name="descripcion"
                                            value={prod.descripcion}
                                            onChange={(e) => handleProductoAgendarChange(idx, e)}
                                            style={{ minWidth: '150px' }}
                                          />
                                          </td>
                                          <td style={{ padding: '0.75rem' }}>
                                          <input
                                            type="number"
                                            className="modal-input"
                                            style={{ 
                                            border: productErrors[idx]?.cantidad ? '2px solid #ef4444' : undefined,
                                            textAlign: 'center',
                                            width: '80px'
                                            }}
                                            placeholder="0"
                                            name="cantidad"
                                            value={prod.cantidad}
                                            onChange={(e) => handleProductoAgendarChange(idx, e)}
                                            min="0"
                                            step="1"
                                          />
                                          <FieldError error={productErrors[idx]?.cantidad} />
                                          </td>
                                          <td style={{ padding: '0.75rem' }}>
                                          <input
                                            type="number"
                                            className="modal-input"
                                            style={{ 
                                            border: productErrors[idx]?.valorUnitario ? '2px solid #ef4444' : undefined,
                                            textAlign: 'right',
                                            width: '100px'
                                            }}
                                            placeholder="0.00"
                                            name="valorUnitario"
                                            value={prod.valorUnitario}
                                            onChange={(e) => handleProductoAgendarChange(idx, e)}
                                            min="0"
                                            step="0.01"
                                          />
                                          <FieldError error={productErrors[idx]?.valorUnitario} />
                                          </td>
                                          <td style={{ padding: '0.75rem' }}>
                                          <input
                                            type="number"
                                            className="modal-input"
                                            style={{ textAlign: 'center', width: '70px' }}
                                            placeholder="0"
                                            name="descuento"
                                            value={prod.descuento}
                                            onChange={(e) => handleProductoAgendarChange(idx, e)}
                                            min="0"
                                            max="100"
                                            step="0.01"
                                          />
                                          </td>
                                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                                          {prod.subtotal ? 
                                            Number.parseFloat(prod.subtotal).toLocaleString('es-CO', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                            }) : '0.00'}
                                          </td>
                                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                          <button
                                            type="button"
                                            onClick={() => eliminarProductoAgendar(idx)}
                                            style={{
                                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '0.4rem 0.6rem',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem'
                                            }}
                                          >
                                            <i className="fa-solid fa-trash"></i>
                                          </button>
                                          </td>
                                        </tr>
                                        ))}
                                      </tbody>
                                      </table>
                                    </div>
                                    )}
                                  </div>

                                  {/* Condiciones de Pago */}
                                  <div style={MODAL_STYLES.section}>
                                    <div style={MODAL_STYLES.sectionHeader}>
                                    <ModalSectionIcon 
                                      icon="fa-solid fa-file-contract" 
                                      gradient="linear-gradient(135deg, #8b5cf6, #6366f1)" 
                                    />
                                    <h4 style={MODAL_STYLES.sectionTitle}>Condiciones de Pago</h4>
                                    </div>
                                    <div style={MODAL_STYLES.inputContainer}>
                                    <TinyMCE.Editor
                                      id="agendar-condiciones"
                                      onInit={(evt, editor) => (condicionesRef.current = editor)}
                                      apiKey="2o32797pg92f9dkmfu7lag00dumqni4pik6xv30ds3v5nq9o"
                                      textareaName="Condiciones"
                                      init={{ height: 200, menubar: false }}
                                    />
                                    </div>
                                  </div>

                                  {/* Footer con botones */}
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'flex-end', 
                                    gap: '12px',
                                    marginTop: '1.5rem',
                                    paddingTop: '1rem',
                                    borderTop: '2px solid #e5e7eb'
                                  }}>
                                    <button
                                    type="button"
                                    style={BUTTON_STYLES.cancel}
                                    onClick={() => setMostrarModalAgendar(false)}
                                    >
                                    <i className="fa-solid fa-times" style={{ marginRight: '6px' }} />
                                    Cancelar
                                    </button>
                                    <button
                                    type="button"
                                    style={BUTTON_STYLES.success}
                                    onClick={handleGuardarAgendar}
                                    >
                                    <i className="fa-solid fa-save" style={{ marginRight: '6px' }} />
                                    Guardar Pedido
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

                        export default PedidosAgendados;