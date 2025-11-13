import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';

export default function PedidoCanceladoEmail({ datos, onClose, onEmailSent }) {
  // Obtener usuario logueado
  const usuario = JSON.parse(localStorage.getItem('user') || '{}');
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  
  // Estados para el formulario de envío de correo
  const [correo, setCorreo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  // Función para abrir modal con datos actualizados
  const abrirModalEnvio = () => {
    // Calcular total dinámicamente si no existe
    const totalCalculado = datos?.productos?.reduce((total, producto) => {
      const cantidad = Number(producto.cantidad) || 0;
      const precio = Number(producto.precioUnitario) || 0;
      return total + (cantidad * precio);
    }, 0) || 0;
    
    const totalFinal = datos?.total || totalCalculado;
    // Fecha de pedido original: preferir createdAt, si no usar fecha, si ninguna está presente 'N/A'
    const fechaPedidoOriginal = datos?.createdAt
      ? new Date(datos.createdAt).toLocaleDateString('es-ES')
      : (datos?.fecha ? new Date(datos.fecha).toLocaleDateString('es-ES') : 'N/A');
    
    // Actualizar datos autocompletados cada vez que se abre el modal
    setCorreo(datos?.cliente?.correo || '');
    setAsunto(`Pedido Cancelado ${datos?.numeroPedido || ''} - ${datos?.cliente?.nombre || 'Cliente'} | ${process.env.REACT_APP_COMPANY_NAME || 'JLA Global Company'}`);
    setMensaje(
      `Estimado/a ${datos?.cliente?.nombre || 'cliente'},

Lamentamos informarle que su pedido ha sido cancelado. A continuación los detalles:

📦 DETALLES DEL PEDIDO CANCELADO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Número de pedido: ${datos?.numeroPedido || 'N/A'}
• Fecha de pedido original: ${fechaPedidoOriginal}
• Fecha de cancelación: ${new Date().toLocaleDateString('es-ES')}
• Cliente: ${datos?.cliente?.nombre || 'N/A'}
• Correo: ${datos?.cliente?.correo || 'N/A'}
• Teléfono: ${datos?.cliente?.telefono || 'N/A'}
• Ciudad: ${datos?.cliente?.ciudad || 'N/A'}
• Estado: Cancelado ❌
• Total de productos: ${datos?.productos?.length || 0} artículos
• VALOR TOTAL: $${totalFinal.toLocaleString('es-ES')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Si la cancelación fue por nuestra parte, trabajaremos para resolver cualquier inconveniente. Si fue a su solicitud, confirmamos que se ha procesado correctamente.

${datos?.observacion ? `📝 OBSERVACIONES ORIGINALES:
${datos.observacion}

` : ''}Esperamos tener la oportunidad de atenderle mejor en el futuro. Su satisfacción es nuestra prioridad.

Para cualquier consulta sobre esta cancelación, no dude en contactarnos.

Saludos cordiales,

${usuario?.firstName || usuario?.nombre || 'Equipo de atención al cliente'} ${usuario?.surname || ''}${usuario?.email ? `
📧 Correo: ${usuario.email}` : ''}${usuario?.telefono ? `
📞 Teléfono: ${usuario.telefono}` : ''}

${process.env.REACT_APP_COMPANY_NAME || 'JLA Global Company'}
🌐 Soluciones tecnológicas integrales`
    );
    setShowEnviarModal(true);
  };

  // Función para enviar por correo
  const enviarPorCorreo = async () => {
    try {
      const res = await api.post(`/api/pedidos/${datos._id}/enviar-cancelado`, {
        correoDestino: correo,
        asunto: asunto,
        mensaje: mensaje,
        motivoCancelacion: motivoCancelacion
      });

      if (res.status >= 200 && res.status < 300) {
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'La notificación de pedido cancelado ha sido enviada exitosamente'
        });
        setShowEnviarModal(false);
        
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
        text: 'No se pudo enviar el correo del pedido cancelado'
      });
    }
  };

  return (
    <>
      {/* Botón para abrir modal de envío */}
      <button
        onClick={abrirModalEnvio}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <span>❌</span><span>Enviar notificación</span>
      </button>

      {/* Modal de envío de correo */}
      {showEnviarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">
                <span aria-hidden={true}>❌</span>
                <span>Enviar Notificación de Pedido Cancelado</span>
              </h3>
              <button
                onClick={() => setShowEnviarModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="input-pedido-cancelado-email-1" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo destinatario:
                </label>
                <input id="input-pedido-cancelado-email-1"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="input-pedido-cancelado-email-2" className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto:
                </label>
                <input id="input-pedido-cancelado-email-2"
                  type="text"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Asunto del correo"
                  required
                />
              </div>

              <div>
                <label htmlFor="input-pedido-cancelado-email-3" className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la cancelación:
                </label>
                <input id="input-pedido-cancelado-email-3"
                  type="text"
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Ej: Falta de stock, solicitud del cliente, etc."
                />
              </div>
              
              <div>
                <label htmlFor="input-pedido-cancelado-email-4" className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje:
                </label>
                <textarea id="input-pedido-cancelado-email-4"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={12}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-vertical"
                  placeholder="Escriba su mensaje aquí..."
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowEnviarModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={enviarPorCorreo}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <span>❌</span><span>Enviar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

PedidoCanceladoEmail.propTypes = {
  datos: PropTypes.shape({
    _id: PropTypes.string,
    numeroPedido: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    createdAt: PropTypes.string,
    fecha: PropTypes.string,
    cliente: PropTypes.shape({
      nombre: PropTypes.string,
      correo: PropTypes.string,
      telefono: PropTypes.string,
      ciudad: PropTypes.string,
    }),
    productos: PropTypes.arrayOf(
      PropTypes.shape({
        cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        precioUnitario: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      })
    ),
    total: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    observacion: PropTypes.string,
  }),
  onClose: PropTypes.func,
  onEmailSent: PropTypes.func,
};

PedidoCanceladoEmail.defaultProps = {
  datos: {},
  onClose: undefined,
  onEmailSent: undefined,
};
