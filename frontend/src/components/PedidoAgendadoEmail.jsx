import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import {
  getStoredUser,
  calculateTotal,
  formatDateIso,
  
} from '../utils/emailHelpers';
import { makePedidoAgendadoTemplate } from '../utils/emailTemplates';

export default function PedidoAgendadoEmail({ datos, onClose, onEmailSent }) {
  // Obtener usuario logueado
  const usuario = getStoredUser();
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  
  // Estados para el formulario de envío de correo
  const [correo, setCorreo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Función para abrir modal con datos actualizados
  const abrirModalEnvio = () => {
    // Calcular total dinámicamente si no existe
      const totalCalculado = calculateTotal(datos) || 0;

    // Fecha de pedido: preferir createdAt, si no existe usar fecha, si ninguna está presente mostrar 'N/A'
    const fechaPedido = datos?.createdAt ? formatDateIso(datos.createdAt) : formatDateIso(datos?.fecha);

    // Observaciones: extraer el bloque para mejorar legibilidad
    const observacionesBlock = datos?.observacion
      ? `📝 OBSERVACIONES:
${datos.observacion}

`
      : '';

    // Actualizar datos autocompletados cada vez que se abre el modal
    setCorreo(datos?.cliente?.correo || '');
    // Use shared template helper to build subject and message
    const { asunto: tplAsunto, mensaje: tplMensaje } = makePedidoAgendadoTemplate(datos, usuario);
    setAsunto(tplAsunto);
    setMensaje(tplMensaje);
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
        <span>📧</span><span>Enviar por correo</span>
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
                <span>📧</span><span>Enviar</span>
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