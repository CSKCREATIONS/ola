// frontend/pages/HistorialCompras.jsx
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavCompras from '../components/NavCompras';

import api from '../api/axiosConfig';
import { randomString } from '../utils/secureRandom';
import { calcularTotales as calcularTotalesShared, sumarProp } from '../utils/calculations';
import { isValidEmail } from '../utils/emailHelpers';
import OrderDetailsHeader from '../components/OrderDetailsHeader';

// CSS inyectado para diseño avanzado
const advancedStyles = `
  .historial-compras-advanced-table {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #e5e7eb;
  }
  
  .historial-compras-header-section {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    padding: 20px 25px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .historial-compras-table-container {
    overflow: auto;
  }
  
  .historial-compras-advanced-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  
  .historial-compras-advanced-table thead tr {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-bottom: 2px solid #e5e7eb;
  }
  
  .historial-compras-advanced-table thead th {
    padding: 16px 12px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 13px;
    letter-spacing: 0.5px;
  }
  
  .historial-compras-advanced-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }
  
  .historial-compras-advanced-table tbody tr:hover {
    background-color: #f8fafc;
  }
  
  .historial-compras-advanced-table tbody td {
    padding: 16px 12px;
    color: #4b5563;
    font-weight: 500;
  }
  
  .historial-compras-pagination-container {
    padding: 20px 25px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: center;
    gap: 8px;
  }
  
  .historial-compras-pagination-btn {
    padding: 8px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    color: #4b5563;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .historial-compras-pagination-btn.active {
    border-color: #6366f1;
    background: #6366f1;
    color: white;
  }
  
  .historial-compras-pagination-btn:hover:not(.active) {
    border-color: #6366f1;
    color: #6366f1;
  }
  
  .historial-compras-action-btn {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    color: #1e40af;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(30, 64, 175, 0.2);
  }
  
  .historial-compras-action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(30, 64, 175, 0.3);
  }
`;

