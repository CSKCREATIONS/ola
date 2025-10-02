import React, { useEffect, useState, useMemo } from 'react';
import {
  fetchProveedoresPorPais,
  fetchProveedoresPorEstado,
  fetchProductosPorProveedor,
  fetchProveedoresRecientes
} from '../funciones/reportes';

import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Card, Statistic, Table, Tag, Alert } from 'antd';
import {
  GlobalOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ShoppingOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import Fijo from '../components/Fijo';
import NavCompras from '../components/NavCompras'

const colores = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28'];

const ReportesProveedores = () => {
  const [porPais, setPorPais] = useState([]);
  const [porEstado, setPorEstado] = useState([]);
  const [productosPorProv, setProductosPorProv] = useState([]);
  const [recientes, setRecientes] = useState([]);

  useEffect(() => {
    fetchProveedoresPorPais().then(data => setPorPais(data || [])).catch(console.error);
    fetchProveedoresPorEstado().then(data => setPorEstado(data || [])).catch(console.error);
    fetchProductosPorProveedor().then(data => setProductosPorProv(data || [])).catch(console.error);
    fetchProveedoresRecientes().then(data => setRecientes(data || [])).catch(console.error);
  }, []);

  // Datos memoizados para gráficos
  const paisesChartData = useMemo(() => {
    if (!Array.isArray(porPais) || porPais.length === 0) return [];
    return porPais.map((entry, index) => ({
      id: `pais-${entry.pais || 'unknown'}-${index}`,
      pais: entry.pais || 'Desconocido',
      cantidad: entry.cantidad || 0
    }));
  }, [porPais]);

  const estadosChartData = useMemo(() => {
    if (!Array.isArray(porEstado) || porEstado.length === 0) return [];
    return porEstado.map((item, idx) => ({
      id: `estado-${item._id ? 'activo' : 'inactivo'}-${idx}`,
      estado: item._id ? 'Activo' : 'Inactivo',
      cantidad: item.cantidad || 0,
      color: item._id ? '#52c41a' : '#f5222d'
    }));
  }, [porEstado]);

  const productosChartData = useMemo(() => {
    if (!Array.isArray(productosPorProv) || productosPorProv.length === 0) return [];
    return productosPorProv.map((item, idx) => ({
      id: `proveedor-${idx}`,
      nombre: item.nombre || 'Sin nombre',
      empresa: item.empresa || '',
      totalProductos: item.totalProductos || 0
    }));
  }, [productosPorProv]);

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavCompras/>
        <div className="contenido-modulo">
          <div className='encabezado-modulo'>
            <h3>Reportes de compras</h3>
          </div>
          <br />
          
          {/* Panel de Información */}
          <Card title="Resumen de Proveedores" className="mb-4">
            <Alert
              message="Información del Sistema"
              description={`Actualmente el sistema gestiona ${porPais.length} países diferentes con proveedores registrados. Se muestran estadísticas en tiempo real basadas en los datos de la base de datos.`}
              type="info"
              showIcon
              style={{ marginBottom: '15px' }}
            />
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  Promise.all([
                    fetchProveedoresPorPais().then(setPorPais).catch(console.error),
                    fetchProveedoresPorEstado().then(setPorEstado).catch(console.error),
                    fetchProductosPorProveedor().then(setProductosPorProv).catch(console.error),
                    fetchProveedoresRecientes().then(setRecientes).catch(console.error)
                  ]);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-refresh"></i> Actualizar Datos
              </button>
            </div>
          </Card>
          
          <br />
          <div className="reportes-container p-6 bg-gray-50 min-h-screen">

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
              <Card>
                <Statistic title="Total Países" value={porPais.length} prefix={<GlobalOutlined />} valueStyle={{ color: '#1890ff' }} />
              </Card><br/>
              <Card>
                <Statistic title="Activos" value={porEstado.find(e => e._id)?.cantidad || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
              </Card><br/>
              <Card>
                <Statistic title="Inactivos" value={porEstado.find(e => !e._id)?.cantidad || 0} prefix={<StopOutlined />} valueStyle={{ color: '#f5222d' }} />
              </Card><br/>
              <Card>
                <Statistic title="Proveedores con Productos" value={productosPorProv.length} prefix={<ShoppingOutlined />} valueStyle={{ color: '#fa8c16' }} />
              </Card><br/>
              <Card>
                <Statistic title="Proveedores Recientes" value={recientes.length} prefix={<UserAddOutlined />} valueStyle={{ color: '#722ed1' }} />
              </Card><br/>
            </div>

            <Card title="Proveedores por País" className="mb-10">
              {paisesChartData.length > 0 ? (
                <div key={`paises-container-${paisesChartData.length}`}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paisesChartData}
                        dataKey="cantidad"
                        nameKey="pais"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ pais, cantidad }) => `${pais}: ${cantidad}`}
                      >
                        {paisesChartData.map((entry, index) => (
                          <Cell key={entry.id} fill={colores[index % colores.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} proveedores`, `País: ${name}`]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                  <i className="fa-solid fa-chart-pie" style={{ fontSize: '48px', marginBottom: '15px' }}></i>
                  <p>No hay datos de proveedores por país disponibles</p>
                </div>
              )}
            </Card><br/>

            <Card title="Proveedores por Estado" className="mb-10">
              {estadosChartData.length > 0 ? (
                <div key={`estados-container-${estadosChartData.length}`}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={estadosChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="estado" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} proveedores`, 'Cantidad']} />
                      <Legend />
                      <Bar dataKey="cantidad" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                  <i className="fa-solid fa-chart-bar" style={{ fontSize: '48px', marginBottom: '15px' }}></i>
                  <p>No hay datos de estado de proveedores disponibles</p>
                </div>
              )}
            </Card><br/>

            <Card title="Productos por Proveedor" className="mb-10">
              {productosChartData.length > 0 ? (
                <div key={`productos-container-${productosChartData.length}`}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productosChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="nombre" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `${value} productos`,
                          `Proveedor: ${props.payload.nombre}${props.payload.empresa ? ` (${props.payload.empresa})` : ''}`
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="totalProductos" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                  <i className="fa-solid fa-boxes" style={{ fontSize: '48px', marginBottom: '15px' }}></i>
                  <p>No hay datos de productos por proveedor disponibles</p>
                </div>
              )}
            </Card><br/>

            <Card title="Proveedores Recientes">
              <Table
                dataSource={recientes}
                rowKey={(record, index) => record._id || record.nombre || index}
                pagination={false}
                locale={{ emptyText: 'No hay proveedores recientes registrados' }}
                columns={[
                  {
                    title: 'Nombre',
                    dataIndex: 'nombre',
                    key: 'nombre',
                    render: (text) => text || 'Sin nombre'
                  },
                  {
                    title: 'Empresa',
                    dataIndex: 'empresa',
                    key: 'empresa',
                    render: val => val || 'Sin empresa'
                  },
                  {
                    title: 'Estado',
                    dataIndex: 'activo',
                    key: 'activo',
                    render: (activo) => (
                      <Tag color={activo ? 'green' : 'red'}>
                        {activo ? 'ACTIVO' : 'INACTIVO'}
                      </Tag>
                    )
                  },
                  {
                    title: 'Fecha de Registro',
                    dataIndex: 'fechaCreacion',
                    key: 'fechaCreacion',
                    render: val => val ? new Date(val).toLocaleDateString('es-CO') : 'No disponible'
                  }
                ]}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesProveedores;
