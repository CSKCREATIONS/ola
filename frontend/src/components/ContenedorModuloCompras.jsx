import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ContenedorModuloCompras() {
  const [puedeVerProveedores, setPuedeVerProveedores] = useState(false);
  const [puedeVerHCompras, setPuedeVerHCompras] = useState(false);
  const [puedeVerReportesCompras, setPuedeVerReportesCompras] = useState(false);
  const [puedeVerOrdenes, setPuedeVerOrdenes] = useState(false);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('user'));
    if (usuario && usuario.permissions) {
      setPuedeVerProveedores(usuario.permissions.includes('proveedores.ver'));
      setPuedeVerHCompras(usuario.permissions.includes('hcompras.ver'));
      setPuedeVerReportesCompras(usuario.permissions.includes('reportesCompras.ver'));
      setPuedeVerOrdenes(usuario.permissions.includes('ordenesCompra.ver'));
    }
  }, []);

  return (
    <section className="p-4 flex justify-center">
      {(puedeVerOrdenes || puedeVerHCompras || puedeVerProveedores || puedeVerReportesCompras) && (
        <fieldset className="border-2 border-yellow-500 rounded-2xl p-6 shadow-lg bg-gradient-to-b from-black via-gray-900 to-gray-950 w-fit">
          <legend className="px-2 text-lg font-bold text-yellow-400">
            Compras
          </legend><br/>
          <div className="flex flex-wrap gap-6 mt-4"style={{ display: "grid", gap: "16px", justifyContent: "center", gridTemplateColumns: "repeat(auto-fit, minmax(140px, max-content))", margin: "0" }}>
            {puedeVerOrdenes && (
              <Link to="/OrdenCompra">
                <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                  <img
                    src="https://cdn-icons-png.flaticon.com/128/2728/2728447.png"
                    alt="Orden de compra"
                    style={{ width: "80px", height: "80px" }}
                  />
                  <span className="text-sm font-medium">
                    Orden de compra
                  </span>
                </button>
              </Link>
            )}

            {puedeVerHCompras && (
              <Link to="/HistorialCompras">
                <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                  <img
                    src="https://cdn-icons-png.flaticon.com/128/2921/2921222.png"
                    alt="Historial de compras"
                    style={{ width: "80px", height: "80px" }}
                  />
                  <span className="text-sm font-medium">
                    Historial de compras
                  </span>
                </button>
              </Link>
            )}

            {puedeVerProveedores && (
              <Link to="/Proveedores">
                <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                  <img
                    src="https://cdn-icons-png.flaticon.com/128/942/942751.png"
                    alt="Proveedores"
                    style={{ width: "80px", height: "80px" }}
                  />
                  <span className="text-sm font-medium">
                    Catálogo de proveedores
                  </span>
                </button>
              </Link>
            )}

            {puedeVerReportesCompras && (
              <Link to="/ReporteProveedores">
                <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                  <img
                    src="https://cdn-icons-png.flaticon.com/128/942/942751.png"
                    alt="Reportes de compras"
                    style={{ width: "80px", height: "80px" }}
                  />
                  <span className="text-sm font-medium">
                    Reportes de compras
                  </span>
                </button>
              </Link>
            )}
          </div>
        </fieldset>
      )}
    </section>
  );
}