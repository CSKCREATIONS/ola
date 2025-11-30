import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import './FormatoCotizacion.css';
import api from '../api/axiosConfig';
import {
  getStoredUser,
  formatDateIso,
  getCompanyName
} from '../utils/emailHelpers';
import { randomString } from '../utils/secureRandom';
import { calcularTotales } from '../utils/calculations';
import sanitizeHtml from '../utils/sanitizeHtml';

/* global globalThis */

const STYLES = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem'
  },
  dialog: {
    backgroundColor: 'white', borderRadius: '15px', padding: 0,
    maxWidth: '95vw', maxHeight: '95vh', width: '1000px',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', overflow: 'hidden'
  },
  header: {
    background: 'linear-gradient(135deg, #059669, #065f46)',
    color: 'white', padding: '1.5rem 2rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  headerInner: { display: 'flex', alignItems: 'center', gap: '1rem' },
  iconBtn: {
    background: 'rgba(255, 255, 255, 0.2)', border: 'none', borderRadius: '8px',
    padding: '0.75rem', color: 'white', cursor: 'pointer', display: 'flex',
    alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold',
    transition: 'all 0.15s ease'
  },
  contentWrap: {
    flex: 1, overflow: 'auto', padding: '2rem', backgroundColor: '#f8f9fa'
  },
  pdfBlock: {
    display: 'flex', flexDirection: 'column', background: '#fff',
    padding: '2rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginTop: '1rem', userSelect: 'none'
  },
  modalBackdrop: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1000
  }
};

/* ---------- Helpers ---------- */

function useUsuario() {
  return useMemo(() => {
    const usuarioStorage = getStoredUser() || {};
    return {
      firstName: usuarioStorage.firstName || 'Equipo',
      surname: usuarioStorage.surname || 'Pangea',
      email: usuarioStorage.email || 'info@pangea.com',
      telefono: usuarioStorage.telefono || '000-000-000',
      ...usuarioStorage
    };
  }, []);
}

function buildDefaults(datos = {}) {
  const productosDefault = [
    {
      nombre: 'Producto de ejemplo',
      cantidad: 1,
      precioUnitario: 100,
      total: 100,
      descripcion: 'Descripción de ejemplo'
    }
  ];

  return {
    numeroRemision: datos.numeroRemision || 'REM-000',
    codigoPedido: datos.codigoPedido || 'PED-000',
    fechaRemision: datos.fechaRemision || new Date().toISOString(),
    fechaEntrega: datos.fechaEntrega || new Date().toISOString(),
    estado: datos.estado || 'activa',
    total: datos.total ?? 0,
    cliente: {
      nombre: datos.cliente?.nombre || 'Cliente de prueba',
      correo: datos.cliente?.correo || 'cliente@ejemplo.com',
      telefono: datos.cliente?.telefono || '123456789',
      direccion: datos.cliente?.direccion || 'Dirección de ejemplo',
      ciudad: datos.cliente?.ciudad || 'Ciudad de ejemplo',
      ...datos.cliente
    },
    productos: Array.isArray(datos.productos) && datos.productos.length ? datos.productos : productosDefault,
    ...datos
  };
}

/* ---------- Reusable UI ---------- */

function IconButton({ onClick, children, title, style }) {
  const base = { ...STYLES.iconBtn, ...style };
  const onEnter = e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
  const onLeave = e => e.currentTarget.style.background = base.background;
  return (
    <button
      onClick={onClick}
      style={base}
      title={title}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      aria-label={title}
    >
      {children}
    </button>
  );
}

IconButton.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node,
  title: PropTypes.string,
  style: PropTypes.object
};

/* ---------- PrintButton ---------- */

