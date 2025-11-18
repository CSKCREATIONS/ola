import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { calcularSubtotalProducto } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import OrderDetailsHeader from './OrderDetailsHeader';
import sanitizeHtml from '../utils/sanitizeHtml';

function useDraggable(ref, enabled) {
  useEffect(() => {
    if (!enabled) return;
    const modal = ref.current;
    if (!modal) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const elementDrag = (e) => {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      modal.style.top = (modal.offsetTop - pos2) + 'px';
      modal.style.left = (modal.offsetLeft - pos1) + 'px';
    };

    const closeDragElement = () => {
      document.removeEventListener('mouseup', closeDragElement);
      document.removeEventListener('mousemove', elementDrag);
    };

    const dragMouseDown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.addEventListener('mouseup', closeDragElement);
      document.addEventListener('mousemove', elementDrag);
    };

    const header = modal.querySelector('.modal-header-realista');
    if (header) header.addEventListener('mousedown', dragMouseDown);

    return () => {
      if (header) header.removeEventListener('mousedown', dragMouseDown);
      closeDragElement();
    };
  }, [ref, enabled]);
}

export default function DetallesOrdenModal({ visible, orden = {}, onClose = () => {}, onPrint = () => {}, onSendEmail = () => {} }) {
  const modalRef = useRef(null);
  useDraggable(modalRef, visible);

  const styles = useMemo(() => ({
    modalWrapper: { maxWidth: '700px', width: '90%', position: 'fixed', cursor: 'move' },
    body: { padding: 0, maxHeight: '70vh', overflowY: 'auto' },
    container: { flex: 1, overflow: 'auto', padding: '1.5rem', backgroundColor: '#f8f9fa' },
    pdfCard: { background: '#fff', padding: '2rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    header: { textAlign: 'center', color: 'white', marginBottom: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, #6a1b9a, #9b59b6)', borderRadius: '8px', fontSize: '1.6rem', fontWeight: 'bold' },
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
    footerBar: { padding: '1rem', borderTop: '1px solid #e0e0e0', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    btnGhost: { background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '0.6rem 0.8rem', color: 'white', cursor: 'pointer' }
  }), []);

  const handleOpenPrintWindow = useCallback((sourceSelector = '.pdf-orden-compra .header') => {
    const printContent = document.querySelector(sourceSelector) || modalRef.current?.querySelector(sourceSelector);
    if (!printContent) return;
    const newWindow = window.open('', '_blank');
    if (!newWindow) return;
    const rawContent = printContent.innerHTML;
    const safeContent = sanitizeHtml(rawContent);
    const html = `
      <html>
        <head>
          <title>Orden de Compra - ${orden?.numeroOrden || ''}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #6a1b9a, #9b59b6); color: white; border-radius: 10px; }
            .info-section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: linear-gradient(135deg, #6a1b9a, #9b59b6); color: white; font-weight: bold; }
            .total-row { background: #fef3c7; font-weight: bold; }
            .status-badge { background: #6a1b9a; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; }
          </style>
        </head>
        <body>
          ${safeContent}
        </body>
      </html>
    `;
    const doc = newWindow.document;
    doc.open();
    doc.documentElement.innerHTML = html;
    doc.close();
    newWindow.focus();
    newWindow.print();
    newWindow.close();
  }, [orden]);

  const o = orden || {};

  return (
    <div className="modal-overlay">
      <div
        className="modal-realista modal-md"
        style={styles.modalWrapper}
        id="modalMovible"
        ref={modalRef}
      >
        <div className="modal-body" style={styles.body}>
          <OrderDetailsHeader
            iconClass="fa-solid fa-file-invoice"
            title="ORDEN DE COMPRA"
            subtitle={`N° ${o.numeroOrden || 'Sin número'}`}
            onClose={onClose}
          >
            <button
              onClick={() => handleOpenPrintWindow()}
              style={styles.btnGhost}
              aria-label="Imprimir encabezado"
            >
              <i className="fa-solid fa-print" aria-hidden={true}></i>
            </button>

            <button
              className="btn"
              onClick={() => onSendEmail(o)}
              style={styles.btnGhost}
              aria-label="Enviar correo"
            >
              <i className="fa-solid fa-envelope"></i>
            </button>
          </OrderDetailsHeader>

          <div style={styles.container}>
            <div className="pdf-orden-compra" style={styles.pdfCard}>
              <div className="header" style={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                  <i className="fa-solid fa-file-invoice" style={{ fontSize: '2rem' }} aria-hidden={true}></i>
                  <div>
                    <div>ORDEN DE COMPRA</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '0.5rem' }}>N° {o.numeroOrden}</div>
                  </div>
                </div>
              </div>

              <div style={styles.infoGrid}>
                <div>
                  <h3 style={{ borderBottom: '3px solid #7b1fa2', paddingBottom: '0.5rem', color: '#7b1fa2', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Información</h3>
                  <div style={{ lineHeight: '1.8' }}>
                    <p><strong>Proveedor:</strong> {o.proveedor || '-'}</p>
                    <p><strong>Solicitado por:</strong> {o.solicitadoPor || '-'}</p>
                    <p><strong>Condiciones de Pago:</strong> {o.condicionesPago || '-'}</p>
                    <p><strong>Fecha de Orden:</strong> {o.fechaOrden ? new Date(o.fechaOrden).toLocaleDateString('es-ES') : '-'}</p>
                  </div>
                </div>

                <div>
                  <h3 style={{ borderBottom: '3px solid #7b1fa2', paddingBottom: '0.5rem', color: '#7b1fa2', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Estado</h3>
                  <div style={{ lineHeight: '1.8' }}>
                    <p>
                      <strong>Estado:</strong>
                      <span style={{ background: '#fd7e14', color: 'white', padding: '4px 12px', borderRadius: '15px', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                        {o.estado || '-'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ borderBottom: '3px solid #7b1fa2', paddingBottom: '0.5rem', color: '#7b1fa2', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Productos Solicitados</h3>
                <table style={styles.table}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #6a1b9a, #9b59b6)', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Producto</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Cantidad</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Precio Unit.</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.productos?.map((p, i) => (
                      <tr key={p._id || p.id || p.codigo || p.producto || i} style={{ borderBottom: '1px solid #eee', backgroundColor: i % 2 === 0 ? '#fafafa' : 'white' }}>
                        <td style={{ padding: '12px' }}>{p.producto || p.nombre || 'Producto'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{p.cantidad}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>${(p.valorUnitario || p.precioUnitario || 0).toLocaleString()}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(p.valorTotal || calcularSubtotalProducto(p))}</td>
                      </tr>
                    )) || <tr><td colSpan="4" style={{ padding: '12px' }}>Sin productos</td></tr>}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Subtotal</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50' }}>${(o.subtotal || 0).toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Total</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#e74c3c' }}>${(o.total || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={styles.footerBar}>
            <span style={{ color: '#7f8c8d', fontSize: '0.8rem' }}><i className="fa-solid fa-clock icon-gap" />{o.fechaOrden ? new Date(o.fechaOrden).toLocaleDateString() : ''}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-success" onClick={() => onPrint(o)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}><i className="fa-solid fa-print" /> Imprimir</button>
              <button className="btn btn-warning" onClick={() => onSendEmail(o)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#fff' }}><i className="fa-solid fa-envelope" /> Enviar Correo</button>
              <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

DetallesOrdenModal.propTypes = {
  visible: PropTypes.bool,
  orden: PropTypes.object,
  onClose: PropTypes.func,
  onPrint: PropTypes.func,
  onSendEmail: PropTypes.func
};

DetallesOrdenModal.defaultProps = {
  visible: false,
  orden: {},
  onClose: () => {},
  onPrint: () => {},
  onSendEmail: () => {}
};