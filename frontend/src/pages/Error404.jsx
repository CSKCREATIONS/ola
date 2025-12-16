import React from 'react';
import { Link } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function Error404() {
  return (
    <div className="error-page">
      <i className="fas fa-exclamation-triangle"></i>
      <h1>Error 404</h1>
      <p>La página que estás buscando no se encuentra.</p>
      <Link to="/Home">Volver al inicio</Link>
    </div>
  );
}
