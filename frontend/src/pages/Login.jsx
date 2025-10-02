// pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        if (data.user.mustChangePassword) {
          navigate('/cambiar-contrasena');
        } else {
          navigate('/Home');
        }
      } else {
        setMensajeError(data.message || 'Credenciales inválidas');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMensajeError('Error en el servidor');
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="login-title">Portal JLA Global Company</h1>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-input-container">
            <input
              type="text"
              id="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuario"
            />
          </div>

          <div className="login-input-container">
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
            />
          </div>

          {mensajeError && <p className="login-error">{mensajeError}</p>}

          <button className="login-button" type="submit">
            Iniciar sesión
          </button>
        </form>

        <div className="login-footer">
          <p>¿Has olvidado tu contraseña?</p>
          <Link to="/RecuperarContraseña">Recupérala aquí</Link>
        </div>
      </div>
    </div>
  );
}
