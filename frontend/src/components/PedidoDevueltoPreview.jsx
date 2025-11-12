import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';


export default function PedidoDevueltoPreview({ datos, onClose }) {
  const navigate = useNavigate();
  // Obtener usuario logueado
  const usuario = JSON.parse(localStorage.getItem('user') || '{}');
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [correo, setCorreo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  return (
    <div className="modal-cotizacion-overlay" style={{ alignItems: 'flex-start', paddingTop: '50px', overflow: 'auto' }}>
      <div className="modal-cotizacion" style={{ maxWidth: '95vw', maxHeight: 'none', width: '900px', height: 'auto', marginBottom: '50px' }}>
    <button className="close-modal" onClick={onClose} aria-label="Cerrar">×</button>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className='modal-title'>Pedido Devuelto {datos.numeroPedido}</span>
          <div className="botones-cotizacion" style={{ display: 'flex', gap: '18px', justifyContent: 'center', marginBottom: '1rem' }}>
            <button className="btn-cotizacion moderno" title="Enviar" onClick={() => setShowEnviarModal(true)} aria-label="Enviar pedido devuelto">
              <i className="fa-solid fa-envelope icon-gap" style={{ fontSize: '1rem', color: '#EA4335' }} aria-hidden={true}></i>
              <span>Enviar</span>
            </button>
            <button className="btn-cotizacion moderno" title="Imprimir" onClick={() => {
              // Método seguro de impresión sin manipular DOM
              const printContent = document.getElementById('pdf-devuelto-block');
              const newWindow = window.open('', '_blank');
              newWindow.document.write(`
                <html>
                  <head>
                    <title>Pedido Devuelto</title>
                    <style>
                      body { font-family: Arial, sans-serif; margin: 20px; }
                      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                      th { background-color: #f2f2f2; }
                      .header { text-align: center; margin-bottom: 30px; }
                      .info-section { margin: 20px 0; }
                      .signature-section { margin-top: 50px; }
                    </style>
                  </head>
                  <body>
                    ${printContent.innerHTML}
                  </body>
                </html>
              `);
              newWindow.document.close();
              newWindow.focus();
              newWindow.print();
              newWindow.close();
            }}>
              <i className="fa-solid fa-print icon-gap" style={{ fontSize: '1.2rem' }} aria-hidden={true}></i>
            </button>
          </div>
        </div>

        {/* Contenido PDF debajo */}
        <div
          className="pdf-cotizacion"
          id="pdf-devuelto-block"
          style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
            marginTop: '0.5rem', 
            userSelect: 'none', 
            WebkitUserSelect: 'none', 
            MozUserSelect: 'none', 
            msUserSelect: 'none', 
            fontSize: '0.9rem',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}
          onCopy={e => e.preventDefault()}
        >
          <div className="cotizacion-encabezado">
            <h2 style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>
              PEDIDO DEVUELTO
            </h2>
          </div>

          {/* Información del cliente y empresa */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ color: '#374151', marginBottom: '0.3rem', fontSize: '0.85rem' }}>CLIENTE:</h4>
              <div style={{ backgroundColor: '#f9fafb', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.15rem', fontSize: '0.8rem' }}>
                  {datos.cliente?.nombre || 'Cliente no especificado'}
                </p>
                <p style={{ marginBottom: '0.15rem', fontSize: '0.75rem' }}>
                  {datos.cliente?.direccion || 'Dirección no especificada'}
                </p>
                <p style={{ marginBottom: '0.15rem', fontSize: '0.75rem' }}>
                  {datos.cliente?.ciudad || 'Ciudad no especificada'}
                </p>
                <p style={{ marginBottom: '0.15rem', fontSize: '0.75rem' }}>
                  Tel: {datos.cliente?.telefono || 'No especificado'}
                </p>
                <p style={{ fontSize: '0.75rem' }}>
                  {datos.cliente?.correo || 'Sin correo'}
                </p>
              </div>
            </div>
            
            <div style={{ flex: 1, marginLeft: '1rem' }}>
              <h4 style={{ color: '#374151', marginBottom: '0.3rem', fontSize: '0.85rem' }}>EMPRESA:</h4>
              <div style={{ backgroundColor: '#f9fafb', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.15rem', fontSize: '0.8rem' }}>
                  {datos.empresa?.nombre || 'PANGEA'}
                </p>
                <p style={{ marginBottom: '0.15rem', fontSize: '0.75rem' }}>
                  {datos.empresa?.direccion || ''}
                </p>
                <p style={{ marginBottom: '0.15rem', fontSize: '0.75rem' }}>
                  Responsable: {usuario.firstName || ''} {usuario.surname || ''}
                </p>
                <p style={{ marginBottom: '0.15rem', color: '#6b7280', fontSize: '0.75rem' }}>
                  Ref. Pedido: {datos.numeroPedido || 'N/A'}
                </p>
                <p style={{ marginBottom: '0.15rem', color: '#6b7280', fontSize: '0.75rem' }}>
                  F. Devolución: {new Date().toLocaleDateString('es-ES')}
                </p>
                {datos.fechaEntrega && (
                  <p style={{ marginBottom: '0.15rem', color: '#6b7280', fontSize: '0.75rem' }}>
                    F. Entrega Inicial: {new Date(datos.fechaEntrega).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Motivo de devolución */}
          <div style={{ marginBottom: '0.75rem' }}>
            <h4 style={{ color: '#f59e0b', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Motivo de devolución:</h4>
            <div style={{ backgroundColor: '#fefbf3', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fed7aa' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e' }}>
                {datos.motivoDevolucion || datos.observacion || 'No se especificó motivo de devolución'}
              </p>
            </div>
          </div>

          {/* Tabla de productos */}
          <table className="tabla-cotizacion" style={{ fontSize: '0.8rem', width: '100%', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '0.6rem', fontSize: '0.8rem' }}>Cant.</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', fontSize: '0.8rem' }}>Producto</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', fontSize: '0.8rem' }}>Descripción</th>
                <th style={{ textAlign: 'right', padding: '0.6rem', fontSize: '0.8rem' }}>Valor Unit.</th>
                <th style={{ textAlign: 'right', padding: '0.6rem', fontSize: '0.8rem' }}>Total</th>
                <th style={{ textAlign: 'center', padding: '0.6rem', fontSize: '0.8rem' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {datos.productos && datos.productos.length > 0 ? datos.productos.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    {p.cantidad || 0}
                  </td>
                  <td style={{ padding: '0.6rem', fontSize: '0.8rem' }}>
                    {p.product?.name || p.producto?.name || p.nombre || 'Producto sin nombre'}
                  </td>
                  <td style={{ padding: '0.6rem', fontSize: '0.8rem', color: '#6b7280' }}>
                    {p.product?.description || p.descripcion || 'Sin descripción'}
                  </td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.8rem' }}>
                    ${(p.valorUnitario || p.precioUnitario || p.product?.price || 0).toLocaleString('es-CO')}
                  </td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    ${(() => {
                      const cantidad = Number.parseFloat(p.cantidad) || 0;
                      const precio = Number.parseFloat(p.valorUnitario || p.precioUnitario || p.product?.price) || 0;
                      return (cantidad * precio).toLocaleString('es-CO');
                    })()}
                  </td>
                  <td style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.8rem' }}>
                    <span style={{ 
                      backgroundColor: '#fef3c7', 
                      color: '#92400e', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      DEVUELTO
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#6b7280' }}>
                    No hay productos disponibles
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f9fafb', fontWeight: 'bold' }}>
                <td colSpan={4} style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.9rem' }}>
                  TOTAL DEVUELTO:
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '1rem', color: '#f59e0b' }}>
                  ${datos.productos && datos.productos.length > 0 ? datos.productos
                    .reduce((acc, p) => {
                      const cantidad = Number.parseFloat(p.cantidad) || 0;
                      const precio = Number.parseFloat(p.valorUnitario || p.precioUnitario || p.product?.price) || 0;
                      return acc + (cantidad * precio);
                    }, 0)
                    .toLocaleString('es-CO') : '0'}
                </td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
            </tfoot>
          </table>

          {/* Proceso de devolución */}
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            backgroundColor: '#fefbf3', 
            borderRadius: '6px', 
            border: '1px solid #fed7aa'
          }}>
            <h5 style={{ fontSize: '0.8rem', color: '#f59e0b', marginBottom: '0.4rem' }}>PROCESO DE DEVOLUCIÓN:</h5>
            <ul style={{ fontSize: '0.7rem', color: '#92400e', margin: 0, paddingLeft: '1rem', lineHeight: '1.3' }}>
              <li>Los productos fueron recibidos y revisados por nuestro equipo</li>
              <li>Se procederá con el reembolso según las políticas de la empresa</li>
              <li>El cliente recibirá confirmación del proceso en un plazo de 3-5 días hábiles</li>
            </ul>
          </div>
        </div>
      </div>

      {showEnviarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-cotizacion" style={{ maxWidth: 400 }}>
            <button className="close-modal" onClick={() => setShowEnviarModal(false)}>×</button>
            <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Enviar pedido devuelto</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="correo-pedido-devuelto">Correo destinatario:</label>
              <input id="correo-pedido-devuelto" type="email" className="cuadroTexto" value={correo} onChange={e => setCorreo(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="asunto-pedido-devuelto">Asunto:</label>
              <input id="asunto-pedido-devuelto" type="text" className="cuadroTexto" value={asunto} onChange={e => setAsunto(e.target.value)} style={{ width: '100%' }} placeholder={`Pedido Devuelto ${datos.numeroPedido}`} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="mensaje-pedido-devuelto">Mensaje:</label>
              <textarea id="mensaje-pedido-devuelto" className="cuadroTexto" value={mensaje} onChange={e => setMensaje(e.target.value)} style={{ width: '100%', minHeight: '80px' }} placeholder="Confirmación de devolución de pedido..." />
            </div>
            <button className="btn-enviar-modal" style={{ width: '100%' }} onClick={() => { }}>Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}

PedidoDevueltoPreview.propTypes = {
  datos: PropTypes.shape({
    _id: PropTypes.string,
    numeroPedido: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    createdAt: PropTypes.string,
  fecha: PropTypes.string,
  fechaEntrega: PropTypes.string,
    cliente: PropTypes.shape({
      nombre: PropTypes.string,
      direccion: PropTypes.string,
      ciudad: PropTypes.string,
      telefono: PropTypes.string,
      correo: PropTypes.string,
    }),
    empresa: PropTypes.shape({
      nombre: PropTypes.string,
      direccion: PropTypes.string,
    }),
    productos: PropTypes.arrayOf(
      PropTypes.shape({
        cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        precioUnitario: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        valorUnitario: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        product: PropTypes.object,
      })
    ),
    motivoDevolucion: PropTypes.string,
    observacion: PropTypes.string,
  }),
  onClose: PropTypes.func,
};

PedidoDevueltoPreview.defaultProps = {
  datos: {},
  onClose: () => {},
};