import React, { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Table, Typography } from "antd";
import {
  ShoppingOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  StopOutlined,
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
import NavProductos from '../components/NavProductos';

const { Title } = Typography;

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const Reportes = () => {
  const [estadisticas, setEstadisticas] = useState({});
  const [productosPorCategoria, setProductosPorCategoria] = useState([]);
  const [productosPorEstado, setProductosPorEstado] = useState([]);

  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        const res = await api.get('/api/reportes/estadisticas-productos');
        setEstadisticas(res.data?.data || res.data || {});
      } catch (error) {
        console.error("Error al obtener estadísticas de productos:", error);
      }
    };

    const fetchProductosPorCategoria = async () => {
      try {
        const res = await api.get('/api/reportes/productos-por-categoria');
        setProductosPorCategoria(res.data?.data || res.data || []);
      } catch (error) {
        console.error("Error al obtener productos por categoría:", error);
      }
    };

    const fetchProductosPorEstado = async () => {
      try {
        const res = await api.get('/api/reportes/productos-por-estado');
        setProductosPorEstado(res.data?.data || res.data || []);
      } catch (error) {
        console.error("Error al obtener productos por estado:", error);
      }
    };

    fetchEstadisticas();
    fetchProductosPorCategoria();
    fetchProductosPorEstado();
  }, []);

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavProductos />
        <div style={{ padding: "20px" }}>
          <Title level={2}>Reportes de Productos</Title>

          <Row gutter={16}>
            <Col span={6}>
              <Card style={{ marginBottom: "20px" }}>
                <Statistic
                  title="Total Productos"
                  value={estadisticas.totalProductos}
                  prefix={<ShoppingOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ marginBottom: "20px" }}>
                <Statistic
                  title="Productos Activos"
                  value={estadisticas.productosActivos}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ marginBottom: "20px" }}>
                <Statistic
                  title="Productos Inactivos"
                  value={estadisticas.productosInactivos}
                  prefix={<StopOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ marginBottom: "20px" }}>
                <Statistic
                  title="Stock Bajo"
                  value={estadisticas.stockBajo}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card style={{ marginBottom: "20px" }}>
                <Title level={4}>Productos por Categoría</Title>
                <Table
                  dataSource={productosPorCategoria || []}
                  rowKey="_id"
                  columns={[
                    { title: "Categoría", dataIndex: "categoria", key: "categoria" },
                    { title: "Cantidad", dataIndex: "cantidad", key: "cantidad" },
                  ]}
                  pagination={false}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ marginBottom: "20px" }}>
                <Title level={4}>Estado de Productos</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productosPorEstado}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label
                    >
                      {productosPorEstado.map((entry, index) => (
                        <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Card style={{ marginBottom: "20px" }}>
                <Title level={4}>Distribución por Categoría</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productosPorCategoria || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="categoria" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cantidad" fill="#82ca9d" />
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

export default Reportes;