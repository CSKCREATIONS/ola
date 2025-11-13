import React, { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Table, Typography } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import api from '../api/axiosConfig';
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';

const { Title } = Typography;

const ReportessVentas = () => {
  const [estadisticas, setEstadisticas] = useState({});
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [estadosChartData, setEstadosChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("🚀 Iniciando fetch de todos los datos...");
  console.log("🌐 URL base proporcionada por api client");
        
  // Test de conexión básico
  console.log("🔍 Probando conexión...");
  const testResponse = await api.get('/api/reportes/estadisticas');
  console.log("✅ Test de conexión exitoso:", testResponse.status);
  console.log("📦 Datos de prueba:", testResponse.data);
        
        const fetchEstadisticas = async () => {
          try {
            console.log("📊 Fetching estadísticas...");
            const res = await api.get('/api/reportes/estadisticas');
            console.log("📊 Estadísticas - Status:", res.status);
            console.log("📊 Estadísticas - Data:", res.data);
            
            if (res.data?.success && res.data?.data) {
              console.log("✅ Estableciendo estadísticas:", res.data.data);
              setEstadisticas(res.data.data);
            } else {
              console.warn("⚠️ Formato de respuesta inválido para estadísticas:", res.data);
              setEstadisticas({});
            }
          } catch (error) {
            console.error("❌ Error al obtener estadísticas:", error);
            console.error("❌ Error details:", error.response?.data);
            throw error;
          }
        };

        const fetchClientes = async () => {
          try {
            console.log("👥 Fetching clientes...");
            const res = await api.get('/api/reportes/clientes');
            console.log("👥 Clientes - Status:", res.status);
            console.log("👥 Clientes - Data:", res.data);
            
            if (res.data?.success && res.data?.data) {
              console.log("✅ Estableciendo clientes:", res.data.data);
              setClientes(res.data.data);
            } else {
              console.warn("⚠️ Formato de respuesta inválido para clientes:", res.data);
              setClientes({});
            }
          } catch (error) {
            console.error("❌ Error al obtener clientes:", error);
            console.error("❌ Error details:", error.response?.data);
            throw error;
          }
        };

        const fetchProductos = async () => {
          try {
            console.log("🛍️ Fetching productos...");
            const res = await api.get('/api/reportes/productos');
            console.log("🛍️ Productos - Status:", res.status);
            console.log("🛍️ Productos - Data:", res.data);
            
            if (res.data?.success && res.data?.data) {
              console.log("✅ Estableciendo productos:", res.data.data);
              setProductos(res.data.data);
            } else {
              console.warn("⚠️ Formato de respuesta inválido para productos:", res.data);
              setProductos({});
            }
          } catch (error) {
            console.error("❌ Error al obtener productos:", error);
            console.error("❌ Error details:", error.response?.data);
            throw error;
          }
        };

        const fetchEstados = async () => {
          try {
            console.log("📋 Fetching estados...");
            const res = await api.get('/api/reportes/estados');
            console.log("📋 Estados - Status:", res.status);
            console.log("📋 Estados - Data:", res.data);
            
            if (res.data?.success && res.data?.data) {
              console.log("✅ Estableciendo estados:", res.data.data);
              setEstadosChartData(res.data.data);
            } else {
              console.warn("⚠️ Formato de respuesta inválido para estados:", res.data);
              setEstadosChartData([]);
            }
          } catch (error) {
            console.error("❌ Error al obtener estados de pedidos:", error);
            console.error("❌ Error details:", error.response?.data);
            throw error;
          }
        };

        // Ejecutar todas las llamadas
        await Promise.all([
          fetchEstadisticas(),
          fetchClientes(),
          fetchProductos(),
          fetchEstados()
        ]);
        
        console.log("✅ Todos los datos cargados exitosamente");
        console.log("📊 Estado final - estadisticas:", estadisticas);
        console.log("👥 Estado final - clientes:", clientes);
        console.log("🛍️ Estado final - productos:", productos);
        console.log("📋 Estado final - estados:", estadosChartData);
        
      } catch (error) {
        console.error("❌ Error general al cargar datos:", error);
        console.error("❌ Error message:", error.message);
        console.error("❌ Error stack:", error.stack);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div style={{ padding: "20px" }}>
          <Title level={2}>Reportes de Ventas</Title>
          
          {loading && (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Title level={4}>⏳ Cargando datos...</Title>
              <p>Conectando con el servidor backend...</p>
            </div>
          )}
          
          {error && (
            <div style={{ textAlign: "center", padding: "20px", backgroundColor: "#fff2f0", border: "1px solid #ffccc7", borderRadius: "6px", marginBottom: "20px" }}>
              <Title level={4} style={{ color: "#cf1322" }}>❌ Error de Conexión</Title>
              <p>No se pudo conectar al servidor: {error}</p>
              <p>Verifica que el backend esté corriendo en http://localhost:5000</p>
            </div>
          )}

          {/* Debug info 
          <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f0f2f5", borderRadius: "6px" }}>
            <p><strong>📊 Debug Info:</strong></p>
            <p>Loading: {loading ? "Sí" : "No"}</p>
            <p>Error: {error || "Ninguno"}</p>
            <p>Estadísticas: {JSON.stringify(estadisticas)}</p>
            <p>Clientes: {JSON.stringify(clientes)}</p>
          </div>*/}

          <Row gutter={16}>
            <Col span={6}>
              <Card style={{ marginBottom: "20px" }}>
                <Statistic
                  title="Ventas Totales ($)"
                  value={estadisticas.ventasTotales || 0}
                  precision={0}
                  prefix={<DollarOutlined />}
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ marginBottom: "20px" }}>
                <Statistic
                  title="Total Pedidos"
                  value={estadisticas.totalPedidos || 0}
                  prefix={<ShoppingCartOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ marginBottom: "20px" }}>
                <Statistic
                  title="Clientes Activos"
                  value={estadisticas.clientesActivos || 0}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ marginBottom: "20px" }}>
                <Statistic
                  title="Crecimiento"
                  value={estadisticas.crecimiento || 0}
                  suffix="%"
                  valueStyle={{
                    color: (estadisticas.crecimiento || 0) >= 0 ? "#3f8600" : "#cf1322",
                  }}
                  prefix={(estadisticas.crecimiento || 0) >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card style={{ marginBottom: "20px" }}>
                <Title level={4}>Top Clientes</Title>
                <Table
                  dataSource={clientes.topClientes || []}
                  rowKey={(record, index) => record._id || index}
                  columns={[
                    { 
                      title: "Cliente", 
                      dataIndex: "nombre", 
                      key: "nombre",
                      render: (text) => text || "Sin nombre"
                    },
                    { 
                      title: "Total Compras", 
                      dataIndex: "totalCompras", 
                      key: "totalCompras",
                      render: (value) => value || 0
                    },
                  ]}
                  pagination={false}
                  locale={{ emptyText: 'No hay datos de clientes disponibles' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ marginBottom: "20px" }}>
                <Title level={4}>Top Productos</Title>
                <Table
                  dataSource={productos.topProductos || []}
                  rowKey={(record, index) => record._id || index}
                  columns={[
                    { 
                      title: "Producto", 
                      dataIndex: "nombre", 
                      key: "nombre",
                      render: (text) => text || "Producto sin nombre"
                    },
                    { 
                      title: "Unidades Vendidas", 
                      dataIndex: "cantidadVendida", 
                      key: "cantidadVendida",
                      render: (value) => value || 0
                    },
                  ]}
                  pagination={false}
                  locale={{ emptyText: 'No hay datos de productos disponibles' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card style={{ marginBottom: "20px" }}>
                <Title level={4}>Distribución por Estado de Pedidos</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={estadosChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label
                    >
                      {estadosChartData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ marginBottom: "20px" }}>
                <Title level={4}>Ventas Mensuales</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={estadisticas.ventasMensuales || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'ventas' ? `${value} ventas` : `$${Number(value).toLocaleString()}`,
                        name === 'ventas' ? 'Cantidad de Ventas' : 'Ingresos'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="ventas" fill="#82ca9d" name="Ventas" />
                    <Bar dataKey="ingresos" fill="#1890ff" name="Ingresos" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default ReportessVentas;
