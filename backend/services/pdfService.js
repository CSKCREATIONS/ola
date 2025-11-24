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

  // Centralized base styles generator. Accepts a palette object { primary, gradient, lightGradient, muted }
  getBaseStyles(palette = {}) {
    const pal = Object.assign({
      primary: '#2563eb',
      gradient: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
      lightGradient: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
      muted: '#6b7280'
    }, palette || {});

    // Return a <style> block to be inlined in each template
    return `
      <style>
        @page { size: A4 portrait; margin: 14mm; }
        :root{ --primary:${pal.primary}; --muted:${pal.muted}; --bg:#ffffff; --card:#f8fafc; --gradient: ${pal.gradient}; --lightGradient: ${pal.lightGradient}; }
        * { box-sizing: border-box; }
        body{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#111827; background:var(--bg); margin:0; padding:0; }
        .container{ max-width: 900px; margin: 0 auto; padding: 12px; }
        .banner{ background: var(--gradient); color:#fff; padding:18px 20px; border-radius:8px; display:flex; align-items:center; justify-content:center; gap:12px; }
        .banner .title-main{ font-size:24px; font-weight:700; }
        .banner .sub{ font-size:14px; font-weight:400; opacity:0.95; margin-top:6px; }
        .card{ background:#fff; border-radius:8px; padding:14px; box-shadow:0 6px 18px rgba(15,23,42,0.06); }
        .info-grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:12px; }
        .info-grid h4{ margin:0 0 8px 0; font-size:18px; color:var(--primary); border-bottom:3px solid var(--primary); padding-bottom:8px; }
        .info-field{ font-size:12px; color:#111827; margin:2px 0; }
        .descripcion, .condiciones{ background:var(--lightGradient); padding:12px; border-radius:8px; font-size:13px; color:#111827; white-space:pre-wrap; border-left:4px solid var(--primary); }
        table.productos{ width:100%; border-collapse:collapse; margin-top:14px; font-size:13px; }
        table.productos thead th{ text-align:left; padding:12px; background:var(--gradient); color:#fff; font-weight:700; }
        table.productos tbody tr.even{ background:#fafafa; }
        table.productos tbody td{ padding:12px; border-bottom:1px solid #eee; vertical-align:middle; }
        .producto-nombre{ font-weight:600; }
        .producto-cantidad{ text-align:center; font-weight:600; }
        .producto-precio, .producto-subtotal{ text-align:right; }
        tfoot tr{ background:var(--lightGradient); border-top:2px solid var(--primary); }
        tfoot td{ padding:12px; font-weight:700; color:var(--primary); }
        .totals { display:flex; justify-content:flex-end; margin-top:18px; gap:12px; align-items:center; }
        .total-box{ background:#fff; border:3px solid var(--primary); border-radius:6px; padding:10px 18px; text-align:right; }
        .total-box .label{ display:block; font-weight:700; color:var(--primary); font-size:13px; }
        .total-box .amount{ font-size:20px; font-weight:800; color:var(--primary); }
        .footer-note{ margin-top:18px; text-align:center; font-size:12px; color:var(--muted); }
        .footer-blue{ margin-top:20px; background:var(--lightGradient); border-radius:10px; padding:14px; text-align:center; border:1px solid rgba(37,99,235,0.12); }
        /* Message section (used by cotizacion/remision) */
        .message-section { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .message-section h3 { margin-bottom: 10px; font-size: 1.2em; }
        .message-section p { font-size: 1em; line-height: 1.6; }
        @media print{ body{ -webkit-print-color-adjust:exact; } .container{ padding:0; } }
      </style>
    `;
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
    // Mejor plantilla centralizada con estilos CSS para PDF
    const escapeHtml = (str) => {
      if (typeof str !== 'string') return '';
      return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    };

    const formatDate = (data) => {
      const raw = data?.fechaString || data?.fecha;
      if (!raw) return 'N/A';
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('es-ES');
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
      return `
        <tr class="producto-row ${idx % 2 === 0 ? 'even' : 'odd'}">
          <td class="producto-nombre">${escapeHtml(String(nombre))}</td>
          <td class="producto-cantidad">${cantidad}</td>
          <td class="producto-precio">S/. ${valorUnitario}</td>
          <td class="producto-subtotal">S/. ${subtotal}</td>
        </tr>
      `;
    }).join('') : `<tr><td colspan="4" class="no-product">No hay productos disponibles</td></tr>`;

    const descripcionHtml = cotizacion.descripcion ? `<div class="descripcion">${escapeHtml(cotizacion.descripcion)}</div>` : '';
    const condicionesHtml = cotizacion.condicionesPago ? `<div class="condiciones">${escapeHtml(cotizacion.condicionesPago)}</div>` : '';

    const logoUrl = process.env.COMPANY_LOGO_URL || '';
    const companyName = escapeHtml(process.env.COMPANY_NAME || 'JLA Global Company');
    const companyPhone = escapeHtml(process.env.COMPANY_PHONE || '(000) 000-0000');

    // Default palette (blue) for cotizaciones
    const palette = {
      primary: '#2563eb',
      gradient: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
      lightGradient: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
      muted: '#6b7280'
    };

    return `<!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Cotización ${escapeHtml(cotizacion.codigo || '')}</title>
      ${this.getBaseStyles(palette)}
    </head>
    <body>
        <div class="container">
        <div class="banner">
          
            <div class="icon">📄</div>
            <div>
              <div class="title-main">COTIZACIÓN</div>
              <div class="sub">N° ${escapeHtml(cotizacion.codigo || String(cotizacion._id || ''))}</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="info-grid">
            <div>
              <h4>Información Cliente</h4>
              <div class="info-field"><strong>Nombre:</strong> ${escapeHtml(cotizacion.cliente?.nombre || '')}</div>
              <div class="info-field"><strong>Dirección:</strong> ${escapeHtml(cotizacion.cliente?.direccion || '')}</div>
              <div class="info-field"><strong>Ciudad:</strong> ${escapeHtml(cotizacion.cliente?.ciudad || '')}</div>
              <div class="info-field"><strong>Teléfono:</strong> ${escapeHtml(cotizacion.cliente?.telefono || '')}</div>
            </div>
            <div>
              <h4>Información Empresa</h4>
              <div class="info-field"><strong>Fecha de cotización:</strong> ${formatDate(cotizacion)}</div>
              <div class="info-field"><strong>Empresa:</strong> ${companyName}</div>
              <div class="info-field"><strong>Teléfono:</strong> ${companyPhone}</div>
            </div>
          </div>

          ${cotizacion.descripcion ? `<div style="margin-top:12px;"><h4 style="margin:0 0 8px 0; color:var(--primary);">Descripción</h4>${descripcionHtml}</div>` : ''}

          <table class="productos">
            <thead>
              <tr>
                <th style="width:240px; color:var(--primary)">Producto</th>
                <th style="width:80px ; text-align:center; color:var(--primary)">Cantidad</th>
                <th style="width:140px; text-align:right; color:var(--primary)">Precio Unit.</th>
                <th style="width:140px; text-align:right; color:var(--primary)">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productosRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding:12px; text-align:right; font-weight:700; font-size:1.1rem; color:var(--primary);">TOTAL:</td>
                <td style="padding:12px; text-align:right; font-weight:800; font-size:1.3rem; color:var(--primary);">S/. ${Number(total || 0).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          ${cotizacion.condicionesPago ? `<div style="margin-top:12px;"><h4 style="margin:0 0 8px 0; color:var(--primary);">Condiciones de Pago</h4>${condicionesHtml}</div>` : ''}

          <div class="footer-blue">
            <div style="font-weight:700; color:var(--primary);">${companyName}</div>
            <div style="font-size:12px; color:var(--muted); margin-top:6px;">Gracias por su preferencia • Cotización válida por ${escapeHtml(cotizacion.validez || '15 días')}</div>
          </div>
        </div>
      </div>
    </body>
    </html>`;
  }

  // Generar HTML para remisión
  generarHTMLRemision(remision) {
    const escapeHtml = (str) => {
      if (typeof str !== 'string') return '';
      return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    };

    const formatDate = (d) => (d ? new Date(d).toLocaleDateString('es-ES') : 'N/A');

    const fechaRemision = formatDate(remision.fechaRemision || remision.fecha);
    const fechaEntrega = formatDate(remision.fechaEntrega);

    const total = remision.total || (Array.isArray(remision.productos) ? remision.productos.reduce((s, p) => {
      const cantidad = Number.parseFloat(p.cantidad) || 0;
      const valorUnitario = Number.parseFloat(p.precioUnitario || p.valorUnitario || 0) || 0;
      const descuento = Number.parseFloat(p.descuento) || 0;
      return s + cantidad * valorUnitario * (1 - descuento / 100);
    }, 0) : 0);

    const companyName = escapeHtml(process.env.COMPANY_NAME || 'JLA Global Company');

    // Green palette for remisiones
    const palette = {
      primary: '#059669',
      gradient: 'linear-gradient(135deg,#059669,#10b981)',
      lightGradient: 'linear-gradient(135deg,#ecfdf5,#bbf7d0)',
      muted: '#065f46'
    };

    const productosRows = Array.isArray(remision.productos) && remision.productos.length > 0 ? remision.productos.map((p, idx) => {
      const nombre = p.product?.name || p.nombre || 'Producto';
      const cantidad = Number(p.cantidad || 0);
      const valor = Number.parseFloat(p.precioUnitario || p.valorUnitario || 0).toFixed(2);
      const subtotal = (cantidad * (Number(p.precioUnitario || p.valorUnitario || 0))).toFixed(2);
      return `
        <tr class="producto-row ${idx % 2 === 0 ? 'even' : 'odd'}">
          <td class="producto-nombre">${escapeHtml(String(nombre))}</td>
          <td class="producto-cantidad">${cantidad}</td>
          <td class="producto-precio">S/. ${Number(valor).toLocaleString('es-ES')}</td>
          <td class="producto-subtotal">S/. ${Number(subtotal).toLocaleString('es-ES')}</td>
        </tr>
      `;
    }).join('') : `<tr><td colspan="4" class="no-product">No hay productos disponibles</td></tr>`;

    return `<!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Remisión ${escapeHtml(remision.numeroRemision || '')}</title>
      ${this.getBaseStyles(palette)}
    </head>
    <body>
      <div class="container">
        <div class="banner">
          <div>
            <div class="icon">📄</div>
            <div class="title-main">REMISIÓN</div>
            <div class="sub">N° ${escapeHtml(remision.numeroRemision || String(remision._id || ''))}</div>
          </div>
        </div>

        <div class="card">
          <div class="info-grid">
            <div>
              <h4 style="color:var(--primary)">Entregar a:</h4>
              <div class="info-field"><strong>Nombre:</strong> ${escapeHtml(remision.cliente?.nombre || remision.nombreCliente || '')}</div>
              <div class="info-field"><strong>Dirección:</strong> ${escapeHtml(remision.cliente?.direccion || '')}</div>
              <div class="info-field"><strong>Ciudad:</strong> ${escapeHtml(remision.cliente?.ciudad || '')}</div>
              <div class="info-field"><strong>Teléfono:</strong> ${escapeHtml(remision.cliente?.telefono || '')}</div>
            </div>
            <div>
              <h4 style="color:var(--primary)">Remite:</h4>
              <div class="info-field"><strong>Fecha de remisión:</strong> ${fechaRemision}</div>
              <div class="info-field"><strong>F. Entrega:</strong> ${fechaEntrega}</div>
              <div class="info-field"><strong>Responsable:</strong> ${escapeHtml(remision.responsable?.firstName || '')}</div>
            </div>
          </div>

          ${remision.descripcion ? `<div style="margin-top:12px;"><h4 style="margin:0 0 8px 0; color:var(--primary);">Descripción</h4><div class="descripcion">${escapeHtml(remision.descripcion)}</div></div>` : ''}
          <table class="productos">
            <thead>
              <tr>
                <th style=>Producto</th>
                <th style="width:80px; text-align:center;">Cantidad</th>
                <th style="width:140px; text-align:right;">Precio Unit.</th>
                <th style="width:140px; text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productosRows}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding:12px; text-align:right; font-weight:700; font-size:1.1rem; color:var(--primary);">TOTAL:</td>
                  <td style="padding:12px; text-align:right; font-weight:800; font-size:1.3rem; color:var(--primary);">S/. ${Number(total || 0).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            

            <div class="footer-blue">
              <div style="font-weight:700; color:var(--primary);">${companyName}</div>
              <div style="font-size:12px; color:#6b7280; margin-top:6px;">Remisión generada automáticamente</div>
            </div>
        </div>
      </div>
    </body>
    </html>`;
  }

  // Generar HTML para pedido (refactorado para menor complejidad)
  generarHTMLPedido(pedido, estado) {
    // Reuse cotizacion styling and layout for pedidos agendados
    const escapeHtml = (s) => {
      if (typeof s !== 'string') return '';
      return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    };

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

    const estadoTexto = (estado === 'agendado') ? 'PEDIDO AGENDADO' : (`PEDIDO ${String(estado || '').toUpperCase()}`);

    // Palette selection based on estado (adjusted cancelado palette)
    const palette = (() => {
      if (estado === 'cancelado') {
        return {
          primary: '#991b1b',
          gradient: 'linear-gradient(135deg,#fca5a5,#f43f5e)',
          lightGradient: 'linear-gradient(135deg,#fff1f2,#fee2e2)',
          muted: '#6b0f0f'
        };
      }
      if (estado === 'devuelto') {
        return {
          primary: '#d97706',
          gradient: 'linear-gradient(135deg,#fed7aa,#fdba74)',
          lightGradient: 'linear-gradient(135deg,#fff7ed,#ffedd5)',
          muted: '#92400e'
        };
      }
      // default: agendado / normal (blue)
      return {
        primary: '#d97706',
        gradient: 'linear-gradient(135deg,#d97706,#b45309)',
        lightGradient: 'linear-gradient(135deg,#fff7ed,#ffedd5)',
        muted: '#6b7280'
      };
    })();

    const companyName = escapeHtml(process.env.COMPANY_NAME || 'JLA Global Company');
    const companyPhone = escapeHtml(process.env.COMPANY_PHONE || '(000) 000-0000');

    const renderProductsRows = () => {
      if (!Array.isArray(pedido.productos) || pedido.productos.length === 0) {
        return `
              <tr>
                <td colspan="4" style="padding: 16px; text-align: center; font-size: 13px; color: #6b7280;">No hay productos disponibles</td>
              </tr>
            `;
      }

      return pedido.productos.map((p, idx) => {
        const cantidad = parseNumber(p.cantidad);
        const nombre = escapeHtml(p.product?.name || p.product?.nombre || p.nombre || 'Producto sin nombre');
        const descripcion = escapeHtml(p.product?.description || p.product?.descripcion || p.descripcion || '');
        const valor = Number.parseFloat((p.precioUnitario ?? p.valorUnitario) || 0).toFixed(2);
        const subtotal = (cantidad * (Number.parseFloat((p.precioUnitario ?? p.valorUnitario) || 0))).toFixed(2);

        return `
              <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
                <td style="padding:12px; font-weight:600;">${nombre}${descripcion ? `<div style="font-size:12px; color:#6b7280; margin-top:4px;">${descripcion}</div>` : ''}</td>
                <td style="padding:12px; text-align:center; font-weight:600;">${cantidad}</td>
                <td style="padding:12px; text-align:right;">$${Number(valor).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
                <td style="padding:12px; text-align:right; font-weight:700;">$${Number(subtotal).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
              </tr>
            `;
      }).join('');
    };

    return `<!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(estadoTexto)} ${escapeHtml(pedido.numeroPedido || '')}</title>
      ${this.getBaseStyles(palette)}
    </head>
    <body>
      <div class="container">
        <div class="banner">
        
          <div class="icon">📄</div>
          <div>  
            <div class="title-main">${escapeHtml(estadoTexto)}</div>
            <div class="sub">N° ${escapeHtml(pedido.numeroPedido || String(pedido._id || ''))}</div>
          </div>
        </div>
        <div class="card">
          <div class="info-grid">
            <div>
              <h4>Información Cliente</h4>
              <div class="info-field"><strong>Nombre:</strong> ${escapeHtml(pedido.cliente?.nombre || pedido.nombreCliente || '')}</div>
              <div class="info-field"><strong>Dirección:</strong> ${escapeHtml(pedido.cliente?.direccion || '')}</div>
              <div class="info-field"><strong>Ciudad:</strong> ${escapeHtml(pedido.cliente?.ciudad || '')}</div>
              <div class="info-field"><strong>Teléfono:</strong> ${escapeHtml(pedido.cliente?.telefono || '')}</div>
            </div>
            <div>
              <h4>Información Empresa</h4>
              <div class="info-field"><strong>Fecha de pedido:</strong> ${fechaPedido}</div>
              <div class="info-field"><strong>Empresa:</strong> ${companyName}</div>
              <div class="info-field"><strong>Teléfono:</strong> ${companyPhone}</div>
            </div>
          </div>

          ${pedido.descripcion ? `<div style="margin-top:12px;"><h4 style="margin:0 0 8px 0; color:var(--primary);">Descripción</h4><div class="descripcion">${escapeHtml(pedido.descripcion)}</div></div>` : ''}

          <table class="productos">
            <thead>
              <tr>
                <th>Producto</th>
                <th style="width:80px; text-align:center;">Cantidad</th>
                <th style="width:140px; text-align:right;">Precio Unit.</th>
                <th style="width:140px; text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${renderProductsRows()}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding:12px; text-align:right; font-weight:700; font-size:1.1rem; color:var(--primary);">TOTAL:</td>
                <td style="padding:12px; text-align:right; font-weight:800; font-size:1.3rem; color:var(--primary);">$${Number(total || 0).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div class="footer-blue">
            <div style="font-weight:700; color:var(--primary);">${companyName}</div>
            <div style="font-size:12px; color:var(--muted); margin-top:6px;">Documento generado automáticamente</div>
          </div>
        </div>
      </div>
    </body>
    </html>`;
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
