import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ContenedorModuloProductos() {
  const [puedeVerCategorias, setPuedeVerCategorias] = useState(false);
  const [puedeVerSubcategorias, setPuedeVerSubcategorias] = useState(false);
  const [puedeVerProductos, setPuedeVerProductos] = useState(false);
  const [puedeVerReportesProductos, setPuedeVerReportesProductos] = useState(false);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('user'));
    if (usuario && usuario.permissions) {
      setPuedeVerCategorias(usuario.permissions.includes('categorias.ver'));
      setPuedeVerSubcategorias(usuario.permissions.includes('subcategorias.ver'));
      setPuedeVerProductos(usuario.permissions.includes('productos.ver'));
      setPuedeVerReportesProductos(usuario.permissions.includes('reportesProductos.ver'));
    }
  }, []);

  return (
    <section className="p-4 flex justify-center">
      <fieldset className="border-2 border-yellow-500 rounded-2xl p-6 shadow-lg bg-gradient-to-b from-black via-gray-900 to-gray-950 w-fit mx-auto">
        <legend className="px-2 text-lg font-bold text-yellow-400">
          Productos
        </legend>
        <br/>
        <div className="flex flex-wrap gap-6 mt-4" style={{ display: "grid", gap: "16px", justifyContent: "center", gridTemplateColumns: "repeat(auto-fit, minmax(140px, max-content))", margin: "0" }}>
          {puedeVerCategorias && (
            <Link to="/categorias">
              <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:scale-105 hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                <img
                  src="https://cdn-icons-png.flaticon.com/128/10522/10522934.png"
                  alt="Categorías"
                  style={{ width: "80px", height: "80px" }}
                />
                <span className="text-sm font-medium">Categorías</span>
              </button>
            </Link>
          )}

          {puedeVerSubcategorias && (
            <Link to="/subcategorias">
              <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:scale-105 hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                <img
                  src="https://cdn-icons-png.flaticon.com/128/845/845646.png"
                  alt="Subcategorías"
                  style={{ width: "80px", height: "80px" }}
                />
                <span className="text-sm font-medium">Subcategorías</span>
              </button>
            </Link>
          )}

          {puedeVerProductos && (
            <Link to="/GestionProductos">
              <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:scale-105 hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                <img
                  src="https://cdn-icons-png.flaticon.com/128/3081/3081559.png"
                  alt="Productos"
                  style={{ width: "80px", height: "80px" }}
                />
                <span className="text-sm font-medium">Productos</span>
              </button>
            </Link>
          )}

          {puedeVerReportesProductos && (
            <Link to="/ReporteProductos">
              <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:scale-105 hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                <img
                  src="https://cdn-icons-png.flaticon.com/128/3081/3081559.png"
                  alt="Reportes productos"
                  style={{ width: "80px", height: "80px" }}
                />
                <span className="text-sm font-medium">Reportes productos</span>
              </button>
            </Link>
          )}
        </div>
      </fieldset>
    </section>
  );
}
