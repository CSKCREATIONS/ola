import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import { getStoredUser } from '../utils/emailHelpers';
import { makePedidoCanceladoTemplate } from '../utils/emailTemplates';
import { formatDate } from '../utils/formatters';
import { calcularTotales } from '../utils/calculations';

const STYLES = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
  },
  container: {
    backgroundColor: 'white', borderRadius: '15px', padding: 0,
    maxWidth: '95vw', maxHeight: '95vh', width: '1000px',
    display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden'
  },
  header: {
    background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white',
    padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  scrollArea: { flex: 1, overflow: 'auto', padding: '2rem', backgroundColor: '#f8f9fa' },
  pdfBlock: {
    display: 'flex', flexDirection: 'column', background: '#fff', padding: '2rem',
    borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginTop: '1rem',
    userSelect: 'none'
  },
  modalBackdrop: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  emailModal: {
    backgroundColor: 'white', padding: '2rem', borderRadius: '10px',
    maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto'
  }
};

function HeaderActions({ onPrint, onOpenEmail, onClose }) {
  const btnBase = {
    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px',
    padding: '0.75rem', color: 'white', cursor: 'pointer', display: 'flex',
    alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={{ display: 'flex', gap: '.5rem' }}>
      <button
        onClick={onPrint}
        style={btnBase}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
        aria-label="Imprimir pedido cancelado"
        title="Imprimir"
      >
        <i className="fa-solid fa-print" style={{ fontSize: '1.2rem' }} aria-hidden="true" />
      </button>

      <button
        onClick={onOpenEmail}
        style={{ ...btnBase, padding: '0.75rem 1rem' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
        aria-label="Enviar por correo"
        title="Enviar"
      >
        <i className="fa-solid fa-envelope" aria-hidden="true" />
        <span>Enviar</span>
      </button>

      <button
        onClick={onClose}
        style={{
          background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px',
          padding: '0.75rem', color: 'white', cursor: 'pointer', display: 'flex',
          alignItems: 'center', fontSize: '1.2rem', transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
        aria-label="Cerrar"
        title="Cerrar"
      >
        <i className="fa-solid fa-times" aria-hidden="true" />
      </button>
    </div>
  );
}

HeaderActions.propTypes = {
  onPrint: PropTypes.func.isRequired,
  onOpenEmail: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

function SendEmailModal({ correo, asunto, mensaje, setCorreo, setAsunto, setMensaje, onCancel, onSend }) {
  return (
    <div style={STYLES.modalBackdrop}>
      <div style={STYLES.emailModal}>
        <h3 style={{ marginBottom: '1rem', color: '#dc2626' }}>
          <i className="fa-solid fa-envelope" aria-hidden="true" /> <span>Enviar Notificación de Cancelación</span>
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="input-email-dest" style={{ display: 'block', marginBottom: '.5rem', fontWeight: 'bold' }}>
            Correo del destinatario:
          </label>
          <input
            id="input-email-dest"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="ejemplo@correo.com"
            style={{ width: '100%', padding: '.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="input-email-subject" style={{ display: 'block', marginBottom: '.5rem', fontWeight: 'bold' }}>
            Asunto:
          </label>
          <input
            id="input-email-subject"
            type="text"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Asunto del correo"
            style={{ width: '100%', padding: '.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="input-email-body" style={{ display: 'block', marginBottom: '.5rem', fontWeight: 'bold' }}>
            Mensaje:
          </label>
          <textarea
            id="input-email-body"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escriba un mensaje personalizado..."
            rows="8"
            style={{ width: '100%', padding: '.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', resize: 'vertical', fontFamily: 'monospace' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '.75rem 1.5rem', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={onSend} style={{ padding: '.75rem 1.5rem', border: 'none', borderRadius: '6px', backgroundColor: '#dc2626', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
            <i className="fa-solid fa-envelope" aria-hidden="true" /> <span>Enviar Notificación</span>
          </button>
        </div>
      </div>
    </div>
  );
}

SendEmailModal.propTypes = {
  correo: PropTypes.string,
  asunto: PropTypes.string,
  mensaje: PropTypes.string,
  setCorreo: PropTypes.func.isRequired,
  setAsunto: PropTypes.func.isRequired,
  setMensaje: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
};

export default function PedidoCanceladoPreview({ datos = {}, onClose = () => {}, onEmailSent }) {
  const usuario = useMemo(() => getStoredUser(), []);
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [correo, setCorreo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviadoLocal, setEnviadoLocal] = useState(Boolean(datos.enviadoCorreo));

  useEffect(() => {
    if (datos?.cliente?.correo) setCorreo(datos.cliente.correo);
  }, [datos]);

  const calcularTotal = useMemo(() => {
    try {
      const t = Number(calcularTotales(datos?.productos || []).total);
      return Number.isFinite(t) ? t : 0;
    } catch (err) {
      console.error('calcularTotal error', err);
      return 0;
    }
  }, [datos]);

  const abrirModalEnvio = useCallback(() => {
    const tpl = makePedidoCanceladoTemplate(datos, usuario) || {};
    setCorreo(datos?.cliente?.correo || tpl.correoDestino || '');
    setAsunto(tpl.asunto || '');
    setMensaje(tpl.mensaje || '');
    setShowEnviarModal(true);
  }, [datos, usuario]);

  const handlePrint = useCallback(() => {
    const source = document.getElementById('pdf-cancelado-block');
    if (!source) {
      Swal.fire('Error', 'No se encontró el contenido para imprimir', 'error');
      return;
    }

    // remove any previous print roots to avoid duplicates
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
    // hide the original source while printing to ensure only clone is visible
    const prevDisplay = source.style.display;
    try {
      source.style.display = 'none';
      document.body.appendChild(printRoot);
    } catch (err) {
      console.warn('Could not append print root:', err);
    }
    const style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.textContent = `@page { size: A4 portrait; margin: 8mm; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body * { visibility: hidden !important; }
      #print-root, #print-root * { visibility: visible !important; }
      #print-root { position: fixed; inset: 0; margin:0; padding:0; background:#fff; }
      table { page-break-inside: avoid; } }`;
      
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
        clone.style.width = `${(100/scale).toFixed(2)}%`;
      }
      setTimeout(doPrintAndCleanup, 40);
    });
  }, []);

  const enviarPorCorreo = useCallback(async () => {
    if (!correo) {
      Swal.fire({ icon: 'warning', title: 'Correo requerido', text: 'Ingrese un correo de destino', confirmButtonColor: '#dc2626' });
      return;
    }

    try {
      const payload = {
        pedidoId: datos._id,
        correoDestino: correo,
        asunto,
        mensaje
      };
      const response = await api.post(`/api/pedidos/${datos._id}/enviar-cancelado`, payload);

      if (response && response.status >= 200 && response.status < 300) {
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'La notificación de cancelación ha sido enviada exitosamente',
          confirmButtonColor: '#dc2626'
        });
        setShowEnviarModal(false);
        setEnviadoLocal(true);
        if (onEmailSent) onEmailSent(datos._id);
      } else {
        throw new Error('Error al enviar correo');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo enviar el correo', confirmButtonColor: '#dc2626' });
    }
  }, [correo, asunto, mensaje, datos, onEmailSent]);

  return (
    <div style={STYLES.overlay}>
      <div style={STYLES.container}>
        <div style={STYLES.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <i className="fa-solid fa-ban" style={{ fontSize: '1.8rem' }} aria-hidden="true" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Pedido Cancelado</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '.95rem' }}>N° {datos?.numeroPedido || 'Sin número'}</p>
            </div>
          </div>

          <HeaderActions onPrint={handlePrint} onOpenEmail={abrirModalEnvio} onClose={onClose} />
        </div>

        <div style={STYLES.scrollArea}>
          <div
            className="pdf-pedido-cancelado"
            id="pdf-cancelado-block"
            style={STYLES.pdfBlock}
            onCopy={(e) => e.preventDefault()}
          >
            <div className="header" style={{
              textAlign: 'center', color: 'white', marginBottom: '2rem', padding: '1.5rem',
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)', borderRadius: '8px',
              fontSize: '1.8rem', fontWeight: 'bold'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <i className="fa-solid fa-ban" style={{ fontSize: '2rem' }} />
                <div>
                  <div>PEDIDO CANCELADO</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '.5rem' }}>N° {datos?.numeroPedido}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ borderBottom: '3px solid #dc2626', paddingBottom: '.5rem', color: '#dc2626', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                  Información del Cliente
                </h3>
                <div style={{ lineHeight: '1.8' }}>
                  <p><strong>Cliente:</strong> {datos.cliente?.nombre || 'Cliente no especificado'}</p>
                  <p><strong>Teléfono:</strong> {datos.cliente?.telefono || 'No especificado'}</p>
                  <p><strong>Email:</strong> {datos.cliente?.correo || 'Sin correo'} </p>
                  <p><strong>Dirección:</strong> {datos.cliente?.direccion || 'Dirección no especificada'} {datos.cliente?.ciudad || 'Ciudad no especificada'}</p>
                </div>
              </div>

              <div>
                <h3 style={{ borderBottom: '3px solid #dc2626', paddingBottom: '.5rem', color: '#dc2626', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                  Detalles de la Cancelación
                </h3>
                <div style={{ lineHeight: '1.8' }}>
                  <p><strong>Fecha de agendamiento:</strong> {formatDate(datos?.fechaAgendamiento)}</p>
                  <p><strong>F. Entrega estipulada:</strong> {formatDate(datos?.fechaEntrega)}</p>
                  <p><strong>Fecha de Cancelación:</strong> {formatDate(new Date())}</p>
                  
                </div>
              </div>
            </div>

            {datos?.motivoCancelacion && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ borderBottom: '3px solid #dc2626', paddingBottom: '.5rem', color: '#dc2626', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                  Motivo de Cancelación
                </h3>
                <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #dc2626', lineHeight: '1.6' }}>
                  {datos.motivoCancelacion}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
              <table className="tabla-cotizacion" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Producto</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Cantidad</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Precio Unit.</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {datos?.productos?.map((producto, index) => {
                    const key = producto._id || producto.product?._id || producto.codigo || producto.product?.codigo || index;
                    const nombre = producto.product?.name || producto.product?.nombre || producto.nombre || 'Producto sin nombre';
                    const cantidad = Number(producto.cantidad) || 0;
                    const precioUnit = Number.parseFloat(producto.precioUnitario || 0) || 0;
                    return (
                      <tr key={key} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fafafa' : 'white', opacity: 0.7 }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 'bold', color: '#333', textDecoration: 'line-through' }}>{nombre}</div>
                          {producto.product?.categoria && <div style={{ fontSize: '.9rem', color: '#666', marginTop: '.25rem' }}>{producto.product.categoria}</div>}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{cantidad}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>S/. {precioUnit.toFixed(2)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>S/. {(cantidad * precioUnit).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', borderTop: '2px solid #dc2626', opacity: 0.7 }}>
                    <td colSpan="3" style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: '#dc2626', textDecoration: 'line-through' }}>
                      TOTAL CANCELADO:
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.3rem', color: '#dc2626', textDecoration: 'line-through' }}>
                      S/. {Number(calcularTotal).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)', borderRadius: '8px', textAlign: 'center', borderTop: '3px solid #dc2626' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '.5rem' }}>JLA Global Company</div>
              <div style={{ fontSize: '.9rem', color: '#666' }}>Lamentamos los inconvenientes • Pedido cancelado</div>
              <div style={{ marginTop: '.75rem', fontSize: '.85rem', color: '#666' }}>{enviadoLocal ? 'Notificación enviada' : ''}</div>
            </div>
          </div>
        </div>

        {showEnviarModal && (
          <SendEmailModal
            correo={correo}
            asunto={asunto}
            mensaje={mensaje}
            setCorreo={setCorreo}
            setAsunto={setAsunto}
            setMensaje={setMensaje}
            onCancel={() => setShowEnviarModal(false)}
            onSend={enviarPorCorreo}
          />
        )}
      </div>
    </div>
  );
}

PedidoCanceladoPreview.propTypes = {
  datos: PropTypes.shape({
    _id: PropTypes.string,
    numeroPedido: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    codigo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    createdAt: PropTypes.string,
    fecha: PropTypes.string,
    cliente: PropTypes.shape({
      nombre: PropTypes.string,
      correo: PropTypes.string,
      telefono: PropTypes.string,
      direccion: PropTypes.string,
      ciudad: PropTypes.string,
    }),
    productos: PropTypes.arrayOf(
      PropTypes.shape({
        cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        precioUnitario: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        product: PropTypes.object,
        nombre: PropTypes.string,
      })
    ),
    estado: PropTypes.string,
    motivoCancelacion: PropTypes.string,
    enviadoCorreo: PropTypes.bool,
  }),
  onClose: PropTypes.func,
  onEmailSent: PropTypes.func,
};
