import React from 'react'
import { closeModal } from '../funciones/animaciones'
import Swal from 'sweetalert2';


export default function EditarUsuario() {
    const handleClick = () => {
            Swal.fire({
              text: 'Los datos fueron editados correctamente',
              icon: 'success',
              showCancelButton: false,
              showCloseButton: true,
              confirmButtonColor: '#3085d6',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Aceptar'
            }).then(() => {
              closeModal('editUserModal'); // cerrar después de aceptar
            });
          };
    return (

        <div className="modal" id="editUserModal">
            <div className="modal-content">
                <div className="form-group">
                    <label htmlFor="nombre-razon-social">Nombre / Razón Social</label>
                    <input id="nombre-razon-social" className='entrada' type="text" required />
                    </div>
                <div className="form-group">
                    <label htmlFor="ciudad">Ciudad</label>
                    <input id="ciudad" className='entrada' type="text" required />
                </div>
                <div className="form-group">
                    <label htmlFor="telefono">Telefono</label>
                    <input id="telefono" className='entrada' type="text" required />
                </div>
                <div className="form-group">
                    <label htmlFor="correo">Correo</label>
                    <input id="correo" className='entrada' type="text" required />
                </div>
                
                <div className="buttons">
                    <button className="btn btn-secondary" onClick={() => closeModal('editUserModal')}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleClick}>Guardar Cambios</button>
                </div>

                



            </div>
        </div>
    )
}
