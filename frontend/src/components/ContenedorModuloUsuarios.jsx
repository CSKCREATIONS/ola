import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ContenedorModuloUsuarios() {
  const [puedeVerRoles, setPuedeVerRoles] = useState(false);
  const [puedeVerUsuarios, setPuedeVerUsuarios] = useState(false);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('user'));
    if (usuario && usuario.permissions) {
      setPuedeVerRoles(usuario.permissions.includes('roles.ver'));
      setPuedeVerUsuarios(usuario.permissions.includes('usuarios.ver'));
    }
  }, []);

  return (
    <section className="p-4 flex justify-center">
      <fieldset className="border-2 border-yellow-500 rounded-2xl p-6 shadow-lg bg-gradient-to-b from-black via-gray-900 to-gray-950 w-fit mx-auto">
        <legend className="px-2 text-lg font-bold text-yellow-400">
          Usuarios
        </legend><br/>
        <div className="flex flex-wrap gap-6 mt-4" style={{ display: "grid", gap: "16px", justifyContent: "center", gridTemplateColumns: "repeat(auto-fit, minmax(140px, max-content))", margin: "0" }}>
          {puedeVerUsuarios && (
            <Link to="/ListaDeUsuarios">
              <button className="flex flex-col items-center justify-center w-20 h-20 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                
                <img
                  src="https://cdn-icons-png.freepik.com/256/7169/7169774.png"
                  alt="Usuarios"
                  style={{ width: "80px", height: "80px" }}
                />
                <span className="text-sm font-medium">Lista de usuarios</span>
              </button>
            </Link>
          )}
          
          {puedeVerRoles && (
            <Link to="/RolesYPermisos">
              <button className="flex flex-col items-center justify-center w-20 h-20 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px" }}>
                <img
                  src="https://cdn-icons-png.freepik.com/256/5507/5507771.png"
                  alt="Roles"
                  style={{ width: "80px", height: "80px" }}
                />
                <span className="text-sm font-medium">Roles y permisos</span>
              </button>
            </Link>
          )}
        </div>
      </fieldset>
    </section>
  );
}