const PrintButton = React.memo(function PrintButton({ numeroRemision, getPrintContent }) {
  const onPrint = useCallback(() => {
    const contentHtml = getPrintContent();
    const safeHtml = sanitizeHtml(contentHtml || '');

    // remove any previous print roots to avoid duplicates
    const existing = document.getElementById('print-root');
    if (existing) existing.remove();

    const clone = document.createElement('div');
    clone.innerHTML = safeHtml;
    clone.style.padding = '8mm';
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.background = '#fff';
    clone.style.width = '100%';
    clone.style.fontSize = '12px';

    const printRoot = document.createElement('div');
    printRoot.id = 'print-root';
    printRoot.appendChild(clone);
    document.body.appendChild(printRoot);

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
      try { globalThis.print(); } catch (e) { console.error('Error al imprimir', e); }
      setTimeout(() => {
        try { printRoot.remove(); } catch (err) { console.warn('No se pudo remover printRoot:', err); }
        try { style.remove(); } catch (err) { console.warn('No se pudo remover style:', err); }
      }, 400);
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
  }, [getPrintContent, numeroRemision]);

  return (
    <IconButton onClick={onPrint} title="Imprimir remisión">
      <i className="fa-solid fa-print icon-gap" style={{ fontSize: '1.2rem' }} aria-hidden />
    </IconButton>
  );
});

PrintButton.propTypes = {
  numeroRemision: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  getPrintContent: PropTypes.func.isRequired
};

/* ---------- SendModal ---------- */

const SendModal = React.memo(function SendModal({ visible, correo, asunto, mensaje, onChange, onCancel, onSend }) {
  if (!visible) return null;
  return (
    <div style={STYLES.modalBackdrop}>
      <div style={{
        backgroundColor: 'white', padding: '2rem', borderRadius: '10px',
        maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#059669' }}>
          <i className="fa-solid fa-envelope icon-gap" aria-hidden />
          <span>Enviar Remisión por Correo</span>
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="correo-remision-preview" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Correo del destinatario:
          </label>
          <input id="correo-remision-preview" type="email" value={correo} onChange={e => onChange('correo', e.target.value)}
            placeholder="ejemplo@correo.com" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }} required />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="asunto-remision-preview" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Asunto:
          </label>
          <input id="asunto-remision-preview" type="text" value={asunto} onChange={e => onChange('asunto', e.target.value)}
            placeholder="Asunto del correo" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }} />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="mensaje-remision-preview" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Mensaje:
          </label>
          <textarea id="mensaje-remision-preview" value={mensaje} onChange={e => onChange('mensaje', e.target.value)} placeholder="Escriba un mensaje personalizado..."
            rows="8" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', resize: 'vertical', fontFamily: 'monospace' }} />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '0.75rem 1.5rem', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={onSend} style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', backgroundColor: '#059669', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
            <i className="fa-solid fa-envelope icon-gap" aria-hidden /><span>Enviar Remisión</span>
          </button>
        </div>
      </div>
    </div>
  );
});

SendModal.propTypes = {
  visible: PropTypes.bool,
  correo: PropTypes.string,
  asunto: PropTypes.string,
  mensaje: PropTypes.string,
  onChange: PropTypes.func,
  onCancel: PropTypes.func,
  onSend: PropTypes.func
};

/* ---------- ProductsTable (memo) ---------- */

