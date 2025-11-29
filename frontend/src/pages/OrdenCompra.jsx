import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavCompras from '../components/NavCompras';
import DetallesOrdenModal from '../components/DetallesOrdenModal';
import OrderDetailsHeader from '../components/OrderDetailsHeader';
import DeleteButton from '../components/DeleteButton';
import SharedListHeaderCard from '../components/SharedListHeaderCard';
import PrimaryButton from '../components/PrimaryButton';
import AdvancedStats from '../components/AdvancedStats';
import { roundMoney } from '../utils/formatters';
import { randomString } from '../utils/secureRandom';
import { calcularTotales as calcularTotalesShared, sumarProp } from '../utils/calculations';
import { isValidEmail } from '../utils/emailHelpers';
/* global globalThis */

// Small helper utilities (local fallbacks used by this page)
const advancedStyles = `
  /* minimal advanced styles for orden compra */
  .orden-compra-advanced-table { box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
  /* Ensure SweetAlert2 popups appear above modals */
  .swal2-container { z-index: 2147483647 !important; }
  .swal2-popup { z-index: 2147483648 !important; }
`;

const calcularTotalesProductos = (productos = [], ivaPercent = 0) => {
  try {
    // Use the shared calculation helper for subtotal/discounts
    const { subtotal = 0 } = calcularTotalesShared(productos || []);
    const subtotalRounded = roundMoney(subtotal || 0);
    const ivaNum = Number(ivaPercent) || 0;
    const impuestos = roundMoney(subtotalRounded * (ivaNum / 100));
    const total = roundMoney(subtotalRounded + impuestos);
    return { subtotal: subtotalRounded, impuestos, total };
  } catch (err) {
    console.error('calcularTotalesProductos error', err);
    return { subtotal: 0, impuestos: 0, total: 0 };
  }
};

// `isValidEmail` moved to `frontend/src/utils/emailHelpers.js` to avoid duplication

// Use shared secure random helper from utils

// API helpers (lightweight wrappers used by this page)
async function fetchOrdenesHelper(setOrdenes) {
  try {
    const res = await api.get('/api/ordenes-compra');
    // Normalizar respuesta: el backend envuelve la lista en { success:true, data: [...] }
    const payload = res.data;
    if (Array.isArray(payload)) {
      setOrdenes(payload);
    } else if (payload && Array.isArray(payload.data)) {
      setOrdenes(payload.data);
    } else if (payload && Array.isArray(payload.ordenes)) {
      setOrdenes(payload.ordenes);
    } else {
      setOrdenes([]);
    }
  } catch (error_) {
    console.error('fetchOrdenesHelper error', error_);
    setOrdenes([]);
  }
}

async function fetchProveedoresHelper(setProveedores) {
  try {
    // Prefer activos endpoint which returns { success:true, proveedores: [...] }
    const res = await api.get('/api/proveedores/activos');
    const payload = res.data;
    if (Array.isArray(payload)) {
      setProveedores(payload);
    } else if (payload && Array.isArray(payload.proveedores)) {
      setProveedores(payload.proveedores);
    } else if (payload && Array.isArray(payload.data)) {
      setProveedores(payload.data);
    } else {
      setProveedores([]);
    }
  } catch (error_) {
    console.error('fetchProveedoresHelper error', error_);
    setProveedores([]);
  }
}

async function fetchProductosPorProveedorHelper(proveedorId, setProductosProveedor, setCargandoProductos) {
  try {
    setCargandoProductos(true);
    // Backend returns { success:true, data: [...] } for products; product endpoint does not accept proveedorId in controller, so fetch all and filter client-side
    const res = await api.get('/api/products');
    const payload = res.data;
    let allProducts = [];
    if (Array.isArray(payload)) {
      allProducts = payload;
    } else if (payload && Array.isArray(payload.data)) {
      allProducts = payload.data;
    } else if (payload && Array.isArray(payload.products)) {
      allProducts = payload.products;
    }

    if (proveedorId) {
      const filtered = allProducts.filter(p => {
        // p.proveedor may be an object or an id string
        if (!p) return false;
        if (typeof p.proveedor === 'string') return String(p.proveedor) === String(proveedorId);
        if (p.proveedor && (p.proveedor._id || p.proveedor.id)) return String(p.proveedor._id || p.proveedor.id) === String(proveedorId);
        return false;
      });
      // If provider has no products, fall back to showing all products so user can still add items
      if (filtered.length > 0) {
        setProductosProveedor(filtered);
      } else {
        setProductosProveedor(allProducts);
      }
      return { filtered, allProducts };
    } else {
      setProductosProveedor(allProducts);
      return { filtered: allProducts, allProducts };
    }
  } catch (error_) {
    console.error('fetchProductosPorProveedorHelper error', error_);
    setProductosProveedor([]);
    return { filtered: [], allProducts: [] };
  } finally {
    setCargandoProductos(false);
  }
}

const findProductoById = (lista, id) => {
  lista = lista || [];
  return lista.find(p => {
    const pid = String(id || '');
    const cand = String(p && (p._id || p.id || p.productoId || ''));
    return cand === pid;
  });
};

const crearProductoFromSelection = (productoSeleccionado, productoTemp = {}) => {
  const cantidad = Number(productoTemp.cantidad) || 1;
  const valorUnitario = roundMoney(productoTemp.valorUnitario || productoSeleccionado.price || productoSeleccionado.precio || 0);
  const descuento = roundMoney(productoTemp.descuento || 0);
  const valorTotal = roundMoney(cantidad * valorUnitario - descuento);
  return {
    producto: productoSeleccionado.name || productoSeleccionado.nombre || productoTemp.producto || '',
    descripcion: productoSeleccionado.description || productoSeleccionado.descripcion || productoTemp.descripcion || productoSeleccionado.desc || '',
    cantidad,
    valorUnitario,
    descuento,
    valorTotal,
    productoId: productoSeleccionado._id || productoSeleccionado.productoId || ''
  };
};

const handleProveedorChangeHelper = async (e, proveedores, setNuevaOrden, setProductoTemp, fetchProductosPorProveedor, setProductosProveedor) => {
  const id = e.target.value;
  const proveedor = proveedores.find(p => p._id === id) || {};
  setNuevaOrden(prev => ({ ...prev, proveedor: proveedor.nombre || '', proveedorId: id }));
  setProductoTemp({ producto: '', descripcion: '', cantidad: 1, valorUnitario: 0, descuento: 0, productoId: '' });
  if (id) await fetchProductosPorProveedor(id, setProductosProveedor, () => { });
};

const handleProveedorChangeEditarHelper = async (e, proveedores, setOrdenEditando, fetchProductosPorProveedor, setProductosProveedor) => {
  const id = e.target.value;
  const proveedor = proveedores.find(p => p._id === id) || {};
  setOrdenEditando(prev => ({ ...prev, proveedor: proveedor.nombre || '', proveedorId: id }));
  if (id) await fetchProductosPorProveedor(id, setProductosProveedor, () => { });
};

const handleProductoChangeHelper = (e, productosProveedor, setProductoTemp) => {
  const id = e.target.value;
  const prod = productosProveedor.find(p => {
    const pid = String(id || '');
    return String(p && (p._id || p.id || p.productoId || '')) === pid;
  }) || {};
  setProductoTemp({
    producto: prod.name || prod.nombre || '',
    descripcion: prod.description || prod.descripcion || prod.desc || '',
    cantidad: 1,
    valorUnitario: prod.price || prod.precio || 0,
    descuento: 0,
    productoId: id
  });
};

const handleProductoChangeEditarHelper = (e, productosProveedor, setProductoTemp) => {
  // same as add-mode helper but used when editing
  handleProductoChangeHelper(e, productosProveedor, setProductoTemp);
};

