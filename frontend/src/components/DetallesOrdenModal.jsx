import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

export default function DetallesOrdenModal({ visible, orden, onClose, onPrint, onSendEmail }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const modal = modalRef.current;
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
      modal.style.top = (modal.offsetTop - pos2) + 'px';
      modal.style.left = (modal.offsetLeft - pos1) + 'px';
    };

    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
    };

    const header = modal.querySelector('.modal-header-realista');
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
        <div className="modal-header-realista" style={{ cursor: 'move' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0.5rem 1rem' }}>
            <h5 style={{ margin: 0 }}>
              <i className="fa-solid fa-file-invoice icon-gap" style={{}}></i>
              Orden: {orden.numeroOrden}
            </h5>
            <button className="modal-close-realista" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666', padding: 0, width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: 0, maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ background: 'linear-gradient(135deg, #2c3e50, #34495e)', color: 'white', padding: '1.5rem', borderBottom: '3px solid #f39c12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>ORDEN DE COMPRA</h2>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem' }}>N°: <strong>{orden.numeroOrden}</strong></p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Fecha</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>{new Date(orden.fechaOrden).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h6 style={{ color: '#2c3e50', marginBottom: '0.5rem', borderBottom: '1px solid #ecf0f1', paddingBottom: '0.25rem' }}><i className="fa-solid fa-truck icon-gap" style={{}}></i>Proveedor</h6>
                <p style={{ margin: 0, fontWeight: '500' }}>{orden.proveedor || 'No especificado'}</p>
              </div>
              <div>
                <h6 style={{ color: '#2c3e50', marginBottom: '0.5rem', borderBottom: '1px solid #ecf0f1', paddingBottom: '0.25rem' }}><i className="fa-solid fa-user icon-gap" style={{}}></i>Solicitado Por</h6>
                <p style={{ margin: 0, fontWeight: '500' }}>{orden.solicitadoPor || 'No especificado'}</p>
              </div>
              <div>
                <h6 style={{ color: '#2c3e50', marginBottom: '0.5rem', borderBottom: '1px solid #ecf0f1', paddingBottom: '0.25rem' }}><i className="fa-solid fa-credit-card icon-gap" style={{}}></i>Condiciones de Pago</h6>
                <p style={{ margin: 0, fontWeight: '500' }}>{orden.condicionesPago || 'Contado'}</p>
              </div>
              <div>
                <h6 style={{ color: '#2c3e50', marginBottom: '0.5rem', borderBottom: '1px solid #ecf0f1', paddingBottom: '0.25rem' }}><i className="fa-solid fa-flag icon-gap" style={{}}></i>Estado</h6>
                <span className={`badge ${orden.estado === 'Pendiente' ? 'bg-warning' : 'bg-success'}`}>{orden.estado}</span>
              </div>
            </div>

            <div>
              <h6 style={{ color: '#2c3e50', marginBottom: '1rem', borderBottom: '2px solid #3498db', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center' }}><i className="fa-solid fa-boxes icon-gap" style={{}}></i>Productos ({orden.productos?.length || 0})</h6>
              {orden.productos && orden.productos.length > 0 ? (
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left' }}>Producto</th>
                        <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left' }}>Descripción</th>
                        <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>Cantidad</th>
                        <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>Valor Unit.</th>
                        <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>Descuento</th>
                        <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orden.productos.map((producto, index) => (
                        <tr key={index}>
                          <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}><strong>{producto.producto}</strong></td>
                          <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>{producto.descripcion || 'N/A'}</td>
                          <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}><span className="badge bg-primary">{producto.cantidad}</span></td>
                          <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>${(producto.valorUnitario || producto.precioUnitario || 0).toLocaleString()}</td>
                          <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>${(producto.descuento || 0).toLocaleString()}</td>
                          <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>${(producto.valorTotal || ((producto.cantidad || 0) * (producto.valorUnitario || producto.precioUnitario || 0) - (producto.descuento || 0))).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d', background: '#f8f9fa', borderRadius: '4px', border: '1px dashed #dee2e6' }}>
                  <i className="fa-solid fa-cart-shopping" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
                  <p>No hay productos en esta orden</p>
                </div>
              )}
            </div>

            {orden.productos && orden.productos.length > 0 && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Subtotal</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50' }}>${(orden.subtotal || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Total</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#e74c3c' }}>${(orden.total || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
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
