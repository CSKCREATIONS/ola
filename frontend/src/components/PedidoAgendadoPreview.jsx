import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import { makePedidoAgendadoTemplate } from '../utils/emailTemplates';
import { calcularTotales } from '../utils/calculations';
import sanitizeHtml from '../utils/sanitizeHtml';

const STYLES = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
  },
  container: {
    backgroundColor: 'white', width: '95%', maxWidth: '1200px', height: '90vh',
    borderRadius: '12px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden'
  },
  headerBar: {
    background: 'linear-gradient(135deg, #fd7e14, #e85d04)', color: 'white',
    padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
  headerActions: { display: 'flex', gap: '0.5rem' },
  actionBtn: (bg = 'rgba(255,255,255,0.2)') => ({
    background: bg, border: 'none', borderRadius: '8px', padding: '0.75rem',
    color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
    gap: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.3s ease'
  }),
  contentWrap: { flex: 1, overflow: 'auto', padding: '2rem', backgroundColor: '#f8f9fa' },
  pdfBlock: {
    display: 'flex', flexDirection: 'column', background: '#fff', padding: '2rem',
    borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginTop: '1rem',
    userSelect: 'none'
  },
  modalWrap: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modalCard: {
    backgroundColor: 'white', padding: '2rem', borderRadius: '10px', maxWidth: '600px',
    width: '90%', maxHeight: '80vh', overflow: 'auto'
  }
};

const buildPrintStyleText = () => `
  @page { size: A4 portrait; margin: 8mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body * { visibility: hidden !important; }
    #print-root, #print-root * { visibility: visible !important; }
    #print-root { position: fixed; inset: 0; margin:0; padding:0; background:#fff; }
    table { page-break-inside: avoid; }
  }
`;

/* DOM set helpers (kept for potential alternative print strategies) */
const trySetDocWithDOM = (doc, title, htmlContent, style) => {
  try {
    doc.open();
    doc.title = title;
    const styleEl = doc.createElement('style');
    styleEl.appendChild(doc.createTextNode(style));
    if (!doc.head) {
      const head = doc.createElement('head');
      doc.documentElement.appendChild(head);
    }
    doc.head.appendChild(styleEl);
    if (!doc.body) {
      const body = doc.createElement('body');
      doc.documentElement.appendChild(body);
    }
    doc.body.innerHTML = htmlContent;
    return true;
  } catch (err) {
    console.error('trySetDocWithDOM failed', err);
    return false;
  } finally {
    try { doc.close(); } catch (e) { console.debug('doc.close failed (trySetDocWithDOM)', e); }
  }
};

const trySetDocOuterHTML = (doc, title, htmlContent, style) => {
  try {
    doc.open();
    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>${style}</style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;
    doc.documentElement.outerHTML = html;
    return true;
  } catch (err) {
    console.error('trySetDocOuterHTML failed', err);
    return false;
  } finally {
    try { doc.close(); } catch (e) { console.debug('doc.close failed (trySetDocOuterHTML)', e); }
  }
};

/* Small subcomponents */
const ActionButton = ({ onClick, children, aria, style }) => (
  <button onClick={onClick} aria-label={aria} style={{ ...STYLES.actionBtn(), ...style }}>
    {children}
  </button>
);
ActionButton.propTypes = {
  onClick: PropTypes.func, children: PropTypes.node, aria: PropTypes.string, style: PropTypes.object
};

