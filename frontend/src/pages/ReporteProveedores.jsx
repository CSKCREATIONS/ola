import React, { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Table, Typography, Tag } from "antd";
import {
  GlobalOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ShoppingOutlined,
  UserAddOutlined,
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
import NavCompras from '../components/NavCompras';

const { Title } = Typography;

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const ReportesProveedores = () => {
  const [estadisticas, setEstadisticas] = useState({});
  const [proveedoresPorPais, setProveedoresPorPais] = useState([]);
  const [proveedoresPorEstado, setProveedoresPorEstado] = useState([]);
  const [productosProveedor, setProductosProveedor] = useState([]);
  const [proveedoresRecientes, setProveedoresRecientes] = useState([]);

  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
  const res = await api.get('/api/reportes/estadisticas-proveedores');
  setEstadisticas(res.data?.data || res.data || {});
      } catch (error) {
        console.error("Error al obtener estadísticas de proveedores:", error);
      }
    };

    const fetchProveedoresPorPais = async () => {
      try {
  const res = await api.get('/api/reportes/proveedores-por-pais');
  setProveedoresPorPais(res.data?.data || res.data || []);
      } catch (error) {
        console.error("Error al obtener proveedores por país:", error);
      }
    };

    const fetchProveedoresPorEstado = async () => {
      try {
  const res = await api.get('/api/reportes/proveedores-por-estado');
  setProveedoresPorEstado(res.data?.data || res.data || []);
      } catch (error) {
        console.error("Error al obtener proveedores por estado:", error);
      }
    };

    const fetchProductosProveedor = async () => {
      try {
  const res = await api.get('/api/reportes/productos-por-proveedor');
  setProductosProveedor(res.data?.data || res.data || []);
      } catch (error) {
        console.error("Error al obtener productos por proveedor:", error);
      }
    };

    const fetchProveedoresRecientes = async () => {
      try {
  const res = await api.get('/api/reportes/proveedores-recientes');
  setProveedoresRecientes(res.data?.data || res.data || []);
      } catch (error) {
        console.error("Error al obtener proveedores recientes:", error);
      }
    };

    fetchEstadisticas();
    fetchProveedoresPorPais();
    fetchProveedoresPorEstado();
    fetchProductosProveedor();
    fetchProveedoresRecientes();
  }, []);

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavCompras />
        <div style={{ padding: "20px" }}>
          <Title level={2}>Reportes de Proveedores</Title>

          <Row gutter={16}>
            <Col span={6}>
              <Card style={{ marginBottom: "20px" }}>
                <Statistic
                  title="Total Proveedores"
                  value={estadisticas.totalProveedores}
                  prefix={<GlobalOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ marginBottom: "20px" }}>
                <Statistic
                  title="Proveedores Activos"
                  value={estadisticas.proveedoresActivos}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ marginBottom: "20px" }}>
                <Statistic
                  title="Proveedores Inactivos"
                  value={estadisticas.proveedoresInactivos}
                  prefix={<StopOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ marginBottom: "20px" }}>
                <Statistic
                  title="Con Productos"
                  value={estadisticas.conProductos}
                  prefix={<ShoppingOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card style={{ marginBottom: "20px" }}>
                <Title level={4}>Proveedores por País</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={proveedoresPorPais}
                      dataKey="cantidad"
                      nameKey="pais"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label
                    >
                      {proveedoresPorPais.map((entry, index) => (
                        <Cell key={`cell-${entry.pais}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ marginBottom: "20px" }}>
                <Title level={4}>Estado de Proveedores</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={proveedoresPorEstado}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="estado" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cantidad" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card style={{ marginBottom: "20px" }}>
                <Title level={4}>Productos por Proveedor</Title>
                <Table
                  dataSource={productosProveedor || []}
                  rowKey="_id"
                  columns={[
                    { title: "Proveedor", dataIndex: "nombre", key: "nombre" },
                    { title: "Productos", dataIndex: "totalProductos", key: "totalProductos" },
                  ]}
                  pagination={false}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ marginBottom: "20px" }}>
                <Title level={4}>Proveedores Recientes</Title>
                <Table
                  dataSource={proveedoresRecientes || []}
                  rowKey="_id"
                  columns={[
                    { title: "Nombre", dataIndex: "nombre", key: "nombre" },
                    { title: "Empresa", dataIndex: "empresa", key: "empresa" },
                    {
                      title: "Estado",
                      dataIndex: "activo",
                      key: "activo",
                      render: (activo) => (
                        <Tag color={activo ? "green" : "red"}>
                          {activo ? "ACTIVO" : "INACTIVO"}
                        </Tag>
                      ),
                    },
                  ]}
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default ReportesProveedores;
