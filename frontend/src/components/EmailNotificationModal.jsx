import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import { getStoredUser } from '../utils/emailHelpers';

export default function EmailNotificationModal({
  datos,
  onClose,
  onEmailSent,
  templateMaker,
  endpointSuffix,
  triggerIcon,
  triggerLabel,
  modalTitle,
  colorClass = 'orange',
  motivoLabel = 'Motivo',
  motivoField = 'motivo'
}) {
  const usuario = getStoredUser();
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [correo, setCorreo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [motivo, setMotivo] = useState('');

  const abrirModalEnvio = () => {
    setCorreo(datos?.cliente?.correo || '');
    const t = templateMaker ? templateMaker(datos, usuario) : { asunto: '', mensaje: '' };
    setAsunto(t.asunto || '');
    setMensaje(t.mensaje || '');
    setShowEnviarModal(true);
  };

  const enviarPorCorreo = async () => {
    try {
      const body = { correoDestino: correo, asunto, mensaje };
      body[motivoField] = motivo;
      const res = await api.post(`/api/pedidos/${datos._id}/${endpointSuffix}`, body);

      if (res.status >= 200 && res.status < 300) {
        Swal.fire({ icon: 'success', title: 'Correo enviado', text: 'La notificación ha sido enviada exitosamente' });
        setShowEnviarModal(false);
        if (onClose) onClose();
        if (onEmailSent) onEmailSent(datos._id);
      } else {
        throw new Error('Error al enviar correo');
      }
    } catch (error_) {
      // eslint-disable-next-line no-console
      console.error('EmailNotificationModal enviarPorCorreo error:', error_);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo enviar el correo' });
    }
  };

  let ringClass = 'focus:ring-indigo-500';
  if (colorClass === 'red') {
    ringClass = 'focus:ring-red-500';
  } else if (colorClass === 'orange') {
    ringClass = 'focus:ring-orange-500';
  }

  let btnBg;
  if (colorClass === 'red') {
    btnBg = 'bg-red-500 hover:bg-red-600';
  } else if (colorClass === 'orange') {
    btnBg = 'bg-orange-500 hover:bg-orange-600';
  } else {
    btnBg = 'bg-indigo-600 hover:bg-indigo-700';
  }

  return (
    <>
      <button onClick={abrirModalEnvio} className={`${btnBg} text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}>
        <span>{triggerIcon}</span><span>{triggerLabel}</span>
      </button>

      {showEnviarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">
                <span aria-hidden={true}>{triggerIcon}</span>
                <span>{modalTitle}</span>
              </h3>
              <button onClick={() => setShowEnviarModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold" aria-label="Cerrar">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Correo destinatario:</label>
                <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg ${ringClass} focus:border-transparent`} placeholder="correo@ejemplo.com" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asunto:</label>
                <input type="text" value={asunto} onChange={(e) => setAsunto(e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg ${ringClass} focus:border-transparent`} placeholder="Asunto del correo" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{motivoLabel}:</label>
                <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg ${ringClass} focus:border-transparent`} placeholder="Ej: motivo" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje:</label>
                <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={12} className={`w-full p-3 border border-gray-300 rounded-lg ${ringClass} focus:border-transparent resize-vertical`} placeholder="Escriba su mensaje aquí..." required />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button onClick={() => setShowEnviarModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
              <button onClick={enviarPorCorreo} className={`px-6 py-2 ${btnBg} text-white rounded-lg hover:opacity-95 transition-colors flex items-center gap-2`} aria-label="Enviar notificación">
                <span aria-hidden={true}>{triggerIcon}</span>
                <span>Enviar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

EmailNotificationModal.propTypes = {
  datos: PropTypes.object.isRequired,
  onClose: PropTypes.func,
  onEmailSent: PropTypes.func,
  templateMaker: PropTypes.func,
  endpointSuffix: PropTypes.string.isRequired,
  triggerIcon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  triggerLabel: PropTypes.string,
  modalTitle: PropTypes.string,
  colorClass: PropTypes.string,
  motivoLabel: PropTypes.string,
  motivoField: PropTypes.string
};

EmailNotificationModal.defaultProps = {
  onClose: undefined,
  onEmailSent: undefined,
  templateMaker: undefined,
  triggerIcon: '✉️',
  triggerLabel: 'Enviar notificación',
  modalTitle: 'Enviar notificación',
  colorClass: 'orange',
  motivoLabel: 'Motivo',
  motivoField: 'motivo'
};
