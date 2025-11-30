// pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post('/api/auth/signin', { username, password });
      const data = res.data;

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        if (data.user.mustChangePassword) {
          navigate('/cambiar-contrasena');
        } else {
          navigate('/Home');
        }
      } else {
        // Si el backend responde con éxito false (caso raro), mostrar su mensaje
        // o un mensaje genérico para credenciales inválidas
        const msg = data.message || 'Usuario o contraseña incorrectos';
        setMensajeError(msg);
      }
    } catch (error) {
      console.error('Login error:', error);

      // Si axios devolvió una respuesta del servidor, extraer el mensaje y el status
      const resp = error?.response;
      const serverMsg = resp?.data?.message;
      const status = resp?.status;

      // Mapear distintos estados/mensajes del backend a mensajes específicos:
      // - 404: Usuario no encontrado
      // - 401: Credenciales inválidas (contraseña incorrecta)
      // - 403: Rol deshabilitado o Usuario deshabilitado
      if (status === 404 && serverMsg === 'Usuario no encontrado') {
        setMensajeError('Usuario no encontrado');
      } else if (status === 401 && serverMsg === 'Credenciales inválidas') {
        setMensajeError('Credenciales inválidas');
      } else if (serverMsg === 'Rol deshabilitado' || serverMsg === 'Usuario deshabilitado') {
        setMensajeError(serverMsg);
      } else if (serverMsg) {
        setMensajeError(serverMsg);
      } else {
        setMensajeError('Error en el servidor');
      }
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
