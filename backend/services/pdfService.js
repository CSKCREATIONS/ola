const htmlPdf = require('html-pdf-node');
// Prefer the explicit node: specifier for core modules
const path = require('node:path');
const fs = require('node:fs');

class PDFService {
  constructor() {
    this.options = {
      format: 'A4',
      border: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      header: {
        height: '45mm'
      },
      footer: {
        height: '28mm'
      }
    };
  }

  // Generar PDF de cotización
  async generarPDFCotizacion(cotizacion) {
    try {
      const html = this.generarHTMLCotizacion(cotizacion);
      
      const file = {
        content: html
      };

      const pdfBuffer = await htmlPdf.generatePdf(file, this.options);
      
      return {
        buffer: pdfBuffer,
        filename: `Cotizacion_${cotizacion.codigo || cotizacion._id}.pdf`,
        contentType: 'application/pdf'
      };
    } catch (error) {
      console.error('❌ Error generando PDF de cotización:', error);
      throw error;
    }
  }

  // Generar PDF de remisión
  async generarPDFRemision(remision) {
    try {
      const html = this.generarHTMLRemision(remision);
      
      const file = {
        content: html
      };

      const pdfBuffer = await htmlPdf.generatePdf(file, this.options);
      
      return {
        buffer: pdfBuffer,
        filename: `Remision_${remision.numeroRemision || remision._id}.pdf`,
        contentType: 'application/pdf'
      };
    } catch (error) {
      console.error('❌ Error generando PDF de remisión:', error);
      throw error;
    }
  }

  // Generar PDF de pedido
  async generarPDFPedido(pedido, estado) {
    try {
      const html = this.generarHTMLPedido(pedido, estado);
      
      const file = {
        content: html
      };

      const pdfBuffer = await htmlPdf.generatePdf(file, this.options);
      
      // Normalize estadoTexto with a clear, non-nested conditional for readability
      let estadoTexto;
      if (estado === 'agendado') {
        estadoTexto = 'Agendado';
      } else if (estado === 'devuelto') {
        estadoTexto = 'Devuelto';
      } else if (estado === 'cancelado') {
        estadoTexto = 'Cancelado';
      } else {
        estadoTexto = estado;
      }
      
      return {
        buffer: pdfBuffer,
        filename: `Pedido_${estadoTexto}_${pedido.numeroPedido || pedido._id}.pdf`,
        contentType: 'application/pdf'
      };
    } catch (error) {
      console.error('❌ Error generando PDF de pedido:', error);
      throw error;
    }
  }

