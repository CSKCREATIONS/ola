import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './FormatoCotizacion.css';
import api from '../api/axiosConfig';
import { getStoredUser } from '../utils/emailHelpers';

export default function PedidoEntregadoPreview({ datos, onClose }) {
  // Obtener usuario logueado
  const usuario = getStoredUser();
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [correo, setCorreo] = useState('');
  const [asunto, setAsunto] = useState('Comprobante de Entrega - Pedido');
  const [mensaje, setMensaje] = useState('Se adjunta el comprobante de entrega del pedido.');

  // Obtener lista de productos para mostrar el nombre
  const productosLista = datos.productosLista || [];

  const enviarCorreo = async () => {
    try {
      const response = await api.post('/api/enviar-correo-pedido', {
        correo,
        asunto,
        mensaje,
        pedidoId: datos._id,
        tipo: 'entregado'
      });

      if (response && response.status >= 200 && response.status < 300) {
        alert('Correo enviado exitosamente');
        setShowEnviarModal(false);
      } else {
        alert('Error al enviar el correo');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    }
  };

  console.log("productosLista:", productosLista);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '0',
        maxWidth: '95vw',
        maxHeight: '95vh',
        width: '1000px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
      }}>
        {/* Header del modal */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <i className="fa-solid fa-check-circle" style={{ fontSize: '1.8rem' }} aria-hidden={true}></i>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                Pedido Entregado
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
                N° {datos?.numeroPedido || datos?.codigo || 'Sin número'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Botón de imprimir */}
            <button
              onClick={() => {
                const printContent = document.getElementById('pdf-pedido-entregado-block');
                const newWindow = window.open('', '_blank');
                if (!newWindow) return;
                const html = `
                  <html>
                    <head>
                      <title>Comprobante de Entrega - Pedido ${datos.numeroPedido || ''}</title>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #10b981; color: white; }
                        .header { text-align: center; margin-bottom: 30px; border: 2px solid #10b981; padding: 20px; border-radius: 10px; }
                        .info-section { margin: 20px 0; }
                        .entregado-badge { background: #10b981; color: white; padding: 5px 10px; border-radius: 5px; font-weight: bold; }
                        .signature-section { margin-top: 50px; }
                      </style>
                    </head>
                    <body>
                      ${printContent.innerHTML}
                    </body>
                  </html>
                `;
                newWindow.document.documentElement.innerHTML = html;
                newWindow.focus();
                newWindow.print();
                newWindow.close();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
              aria-label="Imprimir comprobante"
            >
              <i className="fa-solid fa-print icon-gap" style={{ fontSize: '1.2rem' }} aria-hidden={true}></i>
            </button>

            {/* Botón de enviar por correo */}
            <button
              onClick={() => setShowEnviarModal(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
              aria-label="Enviar comprobante"
            >
              <i className="fa-solid fa-envelope" aria-hidden={true}></i>
              <span>Enviar</span>
            </button>

            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '1.2rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
              aria-label="Cerrar modal"
            >
              <i className="fa-solid fa-times" aria-hidden={true}></i>
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '2rem',
          backgroundColor: '#f8f9fa'
        }}>

  <div id="pdf-pedido-entregado-block">
          <div className="cotizacion-contenido">
            <div className="encabezado-empresa">
              <div className="logo-empresa">
                <h1 style={{ color: '#10b981', fontSize: '24px', margin: 0 }}>PANGEA</h1>
                <p style={{ margin: '5px 0', fontSize: '12px' }}>Sistema de Gestión Empresarial</p>
              </div>
              <div className="info-empresa">
                <h2 style={{ color: '#10b981', margin: '0 0 10px 0' }}>
                  <span aria-hidden={true} className="sr-only-decorative"/>COMPROBANTE DE ENTREGA
                </h2>
                <p><strong>Pedido:</strong> {datos.numeroPedido || datos.codigo || 'N/A'}</p>
                {(() => {
                  const fechaEntrega = datos?.updatedAt ? new Date(datos.updatedAt).toLocaleDateString() : 'N/A';
                  return <p><strong>Fecha de entrega:</strong> {fechaEntrega}</p>;
                })()}
                <p><strong>Estado:</strong> <span className="entregado-badge">ENTREGADO</span></p>
              </div>
            </div>

            <div className="info-cliente">
              <h3 style={{ color: '#10b981' }}>Información del Cliente</h3>
              <p><strong>Nombre:</strong> {datos.cliente?.nombre || 'N/A'}</p>
              <p><strong>Documento:</strong> {datos.cliente?.documento || 'N/A'}</p>
              <p><strong>Teléfono:</strong> {datos.cliente?.telefono || 'N/A'}</p>
              <p><strong>Email:</strong> {datos.cliente?.email || 'N/A'}</p>
              <p><strong>Dirección:</strong> {datos.cliente?.direccion || 'N/A'}</p>
              <p><strong>Ciudad:</strong> {datos.cliente?.ciudad || 'N/A'}</p>
            </div>

            <div className="productos-tabla">
              <h3 style={{ color: '#10b981' }}>Productos Entregados</h3>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {datos?.productos?.length > 0 ? (
                    datos.productos.map((producto, index) => (
                      <tr key={producto._id || producto.product?._id || producto.codigo || index}>
                        <td>{producto.producto?.name || producto.product?.name || 'Producto no disponible'}</td>
                        <td>{producto.cantidad}</td>
                        <td>${(producto.precio || producto.producto?.price || producto.product?.price || 0).toLocaleString('es-CO')}</td>
                        <td>${((producto.cantidad || 1) * (producto.precio || producto.producto?.price || producto.product?.price || 0)).toLocaleString('es-CO')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                        No hay productos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="totales" style={{ marginTop: '20px', textAlign: 'right' }}>
              <p><strong style={{ fontSize: '18px', color: '#10b981' }}>Total Entregado: ${(datos.total || 0).toLocaleString('es-CO')}</strong></p>
            </div>

            {datos.observacion && (
              <div className="observaciones" style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#10b981' }}>Observaciones</h3>
                <p>{datos.observacion}</p>
              </div>
            )}

            <div className="signature-section" style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '200px', paddingTop: '10px' }}>
                <p><strong>Firma Cliente</strong></p>
                <p style={{ fontSize: '12px' }}>Recibí conforme</p>
              </div>
              <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '200px', paddingTop: '10px' }}>
                <p><strong>Firma Entrega</strong></p>
                <p style={{ fontSize: '12px' }}>Entregado por: {usuario.username || 'N/A'}</p>
              </div>
            </div>

            <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
              <p>Documento generado automáticamente por PANGEA</p>
              <p>Fecha de generación: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
        </div>

        {/* Modal de envío de correo */}
        {showEnviarModal && (
          <div className="modal-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="modal-compact modal-md">
              <div className="modal-header">
                <h5 className="modal-title">Enviar Comprobante de Entrega</h5>
                <button className="modal-close" onClick={() => setShowEnviarModal(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="correo-pedido-entregado">Correo destinatario:</label>
                  <input
                    id="correo-pedido-entregado"
                    type="email"
                    className="form-control"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="asunto-pedido-entregado">Asunto:</label>
                  <input
                    id="asunto-pedido-entregado"
                    type="text"
                    className="form-control"
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="mensaje-pedido-entregado">Mensaje:</label>
                  <textarea
                    id="mensaje-pedido-entregado"
                    className="form-control"
                    rows="4"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-cancel" onClick={() => setShowEnviarModal(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={enviarCorreo}>
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

    PedidoEntregadoPreview.propTypes = {
      datos: PropTypes.shape({
        _id: PropTypes.string,
        numeroPedido: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        codigo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        updatedAt: PropTypes.string,
        cliente: PropTypes.shape({
          nombre: PropTypes.string,
          documento: PropTypes.string,
          telefono: PropTypes.string,
          email: PropTypes.string,
          direccion: PropTypes.string,
          ciudad: PropTypes.string,
        }),
        productos: PropTypes.arrayOf(PropTypes.object),
        productosLista: PropTypes.arrayOf(PropTypes.object),
        total: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        observacion: PropTypes.string,
      }).isRequired,
      onClose: PropTypes.func,
    };

    PedidoEntregadoPreview.defaultProps = {
      onClose: () => {},
    };