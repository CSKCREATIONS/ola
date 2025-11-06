// pages/VerificarProvisional.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import api from '../api/axiosConfig';

export default function VerificarProvisional() {
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

        if (data.user.provisional) {
          navigate('/cambiar-contrasena');
        } else {
          navigate('/Home');
        }
      } else {
        setMensajeError(data.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error(error);
      setMensajeError('Error en el servidor');
    }
  };

  return (
    <LoginForm
      onSubmit={handleLogin}
      username={username}
      setUsername={setUsername}
      password={password}
      setPassword={setPassword}
      mensajeError={mensajeError}
      showUsername={true}
      label='Contraseña provisional'
      accion='Ingresar'
      pregunta='¿No recibiste el correo?'
      ruta='Recupérala otra vez'
      enlace='/RecuperarContraseña'
    />
  );
}
