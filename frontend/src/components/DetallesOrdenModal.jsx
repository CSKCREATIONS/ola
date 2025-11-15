import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { calcularSubtotalProducto } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

export default function DetallesOrdenModal({ visible, orden, onClose, onPrint, onSendEmail }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const modal = modalRef.current;
    if (!modal) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const dragMouseDown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };

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
      document.onmouseup = null;
      document.onmousemove = null;
    };

    const header = modal.querySelector('.pdf-orden-compra .header') || modal.querySelector('.modal-header-realista');
    if (header) header.onmousedown = dragMouseDown;

    return () => {
      if (header) header.onmousedown = null;
      document.onmouseup = null;
      document.onmousemove = null;
    };
  }, [visible]);

  if (!visible || !orden) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-realista modal-md"
        style={{ maxWidth: '700px', width: '90%', position: 'fixed', cursor: 'move' }}
        id="modalMovible"
        ref={modalRef}
      >
        

        <div className="modal-body" style={{ padding: 0, maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ background: 'linear-gradient(135deg, #6a1b9a, #9b59b6)', color: 'white', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <i className="fa-solid fa-file-invoice" style={{ fontSize: '1.8rem' }} aria-hidden={true}></i>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>ORDEN DE COMPRA</h2>
                  <p style={{ margin: 0, opacity: 0.95, fontSize: '0.95rem' }}>N° {orden.numeroOrden || 'Sin número'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    const printContent = document.querySelector('.pdf-orden-compra');
                    if (!printContent) return;
                    const newWindow = window.open('', '_blank');
                    if (!newWindow) return;
                    const html = `
                      <html>
                        <head>
                          <title>Orden de Compra - ${orden.numeroOrden}</title>
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
                          ${printContent.innerHTML}
                        </body>
                      </html>
                    `;
                    const doc = newWindow.document;
                    // Avoid deprecated document.write by setting the documentElement's HTML
                    doc.open();
                    doc.documentElement.innerHTML = html;
                    doc.close();
                    newWindow.focus();
                    newWindow.print();
                    newWindow.close();
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 0.8rem',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-print" aria-hidden={true}></i>
                </button>
                <button className="btn" onClick={() => onSendEmail(orden)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '0.6rem 0.8rem', color: 'white', cursor: 'pointer' }}><i className="fa-solid fa-envelope"></i></button>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '0.6rem 0.8rem', color: 'white', cursor: 'pointer' }}><i className="fa-solid fa-times"></i></button>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem', backgroundColor: '#f8f9fa' }}>
            <div
              className="pdf-orden-compra"
              style={{ background: '#fff', padding: '2rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              <div className="header" style={{ textAlign: 'center', color: 'white', marginBottom: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, #6a1b9a, #9b59b6)', borderRadius: '8px', fontSize: '1.6rem', fontWeight: 'bold' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                  <i className="fa-solid fa-file-invoice" style={{ fontSize: '2rem' }} aria-hidden={true}></i>
                  <div>
                    <div>ORDEN DE COMPRA</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '0.5rem' }}>N° {orden.numeroOrden}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                  <h3 style={{ borderBottom: '3px solid #7b1fa2', paddingBottom: '0.5rem', color: '#7b1fa2', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Información</h3>
                  <div style={{ lineHeight: '1.8' }}>
                    <p><strong>Proveedor:</strong> {orden.proveedor || '-'}</p>
                    <p><strong>Solicitado por:</strong> {orden.solicitadoPor || '-'}</p>
                    <p><strong>Condiciones de Pago:</strong> {orden.condicionesPago || '-'}</p>
                    <p><strong>Fecha de Orden:</strong> {new Date(orden.fechaOrden).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>

                <div>
                  <h3 style={{ borderBottom: '3px solid #7b1fa2', paddingBottom: '0.5rem', color: '#7b1fa2', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Estado</h3>
                  <div style={{ lineHeight: '1.8' }}>
                    <p><strong>Estado:</strong> <span style={{ background: '#fd7e14', color: 'white', padding: '4px 12px', borderRadius: '15px', fontSize: '0.9rem', marginLeft: '0.5rem' }}>{orden.estado}</span></p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ borderBottom: '3px solid #7b1fa2', paddingBottom: '0.5rem', color: '#7b1fa2', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Productos Solicitados</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #6a1b9a, #9b59b6)', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Producto</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Cantidad</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Precio Unit.</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orden.productos?.map((p, i) => (
                      <tr key={p._id || p.id || p.codigo || p.producto || i} style={{ borderBottom: '1px solid #eee', backgroundColor: i % 2 === 0 ? '#fafafa' : 'white' }}>
                        <td style={{ padding: '12px' }}>{p.producto || p.nombre || 'Producto'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{p.cantidad}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>${(p.valorUnitario || p.precioUnitario || 0).toLocaleString()}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(p.valorTotal || calcularSubtotalProducto(p))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Subtotal</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50' }}>${(orden.subtotal || 0).toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Total</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#e74c3c' }}>${(orden.total || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '1rem', borderTop: '1px solid #e0e0e0', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#7f8c8d', fontSize: '0.8rem' }}><i className="fa-solid fa-clock icon-gap" style={{}}></i>{new Date(orden.fechaOrden).toLocaleDateString()}</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-success" onClick={() => onPrint(orden)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}><i className="fa-solid fa-print"></i> Imprimir</button>
            <button className="btn btn-warning" onClick={() => onSendEmail(orden)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#fff' }}><i className="fa-solid fa-envelope"></i> Enviar Correo</button>
            <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Cerrar</button>
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