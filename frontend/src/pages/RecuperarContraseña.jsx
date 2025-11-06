// pages/RecuperarContraseña.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';

export default function RecuperarContraseña() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const handleRecuperar = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/api/auth/recover-password', { email });
      const data = response.data;

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'Revisa tu correo electrónico',
          confirmButtonColor: '#3085d6'
        });
        navigate('/');
      } else {
        setMensajeError(data.message || 'No se pudo recuperar la contraseña');
      }
    } catch (error) {
      console.error('Error:', error);
      setMensajeError('Error en el servidor');
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="login-title">Portal JLA Global Company</h1>

        <form onSubmit={handleRecuperar}>
          <p style={{ color: "#333", marginBottom: "1rem" }}>
            Escribe tu correo electrónico. Allí te será enviada una contraseña provisional
          </p>

          <div className="login-input-container">
            <input
              type="email"
              id="email"
              required
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {mensajeError && <p className="login-error">{mensajeError}</p>}

          <button className="login-button" type="submit">
            Recuperar contraseña
          </button>
        </form>

        <div className="login-footer">
          <p>¿Recordaste tu contraseña?</p>
          <Link to="/">Inicia sesión aquí</Link>
        </div>
      </div>
    </div>
  );
}
