import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';

const PedidoAgendadoPreview = ({ datos, onClose, onEmailSent, onRemisionar }) => {
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [correo, setCorreo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Obtener usuario del localStorage
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

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
    setAsunto(`Pedido Agendado ${datos?.numeroPedido || datos?.codigo || ''} - ${datos?.cliente?.nombre || 'Cliente'} | ${process.env.REACT_APP_COMPANY_NAME || 'JLA Global Company'}`);
    setMensaje(
      `Estimado/a ${datos?.cliente?.nombre || 'cliente'},

Le extendemos un cordial saludo desde el equipo de ventas de JLA GLOBAL COMPANY. Esperamos se encuentre muy bien.

Adjunto encontrará el formato de pedido que ha agendado con nosotros. Por favor, revise los detalles para cerciornarse de que toda la información es correcta. Cualquier inquietud o inconsistencia, no dude en contactarnos.

¡Gracias por confiar en nosotros!


${process.env.REACT_APP_COMPANY_NAME || 'JLA Global Company'}
🌐 Productos de calidad`
    );
    setShowEnviarModal(true);
  };

  // Función para enviar por correo
  const enviarPorCorreo = async () => {
    try {
      const response = await api.post(`/api/pedidos/${datos._id}/enviar-correo`, {
        pedidoId: datos._id,
        correoDestino: correo,
        asunto: asunto,
        mensaje: mensaje
      });

      if (response.status >= 200 && response.status < 300) {
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'El pedido agendado ha sido enviado exitosamente',
          confirmButtonColor: '#fd7e14'
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
        confirmButtonColor: '#fd7e14'
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
          background: 'linear-gradient(135deg, #fd7e14, #e85d04)',
          color: 'white',
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <i className="fa-solid fa-calendar-check" style={{ fontSize: '1.8rem' }} aria-hidden={true}></i>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                Vista Previa - Pedido Agendado
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
                const printContent = document.querySelector('.pdf-pedido-agendado');
                const newWindow = window.open('', '_blank');
                newWindow.document.write(`
                  <html>
                    <head>
                      <title>Pedido Agendado - ${datos?.numeroPedido}</title>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #fd7e14, #e85d04); color: white; border-radius: 10px; }
                        .info-section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background: linear-gradient(135deg, #fd7e14, #e85d04); color: white; font-weight: bold; }
                        .total-row { background: #fef3c7; font-weight: bold; }
                        .status-badge { background: #fd7e14; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; }
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
              aria-label="Imprimir pedido"
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
            {/* Botón de enviar por correo */}
            <button
              onClick={() => {
                if (typeof onRemisionar === 'function') {
                  onRemisionar();
                } else {
                  Swal.fire('Acción no disponible', 'No se pudo ejecutar la remisión (handler no definido).', 'warning');
                }
              }}
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
              <i className="fa-solid fa-file-invoice" aria-hidden={true}></i>
              <span>Remisionar</span>
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
              aria-label="Cerrar"
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
          {/* Contenido del pedido agendado */}
          <div
            className="pdf-pedido-agendado"
            id="pdf-pedido-agendado-block"
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
              background: 'linear-gradient(135deg, #fd7e14, #e85d04)',
              borderRadius: '8px',
              fontSize: '1.8rem',
              fontWeight: 'bold'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <i className="fa-solid fa-calendar-check" style={{ fontSize: '2rem' }} aria-hidden={true}></i>
                <div>
                  <div>PEDIDO AGENDADO</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '0.5rem' }}>
                    N° {datos?.numeroPedido}
                  </div>
                </div>
              </div>
            </div>

            {/* Información del cliente y fechas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              <div>
                <h3 style={{
                  borderBottom: '3px solid #fd7e14',
                  paddingBottom: '0.5rem',
                  color: '#fd7e14',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  Información del Cliente
                </h3>
                <div style={{ lineHeight: '1.8' }}>
                  <p><strong>Cliente:</strong> {datos?.cliente?.nombre}</p>
                  <p><strong>Teléfono:</strong> {datos?.cliente?.telefono}</p>
                  <p><strong>Email:</strong> {datos?.cliente?.correo}</p>
                  <p><strong>Dirección:</strong> {datos?.cliente?.direccion}</p>
                  <p><strong>Ciudad:</strong> {datos?.cliente?.ciudad}</p>
                </div>
              </div>

              <div>
                <h3 style={{
                  borderBottom: '3px solid #fd7e14',
                  paddingBottom: '0.5rem',
                  color: '#fd7e14',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  Detalles del Pedido
                </h3>
                <div style={{ lineHeight: '1.8' }}>
                  <p><strong>Fecha de Pedido:</strong> {formatDate(datos?.createdAt)}</p>
                  <p><strong>Fecha de Entrega:</strong> {formatDate(datos?.fechaEntrega)}</p>
                  
                </div>
              </div>
            </div>

            {/* Tabla de productos */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                borderBottom: '3px solid #fd7e14',
                paddingBottom: '0.5rem',
                color: '#fd7e14',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Productos Solicitados
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
                  <tr style={{ background: 'linear-gradient(135deg, #fd7e14, #e85d04)', color: 'white' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Producto</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Cantidad</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Precio Unit.</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {datos?.productos && datos.productos.map((producto, index) => (
                    <tr key={index} style={{
                      borderBottom: '1px solid #eee',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : 'white'
                    }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 'bold', color: '#333' }}>
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
                    background: 'linear-gradient(135deg, #fff5e6, #ffe4cc)',
                    borderTop: '2px solid #fd7e14'
                  }}>
                    <td colSpan="3" style={{
                      padding: '1rem',
                      textAlign: 'right',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      color: '#fd7e14'
                    }}>
                      TOTAL:
                    </td>
                    <td style={{
                      padding: '1rem',
                      textAlign: 'right',
                      fontWeight: 'bold',
                      fontSize: '1.3rem',
                      color: '#fd7e14'
                    }}>
                      S/. {calcularTotal().toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Observaciones */}
            {datos?.observacion && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  borderBottom: '3px solid #fd7e14',
                  paddingBottom: '0.5rem',
                  color: '#fd7e14',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  Observaciones
                </h3>
                <div style={{
                  background: '#fef7ed',
                  padding: '1rem',
                  borderRadius: '8px',
                  borderLeft: '4px solid #fd7e14',
                  lineHeight: '1.6'
                }}>
                  {datos.observacion}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{
              marginTop: '3rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
              borderRadius: '8px',
              textAlign: 'center',
              borderTop: '3px solid #fd7e14'
            }}>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: '#fd7e14',
                marginBottom: '0.5rem'
              }}>
                JLA Global Company
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Gracias por su preferencia • Este pedido está programado para la fecha indicada
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
              <h3 style={{ marginBottom: '1rem', color: '#fd7e14' }}>
                <i className="fa-solid fa-envelope icon-gap" style={{}} aria-hidden={true}></i>
                <span>Enviar Pedido por Correo</span>
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="input-pedido-agendado-preview-1" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Correo del destinatario:
                </label>
                <input id="input-pedido-agendado-preview-1"
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
                <label htmlFor="input-pedido-agendado-preview-2" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Asunto:
                </label>
                <input id="input-pedido-agendado-preview-2"
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
                <label htmlFor="input-pedido-agendado-preview-3" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Mensaje:
                </label>
                <textarea id="input-pedido-agendado-preview-3"
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
                    backgroundColor: '#fd7e14',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  <i className="fa-solid fa-envelope icon-gap" style={{}} aria-hidden={true}></i>
                  <span>Enviar Correo</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

PedidoAgendadoPreview.propTypes = {
  datos: PropTypes.shape({
    _id: PropTypes.string,
    numeroPedido: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    codigo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    createdAt: PropTypes.string,
    fechaEntrega: PropTypes.string,
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
    observacion: PropTypes.string,
    enviadoCorreo: PropTypes.bool,
  }),
  onClose: PropTypes.func,
  onEmailSent: PropTypes.func,
  onRemisionar: PropTypes.func,
};

PedidoAgendadoPreview.defaultProps = {
  datos: {},
  onClose: () => {},
  onEmailSent: undefined,
  onRemisionar: undefined,
};

export default PedidoAgendadoPreview;
