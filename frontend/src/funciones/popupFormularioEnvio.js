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
      const para = document.getElementById('input-para').value;
      const asunto = document.getElementById('input-asunto').value;
      const mensaje = document.getElementById('input-mensaje').value;

      if (!para || !asunto || !mensaje) {
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return false;
      }

      return { para, asunto, mensaje };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const { para, asunto, mensaje } = result.value;
      console.log('Datos enviados:', { para, asunto, mensaje });

      Swal.fire('Enviado', 'La cotización ha sido enviada con éxito.', 'success');
    }
  });
}
