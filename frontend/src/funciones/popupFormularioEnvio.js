import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import React from 'react';

const MySwal = withReactContent(Swal);

export function mostrarFormularioEnvio() {
  MySwal.fire({
    title: 'Enviar Cotización',
    html: (
      <div>
        <input
          id="input-para"
          className="swal2-input"
          placeholder="Para"
        />
        <input
          id="input-asunto"
          className="swal2-input"
          placeholder="Asunto"
        />
        <textarea
          id="input-mensaje"
          className="swal2-textarea"
          placeholder="Mensaje"
          style={{ width: '100%', height: '100px' }}
        />
      </div>
    ),
    focusConfirm: false,
    confirmButtonText: 'Enviar',
    showCancelButton: true,
    preConfirm: () => {
      const para = document.getElementById('input-para').value || '';
      const asunto = document.getElementById('input-asunto').value || '';
      const mensaje = document.getElementById('input-mensaje').value || '';

      const payload = { para, asunto, mensaje };

      if (!para || !asunto || !mensaje) {
        // keep showing the validation message for the user, but always
        // return an object of the same shape so callers can rely on a
        // consistent return type (no boolean).
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return { ...payload, valid: false };
      }

      return { ...payload, valid: true };
    }
  }).then((result) => {
    if (result.isConfirmed && result.value && result.value.valid !== false) {
      const { para, asunto, mensaje } = result.value;
      console.log('Datos enviados:', { para, asunto, mensaje });

      Swal.fire('Enviado', 'La cotización ha sido enviada con éxito.', 'success');
    }
  });
}