  // Generar HTML para cotización
  generarHTMLCotizacion(cotizacion) {
    // === Nueva versión alineada a handlePrint de CotizacionPreview.jsx ===
    const escapeHtml = (str) => {
      if (typeof str !== 'string') return '';
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    const formatDate = (data) => {
      const raw = data?.fechaString || data?.fecha;
      if (!raw) return 'N/A';
      const d = new Date(raw);
      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('es-ES');
    };
    const total = (() => {
      if (cotizacion.total) return Number(cotizacion.total) || 0;
      if (!Array.isArray(cotizacion.productos)) return 0;
      return cotizacion.productos.reduce((s, p) => s + (Number(p.subtotal) || (Number(p.cantidad) || 0) * (Number(p.valorUnitario || p.precioUnitario) || 0)), 0);
    })();
    const productosRows = Array.isArray(cotizacion.productos) && cotizacion.productos.length > 0 ? cotizacion.productos.map((p, idx) => {
      const nombre = p.producto?.name || p.producto?.nombre || p.nombre || 'Producto sin nombre';
      const cantidad = p.cantidad || 0;
      const valorUnitario = Number.parseFloat(p.valorUnitario || p.precioUnitario || 0).toFixed(2);
      const subtotal = Number.parseFloat(p.subtotal != null ? p.subtotal : (cantidad * (p.valorUnitario || p.precioUnitario || 0))).toFixed(2);
      return `<tr style="border-bottom:1px solid #eee; background:${idx % 2 === 0 ? '#fafafa' : '#fff'};">
        <td style="padding:1rem; font-weight:bold;">${escapeHtml(String(nombre))}</td>
        <td style="padding:1rem; text-align:center; font-weight:bold;">${cantidad}</td>
        <td style="padding:1rem; text-align:right;">S/. ${valorUnitario}</td>
        <td style="padding:1rem; text-align:right; font-weight:bold;">S/. ${subtotal}</td>
      </tr>`;
    }).join('') : `<tr><td colspan="4" style="padding:1rem; text-align:center; color:#666;">No hay productos disponibles</td></tr>`;

    const descripcionHtml = cotizacion.descripcion ? `<div style="background:#eff6ff; padding:1rem; border-radius:8px; border-left:4px solid #2563eb; line-height:1.6; white-space:pre-wrap;">${escapeHtml(cotizacion.descripcion)}</div>` : '';
    const condicionesHtml = cotizacion.condicionesPago ? `<div style="background:#eff6ff; padding:1rem; border-radius:8px; border-left:4px solid #2563eb; line-height:1.6;">${escapeHtml(cotizacion.condicionesPago)}</div>` : '';

    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Cotización ${cotizacion.codigo || ''}</title>
    <style>@page { size: A4 portrait; margin: 12mm; }</style></head><body style="font-family:Arial,Helvetica,sans-serif; margin:0; padding:0; background:#fff;">
    <div style="display:flex; flex-direction:column; background:#fff; padding:1rem; font-size:12px;">
      <div style="text-align:center; color:#fff; margin-bottom:2rem; padding:1.5rem; background:linear-gradient(135deg,#2563eb,#1d4ed8); border-radius:8px; font-size:1.8rem; font-weight:bold;">
        <div style="display:flex; align-items:center; justify-content:center; gap:1rem;">
          <div>COTIZACIÓN</div>
          <div style="font-size:1rem; font-weight:normal; margin-top:0.5rem;">N° ${cotizacion.codigo || ''}</div>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem; margin-bottom:2rem;">
        <div>
          <h3 style="border-bottom:3px solid #2563eb; padding-bottom:0.5rem; color:#2563eb; font-size:1.1rem; font-weight:bold; margin:0 0 1rem;">Información Cliente</h3>
          <div style="line-height:1.8; font-size:12px;">
            <p style="margin:0"><strong>Nombre:</strong> ${escapeHtml(cotizacion.cliente?.nombre || '')}</p>
            <p style="margin:0"><strong>Dirección:</strong> ${escapeHtml(cotizacion.cliente?.direccion || '')}</p>
            <p style="margin:0"><strong>Ciudad:</strong> ${escapeHtml(cotizacion.cliente?.ciudad || '')}</p>
            <p style="margin:0"><strong>Teléfono:</strong> ${escapeHtml(cotizacion.cliente?.telefono || '')}</p>
          </div>
        </div>
        <div>
          <h3 style="border-bottom:3px solid #2563eb; padding-bottom:0.5rem; color:#2563eb; font-size:1.1rem; font-weight:bold; margin:0 0 1rem;">Información Empresa</h3>
          <div style="line-height:1.8; font-size:12px;">
            <p style="margin:0"><strong>Fecha de cotización:</strong> ${formatDate(cotizacion)}</p>
            <p style="margin:0"><strong>Empresa:</strong> ${escapeHtml(process.env.COMPANY_NAME || 'JLA Global Company')}</p>
            <p style="margin:0"><strong>Teléfono:</strong> ${escapeHtml(process.env.COMPANY_PHONE || '(555) 123-4567')}</p>
          </div>
        </div>
      </div>
      ${cotizacion.descripcion ? `<h3 style="border-bottom:3px solid #2563eb; padding-bottom:0.5rem; color:#2563eb; font-size:1.1rem; font-weight:bold; margin:0 0 1rem;">Descripción</h3>${descripcionHtml}` : ''}
      <table style="width:100%; border-collapse:collapse; margin-top:1rem; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff;">
            <th style="padding:1rem; text-align:left; font-weight:bold;">Producto</th>
            <th style="padding:1rem; text-align:center; font-weight:bold;">Cantidad</th>
            <th style="padding:1rem; text-align:right; font-weight:bold;">Precio Unit.</th>
            <th style="padding:1rem; text-align:right; font-weight:bold;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${productosRows}</tbody>
        <tfoot>
          <tr style="background:linear-gradient(135deg,#eff6ff,#dbeafe); border-top:2px solid #2563eb;">
            <td colspan="3" style="padding:1rem; text-align:right; font-weight:bold; font-size:1rem; color:#2563eb;">TOTAL:</td>
            <td style="padding:1rem; text-align:right; font-weight:bold; font-size:1.2rem; color:#2563eb;">S/. ${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      ${cotizacion.condicionesPago ? `<h3 style="margin-top:2rem; border-bottom:3px solid #2563eb; padding-bottom:0.5rem; color:#2563eb; font-size:1.1rem; font-weight:bold;">Condiciones de Pago</h3>${condicionesHtml}` : ''}
      <div style="margin-top:3rem; padding:1.2rem; background:linear-gradient(135deg,#f8f9fa,#e9ecef); border-radius:8px; text-align:center; border-top:3px solid #2563eb; font-size:12px;">
        <div style="font-size:1rem; font-weight:bold; color:#2563eb; margin-bottom:0.4rem;">JLA Global Company</div>
        <div style="font-size:0.8rem; color:#666;">Gracias por su preferencia • Cotización válida por ${escapeHtml(cotizacion.validez || '15 días')}</div>
      </div>
    </div>
    </body></html>`;
  }

  // Generar HTML para remisión
  generarHTMLRemision(remision) {
    const fechaRemision = remision.fechaRemision ? new Date(remision.fechaRemision).toLocaleDateString('es-ES') : 'N/A';
    const fechaEntrega = remision.fechaEntrega ? new Date(remision.fechaEntrega).toLocaleDateString('es-ES') : 'N/A';
    
    // Calcular total
    const total = remision.total || remision.productos?.reduce((sum, prod) => {
      const cantidad = Number.parseFloat(prod.cantidad) || 0;
      const valorUnitario = Number.parseFloat(prod.precioUnitario || prod.valorUnitario) || 0;
      const descuento = Number.parseFloat(prod.descuento) || 0;
      return sum + (cantidad * valorUnitario * (1 - descuento / 100));
    }, 0) || 0;
    
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Remisión ${remision.numeroRemision}</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 24px; 
                font-size: 14px;
                line-height: 1.4;
                background: #fff;
            }
            .pdf-cotizacion {
                background: #fff;
                padding: 24px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                font-size: 14px;
            }
            .cotizacion-encabezado h2 { 
                color: #2563eb; 
                font-weight: bold; 
                font-size: 24px; 
                margin: 0 0 8px 0; 
            }
            .info-container { 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start;
                font-size: 13px;
                margin-bottom: 12px;
            }
            .info-section { 
                flex: 1; 
            }
            .info-section:first-child { 
                margin-right: 16px; 
            }
            .info-title { 
                color: #374151; 
                margin-bottom: 5px; 
                font-size: 14px;
                font-weight: normal;
            }
            .info-box { 
                background-color: #f9fafb; 
                padding: 8px; 
                border-radius: 4px; 
                border: 1px solid #e5e7eb; 
                font-size: 12px; 
            }
            .info-box p { 
                margin: 2px 0; 
            }
            .info-box .nombre { 
                font-weight: bold; 
                margin-bottom: 2px;
                font-size: 13px; 
            }
            .info-box .ref { 
                color: #6b7280;
                font-size: 12px;
            }
            hr { 
                border: none; 
                border-top: 1px solid #e5e7eb; 
                margin: 12px 0; 
            }
            .tabla-cotizacion { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 16px; 
                font-size: 13px; 
            }
            .tabla-cotizacion thead tr { 
                background-color: #f3f4f6; 
            }
            .tabla-cotizacion th { 
                text-align: left;
                padding: 10px; 
                font-size: 13px; 
                font-weight: bold;
                border-bottom: 1px solid #e5e7eb;
            }
            .tabla-cotizacion td { 
                padding: 10px; 
                border-bottom: 1px solid #e5e7eb; 
                font-size: 13px;
            }
            .tabla-cotizacion tfoot tr { 
                background-color: #f9fafb; 
                font-weight: bold; 
            }
            .tabla-cotizacion tfoot td:last-child { 
                font-size: 16px;
                color: #059669; 
            }
        </style>
    </head>
    <body>
      <div class="pdf-cotizacion">
        <div class="cotizacion-encabezado">
          <h2>REMISIÓN</h2>
        </div>

        <div class="info-container">
          <div class="info-section">
            <h4 class="info-title">ENTREGAR A:</h4>
            <div class="info-box">
              <p class="nombre">${remision.cliente?.nombre || remision.nombreCliente || 'Cliente no especificado'}</p>
              <p>${remision.cliente?.direccion || 'Dirección no especificada'}</p>
              <p>${remision.cliente?.ciudad || remision.ciudadCliente || 'Ciudad no especificada'}</p>
              <p>Tel: ${remision.cliente?.telefono || remision.telefonoCliente || 'No especificado'}</p>
              <p>${remision.cliente?.correo || remision.correoCliente || 'Sin correo'}</p>
            </div>
          </div>
          
          <div class="info-section">
            <h4 class="info-title">REMITE:</h4>
            <div class="info-box">
              <p class="nombre">${process.env.COMPANY_NAME || 'PANGEA'}</p>
              <p>Responsable: ${remision.responsable?.firstName || 'Natalia Cardenas'}</p>
              ${remision.numeroRemision ? '<p class="ref">Ref. Remisión: ' + remision.numeroRemision + '</p>' : ''}
              ${remision.codigoPedido ? '<p class="ref">Ref. Pedido: ' + remision.codigoPedido + '</p>' : ''}
              ${remision.codigoCotizacion ? '<p class="ref">Ref. Cotización: ' + remision.codigoCotizacion + '</p>' : ''}
              <p class="ref">Fecha: ${fechaRemision}</p>
              ${remision.fechaEntrega ? '<p class="ref">F. Entrega: ' + fechaEntrega + '</p>' : ''}
            </div>
          </div>
        </div>

        <hr />

        <table class="tabla-cotizacion">
          <thead>
            <tr>
              <th>Cant.</th>
              <th>Producto</th>
              <th>Descripción</th>
              <th style="text-align: right;">Valor Unit.</th>
              <th style="text-align: right;">% Desc.</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${remision.productos && remision.productos.length > 0 ? remision.productos.map(p => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="font-weight: bold;">${p.cantidad || 0}</td>
                <td>${p.product?.name || p.product?.nombre || p.nombre || 'Producto sin nombre'}</td>
                <td style="color: #6b7280;">${p.product?.description || p.product?.descripcion || p.descripcion || 'Sin descripción'}</td>
                <td style="text-align: right;">$${(p.precioUnitario || p.valorUnitario || 0).toLocaleString('es-CO')}</td>
                <td style="text-align: right;">${p.descuento || 0}%</td>
                <td style="text-align: right; font-weight: bold;">$${(() => {
                  const cantidad = Number.parseFloat(p.cantidad) || 0;
                  const valorUnitario = Number.parseFloat(p.precioUnitario || p.valorUnitario) || 0;
                  const descuento = Number.parseFloat(p.descuento) || 0;
                  const subtotal = cantidad * valorUnitario * (1 - descuento / 100);
                  return subtotal.toLocaleString('es-CO');
                })()}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="6" style="padding: 16px; text-align: center; font-size: 13px; color: #6b7280;">
                  No hay productos disponibles
                </td>
              </tr>
            `}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="padding: 12px; text-align: right; font-size: 14px;">
                TOTAL REMISIÓN:
              </td>
              <td style="padding: 12px; text-align: right; font-size: 16px; color: #059669;">
                $${total.toLocaleString('es-CO')}
              </td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="text-align: center; width: 200px;">
            <div style="border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; font-size: 10px; text-transform: uppercase;">
              ENTREGADO POR
            </div>
          </div>
          <div style="text-align: center; width: 200px;">
            <div style="border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; font-size: 10px; text-transform: uppercase;">
              RECIBIDO POR
            </div>
          </div>
        </div>

        <div style="margin-top: 30px; border-top: 1px solid #000; padding-top: 15px;">
          <h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold; text-transform: uppercase;">
            TÉRMINOS Y CONDICIONES:
          </h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 10px;">
            <li style="margin-bottom: 5px;">El presente acto verifica la mercancía al momento de la entrega</li>
            <li style="margin-bottom: 5px;">Los productos y servicios están sujetos a disponibilidad al momento de la entrega</li>
            <li style="margin-bottom: 5px;">Una vez firmada la remisión, se dará por aceptada la mercancía en perfectas condiciones</li>
            <li>Una vez firmada la remisión, no se aceptarán reclamos en mal estado de las mercancías entregadas</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Generar HTML para pedido (refactorado para menor complejidad)
  generarHTMLPedido(pedido, estado) {
    const formatDate = (d) => (d ? new Date(d).toLocaleDateString('es-ES') : 'N/A');
    const fechaPedido = formatDate(pedido.fecha || pedido.createdAt);
    const fechaEntrega = formatDate(pedido.fechaEntrega);

    const parseNumber = (v) => Number.parseFloat(v) || 0;
    const calcTotal = () => {
      if (pedido.total) return Number(pedido.total) || 0;
      if (!Array.isArray(pedido.productos)) return 0;
      return pedido.productos.reduce((sum, prod) => {
        const cantidad = parseNumber(prod.cantidad);
        const valorUnitario = parseNumber(prod.precioUnitario ?? prod.valorUnitario);
        const descuento = parseNumber(prod.descuento);
        return sum + cantidad * valorUnitario * (1 - descuento / 100);
      }, 0);
    };

    const total = calcTotal();

    const estadoTexto = (() => {
      switch (estado) {
        case 'agendado': return 'PEDIDO AGENDADO';
        case 'devuelto': return 'PEDIDO DEVUELTO';
        case 'cancelado': return 'PEDIDO CANCELADO';
        default: return `PEDIDO ${String(estado || '').toUpperCase()}`;
      }
    })();

    const estadoPalette = (() => {
      if (estado === 'agendado') return { color: '#28a745', bg: '#fef3c7', text: '#f59e0b', border: '#f59e0b' };
      if (estado === 'devuelto') return { color: '#ff9800', bg: '#fed7aa', text: '#ea580c', border: '#ea580c' };
      return { color: '#dc3545', bg: '#fecaca', text: '#dc2626', border: '#dc2626' };
    })();

    const formatCurrency = (n) => Number(n || 0).toLocaleString('es-CO');

    const renderProductsRows = () => {
      if (!Array.isArray(pedido.productos) || pedido.productos.length === 0) {
        return `
              <tr>
                <td colspan="6" style="padding: 16px; text-align: center; font-size: 13px; color: #6b7280;">
                  No hay productos disponibles
                </td>
              </tr>
            `;
      }

      return pedido.productos.map(p => {
        const cantidad = parseNumber(p.cantidad);
        const nombre = p.product?.name || p.product?.nombre || p.nombre || 'Producto sin nombre';
        const descripcion = p.product?.description || p.product?.descripcion || p.descripcion || 'Sin descripción';
        const valor = parseNumber(p.precioUnitario ?? p.valorUnitario);
        const descuento = parseNumber(p.descuento);
        const subtotal = cantidad * valor * (1 - descuento / 100);

        return `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="font-weight: bold;">${cantidad}</td>
                <td>${nombre}</td>
                <td style="color: #6b7280;">${descripcion}</td>
                <td style="text-align: right;">$${formatCurrency(valor)}</td>
                <td style="text-align: right;">${descuento}%</td>
                <td style="text-align: right; font-weight: bold;">$${formatCurrency(subtotal)}</td>
              </tr>
            `;
      }).join('');
    };

    // Compose HTML using the small helpers above
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${estadoTexto} ${pedido.numeroPedido || ''}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 24px; font-size: 14px; line-height: 1.4; background: #fff; }
            .pdf-pedido { background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
            .pedido-encabezado h2 { color: ${estadoPalette.color}; font-weight: bold; font-size: 24px; margin: 0 0 8px 0; }
            .info-container { display:flex; justify-content:space-between; margin-bottom:12px; }
            .info-box { background:#f9fafb; padding:8px; border-radius:4px; border:1px solid #e5e7eb; font-size:12px; }
            .descripcion-box { background:#fffbeb; padding:8px; border-radius:4px; border:1px solid #fed7aa; }
            .estado-badge { padding:8px 16px; border-radius:4px; font-weight:bold; font-size:12px; text-align:center; background-color:${estadoPalette.bg}; color:${estadoPalette.text}; border:1px solid ${estadoPalette.border}; }
            .tabla-pedido { width:100%; border-collapse:collapse; margin-bottom:16px; font-size:13px; }
            .tabla-pedido thead tr { background-color:#f3f4f6; }
            .tabla-pedido th, .tabla-pedido td { padding:10px; border-bottom:1px solid #e5e7eb; }
            .tabla-pedido tfoot td:last-child { font-size:16px; color:#059669; }
        </style>
    </head>
    <body>
      <div class="pdf-pedido">
        <div class="pedido-encabezado"><h2>${estadoTexto}</h2></div>

        <div class="estado-section"><div class="estado-badge">Estado del pedido: ${String(estado || '').charAt(0).toUpperCase() + String(estado || '').slice(1)}</div></div>

        <div class="info-container">
          <div style="flex:1; margin-right:16px;">
            <h4>ENTREGAR A:</h4>
            <div class="info-box">
              <p style="font-weight:bold;">${pedido.cliente?.nombre || pedido.nombreCliente || 'Cliente no especificado'}</p>
              <p>${pedido.cliente?.direccion || 'Dirección no especificada'}</p>
              <p>${pedido.cliente?.ciudad || pedido.ciudadCliente || 'Ciudad no especificada'}</p>
              <p>Tel: ${pedido.cliente?.telefono || pedido.telefonoCliente || 'No especificado'}</p>
              <p>${pedido.cliente?.correo || pedido.correoCliente || 'Sin correo'}</p>
            </div>
          </div>

          <div style="flex:1;">
            <h4>REMITE:</h4>
            <div class="info-box">
              <p style="font-weight:bold;">${process.env.COMPANY_NAME || 'PANGEA'}</p>
              <p>Responsable: ${pedido.responsable?.firstName || 'Natalia Cardenas'}</p>
              ${pedido.numeroPedido ? `<p style="color:#6b7280;">Ref. Pedido: ${pedido.numeroPedido}</p>` : ''}
              <p style="color:#6b7280;">Fecha: ${fechaPedido}</p>
              ${pedido.fechaEntrega ? `<p style="color:#6b7280;">F. Entrega: ${fechaEntrega}</p>` : ''}
            </div>
          </div>
        </div>

        ${pedido.descripcion ? `<div class="descripcion-box"><strong>Descripción del pedido:</strong><div>${pedido.descripcion}</div></div>` : ''}

        <table class="tabla-pedido">
          <thead>
            <tr>
              <th>Cant.</th>
              <th>Producto</th>
              <th>Descripción</th>
              <th style="text-align:right;">Valor Unit.</th>
              <th style="text-align:right;">% Desc.</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${renderProductsRows()}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="padding:12px; text-align:right; font-size:14px;">TOTAL PEDIDO:</td>
              <td style="padding:12px; text-align:right; font-size:16px;">$${formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </body>
    </html>
    `;
  }

  // Generar PDF de compra
  async generarPDFCompra(compra) {
    try {
      const html = this.generarHTMLCompra(compra);
      
      const file = {
        content: html
      };

      const pdfBuffer = await htmlPdf.generatePdf(file, this.options);
      
      return {
        buffer: pdfBuffer,
        filename: `Compra_${compra.numeroOrden || compra._id}.pdf`,
        contentType: 'application/pdf'
      };
    } catch (error) {
      console.error('❌ Error generando PDF de compra:', error);
      throw error;
    }
  }

  // Generar HTML para compra
  generarHTMLCompra(compra) {
    const fechaCompra = compra.fecha || compra.fechaCompra;
    const fechaFormateada = fechaCompra ? new Date(fechaCompra).toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : 'N/A';

    const totalCalculado = compra.productos?.reduce((total, producto) => {
      const subtotal = Number(producto.cantidad * producto.precioUnitario) || 0;
      return total + subtotal;
    }, 0) || 0;

    const totalFinal = Number(compra.total) || totalCalculado;
    const subtotalFinal = Number(compra.subtotal) || totalCalculado;
    const impuestosFinal = Number(compra.impuestos) || 0;

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Compra ${compra.numeroOrden}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background-color: #ffffff;
          padding: 20px;
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          background: white; 
        }
        .header { 
          background: linear-gradient(135deg, #27ae60, #229954); 
          color: white; 
          padding: 30px; 
          text-align: center; 
          margin-bottom: 30px;
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
        .info-section {
          margin-bottom: 25px;
          padding: 20px;
          background: #f8f9fa;
          border-left: 4px solid #27ae60;
          border-radius: 5px;
        }
        .info-section h3 { 
          color: #27ae60; 
          margin-bottom: 12px; 
          font-size: 16px;
          font-weight: 600;
        }
        .info-section p { 
          margin-bottom: 8px; 
          color: #555; 
          font-size: 14px;
        }
        .info-section strong { 
          color: #333;
          font-weight: 600;
        }
        .products-section { 
          margin: 30px 0; 
        }
        .products-title { 
          background: #27ae60; 
          color: white; 
          padding: 15px; 
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
        .products-table tbody td { 
          padding: 12px; 
          font-size: 14px;
        }
        .products-table tbody tr:hover {
          background: #f8f9fa;
        }
        .total-section { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 5px; 
          margin-top: 30px; 
        }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 10px 0; 
          border-bottom: 1px solid #dee2e6; 
          font-size: 14px;
        }
        .total-row.final { 
          border-bottom: none; 
          font-size: 18px; 
          font-weight: bold; 
          color: #27ae60; 
          margin-top: 10px; 
          padding-top: 15px; 
          border-top: 2px solid #27ae60; 
        }
        .observaciones {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          color: #6c757d; 
          font-size: 12px;
          margin-top: 30px;
          border-top: 1px solid #dee2e6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>COMPRA CONFIRMADA</h1>
          <p>N° ${compra.numeroOrden || 'N/A'}</p>
        </div>

        <div class="info-section">
          <h3>📋 Información General</h3>
          <p><strong>Número de Orden:</strong> ${compra.numeroOrden || 'N/A'}</p>
          <p><strong>Fecha:</strong> ${fechaFormateada}</p>
          <p><strong>Estado:</strong> ${compra.estado || 'Confirmada'}</p>
        </div>

        <div class="info-section">
          <h3>🏢 Información del Proveedor</h3>
          <p><strong>Nombre:</strong> ${compra.proveedor?.nombre || 'No especificado'}</p>
          ${compra.proveedor?.email ? `<p><strong>Email:</strong> ${compra.proveedor.email}</p>` : ''}
          ${compra.proveedor?.telefono ? `<p><strong>Teléfono:</strong> ${compra.proveedor.telefono}</p>` : ''}
        </div>

        <div class="products-section">
          <h2 class="products-title">📦 Detalle de Productos</h2>
          <table class="products-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio Unitario</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${compra.productos?.map(p => {
                const subtotal = p.cantidad * p.precioUnitario;
                return `
                  <tr>
                    <td>${p.producto?.name || 'N/A'}</td>
                    <td style="text-align: center; font-weight: 600;">${p.cantidad}</td>
                    <td style="text-align: right;">$${Number(p.precioUnitario || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
                    <td style="text-align: right; font-weight: 600;">$${Number(subtotal || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `;
              }).join('') || '<tr><td colspan="4" style="text-align: center; padding: 20px;">No hay productos</td></tr>'}
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

        ${compra.observaciones ? `
          <div class="observaciones">
            <strong>📝 Observaciones:</strong><br>
            ${compra.observaciones}
          </div>
        ` : ''}

        <div class="footer">
          <p><strong>JLA Global Company</strong></p>
          <p>Documento generado automáticamente</p>
          <p>© ${new Date().getFullYear()} JLA Global Company. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}

module.exports = PDFService;