const EnviarModal = ({ correo, asunto, mensaje, onClose, onChangeCorreo, onChangeAsunto, onChangeMensaje, onSend }) => (
  <div style={STYLES.modalWrap}>
    <div style={STYLES.modalCard}>
      <h3 style={{ marginBottom: '1rem', color: '#fd7e14' }}>
        <i className="fa-solid fa-envelope icon-gap" aria-hidden />
        <span>Enviar Pedido por Correo</span>
      </h3>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="input-pedido-agendado-preview-1" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Correo del destinatario:
        </label>
        <input id="input-pedido-agendado-preview-1" type="email" value={correo} onChange={onChangeCorreo}
          placeholder="ejemplo@correo.com"
          style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="input-pedido-agendado-preview-2" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Asunto:
        </label>
        <input id="input-pedido-agendado-preview-2" type="text" value={asunto} onChange={onChangeAsunto}
          placeholder="Asunto del correo"
          style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="input-pedido-agendado-preview-3" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Mensaje:
        </label>
        <textarea id="input-pedido-agendado-preview-3" value={mensaje} onChange={onChangeMensaje}
          placeholder="Escriba un mensaje personalizado..." rows="8"
          style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', resize: 'vertical', fontFamily: 'monospace' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={onSend} style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', backgroundColor: '#fd7e14', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
          <i className="fa-solid fa-envelope icon-gap" aria-hidden />
          <span>Enviar Correo</span>
        </button>
      </div>
    </div>
  </div>
);
EnviarModal.propTypes = {
  correo: PropTypes.string, asunto: PropTypes.string, mensaje: PropTypes.string,
  onClose: PropTypes.func, onChangeCorreo: PropTypes.func, onChangeAsunto: PropTypes.func, onChangeMensaje: PropTypes.func, onSend: PropTypes.func
};

