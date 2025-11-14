import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import {
  getStoredUser,
  formatDateIso,
  buildSignature,
  getCompanyName
} from '../utils/emailHelpers';

export default function PedidoCanceladoPreview({ datos, onClose, onEmailSent }) {
  // Obtener usuario del localStorage
  const usuario = getStoredUser();
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [correo, setCorreo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Función para formatear fecha
  const formatDate = (fecha) => {
    if (!fecha) return 'No especificada';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Función para calcular total
  const calcularTotal = () => {
    if (!datos?.productos) return 0;
    return datos.productos.reduce((total, producto) => {
      return total + (producto.cantidad * Number.parseFloat(producto.precioUnitario || 0));
    }, 0);
  };

  // Autocompletar datos del cliente al abrir modal
  useEffect(() => {
    if (datos?.cliente) {
      setCorreo(datos.cliente.correo || '');
    }
  }, [datos]);

  // Función para abrir modal de envío
  const abrirModalEnvio = () => {
  const totalFinal = calcularTotal();
  // Fecha de emisión: usar datos.fecha si existe, si no mostrar 'N/A'
  const fechaEmision = formatDateIso(datos?.fecha);
  setAsunto(`Pedido Cancelado ${datos?.numeroPedido || datos?.codigo || ''} - ${datos?.cliente?.nombre || 'Cliente'} | ${getCompanyName()}`);
    setMensaje(
      `Estimado/a ${datos?.cliente?.nombre || 'cliente'},

Lamentamos informarle que el pedido con la siguiente información ha sido cancelado:

📋 DETALLES DEL PEDIDO CANCELADO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Número de pedido: ${datos?.numeroPedido || datos?.codigo || 'N/A'}
• Fecha de emisión: ${fechaEmision}
• Fecha de cancelación: ${formatDateIso(new Date().toISOString())}
• Cliente: ${datos?.cliente?.nombre || 'N/A'}
• Correo: ${datos?.cliente?.correo || 'N/A'}
• Teléfono: ${datos?.cliente?.telefono || 'N/A'}
• Ciudad: ${datos?.cliente?.ciudad || 'N/A'}
• Estado: CANCELADO ❌
• Total de productos: ${datos?.productos?.length || 0} artículos
• TOTAL DEL PEDIDO: S/. ${totalFinal.toLocaleString('es-ES')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${datos?.motivoCancelacion ? `📝 MOTIVO DE CANCELACIÓN:
${datos.motivoCancelacion}

` : ''}Nos disculpamos por cualquier inconveniente que esto pueda causar. Si tiene alguna pregunta o desea realizar un nuevo pedido, no dude en contactarnos.

Agradecemos su comprensión y esperamos poder atenderle en futuras oportunidades.

Saludos cordiales,

${buildSignature(usuario)}

${getCompanyName()}
🌐 Productos de calidad`
    );
    setShowEnviarModal(true);
  };

  // Función para enviar por correo
  const enviarPorCorreo = async () => {
    try {
      const response = await api.post(`/api/pedidos/${datos._id}/enviar-cancelado`, {
        pedidoId: datos._id,
        correoDestino: correo,
        asunto: asunto,
        mensaje: mensaje
      });

      if (response && response.status >= 200 && response.status < 300) {
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'La notificación de cancelación ha sido enviada exitosamente',
          confirmButtonColor: '#dc2626'
        });
        setShowEnviarModal(false);

        // Actualizar el estado local para reflejar que fue enviado
        if (datos) {
          datos.enviadoCorreo = true;
        }

        // Llamar al callback para actualizar el componente padre
        if (onEmailSent) {
          onEmailSent(datos._id);
        }
      } else {
        throw new Error('Error al enviar correo');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo enviar el correo',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  return (
    <div className="modal-cotizacion-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          color: 'white',
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <i className="fa-solid fa-ban" style={{ fontSize: '1.8rem' }} aria-hidden={true}></i>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                Pedido Cancelado
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
                N° {datos?.numeroPedido || 'Sin número'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Botón de imprimir */}
            <button
              onClick={() => {
                const printContent = document.querySelector('.pdf-pedido-cancelado');
                const newWindow = window.open('', '_blank');
                if (!newWindow) return;

                const contentHtml = printContent ? printContent.innerHTML : '';

                const html = `
                  <!doctype html>
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <title>Pedido Cancelado</title>
                      <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding: 20px; color: #333; }
                        .print-button { padding: 0.75rem 1.5rem; border: none; border-radius: 6px; background-color: #dc2626; color: white; cursor: pointer; font-weight: bold; margin-bottom: 1rem; }
                      </style>
                      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                    </head>
                    <body>
                      <div>
                        <button class="print-button" aria-label="Enviar notificación de cancelación">
                          <i class="fa-solid fa-envelope icon-gap" aria-hidden="true"></i>
                          <span>Enviar Notificación</span>
                        </button>
                      </div>
                      ${contentHtml}
                    </body>
                  </html>
                `;

                try {
                  // Preferred: replace the documentElement's HTML without using document.write
                  newWindow.document.documentElement.innerHTML = html;
                } catch (err) {
                  // Log the original error and fallback to safer DOM methods
                  console.warn('Failed to set newWindow.document.documentElement.innerHTML, falling back to safe DOM population.', err);
                  try {
                    newWindow.document.open();
                    newWindow.document.close();
                    if (newWindow.document.body) {
                      newWindow.document.body.innerHTML = contentHtml;
                    } else {
                      const body = newWindow.document.createElement('body');
                      body.innerHTML = contentHtml;
                      newWindow.document.documentElement.appendChild(body);
                    }
                  } catch (e) {
                    // If even fallback fails, close the window to avoid leaving a blank popup
                    console.error('Error while preparing print window', e);
                    newWindow.close();
                    return;
                  }
                }

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
            >
              <i className="fa-solid fa-print icon-gap" style={{ fontSize: '1.2rem' }} aria-hidden={true}></i>
            </button>

            {/* Botón de enviar por correo */}
            <button
              onClick={abrirModalEnvio}
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
          {/* Contenido del pedido cancelado */}
          <div
            className="pdf-pedido-cancelado"
            id="pdf-cancelado-block"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              background: '#fff', 
              padding: '2rem', 
              borderRadius: '10px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
              marginTop: '1rem',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
            onCopy={e => e.preventDefault()}
          >
            <div className="header" style={{
              textAlign: 'center',
              color: 'white',
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              borderRadius: '8px',
              fontSize: '1.8rem',
              fontWeight: 'bold'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <i className="fa-solid fa-ban" style={{ fontSize: '2rem' }}></i>
                <div>
                  <div>PEDIDO CANCELADO</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '0.5rem' }}>
                    N° {datos?.numeroPedido}
                  </div>
                </div>
              </div>
            </div>

            {/* Información del cliente y empresa */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              <div>
                <h3 style={{ 
                  borderBottom: '3px solid #dc2626', 
                  paddingBottom: '0.5rem', 
                  color: '#dc2626',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  Información del Cliente
                </h3>
                <div style={{ lineHeight: '1.8' }}>
                  <p><strong>Cliente:</strong> {datos.cliente?.nombre || 'Cliente no especificado'}</p>
                  <p><strong>Teléfono:</strong> {datos.cliente?.telefono || 'No especificado'}</p>
                  <p><strong>Email:</strong> {datos.cliente?.correo || 'Sin correo'}</p>
                  <p><strong>Dirección:</strong> {datos.cliente?.direccion || 'Dirección no especificada'}</p>
                  <p><strong>Ciudad:</strong> {datos.cliente?.ciudad || 'Ciudad no especificada'}</p>
                </div>
              </div>

              <div>
                <h3 style={{ 
                  borderBottom: '3px solid #dc2626', 
                  paddingBottom: '0.5rem', 
                  color: '#dc2626',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  Detalles de la Cancelación
                </h3>
                <div style={{ lineHeight: '1.8' }}>
                  <p><strong>Fecha de Pedido:</strong> {formatDate(datos?.createdAt)}</p>
                  <p><strong>Fecha de Cancelación:</strong> {formatDate(new Date())}</p>
                  <p><strong>Estado:</strong> 
                    <span style={{
                      background: '#dc2626',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '15px',
                      fontSize: '0.9rem',
                      marginLeft: '0.5rem'
                    }}>
                      CANCELADO
                    </span>
                  </p>
                  <p><strong>Responsable:</strong> {usuario?.firstName || ''} {usuario?.surname || ''}</p>
                </div>
              </div>
            </div>

            {/* Motivo de cancelación si existe */}
            {datos?.motivoCancelacion && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  borderBottom: '3px solid #dc2626', 
                  paddingBottom: '0.5rem', 
                  color: '#dc2626',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  Motivo de Cancelación
                </h3>
                <div style={{
                  background: '#fef2f2',
                  padding: '1rem',
                  borderRadius: '8px',
                  borderLeft: '4px solid #dc2626',
                  lineHeight: '1.6'
                }}>
                  {datos.motivoCancelacion}
                </div>
              </div>
            )}

            {/* Tabla de productos */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                borderBottom: '3px solid #dc2626', 
                paddingBottom: '0.5rem', 
                color: '#dc2626',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Productos del Pedido Cancelado
              </h3>
              <table className="tabla-cotizacion" style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '1rem',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Producto</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Cantidad</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Precio Unit.</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {datos?.productos?.map((producto, index) => (
                    <tr key={producto._id || producto.product?._id || producto.codigo || producto.product?.codigo || index} style={{ 
                      borderBottom: '1px solid #eee',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
                      opacity: 0.7
                    }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 'bold', color: '#333', textDecoration: 'line-through' }}>
                          {producto.product?.name || producto.product?.nombre || producto.nombre || 'Producto sin nombre'}
                        </div>
                        {producto.product?.categoria && (
                          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                            {producto.product.categoria}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                        {producto.cantidad}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        S/. {Number.parseFloat(producto.precioUnitario || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                        S/. {(producto.cantidad * Number.parseFloat(producto.precioUnitario || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', 
                    borderTop: '2px solid #dc2626',
                    opacity: 0.7
                  }}>
                    <td colSpan="3" style={{ 
                      padding: '1rem', 
                      textAlign: 'right', 
                      fontWeight: 'bold', 
                      fontSize: '1.1rem',
                      color: '#dc2626',
                      textDecoration: 'line-through'
                    }}>
                      TOTAL CANCELADO:
                    </td>
                    <td style={{ 
                      padding: '1rem', 
                      textAlign: 'right', 
                      fontWeight: 'bold', 
                      fontSize: '1.3rem',
                      color: '#dc2626',
                      textDecoration: 'line-through'
                    }}>
                      S/. {calcularTotal().toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer */}
            <div style={{
              marginTop: '3rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
              borderRadius: '8px',
              textAlign: 'center',
              borderTop: '3px solid #dc2626'
            }}>
              <div style={{ 
                fontSize: '1.1rem', 
                fontWeight: 'bold', 
                color: '#dc2626',
                marginBottom: '0.5rem'
              }}>
                JLA Global Company
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Lamentamos los inconvenientes • Pedido cancelado
              </div>
            </div>
          </div>
        </div>

        {/* Modal para enviar por correo */}
        {showEnviarModal && (
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
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '10px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#dc2626' }}>
                <i className="fa-solid fa-envelope icon-gap" style={{}} aria-hidden={true}></i>
                <span>Enviar Notificación de Cancelación</span>
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="input-pedido-cancelado-preview-1" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Correo del destinatario:
                </label>
                <input id="input-pedido-cancelado-preview-1"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="input-pedido-cancelado-preview-2" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Asunto:
                </label>
                <input id="input-pedido-cancelado-preview-2"
                  type="text"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Asunto del correo"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="input-pedido-cancelado-preview-3" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Mensaje:
                </label>
                <textarea id="input-pedido-cancelado-preview-3"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Escriba un mensaje personalizado..."
                  rows="8"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowEnviarModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={enviarPorCorreo}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  <i className="fa-solid fa-envelope icon-gap" style={{}} aria-hidden={true}></i>
                  <span>Enviar Notificación</span>
                </button>
              </div>
            </div>
          </div>
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

PedidoCanceladoPreview.defaultProps = {
  datos: {},
  onClose: () => {},
  onEmailSent: undefined,
};
