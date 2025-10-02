import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchVentasPorPeriodo,
  fetchVentasConsolidado,
  fetchPedidosPorEstado,
  fetchCotizaciones,
  fetchReporteClientes
} from '../funciones/reportes';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Card, Statistic, Alert, Table, Tag } from 'antd';
import {
  ShoppingOutlined, DollarOutlined,
  FileTextOutlined, ContainerOutlined,
  UserOutlined, CheckCircleOutlined, StopOutlined
} from '@ant-design/icons';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';

const ReportessVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [ventasConsolidado, setVentasConsolidado] = useState(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [loading, setLoading] = useState(false);
  const [estados, setEstados] = useState([]);
  const [cotizaciones, setCotizaciones] = useState(null);
  const [desdeCot, setDesdeCot] = useState('');
  const [hastaCot, setHastaCot] = useState('');
  const [clientes, setClientes] = useState({ total: 0, activos: 0, inactivos: 0, topClientes: [] });
  const colores = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6c757d'];

  useEffect(() => {
    const hoy = new Date();
    const hace30 = new Date();
    hace30.setDate(hoy.getDate() - 30);
    const formato = (fecha) => fecha.toISOString().split('T')[0];
    setDesde(formato(hace30));
    setHasta(formato(hoy));
    setDesdeCot(formato(hace30));
    setHastaCot(formato(hoy));
  }, []);

  useEffect(() => {
    if (desde && hasta) obtenerReporte();
  }, [desde, hasta]);

  useEffect(() => {
    obtenerPedidosPorEstado();
  }, []);

  useEffect(() => {
    if (desdeCot && hastaCot) obtenerCotizaciones();
  }, [desdeCot, hastaCot]);

  useEffect(() => {
    obtenerClientes();
  }, []);

  const obtenerReporte = async () => {
    try {
      setLoading(true);
      
      // Obtener datos por período (incluye desglose de ventas tradicionales y pedidos entregados)
      const responsePeriodo = await fetchVentasPorPeriodo(desde, hasta);
      setVentas(Array.isArray(responsePeriodo.data) ? responsePeriodo.data : []);
      
      // Obtener reporte consolidado (resumen general)
      const responseConsolidado = await fetchVentasConsolidado(desde, hasta);
      setVentasConsolidado(responseConsolidado.data || null);
      
    } catch (error) {
      console.error('Error al obtener reporte:', error);
      setVentas([]);
      setVentasConsolidado(null);
    } finally {
      setLoading(false);
    }
  };

  const obtenerPedidosPorEstado = async () => {
    try {
      const response = await fetchPedidosPorEstado();
      setEstados(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al obtener pedidos por estado:', error);
      setEstados([]);
    }
  };

  const obtenerCotizaciones = async () => {
    try {
      const response = await fetchCotizaciones(desdeCot, hastaCot);
      setCotizaciones(response.data || { total: 0, enviadas: 0, noEnviadas: 0 });
    } catch (error) {
      console.error('Error al obtener cotizaciones:', error);
      setCotizaciones({ total: 0, enviadas: 0, noEnviadas: 0 });
    }
  };

  const obtenerClientes = async () => {
    try {
      const response = await fetchReporteClientes();
      setClientes(response.data || { total: 0, activos: 0, inactivos: 0, topClientes: [] });
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      setClientes({ total: 0, activos: 0, inactivos: 0, topClientes: [] });
    }
  };

  // Memoizar los cálculos para evitar re-renders innecesarios
  const totalVentas = useMemo(() => 
    ventasConsolidado?.resumen?.ventasTradicionales?.cantidad || 0,
    [ventasConsolidado]
  );
  
  const totalPedidosEntregados = useMemo(() => 
    ventasConsolidado?.resumen?.pedidosEntregados?.cantidad || 0,
    [ventasConsolidado]
  );
  
  const totalTransacciones = useMemo(() => 
    ventasConsolidado?.resumen?.totalTransacciones || 0,
    [ventasConsolidado]
  );
  
  const totalIngresos = useMemo(() => 
    ventasConsolidado?.resumen?.totalIngresos || 0,
    [ventasConsolidado]
  );
  
  const totalPedidos = useMemo(() => 
    Array.isArray(estados) ? estados.reduce((acc, item) => acc + (item.cantidad || 0), 0) : 0,
    [estados]
  );

  // Datos memoizados para gráficos
  const ventasChartData = useMemo(() => {
    if (!Array.isArray(ventas) || ventas.length === 0) return [];
    return ventas.map((item, idx) => ({
      id: `venta-${idx}-${item._id?.año || 0}-${item._id?.mes || 0}-${item._id?.dia || 0}`,
      fecha: `${item._id?.dia || 1}/${item._id?.mes || 1}/${item._id?.año || new Date().getFullYear()}`,
      ventas: item.totalVentas || 0,
      ingresos: item.totalIngresos || 0
    }));
  }, [ventas]);

  const cotizacionesChartData = useMemo(() => {
    if (!cotizaciones || cotizaciones.total <= 0) return [];
    return [
      { id: 'cot-total', tipo: 'Total', cantidad: cotizaciones.total || 0 },
      { id: 'cot-enviadas', tipo: 'Enviadas', cantidad: cotizaciones.enviadas || 0 },
      { id: 'cot-no-enviadas', tipo: 'No enviadas', cantidad: cotizaciones.noEnviadas || 0 }
    ];
  }, [cotizaciones]);

  const estadosChartData = useMemo(() => {
    if (!Array.isArray(estados) || estados.length === 0) return [];
    return estados.map((entry, index) => ({
      id: `estado-${entry.estado || entry._id || index}`,
      estado: entry.estado || (entry._id || 'Desconocido'),
      cantidad: entry.cantidad || 0
    }));
  }, [estados]);

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas/>
        <div className="contenido-modulo">
          <div className='encabezado-modulo'>
            <h3>Reportes de ventas</h3>
          </div>
          <br />
          
          {/* Controles de Fechas */}
          <Card title="Filtros de Período" className="mb-4">
            <div style={{ display: 'flex', gap: '20px', alignItems: 'end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Ventas - Desde:
                </label>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid #d9d9d9', 
                    borderRadius: '6px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Hasta:
                </label>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid #d9d9d9', 
                    borderRadius: '6px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Cotizaciones - Desde:
                </label>
                <input
                  type="date"
                  value={desdeCot}
                  onChange={(e) => setDesdeCot(e.target.value)}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid #d9d9d9', 
                    borderRadius: '6px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Hasta:
                </label>
                <input
                  type="date"
                  value={hastaCot}
                  onChange={(e) => setHastaCot(e.target.value)}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid #d9d9d9', 
                    borderRadius: '6px'
                  }}
                />
              </div>
              <button
                onClick={() => {
                  obtenerReporte();
                  obtenerCotizaciones();
                }}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Actualizando...' : 'Actualizar Reportes'}
              </button>
            </div>
          </Card>
          
          <br />
          <div className="reportes-container p-6 bg-gray-50 min-h-screen">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
              <Card>
                <Statistic 
                  title="Ventas Tradicionales" 
                  value={totalVentas} 
                  prefix={<ShoppingOutlined />} 
                  valueStyle={{ color: '#007bff' }} 
                />
              </Card><br/>
              <Card>
                <Statistic 
                  title="Pedidos Entregados (como ventas)" 
                  value={totalPedidosEntregados} 
                  prefix={<CheckCircleOutlined />} 
                  valueStyle={{ color: '#52c41a' }} 
                />
              </Card><br/>
              <Card>
                <Statistic 
                  title="Total Transacciones" 
                  value={totalTransacciones} 
                  prefix={<ContainerOutlined />} 
                  valueStyle={{ color: '#722ed1' }} 
                />
              </Card><br/>
              <Card>
                <Statistic 
                  title="Ingresos Totales" 
                  value={totalIngresos} 
                  prefix={<DollarOutlined />} 
                  valueStyle={{ color: '#28a745' }} 
                  formatter={value => `$${Number(value).toLocaleString()}`} 
                />
              </Card><br/>
              <Card>
                <Statistic 
                  title="Cotizaciones Totales" 
                  value={cotizaciones?.total || 0} 
                  prefix={<FileTextOutlined />} 
                  valueStyle={{ color: '#fa8c16' }} 
                />
              </Card><br/>
              <Card>
                <Statistic 
                  title="Cotizaciones Enviadas" 
                  value={cotizaciones?.enviadas || 0} 
                  prefix={<ContainerOutlined />} 
                  valueStyle={{ color: '#1890ff' }} 
                />
              </Card><br/>
              <Card>
                <Statistic 
                  title="Total Pedidos" 
                  value={totalPedidos} 
                  prefix={<ShoppingOutlined />} 
                  valueStyle={{ color: '#fa8c16' }} 
                />
              </Card><br/>
              <Card>
                <Statistic 
                  title="Clientes Activos / Inactivos" 
                  value={`${clientes.activos} / ${clientes.inactivos}`} 
                  prefix={<UserOutlined />} 
                  valueStyle={{ color: '#595959' }} 
                />
              </Card>
            </div><br/>

            {/* Nueva sección: Desglose de Ventas */}
            {ventasConsolidado && (
              <Card title="Desglose de Ventas vs Pedidos Entregados" className="mb-10">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #007bff, #0056b3)', 
                    color: 'white', 
                    padding: '20px', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '1.2em' }}>💰 Ventas Tradicionales</h4>
                    <p style={{ margin: '5px 0', fontSize: '1.1em' }}>
                      <strong>Cantidad:</strong> {ventasConsolidado.resumen.ventasTradicionales.cantidad}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '1.1em' }}>
                      <strong>Ingresos:</strong> ${Number(ventasConsolidado.resumen.ventasTradicionales.ingresos).toLocaleString()}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '1em', opacity: '0.9' }}>
                      <strong>Promedio:</strong> ${Number(ventasConsolidado.resumen.ventasTradicionales.promedio || 0).toLocaleString()}
                    </p>
                  </div>
                  
                  <div style={{ 
                    background: 'linear-gradient(135deg, #52c41a, #389e0d)', 
                    color: 'white', 
                    padding: '20px', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '1.2em' }}>✅ Pedidos Entregados</h4>
                    <p style={{ margin: '5px 0', fontSize: '1.1em' }}>
                      <strong>Cantidad:</strong> {ventasConsolidado.resumen.pedidosEntregados.cantidad}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '1.1em' }}>
                      <strong>Ingresos:</strong> ${Number(ventasConsolidado.resumen.pedidosEntregados.ingresos).toLocaleString()}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '1em', opacity: '0.9' }}>
                      <strong>Promedio:</strong> ${Number(ventasConsolidado.resumen.pedidosEntregados.promedio || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            )}<br/>

            <Card title="Pedidos por Estado" className="mb-10">
              {estadosChartData.length > 0 ? (
                <div key={`estados-container-${estadosChartData.length}`}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie 
                        data={estadosChartData} 
                        dataKey="cantidad" 
                        nameKey="estado" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100} 
                        label={({ estado, cantidad }) => `${estado}: ${cantidad}`}
                      >
                        {estadosChartData.map((entry, index) => (
                          <Cell key={entry.id} fill={colores[index % colores.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} pedidos`, `Estado: ${name}`]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                  <i className="fa-solid fa-chart-pie" style={{ fontSize: '48px', marginBottom: '15px' }}></i>
                  <p>No hay datos de pedidos por estado disponibles</p>
                  <small>Los pedidos aparecerán aquí una vez que se registren en el sistema</small>
                </div>
              )}
            </Card><br/>

            <Card title="Cotizaciones por Período" className="mb-10">
              {cotizacionesChartData.length > 0 ? (
                <div key={`cotizaciones-container-${cotizacionesChartData.length}`}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cotizacionesChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tipo" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [`${value} cotizaciones`, name]} />
                      <Legend />
                      <Bar dataKey="cantidad" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                  <i className="fa-solid fa-file-invoice" style={{ fontSize: '48px', marginBottom: '15px' }}></i>
                  <p>No hay cotizaciones en el período seleccionado</p>
                  <small>Ajuste las fechas o registre nuevas cotizaciones</small>
                </div>
              )}
            </Card><br/>

            {/* Gráfico de Ventas por Período */}
            <Card title="Ventas por Período" className="mb-10">
              {ventasChartData.length > 0 ? (
                <div key={`ventas-container-${ventasChartData.length}`}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ventasChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'ventas' ? `${value} ventas` : `$${Number(value).toLocaleString()}`,
                          name === 'ventas' ? 'Total Ventas' : 'Ingresos'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="ventas" fill="#1890ff" name="Ventas" />
                      <Bar dataKey="ingresos" fill="#52c41a" name="Ingresos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                  <i className="fa-solid fa-chart-line" style={{ fontSize: '48px', marginBottom: '15px' }}></i>
                  <p>No hay datos de ventas en el período seleccionado</p>
                  <small>Las ventas aparecerán aquí una vez que se registren en el sistema</small>
                </div>
              )}
            </Card><br/>

            <Card title="Top 5 Clientes por Compras">
              <Table
                dataSource={clientes.topClientes || []}
                rowKey="email"
                pagination={false}
                locale={{ emptyText: 'No hay datos disponibles de clientes.' }}
                columns={[
                  {
                    title: 'Nombre',
                    dataIndex: 'nombre',
                    key: 'nombre'
                  },
                  {
                    title: 'Email',
                    dataIndex: 'email',
                    key: 'email'
                  },
                  {
                    title: 'Compras',
                    dataIndex: 'totalCompras',
                    key: 'totalCompras'
                  },
                  {
                    title: 'Estado',
                    dataIndex: 'activo',
                    key: 'activo',
                    render: (activo) => (
                      <Tag color={activo ? 'green' : 'red'}>
                        {activo ? 'Activo' : 'Inactivo'}
                      </Tag>
                    )
                  }
                ]}
              />
            </Card><br/>

            {/* Top Productos */}
            {ventasConsolidado && ventasConsolidado.topProductos && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <Card title="🏆 Top 5 Productos Más Vendidos">
                  <Table
                    dataSource={ventasConsolidado.topProductos.masVendidos || []}
                    rowKey="_id"
                    pagination={false}
                    size="small"
                    locale={{ emptyText: 'No hay datos de productos vendidos.' }}
                    columns={[
                      {
                        title: 'Producto',
                        dataIndex: 'nombreProducto',
                        key: 'nombreProducto'
                      },
                      {
                        title: 'Cantidad',
                        dataIndex: 'cantidadVendida',
                        key: 'cantidadVendida'
                      },
                      {
                        title: 'Ingresos',
                        dataIndex: 'ingresosTotales',
                        key: 'ingresosTotales',
                        render: (value) => `$${Number(value).toLocaleString()}`
                      }
                    ]}
                  />
                </Card>

                <Card title="📦 Top 5 Productos Más Entregados">
                  <Table
                    dataSource={ventasConsolidado.topProductos.masEntregados || []}
                    rowKey="_id"
                    pagination={false}
                    size="small"
                    locale={{ emptyText: 'No hay datos de productos entregados.' }}
                    columns={[
                      {
                        title: 'Producto',
                        dataIndex: 'nombreProducto',
                        key: 'nombreProducto'
                      },
                      {
                        title: 'Cantidad',
                        dataIndex: 'cantidadEntregada',
                        key: 'cantidadEntregada'
                      },
                      {
                        title: 'Ingresos Est.',
                        dataIndex: 'ingresosEstimados',
                        key: 'ingresosEstimados',
                        render: (value) => `$${Number(value).toLocaleString()}`
                      }
                    ]}
                  />
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportessVentas;
