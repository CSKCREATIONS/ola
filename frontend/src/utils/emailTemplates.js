import { formatDateIso, buildSignature, getCompanyName, calculateTotal } from './emailHelpers';

export function makePedidoCanceladoTemplate(datos = {}, usuario = null) {
  const totalCalculado = calculateTotal(datos) || 0;
  const totalFinal = datos?.total || totalCalculado;
  const fechaPedidoOriginal = datos?.createdAt ? formatDateIso(datos.createdAt) : formatDateIso(datos?.fecha);

  const asunto = `Pedido Cancelado ${datos?.numeroPedido || ''} - ${datos?.cliente?.nombre || 'Cliente'} | ${getCompanyName()}`;

  const mensaje = `Estimado/a ${datos?.cliente?.nombre || 'cliente'},

Lamentamos informarle que su pedido ha sido cancelado. A continuación los detalles:

📦 DETALLES DEL PEDIDO CANCELADO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Número de pedido: ${datos?.numeroPedido || 'N/A'}
• Fecha de pedido original: ${fechaPedidoOriginal}
• Fecha de cancelación: ${formatDateIso(new Date().toISOString())}
• Cliente: ${datos?.cliente?.nombre || 'N/A'}
• Correo: ${datos?.cliente?.correo || 'N/A'}
• Teléfono: ${datos?.cliente?.telefono || 'N/A'}
• Ciudad: ${datos?.cliente?.ciudad || 'N/A'}
• Estado: Cancelado ❌
• Total de productos: ${datos?.productos?.length || 0} artículos
• VALOR TOTAL: $${(Number(totalFinal) || 0).toLocaleString('es-ES')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${datos?.observacion ? `📝 OBSERVACIONES ORIGINALES:\n${datos.observacion}\n\n` : ''}Esperamos tener la oportunidad de atenderle mejor en el futuro. Su satisfacción es nuestra prioridad.

Para cualquier consulta sobre esta cancelación, no dude en contactarnos.

Saludos cordiales,

${buildSignature(usuario)}

${getCompanyName()}
🌐 Soluciones tecnológicas integrales`;

  return { asunto, mensaje };
}

export function makePedidoDevueltoTemplate(datos = {}, usuario = null) {
  const totalCalculado = calculateTotal(datos) || 0;
  const totalFinal = datos?.total || totalCalculado;
  const fechaPedidoOriginal = datos?.createdAt ? formatDateIso(datos.createdAt) : formatDateIso(datos?.fecha);

  const asunto = `Pedido Devuelto ${datos?.numeroPedido || ''} - ${datos?.cliente?.nombre || 'Cliente'} | ${getCompanyName()}`;

  const mensaje = `Estimado/a ${datos?.cliente?.nombre || 'cliente'},

Lamentamos informarle que su pedido ha sido devuelto. A continuación los detalles:

📦 DETALLES DEL PEDIDO DEVUELTO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Número de pedido: ${datos?.numeroPedido || 'N/A'}
• Fecha de pedido original: ${fechaPedidoOriginal}
• Fecha de devolución: ${formatDateIso(new Date().toISOString())}
• Cliente: ${datos?.cliente?.nombre || 'N/A'}
• Correo: ${datos?.cliente?.correo || 'N/A'}
• Teléfono: ${datos?.cliente?.telefono || 'N/A'}
• Ciudad: ${datos?.cliente?.ciudad || 'N/A'}
• Estado: Devuelto ↩️
• Total de productos: ${datos?.productos?.length || 0} artículos
• VALOR TOTAL: $${(Number(totalFinal) || 0).toLocaleString('es-ES')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nos pondremos en contacto con usted para coordinar el proceso de devolución y resolver cualquier inconveniente.

${datos?.observacion ? `📝 OBSERVACIONES ORIGINALES:\n${datos.observacion}\n\n` : ''}Lamentamos cualquier inconveniente causado y trabajaremos para resolver esta situación de la mejor manera posible.

Para cualquier consulta sobre esta devolución, no dude en contactarnos.

Saludos cordiales,

${buildSignature(usuario)}

${getCompanyName()}
🌐 Soluciones tecnológicas integrales`;

  return { asunto, mensaje };
}

export function makePedidoAgendadoTemplate(datos = {}, usuario = null) {
  const asunto = `Pedido Agendado ${datos?.numeroPedido || datos?.codigo || ''} - ${datos?.cliente?.nombre || 'Cliente'} | ${getCompanyName()}`;

  const mensaje = `Estimado/a ${datos?.cliente?.nombre || 'cliente'},

Le extendemos un cordial saludo desde el equipo de ventas de ${getCompanyName()}. Esperamos se encuentre muy bien.

Adjunto encontrará el formato de pedido que ha agendado con nosotros. Por favor, revise los detalles para cerciorarse de que toda la información es correcta. Cualquier inquietud o inconsistencia, no dude en contactarnos.

¡Gracias por confiar en nosotros!

${getCompanyName()}
🌐 Productos de calidad`;

  return { asunto, mensaje };
}

export function makeCotizacionTemplate(datos = {}, usuario = null) {
  const totalFinal = datos?.total || calculateTotal(datos) || 0;
  const fechaEmision = datos?.fecha ? formatDateIso(datos.fecha) : formatDateIso(new Date().toISOString());

  const asunto = `Cotización ${datos?.codigo || ''} - ${datos?.cliente?.nombre || 'Cliente'} | ${getCompanyName()}`;

  const mensaje = `Estimado/a ${datos?.cliente?.nombre || 'cliente'},

Esperamos se encuentre muy bien. Adjunto encontrará la cotización solicitada con la siguiente información:

📋 DETALLES DE LA COTIZACIÓN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Código: ${datos?.codigo || 'N/A'}
• Fecha de emisión: ${fechaEmision}
• Cliente: ${datos?.cliente?.nombre || 'N/A'}
• Correo: ${datos?.cliente?.correo || 'N/A'}
• Teléfono: ${datos?.cliente?.telefono || 'N/A'}
• Ciudad: ${datos?.cliente?.ciudad || 'N/A'}
• Estado actual: ${datos?.estado || 'Pendiente'}
• Validez de la oferta: ${datos?.validez || '15 días'}
• Total de productos: ${datos?.productos?.length || 0} artículos
• TOTAL GENERAL: S/. ${(Number(totalFinal) || 0).toLocaleString('es-ES')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${datos?.descripcion ? `📝 DESCRIPCIÓN:\n${datos.descripcion}\n\n` : ''}${datos?.condicionesPago ? `💳 CONDICIONES DE PAGO:\n${datos.condicionesPago}\n\n` : ''}Quedamos atentos a sus comentarios y esperamos su pronta respuesta para proceder con la atención de su requerimiento.

¡Gracias por confiar en nosotros!

Saludos cordiales,

${buildSignature(usuario)}

${getCompanyName()}
🌐 Productos de calidad`;

  return { asunto, mensaje };
}

export default {
  makePedidoCanceladoTemplate,
  makePedidoDevueltoTemplate,
  makePedidoAgendadoTemplate,
  makeCotizacionTemplate
};
