import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import { getStoredUser, getCompanyName } from '../utils/emailHelpers';
import sanitizeHtml from '../utils/sanitizeHtml';
import { makeCotizacionTemplate } from '../utils/emailTemplates';
import { formatDate } from '../utils/formatters';
import { calcularTotales } from '../utils/calculations';

const buttonBaseStyle = {
  background: 'rgba(255, 255, 255, 0.2)',
  border: 'none',
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  color: '#0f172a',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.9rem',
  fontWeight: 'bold',
  transition: 'all 0.3s ease'
};
const smallButtonStyle = { ...buttonBaseStyle, padding: '0.75rem' };

function applyHoverHandlers() {
  return {
    onMouseEnter: (e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'; },
    onMouseLeave: (e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }
  };
}

async function openRemisionSwal(datos) {
  const fechaDefault = new Date().toISOString().split('T')[0];
  const swalConfig = {
    title: '<i class="fa-solid fa-file-invoice" style="color: #2563eb; margin-right: 12px;"></i>Remisionar Cotización',
    html: `
      <div style="text-align: left; padding: 20px; background: linear-gradient(135deg, #f8fafc, #e2e8f0); border-radius: 12px; margin: 20px 0;">
        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
          <h4 style="margin: 0 0 12px 0; color: #2563eb; font-size: 16px;">
            <i class="fa-solid fa-info-circle"></i> Información de la Cotización
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
            <p style="margin: 4px 0;"><strong>Código:</strong> ${datos?.codigo || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Cliente:</strong> ${datos?.cliente?.nombre || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Productos:</strong> ${datos?.productos?.length || 0} items</p>
            <p style="margin: 4px 0;"><strong>Total:</strong> S/. ${(datos?.total || 0).toLocaleString('es-ES')}</p>
          </div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="margin-bottom: 20px;">
            <label for="fechaEntrega" style="display: block; margin-bottom: 8px; font-weight: bold; color: #374151; font-size: 14px;">
              <i class="fa-solid fa-truck" style="color: #059669; margin-right: 8px;"></i>
              <span>Fecha de Entrega</span> <span style="color: #ef4444;">*</span>
            </label>
            <input type="date" id="fechaEntrega" value="${fechaDefault}" style="width:100%; padding:12px; border-radius:8px; border:2px solid #e5e7eb; background:#f9fafb;" />
            <small style="color:#6b7280; font-size:12px; display:block; margin-top:4px;">Fecha de entrega de los productos</small>
          </div>
          <div style="margin-bottom: 16px;">
            <label for="observaciones" style="display:block; margin-bottom:8px; font-weight:bold; color:#374151; font-size:14px;">
              <i class="fa-solid fa-comment-dots" style="color: #8b5cf6; margin-right: 8px;"></i>
              <span>Observaciones</span>
            </label>
            <textarea id="observaciones" placeholder="Ingrese observaciones adicionales para la remisión..." rows="4" style="width:100%; padding:12px; border-radius:8px; border:2px solid #e5e7eb; background:#f9fafb; min-height:100px;"></textarea>
            <small style="color:#6b7280; font-size:12px; display:block; margin-top:4px;">Estas observaciones aparecerán tanto en el pedido como en la remisión</small>
          </div>
          <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding:16px; border-radius:8px; border-left:4px solid #f59e0b; margin-top:20px;">
            <h5 style="margin:0 0 8px 0; color:#92400e; font-size:14px;">
              <i class="fa-solid fa-lightbulb"></i> ¿Qué se creará?
            </h5>
            <ul style="margin:0; padding-left:20px; color:#92400e; font-size:13px; line-height:1.6;">
              <li><strong>🚚 Remisión:</strong> Se listará un nuevo pedido entregado</li>
              <li><strong>📄 Cotización:</strong> Se marcará como "Remisionada"</li>
            </ul>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="fa-solid fa-truck" style="margin-right: 8px;"></i>Entregar y Remisionar',
    cancelButtonText: '<i class="fa-solid fa-times" style="margin-right: 8px;"></i>Cancelar',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
    width: '600px',
    focusConfirm: false,
    preConfirm: () => {
      const popup = Swal.getPopup ? Swal.getPopup() : document;
      const fechaEl = popup ? popup.querySelector('#fechaEntrega') : document.getElementById('fechaEntrega');
      const obsEl = popup ? popup.querySelector('#observaciones') : document.getElementById('observaciones');
      const fechaEntrega = fechaEl ? fechaEl.value : '';
      const observaciones = obsEl ? obsEl.value : '';
      if (!fechaEntrega) {
        Swal.showValidationMessage(`<div style="text-align:left;color:#dc2626;"><i class="fa-solid fa-exclamation-circle"></i> <strong>La fecha de entrega es requerida</strong><br><small>Por favor seleccione una fecha para continuar</small></div>`);
        return { valid: false };
      }
      const fechaSeleccionada = new Date(fechaEntrega);
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      if (fechaSeleccionada < hoy) {
        Swal.showValidationMessage(`<div style="text-align:left;color:#dc2626;"><i class="fa-solid fa-calendar-xmark"></i> <strong>La fecha de entrega no puede ser anterior a hoy</strong><br><small>Por favor seleccione una fecha válida</small></div>`);
        return { valid: false };
      }
      return { valid: true, fechaEntrega, observaciones: (observaciones || '').trim() };
    }
  };
  const { value: formValues } = await Swal.fire(swalConfig);
  return formValues?.valid ? formValues : null;
}

function SendEmailModal({ correo, setCorreo, asunto, setAsunto, mensaje, setMensaje, onClose, onSend }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '10px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
        <h3 style={{ marginBottom: '1rem', color: '#2563eb' }}>
          <i className="fa-solid fa-envelope icon-gap" aria-hidden={true}></i>
          <span>Enviar Cotización por Correo</span>
        </h3>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="correo-destinatario-cotizacion" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Correo del destinatario:</label>
          <input id="correo-destinatario-cotizacion" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="ejemplo@correo.com" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="asunto-cotizacion" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Asunto:</label>
          <input id="asunto-cotizacion" type="text" value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Asunto del correo" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="mensaje-cotizacion" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Mensaje:</label>
          <textarea id="mensaje-cotizacion" value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Escriba un mensaje personalizado..." rows="8" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', resize: 'vertical', fontFamily: 'monospace' }} />
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={onSend} style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', backgroundColor: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
            <i className="fa-solid fa-envelope icon-gap" aria-hidden={true}></i>
            <span>Enviar Cotización</span>
          </button>
        </div>
      </div>
    </div>
  );
}

SendEmailModal.propTypes = {
  correo: PropTypes.string,
  setCorreo: PropTypes.func.isRequired,
  asunto: PropTypes.string,
  setAsunto: PropTypes.func.isRequired,
  mensaje: PropTypes.string,
  setMensaje: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
};

SendEmailModal.defaultProps = {
  correo: '',
  asunto: '',
  mensaje: '',
};

export default function CotizacionPreview({ datos, onClose, onEmailSent, onRemisionCreated, onEdit }) {
  const navigate = useNavigate();
  const usuario = getStoredUser();
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [correo, setCorreo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  const COMPANY_NAME = getCompanyName();
  const COMPANY_PHONE = process.env.REACT_APP_COMPANY_PHONE || process.env.COMPANY_PHONE || '(555) 123-4567';

  const isRemisionada = Boolean(
    datos?.remision ||
    datos?.remisionId ||
    datos?.numeroRemision ||
    datos?.remisionada ||
    (typeof datos?.estado === 'string' && datos.estado.trim().toLowerCase() === 'remisionada')
  );

  const totalCalculado = useMemo(() => {
    try {
      return calcularTotales(datos?.productos || []).total;
    } catch (e) {
      console.error('Error calculando totales en CotizacionPreview:', e);
      return 0;
    }
  }, [datos]);

  const abrirModalEnvio = () => {
    setCorreo(datos?.cliente?.correo || '');
    const template = makeCotizacionTemplate(datos, usuario) || {};
    setAsunto(template.asunto || '');
    setMensaje(template.mensaje || '');
    setShowEnviarModal(true);
  };

  const enviarPorCorreo = async () => {
    try {
      const res = await api.post(`/api/cotizaciones/${datos._id}/enviar-correo`, {
        cotizacionId: datos._id,
        correoDestino: correo,
        asunto: asunto,
        mensaje: mensaje
      });

      if (res.status >= 200 && res.status < 300) {
        Swal.fire({ icon: 'success', title: 'Correo enviado', text: 'La cotización ha sido enviada exitosamente', confirmButtonColor: '#2563eb' });
        setShowEnviarModal(false);
        if (datos) datos.enviadoCorreo = true;
        if (onEmailSent) onEmailSent(datos._id);
      } else {
        throw new Error('Error al enviar correo');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo enviar el correo', confirmButtonColor: '#2563eb' });
    }
  };

  const remisionarCotizacion = async () => {
    try {
      const formValues = await openRemisionSwal(datos);
      if (!formValues) return;

      Swal.fire({ title: 'remisionando cotización...', allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });

      const res = await api.post(`/api/cotizaciones/${datos._id}/remisionar`, {
        cotizacionId: datos._id,
        fechaEntrega: formValues.fechaEntrega,
        observaciones: formValues.observaciones
      });

      const result = res.data || res;

      if (res.status >= 200 && res.status < 300) {
        // Extraer documento de remisión creado (esperado en result.remision)
        const nuevaRemision = result.remision || result.data || result;
        // Cerrar la vista previa actual
        onClose();
        // Navegar a PedidosEntregados con estado para auto abrir RemisionPreview y mostrar toast
        try { if (onRemisionCreated) onRemisionCreated(datos._id, result); } catch (e) { console.error('Error calling onRemisionCreated callback:', e); }
        navigate('/PedidosEntregados', {
          state: {
            autoPreviewRemision: nuevaRemision,
            highlightRemisionId: nuevaRemision?._id,
            toast: 'cotizacion remisionada'
          }
        });
      } else {
        throw new Error(result.message || 'Error al remisionar');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({ icon: 'error', title: 'Error al Remisionar', text: error.message || 'No se pudo convertir la cotización a pedido', confirmButtonColor: '#dc2626' });
    }
  };

  const handlePrint = () => {
    const source = document.getElementById('pdf-cotizacion-block');
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
        const printFn = globalThis?.print;




        if (typeof printFn === 'function') printFn();
        else throw new Error('Print function not available');
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
  };

  const hoverHandlers = applyHoverHandlers();
  const hoverSmallHandlers = applyHoverHandlers();

  return (
    <div className="modal-cotizacion-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '0', maxWidth: '95vw', maxHeight: '95vh', width: '1000px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <i className="fa-solid fa-file-lines" style={{ fontSize: '1.8rem' }} aria-hidden={true}></i>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Cotización</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>N° {datos.codigo || 'Sin código'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {datos.tipo !== 'pedido' && !isRemisionada && (
              <button
                onClick={() => {
                  if (typeof onEdit === 'function') {
                    // prefer parent handler to fetch and open edit modal
                    try { onEdit(datos); } catch (e) { console.error('onEdit error', e); }
                  } else {
                    // fallback: close preview and navigate to RegistrarCotizacion
                    onClose();
                    navigate('/RegistrarCotizacion', { state: { datos } });
                  }
                }}
                style={buttonBaseStyle}
                {...hoverHandlers}
              >
                <i className="fa-solid fa-pen" aria-hidden={true}></i>
                <span>Editar</span>
              </button>
            )}

            {datos.tipo !== 'pedido' && !isRemisionada && (
              <button onClick={remisionarCotizacion} style={buttonBaseStyle} {...hoverHandlers}>
                <i className="fa-solid fa-file-invoice" aria-hidden={true}></i>
                <span>Remisionar</span>
              </button>
            )}

            <button aria-label="Imprimir cotización" onClick={handlePrint} style={smallButtonStyle} {...hoverSmallHandlers}>
              <i className="fa-solid fa-print icon-gap" style={{ fontSize: '1.2rem' }} aria-hidden={true}></i>
            </button>

            <button onClick={abrirModalEnvio} style={{ ...buttonBaseStyle, color: 'white' }} {...hoverHandlers}>
              <i className="fa-solid fa-envelope" aria-hidden={true}></i>
              <span>Enviar</span>
            </button>

            <button aria-label="Cerrar vista previa" onClick={onClose} style={smallButtonStyle} {...hoverSmallHandlers}>
              <i className="fa-solid fa-times" aria-hidden={true}></i>
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '2rem', backgroundColor: '#f8f9fa' }}>
          <div className="pdf-cotizacion" id="pdf-cotizacion-block" style={{ display: 'flex', flexDirection: 'column', background: '#fff', padding: '1rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginTop: '1rem', userSelect: 'none' }} onCopy={(e) => e.preventDefault()}>
            <div className="header" style={{ textAlign: 'center', color: 'white', marginBottom: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: '8px', fontSize: '1.8rem', fontWeight: 'bold' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <i className="fa-solid fa-file-lines" style={{ fontSize: '2rem' }} aria-hidden={true}></i>
                <div>
                  <div>COTIZACIÓN</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '0.5rem' }}>N° {datos?.codigo}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ borderBottom: '3px solid #2563eb', paddingBottom: '0.5rem', color: '#2563eb', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Información Cliente</h3>
                <div style={{ lineHeight: '1.8' }}>
                  <p style={{ margin: 0 }}><strong>Nombre:</strong> {datos?.cliente?.nombre}</p>
                  <p style={{ margin: 0 }}><strong>Dirección:</strong> {datos?.cliente?.direccion}</p>
                  <p style={{ margin: 0 }}><strong>Ciudad:</strong> {datos?.cliente?.ciudad}</p>
                  <p style={{ margin: 0 }}><strong>Teléfono:</strong> {datos?.cliente?.telefono}</p>
                </div>
              </div>

              <div>
                <h3 style={{ borderBottom: '3px solid #2563eb', paddingBottom: '0.5rem', color: '#2563eb', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Información Empresa</h3>
                <div style={{ lineHeight: '1.8' }}>
                  <p><strong>Fecha de cotización:</strong> {formatDate(datos)}</p>
                  <p><strong>Empresa:</strong> {COMPANY_NAME || (process.env.REACT_APP_COMPANY_NAME || process.env.COMPANY_NAME || '')}</p>
                  <p><strong>Teléfono:</strong> {COMPANY_PHONE}</p>
                </div>
              </div>
            </div>

            {datos?.descripcion && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ borderBottom: '3px solid #2563eb', paddingBottom: '0.5rem', color: '#2563eb', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Descripción</h3>
                <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #2563eb', lineHeight: '1.6' }}>
                  {(() => {
                    const desc = datos.descripcion;
                    const looksLikeHtml = typeof desc === 'string' && /<[^>]+>/.test(desc);
                    if (looksLikeHtml) {
                      const safeHtml = sanitizeHtml(desc);
                      return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
                    }
                    return <div style={{ whiteSpace: 'pre-wrap' }}>{desc}</div>;
                  })()}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
              <table className="tabla-cotizacion" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Producto</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Cantidad</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Precio Unit.</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {datos?.productos?.map((producto, index) => (
                    <tr key={producto.producto?.id || producto.product?._id || producto.codigo || producto._id || index} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fafafa' : 'white' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 'bold', color: '#333' }}>{producto.producto?.name || producto.product?.nombre || producto.nombre || 'Producto sin nombre'}</div>
                        {(producto.producto?.categoria || producto.product?.categoria) && <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>{producto.producto?.categoria || producto.product?.categoria}</div>}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{producto.cantidad}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>S/. {Number.parseFloat(producto.valorUnitario || producto.precioUnitario || 0).toFixed(2)}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>S/. {Number.parseFloat(producto.subtotal || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderTop: '2px solid #2563eb' }}>
                    <td colSpan="3" style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: '#2563eb' }}>TOTAL:</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.3rem', color: '#2563eb' }}>S/. {(datos?.total || totalCalculado).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {datos?.condicionesPago && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ borderBottom: '3px solid #2563eb', paddingBottom: '0.5rem', color: '#2563eb', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Condiciones de Pago</h3>
                <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #2563eb', lineHeight: '1.6' }}>{datos.condicionesPago}</div>
              </div>
            )}

            <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)', borderRadius: '8px', textAlign: 'center', borderTop: '3px solid #2563eb' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '0.5rem' }}>JLA Global Company</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Gracias por su preferencia • Cotización válida por {datos?.validez || '15 días'}</div>
            </div>
          </div>
        </div>

        {showEnviarModal && (
          <SendEmailModal
            correo={correo}
            setCorreo={setCorreo}
            asunto={asunto}
            setAsunto={setAsunto}
            mensaje={mensaje}
            setMensaje={setMensaje}
            onClose={() => setShowEnviarModal(false)}
            onSend={enviarPorCorreo}
          />
        )}
      </div>
    </div>
  );
}

CotizacionPreview.propTypes = {
  datos: PropTypes.shape({
    _id: PropTypes.string,
    numeroPedido: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    codigo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fecha: PropTypes.string,
    fechaEntrega: PropTypes.string,
    estado: PropTypes.string,
    descripcion: PropTypes.string,
    condicionesPago: PropTypes.string,
    validez: PropTypes.string,
    tipo: PropTypes.string,
    fechaVencimiento: PropTypes.string,
    cliente: PropTypes.shape({
      nombre: PropTypes.string,
      correo: PropTypes.string,
      telefono: PropTypes.string,
      direccion: PropTypes.string,
      ciudad: PropTypes.string,
    }),
    empresa: PropTypes.shape({
      nombre: PropTypes.string,
      direccion: PropTypes.string,
    }),
    productos: PropTypes.arrayOf(PropTypes.shape({
      producto: PropTypes.object,
      nombre: PropTypes.string,
      descripcion: PropTypes.string,
      cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      valorUnitario: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      descuento: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })),
    remision: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    remisionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    numeroRemision: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    remisionada: PropTypes.bool,
    total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    enviadoCorreo: PropTypes.bool,
  }).isRequired,
  onClose: PropTypes.func,
  onEmailSent: PropTypes.func,
  onRemisionCreated: PropTypes.func,
  onEdit: PropTypes.func,
};

CotizacionPreview.defaultProps = {
  onClose: () => { },
  onEmailSent: () => { },
  onRemisionCreated: () => { },
  onEdit: null,
};