async function marcarComoCompletadaHelper(orden, fetchOrdenes) {
  if (!orden?._id) return;
  try {
    // Use the dedicated completar endpoint so backend runs stock update + creates Compra
    const res = await api.put(`/api/ordenes-compra/${orden._id}/completar`);
    const data = res.data || res;
    if (data?.success) {
      await fetchOrdenes();
      Swal.fire('OK', 'Orden marcada como completada y movida al historial', 'success');
    } else {
      console.error('marcarComoCompletadaHelper respuesta inesperada', data);
      Swal.fire('Error', data?.message || 'No se pudo completar la orden', 'error');
    }
  } catch (error_) {
    console.error('marcarComoCompletadaHelper error', error_);
    Swal.fire('Error', 'No se pudo marcar como completada', 'error');
  }
}
// Inyectar estilos
if (!document.getElementById('orden-compra-advanced-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'orden-compra-advanced-styles';
  styleEl.innerText = advancedStyles;
  document.head.appendChild(styleEl);
}

// Top-level helpers for printing to keep `imprimirOrdenHelper` simple
const buildProductRowsOrden = (items) => {
  if (!items || items.length === 0) return '<tr><td colspan="5" style="text-align:center;padding:20px;">No hay productos</td></tr>';
  return items.map((p, idx) => `
    <tr>
      <td style="text-align:center;padding:8px;border-bottom:1px solid #e0e0e0;">${idx + 1}</td>
      <td style="padding:8px;border-bottom:1px solid #e0e0e0;">${p.producto || ''}</td>
      <td style="text-align:center;padding:8px;border-bottom:1px solid #e0e0e0;">${p.cantidad}</td>
      <td style="text-align:right;padding:8px;border-bottom:1px solid #e0e0e0;">$${(p.valorUnitario || 0).toLocaleString()}</td>
      <td style="text-align:right;padding:8px;border-bottom:1px solid #e0e0e0;">$${(p.valorTotal || 0).toLocaleString()}</td>
    </tr>
  `).join('');
};

const prepareHtmlOrden = (o, rows, totals) => `
  <!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Orden de Compra - ${o.numeroOrden || 'N/A'}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #222; padding: 24px; background: #fff; }
        .container { max-width: 900px; margin: 0 auto; }
        .header { text-align: center; background: linear-gradient(135deg, #6a1b9a, #9b59b6); color: #fff; padding: 22px; border-radius: 10px; }
        .header h1 { margin: 0; font-size: 22px; letter-spacing: 1px; }
        .meta { display: flex; gap: 12px; margin-top: 18px; }
        .meta .block { flex: 1; background: #f8f9fb; padding: 12px; border-left: 6px solid #6a1b9a; border-radius: 6px; }
        table { width: 100%; border-collapse: collapse; margin-top: 18px; background: white; }
        thead th { background: linear-gradient(135deg,#6a1b9a,#9b59b6); color: white; padding: 12px; text-align: left; font-weight: 700; }
        tbody td { padding: 12px; border-bottom: 1px solid #eef2f7; vertical-align: middle; }
        .totals { margin-top: 18px; display: block; }
        .totals .row { display:flex; justify-content: flex-end; gap: 26px; font-size: 15px; }
        .totals .row.final { font-weight: 800; color: #6a1b9a; font-size: 18px; margin-top: 8px; }
        .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
        @media print { body { padding: 0; } .container { max-width: 100%; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ORDEN DE COMPRA</h1>
          <div style="margin-top:6px; opacity:0.95;">N° ${o.numeroOrden || '—'}</div>
        </div>

        <div class="meta">
          <div class="block"><strong>Proveedor:</strong> ${o.proveedor || '-'}</div>
          <div class="block"><strong>Solicitado por:</strong> ${o.solicitadoPor || '-'}</div>
          <div class="block"><strong>Fecha:</strong> ${new Date(o.fechaOrden || Date.now()).toLocaleDateString('es-ES')}</div>
        </div>

        <div class="products">
          <table>
            <thead>
              <tr>
                <th style="width:50px; text-align:center;">#</th>
                <th>Producto</th>
                <th style="width:110px; text-align:center;">Cantidad</th>
                <th style="width:140px; text-align:right;">Precio Unit.</th>
                <th style="width:140px; text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>

        <div class="totals">
          <div class="row"><div>Subtotal:</div><div>$${(totals.subtotal || 0).toLocaleString()}</div></div>
          <div class="row final"><div>Total:</div><div>$${(totals.total || 0).toLocaleString()}</div></div>
        </div>

        <div class="footer">
          <div>JLA Global Company</div>
          <div>Documento generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>
    </body>
  </html>
`;

const writeDocPrimaryOrden = (win, html) => {
  try {
    if (!win || !win.document) return false;
    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, 'text/html');
    // create doctype and import the parsed <html> element
    try {
      const doctype = win.document.implementation.createDocumentType('html', '', '');
      const imported = win.document.importNode(parsed.documentElement, true);
      // clear existing children
      while (win.document.firstChild) win.document.firstChild.remove();
      win.document.appendChild(doctype);
      win.document.appendChild(imported);
      win.document.close();
      return true;
    } catch (innerErr) {
      console.debug('importNode approach failed, falling back to document.write:', innerErr);
      try {
        win.document.open();
        win.document.write(html);
        win.document.close();
        return true;
      } catch (writeErr) {
        console.debug('document.write fallback failed:', writeErr);
        return false;
      }
    }
  } catch (err) {
    console.debug('writeDocPrimaryOrden unexpected error:', err);
    return false;
  }
};

const writeDocBlobFallbackOrden = (win, html) => {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  win.location.href = url;
};

// Safely call window actions (focus/print/close) with logging; keeps main flow simple
const safeWindowActions = (win) => {
  try { win.focus(); } catch (error_) { console.debug('focus failed:', error_); }
  try { win.print(); } catch (error_) { console.debug('print failed:', error_); }
  try { win.close(); } catch (error_) { console.debug('close failed:', error_); }
};

// Helper: imprimir orden en nueva ventana (limpio y simple)
function imprimirOrdenHelper(orden) {
  if (!orden) {
    Swal.fire('Error', 'No hay orden seleccionada para imprimir', 'error');
    return;
  }

  const productos = orden.productos || [];
  const totales = calcularTotalesProductos(productos);

  const rows = buildProductRowsOrden(productos);
  const html = prepareHtmlOrden(orden, rows, totales);

  const win = globalThis?.window?.open?.('', '_blank', 'width=900,height=700') ?? null;
  if (!win) {
    Swal.fire('Error', 'No se pudo abrir la ventana de impresión', 'error');
    return;
  }

  // 1) Primary: try DOM/adopt or innerHTML via helper
  try {
    writeDocPrimaryOrden(win, html);
    safeWindowActions(win);
    return;
  } catch (error__) {
    console.debug('Primary write failed, attempting blob fallback:', error__);
  }

  // 2) Blob fallback
  try {
    writeDocBlobFallbackOrden(win, html);
    // blob navigation should be enough for printing in most browsers
    return;
  } catch (error__) {
    console.debug('Blob fallback failed, attempting data URL fallback:', error__);
  }

  // 3) Data URL fallback
  try {
    win.location.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    return;
  } catch (error__) {
    console.error('Data URL navigation failed:', error__);
    Swal.fire('Error', 'No se pudo preparar la impresión', 'error');
  }
}

