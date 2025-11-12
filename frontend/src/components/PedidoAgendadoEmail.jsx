import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';

export default function PedidoAgendadoEmail({ datos, onClose, onEmailSent }) {
  // Obtener usuario logueado
  const usuario = JSON.parse(localStorage.getItem('user') || '{}');
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  
  // Estados para el formulario de envío de correo
  const [correo, setCorreo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Función para abrir modal con datos actualizados
  const abrirModalEnvio = () => {
    // Calcular total dinámicamente si no existe
    const totalCalculado = datos?.productos?.reduce((total, producto) => {
      const cantidad = Number(producto.cantidad) || 0;
      const precio = Number(producto.precioUnitario) || 0;
      return total + (cantidad * precio);
    }, 0) || 0;
    
    const totalFinal = datos?.total || totalCalculado;
    
    // Actualizar datos autocompletados cada vez que se abre el modal
    setCorreo(datos?.cliente?.correo || '');
    setAsunto(`Pedido Agendado ${datos?.numeroPedido || ''} - ${datos?.cliente?.nombre || 'Cliente'} | ${process.env.REACT_APP_COMPANY_NAME || 'JLA Global Company'}`);
    setMensaje(
      `Estimado/a ${datos?.cliente?.nombre || 'cliente'},

Esperamos se encuentre muy bien. Su pedido ha sido agendado exitosamente con la siguiente información:

📦 DETALLES DEL PEDIDO AGENDADO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Número de pedido: ${datos?.numeroPedido || 'N/A'}
• Fecha de pedido: ${datos?.createdAt ? new Date(datos.createdAt).toLocaleDateString('es-ES') : datos?.fecha ? new Date(datos.fecha).toLocaleDateString('es-ES') : 'N/A'}
• Fecha de entrega programada: ${datos?.fechaEntrega ? new Date(datos.fechaEntrega).toLocaleDateString('es-ES') : 'Por definir'}
• Cliente: ${datos?.cliente?.nombre || 'N/A'}
• Correo: ${datos?.cliente?.correo || 'N/A'}
• Teléfono: ${datos?.cliente?.telefono || 'N/A'}
• Ciudad: ${datos?.cliente?.ciudad || 'N/A'}
• Estado: Agendado ✅
• Total de productos: ${datos?.productos?.length || 0} artículos
• TOTAL GENERAL: $${totalFinal.toLocaleString('es-ES')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Su pedido será procesado y entregado en las fechas programadas. Mantendremos comunicación constante sobre el progreso de su orden.

${datos?.observacion ? `📝 OBSERVACIONES:
${datos.observacion}

` : ''}¡Gracias por confiar en nosotros y esperamos cumplir con todas sus expectativas!

Si tiene alguna pregunta sobre su pedido, no dude en contactarnos.

Saludos cordiales,

${usuario?.firstName || usuario?.nombre || 'Equipo de ventas'} ${usuario?.surname || ''}${usuario?.email ? `
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
      const response = await api.post(`/api/pedidos/${datos._id}/enviar-agendado`, {
        correoDestino: correo,
        asunto: asunto,
        mensaje: mensaje
      });

      if (response && response.status >= 200 && response.status < 300) {
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'El pedido agendado ha sido enviado exitosamente'
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
        text: 'No se pudo enviar el correo del pedido'
      });
    }
  };

  return (
    <>
      {/* Botón para abrir modal de envío */}
      <button
        onClick={abrirModalEnvio}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <span>📧</span>
        Enviar por correo
      </button>

      {/* Modal de envío de correo */}
      {showEnviarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">
                📧 Enviar Pedido Agendado por Correo
              </h3>
              <button
                onClick={() => setShowEnviarModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="correo-destinatario" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo destinatario:
                </label>
                <input
                  id="correo-destinatario"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="asunto" className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto:
                </label>
                <input
                  id="asunto"
                  type="text"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Asunto del correo"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje:
                </label>
                <textarea
                  id="mensaje"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={12}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
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
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <span>📧</span>
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

PedidoAgendadoEmail.propTypes = {
  datos: PropTypes.shape({
    _id: PropTypes.string,
    numeroPedido: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    createdAt: PropTypes.string,
    fecha: PropTypes.string,
    fechaEntrega: PropTypes.string,
    cliente: PropTypes.shape({
      nombre: PropTypes.string,
      correo: PropTypes.string,
      telefono: PropTypes.string,
      ciudad: PropTypes.string,
    }),
    productos: PropTypes.arrayOf(
      PropTypes.shape({
        cantidad: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        precioUnitario: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
    total: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    observacion: PropTypes.string,
  }),
  onClose: PropTypes.func,
  onEmailSent: PropTypes.func,
};

PedidoAgendadoEmail.defaultProps = {
  datos: {},
  onClose: undefined,
  onEmailSent: undefined,
};