// pages/RecuperarContraseña.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function RecuperarContraseña() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const handleRecuperar = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

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
