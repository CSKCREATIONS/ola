import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import EditarPedido from '../components/EditarPedido';
import PedidoAgendadoPreview from '../components/PedidoAgendadoPreview';
import { Editor } from '@tinymce/tinymce-react';

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

    .pedidos-table-modern {
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border-radius: 20px;
      padding: 30px;
      border: 1px solid #e5e7eb;
      backdrop-filter: blur(10px);
    }

    .pedidos-table-wrapper {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .pedidos-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 12px;
      overflow: hidden;
    }

    .pedidos-table thead tr {
      background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
      color: white;
    }

    .pedidos-table th {
      padding: 20px 15px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .pedidos-table tbody tr {
      border-bottom: 1px solid #f3f4f6;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .pedidos-table tbody tr:hover {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      transform: scale(1.01);
    }

    .pedidos-table td {
      padding: 20px 15px;
      font-size: 14px;
      color: #374151;
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
  </style>
`;

if (typeof document !== 'undefined') {
  const existingStyles = document.getElementById('pedidos-agendados-styles');
  if (!existingStyles) {
    const styleElement = document.createElement('div');
    styleElement.id = 'pedidos-agendados-styles';
    styleElement.innerHTML = pedidosAgendadosStyles;
    document.head.appendChild(styleElement);
  }
}

export default function PedidosAgendados() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [mostrarModalAgendar, setMostrarModalAgendar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [cotizacionPreview, setCotizacionPreview] = useState(null);

  // Usuario autenticado (para mostrar en Responsable)
  const [user, setUser] = useState(null);
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (_) { }
  }, []);

  // Estado del formulario de agendamiento (sólo UI)
  const [agendarCliente, setAgendarCliente] = useState('');
  const [agendarCiudad, setAgendarCiudad] = useState('');
  const [agendarDireccion, setAgendarDireccion] = useState('');
  const [agendarTelefono, setAgendarTelefono] = useState('');
  const [agendarCorreo, setAgendarCorreo] = useState('');
  const [agendarFecha, setAgendarFecha] = useState('');

  // Editors (UI only)
  const descripcionRef = useRef(null);
  const condicionesRef = useRef(null);

  // Productos (UI only dentro del modal)
  const [agendarProductos, setAgendarProductos] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const agregarProductoAgendar = () => {
    const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    setAgendarProductos(prev => ([...prev, {
      uid,
      producto: '',
      nombre: '', descripcion: '', cantidad: '', valorUnitario: '', descuento: '', subtotal: ''
    }]));
  };
  const eliminarProductoAgendar = (index) => {
    setAgendarProductos(prev => prev.filter((_, i) => i !== index));
  };
  const limpiarProductosAgendados = () => {
    if (agendarProductos.length === 0) return;
    setAgendarProductos([]);
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
        console.error('Error al cargar productos disponibles (agendar):', err);
      }
    };
    loadProducts();
  }, []);

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
  };

  // Autocompletado de cliente (igual a RegistrarCotizacion)
  const [clientesAgendar, setClientesAgendar] = useState([]);
  const [filteredClientesAgendar, setFilteredClientesAgendar] = useState([]);
  const [showDropdownAgendar, setShowDropdownAgendar] = useState(false);

  useEffect(() => {
    const cargarClientesYProspectos = async () => {
      try {
        const [clientesRes, prospectosRes] = await Promise.all([
          api.get('/api/clientes'),
          api.get('/api/clientes/prospectos')
        ]);

        const listaClientes = clientesRes.data?.data || clientesRes.data || [];
        const listaProspectos = prospectosRes.data?.data || prospectosRes.data || [];

        const normalizar = (arr, esClienteFlag) => (Array.isArray(arr) ? arr.map(c => ({ ...c, esCliente: !!esClienteFlag })) : []);
        const todos = [...normalizar(listaClientes, true), ...normalizar(listaProspectos, false)];

        const dedupMap = new Map();
        for (const c of todos) {
          const key = ((c.correo || '').toLowerCase().trim()) || c._id;
          if (!dedupMap.has(key)) {
            dedupMap.set(key, c);
          } else {
            const existente = dedupMap.get(key);
            if (!existente.esCliente && c.esCliente) dedupMap.set(key, c);
          }
        }
        const resultado = Array.from(dedupMap.values()).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        setClientesAgendar(resultado);
      } catch (err) {
        console.error('Error al cargar clientes/prospectos (agendar):', err);
      }
    };
    cargarClientesYProspectos();
  }, []);

  // Función para manejar cuando se envía un email
  const handleEmailSent = (pedidoId) => {
    // Actualizar el estado local si es necesario
    setPedidos(prev => prev.map(p =>
      p._id === pedidoId ? { ...p, enviadoCorreo: true } : p
    ));
  };

  // Simple, deterministic email validator (copied pattern from RegistrarCotizacion)
  const isValidEmail = (email) => {
    if (typeof email !== 'string') return false;
    const trimmed = email.trim();
    if (trimmed.length === 0 || trimmed.length > 254) return false;
    const at = trimmed.indexOf('@');
    if (at <= 0 || trimmed.indexOf('@', at + 1) !== -1) return false;
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

  const handleGuardarAgendar = async () => {
    try {
      // Validaciones básicas
      if (!agendarCliente || !agendarCorreo || !agendarTelefono) {
        Swal.fire('Error', 'Nombre, correo y teléfono del cliente son obligatorios.', 'warning');
        return;
      }

      if (!isValidEmail(agendarCorreo)) {
        Swal.fire('Error', 'El correo del cliente no tiene un formato válido.', 'warning');
        return;
      }

      if (agendarProductos.length === 0) {
        Swal.fire('Error', 'Agrega al menos un producto al pedido.', 'warning');
        return;
      }

      // Validar productos mínimos
      for (const p of agendarProductos) {
        if (!p.producto || !p.cantidad || !p.valorUnitario) {
          Swal.fire('Error', 'Cada producto debe tener seleccionado el artículo, la cantidad y el valor unitario.', 'warning');
          return;
        }
      }

      const clientePayload = {
        nombre: agendarCliente,
        ciudad: agendarCiudad || '',
        direccion: agendarDireccion || '',
        telefono: agendarTelefono,
        correo: agendarCorreo,
        esCliente: false,
        operacion: 'agenda'
      };

      const productosPayload = agendarProductos.map(p => ({
        producto: p.producto || null,
        descripcion: p.descripcion || '',
        cantidad: Number.parseFloat(p.cantidad) || 0,
        valorUnitario: Number.parseFloat(p.valorUnitario) || 0,
        descuento: Number.parseFloat(p.descuento) || 0,
        subtotal: Number.parseFloat(p.subtotal) || 0
      }));

      const body = {
        cliente: clientePayload,
        productos: productosPayload,
        fechaEntrega: agendarFecha || new Date().toISOString(),
        descripcion: descripcionRef.current?.getContent({ format: 'html' }) || '',
        condicionesPago: condicionesRef.current?.getContent({ format: 'html' }) || '',
        observacion: '',
        estado: 'agendado'
      };

      const res = await api.post('/api/pedidos', body);
      if (res.status >= 200 && res.status < 300) {
        // Normalizar forma de respuesta
        const data = res.data || res;
        const nuevoPedido = data.data || data;

        // Cerrar modal y limpiar formulario
        setMostrarModalAgendar(false);
        setAgendarCliente(''); setAgendarCiudad(''); setAgendarDireccion(''); setAgendarTelefono(''); setAgendarCorreo(''); setAgendarFecha(''); setAgendarProductos([]);
        if (descripcionRef.current) descripcionRef.current.setContent('');
        if (condicionesRef.current) condicionesRef.current.setContent('');

        // Refrescar lista y abrir preview del pedido creado inmediatamente
        await fetchPedidosAgendados();
        setCotizacionPreview(nuevoPedido);

        // Mostrar toast de confirmación
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Pedido agendado',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          didOpen: (toast) => { toast.addEventListener('mouseenter', Swal.stopTimer); toast.addEventListener('mouseleave', Swal.resumeTimer); }
        });
      } else {
        Swal.fire('Error', res.data?.message || 'No se pudo crear el pedido.', 'error');
      }
    } catch (err) {
      console.error('Error creando pedido agendado:', err);
      Swal.fire('Error', err?.response?.data?.message || 'Error de red al crear el pedido.', 'error');
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = pedidos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(pedidos.length / itemsPerPage);

  // Cargar pedidos (reutilizable)
  const fetchPedidosAgendados = async () => {
    try {
      const pedidosRes = await api.get('/api/pedidos?populate=true');
      const pedidosData = pedidosRes.data || pedidosRes;
      const agendados = (Array.isArray(pedidosData) ? pedidosData : pedidosData.data || []).filter(p => p.estado === 'agendado');
      const agendadosOrdenados = agendados.sort((a, b) => new Date(b.createdAt || b.fechaCreacion) - new Date(a.createdAt || a.fechaCreacion));
      setPedidos(agendadosOrdenados);
    } catch (error_) {
      console.error('❌ Error al cargar pedidos agendados:', error_);
    }
  };

  useEffect(() => { fetchPedidosAgendados(); }, []);

  const exportarPDF = () => {
    const elementosNoExport = document.querySelectorAll('.no-export');
    for (const el of elementosNoExport) {
      el.style.display = 'none';
    }

    const input = document.getElementById('tabla_despachos');
    if (!input) {
      for (const el of elementosNoExport) {
        el.style.display = '';
      }
      return;
    }

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

      pdf.save('pedidos_agendados.pdf');
      for (const el of elementosNoExport) {
        el.style.display = '';
      }
    }).catch((err) => {
      console.error('Error exporting PDF:', err);
      for (const el of elementosNoExport) {
        el.style.display = '';
      }
    });
  };

  const exportarExcel = () => {
    const elementosNoExport = document.querySelectorAll('.no-export');
    for (const el of elementosNoExport) {
      el.style.display = 'none';
    }

    const tabla = document.getElementById("tabla_despachos");
    if (!tabla) {
      for (const el of elementosNoExport) {
        el.style.display = '';
      }
      return;
    }

    const workbook = XLSX.utils.table_to_book(tabla, { sheet: "Pedidos Agendados" });
    workbook.Sheets["Pedidos Agendados"]["!cols"] = new Array(8).fill({ width: 20 });

    XLSX.writeFile(workbook, 'pedidos_agendados.xlsx');
    for (const el of elementosNoExport) {
      el.style.display = '';
    }
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
      const res = await api.patch(`/api/pedidos/${id}/cancelar`, {});
      const result = res.data || res;
      if (res.status >= 200 && res.status < 300) {
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

  const remisionarPedido = async (id) => {
    // Mostrar modal para seleccionar fecha de entrega y luego llamar al endpoint de remisión
    try {
      const defaultDate = pedidoDefaultDateForSwal(id);
      const { value: fechaSeleccionada } = await Swal.fire({
        title: 'Seleccione la fecha de entrega',
        input: 'date',
        inputLabel: 'Fecha de entrega',
        inputValue: defaultDate,
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar'
      });

      if (!fechaSeleccionada) return; // usuario canceló o no escogió

      // Llamar al backend para crear la remisión desde el pedido
      const res = await api.post(`/api/pedidos/${id}/remisionar`, { fechaEntrega: fechaSeleccionada });
      const data = res.data || res;
      if (res.status >= 200 && res.status < 300) {
        setPedidos(prev => prev.filter(p => p._id !== id));
        await Swal.fire('Remisión creada', 'La remisión se ha creado correctamente.', 'success');
        navigate('/PedidosEntregados');
      } else {
        throw new Error(data.message || 'No se pudo crear la remisión');
      }
    } catch (error) {
      console.error('Error al remisionar pedido:', error);
      Swal.fire('Error', error.message || 'No se pudo remisionar el pedido', 'error');
    }
  };

  // Helper: compute YYYY-MM-DD default date for Swal input from pedido fechaEntrega if available
  const pedidoDefaultDateForSwal = (pedidoId) => {
    try {
      const p = pedidos.find(x => x._id === pedidoId) || {};
      if (!p?.fechaEntrega) {
        return '';
      }
      const d = new Date(p.fechaEntrega);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch (error_) {
      console.error('Error computing default date for pedido:', error_);
      return '';
    }
  };

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="max-width">
          <div className="contenido-modulo">
            {/* Encabezado profesional */}
            <div className="pedidos-professional-header">
              <div className="pedidos-header-decoration"></div>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div className="pedidos-icon-container">
                    <i className="fa-solid fa-calendar-check" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                  </div>
                  <div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '700' }}>
                      Pedidos Agendados
                    </h2>
                    <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                      Control y gestión de pedidos programados para entrega
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas avanzadas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div className="pedidos-stats-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    borderRadius: '12px',
                    padding: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fa-solid fa-calendar-check" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                      {pedidos.length}
                    </h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                      Pedidos Agendados
                    </p>
                  </div>
                </div>
              </div>

              <div className="pedidos-stats-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: '12px',
                    padding: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fa-solid fa-chart-line" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                      ${pedidos.reduce((sum, p) => sum + (p.total || 0), 0).toLocaleString('es-CO')}
                    </h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                      Total en Ventas
                    </p>
                  </div>
                </div>
              </div>

              <div className="pedidos-stats-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    borderRadius: '12px',
                    padding: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fa-solid fa-clock" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                      {pedidos.filter(p => new Date(p.fechaEntrega) <= new Date(Date.now() + 24 * 60 * 60 * 1000)).length}
                    </h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                      Entregas Próximas
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controles de exportación y acciones */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="pedidos-export-btn" onClick={exportarExcel}>
                  <i className="fa-solid fa-file-excel"></i>
                  <span>Exportar a Excel</span>
                </button>
                <button className="pedidos-export-btn" onClick={exportarPDF}>
                  <i className="fa-solid fa-file-pdf"></i>
                  <span>Exportar a PDF</span>
                </button>
              </div>
              <div>
                <button
                  className='pedidos-add-btn'
                  onClick={() => setMostrarModalAgendar(true)}
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Agendar Pedido</span>
                </button>
              </div>
            </div>

            {/* Tabla principal con diseño moderno */}
            <div className="pedidos-table-modern">
              <div className="pedidos-table-wrapper">
                <table className="pedidos-table" id="tabla_despachos">
                  <thead>
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
                        <td style={{ fontWeight: '500', color: '#6b7280' }}>
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td style={{ fontWeight: '600', color: '#1f2937' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                              borderRadius: '8px',
                              padding: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '35px'
                            }}>
                              <i className="fa-solid fa-file-invoice" style={{ color: 'white', fontSize: '12px' }}></i>
                            </div>
                            {pedido.numeroPedido ? (
                              <button
                                type="button"
                                style={{
                                  cursor: 'pointer',
                                  color: '#f59e0b',
                                  textDecoration: 'underline',
                                  fontWeight: 'bold',
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  font: 'inherit'
                                }}
                                onClick={async () => {
                                  try {
                                    const res = await api.get(`/api/pedidos/${pedido._id}?populate=true`);
                                    // normalize response shape
                                    const data = res.data || res;
                                    const pedidoCompleto = data.data || data;
                                    setCotizacionPreview(pedidoCompleto);
                                  } catch (error) {
                                    console.error('Error loading pedido:', error);
                                    Swal.fire('Error', 'No se pudo cargar la información del pedido.', 'error');
                                  }
                                }}
                                title="Clic para ver información del pedido"
                              >
                                {pedido.numeroPedido}
                              </button>
                            ) : '---'}
                          </div>
                        </td>
                        <td style={{ color: '#6b7280' }}>
                          {new Date(pedido.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ color: '#6b7280' }}>
                          {new Date(pedido.fechaEntrega).toLocaleDateString()}
                        </td>
                        <td style={{ fontWeight: '500', color: '#1f2937' }}>
                          {pedido.cliente?.nombre}
                        </td>
                        <td style={{ color: '#6b7280' }}>
                          {pedido.cliente?.ciudad}
                        </td>
                        <td style={{ fontWeight: '600', color: '#059669', fontSize: '14px' }}>
                          ${(pedido.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="no-export">
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              className='pedidos-action-btn success'
                              onClick={() => remisionarPedido(pedido._id)}
                              title="Marcar como entregado"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              className='pedidos-action-btn danger'
                              onClick={() => cancelarPedido(pedido._id)}
                              title="Marcar como cancelado"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pedidos.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          style={{
                            padding: '40px',
                            textAlign: 'center',
                            color: '#9ca3af',
                            fontStyle: 'italic',
                            fontSize: '16px'
                          }}
                        >
                          No hay pedidos agendados disponibles
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
                        'linear-gradient(135deg, #f59e0b, #ea580c)' :
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

            {/* Modal de vista previa de pedido agendado */}
            {cotizacionPreview && (
              <PedidoAgendadoPreview
                datos={cotizacionPreview}
                onClose={() => setCotizacionPreview(null)}
                onEmailSent={handleEmailSent}
                onRemisionar={() => remisionarPedido(cotizacionPreview._id)}
              />
            )}

            <EditarPedido />

            {/** Modal: Agendar Pedido **/}
            {mostrarModalAgendar && (
              <div className="modal-overlay">
                <div className=" modal-lg">
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
                    {/* Sección: Información del Cliente (mismos inputs base) */}
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: '.75rem'
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                        }}>
                          <i className="fa-solid fa-user"></i>
                        </div>
                        <h4 style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>Información del Cliente</h4>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1rem'
                      }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label htmlFor="agendar-cliente" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>
                            Nombre o Razón Social <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              id="agendar-cliente"
                              type="text"
                              className="cuadroTexto"
                              placeholder="Ingrese el nombre completo o razón social"
                              value={agendarCliente}
                              onChange={(e) => {
                                const q = e.target.value;
                                setAgendarCliente(q);
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
                              }}
                              onFocus={(e) => {
                                if (filteredClientesAgendar.length > 0) setShowDropdownAgendar(true);
                              }}
                              onBlur={() => setTimeout(() => setShowDropdownAgendar(false), 150)}
                              style={{ border: '2px solid #e5e7eb', background: '#fff', borderRadius: 10 }}
                            />
                            {showDropdownAgendar && filteredClientesAgendar.length > 0 && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '100%', left: 0, right: 0,
                                  zIndex: 50,
                                  background: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderTop: 'none',
                                  borderRadius: '0 0 10px 10px',
                                  maxHeight: 240,
                                  overflowY: 'auto',
                                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                                }}
                              >
                                {filteredClientesAgendar.map((c) => (
                                  <button
                                    type="button"
                                    key={c._id}
                                    onMouseDown={(ev) => { ev.preventDefault(); }}
                                    onClick={() => {
                                      setAgendarCliente(c.nombre || '');
                                      setAgendarCiudad(c.ciudad || '');
                                      setAgendarDireccion(c.direccion || '');
                                      setAgendarTelefono(c.telefono || '');
                                      setAgendarCorreo(c.correo || '');
                                      setShowDropdownAgendar(false);
                                    }}
                                    style={{
                                      padding: '10px 12px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 4,
                                      borderTop: '1px solid #f1f5f9',
                                      border: 'none',
                                      background: 'white',
                                      textAlign: 'left',
                                      width: '100%'
                                    }}
                                    onMouseEnter={(ev) => { ev.currentTarget.style.background = '#f8fafc'; }}
                                    onMouseLeave={(ev) => { ev.currentTarget.style.background = 'white'; }}
                                    aria-label={`Seleccionar cliente ${c.nombre || ''}`}
                                  >
                                    <span style={{ fontWeight: 600, color: '#111827' }}>
                                      {c.nombre}
                                      {!c.esCliente && (
                                        <span style={{ marginLeft: 6, background: '#6366f1', color: '#ffffff', fontSize: 10, padding: '2px 6px', borderRadius: 12, fontWeight: 600 }}>PROSPECTO</span>
                                      )}
                                    </span>
                                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                                      {c.ciudad || 'Ciudad no especificada'}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label htmlFor="agendar-ciudad" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>Ciudad</label>
                          <input
                            id="agendar-ciudad"
                            type="text"
                            className="cuadroTexto"
                            placeholder="Ciudad de residencia"
                            value={agendarCiudad}
                            onChange={(e) => setAgendarCiudad(e.target.value)}
                            style={{ border: '2px solid #e5e7eb', background: '#fff', borderRadius: 10 }}
                          />
                        </div>

                        <div>
                          <label htmlFor="agendar-direccion" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>Dirección</label>
                          <input
                            id="agendar-direccion"
                            type="text"
                            className="cuadroTexto"
                            placeholder="Dirección completa"
                            value={agendarDireccion}
                            onChange={(e) => setAgendarDireccion(e.target.value)}
                            style={{ border: '2px solid #e5e7eb', background: '#fff', borderRadius: 10 }}
                          />
                        </div>

                        <div>
                          <label htmlFor="agendar-telefono" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>Teléfono <span style={{ color: '#ef4444' }}>*</span></label>
                          <input
                            id="agendar-telefono"
                            type="tel"
                            className="cuadroTexto"
                            placeholder="+57 000 000 0000"
                            value={agendarTelefono}
                            onChange={(e) => setAgendarTelefono(e.target.value)}
                            style={{ border: '2px solid #e5e7eb', background: '#fff', borderRadius: 10 }}
                          />
                        </div>

                        <div>
                          <label htmlFor="agendar-correo" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>Correo Electrónico <span style={{ color: '#ef4444' }}>*</span></label>
                          <input
                            id="agendar-correo"
                            type="email"
                            className="cuadroTexto"
                            placeholder="cliente@ejemplo.com"
                            value={agendarCorreo}
                            onChange={(e) => setAgendarCorreo(e.target.value)}
                            style={{ border: '2px solid #e5e7eb', background: '#fff', borderRadius: 10 }}
                          />
                        </div>

                        <div>
                          <div style={{ marginBottom: 6, fontWeight: 600, color: '#374151' }}>Responsable</div>
                          <div style={{
                            padding: '0.7rem 1rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: 10,
                            backgroundColor: '#f8fafc',
                            color: '#64748b'
                          }}>
                            <i className="fa-solid fa-user-tie" style={{ color: '#06b6d4', marginRight: 8 }}></i>
                            <span>{user ? `${user.firstName || ''} ${user.surname || ''}` : ''}</span>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="agendar-fecha" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>Fecha</label>
                          <input
                            id="agendar-fecha"
                            type="date"
                            className="cuadroTexto"
                            value={agendarFecha}
                            onChange={(e) => setAgendarFecha(e.target.value)}
                            style={{ border: '2px solid #e5e7eb', background: '#fff', borderRadius: 10 }}
                          />
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
                        <h4 style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>Descripción del Pedido</h4>
                      </div>
                      <div style={{ background: '#fff', borderRadius: 10, padding: '0.75rem', border: '2px solid #e5e7eb' }}>
                        <Editor
                          id="agendar-descripcion"
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
                          Productos a agendar
                        </h4>
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                          <button
                            type="button"
                            onClick={agregarProductoAgendar}
                            style={{
                              padding: '.6rem 1rem',
                              border: 'none',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: '#fff', fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            <i className="fa-solid fa-plus" style={{ marginRight: 8 }}></i>
                            Agregar Producto
                          </button>
                          {agendarProductos.length > 0 && (
                            <button
                              type="button"
                              onClick={limpiarProductosAgendados}
                              style={{
                                padding: '.6rem 1rem',
                                borderRadius: '10px',
                                border: '2px solid #ef4444',
                                background: '#fff', color: '#ef4444', fontWeight: 600, cursor: 'pointer'
                              }}
                            >
                              <i className="fa-solid fa-trash" style={{ marginRight: 8 }}></i>
                              Limpiar Todo
                            </button>
                          )}
                        </div>
                      </div>

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
                              {agendarProductos.map((prod, index) => (
                                <tr key={prod.uid || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '.8rem .75rem', color: '#64748b', fontWeight: 500 }}>{index + 1}</td>
                                  <td style={{ padding: '.5rem .75rem' }}>
                                    <select
                                      className="cuadroTexto"
                                      name="producto"
                                      value={prod.producto || ''}
                                      onChange={(e) => handleProductoSelectAgendar(index, e.target.value)}
                                      style={{ border: '2px solid #e5e7eb', borderRadius: 6, padding: '8px' }}
                                    >
                                      <option value="">Seleccione un producto</option>
                                      {productosDisponibles.filter(p => p.activo !== false && p.activo !== 'false').map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td style={{ padding: '.5rem .75rem' }}>
                                    <input
                                      type="text"
                                      name="descripcion"
                                      className="cuadroTexto"
                                      value={prod.descripcion}
                                      onChange={(e) => handleProductoAgendarChange(index, e)}
                                      style={{ border: '2px solid #e5e7eb', borderRadius: 6 }}
                                    />
                                  </td>
                                  <td style={{ padding: '.5rem .75rem' }}>
                                    <input
                                      type="number"
                                      name="cantidad"
                                      className="cuadroTexto"
                                      value={prod.cantidad}
                                      onChange={(e) => handleProductoAgendarChange(index, e)}
                                      style={{ border: '2px solid #e5e7eb', borderRadius: 6, textAlign: 'center' }}
                                    />
                                  </td>
                                  <td style={{ padding: '.5rem .75rem' }}>
                                    <input
                                      type="number"
                                      name="valorUnitario"
                                      className="cuadroTexto"
                                      value={prod.valorUnitario}
                                      onChange={(e) => handleProductoAgendarChange(index, e)}
                                      readOnly
                                      style={{ border: '2px solid #e5e7eb', borderRadius: 6, textAlign: 'center' }}
                                    />
                                  </td>
                                  <td style={{ padding: '.5rem .75rem' }}>
                                    <input
                                      type="number"
                                      name="descuento"
                                      className="cuadroTexto"
                                      value={prod.descuento}
                                      onChange={(e) => handleProductoAgendarChange(index, e)}
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
                                      onClick={() => eliminarProductoAgendar(index)}
                                      style={{
                                        padding: '.5rem', border: 'none', borderRadius: 6, background: '#ef4444', color: '#fff', cursor: 'pointer', width: '2rem', height: '2rem'
                                      }}
                                    >
                                      <i className="fa-solid fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}

                              {agendarProductos.length === 0 && (
                                <tr>
                                  <td colSpan={8} style={{ padding: '1.25rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                                    No hay productos agregados. Haga clic en "Agregar Producto" para comenzar.
                                  </td>
                                </tr>
                              )}

                              {agendarProductos.length > 0 && (
                                <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)' }}>
                                  <td colSpan={6} style={{ padding: '0.9rem .75rem', fontWeight: 700, textAlign: 'right', color: '#1e293b' }}>Total General:</td>
                                  <td style={{ padding: '0.9rem .75rem', fontWeight: 700, textAlign: 'center', color: '#059669' }}>
                                    {agendarProductos.reduce((acc, p) => acc + (Number.parseFloat(p.subtotal) || 0), 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
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
                        <h4 style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>Condiciones del Pedido</h4>
                      </div>
                      <div style={{ background: '#fff', borderRadius: 10, padding: '0.75rem', border: '2px solid #e5e7eb' }}>
                        <Editor
                          id="agendar-condiciones"
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
                        onClick={() => setMostrarModalAgendar(false)}
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
                        onClick={handleGuardarAgendar}
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
                        Guardar
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
                        Guardar y Enviar
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