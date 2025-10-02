// src/routes/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // Si no ha iniciado sesión
  if (!token || !user) {
    return <Navigate to="/" />;
  }

  // Si el usuario está inhabilitado
  if (user.enabled === false) {
    return <Navigate to="/" />;
  }

  return children;
}