const ProductsTable = React.memo(function ProductsTable({ productos, total }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <table className="tabla-cotizacion" style={{
        width: '100%', borderCollapse: 'collapse', marginTop: '1rem',
        borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <thead>
          <tr style={{ background: 'linear-gradient(135deg, #059669, #065f46)', color: 'white' }}>
            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Cant.</th>
            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Producto</th>
            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Descripción</th>
            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Valor Unit.</th>
            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {productos && productos.length > 0 ? productos.map((p, idx) => (
            <tr key={p.codigo || p._id || idx} style={{ borderBottom: '1px solid #eee', backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white' }}>
              <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{p.cantidad || 0}</td>
              <td style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 'bold', color: '#333' }}>{p.nombre || 'Producto sin nombre'}</div>
                {p.codigo && <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>Código: {p.codigo}</div>}
              </td>
              <td style={{ padding: '1rem', color: '#666' }}>{p.descripcion || 'Sin descripción'}</td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>S/. {(p.precioUnitario || 0).toLocaleString('es-ES')}</td>
              <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>S/. {(p.total || (p.cantidad * p.precioUnitario) || 0).toLocaleString('es-ES')}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No hay productos disponibles</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderTop: '2px solid #059669' }}>
            <td colSpan="4" style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: '#059669' }}>TOTAL A ENTREGAR:</td>
            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.3rem', color: '#059669' }}>S/. {total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
});

ProductsTable.propTypes = {
  productos: PropTypes.array,
  total: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

/* ---------- Main Component ---------- */

export default function RemisionPreview({ datos, onClose }) {
  const usuario = useUsuario();
  const COMPANY_NAME = getCompanyName();
  const COMPANY_PHONE = process.env.REACT_APP_COMPANY_PHONE || process.env.COMPANY_PHONE || '(555) 123-4567';

  const datosConDefaults = useMemo(() => buildDefaults(datos || {}), [datos]);

  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [clienteResolved, setClienteResolved] = useState(null);

  const [correo, setCorreo] = useState(datosConDefaults.cliente?.correo || '');
  const [asunto, setAsunto] = useState(`Remisión ${datosConDefaults.numeroRemision || ''} - ${datosConDefaults.cliente?.nombre || 'Cliente'}`);
  const [mensaje, setMensaje] = useState('');

  const numeroRemision = useMemo(() => datosConDefaults.numeroRemision || `REM-${randomString(6)}`, [datosConDefaults]);

  const totalCalculado = useMemo(() => {
    const t = datosConDefaults.total || (datosConDefaults.productos ? calcularTotales(datosConDefaults.productos).total : 0);
    return (typeof t === 'number') ? t.toLocaleString('es-ES') : t;
  }, [datosConDefaults]);

  const pdfRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const fetchFromCotizacion = async () => {
      try {
        const cotRef = datos?.cotizacionReferencia;
        if (!cotRef) return;
        const cotizacionId = typeof cotRef === 'string' ? cotRef : (cotRef?._id || cotRef?.id);
        if (!cotizacionId) return;
        const res = await api.get(`/api/cotizaciones/${cotizacionId}`);
        const cotResp = (res.data && (res.data.data || res.data)) || null;
        const clienteFromCot = cotResp?.cliente || cotResp?.data?.cliente || null;
        if (mounted && clienteFromCot) {
          setClienteResolved(clienteFromCot);
        }
      } catch (err) {
        console.warn('No se pudo poblar cliente desde la cotización para remisión:', err?.message || err);
      }
    };
    fetchFromCotizacion();
    return () => { mounted = false; };
  }, [datos]);


  //
  const abrirModalEnvio = useCallback(() => {
    const totalFinal = datos?.total ?? calcularTotales(datos?.productos || []).total ?? 0;

    setCorreo(datos?.cliente?.correo || datosConDefaults.cliente?.correo || '');
    setAsunto(`Remisión ${datos?.numeroRemision || datosConDefaults.numeroRemision || ''} - ${datos?.cliente?.nombre || datosConDefaults.cliente?.nombre || 'Cliente'} | ${COMPANY_NAME}`);
    setMensaje(
      `Estimado/a ${datos?.cliente?.nombre || datosConDefaults.cliente?.nombre || 'cliente'},\n\nEsperamos se encuentre muy bien. Adjunto encontrará el documento PDF de la remisión de entrega de su pedido con la siguiente información:\n\n• Número de remisión: ${datos?.numeroRemision || datosConDefaults.numeroRemision || 'N/A'}\n• Fecha de remisión: ${formatDateIso(datos?.fechaRemision || datosConDefaults.fechaRemision)}\n• Cliente: ${datos?.cliente?.nombre || datosConDefaults.cliente?.nombre || 'N/A'}\n• Correo: ${datos?.cliente?.correo || datosConDefaults.cliente?.correo || 'N/A'}\n• Ciudad: ${datos?.cliente?.ciudad || datosConDefaults.cliente?.ciudad || 'N/A'}\n• Total de productos entregados: ${datos?.productos?.length || datosConDefaults.productos?.length || 0} artículos\n• TOTAL GENERAL: S/. ${totalFinal.toLocaleString('es-ES')}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` + `Si tiene alguna pregunta o comentario sobre la entrega, no dude en contactarnos.\n\nSaludos cordiales,\n${COMPANY_NAME}\n`
    );
    setShowEnviarModal(true);
  }, [usuario, datos, datosConDefaults, COMPANY_NAME]);

  // Ensure correo state is initialized from resolved cliente if available,
  // but do not override if user already typed an email.
  useEffect(() => {
    const defaultCorreo = clienteResolved?.correo || datosConDefaults.cliente?.correo || '';
    if (!correo && defaultCorreo) setCorreo(defaultCorreo);
  }, [clienteResolved?.correo, datosConDefaults.cliente?.correo]);

  const enviarRemisionPorCorreo = useCallback(async () => {
    try {
      const response = await api.post(`/api/remisiones/${datos?._id}/enviar-remision`, {
        remisionId: datos?._id,
        correoDestino: correo,
        asunto, mensaje
      });
      
      if (response && response.status >= 200 && response.status < 300) {
        const Swal = (await import('sweetalert2')).default;
        Swal.fire({ icon: 'success', title: 'Remisión enviada', text: 'La remisión ha sido enviada exitosamente por correo' });
        setShowEnviarModal(false);
      } else throw new Error('Error al enviar remisión');
    } catch (err) {
      console.error('Error:', err);
      const Swal = (await import('sweetalert2')).default;
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo enviar la remisión por correo' });
    }
  }, [datos, correo, asunto, mensaje]);

  const getPrintContent = useCallback(() => {
    return pdfRef.current ? pdfRef.current.innerHTML : '';
  }, []);

  return (
    <div style={STYLES.overlay}>
      <div style={STYLES.dialog}>
        <div style={STYLES.header}>
          <div style={STYLES.headerInner}>
            <i className="fa-solid fa-truck" style={{ fontSize: '1.8rem' }} aria-hidden />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Remisión {numeroRemision}</h2>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <PrintButton numeroRemision={numeroRemision} getPrintContent={getPrintContent} />

            <IconButton onClick={abrirModalEnvio} title="Enviar remisión" style={{ padding: '0.75rem' }}>
              <i className="fa-solid fa-envelope" aria-hidden />
              <span>Enviar</span>
            </IconButton>

            <IconButton onClick={onClose} title="Cerrar" style={{ padding: '0.75rem', fontSize: '1.2rem' }}>
              <i className="fa-solid fa-times" aria-hidden />
            </IconButton>
          </div>
        </div>

        <div style={STYLES.contentWrap}>
          <div className="pdf-remision" id="pdf-remision-block" style={STYLES.pdfBlock} onCopy={e => e.preventDefault()} ref={pdfRef}>
            <div className="header" style={{ textAlign: 'center', color: 'white', marginBottom: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, #059669, #065f46)', borderRadius: '8px', fontSize: '1.8rem', fontWeight: 'bold' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <i className="fa-solid fa-truck" style={{ fontSize: '2rem' }} aria-hidden />
                <div>
                  <div>REMISIÓN</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '0.5rem' }}>N° {numeroRemision}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ borderBottom: '3px solid #059669', paddingBottom: '0.5rem', color: '#059669', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Entregar a:</h3>
                <div style={{ lineHeight: '1.8' }}>
                  <p><strong>Cliente:</strong> {clienteResolved?.nombre || datosConDefaults.cliente?.nombre || 'Cliente no especificado'}</p>
                  <p><strong>Dirección:</strong> {clienteResolved?.direccion || datosConDefaults.cliente?.direccion} {clienteResolved?.ciudad || datosConDefaults.cliente?.ciudad || 'Ciudad no especificada'}</p>
                  <p><strong>Email:</strong> {clienteResolved?.correo || datosConDefaults.cliente?.correo || 'No especificado'}</p>
                  <p><strong>Teléfono:</strong> {clienteResolved?.telefono || datosConDefaults.cliente?.telefono || 'No especificado'}</p>
                </div>
              </div>

              <div>
                <h3 style={{ borderBottom: '3px solid #059669', paddingBottom: '0.5rem', color: '#059669', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Remite:</h3>
                <div style={{ lineHeight: '1.8' }}>
                  <p><strong>Fecha de entrega:</strong> {datosConDefaults.fechaEntrega}</p>
                  <p><strong>Empresa:</strong> {datosConDefaults.empresa?.nombre || COMPANY_NAME}</p>
                  <p><strong>Dirección:</strong> {datosConDefaults.empresa?.direccion || 'Cl. 21 # 5 - 52 C19, Chía, Cundinamarca'}</p>
                  <p><strong>Teléfono:</strong> {datosConDefaults.empresa?.telefono || COMPANY_PHONE}</p>
                </div>
              </div>
            </div>

            {datosConDefaults.descripcion && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ borderBottom: '3px solid #10b981', paddingBottom: '0.5rem', color: '#10b981', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Descripción</h3>
                <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10b981', lineHeight: '1.6' }}>
                  {datosConDefaults.descripcion}
                </div>
              </div>
            )}



            <ProductsTable productos={datosConDefaults.productos} total={totalCalculado} />


            {datosConDefaults.condicionesPago && (
              <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ borderBottom: '3px solid #10b981', paddingBottom: '0.5rem', color: '#10b981', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Condiciones de Pago</h3>
              <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10b981', lineHeight: '1.6' }}>
                {datosConDefaults.condicionesPago}
              </div>
            </div>
            )}

            {(datosConDefaults.observaciones || datosConDefaults.fechaEntrega) && (

              <div style={{ lineHeight: '1.6' }}>
                {datosConDefaults.observaciones && (
                  <div>
                    <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'white', borderRadius: '6px', border: '1px solid #d1d5db', whiteSpace: 'pre-wrap' }}>
                      {datosConDefaults.observaciones}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '2px solid #374151', marginTop: '3rem', paddingTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0, fontWeight: 'bold' }}>ENTREGADO POR:</p>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '2px solid #374151', marginTop: '3rem', paddingTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0, fontWeight: 'bold' }}>RECIBIDO POR:</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)', borderRadius: '8px', borderTop: '3px solid #059669' }}>
              <h5 style={{ fontSize: '1rem', color: '#059669', marginBottom: '0.8rem', fontWeight: 'bold' }}>TÉRMINOS Y CONDICIONES:</h5>
              <ul style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0, paddingLeft: '1.5rem', lineHeight: '1.5' }}>
                <li>El cliente debe verificar la mercancía al momento de la entrega</li>
                <li>Los reclamos por daños o faltantes deben realizarse en el momento de la entrega</li>
                <li>Una vez firmada la remisión, se da por aceptada la mercancía en perfectas condiciones</li>
              </ul>
            </div>

            <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)', borderRadius: '8px', textAlign: 'center', borderTop: '3px solid #059669' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#059669', marginBottom: '0.5rem' }}>JLA GLOBAL COMPANY</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Gracias por su preferencia • Remisión de entrega</div>
            </div>
          </div>
        </div>

        <SendModal
          visible={showEnviarModal}
          correo={correo}
          asunto={asunto}
          mensaje={mensaje}
          onChange={(field, value) => {
            if (field === 'correo') setCorreo(value);
            if (field === 'asunto') setAsunto(value);
            if (field === 'mensaje') setMensaje(value);
          }}
          onCancel={() => setShowEnviarModal(false)}
          onSend={enviarRemisionPorCorreo}
        />
      </div>
    </div>
  );
}

RemisionPreview.propTypes = {
  datos: PropTypes.shape({
    _id: PropTypes.string,
    numeroRemision: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    codigoPedido: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fechaRemision: PropTypes.string,
    fechaEntrega: PropTypes.string,
    estado: PropTypes.string,
    total: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    cliente: PropTypes.shape({
      nombre: PropTypes.string,
      correo: PropTypes.string,
      telefono: PropTypes.string,
      direccion: PropTypes.string,
      ciudad: PropTypes.string,
      documentoIdentidad: PropTypes.string
    }),
    empresa: PropTypes.shape({
      nombre: PropTypes.string,
      direccion: PropTypes.string,
      telefono: PropTypes.string
    }),
    productos: PropTypes.arrayOf(PropTypes.shape({
      nombre: PropTypes.string,
      codigo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      descripcion: PropTypes.string,
      cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      precioUnitario: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      total: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })),
    cotizacionReferencia: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    observacion: PropTypes.string,
    observaciones: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func
};

RemisionPreview.defaultProps = {
  onClose: () => { }
};
