import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './CambiarContrasena.css';
import api from '../api/axiosConfig';

export default function CambiarContrasena() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      return Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
    }

    try {
      // Cambiar contraseña
      await api.patch('/api/users/change-password', { newPassword });

      // Confirmar que ya no necesita cambiarla
      await api.patch(`/api/users/${user._id}/confirm-password-change`);

      Swal.fire('Éxito', 'Contraseña actualizada', 'success');
      navigate('/Home');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo cambiar la contraseña', 'error');
    }
  };

  return (
    <div className="cambiar-contenedor">
      <form className="cambiar-formulario" onSubmit={handleSubmit}>
        <h2 >Bienvenido al Sistema de JLA Global Company</h2>
        <h3 >Por favor cambie su contraseña</h3>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
          <input
            className='entrada'
            type="password"
            id="nueva"
            required
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '1rem', alignItems: 'center' }}>
          <input
            className='entrada'
            type="password"
            id="confirmar"
            required
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-cambiar">Actualizar contraseña</button>
      </form>
    </div>
  );
}
