import React from 'react';
import { Link } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function Error504() {
  return (
    <div className="error-page">
      <i className="fas fa-server"></i>
      <h1>Error 504</h1>
      <p>El servidor tardó demasiado en responder. Intenta más tarde.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  );
}
