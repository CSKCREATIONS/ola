import React from 'react';
import PropTypes from 'prop-types';
import EmailNotificationModal from './EmailNotificationModal';
import { makePedidoDevueltoTemplate } from '../utils/emailTemplates';

export default function PedidoDevueltoEmail(props) {
  return (
    <EmailNotificationModal
      {...props}
      templateMaker={makePedidoDevueltoTemplate}
      endpointSuffix="enviar-devuelto"
      triggerIcon="↩️"
      triggerLabel="Enviar notificación"
      modalTitle="Enviar Notificación de Pedido Devuelto"
      colorClass="orange"
      motivoLabel="Motivo de la devolución"
      motivoField="motivoDevolucion"
    />
  );
}

PedidoDevueltoEmail.propTypes = {
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

PedidoDevueltoEmail.defaultProps = {
  datos: {},
  onClose: undefined,
  onEmailSent: undefined,
};