// Inyectar estilos
if (!document.getElementById('historial-compras-advanced-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'historial-compras-advanced-styles';
  styleSheet.textContent = advancedStyles;
  document.head.appendChild(styleSheet);
}

export default function HistorialCompras() {
  const [compras, setCompras] = useState([]);
  const [modalDetallesVisible, setModalDetallesVisible] = useState(false);
  const [modalNuevaCompraVisible, setModalNuevaCompraVisible] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [nuevaCompra, setNuevaCompra] = useState({
    proveedor: '',
    productos: [],
    observaciones: '',
    solicitadoPor: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = compras.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(compras.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const fetchCompras = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/compras', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const comprasOrdenadas = (data.data || data).sort((a, b) => 
          new Date(b.createdAt || b.fecha) - new Date(a.createdAt || a.fecha)
        );
        setCompras(comprasOrdenadas);
      } else {
        Swal.fire('Error', data.message || 'No se pudieron cargar las compras', 'error');
      }
    } catch (error) {
      console.error('Error al cargar compras:', error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  };

  const fetchProductos = async () => {
    try {
      const res = await api.get('/api/products');
      const data = res.data || res;
      setProductos(data.products || data.data || data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const fetchProveedores = async () => {
    try {
      const res = await api.get('/api/proveedores');
      const data = res.data || res;
      setProveedores(data.proveedores || data.data || data || []);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      setProveedores([]);
    }
  };

  const abrirModalNuevaCompra = () => {
    const storedUser = localStorage.getItem('user');
    let nombreCompleto = '';
    if (storedUser) {
      const usuario = JSON.parse(storedUser);
      nombreCompleto = `${usuario.firstName || ''} ${usuario.surname || ''}`.trim();
    }
    
    setNuevaCompra({
      proveedor: '',
      productos: [],
      observaciones: '',
      solicitadoPor: nombreCompleto
    });
    setModalNuevaCompraVisible(true);
  };

  const agregarProductoNuevaCompra = () => {
    setNuevaCompra({
      ...nuevaCompra,
      productos: [...nuevaCompra.productos, {
        producto: '',
        cantidad: 1,
        precioUnitario: 0,
        _tmpId: `tmp-${Date.now()}-${randomString(6)}`
      }]
    });
  };

  const eliminarProductoNuevaCompra = (index) => {
    const productosActualizados = nuevaCompra.productos.filter((_, i) => i !== index);
    setNuevaCompra({ ...nuevaCompra, productos: productosActualizados });
  };

  const actualizarProductoNuevaCompra = (index, campo, valor) => {
    const productosActualizados = [...nuevaCompra.productos];

    // Si se está seleccionando un producto, auto-llenar precio y descripción
    if (campo === 'producto') {
      productosActualizados[index][campo] = valor;

      if (valor) {
        // valor presente: buscar el producto en la lista global de productos e insertar precio y descripción
        const encontrado = productos.find(p => {
          const id = p._id || p.id || p.productoId;
          return String(id) === String(valor);
        });

        if (encontrado) {
          const precio = encontrado.precioUnitario || encontrado.precio || encontrado.price || encontrado.unitPrice || encontrado.priceUnitario || 0;
          const descripcion = encontrado.descripcion || encontrado.description || encontrado.desc || '';
          productosActualizados[index].precioUnitario = Number(precio) || 0;
          productosActualizados[index].descripcion = descripcion;
        } else {
          // no encontrado: limpiar campos relacionados
          productosActualizados[index].precioUnitario = 0;
          productosActualizados[index].descripcion = '';
        }
      } else {
        // valor vacío: limpiar campos relacionados
        productosActualizados[index].precioUnitario = 0;
        productosActualizados[index].descripcion = '';
      }

      setNuevaCompra({ ...nuevaCompra, productos: productosActualizados });
      return;
    }

    productosActualizados[index][campo] = valor;
    setNuevaCompra({ ...nuevaCompra, productos: productosActualizados });
  };

  const guardarNuevaCompra = async () => {
    if (!nuevaCompra.proveedor) {
      Swal.fire('Error', 'Debe seleccionar un proveedor', 'error');
      return;
    }
    if (nuevaCompra.productos.length === 0) {
      Swal.fire('Error', 'Debe agregar al menos un producto', 'error');
      return;
    }

    try {
      const { subtotal = 0 } = calcularTotalesShared(nuevaCompra.productos || []);
      const impuestos = Number((subtotal * 0.19).toFixed(2));
      const total = Number((subtotal + impuestos).toFixed(2));

      // Generar número de orden si no se provee uno
      const generarNumeroOrden = () => `COM-${Date.now()}-${randomString(6).toUpperCase()}`;

      // Mapear productos al formato esperado por el backend
      const productosPayload = nuevaCompra.productos.map(p => {
        const cantidad = Number(p.cantidad) || 0;
        const valorUnitario = Number(p.precioUnitario || p.valorUnitario || 0) || 0;
        return {
          producto: p.producto || p.productoId || '',
          descripcion: p.descripcion || p.description || '',
          cantidad,
          valorUnitario,
          descuento: 0,
          valorTotal: cantidad * valorUnitario
        };
      });

      // Enviar el nombre del proveedor al backend en lugar del id
      const proveedorSeleccionado = proveedores.find(p => String(p._id || p.id) === String(nuevaCompra.proveedor));
      const proveedorNombre = proveedorSeleccionado ? (proveedorSeleccionado.nombre || proveedorSeleccionado.name) : nuevaCompra.proveedor;

      const compraData = {
        numeroOrden: generarNumeroOrden(),
        proveedor: proveedorNombre,
        productos: productosPayload,
        observaciones: nuevaCompra.observaciones,
        solicitadoPor: nuevaCompra.solicitadoPor,
        subtotal,
        impuestos,
        total,
        estado: 'Confirmada'
      };

      const res = await api.post('/api/compras', compraData);
      const data = res.data || res;
      if (data.success) {
        Swal.fire('Éxito', 'Compra registrada correctamente', 'success');
        setModalNuevaCompraVisible(false);
        fetchCompras();
      } else {
        console.error('Error guardarNuevaCompra, respuesta:', data);
        Swal.fire('Error', data.message || 'No se pudo registrar la compra', 'error');
      }
    } catch (error) {
      console.error('Error al guardar compra:', error);
      Swal.fire('Error', error.response?.data?.message || 'No se pudo conectar con el servidor', 'error');
    }
  };

  useEffect(() => {
    fetchCompras();
    fetchProveedores();
    fetchProductos();
  }, []);

  // Productos filtrados por el proveedor seleccionado en la nueva compra
  const productosFiltrados = nuevaCompra.proveedor
      ? productos.filter(p => {
        // Prefer optional chaining for clarity and safety
        let prov = p.proveedor?._id ?? p.proveedorId ?? p.proveedor;
        if (typeof prov === 'object') prov = prov._id ?? prov.id;
        return String(prov) === String(nuevaCompra.proveedor);
      })
    : productos;

  const verDetallesCompra = (compra) => {
    setCompraSeleccionada(compra);
    setModalDetallesVisible(true);
  };

  const imprimirCompra = () => {
    if (!compraSeleccionada) {
      Swal.fire('Error', 'No hay compra seleccionada', 'error');
      return;
    }

    const totalCalculado = (calcularTotalesShared(compraSeleccionada.productos || []).total) || 0;

    const totalFinal = Number(compraSeleccionada.total) || totalCalculado;
    const subtotalFinal = Number(compraSeleccionada.subtotal) || totalCalculado;
    const impuestosFinal = Number(compraSeleccionada.impuestos) || 0;

    const fechaCompra = compraSeleccionada.fecha || compraSeleccionada.fechaCompra;
    const fechaFormateada = fechaCompra ? new Date(fechaCompra).toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : 'N/A';

    const productosHTML = compraSeleccionada.productos?.map((p, index) => {
      const subtotal = p.cantidad * p.precioUnitario;
      return `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${p.producto?.name || 'N/A'}</td>
          <td style="text-align: center;">${p.cantidad}</td>
          <td style="text-align: right;">$${Number(p.precioUnitario || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right; font-weight: 600;">$${Number(subtotal || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay productos</td></tr>';

    const win = window.open('', '', 'width=900,height=700');
    const html = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Compra - ${compraSeleccionada.numeroOrden || 'N/A'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              padding: 30px;
              background: #ffffff;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
            }
            .header { 
              background: linear-gradient(135deg, #27ae60, #229954); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0;
              margin-bottom: 0;
            }
            .header h1 { 
              font-size: 28px; 
              margin-bottom: 10px; 
              font-weight: 700; 
            }
            .header p { 
              font-size: 16px; 
              opacity: 0.9; 
            }
            .content {
              border: 2px solid #27ae60;
              border-top: none;
              border-radius: 0 0 10px 10px;
              padding: 30px;
            }
            .info-section {
              background: #f8f9fa;
              padding: 20px;
              margin-bottom: 25px;
              border-left: 4px solid #27ae60;
              border-radius: 5px;
            }
            .info-section h3 { 
              color: #27ae60; 
              margin-bottom: 15px; 
              font-size: 16px;
              font-weight: 600;
              border-bottom: 2px solid #27ae60;
              padding-bottom: 8px;
            }
            .info-section p { 
              margin-bottom: 8px; 
              color: #555; 
              font-size: 14px;
              line-height: 1.8;
            }
            .info-section strong { 
              color: #333;
              font-weight: 600;
              display: inline-block;
              min-width: 120px;
            }
            .products-section { 
              margin: 30px 0; 
            }
            .products-title { 
              background: #27ae60; 
              color: white; 
              padding: 15px 20px; 
              margin-bottom: 0; 
              font-size: 18px;
              font-weight: 600;
            }
            .products-table { 
              width: 100%; 
              border-collapse: collapse; 
              background: white; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            }
            .products-table thead { 
              background: #27ae60; 
              color: white; 
            }
            .products-table thead th { 
              padding: 12px; 
              text-align: left; 
              font-weight: 600;
              font-size: 14px;
            }
            .products-table tbody tr { 
              border-bottom: 1px solid #eee; 
            }
            .products-table tbody tr:nth-child(even) {
              background: #f8f9fa;
            }
            .products-table tbody td { 
              padding: 12px; 
              font-size: 14px;
            }
            .total-section { 
              background: #f8f9fa; 
              padding: 25px; 
              border-radius: 8px; 
              margin-top: 30px; 
              border: 2px solid #27ae60;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 10px 0; 
              border-bottom: 1px solid #dee2e6; 
              font-size: 15px;
            }
            .total-row.final { 
              border-bottom: none; 
              font-size: 20px; 
              font-weight: bold; 
              color: #27ae60; 
              margin-top: 15px; 
              padding-top: 15px; 
              border-top: 3px solid #27ae60; 
            }
            .observaciones {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 20px;
              border-radius: 5px;
              margin-top: 25px;
            }
            .observaciones strong {
              display: block;
              margin-bottom: 10px;
              color: #856404;
              font-size: 16px;
            }
            .footer { 
              text-align: center; 
              padding: 20px; 
              color: #6c757d; 
              font-size: 12px;
              margin-top: 30px;
              border-top: 2px solid #dee2e6;
            }
            @media print {
              body { padding: 0; }
              .container { max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>COMPRA CONFIRMADA</h1>
              <p>N° ${compraSeleccionada.numeroOrden || 'N/A'}</p>
            </div>

            <div class="content">
              <div class="info-section">
                <h3>📋 Información General</h3>
                <p><strong>Número de Orden:</strong> ${compraSeleccionada.numeroOrden || 'N/A'}</p>
                <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                <p><strong>Estado:</strong> ${compraSeleccionada.estado || 'Confirmada'}</p>
              </div>

              <div class="info-section">
                <h3>🏢 Información del Proveedor</h3>
                <p><strong>Nombre:</strong> ${compraSeleccionada.proveedor?.nombre || 'No especificado'}</p>
                ${compraSeleccionada.proveedor?.email ? `<p><strong>Email:</strong> ${compraSeleccionada.proveedor.email}</p>` : ''}
                ${compraSeleccionada.proveedor?.telefono ? `<p><strong>Teléfono:</strong> ${compraSeleccionada.proveedor.telefono}</p>` : ''}
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
                  <span>$${subtotalFinal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="total-row">
                  <span><strong>Impuestos (IVA):</strong></span>
                  <span>$${impuestosFinal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="total-row final">
                  <span>TOTAL:</span>
                  <span>$${totalFinal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              ${compraSeleccionada.observaciones ? `
                <div class="observaciones">
                  <strong>📝 Observaciones:</strong>
                  ${compraSeleccionada.observaciones}
                </div>
              ` : ''}

              <div class="footer">
                <p><strong>JLA Global Company</strong></p>
                <p>Documento generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>© ${new Date().getFullYear()} JLA Global Company. Todos los derechos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Inject HTML into the opened window without using document.write (deprecated)
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        // create doctype and import the parsed <html> element
        const doctype = win.document.implementation.createDocumentType('html', '', '');
        const importedHtml = win.document.importNode(parsed.documentElement, true);
        // clear any existing children and append doctype + html
        while (win.document.firstChild) {
          // Prefer calling remove() on the child node instead of parent.removeChild(child)
          win.document.firstChild.remove();
        }
        win.document.appendChild(doctype);
        win.document.appendChild(importedHtml);
        win.document.close();
        win.focus();
        win.print();
        win.close();
  };

  const enviarCompraPorCorreo = async () => {
    if (!compraSeleccionada?._id) {
      Swal.fire('Error', 'No hay compra seleccionada', 'error');
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: '📧 Enviar Compra por Correo',
      html: `
        <div style="text-align: left;">
          <label htmlFor="input-historial-1" style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
            Correo del destinatario:
          </label>
          <input id="input-historial-1" 
            type="email" 
            id="emailDestino" 
            class="swal2-input" 
            placeholder="ejemplo@correo.com" 
            style="margin: 0 0 20px 0; width: 100%;"
            value="${compraSeleccionada.proveedor?.email || ''}"
            required
          >
          
          <label htmlFor="input-historial-2" style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
            Asunto:
          </label>
          <input id="input-historial-2" 
            type="text" 
            id="asuntoEmail" 
            class="swal2-input" 
            placeholder="Asunto del correo" 
            style="margin: 0 0 20px 0; width: 100%;"
            value="Compra Confirmada - N° ${compraSeleccionada.numeroOrden || 'N/A'} - JLA Global Company"
          >
          
          <label htmlFor="input-historial-3" style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
            Mensaje:
          </label>
          <textarea id="input-historial-3" 
            id="mensajeEmail" 
            class="swal2-textarea" 
            placeholder="Escribe tu mensaje aquí..."
            style="margin: 0; width: 100%; min-height: 150px; resize: vertical;"
          >Estimado/a ${compraSeleccionada.proveedor?.nombre || 'proveedor'},

Esperamos se encuentre muy bien. Adjunto encontrará la información de la compra confirmada con la siguiente información:

📋 DETALLES DE LA COMPRA:

• Número de Orden: ${compraSeleccionada.numeroOrden || 'N/A'}
• Fecha: ${new Date(compraSeleccionada.fecha || compraSeleccionada.fechaCompra).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
• Total: $${Number(compraSeleccionada.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}

Quedamos atentos a cualquier duda o consulta que pueda surgir.

Cordialmente,
JLA Global Company</textarea>
        </div>
      `,
      width: '600px',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '📧 Enviar Compra',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#27ae60',
      cancelButtonColor: '#6c757d',
      preConfirm: async () => {
        // Make this an async preConfirm so it always returns a Promise (consistent type).
        const email = document.getElementById('emailDestino').value;
        const asunto = document.getElementById('asuntoEmail').value;
        const mensaje = document.getElementById('mensajeEmail').value;

        if (!email) {
          Swal.showValidationMessage('Por favor ingresa un correo electrónico');
          // Throw to reject the Promise and keep the modal open
          throw new Error('validation');
        }

        if (!isValidEmail(email)) {
          Swal.showValidationMessage('Por favor ingresa un correo electrónico válido');
          throw new Error('validation');
        }

        if (!asunto || asunto.trim() === '') {
          Swal.showValidationMessage('Por favor ingresa un asunto');
          throw new Error('validation');
        }

        return { email, asunto, mensaje };
      }
    });

    if (formValues) {
      try {
        Swal.fire({
          title: 'Enviando...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await api.post(`/api/compras/${compraSeleccionada._id}/enviar-email`, {
          destinatario: formValues.email,
          asunto: formValues.asunto,
          mensaje: formValues.mensaje || 'Compra adjunta'
        });
        
        Swal.fire({
          icon: 'success',
          title: '¡Enviado!',
          text: 'La compra ha sido enviada por correo electrónico',
          confirmButtonColor: '#27ae60'
        });
      } catch (error) {
        console.error('Error al enviar correo:', error);
        Swal.fire('Error', error.response?.data?.message || 'No se pudo enviar el correo electrónico', 'error');
      }
    }
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '16px',
                  padding: '20px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <i className="fa-solid fa-history" style={{ fontSize: '2.5rem', color: 'white' }} aria-hidden={true}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '700' }}>
                    Historial de Compras
                  </h2>
                  <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                    Compras realizadas a partir de órdenes de compra
                  </p>
                </div>
                <button
                  onClick={abrirModalNuevaCompra}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  <i className="fa-solid fa-plus" aria-hidden={true}></i>
                  <span>Nueva Compra</span>
                </button>
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
                  <i className="fa-solid fa-shopping-cart" style={{ color: 'white', fontSize: '1.5rem' }} aria-hidden={true}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {compras.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Total Compras
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
                  <i className="fa-solid fa-dollar-sign" style={{ color: 'white', fontSize: '1.5rem' }} aria-hidden={true}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    ${sumarProp(compras, 'total').toLocaleString()}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Valor Total Compras
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
                  <i className="fa-solid fa-chart-bar" style={{ color: 'white', fontSize: '1.5rem' }} aria-hidden={true}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {compras.length > 0 ? (sumarProp(compras, 'total') / compras.length).toLocaleString() : 0}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Promedio por Compra
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Tabla principal con diseño moderno */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid #e5e7eb',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              overflowX: 'auto',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white'
                  }}>
                    <th style={{
                      padding: '20px 15px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>#</th>
                    <th style={{
                      padding: '20px 15px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Identificador</th>
                    <th style={{
                      padding: '20px 15px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Proveedor</th>
                    <th style={{
                      padding: '20px 15px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Total</th>
                    <th style={{
                      padding: '20px 15px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Fecha</th>
                    <th style={{
                      padding: '20px 15px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Solicitado Por</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((compra, index) => (
                    <tr 
                      key={compra._id} 
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc, #f1f5f9)';
                        e.currentTarget.style.transform = 'scale(1.01)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <td style={{
                        padding: '20px 15px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td style={{
                        padding: '20px 15px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1f2937'
                      }}>
                        <button
                          onClick={() => verDetallesCompra(compra)}
                          style={{
                            background: 'none',
                            color: '#6366f1',
                            border: 'none',
                            padding: '0',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = '#8b5cf6';
                            e.target.style.textDecoration = 'none';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = '#6366f1';
                            e.target.style.textDecoration = 'underline';
                          }}
                        >
                          {compra.numeroOrden || 'N/A'}
                        </button>
                      </td>
                      <td style={{
                        padding: '20px 15px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        {compra.proveedor?.nombre || compra.proveedor || 'Proveedor no especificado'}
                      </td>
                      <td style={{
                        padding: '20px 15px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#059669'
                      }}>
                        ${compra.total?.toLocaleString()}
                      </td>
                      <td style={{
                        padding: '20px 15px',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        {new Date(compra.fecha || compra.fechaCompra).toLocaleDateString()}
                      </td>
                      <td style={{
                        padding: '20px 15px',
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        {compra.solicitadoPor || compra.responsable || 'No especificado'}
                      </td>
                    </tr>
                  ))}
                  {compras.length === 0 && (
                    <tr>
                      <td 
                        colSpan="6" 
                        style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#9ca3af',
                          fontStyle: 'italic',
                          fontSize: '16px'
                        }}
                      >
                        No hay compras registradas en el historial
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación moderna */}
          {compras.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '30px',
              padding: '20px'
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

            {/* Modal de detalles de la compra */}
            {modalDetallesVisible && compraSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-realista modal-lg" style={{ 
            maxWidth: '900px', 
            width: '95%',
            cursor: 'move'
          }} id="modalCompraMovible">
            
            {/* Header mejorado (shared) */}
            <OrderDetailsHeader
              iconClass="fa-solid fa-receipt"
              title="COMPRA CONFIRMADA"
              subtitle={<>N°: <strong>{compraSeleccionada.numeroOrden}</strong></>}
              onClose={() => setModalDetallesVisible(false)}
            />

            {/* Body con diseño mejorado */}
            <div className="modal-body" style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
                
                {/* Información principal en cards */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    {/* Card Proveedor */}
                    <div style={{
                        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                        padding: '1.5rem',
                        borderRadius: '10px',
                        border: '1px solid #e0e0e0'
                    }}>
                        <h6 style={{ 
                            color: '#2c3e50', 
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                <i className="fa-solid fa-truck" style={{ color: '#e74c3c' }} aria-hidden={true}></i>
                  <span>PROVEEDOR</span>
                        </h6>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {compraSeleccionada.proveedor?.nombre || compraSeleccionada.proveedor || 'No especificado'}
                        </p>
                    </div>

                    {/* Card Fecha y Responsable */}
                    <div style={{
                        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                        padding: '1.5rem',
                        borderRadius: '10px',
                        border: '1px solid #e0e0e0'
                    }}>
                        <h6 style={{ 
                            color: '#2c3e50', 
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
              <i className="fa-solid fa-calendar-alt" style={{ color: '#3498db' }} aria-hidden={true}></i>
              <span>INFORMACIÓN</span>
                        </h6>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <div>
                                <span style={{ color: '#666' }}>Fecha: </span>
                                <strong>{new Date(compraSeleccionada.fecha || compraSeleccionada.fechaCompra).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#666' }}>Responsable: </span>
                                <strong>{compraSeleccionada.solicitadoPor || compraSeleccionada.responsable || 'No especificado'}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen financiero */}
                <div style={{
                  background: 'linear-gradient(135deg, #6a1b9a, #9b59b6)',
                  color: 'white',
                  padding: '1.5rem',
                  borderRadius: '10px',
                  marginBottom: '2rem'
                }}>
                    <h6 style={{ 
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
            <i className="fa-solid fa-chart-bar" aria-hidden={true}></i>
            <span>RESUMEN FINANCIERO</span>
                    </h6>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '1rem',
                        textAlign: 'center'
                    }}>
                        <div>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>SUBTOTAL</p>
                            <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>
                                ${compraSeleccionada.subtotal?.toLocaleString() || '0'}
                            </p>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>IVA (19%)</p>
                            <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>
                                ${compraSeleccionada.impuestos?.toLocaleString() || '0'}
                            </p>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>TOTAL</p>
                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#f39c12' }}>
                                ${compraSeleccionada.total?.toLocaleString() || '0'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Observaciones */}
                {compraSeleccionada.observaciones && (
                    <div style={{
                        background: '#fffbf0',
                        border: '1px solid #ffeaa7',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        <h6 style={{ 
                            color: '#f39c12',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
              <i className="fa-solid fa-sticky-note" aria-hidden={true}></i>
              <span>OBSERVACIONES</span>
                        </h6>
                        <p style={{ margin: 0, color: '#856404', lineHeight: '1.5' }}>
                            {compraSeleccionada.observaciones}
                        </p>
                    </div>
                )}

                {/* Tabla de productos mejorada */}
        <h6 style={{ 
          color: '#2c3e50',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <i className="fa-solid fa-boxes" aria-hidden={true}></i>
          <span>DETALLE DE PRODUCTOS ({compraSeleccionada.productos?.length || 0})</span>
        </h6>

                <div className="table-responsive" style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <table className="table-profesional" style={{ 
                        width: '100%',
                        minWidth: '700px'
                    }}>
                        <thead>
                            <tr style={{ 
                                  background: 'linear-gradient(135deg, #6a1b9a, #9b59b6)',
                                  color: 'white'
                                }}>
                                <th style={{ padding: '1rem', fontWeight: '600', width: '5%' }}>#</th>
                                <th style={{ padding: '1rem', fontWeight: '600', width: '25%' }}>PRODUCTO</th>
                                <th style={{ padding: '1rem', fontWeight: '600', width: '30%' }}>DESCRIPCIÓN</th>
                                <th style={{ padding: '1rem', fontWeight: '600', width: '10%', textAlign: 'center' }}>CANTIDAD</th>
                                <th style={{ padding: '1rem', fontWeight: '600', width: '15%', textAlign: 'right' }}>PRECIO UNIT.</th>
                                <th style={{ padding: '1rem', fontWeight: '600', width: '15%', textAlign: 'right' }}>SUBTOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
          {compraSeleccionada.productos?.map((p, i) => (
            <tr key={p._id || p.id || p.productoId || p.producto?._id || p.producto?.id || JSON.stringify(p)} style={{ borderBottom: '1px solid #e9ecef' }}>
                                    <td style={{ padding: '1rem', color: '#666' }}>{i + 1}</td>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>
                                        {p.producto?.name || p.producto || 'Producto no especificado'}
                                    </td>
                                    <td style={{ padding: '1rem', color: '#666' }}>
                                        {p.descripcion || p.producto?.description || 'N/A'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{ 
                                            background: '#e3f2fd', 
                                            color: '#1976d2',
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '15px',
                                            fontWeight: '600',
                                            fontSize: '0.8rem'
                                        }}>
                                            {p.cantidad}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500' }}>
                                        ${p.precioUnitario?.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#2c3e50' }}>
                                        ${((p.cantidad || 0) * (p.precioUnitario || 0))?.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {(!compraSeleccionada.productos || compraSeleccionada.productos.length === 0) && (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '2rem',
                        color: '#666',
                        fontStyle: 'italic'
                    }}>
            <i className="fa-solid fa-inbox" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }} aria-hidden={true}></i>
            <span>No hay productos registrados en esta compra</span>
                    </div>
                )}
            </div>

            {/* Footer mejorado */}
            <div className="modal-footer" style={{
                padding: '1.5rem 2rem',
                borderTop: '1px solid #e0e0e0',
                background: '#f8f9fa',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666' }}>
          <i className="fa-solid fa-circle-check" style={{ color: '#6a1b9a' }} aria-hidden={true}></i>
          <span>Compra confirmada y procesada</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn-profesional btn-primary-profesional"
                onClick={imprimirCompra}
                style={{ background: 'linear-gradient(135deg, #6a1b9a, #9b59b6)', color: 'white' }}
              >
          <i className="fa-solid fa-print" aria-hidden={true}></i>
          <span>Imprimir PDF</span>
              </button>
              <button
                className="btn-profesional"
                onClick={enviarCompraPorCorreo}
                style={{ 
                  background: 'linear-gradient(135deg, #6a1b9a, #9b59b6)', 
                  color: 'white',
                  padding: '0.5rem 1.5rem'
                }}
              >
          <i className="fa-solid fa-envelope" aria-hidden={true}></i>
          <span>Enviar por correo</span>
              </button>
                    <button
                        className="btn-profesional"
                        onClick={() => setModalDetallesVisible(false)}
                        style={{ 
                            background: '#95a5a6', 
                            color: 'white',
                            padding: '0.5rem 1.5rem'
                        }}
                    >
            <i className="fa-solid fa-times" aria-hidden={true}></i>
            <span>Cerrar</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
)}

          {/* Modal Nueva Compra */}
          {modalNuevaCompraVisible && (
            <div className="modal-overlay">
              <div className="modal-realista modal-lg" style={{ maxWidth: '900px', width: '95%' }}>
                <OrderDetailsHeader
                  iconClass="fa-solid fa-plus-circle"
                  title="NUEVA COMPRA"
                  subtitle="Registrar compra sin orden de compra previa"
                  onClose={() => setModalNuevaCompraVisible(false)}
                />

                <div className="modal-body" style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
                  {/* Información General */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h6 style={{ marginBottom: '1rem', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-info-circle" style={{ color: '#10b981' }} aria-hidden={true}></i>
                      <span>Información General</span>
                    </h6>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label htmlFor="nuevaCompra-proveedor" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                          Proveedor *
                        </label>
                        <select
                          id="nuevaCompra-proveedor"
                          value={nuevaCompra.proveedor}
                          onChange={(e) => setNuevaCompra({ ...nuevaCompra, proveedor: e.target.value, productos: [] })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                        >
                          <option value="">Seleccione un proveedor</option>
                          {proveedores.filter(p => p.activo).map(p => (
                            <option key={p._id || p.id} value={p._id || p.id}>{p.nombre || p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="nuevaCompra-solicitadoPor" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                          Solicitado Por
                        </label>
                        <input
                          id="nuevaCompra-solicitadoPor"
                          type="text"
                          value={nuevaCompra.solicitadoPor}
                          disabled
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: '#f3f4f6',
                            cursor: 'not-allowed'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Productos */}
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h6 style={{ margin: 0, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-boxes" style={{ color: '#10b981' }} aria-hidden={true}></i>
                        <span>Productos ({nuevaCompra.productos.length})</span>
                      </h6>
                      <button
                        onClick={agregarProductoNuevaCompra}
                        style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <i className="fa-solid fa-plus" aria-hidden={true}></i>
                        <span>Agregar Producto</span>
                      </button>
                    </div>

                    {nuevaCompra.productos.map((prod, index) => (
                      <div key={prod._tmpId || prod._id || prod.id || prod.productoId || prod.producto || JSON.stringify(prod)} style={{
                        background: '#f8f9fa',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <strong style={{ color: '#2c3e50' }}>Producto #{index + 1}</strong>
                          <button
                            onClick={() => eliminarProductoNuevaCompra(index)}
                            aria-label="Eliminar producto"
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="fa-solid fa-trash" aria-hidden={true}></i>
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label htmlFor={`nuevaCompra-producto-${index}`} style={{ display: 'block', marginBottom: '0.5rem', fontSize: '12px', fontWeight: '600' }}>
                              Producto
                            </label>
                            <select
                              id={`nuevaCompra-producto-${index}`}
                              value={prod.producto}
                              onChange={(e) => actualizarProductoNuevaCompra(index, 'producto', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '13px'
                              }}
                            >
                              <option value="">Seleccione</option>
                              {productosFiltrados.map(p => (
                                <option key={p._id || p.id || p.productoId} value={p._id || p.id || p.productoId}>{p.name || p.nombre || p.title}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor={`nuevaCompra-cantidad-${index}`} style={{ display: 'block', marginBottom: '0.5rem', fontSize: '12px', fontWeight: '600' }}>
                              Cantidad
                            </label>
                            <input
                              id={`nuevaCompra-cantidad-${index}`}
                              type="number"
                              value={prod.cantidad}
                              onChange={(e) => actualizarProductoNuevaCompra(index, 'cantidad', Number.parseInt(e.target.value) || 0)}
                              min="1"
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '13px'
                              }}
                            />
                          </div>
                          <div>
                            <label htmlFor={`nuevaCompra-precio-${index}`} style={{ display: 'block', marginBottom: '0.5rem', fontSize: '12px', fontWeight: '600' }}>
                              Precio Unit.
                            </label>
                            <input
                              id={`nuevaCompra-precio-${index}`}
                              type="number"
                              value={prod.precioUnitario}
                              onChange={(e) => actualizarProductoNuevaCompra(index, 'precioUnitario', Number.parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '13px'
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ marginTop: '0.5rem', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#059669' }}>
                          Subtotal: ${(prod.cantidad * prod.precioUnitario).toLocaleString()}
                        </div>
                      </div>
                    ))}

                    {nuevaCompra.productos.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontStyle: 'italic' }}>
                        No hay productos agregados. Haz clic en "Agregar Producto" para comenzar.
                      </div>
                    )}
                  </div>

                  {/* Observaciones */}
                  <div style={{ marginBottom: '2rem' }}>
                    <label htmlFor="nuevaCompra-observaciones" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Observaciones
                    </label>
                    <textarea
                      id="nuevaCompra-observaciones"
                      value={nuevaCompra.observaciones}
                      onChange={(e) => setNuevaCompra({ ...nuevaCompra, observaciones: e.target.value })}
                      rows="3"
                      placeholder="Notas adicionales sobre la compra..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Resumen */}
                  {nuevaCompra.productos.length > 0 && (
                    <div style={{
                      background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                      padding: '1.5rem',
                      borderRadius: '10px',
                      border: '2px solid #10b981'
                    }}>
                      <h6 style={{ marginBottom: '1rem', color: '#059669', fontWeight: '700' }}>Resumen de la Compra</h6>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Subtotal</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50' }}>
                            ${calcularTotalesShared(nuevaCompra.productos || []).subtotal.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>IVA (19%)</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50' }}>
                            ${Number((calcularTotalesShared(nuevaCompra.productos || []).subtotal * 0.19).toFixed(2)).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>TOTAL</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                            ${Number((calcularTotalesShared(nuevaCompra.productos || []).subtotal * 1.19).toFixed(2)).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer" style={{
                  padding: '1.5rem 2rem',
                  borderTop: '1px solid #e0e0e0',
                  background: '#f8f9fa',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem'
                }}>
                  <button
                    onClick={() => setModalNuevaCompraVisible(false)}
                    style={{
                      background: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fa-solid fa-times"></i> Cancelar
                  </button>
                  <button
                    onClick={guardarNuevaCompra}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <i className="fa-solid fa-save"></i> Guardar Compra
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