/* Main component */
const PedidoAgendadoPreview = ({ datos = {}, onClose = () => { }, onEmailSent, onRemisionar }) => {
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [correo, setCorreo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const pdfRef = useRef(null);

  useEffect(() => {
    if (datos?.cliente?.correo) setCorreo(datos.cliente.correo);
  }, [datos]);

  const calcularTotal = useMemo(() => {
    try {
      return Number(calcularTotales(datos?.productos || []).total) || 0;
    } catch (err) {
      console.error('calcularTotal error', err);
      return 0;
    }
  }, [datos?.productos]);

  const abrirModalEnvio = useCallback(() => {
    const tpl = makePedidoAgendadoTemplate(datos) || {};
    setAsunto(tpl.asunto || '');
    setMensaje(tpl.mensaje || '');
    setShowEnviarModal(true);
  }, [datos]);

  const enviarPorCorreo = useCallback(async () => {
    try {
      const response = await api.post(`/api/pedidos/${datos._id}/enviar-correo`, {
        pedidoId: datos._id, correoDestino: correo, asunto, mensaje
      });
      const resData = response?.data;
      const okStatus = response?.status >= 200 && response?.status < 300;
      const backendOk = resData?.success !== false;

      if (okStatus && backendOk) {
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: (resData && (resData.message || 'El pedido agendado ha sido enviado exitosamente')) || 'El pedido agendado ha sido enviado exitosamente',
          confirmButtonColor: '#fd7e14'
        });
        setShowEnviarModal(false);
        if (onEmailSent) onEmailSent(datos._id);
      } else {
        const errMsg = (resData && (resData.message || JSON.stringify(resData))) || `HTTP ${response?.status}`;
        console.error('Enviar correo - backend responded with error-like body:', response, resData);
        throw new Error(errMsg);
      }
    } catch (error_) {
      console.error('Error enviando pedido por correo:', error_);
      const backendMessage = error_?.response?.data?.message || error_?.message || 'No se pudo enviar el correo';
      Swal.fire({ icon: 'error', title: 'Error', text: backendMessage, confirmButtonColor: '#fd7e14' });
    }
  }, [datos._id, correo, asunto, mensaje, onEmailSent]);

  const handlePrint = useCallback(() => {
    const source = document.getElementById('pdf-pedido-agendado-block');
    if (!source) {
      Swal.fire('Error', 'No se encontró el contenido para imprimir', 'error');
      return;
    }

    const existing = document.getElementById('print-root');
    if (existing) existing.remove();

    const clone = source.cloneNode(true);
    clone.style.padding = '8mm';
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.background = '#fff';
    clone.style.width = '100%';
    clone.style.fontSize = '12px';

    const printRoot = document.createElement('div');
    printRoot.id = 'print-root';
    printRoot.appendChild(clone);

    const prevDisplay = source.style.display;
    try {
      source.style.display = 'none';
      document.body.appendChild(printRoot);
    } catch (err) {
      console.warn('Could not append print root:', err);
    }

    const style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.textContent = buildPrintStyleText();
    document.head.appendChild(style);

    const A4_HEIGHT_PX = 1122;
    const doPrintAndCleanup = () => {
      try {
        globalThis.print();
      } catch (e) {
        console.error('Error al imprimir', e);
        Swal.fire('Error', 'No se pudo iniciar la impresión', 'error');
      } finally {
        setTimeout(() => {
          try { printRoot.remove(); } catch (err) { console.warn('No se pudo remover printRoot:', err); }
          try { style.remove(); } catch (err) { console.warn('No se pudo remover style:', err); }
          try { source.style.display = prevDisplay ?? ''; } catch (err) { console.warn('No se pudo restaurar display del original:', err); }
        }, 400);
      }
    };

    requestAnimationFrame(() => {
      const h = printRoot.scrollHeight;
      if (h > A4_HEIGHT_PX) {
        const scale = Math.max(0.75, A4_HEIGHT_PX / h);
        clone.style.transform = `scale(${scale})`;
        clone.style.transformOrigin = 'top left';
        clone.style.width = `${(100 / scale).toFixed(2)}%`;
      }
      setTimeout(doPrintAndCleanup, 40);
    });
  }, []);

  const handleRemisionarClick = useCallback(() => {
    if (typeof onRemisionar === 'function') {
      onRemisionar();
    } else {
      Swal.fire('Acción no disponible', 'No se pudo ejecutar la remisión (handler no definido).', 'warning');
    }
  }, [onRemisionar]);

  const renderDescripcion = () => {
    if (!datos?.descripcion) return null;
    const desc = datos.descripcion;
    const looksLikeHtml = typeof desc === 'string' && /<[^>]+>/.test(desc);
    if (looksLikeHtml) {
      const safeHtml = sanitizeHtml(desc);
      return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
    }
    return <div style={{ whiteSpace: 'pre-wrap' }}>{desc}</div>;
  };

  const renderProductosRows = () => {
    return (datos?.productos || []).map((producto, index) => {
      const key = producto._id || producto.product?._id || producto.codigo || producto.product?.codigo || index;
      const nombre = producto.product?.name || producto.product?.nombre || producto.nombre || 'Producto sin nombre';
      const precio = Number.parseFloat(producto.precioUnitario || 0) || 0;
      const cantidad = Number(producto.cantidad || 0);
      return (
        <tr key={key} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fafafa' : 'white' }}>
          <td style={{ padding: '1rem' }}>
            <div style={{ fontWeight: 'bold', color: '#333' }}>{nombre}</div>
            {producto.product?.categoria && <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>{producto.product.categoria}</div>}
          </td>
          <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{cantidad}</td>
          <td style={{ padding: '1rem', textAlign: 'right' }}>S/. {precio.toFixed(2)}</td>
          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>S/. {(cantidad * precio).toFixed(2)}</td>
        </tr>
      );
    });
  };

  return (
    <div style={STYLES.overlay}>
      <div style={STYLES.container}>
        <div style={STYLES.headerBar}>
          <div style={STYLES.headerLeft}>
            <i className="fa-solid fa-calendar-check" style={{ fontSize: '1.8rem' }} aria-hidden />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Pedido Agendado</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>N° {datos?.numeroPedido || 'Sin número'}</p>
            </div>
          </div>

          <div style={STYLES.headerActions}>
            <ActionButton onClick={handlePrint} aria="Imprimir pedido">
              <i className="fa-solid fa-print" style={{ fontSize: '1.2rem' }} aria-hidden />
            </ActionButton>

            <ActionButton onClick={abrirModalEnvio} aria="Enviar">
              <i className="fa-solid fa-envelope" aria-hidden />
              <span>Enviar</span>
            </ActionButton>

            <ActionButton onClick={handleRemisionarClick} aria="Remisionar">
              <i className="fa-solid fa-file-invoice" aria-hidden />
              <span>Remisionar</span>
            </ActionButton>

            <button onClick={onClose} style={{ ...STYLES.actionBtn(), padding: '0.75rem', fontSize: '1.2rem' }} aria-label="Cerrar">
              <i className="fa-solid fa-times" aria-hidden />
            </button>
          </div>
        </div>

        <div style={STYLES.contentWrap}>
          <div className="pdf-pedido-agendado" id="pdf-pedido-agendado-block" style={STYLES.pdfBlock} ref={pdfRef} onCopy={(e) => e.preventDefault()}>
            <div className="header" style={{ textAlign: 'center', color: 'white', marginBottom: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, #fd7e14, #e85d04)', borderRadius: '8px', fontSize: '1.8rem', fontWeight: 'bold' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <i className="fa-solid fa-calendar-check" style={{ fontSize: '2rem' }} aria-hidden />
                <div>
                  <div>PEDIDO AGENDADO</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '0.5rem' }}>N° {datos?.numeroPedido}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ borderBottom: '3px solid #fd7e14', paddingBottom: '0.5rem', color: '#fd7e14', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Información del Cliente</h3>
                <div style={{ lineHeight: '1.8' }}>
                  <p><strong>Cliente:</strong> {datos?.cliente?.nombre}</p>
                  <p><strong>Teléfono:</strong> {datos?.cliente?.telefono}</p>
                  <p><strong>Dirección:</strong> {datos?.cliente?.direccion}</p>
                  <p><strong>Ciudad:</strong> {datos?.cliente?.ciudad}</p>
                </div>
              </div>

              <div>
                <h3 style={{ borderBottom: '3px solid #fd7e14', paddingBottom: '0.5rem', color: '#fd7e14', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Detalles del Pedido</h3>
                <div style={{ lineHeight: '1.8' }}>
                  <p><strong>Fecha de agendamiento:</strong> {datos.fechaAgendamiento }</p>
                  <p><strong>Fecha de Entrega:</strong> {datos.fechaEntrega}</p>
                </div>
              </div>
            </div>

            {datos?.descripcion && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ borderBottom: '3px solid #fd7e14', paddingBottom: '0.5rem', color: '#fd7e14', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Descripción</h3>
                <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #fd7e14', lineHeight: '1.6' }}>
                  {renderDescripcion()}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '2rem' }}>

              <table className="tabla-cotizacion" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #fd7e14, #e85d04)', color: 'white' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Producto</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Cantidad</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Precio Unit.</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {renderProductosRows()}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'linear-gradient(135deg, #fff5e6, #ffe4cc)', borderTop: '2px solid #fd7e14' }}>
                    <td colSpan="3" style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: '#fd7e14' }}>TOTAL:</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.3rem', color: '#fd7e14' }}>S/. {Number(calcularTotal).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {datos?.condicionesPago && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ borderBottom: '3px solid #fd7e14', paddingBottom: '0.5rem', color: '#fd7e14', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Condiciones de Pago</h3>
                <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #fd7e14', lineHeight: '1.6' }}>{datos.condicionesPago}</div>
              </div>
            )}

            {datos?.observacion && (
              <div style={{ marginTop: '1rem' }}>
                {datos.observacion}
              </div>
            )}

            <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)', borderRadius: '8px', textAlign: 'center', borderTop: '3px solid #fd7e14' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fd7e14', marginBottom: '0.5rem' }}>JLA Global Company</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Gracias por su preferencia • Este pedido está programado para la fecha indicada</div>
            </div>
          </div>
        </div>

        {showEnviarModal && (
          <EnviarModal
            correo={correo} asunto={asunto} mensaje={mensaje}
            onClose={() => setShowEnviarModal(false)}
            onChangeCorreo={(e) => setCorreo(e.target.value)}
            onChangeAsunto={(e) => setAsunto(e.target.value)}
            onChangeMensaje={(e) => setMensaje(e.target.value)}
            onSend={enviarPorCorreo}
          />
        )}
      </div>
    </div>
  );
};

PedidoAgendadoPreview.propTypes = {
  datos: PropTypes.shape({
    _id: PropTypes.string, numeroPedido: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    codigo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), createdAt: PropTypes.string, fechaEntrega: PropTypes.string,
    cliente: PropTypes.shape({ nombre: PropTypes.string, correo: PropTypes.string, telefono: PropTypes.string, direccion: PropTypes.string, ciudad: PropTypes.string }),
    productos: PropTypes.arrayOf(PropTypes.shape({
      cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), precioUnitario: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      product: PropTypes.object, nombre: PropTypes.string
    })),
    estado: PropTypes.string, observacion: PropTypes.string, enviadoCorreo: PropTypes.bool
  }),
  onClose: PropTypes.func, onEmailSent: PropTypes.func, onRemisionar: PropTypes.func
};

PedidoAgendadoPreview.defaultProps = {
  datos: {}, onClose: () => { }, onEmailSent: undefined, onRemisionar: undefined
};

export default PedidoAgendadoPreview;
