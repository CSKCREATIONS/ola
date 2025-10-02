import Swal from 'sweetalert2';
import { mostrarFormularioEnvio } from './popupFormularioEnvio';

export function mostrarPopupCotizacion(datos) {
  const {
    cliente,
    ciudad,
    telefono,
    correo,
    responsable,
    fecha,
    descripcion,
    producto,
    cantidad,
    valorUnitario,
    valorTotal,
  } = datos;

  Swal.fire({
    title: 'Resumen de Cotización',
    html: `
      <p><strong>Cliente:</strong> ${cliente}</p>
      <p><strong>Ciudad:</strong> ${ciudad}</p>
      <p><strong>Teléfono:</strong> ${telefono}</p>
      <p><strong>Correo:</strong> ${correo}</p>
      <p><strong>Responsable:</strong> ${responsable}</p>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <p><strong>Descripción:</strong> ${descripcion}</p>
      <p><strong>Producto:</strong> ${producto}</p>
      <p><strong>Cantidad:</strong> ${cantidad}</p>
      <p><strong>Valor Unitario:</strong> $${valorUnitario}</p>
      <p><strong>Valor Total:</strong> $${valorTotal}</p>
    `,
    showCancelButton: true,
    confirmButtonText: 'Enviar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
  }).then((result) => {
    if (result.isConfirmed) {
      // Mostrar el popup con campos de envío
      mostrarFormularioEnvio();
    }
  });
}
