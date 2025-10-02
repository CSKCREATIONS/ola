import React, { useState, useEffect, useMemo } from 'react';
import NavProductos from '../components/NavProductos'
import { fetchReporteConsolidado, fetchReporteProductos } from '../funciones/reportes';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend,
  ResponsiveContainer, LabelList, CartesianGrid
} from 'recharts';
import { Alert, Card, Statistic, Table, Tag } from 'antd';
import {
  ShoppingOutlined, WarningOutlined,
  CheckCircleOutlined, StopOutlined
} from '@ant-design/icons';
import Fijo from '../components/Fijo';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Reportes = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    minStock: '',
    maxPrice: '',
    categoria: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetchReporteConsolidado();
      console.log("📊 Datos del reporte:", response);
      setData(response);
    } catch (error) {
      console.error("Error cargando datos:", error);
      setData({
        totalProductos: 0,
        productosBajoStock: 0,
        productosPorEstado: [],
        productosPorCategoria: []
      });
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = async () => {
    setLoading(true);
    try {
      const response = await fetchReporteProductos(filtros);
      console.log("🔍 Productos filtrados:", response);
      // Aquí puedes procesar los productos filtrados si necesitas
    } catch (error) {
      console.error("Error aplicando filtros:", error);
    } finally {
      setLoading(false);
    }
  };

  // Preparar datos para gráficos con useMemo
  const estadoData = useMemo(() => {
    if (!data?.productosPorEstado) return [];
    return data.productosPorEstado
      .map((item) => ({
        id: `estado-${String(item._id)}`,
        name: item._id ? 'Activos' : 'Inactivos',
        value: item.count || 0,
        color: item._id ? '#4CAF50' : '#F44336',
        icon: item._id ? <CheckCircleOutlined /> : <StopOutlined />
      }))
      .filter(item => !!item.id);
  }, [data?.productosPorEstado]);

  const categoriasData = useMemo(() => {
    if (!data?.productosPorCategoria) return [];
    return data.productosPorCategoria
      .map((item) => ({
        ...item,
        id: item._id ? String(item._id) : undefined,
        name: item.name || 'Sin nombre'
      }))
      .filter(item => !!item.id);
  }, [data?.productosPorCategoria]);

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavProductos/>
        <div className="contenido-modulo">
          <div className='encabezado-modulo '>
            <h3>Reportes de productos</h3>
          </div>
          <br />
          
          {/* Panel de Filtros */}
          <Card title="Filtros de Búsqueda" className="mb-4">
            <div style={{ display: 'flex', gap: '15px', alignItems: 'end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Stock mínimo:
                </label>
                <input
                  type="number"
                  placeholder="Ej: 10"
                  value={filtros.minStock}
                  onChange={(e) => setFiltros({...filtros, minStock: e.target.value})}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid #d9d9d9', 
                    borderRadius: '6px',
                    width: '120px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Precio máximo:
                </label>
                <input
                  type="number"
                  placeholder="Ej: 50000"
                  value={filtros.maxPrice}
                  onChange={(e) => setFiltros({...filtros, maxPrice: e.target.value})}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid #d9d9d9', 
                    borderRadius: '6px',
                    width: '120px'
                  }}
                />
              </div>
              <button
                onClick={aplicarFiltros}
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
                {loading ? 'Aplicando...' : 'Aplicar Filtros'}
              </button>
              <button
                onClick={() => {
                  setFiltros({ minStock: '', maxPrice: '', categoria: '' });
                  loadData();
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Limpiar
              </button>
            </div>
          </Card>
          
          <br />
          <div className="reportes-container">
            {loading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '100px 20px',
                background: '#f9f9f9',
                borderRadius: '8px',
                margin: '20px 0'
              }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '48px', color: '#1890ff', marginBottom: '20px' }}></i>
                <h3>Cargando datos del reporte...</h3>
                <p style={{ color: '#666' }}>Obteniendo información de productos desde la base de datos</p>
              </div>
            ) : data ? (
              <>
                {/* Resumen Estadístico */}
                <div className="resumen-estadistico">
                  <Card className="estadistica-card">
                    <Statistic
                      title="Total de Productos"
                      value={data?.totalProductos}
                      prefix={<ShoppingOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                  <br />

                  <Card className="estadistica-card alerta">
                    <Statistic
                      title="Productos con bajo stock"
                      value={data?.productosBajoStock}
                      prefix={<WarningOutlined />}
                      valueStyle={{ color: '#f5222d' }}
                    />
                    <Alert
                      message={`${data?.productosBajoStock} productos tienen menos de 10 unidades en stock`}
                      type="warning"
                      showIcon
                      className="alerta-stock"
                    />
                  </Card>
                  <br />
                </div>

                {/* Gráficos */}
                <div className="graficos-container">
                  {/* Gráfico de estado de productos */}
                  <Card title="Estado de Productos" className="grafico-card">
                    {estadoData.length > 0 ? (
                      <div key={`estado-container-${estadoData.length}`}>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={estadoData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {estadoData.map((entry) => (
                                <Cell key={entry.id} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} productos`, 'Cantidad']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                        <i className="fa-solid fa-chart-pie" style={{ fontSize: '48px', marginBottom: '15px' }}></i>
                        <p>No hay datos de estado disponibles</p>
                      </div>
                    )}
                  </Card>
                  <br />

                  {/* Gráfico de distribución por categoría */}
                  <Card title="Distribución por Categoría" className="grafico-card">
                    {categoriasData.length > 0 ? (
                      <div key={`categorias-container-${categoriasData.length}`}>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={categoriasData}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip
                              formatter={(value) => [`${value} productos`, 'Cantidad']}
                              labelFormatter={(label) => `Categoría: ${label}`}
                            />
                            <Legend />
                            <Bar dataKey="totalProductos" name="Total Productos" fill="#8884d8">
                              <LabelList dataKey="totalProductos" position="right" />
                            </Bar>
                            <Bar dataKey="productosActivos" name="Productos Activos" fill="#4CAF50">
                              <LabelList dataKey="productosActivos" position="right" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                        <i className="fa-solid fa-chart-bar" style={{ fontSize: '48px', marginBottom: '15px' }}></i>
                        <p>No hay datos de categorías disponibles</p>
                      </div>
                    )}
                  </Card>
                  <br />
                </div>

                {/* Tabla de productos por categoría */}
                <Card title="Detalle por Categoría" className="tabla-card">
                  <Table
                    dataSource={categoriasData}
                    rowKey={(record) => record.id || record._id}
                    pagination={false}
                    locale={{ emptyText: 'No hay categorías disponibles' }}
                    columns={[
                      {
                        title: 'Categoría',
                        dataIndex: 'name',
                        key: 'name',
                        render: (text, record) => (
                          <div>
                            <strong>{text || 'Sin nombre'}</strong>
                            <div className="descripcion">{record.description || 'Sin descripción'}</div>
                          </div>
                        )
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
                        title: 'Fecha Creación',
                        dataIndex: 'createdAt',
                        key: 'createdAt',
                        render: (date) => date ? new Date(date).toLocaleDateString() : 'No disponible'
                      },
                      {
                        title: 'Total Productos',
                        dataIndex: 'totalProductos',
                        key: 'totalProductos',
                        align: 'center'
                      },
                      {
                        title: 'Productos Activos',
                        dataIndex: 'productosActivos',
                        key: 'productosActivos',
                        align: 'center'
                      }
                    ]}
                  />
                </Card>
              </>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '100px 20px',
                background: '#f9f9f9',
                borderRadius: '8px',
                margin: '20px 0'
              }}>
                <i className="fa-solid fa-exclamation-triangle" style={{ fontSize: '48px', color: '#faad14', marginBottom: '20px' }}></i>
                <h3>No hay datos disponibles</h3>
                <p style={{ color: '#666' }}>No se pudieron cargar los datos del reporte</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportes;