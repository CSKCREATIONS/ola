import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavCompras from '../components/NavCompras';
import DetallesOrdenModal from '../components/DetallesOrdenModal';

// CSS inyectado para diseño avanzado
const advancedStyles = `
  .orden-compra-advanced-table {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #e5e7eb;
  }
  
  .orden-compra-header-section {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    padding: 20px 25px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .orden-compra-table-container {
    overflow: auto;
  }
  
  .orden-compra-advanced-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  
  .orden-compra-advanced-table thead tr {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-bottom: 2px solid #e5e7eb;
  }
  
  .orden-compra-advanced-table thead th {
    padding: 16px 12px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 13px;
    letter-spacing: 0.5px;
  }
  
  .orden-compra-advanced-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }
  
  .orden-compra-advanced-table tbody tr:hover {
    background-color: #f8fafc;
  }
  
  .orden-compra-advanced-table tbody td {
    padding: 16px 12px;
    color: #4b5563;
    font-weight: 500;
  }
  
  .orden-numero-link {
    color: #6366f1;
    text-decoration: none;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
    font-weight: 600;
    display: inline-block;
  }
  
  .orden-numero-link:hover {
    background: rgba(99, 102, 241, 0.1);
    text-decoration: underline;
  }
  
  .orden-estado-pendiente {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    color: #d97706;
    border: none;
    border-radius: 8px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);
  }
  
  .orden-estado-pendiente:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(217, 119, 6, 0.3);
  }
  
  .orden-estado-completada {
    background: #dcfce7;
    color: #16a34a;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }
  
  .orden-estado-cancelada {
    background: #fee2e2;
    color: #dc2626;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }
  
  .orden-action-btn {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    color: #1e40af;
    border: none;
    border-radius: 8px;
    padding: 8px 10px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(30, 64, 175, 0.2);
    margin-right: 6px;
  }
  
  .orden-action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(30, 64, 175, 0.3);
  }
  
  .orden-action-btn.delete {
    background: linear-gradient(135deg, #fee2e2, #fecaca);
    color: #dc2626;
    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
  }
  
  .orden-action-btn.delete:hover {
    box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
  }
  
  .orden-empty-state {
    text-align: center;
    padding: 80px 20px;
  }
  
  .orden-empty-icon {
    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
    border-radius: 50%;
    padding: 25px;
    margin: 0 auto 20px auto;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

// Inyectar estilos
if (!document.getElementById('orden-compra-advanced-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'orden-compra-advanced-styles';
  styleSheet.textContent = advancedStyles;
  document.head.appendChild(styleSheet);
}

// Helper: calcular totales para una lista de productos (para usar fuera del componente)
function calcularTotalesOrdenProductos(productos = []) {
  const subtotal = (productos || []).reduce((acc, p) => {
    const valorProducto = (p.cantidad || 0) * (p.valorUnitario || p.precioUnitario || 0);
    const descuento = p.descuento || 0;
    return acc + (valorProducto - descuento);
  }, 0);
  const impuestos = subtotal * 0.19;
  const total = subtotal + impuestos;
  return { subtotal, impuestos, total };
}

// Helper: calcular totales genérico (subtotal basado en valorTotal)
function calcularTotalesProductos(productos = []) {
  const subtotal = (productos || []).reduce((acc, p) => acc + (p.valorTotal || 0), 0);
  const impuestos = subtotal * 0.19;
  const total = subtotal + impuestos;
  return { subtotal, impuestos, total };
}

// Deterministic, linear-time email validator to avoid catastrophic backtracking
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;

  const at = trimmed.indexOf('@');
  // must contain exactly one @
  if (at <= 0 || trimmed.indexOf('@', at + 1) !== -1) return false;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);

  if (!local || !domain) return false;
  if (local.length > 64) return false; // local part max length
  if (domain.length > 253) return false;

  // local part checks: no leading/trailing dot, no consecutive dots, allowed chars (simple conservative set)
  if (local.startsWith('.') || local.endsWith('.')) return false;
  if (local.indexOf('..') !== -1) return false;
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return false;

  // domain checks: must have at least one dot, no empty labels, labels <=63, allowed chars, no leading/trailing hyphen
  if (domain.indexOf('..') !== -1) return false;
  const labels = domain.split('.');
  if (labels.length < 2) return false;
  for (let i = 0; i < labels.length; i++) {
    const lab = labels[i];
    if (!lab || lab.length > 63) return false;
    if (lab.startsWith('-') || lab.endsWith('-')) return false;
    if (!/^[A-Za-z0-9-]+$/.test(lab)) return false;
  }

  return true;
}

// Secure random string for client-side identifiers using Web Crypto when available
function secureRandomString(length) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const cryptoObj = (typeof window !== 'undefined' && window.crypto) ? window.crypto : (typeof globalThis !== 'undefined' ? globalThis.crypto : null);
  if (cryptoObj && cryptoObj.getRandomValues) {
    const bytes = new Uint8Array(length);
    cryptoObj.getRandomValues(bytes);
    let out = '';
    for (let i = 0; i < bytes.length; i++) {
      out += alphabet[bytes[i] % alphabet.length];
    }
    return out;
  }
  // Fallback (not cryptographically secure)
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

// Helper: fetch órdenes (mueve la lógica fuera del componente)
async function fetchOrdenesHelper(setOrdenes) {
  try {
    const res = await api.get('/api/ordenes-compra');
    const data = res.data || res;
    if (data.success || Array.isArray(data)) {
      const ordenesOrdenadas = (data.data || data).sort((a, b) =>
        new Date(b.createdAt || b.fechaCreacion) - new Date(a.createdAt || a.fechaCreacion)
      );
      setOrdenes(ordenesOrdenadas);
    } else {
      Swal.fire('Error', data.message || 'No se pudieron cargar las órdenes', 'error');
    }
  } catch (err) {
    console.error('Error fetchOrdenes:', err);
    Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
  }
}

// Helper: fetch proveedores
async function fetchProveedoresHelper(setProveedores) {
  try {
    const res = await api.get('/api/proveedores');
    const data = res.data || res;
    if (data.success || data.proveedores || Array.isArray(data)) {
      setProveedores(data.data || data.proveedores || data);
    } else {
      console.error('Formato de respuesta inesperado:', data);
    }
  } catch (error) {
    console.error('Error al cargar proveedores:', error);
  }
}

// Helper: fetch productos por proveedor (mira distintas estructuras de respuesta)
async function fetchProductosPorProveedorHelper(proveedorId, setProductosProveedor, setCargandoProductos) {
  if (!proveedorId) {
    setProductosProveedor([]);
    return;
  }

  try {
    setCargandoProductos(true);
    // Cargar TODOS los productos
    const res = await api.get('/api/products');
    const data = res.data || res;

    // Obtener el array de productos (diferentes estructuras posibles)
    let todosProductos = [];
    if (data.products) {
      todosProductos = data.products;
    } else if (data.data) {
      todosProductos = data.data;
    } else if (Array.isArray(data)) {
      todosProductos = data;
    }

    // Filtrar productos por proveedor
    const productosFiltrados = todosProductos.filter(producto => {
      const proveedorProducto = producto.proveedor;
      if (proveedorProducto && typeof proveedorProducto === 'object' && proveedorProducto._id) {
        return proveedorProducto._id === proveedorId;
      } else if (proveedorProducto && typeof proveedorProducto === 'string') {
        return proveedorProducto === proveedorId;
      } else if (proveedorProducto && typeof proveedorProducto === 'object' && proveedorProducto.id) {
        return proveedorProducto.id === proveedorId;
      } else if (producto.proveedorId) {
        return producto.proveedorId === proveedorId;
      }
      return false;
    });

    setProductosProveedor(productosFiltrados);
  } catch (error) {
    console.error('Error al cargar productos:', error);
    Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
    setProductosProveedor([]);
  } finally {
    setCargandoProductos(false);
  }
}

// Helper: buscar producto por id en distintas estructuras
function findProductoById(productos = [], id) {
  if (!id) return null;
  return productos.find(p => p._id === id || p.id === id || p.productoId === id);
}

// Helper: crear objeto de producto a partir de una selección y datos temporales
function crearProductoFromSelection(productoSeleccionado = {}, productoTemp = {}) {
  const valorUnitario = productoSeleccionado.price || productoSeleccionado.precio || 0;
  const cantidad = productoTemp.cantidad || 1;
  const descuento = productoTemp.descuento || 0;
  const valorTotal = valorUnitario * cantidad;
  return {
    producto: productoSeleccionado.name || productoSeleccionado.nombre || '',
    descripcion: productoSeleccionado.description || productoSeleccionado.descripcion || '',
    cantidad: cantidad,
    valorUnitario: valorUnitario,
    descuento: descuento,
    valorTotal: valorTotal,
    productoId: productoSeleccionado._id || productoSeleccionado.id || ''
  };
}

// Helper: manejar selección de proveedor para el modal de creación
async function handleProveedorChangeHelper(eOrId, proveedores, setNuevaOrden, setProductoTemp, fetchProductosPorProveedor, setProductosProveedor) {
  const proveedorId = typeof eOrId === 'string' ? eOrId : (eOrId.target ? eOrId.target.value : '');
  const proveedorSeleccionado = proveedores.find(p => p._id === proveedorId);

  setNuevaOrden(prev => ({
    ...prev,
    proveedor: proveedorSeleccionado ? proveedorSeleccionado.nombre : '',
    proveedorId: proveedorId,
    productos: []
  }));

  setProductoTemp({ producto: '', descripcion: '', cantidad: 1, valorUnitario: 0, descuento: 0, productoId: '' });

  if (proveedorId) {
    await fetchProductosPorProveedor(proveedorId);
  } else {
    setProductosProveedor([]);
  }
}

// Helper: manejar selección de proveedor para el modal de edición
async function handleProveedorChangeEditarHelper(eOrId, proveedores, setOrdenEditando, fetchProductosPorProveedor, setProductosProveedor) {
  const proveedorId = typeof eOrId === 'string' ? eOrId : (eOrId.target ? eOrId.target.value : '');
  const proveedorSeleccionado = proveedores.find(p => p._id === proveedorId);

  setOrdenEditando(prev => ({
    ...prev,
    proveedor: proveedorSeleccionado ? proveedorSeleccionado.nombre : '',
    proveedorId: proveedorId
  }));

  if (proveedorId) {
    await fetchProductosPorProveedor(proveedorId);
  } else {
    setProductosProveedor([]);
  }
}

// Helper: manejar cambio de producto en selects (agregar)
function handleProductoChangeHelper(eOrId, productosProveedor, setProductoTemp) {
  const productoId = typeof eOrId === 'string' ? eOrId : (eOrId.target ? eOrId.target.value : '');
  if (!productoId) {
    setProductoTemp({ producto: '', descripcion: '', cantidad: 1, valorUnitario: 0, descuento: 0, productoId: '' });
    return;
  }

  const productoSeleccionado = findProductoById(productosProveedor, productoId);
  if (productoSeleccionado) {
    setProductoTemp({
      producto: productoSeleccionado.name || productoSeleccionado.nombre,
      descripcion: productoSeleccionado.description || productoSeleccionado.descripcion || '',
      cantidad: 1,
      valorUnitario: productoSeleccionado.price || productoSeleccionado.precio || 0,
      descuento: 0,
      productoId: productoSeleccionado._id
    });
  }
}

// Helper: manejar cambio de producto en selects (editar)
function handleProductoChangeEditarHelper(eOrId, productosProveedor, setProductoTemp) {
  return handleProductoChangeHelper(eOrId, productosProveedor, setProductoTemp);
}

// Helper: marcar orden como completada (delegado fuera del componente)
async function marcarComoCompletadaHelper(orden, fetchOrdenesFn) {
  const confirm = await Swal.fire({
    title: '¿Confirmar orden de compra?',
    text: `Esta acción completará la orden ${orden.numeroOrden} y actualizará el stock de los productos.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, completar orden',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#dc3545'
  });

  if (!confirm.isConfirmed) return;

  try {
    const resCompletar = await api.put(`/api/ordenes-compra/${orden._id}/completar`);
    const dataCompletar = resCompletar.data || resCompletar;

    if (!dataCompletar.success) {
      throw new Error(dataCompletar.message || 'No se pudo completar la orden');
    }

    Swal.fire({
      title: '¡Éxito!',
      html: `
        <div>
          <p><strong>✅ Orden de compra completada correctamente</strong></p>
          <p><strong>Número:</strong> ${orden.numeroOrden}</p>
          <p><strong>Stock actualizado para ${orden.productos.length} producto(s)</strong></p>
          <div style="margin-top: 10px; background: #f8f9fa; padding: 10px; border-radius: 5px;">
            <strong>Productos recibidos:</strong><br>
            ${orden.productos.map(p => `• ${p.producto}: ${p.cantidad} unidades`).join('<br>')}
          </div>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'Aceptar'
    });

    // Actualizar la lista de órdenes
    if (typeof fetchOrdenesFn === 'function') fetchOrdenesFn();
  } catch (error) {
    console.error('Error al completar la orden:', error);
    Swal.fire({
      title: 'Error',
      text: error.message || 'No se pudo completar la orden. Verifica la conexión con el servidor.',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }
}

// Helper: imprimir orden en nueva ventana
function imprimirOrdenHelper(orden) {
  if (!orden) {
    Swal.fire('Error', 'No hay orden seleccionada', 'error');
    return;
  }

  const totales = calcularTotalesOrdenProductos(orden.productos || []);
  const fechaFormateada = orden.fechaOrden
    ? new Date(orden.fechaOrden).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  const productosHTML = (orden.productos || []).map((p, index) => {
    const nombreProducto = p.producto?.name || p.nombre || 'Producto no especificado';
    const descripcionProducto = p.descripcion || p.producto?.description || 'N/A';
    const subtotalProducto = (p.cantidad || 0) * (p.valorUnitario || p.precioUnitario || 0);
    return `
      <tr>
        <td style="text-align: center; padding: 12px; border-bottom: 1px solid #e0e0e0;">${index + 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
          <strong>${nombreProducto}</strong><br/>
          <small style="color: #666;">${descripcionProducto}</small>
        </td>
        <td style="text-align: center; padding: 12px; border-bottom: 1px solid #e0e0e0;">${p.cantidad || 0}</td>
        <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e0e0e0;">$${Number(p.valorUnitario || p.precioUnitario || 0).toLocaleString()}</td>
        <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: 600;">$${Number(subtotalProducto).toLocaleString()}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay productos</td></tr>';

  const win = window.open('', '', 'width=900,height=700');
  win.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Orden de Compra - ${orden.numeroOrden || 'N/A'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            padding: 30px;
            background: #ffffff;
          }
          .container { max-width: 800px; margin: 0 auto; }
          .header { 
            background: linear-gradient(135deg, #f39c12, #e67e22); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0;
            margin-bottom: 0;
          }
          .header h1 { font-size: 28px; margin-bottom: 10px; font-weight: 700; }
          .header p { font-size: 16px; opacity: 0.9; }
          .content { border: 2px solid #f39c12; border-top: none; border-radius: 0 0 10px 10px; padding: 30px; }
          .info-section { background: #f8f9fa; padding: 20px; margin-bottom: 25px; border-left: 4px solid #f39c12; border-radius: 5px; }
          .info-section h3 { color: #f39c12; margin-bottom: 15px; font-size: 16px; font-weight: 600; border-bottom: 2px solid #f39c12; padding-bottom: 8px; }
          .products-section { margin: 30px 0; }
          .products-title { background: #f39c12; color: white; padding: 15px 20px; margin-bottom: 0; font-size: 18px; font-weight: 600; }
          .products-table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .products-table thead { background: #f39c12; color: white; }
          .products-table thead th { padding: 12px; text-align: left; font-weight: 600; font-size: 14px; }
          .products-table tbody tr:nth-child(even) { background: #f8f9fa; }
          .products-table tbody td { padding: 12px; font-size: 14px; border-bottom: 1px solid #e0e0e0; }
          .total-section { background: #f8f9fa; padding: 25px; border-radius: 8px; margin-top: 30px; border: 2px solid #f39c12; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6; font-size: 15px; }
          .total-row.final { border-bottom: none; font-size: 20px; font-weight: bold; color: #f39c12; margin-top: 15px; padding-top: 15px; border-top: 3px solid #f39c12; }
          .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; margin-top: 30px; border-top: 2px solid #dee2e6; }
          @media print { body { padding: 0; } .container { max-width: 100%; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ORDEN DE COMPRA</h1>
            <p>N° ${orden.numeroOrden || 'N/A'}</p>
          </div>

          <div class="content">
            <div class="info-section">
              <h3>📋 Información General</h3>
              <p><strong>Número de Orden:</strong> ${orden.numeroOrden || 'N/A'}</p>
              <p><strong>Fecha:</strong> ${fechaFormateada}</p>
              <p><strong>Estado:</strong> ${orden.estado || 'Pendiente'}</p>
              <p><strong>Solicitado Por:</strong> ${orden.solicitadoPor || 'No especificado'}</p>
            </div>

            <div class="info-section">
              <h3>🏢 Información del Proveedor</h3>
              <p><strong>Nombre:</strong> ${orden.proveedor || 'No especificado'}</p>
              <p><strong>Condiciones de Pago:</strong> ${orden.condicionesPago || 'Contado'}</p>
            </div>

            <div class="products-section">
              <h2 class="products-title">📦 Detalle de Productos</h2>
              <table class="products-table">
                <thead>
                  <tr>
                    <th style="width: 50px; text-align: center;">#</th>
                    <th>Producto</th>
                    <th style="width: 100px; text-align: center;">Cantidad</th>
                    <th style="width: 130px; text-align: right;">Precio Unit.</th>
                    <th style="width: 130px; text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${productosHTML}
                </tbody>
              </table>
            </div>

            <div class="total-section">
              <div class="total-row">
                <span><strong>Subtotal:</strong></span>
                <span>$${totales.subtotal.toLocaleString()}</span>
              </div>
              <div class="total-row final">
                <span>TOTAL:</span>
                <span>$${totales.total.toLocaleString()}</span>
              </div>
            </div>

            <div class="footer">
              <p><strong>JLA Global Company</strong></p>
              <p>Documento generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p>© ${new Date().getFullYear()} JLA Global Company. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}

// Helper: enviar orden por correo (separado para reducir complejidad del componente)
async function enviarOrdenPorCorreoHelper(orden) {
  if (!orden || !orden._id) {
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
    preConfirm: () => {
      const email = document.getElementById('emailDestino').value;
      const asunto = document.getElementById('asuntoEmail').value;
      const mensaje = document.getElementById('mensajeEmail').value;
      if (!email) { Swal.showValidationMessage('Por favor ingresa un correo electrónico'); return false; }
      // Use deterministic validator to avoid any regex backtracking issues
      if (!isValidEmail(email)) { Swal.showValidationMessage('Por favor ingresa un correo electrónico válido'); return false; }
      if (!asunto || asunto.trim() === '') { Swal.showValidationMessage('Por favor ingresa un asunto'); return false; }
      return { email, asunto, mensaje };
    }
  });

  if (formValues) {
    try {
      Swal.fire({ title: 'Enviando...', text: 'Por favor espera', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
      await api.post(`/api/ordenes-compra/${orden._id}/enviar-email`, { destinatario: formValues.email, asunto: formValues.asunto, mensaje: formValues.mensaje || 'Orden de compra adjunta' });
      Swal.fire({ icon: 'success', title: '¡Enviado!', text: 'La orden de compra ha sido enviada por correo electrónico', confirmButtonColor: '#f39c12' });
    } catch (error) {
      console.error('Error al enviar correo:', error);
      Swal.fire('Error', error.response?.data?.message || 'No se pudo enviar el correo electrónico', 'error');
    }
  }
}

export default function OrdenCompra() {
  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productosProveedor, setProductosProveedor] = useState([]);
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
    proveedorId: ''
  });
  const [modalConfirmacionVisible, setModalConfirmacionVisible] = useState(false);
  const [ordenAConfirmar, setOrdenAConfirmar] = useState(null);

  const [ordenEditando, setOrdenEditando] = useState({
    _id: '',
    productos: [],
    condicionesPago: "Contado",
    estado: 'Pendiente',
    solicitadoPor: '',
    proveedor: '',
    proveedorId: ''
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
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
    await fetchProductosPorProveedorHelper(proveedorId, setProductosProveedor, setCargandoProductos);
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
  const agregarProductoEdicion = () => {
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

    setOrdenEditando({
      ...ordenEditando,
      productos: [...ordenEditando.productos, nuevoProducto]
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

    Swal.fire({
      icon: 'success',
      title: 'Producto agregado',
      text: `${productoSeleccionado.name || productoSeleccionado.nombre} se ha agregado a la orden`,
      timer: 1500,
      showConfirmButton: false
    });
  };

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
  const handleProductoChangeEditar = (e) => {
    handleProductoChangeEditarHelper(e, productosProveedor, setProductoTemp);
  };

  // Obtener órdenes pendientes para mostrar en la tabla
  const ordenesPendientes = ordenes.filter(orden => orden.estado === 'Pendiente');
  const currentOrdenes = ordenesPendientes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(ordenesPendientes.length / itemsPerPage);

  const verDetallesOrden = (orden) => {
    setOrdenSeleccionada(orden);
    setModalDetallesVisible(true);
  };

  const abrirModalEditar = async (orden) => {
    const proveedorEncontrado = proveedores.find(p => p.nombre === orden.proveedor);

    setOrdenEditando({
      _id: orden._id,
      numeroOrden: orden.numeroOrden,
      productos: orden.productos ? [...orden.productos] : [],
      condicionesPago: orden.condicionesPago || "Contado",
      estado: orden.estado || 'Pendiente',
      solicitadoPor: orden.solicitadoPor || '',
      proveedor: orden.proveedor || '',
      proveedorId: proveedorEncontrado ? proveedorEncontrado._id : ''
    });

    if (proveedorEncontrado) {
      await fetchProductosPorProveedor(proveedorEncontrado._id);
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
    try {
      const res = await api.patch(`/api/ordenes-compra/${id}`, {
        enviado: !estadoActual
      });
      const data = res.data || res;
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: !estadoActual ? 'Orden marcada como enviada' : 'Orden marcada como no enviada',
          showConfirmButton: false,
          timer: 1500
        });
        fetchOrdenes();
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
      condicionesPago: "Contado",
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

  const calcularValorTotalProducto = (p) => {
    const subtotal = p.cantidad * p.valorUnitario;
    const descuento = p.descuento || 0;
    return subtotal - descuento;
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
    setProductoEditando({
      ...producto,
      index: index,
      productoId: producto.productoId 
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
    // Delegate to top-level helper to keep component simple
    await enviarOrdenPorCorreoHelper(ordenSeleccionada);
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

  const { subtotal, impuestos, total } = calcularTotalesProductos(nuevaOrden.productos);

    const ordenCompleta = {
      numeroOrden: `OC-${Date.now()}-${secureRandomString(9)}`,
      proveedor: nuevaOrden.proveedor,
      productos: nuevaOrden.productos,
      subtotal: subtotal,
      impuestos: impuestos,
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

  const validarOrdenEdicion = (orden) => {
    const nuevosErrores = {};

    if (!orden.proveedor) nuevosErrores.proveedor = 'Seleccione un proveedor';
    if (!orden.solicitadoPor.trim()) nuevosErrores.solicitadoPor = 'Ingrese el solicitante';
    if (orden.productos.length === 0) nuevosErrores.productos = 'Agregue al menos un producto';

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const actualizarOrden = async () => {
    if (!validarOrdenEdicion(ordenEditando)) {
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
      return;
    }

    if (!ordenEditando.solicitadoPor) {
      Swal.fire('Error', 'Debes ingresar quién solicita la orden.', 'error');
      return;
    }

    if (!ordenEditando.proveedor) {
      Swal.fire('Error', 'Debes seleccionar un proveedor.', 'error');
      return;
    }

  const { subtotal, impuestos, total } = calcularTotalesProductos(ordenEditando.productos);

    const ordenActualizada = {
      proveedor: ordenEditando.proveedor,
      productos: ordenEditando.productos,
      subtotal: subtotal,
      impuestos: impuestos,
      total: total,
      condicionesPago: ordenEditando.condicionesPago,
      estado: ordenEditando.estado,
      solicitadoPor: ordenEditando.solicitadoPor
    };

    try {
      setCargando(true);
      const res = await api.put(`/api/ordenes-compra/${ordenEditando._id}`, ordenActualizada);
      const data = res.data || res;
      if (data.success) {
        Swal.fire('¡Éxito!', 'Orden de compra actualizada correctamente', 'success');
        cerrarModalEditar();
        fetchOrdenes();
      } else {
        Swal.fire('Error', data.message || 'No se pudo actualizar la orden', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
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
      proveedorId: ''
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
      proveedorId: ''
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

  // Función para hacer el modal movible
  const hacerModalMovible = () => {
    const modal = document.getElementById('modalMovible');
    if (!modal) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const dragMouseDown = (e) => {
      e = e || window.event;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };

    const elementDrag = (e) => {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      modal.style.top = (modal.offsetTop - pos2) + "px";
      modal.style.left = (modal.offsetLeft - pos1) + "px";
    };

    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
    };

    const header = modal.querySelector('.modal-header-realista');
    if (header) {
      header.onmousedown = dragMouseDown;
    }
  };

  useEffect(() => {
    if (modalDetallesVisible) {
      setTimeout(hacerModalMovible, 100);
    }
  }, [modalDetallesVisible]);

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
        <div className="contenido-modulo">
          {/* Encabezado profesional */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '300px',
              height: '300px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              zIndex: 1
            }}></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <i className="fa-solid fa-file-invoice-dollar" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                  </div>
                  <div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '700' }}>
                      Órdenes de Compra
                    </h2>
                    <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                      Gestiona y supervisa las órdenes de compra a proveedores
                    </p>
                  </div>
                </div>
                <div>
                  <button 
                    onClick={abrirModalAgregar}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                    }}
                  >
                    <i className="fa-solid fa-plus"></i>
                    Agregar Orden de Compra
                  </button>
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
            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-file-invoice-dollar" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {ordenes.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Total Órdenes
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
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
                    {ordenesPendientes.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Órdenes Pendientes
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
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
                    {ordenes.filter(o => o.estado === 'Completada').length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Órdenes Completadas
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
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
                    ${ordenes.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Valor Total Órdenes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de órdenes mejorada */}
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
              alignItems: 'center'
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
                  <i className="fa-solid fa-table" style={{ color: 'white', fontSize: '16px' }}></i>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#1f2937', fontSize: '1.3rem', fontWeight: '600' }}>
                    Lista de Órdenes de Compra
                  </h4>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    Mostrando {ordenesPendientes.length} órdenes pendientes
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
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
                      <i className="fa-solid fa-hashtag icon-gap" style={{ color: '#6366f1' }}></i>
                      #
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-file-invoice icon-gap" style={{ color: '#6366f1' }}></i>
                      NÚMERO ORDEN
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-truck icon-gap" style={{ color: '#6366f1' }}></i>
                      PROVEEDOR
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-dollar-sign icon-gap" style={{ color: '#6366f1' }}></i>
                      TOTAL
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-calendar icon-gap" style={{ color: '#6366f1' }}></i>
                      FECHA
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-user icon-gap" style={{ color: '#6366f1' }}></i>
                      SOLICITADO POR
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-flag icon-gap" style={{ color: '#6366f1' }}></i>
                      ESTADO
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-paper-plane icon-gap" style={{ color: '#6366f1' }}></i>
                      ENVIADO
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-cogs icon-gap" style={{ color: '#6366f1' }}></i>
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrdenes.map((orden, index) => (
                    <tr key={orden._id} 
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
                      <td style={{ padding: '16px 12px', fontWeight: '600', color: '#6366f1' }}>
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <button
                          onClick={() => verDetallesOrden(orden)}
                          className="orden-numero-link"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#6366f1',
                            textDecoration: 'none',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            transition: 'all 0.2s ease',
                            fontWeight: '600',
                            display: 'inline-block',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(99, 102, 241, 0.1)';
                            e.target.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'none';
                            e.target.style.textDecoration = 'none';
                          }}
                        >
                          {orden.numeroOrden}
                        </button>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{
                          background: '#fef3c7',
                          color: '#d97706',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-block'
                        }}>
                          {orden.proveedor || 'No especificado'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px', fontWeight: '600', color: '#1f2937' }}>
                        ${orden.total?.toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                        {new Date(orden.fechaOrden).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                        {orden.solicitadoPor || 'No especificado'}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        {orden.estado === 'Pendiente' ? (
                          <button
                            onClick={() => abrirModalConfirmacion(orden)}
                            style={{
                              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                              color: '#d97706',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 8px rgba(217, 119, 6, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 4px rgba(217, 119, 6, 0.2)';
                            }}
                          >
                            Pendiente
                          </button>
                        ) : (
                          <span style={{
                            background: orden.estado === 'Completada' ? '#dcfce7' : '#fee2e2',
                            color: orden.estado === 'Completada' ? '#16a34a' : '#dc2626',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'inline-block'
                          }}>
                            {orden.estado}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleEnviado(orden._id, orden.enviado)}
                          style={{
                            background: orden.enviado ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : 'linear-gradient(135deg, #fee2e2, #fecaca)',
                            color: orden.enviado ? '#16a34a' : '#dc2626',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: orden.enviado ? '0 2px 4px rgba(22, 163, 74, 0.2)' : '0 2px 4px rgba(220, 38, 38, 0.2)',
                            minWidth: '50px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = orden.enviado ? '0 4px 8px rgba(22, 163, 74, 0.3)' : '0 4px 8px rgba(220, 38, 38, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = orden.enviado ? '0 2px 4px rgba(22, 163, 74, 0.2)' : '0 2px 4px rgba(220, 38, 38, 0.2)';
                          }}
                        >
                          {orden.enviado ? 'Sí' : 'No'}
                        </button>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => abrirModalEditar(orden)}
                            title="Editar orden"
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
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          {!orden.enviado && (
                            <button 
                              onClick={() => eliminarOrden(orden._id)}
                              title="Eliminar orden"
                              style={{
                                background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                                color: '#dc2626',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 10px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.2)';
                              }}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {ordenesPendientes.length === 0 && (
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
                            <i className="fa-solid fa-file-invoice-dollar" style={{ 
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
                              No hay órdenes pendientes
                            </h5>
                            <p style={{ 
                              color: '#9ca3af', 
                              margin: 0, 
                              fontSize: '14px',
                              lineHeight: '1.5'
                            }}>
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

          {/* Modal para agregar nueva orden */}
          {modalAgregarVisible && (
            <div className="modal-overlay">
              <div className="modal-realista modal-lg" style={{ maxWidth: '900px' }}>
                <div className="modal-header-realista">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h5>
                      <i className="fa-solid fa-file-invoice-dollar icon-gap"></i>
                      Nueva Orden de Compra
                    </h5>
                    <button className="modal-close-realista" onClick={cerrarModalAgregar}>&times;</button>
                  </div>
                </div>

                <div className="modal-body" style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
                  {/* Información Básica */}
                  <div className="modal-section">
                    <h6>
                      <i className="fa-solid fa-info-circle icon-gap"></i>
                      Información de la Orden
                    </h6>
                    <div className="form-grid">
                      <div className="form-group-profesional">
                        <label htmlFor="input-orden-1" className="form-label-profesional">Proveedor *</label>
                        <select id="input-orden-1"
                          value={nuevaOrden.proveedorId || ''}
                          onChange={handleProveedorChange}
                          required
                          className="form-input-profesional"
                        >
                          <option value="">Seleccione un proveedor</option>
                          {proveedores.map(proveedor => (
                            <option key={proveedor._id} value={proveedor._id}>
                              {proveedor.nombre}
                            </option>
                          ))}
                        </select>
                        {errores.proveedor && <span style={{ color: '#e74c3c', fontSize: '0.8rem' }}>{errores.proveedor}</span>}
                      </div>

                      <div className="form-group-profesional">
                        <label htmlFor="input-orden-2" className="form-label-profesional">Solicitado Por *</label>
                        <input id="input-orden-2"
                          type="text"
                          value={nuevaOrden.solicitadoPor}
                          disabled
                          className="form-input-profesional"
                          placeholder="Nombre del solicitante"
                          style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                        />
                        {errores.solicitadoPor && <span style={{ color: '#e74c3c', fontSize: '0.8rem' }}>{errores.solicitadoPor}</span>}
                      </div>

                      <div className="form-group-profesional">
                        <label htmlFor="input-orden-3" className="form-label-profesional">Condiciones de Pago</label>
                        <textarea id="input-orden-3"
                          value={nuevaOrden.condicionesPago}
                          onChange={e => setNuevaOrden({ ...nuevaOrden, condicionesPago: e.target.value })}
                          className="form-input-profesional"
                          rows="3"
                          placeholder="Describe las condiciones de pago"
                          style={{ resize: 'vertical', fontFamily: 'inherit' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Selección de Productos */}
                  <div className="modal-section">
                    <h6>
                      <i className="fa-solid fa-cart-plus icon-gap"></i>
                      Agregar Productos
                    </h6>

                    {nuevaOrden.proveedorId ? (
                      <>
                        <div className="form-group-profesional">
                          <label className="form-label-profesional">
                            Producto *
                            {cargandoProductos && (
                              <small style={{ marginLeft: '10px', color: '#3498db' }}>
                                <i className="fa-solid fa-spinner fa-spin"></i> Cargando productos...
                              </small>
                            )}
                          </label>

                          <select
                            value={productoTemp.productoId || ''}
                            onChange={handleProductoChange}
                            className="form-input-profesional"
                            disabled={cargandoProductos}
                          >
                            <option value="">Seleccione un producto</option>
                            {productosProveedor.length > 0 ? (
                              productosProveedor.map(producto => (
                                <option key={producto._id} value={producto._id}>
                                  {producto.name || producto.nombre} -
                                  ${(producto.price || producto.precio)?.toLocaleString()} -
                                  Stock: {producto.stock || 'N/A'}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>
                                {cargandoProductos ? 'Cargando...' : 'Este proveedor no tiene productos asociados'}
                              </option>
                            )}
                          </select>

                          {productosProveedor.length === 0 && !cargandoProductos && (
                            <div style={{
                              background: '#fff3cd',
                              border: '1px solid #ffeaa7',
                              borderRadius: '4px',
                              padding: '0.75rem',
                              marginTop: '0.5rem',
                              color: '#856404',
                              fontSize: '0.9rem'
                            }}>
                              <i className="fa-solid fa-info-circle icon-gap"></i>
                              Este proveedor no tiene productos asociados. Por favor, regístrelos en el módulo de Gestión de Productos.
                            </div>
                          )}
                        </div>

                        <div className="form-grid">
                          <div className="form-group-profesional">
                            <label htmlFor="input-orden-4" className="form-label-profesional">Descripción</label>
                            <input id="input-orden-4"
                              value={productoTemp.descripcion}
                              onChange={e => setProductoTemp({ ...productoTemp, descripcion: e.target.value })}
                              className="form-input-profesional"
                              placeholder="Descripción del producto"
                              disabled
                            />
                          </div>

                          <div className="form-group-profesional">
                            <label htmlFor="input-orden-5" className="form-label-profesional">Cantidad *</label>
                            <input id="input-orden-5"
                              type="number"
                              min="1"
                              value={productoTemp.cantidad}
                              onChange={e => setProductoTemp({ ...productoTemp, cantidad: Number(e.target.value) })}
                              required
                              className="form-input-profesional"
                            />
                          </div>

                          <div className="form-group-profesional">
                            <label htmlFor="input-orden-valor-temp" className="form-label-profesional">Valor Unitario *</label>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                              <input
                                id="input-orden-valor-temp"
                                type="number"
                                min="0"
                                step="0.01"
                                value={productoTemp.valorUnitario}
                                onChange={e => setProductoTemp({ ...productoTemp, valorUnitario: Number(e.target.value) })}
                                required
                                className="form-input-profesional"
                                style={{ paddingLeft: '30px' }}
                                disabled
                              />
                            </div>
                          </div>

                          <div className="form-group-profesional">
                            <label htmlFor="input-orden-desc-temp" className="form-label-profesional">Descuento</label>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                              <input
                                id="input-orden-desc-temp"
                                type="number"
                                min="0"
                                step="0.01"
                                value={productoTemp.descuento}
                                onChange={e => setProductoTemp({ ...productoTemp, descuento: Number(e.target.value) })}
                                className="form-input-profesional"
                                style={{ paddingLeft: '30px' }}
                              />
                            </div>
                          </div>

                          <div className="form-group-profesional" style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                              className="btn-profesional btn-primary-profesional"
                              onClick={agregarProductoDesdeLista}
                              disabled={!productoTemp.productoId || productoTemp.cantidad < 1}
                            >
                              <i className="fa-solid fa-plus"></i>
                              Agregar Producto
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{
                        background: '#f8f9fa',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        padding: '1rem',
                        textAlign: 'center',
                        color: '#6c757d'
                      }}>
                        <i className="fa-solid fa-hand-pointer" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
                        <p style={{ margin: '0' }}>Seleccione un proveedor para ver sus productos disponibles</p>
                      </div>
                    )}
                  </div>

                  {/* Lista de Productos Agregados */}
                  {nuevaOrden.productos.length > 0 && (
                    <div className="modal-section">
                      <h6>
                        <i className="fa-solid fa-list-check icon-gap"></i>
                        Productos en la Orden ({nuevaOrden.productos.length})
                      </h6>
                      <div className="table-responsive">
                        <table className="table-profesional">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th>Descripción</th>
                              <th>Cantidad</th>
                              <th>Valor Unit.</th>
                              <th>Descuento</th>
                              <th>Total</th>
                              <th>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {nuevaOrden.productos.map((p, i) => (
                              <tr key={i}>
                                <td>
                                  <strong>{p.producto}</strong>
                                </td>
                                <td>{p.descripcion || 'N/A'}</td>
                                <td>
                                  <span className="badge-profesional" style={{ background: '#e3f2fd', color: '#1976d2' }}>
                                    {p.cantidad}
                                  </span>
                                </td>
                                <td>${p.valorUnitario.toLocaleString()}</td>
                                <td>
                                  {p.descuento > 0 ? (
                                    <span style={{ color: '#e74c3c', fontWeight: '600' }}>
                                      -${p.descuento.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#95a5a6' }}>$0</span>
                                  )}
                                </td>
                                <td>
                                  <strong>${p.valorTotal.toLocaleString()}</strong>
                                </td>
                                <td>
                                  <button
                                    className="btn-profesional btn-danger-profesional"
                                    onClick={() => eliminarProducto(i)}
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                  >
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Resumen de Totales */}
                  {nuevaOrden.productos.length > 0 && (
                    <div className="totales-destacados">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Subtotal</div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                            ${calcularTotalesProductos(nuevaOrden.productos).subtotal.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Total</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f39c12' }}>
                            ${calcularTotalesProductos(nuevaOrden.productos).total.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer" style={{ padding: '1.5rem 2rem', borderTop: '1px solid #e0e0e0', background: '#f8f9fa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                      <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                        {nuevaOrden.productos.length} producto(s) agregado(s)
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        className="btn-profesional"
                        onClick={cerrarModalAgregar}
                        style={{ background: '#95a5a6', color: 'white' }}
                      >
                        <i className="fa-solid fa-times"></i>
                        Cancelar
                      </button>
                      <button
                        className="btn-profesional btn-success-profesional"
                        onClick={guardarOrden}
                        disabled={nuevaOrden.productos.length === 0}
                      >
                        <i className="fa-solid fa-check"></i>
                        Guardar Orden
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal para editar orden */}
          {modalEditarVisible && (
            <div className="modal-overlay">
              <div className="modal-realista modal-lg" style={{ maxWidth: '900px' }}>
                <div className="modal-header-realista">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h5>
                      <i className="fa-solid fa-edit icon-gap"></i>
                      Editar Orden de Compra: <span style={{ color: '#f39c12' }}>{ordenEditando.numeroOrden}</span>
                    </h5>
                    <button className="modal-close-realista" onClick={cerrarModalEditar}>&times;</button>
                  </div>
                </div>

                <div className="modal-body" style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
                  {/* Información Básica */}
                  <div className="modal-section">
                    <h6>
                      <i className="fa-solid fa-info-circle icon-gap"></i>
                      Información de la Orden
                    </h6>
                    <div className="form-grid">
                      <div className="form-group-profesional">
                        <label htmlFor="input-orden-6" className="form-label-profesional">Proveedor *</label>
                        <select id="input-orden-6"
                          value={ordenEditando.proveedorId}
                          onChange={handleProveedorChangeEditar}
                          required
                          className="form-input-profesional"
                        >
                          <option value="">Seleccione un proveedor</option>
                          {proveedores.map(proveedor => (
                            <option key={proveedor._id} value={proveedor._id}>
                              {proveedor.nombre}
                            </option>
                          ))}
                        </select>
                        {errores.proveedor && <span style={{ color: '#e74c3c', fontSize: '0.8rem' }}>{errores.proveedor}</span>}
                      </div>

                      <div className="form-group-profesional">
                        <label htmlFor="input-orden-7" className="form-label-profesional">Solicitado Por *</label>
                        <input id="input-orden-7"
                          type="text"
                          value={ordenEditando.solicitadoPor}
                          disabled
                          className="form-input-profesional"
                          placeholder="Nombre del solicitante"
                          style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                        />
                        {errores.solicitadoPor && <span style={{ color: '#e74c3c', fontSize: '0.8rem' }}>{errores.solicitadoPor}</span>}
                      </div>

                      <div className="form-group-profesional">
                        <label htmlFor="input-orden-8" className="form-label-profesional">Condiciones de Pago</label>
                        <textarea id="input-orden-8"
                          value={ordenEditando.condicionesPago}
                          onChange={e => setOrdenEditando({ ...ordenEditando, condicionesPago: e.target.value })}
                          className="form-input-profesional"
                          rows="3"
                          placeholder="Describe las condiciones de pago"
                          style={{ resize: 'vertical', fontFamily: 'inherit' }}
                        />
                      </div>

                      <div className="form-group-profesional">
                        <div className="form-label-profesional">Estado</div>
                        <div>
                          <span className={`badge-profesional ${ordenEditando.estado === 'Pendiente' ? 'badge-pendiente' : 'badge-completada'}`}>
                            {ordenEditando.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selección de Productos para Edición */}
                  <div className="modal-section">
                    <h6>
                      <i className="fa-solid fa-cart-plus icon-gap"></i>
                      Agregar Nuevos Productos
                    </h6>

                    {ordenEditando.proveedorId ? (
                      <>
                        <div className="form-group-profesional">
                          <label className="form-label-profesional">
                            Producto *
                            {cargandoProductos && (
                              <small style={{ marginLeft: '10px', color: '#3498db' }}>
                                <i className="fa-solid fa-spinner fa-spin"></i> Cargando productos...
                              </small>
                            )}
                          </label>

                          <select
                            value={productoTemp.productoId || ''}
                            onChange={handleProductoChangeEditar}
                            className="form-input-profesional"
                            disabled={cargandoProductos}
                          >
                            <option value="">Seleccione un producto</option>
                            {productosProveedor.length > 0 ? (
                              productosProveedor.map(producto => (
                                <option key={producto._id} value={producto._id}>
                                  {producto.name || producto.nombre} -
                                  ${(producto.price || producto.precio)?.toLocaleString()} -
                                  Stock: {producto.stock || 'N/A'}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>
                                {cargandoProductos ? 'Cargando...' : 'Este proveedor no tiene productos asociados'}
                              </option>
                            )}
                          </select>
                        </div>

                        <div className="form-grid">
                          <div className="form-group-profesional">
                            <label htmlFor="input-orden-9" className="form-label-profesional">Descripción</label>
                            <input id="input-orden-9"
                              value={productoTemp.descripcion}
                              onChange={e => setProductoTemp({ ...productoTemp, descripcion: e.target.value })}
                              className="form-input-profesional"
                              placeholder="Descripción del producto"
                              disabled
                            />
                          </div>

                          <div className="form-group-profesional">
                            <label htmlFor="input-orden-10" className="form-label-profesional">Cantidad *</label>
                            <input id="input-orden-10"
                              type="number"
                              min="1"
                              value={productoTemp.cantidad}
                              onChange={e => setProductoTemp({ ...productoTemp, cantidad: Number(e.target.value) })}
                              required
                              className="form-input-profesional"
                            />
                          </div>

                          <div className="form-group-profesional">
                            <label htmlFor={`input-orden-valor-edit-temp`} className="form-label-profesional">Valor Unitario *</label>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                              <input
                                id={`input-orden-valor-edit-temp`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={productoTemp.valorUnitario}
                                onChange={e => setProductoTemp({ ...productoTemp, valorUnitario: Number(e.target.value) })}
                                required
                                className="form-input-profesional"
                                style={{ paddingLeft: '30px' }}
                                disabled
                              />
                            </div>
                          </div>

                          <div className="form-group-profesional">
                            <label htmlFor={`input-orden-desc-edit-temp`} className="form-label-profesional">Descuento</label>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                              <input
                                id={`input-orden-desc-edit-temp`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={productoTemp.descuento}
                                onChange={e => setProductoTemp({ ...productoTemp, descuento: Number(e.target.value) })}
                                className="form-input-profesional"
                                style={{ paddingLeft: '30px' }}
                              />
                            </div>
                          </div>

                          <div className="form-group-profesional" style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                              className="btn-profesional btn-primary-profesional"
                              onClick={agregarProductoEdicion}
                              disabled={!productoTemp.productoId || productoTemp.cantidad < 1}
                            >
                              <i className="fa-solid fa-plus"></i>
                              Agregar Producto
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{
                        background: '#f8f9fa',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        padding: '1rem',
                        textAlign: 'center',
                        color: '#6c757d'
                      }}>
                        <i className="fa-solid fa-hand-pointer" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
                        <p style={{ margin: '0' }}>Seleccione un proveedor para ver sus productos disponibles</p>
                      </div>
                    )}
                  </div>

                  {/* Lista de Productos Existente */}
                  <div className="modal-section">
                    <h6>
                      <i className="fa-solid fa-list-check icon-gap"></i>
                      Productos en la Orden ({ordenEditando.productos.length})
                      {errores.productos && <span style={{ color: '#e74c3c', fontSize: '0.8rem', marginLeft: '1rem' }}>{errores.productos}</span>}
                    </h6>

                    {ordenEditando.productos.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table-profesional">
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
                              <tr key={i} className={productoEditando.index === i ? 'highlighted-row' : ''}>
                                <td>
                                  <strong>{p.producto}</strong>
                                  {productoEditando.index === i && (
                                    <span style={{ color: '#f39c12', marginLeft: '5px', fontSize: '0.8rem' }}>
                                      (Editando)
                                    </span>
                                  )}
                                </td>
                                <td>{p.descripcion || 'N/A'}</td>
                                <td>
                                  <span className="badge-profesional" style={{ background: '#e3f2fd', color: '#1976d2' }}>
                                    {p.cantidad}
                                  </span>
                                </td>
                                <td>${p.valorUnitario?.toLocaleString()}</td>
                                <td>
                                  {p.descuento > 0 ? (
                                    <span style={{ color: '#e74c3c', fontWeight: '600' }}>
                                      -${p.descuento?.toLocaleString() || '0'}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#95a5a6' }}>$0</span>
                                  )}
                                </td>
                                <td>
                                  <strong>${p.valorTotal?.toLocaleString()}</strong>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                                    <button
                                      className="btn-profesional btn-warning-profesional"
                                      onClick={() => editarProducto(i)}
                                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                      disabled={productoEditando.index !== null && productoEditando.index !== i}
                                    >
                                      <i className="fa-solid fa-pen"></i>
                                    </button>
                                    <button
                                      className="btn-profesional btn-danger-profesional"
                                      onClick={() => eliminarProductoEdicion(i)}
                                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                      disabled={productoEditando.index !== null}
                                    >
                                      <i className="fa-solid fa-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
                        <i className="fa-solid fa-cart-shopping" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
                        <p>No hay productos en esta orden. Agrega al menos un producto.</p>
                      </div>
                    )}
                  </div>

                  {/* Resumen de Totales */}
                  {ordenEditando.productos.length > 0 && (
                    <div className="totales-destacados">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Subtotal</div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                            ${calcularTotalesProductos(ordenEditando.productos).subtotal.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Total</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f39c12' }}>
                            ${calcularTotalesProductos(ordenEditando.productos).total.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer" style={{ padding: '1.5rem 2rem', borderTop: '1px solid #e0e0e0', background: '#f8f9fa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                      <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                        {ordenEditando.productos.length} producto(s) en la orden
                      </span>
                      {ordenEditando.estado === 'Completada' && (
                        <span className="badge-profesional badge-completada" style={{ marginLeft: '1rem' }}>
                          <i className="fa-solid fa-check"></i> Completada
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        className="btn-profesional"
                        onClick={cerrarModalEditar}
                        style={{ background: '#95a5a6', color: 'white' }}
                      >
                        <i className="fa-solid fa-times"></i>
                        Cancelar
                      </button>
                      <button
                        className="btn-profesional btn-success-profesional"
                        onClick={actualizarOrden}
                        disabled={ordenEditando.productos.length === 0 || cargando}
                      >
                        {cargando ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-check"></i>
                            Actualizar Orden
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Detalles */}
          <DetallesOrdenModal
            visible={modalDetallesVisible}
            orden={ordenSeleccionada}
            onClose={cerrarModalDetalles}
            onPrint={imprimirOrden}
            onSendEmail={enviarOrdenPorCorreo}
          />

          {/* Modal de Confirmación */}
          {modalConfirmacionVisible && ordenAConfirmar && (
            <div className="modal-overlay">
              <div className="modal-realista modal-confirmacion"
                style={{
                  maxWidth: '500px',
                  width: '90%',
                  background: 'linear-gradient(135deg, #ffffff, #f8f9fa)'
                }}>

                <div className="modal-header-realista" style={{
                  background: 'linear-gradient(135deg, #2c3e50, #34495e)',
                  color: 'white',
                  padding: '1.5rem',
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <h5 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                      <i className="fa-solid fa-clipboard-check icon-gap"></i>
                      Confirmar Orden de Compra
                    </h5>
                    <button
                      className="modal-close-realista"
                      onClick={cancelarConfirmacion}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      &times;
                    </button>
                  </div>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem' }}>
                  <div style={{
                    background: 'white',
                    border: '2px dashed #e0e0e0',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <h6 style={{
                      color: '#2c3e50',
                      borderBottom: '2px solid #3498db',
                      paddingBottom: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      <i className="fa-solid fa-file-lines icon-gap"></i>
                      Vista Previa de la Orden
                    </h6>

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
                        <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>
                          ${ordenAConfirmar.total?.toLocaleString()}
                        </span>
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
                  </div>

                  <div style={{
                    background: '#fffbf0',
                    border: '1px solid #ffeaa7',
                    borderRadius: '6px',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <i className="fa-solid fa-exclamation-triangle" style={{
                      color: '#f39c12',
                      fontSize: '1.5rem',
                      marginBottom: '0.5rem'
                    }}></i>
                    <p style={{ margin: '0', color: '#856404', fontWeight: '500' }}>
                      ¿Estás seguro de que deseas marcar esta orden como <strong>COMPLETADA</strong>?
                    </p>
                    <small style={{ color: '#666', display: 'block', marginTop: '0.5rem' }}>
                      Esta acción no se puede deshacer
                    </small>
                  </div>
                </div>

                <div className="modal-footer" style={{
                  padding: '1.5rem',
                  borderTop: '1px solid #e0e0e0',
                  background: '#f8f9fa',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  borderBottomLeftRadius: '10px',
                  borderBottomRightRadius: '10px'
                }}>
                  <button
                    onClick={cancelarConfirmacion}
                    className="btn-profesional"
                    style={{
                      background: '#95a5a6',
                      color: 'white',
                      padding: '0.5rem 1.5rem',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fa-solid fa-times icon-gap"></i>
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarCompletada}
                    className="btn-profesional btn-primary-profesional"
                    style={{
                      background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                      color: 'white',
                      padding: '0.5rem 1.5rem',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(39, 174, 96, 0.3)'
                    }}
                  >
                    <i className="fa-solid fa-check icon-gap"></i>
                    Marcar como Completada
                  </button>
                </div>
              </div>
            </div>
          )}
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
