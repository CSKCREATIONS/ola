import React from 'react';
import { Routes, Route, BrowserRouter, } from "react-router-dom";
import './App.css';
import ListaDeUsuarios from './pages/ListaDeUsuarios';
import CambiarContrasena from './components/CambiarContraseña';
import Perfil from './pages/Perfil';
import RolesYPermisos from './pages/RolesYPermisos'
import Home from './pages/Home';
import PedidosAgendados from './pages/PedidosAgendados';
import PedidosEntregados from './pages/PedidosEntregados';
import PedidosCancelados from './pages/PedidosCancelados';
import RegistrarCotizacion from './pages/RegistrarCotizacion';
import ListaDeCotizaciones from './pages/ListaDeCotizaciones';
import ListaDeClientes from './pages/ListaDeClientes';
import ProspectosDeCliente from './pages/ProspectosDeCliente';
import Login from './pages/Login';
import RecuperarContraseña from './pages/RecuperarContraseña';
import Error404 from './pages/Error404';
import Error504 from './pages/Error504';
import Proveedores from './pages/Proveedores';
import HistorialCompras from './pages/HistorialCompras';
import GestionProductos from './pages/GestionProductos';
import ListaDeCategorias from './pages/ListaDeCategorias';
import ReportessVentas from './pages/ReportessVentas';
import PrivateRoute from './routes/PrivateRoute';
import PermisoRoute from './routes/PermisoRoute';
import ReporteProveedores from './pages/ReporteProveedores';
import ReporteProductos from './pages/ReporteProductos';
import OrdenCompra from './pages/OrdenCompra';
import RegistrarCompra from './pages/RegistrarCompra';


const App = () => {
  return (
    <div className="App">
      <BrowserRouter>



        <Routes>

          {/* *****************Rutas públicas *****************/}
          <Route index path='/' element={<Login />} />
          <Route path='/RecuperarContraseña' element={<RecuperarContraseña />} />
          <Route path="/error504" element={<Error504 />} />
          <Route path="*" element={<Error404 />} />

          {/* ******************Rutas privadas****************/}
          <Route
            path='/Home'
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />

          {/*******Rutas modulo usuarios***** */}
          <Route
            path='/Perfil'
            element={
              <PrivateRoute>
                <Perfil />
              </PrivateRoute>
            }
          />

          <Route
            path='/ListaDeUsuarios'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="usuarios.ver">
                  <ListaDeUsuarios />
                </PermisoRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/RolesYPermisos"
            element={
              <PrivateRoute>
                <PermisoRoute permiso="roles.ver">
                  <RolesYPermisos />
                </PermisoRoute>
              </PrivateRoute>
            }
          />
          <Route path="/cambiar-contrasena" element={<CambiarContrasena />} />

          {/***Rutas modulo compras ****/}
          <Route
            path='/OrdenCompra'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="ordenesCompra.ver">
                  <OrdenCompra />
                </PermisoRoute>
              </PrivateRoute>
            }
          />
          <Route
            path='/RegistrarCompra'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="compras.crear">
                  <RegistrarCompra />
                </PermisoRoute>
              </PrivateRoute>
            }
          />

          <Route
            path='/HistorialCompras'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="compras.ver">
                  <HistorialCompras />
                </PermisoRoute>
              </PrivateRoute>
            }
          />

          <Route
            path='/Proveedores'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="proveedores.ver">
                  <Proveedores />
                </PermisoRoute>
              </PrivateRoute>
            }
          />

          <Route
            path='/ReporteProveedores'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="reportesCompras.ver">
                  <ReporteProveedores />
                </PermisoRoute>
              </PrivateRoute>
            }
          />

          {/****Rutas modulo productos****/}

          <Route
            path='/GestionProductos'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="productos.ver">
                  <GestionProductos />
                </PermisoRoute>
              </PrivateRoute>
            }
          />

          <Route
            path='/ListaDeCategorias'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="categorias.ver">
                  <ListaDeCategorias />
                </PermisoRoute>
              </PrivateRoute>
            }
          />


          <Route
            path='/ReporteProductos'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="reportesProductos.ver">
                  <ReporteProductos />
                </PermisoRoute>
              </PrivateRoute>
            }
          />

          {/*****Rutas modulo ventas*** */}


          <Route
            path='/RegistrarCotizacion'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="cotizaciones.crear">
                  <RegistrarCotizacion />
                </PermisoRoute>
              </PrivateRoute>
            }
          />

          <Route
            path='/ListaDeCotizaciones'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="cotizaciones.ver">
                  <ListaDeCotizaciones />
                </PermisoRoute>
              </PrivateRoute>
            }
          />

          <Route
            path='/PedidosAgendados'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="pedidosAgendados.ver">
                  <PedidosAgendados />
                </PermisoRoute>
              </PrivateRoute>
            }
          />


          <Route
            path='/PedidosEntregados'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="remisiones.ver">
                  <PedidosEntregados />
                </PermisoRoute>
              </PrivateRoute>
            }
          />

          <Route
            path='/PedidosCancelados'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="pedidosCancelados.ver">
                  <PedidosCancelados />
                </PermisoRoute>
              </PrivateRoute>
            }
          />


          <Route
            path='/ListaDeClientes'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="clientes.ver">
                  <ListaDeClientes />
                </PermisoRoute>
              </PrivateRoute>
            }
          />

          <Route
            path='/ProspectosDeClientes'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="prospectos.ver">
                  <ProspectosDeCliente />
                </PermisoRoute>
              </PrivateRoute>
            }
          />

          <Route
            path='/ReportessVentas'
            element={
              <PrivateRoute>
                <PermisoRoute permiso="reportesVentas.ver">
                  <ReportessVentas />
                </PermisoRoute>
              </PrivateRoute>
            }
          />


        </Routes>

      </BrowserRouter>

    </div>
  );
}

export default App;