import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NavUsuarios() {
  const [puedeVerUsuarios, setPuedeVerUsuarios] = useState(false);
  const [puedeVerRoles, setPuedeVerRoles] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const usuario = JSON.parse(storedUser);
      if (usuario.permissions) {
        setPuedeVerUsuarios(usuario.permissions.includes('usuarios.ver'));
        setPuedeVerRoles(usuario.permissions.includes('roles.ver'));
      }
    }
  }, []);

  return (
    <div>
      <h2>Usuarios</h2>
      <div className="nav-modulo-wrapper">
        <nav className="nav-modulo" id="usuarios-nav">
          {puedeVerUsuarios && (
            <Link
              to="/ListaDeUsuarios"
              className={
                location.pathname === '/ListaDeUsuarios' ? 'nav-item active' : 'nav-item'
              }
            >
              Lista de usuarios
            </Link>
          )}

          {puedeVerRoles && (
            <Link
              to="/RolesYPermisos"
              className={
                location.pathname === '/RolesYPermisos' ? 'nav-item active' : 'nav-item'
              }
            >
              Roles y permisos
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