// Helper: enviar orden por correo (separado para reducir complejidad del componente)
async function enviarOrdenPorCorreoHelper(orden) {
  if (!orden?._id) {
    Swal.fire('Error', 'No hay orden seleccionada', 'error');
    return;
  }

  const { value: formValues } = await Swal.fire({
    title: '📧 Enviar Orden por Correo',
    html: `
      <div style="text-align: left;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Correo del destinatario:</label>
        <input type="email" id="emailDestino" class="swal2-input" placeholder="ejemplo@correo.com" style="margin: 0 0 20px 0; width: 100%;" required>
        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Asunto:</label>
        <input type="text" id="asuntoEmail" class="swal2-input" placeholder="Asunto del correo" style="margin: 0 0 20px 0; width: 100%;" value="Orden de Compra N° ${orden.numeroOrden || 'N/A'} - JLA Global Company">
        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Mensaje:</label>
        <textarea id="mensajeEmail" class="swal2-textarea" placeholder="Escribe tu mensaje aquí..." style="margin: 0; width: 100%; min-height: 150px; resize: vertical;">Estimado proveedor,\n\nAdjunto encontrará la Orden de Compra con la siguiente información:\n\n📋 DETALLES DE LA ORDEN:\n\n• Número de Orden: ${orden.numeroOrden || 'N/A'}\n• Fecha: ${new Date(orden.fechaOrden).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}\n• Proveedor: ${orden.proveedor || 'No especificado'}\n• Productos: ${orden.productos?.length || 0} items\n\nQuedamos atentos a cualquier duda o consulta.\n\nCordialmente,\nJLA Global Company</textarea>
      </div>
    `,
    width: '600px',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: '📧 Enviar Orden',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#f39c12',
    cancelButtonColor: '#6c757d',
    didOpen: () => {
      try {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = '30000';
        const popup = Swal.getPopup();
        if (popup) popup.style.zIndex = '30001';
      } catch (e) { /* ignore */ }
    },
    preConfirm: async () => {
      const email = document.getElementById('emailDestino').value;
      const asunto = document.getElementById('asuntoEmail').value;
      const mensaje = document.getElementById('mensajeEmail').value;
      if (!email) { Swal.showValidationMessage('Por favor ingresa un correo electrónico'); throw new Error('validation'); }
      if (!isValidEmail(email)) { Swal.showValidationMessage('Por favor ingresa un correo electrónico válido'); throw new Error('validation'); }
      if (!asunto || asunto.trim() === '') { Swal.showValidationMessage('Por favor ingresa un asunto'); throw new Error('validation'); }
      return { email, asunto, mensaje };
    }
  });

  if (formValues) {
    try {
      // Loading modal - ensure it overlays the order modal
      Swal.fire({
        title: 'Enviando...',
        text: 'Por favor espera',
        allowOutsideClick: false,
        didOpen: () => {
          try {
            const container = Swal.getContainer();
            if (container) container.style.zIndex = '30020';
            const popup = Swal.getPopup();
            if (popup) popup.style.zIndex = '30021';
          } catch (e) { /* ignore */ }
          Swal.showLoading();
        }
      });

      await api.post(`/api/ordenes-compra/${orden._id}/enviar-email`, { destinatario: formValues.email, asunto: formValues.asunto, mensaje: formValues.mensaje || 'Orden de compra adjunta' });

      // Intentar persistir la marca de 'enviado' en el backend (PUT /:id)
      try {
        await api.put(`/api/ordenes-compra/${orden._id}`, { enviado: true });
      } catch (persistErr) {
        console.warn('No se pudo persistir "enviado" en backend:', persistErr);
      }

      // Success modal - ensure it overlays
      Swal.fire({
        icon: 'success',
        title: '¡Enviado!',
        text: 'La orden de compra ha sido enviada por correo electrónico',
        confirmButtonColor: '#f39c12',
        didOpen: () => {
          try {
            const container = Swal.getContainer();
            if (container) container.style.zIndex = '30030';
            const popup = Swal.getPopup();
            if (popup) popup.style.zIndex = '30031';
          } catch (e) { /* ignore */ }
        }
      });

      return true;
    } catch (error) {
      console.error('Error al enviar correo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo enviar el correo electrónico',
        didOpen: () => {
          try {
            const container = Swal.getContainer();
            if (container) container.style.zIndex = '30040';
            const popup = Swal.getPopup();
            if (popup) popup.style.zIndex = '30041';
          } catch (e) { /* ignore */ }
        }
      });
    }
  }
}

