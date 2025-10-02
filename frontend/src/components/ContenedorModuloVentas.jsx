import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ContenedorModuloVentas() {
  const [puedeRegistrarCotizacion, setPuedeRegistrarCotizacion] = useState(false);
  const [puedeVerCotizaciones, setPuedeVerCotizaciones] = useState(false);
  const [puedeVerVentasAgendadas, setPuedeVerVentasAgendadas] = useState(false);
  const [puedeVerPedidosDespachados, setPuedeVerPedidosDespachados] = useState(false);
  const [puedeVerPedidosEntregados, setPuedeVerPedidosEntregados] = useState(false);
  const [puedeVerPedidosCancelados, setPuedeVerPedidosCancelados] = useState(false);
  const [puedeVerPedidosDevueltos, setPuedeVerPedidosDevueltos] = useState(false);
  const [puedeVerListaDeClientes, setPuedeVerListaDeClientes] = useState(false);
  const [puedeVerProspectos, setPuedeVerProspectos] = useState(false);
  const [puedeVerReportesVentas, setPuedeVerReportesVentas] = useState(false);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('user'));
    if (usuario && usuario.permissions) {
      setPuedeRegistrarCotizacion(usuario.permissions.includes('cotizaciones.crear'));
      setPuedeVerCotizaciones(usuario.permissions.includes('cotizaciones.ver'));
      setPuedeVerVentasAgendadas(usuario.permissions.includes('pedidosAgendados.ver'));
      setPuedeVerPedidosDespachados(usuario.permissions.includes('pedidosDespachados.ver'));
      setPuedeVerPedidosEntregados(usuario.permissions.includes('pedidosEntregados.ver'));
      setPuedeVerPedidosCancelados(usuario.permissions.includes('pedidosCancelados.ver'));
      setPuedeVerPedidosDevueltos(usuario.permissions.includes('pedidosDevueltos.ver'));
      setPuedeVerListaDeClientes(usuario.permissions.includes('clientes.ver'));
      setPuedeVerProspectos(usuario.permissions.includes('prospectos.ver'));
      setPuedeVerReportesVentas(usuario.permissions.includes('reportesVentas.ver'));
    }
  }, []);

  return (
    <section className="p-4 flex justify-center">
      <fieldset className="border-2 border-yellow-500 rounded-2xl p-6 shadow-lg bg-gradient-to-b from-black via-gray-900 to-gray-950 w-fit mx-auto">
        <legend className="px-2 text-lg font-bold text-yellow-400">
          Ventas
        </legend>
        <br/>
        <div className="flex flex-wrap gap-6 mt-4" style={{ display: "grid", gap: "16px", justifyContent: "center", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))"}}>
          {puedeRegistrarCotizacion && (
            <Link to="/RegistrarCotizacion">
              <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:scale-105 hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                <img src="https://cdn-icons-png.freepik.com/256/14185/14185243.png" alt="Registrar cotización" style={{ width: "80px", height: "80px" }} />
                <span className="text-sm font-medium">Registrar cotización</span>
              </button>
            </Link>
          )}

          {puedeVerCotizaciones && (
            <Link to="/ListaDeCotizaciones">
              <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:scale-105 hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                <img src="https://cdn-icons-png.freepik.com/256/2666/2666436.png" alt="Lista de cotizaciones" style={{ width: "80px", height: "80px" }} />
                <span className="text-sm font-medium">Lista de cotizaciones</span>
              </button>
            </Link>
          )}

          {puedeVerVentasAgendadas && (
            <Link to="/PedidosAgendados">
              <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:scale-105 hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                <img src="https://cdn-icons-png.freepik.com/256/12155/12155326.png" alt="Pedidos agendados" style={{ width: "80px", height: "80px" }} />
                <span className="text-sm font-medium">Pedidos Agendados</span>
              </button>
            </Link>
          )}

          {/*{puedeVerPedidosDespachados && (
            <Link to="/PedidosDespachados">
              <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:scale-105 hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                <img src="https://cdn-icons-png.freepik.com/256/12155/12155326.png" alt="Pedidos despachados" style={{ width: "80px", height: "80px" }} />
                <span className="text-sm font-medium">Pedidos despachados</span>
              </button>
            </Link>
          )}*/}

          {puedeVerPedidosEntregados && (
            <Link to="/PedidosEntregados">
              <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:scale-105 hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                <img src="https://cdn-icons-png.freepik.com/256/2711/2711224.png" alt="Pedidos entregados" style={{ width: "80px", height: "80px" }} />
                <span className="text-sm font-medium">Pedidos entregados</span>
              </button>
            </Link>
          )}

          {puedeVerPedidosCancelados && (
            <Link to="/PedidosCancelados">
              <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:scale-105 hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                <img src="https://cdn-icons-png.freepik.com/256/1136/1136923.png" alt="Pedidos cancelados" style={{ width: "80px", height: "80px" }} />
                <span className="text-sm font-medium">Pedidos cancelados</span>
              </button>
            </Link>
          )}

          {puedeVerPedidosDevueltos && (
            <Link to="/PedidosDevueltos">
              <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:scale-105 hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                <img src="https://cdn-icons-png.freepik.com/256/14185/14185243.png" alt="Pedidos devueltos" style={{ width: "80px", height: "80px" }} />
                <span className="text-sm font-medium">Pedidos devueltos</span>
              </button>
            </Link>
          )}

          {puedeVerListaDeClientes && (
            <Link to="/ListaDeClientes">
              <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:scale-105 hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                <img src="https://cdn-icons-png.freepik.com/256/3239/3239045.png" alt="Lista de clientes" style={{ width: "80px", height: "80px" }} />
                <span className="text-sm font-medium">Lista de clientes</span>
              </button>
            </Link>
          )}

          {puedeVerProspectos && (
            <Link to="/ProspectosDeClientes">
              <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:scale-105 hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                <img src="https://cdn-icons-png.freepik.com/256/901/901407.png" alt="Prospectos de cliente" style={{ width: "80px", height: "80px" }} />
                <span className="text-sm font-medium">Prospectos de cliente</span>
              </button>
            </Link>
          )}

          {puedeVerReportesVentas && (
            <Link to="/ReportessVentas">
              <button className="flex flex-col items-center justify-center w-28 h-28 p-4 rounded-xl bg-gray-800 text-yellow-400 shadow-md hover:scale-105 hover:bg-yellow-500 hover:text-black transition duration-300" style={{ width: "140px", height: "140px", gap: "6px", borderRadius: "15px"}}>
                <img src="https://cdn-icons-png.freepik.com/256/901/901407.png" alt="Reportes ventas" style={{ width: "80px", height: "80px" }} />
                <span className="text-sm font-medium">Reportes</span>
              </button>
            </Link>
          )}
        </div>
      </fieldset>
    </section>
  );
}
