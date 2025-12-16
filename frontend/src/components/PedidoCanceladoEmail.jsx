import React from 'react';
import PropTypes from 'prop-types';
import EmailNotificationModal from './EmailNotificationModal';
import { makePedidoCanceladoTemplate } from '../utils/emailTemplates';

export default function PedidoCanceladoEmail(props) {
  return (
    <EmailNotificationModal
      {...props}
      templateMaker={makePedidoCanceladoTemplate}
      endpointSuffix="enviar-cancelado"
      triggerIcon="❌"
      triggerLabel="Enviar notificación"
      modalTitle="Enviar Notificación de Pedido Cancelado"
      colorClass="red"
      motivoLabel="Motivo de la cancelación"
      motivoField="motivoCancelacion"
    />
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