export default function OrdenCompra() {
  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productosProveedor, setProductosProveedor] = useState([]);
  const [proveedorSinProductos, setProveedorSinProductos] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [modalDetallesVisible, setModalDetallesVisible] = useState(false);
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [errores, setErrores] = useState({});
  const [nuevaOrden, setNuevaOrden] = useState({
    productos: [],
    condicionesPago: "Contado",
    estado: 'Pendiente',
    solicitadoPor: '',
    proveedor: '',
    proveedorId: '',
    iva: 0
  });
  const [modalConfirmacionVisible, setModalConfirmacionVisible] = useState(false);
  const [ordenAConfirmar, setOrdenAConfirmar] = useState(null);

  const [ordenEditando, setOrdenEditando] = useState({
    _id: '',
    numeroOrden: '',
    productos: [],
    condicionesPago: "Contado",
    estado: 'Pendiente',
    solicitadoPor: '',
    proveedor: '',
    proveedorId: '',
    fechaOrden: new Date(),
    iva: 0
  });

  const [productoTemp, setProductoTemp] = useState({
    producto: '',
    descripcion: '',
    cantidad: 1,
    valorUnitario: 0,
    descuento: 0,
    productoId: ''
  });

  const [productoEditando, setProductoEditando] = useState({
    producto: '',
    descripcion: '',
    cantidad: 1,
    valorUnitario: 0,
    descuento: 0,
    index: null,
    productoId: ''
  });

  // Usuario actual
  const [usuarioActual, setUsuarioActual] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Delegador: obtener órdenes de compra (usa el helper top-level)
  const fetchOrdenes = async () => {
    await fetchOrdenesHelper(setOrdenes);
  };

  // Delegador: obtener proveedores
  const fetchProveedores = async () => {
    await fetchProveedoresHelper(setProveedores);
  };

  // Delegador: obtener productos por proveedor
  const fetchProductosPorProveedor = async (proveedorId) => {
    const res = await fetchProductosPorProveedorHelper(proveedorId, setProductosProveedor, setCargandoProductos);
    if (proveedorId) {
      // If filtered exists and is empty, mark provider as having no associated products
      const filtered = res && res.filtered ? res.filtered : [];
      setProveedorSinProductos(Array.isArray(filtered) && filtered.length === 0);
    } else {
      setProveedorSinProductos(false);
    }
    return res;
  };

  useEffect(() => {
    // Cargar nombre del usuario desde localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const usuario = JSON.parse(storedUser);
      const nombreCompleto = `${usuario.firstName || ''} ${usuario.surname || ''}`.trim();
      setUsuarioActual(nombreCompleto);
    }

    fetchOrdenes();
    fetchProveedores();

    // Debug: Ver estructura de productos
    const debugProductos = async () => {
      try {
        const res = await api.get('/api/products');
        const data = res.data || res;
        console.log('=== ESTRUCTURA DE PRODUCTOS ===', data);

        if (data.products && data.products.length > 0) {
          console.log('=== PRIMER PRODUCTO DETALLADO ===', data.products[0]);
        }
      } catch (error) {
        console.error('Error en debug:', error);
      }
    };

    debugProductos();
  }, []);

  // Función para agregar producto desde la lista desplegable (AGREGAR)
  const agregarProductoDesdeLista = () => {
    if (!productoTemp.productoId) {
      Swal.fire('Error', 'Por favor selecciona un producto de la lista', 'error');
      return;
    }
    const productoSeleccionado = findProductoById(productosProveedor, productoTemp.productoId);
    if (!productoSeleccionado) {
      Swal.fire('Error', 'Producto no encontrado', 'error');
      return;
    }

    const nuevoProducto = crearProductoFromSelection(productoSeleccionado, productoTemp);

    setNuevaOrden({
      ...nuevaOrden,
      productos: [...nuevaOrden.productos, nuevoProducto]
    });

    // Resetear el formulario temporal
    setProductoTemp({
      producto: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      productoId: ''
    });
  };

  // Función para agregar producto en edición (EDITAR)

  // Cuando se selecciona un proveedor (AGREGAR)
  const handleProveedorChange = async (e) => {
    await handleProveedorChangeHelper(e, proveedores, setNuevaOrden, setProductoTemp, fetchProductosPorProveedor, setProductosProveedor);
  };

  // Cuando se selecciona un proveedor (EDITAR)
  const handleProveedorChangeEditar = async (e) => {
    await handleProveedorChangeEditarHelper(e, proveedores, setOrdenEditando, fetchProductosPorProveedor, setProductosProveedor);
  };

  // Cuando se selecciona un producto de la lista desplegable (AGREGAR)
  const handleProductoChange = (e) => {
    handleProductoChangeHelper(e, productosProveedor, setProductoTemp);
  };

  // Cuando se selecciona un producto de la lista desplegable (EDITAR)

  // Obtener órdenes pendientes para mostrar en la tabla
  const ordenesPendientes = ordenes.filter(orden => orden.estado === 'Pendiente');
  const currentOrdenes = ordenesPendientes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(ordenesPendientes.length / itemsPerPage);

  const statsCards = [
    { id: 'total', iconClass: 'fa-solid fa-file-invoice-dollar', value: ordenes.length, label: 'Total Órdenes' },
    { id: 'pendientes', iconClass: 'fa-solid fa-clock', value: ordenesPendientes.length, label: 'Órdenes Pendientes' },
    { id: 'completadas', iconClass: 'fa-solid fa-check-circle', value: ordenes.filter(o => o.estado === 'Completada').length, label: 'Órdenes Completadas' },
    { id: 'valor', iconClass: 'fa-solid fa-dollar-sign', value: `$${sumarProp(ordenes, 'total').toLocaleString()}`, label: 'Valor Total Órdenes' }
  ];

  const verDetallesOrden = (orden) => {
    setOrdenSeleccionada(orden);
    setModalDetallesVisible(true);
  };

  const abrirModalEditar = async (orden) => {
    // Buscar proveedor por varias posibilidades
    const proveedorEncontrado = proveedores.find(p =>
      p._id === orden.proveedorId ||
      p._id === orden.proveedor ||
      p.nombre === orden.proveedor
    );

    const proveedorId = proveedorEncontrado ? proveedorEncontrado._id : (orden.proveedorId || '');

    // CORRECCIÓN: Inicializar ordenEditando con TODOS los datos de la orden
    setOrdenEditando({
      _id: orden._id,
      numeroOrden: orden.numeroOrden,
      productos: orden.productos ? orden.productos.map(p => ({
        producto: p.producto || p.nombre || '',
        descripcion: p.descripcion || '',
        cantidad: Number(p.cantidad) || 1,
        valorUnitario: roundMoney(p.valorUnitario || p.precioUnitario || 0),
        descuento: roundMoney(p.descuento || 0),
        valorTotal: roundMoney(p.valorTotal || ((Number(p.cantidad) || 1) * (p.valorUnitario || p.precioUnitario || 0) - (p.descuento || 0))),
        productoId: p.productoId || p._id || ''
      })) : [],
      condicionesPago: orden.condicionesPago || "Contado",
      estado: orden.estado || 'Pendiente',
      solicitadoPor: orden.solicitadoPor || usuarioActual,
      proveedor: orden.proveedor || '',
      proveedorId: proveedorId,
      fechaOrden: orden.fechaOrden || new Date()
    });

    // Resetear producto temporal
    setProductoTemp({
      producto: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      productoId: ''
    });
    setErrores({});

    // Cargar productos del proveedor si tenemos un id
    if (proveedorId) {
      await fetchProductosPorProveedor(proveedorId);
    } else {
      setProductosProveedor([]);
    }

    setModalEditarVisible(true);
  };
  const eliminarOrden = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esto eliminará la orden permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await api.delete(`/api/ordenes-compra/${id}`);
      const data = res.data || res;
      if (data.success) {
        Swal.fire('Eliminado', 'La orden ha sido eliminada correctamente', 'success');
        fetchOrdenes();
      } else {
        Swal.fire('Error', data.message || 'No se pudo eliminar', 'error');
      }
    } catch (error) {
      console.error('Error eliminarOrden:', error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  };

  // Función para marcar/desmarcar orden como enviada
  const toggleEnviado = async (id, estadoActual) => {
    // No permitimos revertir una orden ya enviada desde el toggle.
    if (estadoActual) {
      Swal.fire('Info', 'La orden ya fue enviada y no puede volver a marcarse como NO.', 'info');
      return;
    }

    try {
      // El backend no expone PATCH /:id, pero sí PUT /:id (editarOrden).
      // Usamos PUT para enviar el cambio parcial de `enviado`.
      const res = await api.put(`/api/ordenes-compra/${id}`, {
<<<<<<< HEAD
        enviado: true
=======
        enviado: !estadoActual
>>>>>>> d4d68fdc4c4e800ff36185214ea5450f8c612798
      });
      const data = res.data || res;
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Orden marcada como enviada', showConfirmButton: false, timer: 1500 });
        // Actualizamos localmente para reflejar inmediatamente el cambio
        setOrdenes(prev => prev.map(o => o._id === id ? { ...o, enviado: true } : o));
      } else {
        Swal.fire('Error', data.message || 'No se pudo actualizar', 'error');
      }
    } catch (error) {
      console.error('Error toggleEnviado:', error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  };

  // Función para verificar stock antes de completar
  // verificarStockDisponible eliminado por no utilizarse

  // Delegador: marcar orden como completada
  const marcarComoCompletada = async (orden) => {
    await marcarComoCompletadaHelper(orden, fetchOrdenes);
  };

  const abrirModalAgregar = () => {
    setModalAgregarVisible(true);
    setNuevaOrden({
      productos: [],
      condicionesPago: "",
      estado: 'Pendiente',
      solicitadoPor: usuarioActual,
      proveedor: '',
      proveedorId: ''
    });
    setProductoTemp({
      producto: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      productoId: ''
    });
    setProductosProveedor([]);
    setErrores({});
  };


  // agregarProducto eliminado por no utilizarse (se usa agregarProductoDesdeLista/agregarProductoEdicion)

  const eliminarProducto = (index) => {
    const nuevosProductos = [...nuevaOrden.productos];
    nuevosProductos.splice(index, 1);
    setNuevaOrden({ ...nuevaOrden, productos: nuevosProductos });
  };

  // Funciones para editar productos
  const editarProducto = (index) => {
    const producto = ordenEditando.productos[index];

    // Intentar mapear a producto del proveedor si ya están cargados
    let productoId = producto.productoId || '';
    let nombre = producto.producto || '';
    let descripcion = producto.descripcion || '';
    let valorUnitario = producto.valorUnitario || producto.valor || 0;
    let cantidad = producto.cantidad || 1;
    let descuento = producto.descuento || 0;

    if (productoId && productosProveedor && productosProveedor.length > 0) {
      const encontrado = productosProveedor.find(p => p._id === productoId);
      if (encontrado) {
        nombre = encontrado.name || encontrado.nombre || nombre;
        descripcion = encontrado.description || encontrado.descripcion || descripcion;
        valorUnitario = encontrado.price || encontrado.precio || valorUnitario;
      }
    } else if (productosProveedor && productosProveedor.length > 0) {
      // intentar buscar por nombre
      const porNombre = productosProveedor.find(p => (p.name || p.nombre) === (producto.producto || ''));
      if (porNombre) {
        productoId = porNombre._id;
        nombre = porNombre.name || porNombre.nombre;
        descripcion = porNombre.description || porNombre.descripcion || descripcion;
        valorUnitario = porNombre.price || porNombre.precio || valorUnitario;
      }
    }

    setProductoEditando({
      producto: nombre,
      descripcion: descripcion,
      cantidad: cantidad,
      valorUnitario: valorUnitario,
      descuento: descuento,
      index: index,
      productoId: productoId || ''
    });
  };

  // Cuando se cambia el select dentro del editor inline
  const handleProductoEditSelectChange = (e) => {
    const id = e.target.value;
    if (!id) {
      setProductoEditando({ ...productoEditando, productoId: '', producto: '', descripcion: '', valorUnitario: 0 });
      return;
    }
    const prod = productosProveedor.find(p => p._id === id);
    if (prod) {
      setProductoEditando({
        ...productoEditando,
        productoId: id,
        producto: prod.name || prod.nombre || productoEditando.producto,
        descripcion: prod.description || prod.descripcion || productoEditando.descripcion || '',
        valorUnitario: prod.price || prod.precio || productoEditando.valorUnitario || 0
      });
    } else {
      // Fallback: set id only
      setProductoEditando({ ...productoEditando, productoId: id });
    }
  };

  // Guardar los cambios hechos a un producto en edición
  const guardarProductoEditado = () => {
    if (productoEditando.index === null || productoEditando.index === undefined) return;

    const idx = productoEditando.index;
    const nuevos = [...ordenEditando.productos];

    const updated = {
      producto: productoEditando.producto || nuevos[idx].producto,
      descripcion: productoEditando.descripcion || nuevos[idx].descripcion || '',
      cantidad: Number(productoEditando.cantidad) || 1,
      valorUnitario: roundMoney(productoEditando.valorUnitario || nuevos[idx].valorUnitario || 0),
      descuento: roundMoney(productoEditando.descuento || nuevos[idx].descuento || 0),
      valorTotal: roundMoney((Number(productoEditando.cantidad) || 1) * (roundMoney(productoEditando.valorUnitario || nuevos[idx].valorUnitario || 0)) - (roundMoney(productoEditando.descuento || nuevos[idx].descuento || 0))),
      productoId: productoEditando.productoId || nuevos[idx].productoId
    };

    nuevos[idx] = updated;
    setOrdenEditando({ ...ordenEditando, productos: nuevos });

    setProductoEditando({
      producto: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      index: null,
      productoId: ''
    });

    Swal.fire({ icon: 'success', title: 'Producto actualizado', timer: 1200, showConfirmButton: false });
  };

  const cancelarEdicionProducto = () => {
    setProductoEditando({
      producto: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      index: null,
      productoId: ''
    });
  };

  // actualizarProducto eliminado por no utilizarse

  const eliminarProductoEdicion = (index) => {
    const nuevosProductos = ordenEditando.productos.filter((_, i) => i !== index);
    setOrdenEditando({
      ...ordenEditando,
      productos: nuevosProductos
    });
  };

  // NOTE: usamos los helpers top-level `calcularTotalesProductos` y `calcularTotalesOrdenProductos`
  // para evitar duplicar lógica de cálculo de totales dentro del componente.

  // Función para imprimir orden
  const imprimirOrden = () => {
    // Delegate to top-level helper to keep component simple
    imprimirOrdenHelper(ordenSeleccionada);
  };

  // Función para enviar orden por correo
  const enviarOrdenPorCorreo = async () => {
    if (!ordenSeleccionada) {
      Swal.fire('Error', 'No hay orden seleccionada', 'error');
      return;
    }

    const enviadoOk = await enviarOrdenPorCorreoHelper(ordenSeleccionada);
    if (enviadoOk) {
      // Actualizar estado local para que no vuelva a mostrarse el botón
      setOrdenes(prev => prev.map(o => o._id === ordenSeleccionada._id ? { ...o, enviado: true } : o));
      setOrdenSeleccionada(prev => prev ? { ...prev, enviado: true } : prev);
    }
  };

  const guardarOrden = async () => {
    if (nuevaOrden.productos.length === 0) {
      Swal.fire('Error', 'Debes agregar al menos un producto.', 'error');
      return;
    }

    if (!nuevaOrden.solicitadoPor) {
      Swal.fire('Error', 'Debes ingresar quién solicita la orden.', 'error');
      return;
    }

    if (!nuevaOrden.proveedor) {
      Swal.fire('Error', 'Debes seleccionar un proveedor.', 'error');
      return;
    }

    const { subtotal, impuestos, total } = calcularTotalesProductos(nuevaOrden.productos, nuevaOrden.iva || 0);

    const ordenCompleta = {
      numeroOrden: `OC-${Date.now()}-${randomString(9)}`,
      proveedor: nuevaOrden.proveedor,
      productos: nuevaOrden.productos,
      subtotal: subtotal,
      impuestos: impuestos,
      iva: nuevaOrden.iva || 0,
      total: total,
      condicionesPago: nuevaOrden.condicionesPago,
      estado: nuevaOrden.estado,
      solicitadoPor: nuevaOrden.solicitadoPor,
      fechaOrden: new Date()
    };

    try {
      const res = await api.post('/api/ordenes-compra', ordenCompleta);
      const data = res.data || res;
      if (data.success) {
        Swal.fire('¡Éxito!', 'Orden de compra creada correctamente', 'success');
        cerrarModalAgregar();
        fetchOrdenes();
      } else {
        Swal.fire('Error', data.message || 'No se pudo crear la orden', 'error');
      }
    } catch (error) {
      console.error('Error guardarOrden:', error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  };


  const actualizarOrden = async () => {
    // Validación básica
    if (!ordenEditando.proveedor || ordenEditando.proveedor.trim() === '') {
      Swal.fire('Error', 'Debes seleccionar un proveedor.', 'error');
      return;
    }

    if (!ordenEditando.solicitadoPor || ordenEditando.solicitadoPor.trim() === '') {
      Swal.fire('Error', 'Debes ingresar quién solicita la orden.', 'error');
      return;
    }

    if (ordenEditando.productos.length === 0) {
      Swal.fire('Error', 'Debes agregar al menos un producto.', 'error');
      return;
    }

    try {
      setCargando(true);

      // Calcular totales CORRECTAMENTE (incluyendo IVA si está configurado)
      const { subtotal, impuestos, total } = calcularTotalesProductos(ordenEditando.productos, ordenEditando.iva || 0);

      // Preparar datos para enviar - estructura CORRECTA
      const ordenActualizada = {
        proveedor: ordenEditando.proveedor,
        proveedorId: ordenEditando.proveedorId,
        productos: ordenEditando.productos.map(p => {
          // Asegurar que 'producto' sea string (evitar Cast to String failed si viene como objeto)
          const productoStr = (typeof p.producto === 'string')
            ? p.producto
            : (p.producto && (p.producto.name || p.producto.nombre || p.producto._id)) || '';

          const cantidad = Number(p.cantidad) || 1;
          const valorUnitario = roundMoney(p.valorUnitario || 0);
          const descuento = roundMoney(p.descuento || 0);
          const valorTotal = roundMoney(p.valorTotal || (cantidad * valorUnitario - descuento));

          return {
            producto: productoStr,
            descripcion: p.descripcion,
            cantidad: cantidad,
            valorUnitario: valorUnitario,
            descuento: descuento,
            valorTotal: valorTotal,
            productoId: p.productoId
          };
        }),
        subtotal: roundMoney(subtotal),
        impuestos: roundMoney(impuestos),
        iva: ordenEditando.iva || 0,
        total: roundMoney(total),
        condicionesPago: ordenEditando.condicionesPago,
        estado: ordenEditando.estado,
        solicitadoPor: ordenEditando.solicitadoPor,
        fechaOrden: ordenEditando.fechaOrden
      };

      console.log('Enviando datos de actualización:', ordenActualizada); // Para debug

      const res = await api.put(`/api/ordenes-compra/${ordenEditando._id}`, ordenActualizada);
      const data = res.data || res;

      if (data.success) {
        Swal.fire('¡Éxito!', 'Orden de compra actualizada correctamente', 'success');
        cerrarModalEditar();
        fetchOrdenes(); // Recargar la lista
      } else {
        Swal.fire('Error', data.message || 'No se pudo actualizar la orden', 'error');
      }
    } catch (error) {
      console.error('Error al actualizar orden:', error);
      const status = error.response?.status;
      const serverMsg = error.response?.data?.message || error.message;
      console.error('Detalle error actualización:', { status, serverMsg, body: error.response?.data });
      Swal.fire('Error', serverMsg || 'No se pudo conectar con el servidor', 'error');
    } finally {
      setCargando(false);
    }
  };

  const cerrarModalAgregar = () => {
    setModalAgregarVisible(false);
    setNuevaOrden({
      productos: [],
      condicionesPago: "Contado",
      estado: 'Pendiente',
      solicitadoPor: '',
      proveedor: '',
      proveedorId: '',
      iva: 0
    });
    setProductoTemp({ producto: '', descripcion: '', cantidad: 1, valorUnitario: 0, descuento: 0, productoId: '' });
    setProductosProveedor([]);
    setErrores({});
  };

  const cerrarModalEditar = () => {
    setModalEditarVisible(false);
    setOrdenEditando({
      _id: '',
      productos: [],
      condicionesPago: "Contado",
      estado: 'Pendiente',
      solicitadoPor: '',
      proveedor: '',
      proveedorId: '',
      iva: 0
    });
    setProductoEditando({
      producto: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      index: null,
      productoId: ''
    });
    setProductosProveedor([]);
    setErrores({});
  };

  const cerrarModalDetalles = () => {
    setModalDetallesVisible(false);
    setOrdenSeleccionada(null);
  };

  // Modal dragging handled inside `DetallesOrdenModal` component; duplicate helper removed

  const abrirModalConfirmacion = (orden) => {
    setOrdenAConfirmar(orden);
    setModalConfirmacionVisible(true);
  };

  const confirmarCompletada = async () => {
    if (ordenAConfirmar) {
      try {
        await marcarComoCompletada(ordenAConfirmar);
        setModalConfirmacionVisible(false);
        setOrdenAConfirmar(null);
      } catch (error) {
        console.error('Error al completar la orden:', error);
      }
    }
  };

  const cancelarConfirmacion = () => {
    setModalConfirmacionVisible(false);
    setOrdenAConfirmar(null);
  };

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavCompras />
        <div className="max-width">
          <div className="contenido-modulo">
            {/* Encabezado profesional (reutilizable) */}
            <SharedListHeaderCard
              title="Órdenes de Compra"
              subtitle="Gestiona y supervisa las órdenes de compra a proveedores"
              iconClass="fa-solid fa-file-invoice-dollar"
            >
              <PrimaryButton onClick={abrirModalAgregar}>
                <i className="fa-solid fa-plus" aria-hidden={true}></i>
                <span>Nueva Orden</span>
              </PrimaryButton>
            </SharedListHeaderCard>

            <AdvancedStats cards={statsCards} />

            {/* Tabla de órdenes mejorada */}
            <div className="table-container">
              <div className="table-header">
                <div className="table-header-content">
                  <div className="table-header-icon">
                    <i className="fa-solid fa-table"></i>
                  </div>
                  <div>
                    <h4 className="table-title">
                      Lista de Órdenes de Compra
                    </h4>
                    <p className="table-subtitle">
                      Mostrando {ordenesPendientes.length} órdenes pendientes
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ overflow: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>
                        <i className="fa-solid fa-hashtag icon-gap"></i>
                      </th>
                      <th>
                        <i className="fa-solid fa-hashtag icon-gap"></i><span>IDENTIFICADOR</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-truck icon-gap"></i><span>PROVEEDOR</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-dollar-sign icon-gap"></i><span>TOTAL</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-calendar icon-gap"></i><span>FECHA</span>
                      </th>
                      <th>
                        <i className="fa-solid fa-user icon-gap"></i><span>SOLICITADO POR</span>
                      </th>
                      <th style={{ textAlign: 'center' }}>
                        <i className="fa-solid fa-toggle-on icon-gap"></i><span>ESTADO</span>
                      </th>
                      <th style={{ textAlign: 'center' }}>
                        <i className="fa-solid fa-paper-plane icon-gap"></i><span>ENVIADO</span>
                      </th>
                      <th style={{ textAlign: 'center' }}>
                        <i className="fa-solid fa-cogs icon-gap"></i><span>ACCIONES</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrdenes.map((orden, index) => (
                      <tr key={orden._id}>
                        <td style={{ fontWeight: '600', color: '#6366f1' }}>
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td>
                          <button
                            onClick={() => verDetallesOrden(orden)}
                            className="orden-numero-link"
                          >
                            {orden.numeroOrden}
                          </button>
                        </td>
                        <td>
                          <span className="role-badge">
                            {orden.proveedor || 'No especificado'}
                          </span>
                        </td>
                        <td style={{ fontWeight: '600', color: '#1f2937' }}>
                          ${orden.total?.toLocaleString()}
                        </td>
                        <td>
                          {new Date(orden.fechaOrden).toLocaleDateString()}
                        </td>
                        <td>
                          {orden.solicitadoPor || 'No especificado'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {orden.estado === 'Pendiente' ? (
                            <button
                              onClick={() => abrirModalConfirmacion(orden)}
                              className="action-btn edit"
                            >
                              Pendiente
                            </button>
                          ) : (
                            <span className={`status-badge ${orden.estado === 'Completada' ? 'active' : 'inactive'}`}>
                              {orden.estado}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {orden.enviado ? (
                            <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 8, background: '#ecfdf5', color: '#065f46', fontWeight: 700 }}>Sí</span>
                          ) : (
                            <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 8, background: '#fff1f2', color: '#7f1d1d', fontWeight: 700 }}>No</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => abrirModalEditar(orden)}
                              title="Editar orden"
                              className="action-btn edit"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            {!orden.enviado && (
                              <DeleteButton onClick={() => eliminarOrden(orden._id)} title="Eliminar orden" ariaLabel="Eliminar orden">
                                <i className="fa-solid fa-trash"></i>
                              </DeleteButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {ordenesPendientes.length === 0 && (
                      <tr>
                        <td colSpan="9">
                          <div className="table-empty-state">
                            <div className="table-empty-icon">
                              <i className="fa-solid fa-file-invoice-dollar"></i>
                            </div>
                            <div>
                              <h5 className="table-empty-title">
                                No hay órdenes pendientes
                              </h5>
                              <p className="table-empty-text">
                                No se encontraron órdenes de compra pendientes
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

            {/* Modal para agregar nueva orden (estilo Proveedores - morado) */}
            {modalAgregarVisible && (
              <div className="modal-overlay">
                <div className="modal-realista modal-lg" style={{ maxWidth: '1100px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #6a1b9a, #9b59b6)', color: 'white', padding: '1.25rem 1.5rem', borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fa-solid fa-file-invoice-dollar" style={{ fontSize: '1.1rem' }}></i>
                        </div>
                        <div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>Nueva Orden de Compra</div>
                          <div style={{ fontSize: '0.85rem', opacity: 0.95 }}>N° {nuevaOrden.numeroOrden || '—'}</div>
                        </div>
                      </div>
                      <div>
                        <button className="modal-close-realista" onClick={cerrarModalAgregar} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.25rem' }}>&times;</button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', padding: '1rem', maxHeight: '75vh', overflow: 'hidden' }}>
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                      <div style={{ background: 'white', padding: '1rem', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
                        <h6 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="fa-solid fa-info-circle" style={{ color: '#6a1b9a' }}></i> Información de la Orden</h6>
                        <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div>
                            <label htmlFor="nueva-proveedor" className="form-label-profesional">Proveedor *</label>
                            <select id="nueva-proveedor" value={nuevaOrden.proveedorId || ''} onChange={handleProveedorChange} className="form-input-profesional">
                              <option value="">Seleccione un proveedor</option>
                              {proveedores.filter(p => p.activo || p._id === ordenEditando.proveedorId).map(prov => (
                                <option key={prov._id} value={prov._id}>{prov.nombre}</option>
                              ))}
                            </select>
                            {errores.proveedor && <div style={{ color: '#e74c3c', fontSize: '0.85rem' }}>{errores.proveedor}</div>}
                          </div>
                          <div>
                            <label htmlFor="nueva-solicitadoPor" className="form-label-profesional">Solicitado Por</label>
                            <input id="nueva-solicitadoPor" className="form-input-profesional" value={nuevaOrden.solicitadoPor} disabled />
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label htmlFor="nueva-condicionesPago" className="form-label-profesional">Condiciones de Pago</label>
                            <textarea id="nueva-condicionesPago" className="form-input-profesional" rows={3} value={nuevaOrden.condicionesPago} onChange={e => setNuevaOrden({ ...nuevaOrden, condicionesPago: e.target.value })} />
                          </div>
                          <div>
                            <label htmlFor="nueva-iva" className="form-label-profesional">IVA (%)</label>
                            <input id="nueva-iva" type="number" step="0.01" className="form-input-profesional" value={nuevaOrden.iva || 0} onChange={e => setNuevaOrden({ ...nuevaOrden, iva: Number(e.target.value) })} />
                          </div>
                        </div>
                      </div>

                      <div style={{ background: 'white', padding: '1rem', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
                        <h6 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="fa-solid fa-cart-plus" style={{ color: '#6a1b9a' }}></i> Agregar Productos</h6>
                        <div style={{ marginTop: '0.75rem' }}>
                          {nuevaOrden.proveedorId ? (
                            <>
                              {proveedorSinProductos && (
                                <div style={{ padding: '0.75rem', background: '#fff6f0', border: '1px solid #ffedd5', borderRadius: 8, marginBottom: '0.5rem', color: '#9a3412' }}>
                                  Este proveedor no tiene productos asociados.
                                </div>
                              )}

                              <select value={productoTemp.productoId || ''} onChange={handleProductoChange} className="form-input-profesional">
                                <option value="">Seleccione un producto</option>
                                {productosProveedor.length > 0 ? productosProveedor.map(prod => (
                                  <option key={prod._id || prod.id || prod.productoId || JSON.stringify(prod)} value={prod._id || prod.id || prod.productoId || ''}>{prod.name || prod.nombre} - ${(prod.price || prod.precio)?.toLocaleString()}</option>
                                )) : <option value="" disabled>{cargandoProductos ? 'Cargando...' : 'No hay productos'}</option>}
                              </select>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <input className="form-input-profesional" value={productoTemp.descripcion} disabled placeholder="Descripción" />
                                <input type="number" min="1" className="form-input-profesional" value={productoTemp.cantidad} onChange={e => setProductoTemp({ ...productoTemp, cantidad: Number(e.target.value) })} />
                                <input className="form-input-profesional" value={productoTemp.valorUnitario} disabled />
                                <input type="number" step="0.01" className="form-input-profesional" value={productoTemp.descuento} onChange={e => setProductoTemp({ ...productoTemp, descuento: Number(e.target.value) })} />
                              </div>

                              <div style={{ marginTop: '0.5rem' }}>
                                <button style={{ background: '#6a1b9a', color: 'white', borderRadius: '8px', padding: '10px 15px' }} onClick={agregarProductoDesdeLista} disabled={!productoTemp.productoId || productoTemp.cantidad < 1}><i className="fa-solid fa-plus"></i> Agregar Producto</button>
                              </div>
                            </>
                          ) : (
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8 }}>Seleccione un proveedor para ver productos</div>
                          )}
                        </div>
                      </div>

                      {nuevaOrden.productos.length > 0 && (
                        <div style={{ background: 'white', padding: '0.75rem', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Producto</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Descripción</th>
                                <th style={{ padding: '8px', textAlign: 'center' }}>Cantidad</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                                <th style={{ padding: '8px', textAlign: 'center' }}>Acción</th>
                              </tr>
                            </thead>
                            <tbody>
                              {nuevaOrden.productos.map((p, i) => (
                                <tr key={p.productoId || p.id || i} style={{ borderBottom: '1px solid #eee' }}>
                                  <td style={{ padding: '8px' }}><strong>{p.producto}</strong></td>
                                  <td style={{ padding: '8px' }}>{p.descripcion}</td>
                                  <td style={{ padding: '8px', textAlign: 'center' }}>{p.cantidad}</td>
                                  <td style={{ padding: '8px', textAlign: 'right' }}>${p.valorTotal.toLocaleString()}</td>
                                  <td style={{ padding: '8px', textAlign: 'center' }}><button style={{ background: '#e53e3e', color: 'white', borderRadius: '8px', padding: '5px 10px' }} onClick={() => eliminarProducto(i)}>Eliminar</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>Subtotal</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>${calcularTotalesProductos(nuevaOrden.productos, nuevaOrden.iva || 0).subtotal.toLocaleString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>Impuestos ({nuevaOrden.iva || 0}%)</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>${calcularTotalesProductos(nuevaOrden.productos, nuevaOrden.iva || 0).impuestos.toLocaleString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>Total</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#7b1fa2' }}>${calcularTotalesProductos(nuevaOrden.productos, nuevaOrden.iva || 0).total.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ width: 340, padding: '1rem', background: '#f6f0fb', borderLeft: '1px solid #ebe3f6', overflowY: 'auto' }}>
                      <div className="pdf-orden-compra" style={{ background: 'white', padding: '0.9rem', borderRadius: 8 }}>
                        <div style={{ textAlign: 'center', background: 'linear-gradient(135deg,#6a1b9a,#9b59b6)', color: 'white', padding: '0.5rem', borderRadius: 6, marginBottom: '0.6rem', fontWeight: 700 }}>ORDEN DE COMPRA</div>
                        <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}><strong>N°</strong> {nuevaOrden.numeroOrden || '—'}</div>
                        <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}><strong>Proveedor:</strong> {nuevaOrden.proveedor || '-'}</div>
                        <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}><strong>Solicitado por:</strong> {nuevaOrden.solicitadoPor || '-'}</div>
                        <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}><strong>Fecha:</strong> {new Date(nuevaOrden.fechaOrden || Date.now()).toLocaleDateString('es-ES')}</div>
                        <hr />
                        <div>
                          {nuevaOrden.productos.map((p, i) => (
                            <div key={p.productoId || p.id || i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                              <div style={{ fontSize: '0.9rem' }}>{p.producto}</div>
                              <div style={{ fontSize: '0.9rem' }}>{p.cantidad} x ${(p.valorUnitario || 0).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                        <hr />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                          <div>Total</div>
                          <div style={{ color: '#7b1fa2' }}>${calcularTotalesProductos(nuevaOrden.productos).total.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', borderTop: '1px solid #ececec', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: '#7f8c8d' }}>{nuevaOrden.productos.length} producto(s)</div>
                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button className="btn-profesional" onClick={cerrarModalAgregar} style={{ background: '#95a5a6', color: 'white', borderRadius: '8px', padding: '15px' }}><i className="fa-solid fa-times"></i> Cancelar</button>
                        <button style={{ background: '#10b981', color: 'white', borderRadius: '8px', padding: '15px' }} onClick={guardarOrden}><i className="fa-solid fa-check"></i> Guardar Orden</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal para editar orden (formato como Proveedores) */}
            {modalEditarVisible && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <form onSubmit={(e) => { e.preventDefault(); actualizarOrden(); }} style={{ backgroundColor: 'white', borderRadius: '20px', maxWidth: '900px', width: '95%', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}>
                  {/* Header */}
                  <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '1.5rem 2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fa-solid fa-file-invoice" style={{ fontSize: '1.1rem' }}></i>
                          </div>
                          Editar Orden de Compra
                        </h3>
                        <p style={{ margin: '6px 0 0 58px', opacity: 0.9, fontSize: '0.95rem' }}>Modifica los detalles de la orden</p>
                      </div>
                      <button type="button" onClick={cerrarModalEditar} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: 'white', fontSize: '1.25rem', width: 36, height: 36, borderRadius: 18, cursor: 'pointer' }}>&times;</button>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: '#f8fafc' }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: 12, marginBottom: '1rem', border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label htmlFor="editar-proveedor" className="form-label-profesional">Proveedor *</label>
                          <select id="editar-proveedor" value={ordenEditando.proveedorId} onChange={handleProveedorChangeEditar} className="form-input-profesional" required>
                            <option value="">Seleccione un proveedor</option>
                            {proveedores.filter(p => p.activo).map(proveedor => (
                              <option key={proveedor._id} value={proveedor._id}>{proveedor.nombre}</option>
                            ))}
                          </select>
                          {errores.proveedor && <div style={{ color: '#e74c3c', fontSize: '0.85rem' }}>{errores.proveedor}</div>}
                        </div>

                        <div>
                          <label htmlFor="editar-solicitadoPor" className="form-label-profesional">Solicitado Por</label>
                          <input id="editar-solicitadoPor" disabled value={ordenEditando.solicitadoPor} className="form-input-profesional" style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }} />
                          {errores.solicitadoPor && <div style={{ color: '#e74c3c', fontSize: '0.85rem' }}>{errores.solicitadoPor}</div>}
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                          <label htmlFor="editar-condicionesPago" className="form-label-profesional">Condiciones de Pago</label>
                          <textarea id="editar-condicionesPago" value={ordenEditando.condicionesPago} onChange={e => setOrdenEditando({ ...ordenEditando, condicionesPago: e.target.value })} className="form-input-profesional" rows={3} style={{ resize: 'vertical' }} />
                        </div>

                        <div>
                          <label htmlFor="editar-iva" className="form-label-profesional">IVA (%)</label>
                          <input id="editar-iva" type="number" step="0.01" className="form-input-profesional" value={ordenEditando.iva || 0} onChange={e => setOrdenEditando({ ...ordenEditando, iva: Number(e.target.value) })} />
                        </div>

                        <div>
                          <div className="form-label-profesional">Estado</div>
                          <div>
                            <span className={`badge-profesional ${ordenEditando.estado === 'Pendiente' ? 'badge-pendiente' : 'badge-completada'}`}>{ordenEditando.estado}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Productos */}
                    <div style={{ background: 'white', padding: '1rem', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <h6 style={{ marginTop: 0, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="fa-solid fa-list-check"></i> Productos en la Orden ({ordenEditando.productos.length})</h6>

                      {ordenEditando.productos.length > 0 ? (
                        <>
                          {productoEditando.index !== null && (
                            <div style={{ background: '#fff7ed', border: '1px solid #ffe8cc', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                                <div>
                                  <label htmlFor="editar-producto-select" className="form-label-profesional">Producto</label>
                                  <select id="editar-producto-select" className="form-input-profesional" value={productoEditando.productoId || ''} onChange={handleProductoEditSelectChange}>
                                    <option value="">Seleccione un producto</option>
                                    {productoEditando.productoId && !productosProveedor.some(p => p._id === productoEditando.productoId) && (
                                      <option value={productoEditando.productoId}>{productoEditando.producto || 'Producto actual'}</option>
                                    )}
                                    {productosProveedor.map(prod => (
                                      <option key={prod._id} value={prod._id}>{prod.name || prod.nombre} - ${(prod.price || prod.precio)?.toLocaleString()}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor="editar-producto-descripcion" className="form-label-profesional">Descripción</label>
                                  <input id="editar-producto-descripcion" className="form-input-profesional" value={productoEditando.descripcion} disabled />
                                </div>
                                <div>
                                  <label htmlFor="editar-producto-cantidad" className="form-label-profesional">Cantidad</label>
                                  <input id="editar-producto-cantidad" type="number" min="1" className="form-input-profesional" value={productoEditando.cantidad} onChange={e => setProductoEditando({ ...productoEditando, cantidad: Number(e.target.value) })} />
                                </div>
                                <div>
                                  <label htmlFor="editar-producto-valorUnitario" className="form-label-profesional">Valor Unitario</label>
                                  <input id="editar-producto-valorUnitario" type="number" min="0" step="0.01" className="form-input-profesional" value={productoEditando.valorUnitario} disabled />
                                </div>
                                <div>
                                  <label htmlFor="editar-producto-descuento" className="form-label-profesional">Descuento</label>
                                  <input id="editar-producto-descuento" type="number" min="0" step="0.01" className="form-input-profesional" value={productoEditando.descuento} onChange={e => setProductoEditando({ ...productoEditando, descuento: Number(e.target.value) })} />
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" className="btn-profesional btn-success-profesional" onClick={guardarProductoEditado}><i className="fa-solid fa-check"></i> Guardar</button>
                                <button type="button" className="btn-profesional" onClick={cancelarEdicionProducto} style={{ background: '#95a5a6', color: 'white' }}><i className="fa-solid fa-times"></i> Cancelar</button>
                              </div>
                            </div>
                          )}

                          <div >
                            <table >
                              <thead>
                                <tr>
                                  <th>Producto</th>
                                  <th>Descripción</th>
                                  <th>Cantidad</th>
                                  <th>Valor Unit.</th>
                                  <th>Descuento</th>
                                  <th>Total</th>
                                  <th>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ordenEditando.productos.map((p, i) => (
                                  <tr key={p.productoId || p.id || i} className={productoEditando.index === i ? 'highlighted-row' : ''}>
                                    <td><strong>{p.producto}</strong>{productoEditando.index === i && <span style={{ color: '#f39c12', marginLeft: 6, fontSize: '0.8rem' }}>(Editando)</span>}</td>
                                    <td>{p.descripcion || 'N/A'}</td>
                                    <td><span className="badge-profesional" style={{ background: '#e3f2fd', color: '#1976d2' }}>{p.cantidad}</span></td>
                                    <td>${p.valorUnitario?.toLocaleString()}</td>
                                    <td>{p.descuento > 0 ? <span style={{ color: '#e74c3c', fontWeight: 600 }}>-${p.descuento?.toLocaleString() || '0'}</span> : <span style={{ color: '#95a5a6' }}>$0</span>}</td>
                                    <td><strong>${p.valorTotal?.toLocaleString()}</strong></td>
                                    <td>
                                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <button type="button" className="btn-profesional btn-warning-profesional" onClick={() => editarProducto(i)} disabled={productoEditando.index !== null && productoEditando.index !== i}><i className="fa-solid fa-pen"></i></button>
                                        <button type="button" className="btn-profesional btn-danger-profesional" onClick={() => eliminarProductoEdicion(i)} disabled={productoEditando.index !== null}><i className="fa-solid fa-trash"></i></button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '1rem', color: '#7f8c8d' }}>
                          <i className="fa-solid fa-cart-shopping" style={{ fontSize: '1.6rem', marginBottom: '0.5rem', display: 'block' }}></i>
                          <p>No hay productos en esta orden. Agrega al menos un producto.</p>
                        </div>
                      )}
                    </div>

                    {/* Totales */}
                    {ordenEditando.productos.length > 0 && (
                      <div style={{ marginTop: '0.75rem', background: 'white', padding: '1rem', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Subtotal</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>${calcularTotalesProductos(ordenEditando.productos).subtotal.toLocaleString()}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f39c12' }}>${calcularTotalesProductos(ordenEditando.productos).total.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #e6eef7', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#7f8c8d' }}>{ordenEditando.productos.length} producto(s) en la orden</div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button type="button" onClick={cerrarModalEditar} className="btn-profesional" style={{ background: '#95a5a6', color: 'white' }}><i className="fa-solid fa-times"></i> Cancelar</button>
                      <button type="submit" className="btn-profesional btn-success-profesional" disabled={ordenEditando.productos.length === 0 || cargando}>{cargando ? <><i className="fa-solid fa-spinner fa-spin"></i> Guardando...</> : <><i className="fa-solid fa-check"></i> Actualizar Orden</>}</button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Modal de Detalles */}
            {modalDetallesVisible && ordenSeleccionada && (
              <DetallesOrdenModal
                visible={modalDetallesVisible}
                orden={ordenSeleccionada}
                onClose={cerrarModalDetalles}
                onPrint={imprimirOrden}
                onSendEmail={enviarOrdenPorCorreo}
              />
            )}

            {/* Modal de Confirmación */}
            {modalConfirmacionVisible && ordenAConfirmar && (
              <div className="modal-overlay">
                <div className="modal-realista modal-confirmacion" style={{ maxWidth: '500px', width: '90%', background: 'linear-gradient(135deg, #ffffff, #f8f9fa)' }}>

                  <OrderDetailsHeader
                    iconClass="fa-solid fa-file-invoice-dollar"
                    title="Confirmar Orden"
                    subtitle={`N° ${ordenAConfirmar.numeroOrden}`}
                    onClose={cancelarConfirmacion}
                  />

                  <div className="modal-body" style={{ padding: '1.5rem' }}>
                    <h6 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><i className="fa-solid fa-file-lines icon-gap"></i> Vista Previa de la Orden</h6>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '600', color: '#666' }}>Número:</span>
                        <span style={{ fontWeight: 'bold' }}>{ordenAConfirmar.numeroOrden}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '600', color: '#666' }}>Proveedor:</span>
                        <span>{ordenAConfirmar.proveedor || 'No especificado'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '600', color: '#666' }}>Total:</span>
                        <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>${ordenAConfirmar.total?.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '600', color: '#666' }}>Solicitado por:</span>
                        <span>{ordenAConfirmar.solicitadoPor || 'No especificado'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '600', color: '#666' }}>Fecha:</span>
                        <span>{new Date(ordenAConfirmar.fechaOrden).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, rgba(106,27,154,0.06), rgba(155,89,182,0.04))', border: '1px solid rgba(155,89,182,0.12)', borderRadius: '6px', padding: '1rem', textAlign: 'center', marginTop: '1rem' }}>
                      <i className="fa-solid fa-exclamation-triangle" style={{ color: '#6a1b9a', fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
                      <p style={{ margin: '0', color: '#4b0082', fontWeight: '500' }}>¿Estás seguro de que deseas marcar esta orden como <strong>COMPLETADA</strong>?</p>
                      <small style={{ color: '#6b4a86', display: 'block', marginTop: '0.5rem' }}>Esta acción no se puede deshacer</small>
                    </div>
                  </div>

                  <div className="modal-footer" style={{ padding: '1.25rem', borderTop: '1px solid #e0e0e0', background: '#f8f9fa', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px' }}>
                    <button onClick={cancelarConfirmacion} className="btn-profesional" style={{ background: '#95a5a6', color: 'white', padding: '0.5rem 1.25rem', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                      <i className="fa-solid fa-times icon-gap"></i> Cancelar
                    </button>
                    <button onClick={confirmarCompletada} className="btn-profesional btn-primary-profesional" style={{ background: 'linear-gradient(135deg, #6a1b9a, #9b59b6)', color: 'white', padding: '0.5rem 1.25rem', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(155,89,182,0.25)' }}>
                      <i className="fa-solid fa-check icon-gap"></i> Marcar como Completada
                    </button>
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