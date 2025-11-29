import React, { useEffect, useState } from "react";
import { 
    Card, 
    Col, 
    Row, 
    Statistic, 
    Table, 
    Typography, 
    Divider, 
    Tag 
} from "antd";
import {
    ShoppingOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    StopOutlined,
    TableOutlined,
    LineChartOutlined,
    BarChartOutlined, // Aseguramos que este icono esté importado
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

// Paleta de colores consistente
const COLORS = {
    primary: "#007bff", // Azul vibrante (Total)
    success: "#28a845", // Verde para Activo
    danger: "#dc3545",  // Rojo para Inactivo
    warning: "#ffc107", // Amarillo/Naranja (Stock Bajo)
    dark: "#343a40",
    light: "#f8f9fa",
    info: "#17a2b8",
};

const PIE_COLORS = [COLORS.success, COLORS.danger, COLORS.warning, COLORS.info, COLORS.primary];

// 1. Función Helper para el Tooltip (CORREGIDA PARA ACCEDER A LA DATA CORRECTA)
const CustomTooltip = ({ active, payload }) => {
    // Verificamos que payload exista y tenga datos
    if (active && payload && payload.length) {
      // El payload[0].payload contiene el objeto de datos original: { categoria, cantidad }
      const data = payload[0].payload; 
      
      // La cantidad viene directamente del payload[0].value
      const cantidad = payload[0].value;
      const categoria = data.categoria;

      return (
        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <p style={{ fontWeight: 'bold' }}>Categoría: {categoria}</p>
          <p style={{ color: COLORS.primary }}>{`Cantidad: ${cantidad}`}</p>
        </div>
      );
    }
    return null;
  };

// 2. Función Helper para asignar colores a las barras
const getColorForCategoria = (index) => {
    return PIE_COLORS[index % PIE_COLORS.length];
};

// Componente para PieChart (Mantenido para funcionalidad)
const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };


const Reportes = () => {
    const [estadisticas, setEstadisticas] = useState({});
    const [productosPorCategoria, setProductosPorCategoria] = useState([]);
    const [productosPorEstado, setProductosPorEstado] = useState([]);

    useEffect(() => {
        const fetchData = async (endpoint, setter, name) => {
            try {
                const res = await api.get(`/api/reportes/${endpoint}`);
                // Aseguramos que los setters reciban un array si se esperan datos tabulares
                setter(Array.isArray(res.data?.data) ? (res.data?.data || []) : (res.data?.data || res.data || {}));
            } catch (error) {
                console.error(`Error al obtener ${name}:`, error);
                setter(endpoint === "estadisticas-productos" ? {} : []); // Asignar array vacío si falla
            }
        };

        fetchData("estadisticas-productos", setEstadisticas, "estadísticas de productos");
        fetchData("productos-por-categoria", setProductosPorCategoria, "productos por categoría");
        fetchData("productos-por-estado", setProductosPorEstado, "productos por estado");
    }, []);

    const categoriaColumns = [
        { 
            title: "Categoría", 
            dataIndex: "categoria", 
            key: "categoria",
            render: (text) => <a style={{ fontWeight: '600', color: COLORS.primary }}>{text}</a>, 
        },
        { 
            title: "Cantidad", 
            dataIndex: "cantidad", 
            key: "cantidad",
            align: 'center',
            render: (text) => <Tag color={COLORS.primary} style={{ fontWeight: 'bold' }}>{text}</Tag>
        },
    ];

    // --- RENDERIZADO DEL COMPONENTE ---

    return (
        <div>
            <Fijo />
            <div className="content">
                <NavProductos />
                <div className="max-width">
                    <div style={{ padding: "30px 20px" }}> 
                        <Title level={1} style={{ marginBottom: "30px", color: COLORS.dark, borderBottom: `2px solid ${COLORS.light}`, paddingBottom: '10px' }}>
                            Panel de Reportes de Inventario y Productos
                        </Title>

                        {/* Sección de Estadísticas Clave */}
                        <Row gutter={[24, 24]} style={{ marginBottom: "30px" }}>
                            {[
                                { title: "Total Productos", value: estadisticas.totalProductos, icon: ShoppingOutlined, color: COLORS.primary },
                                { title: "Productos Activos", value: estadisticas.productosActivos, icon: CheckCircleOutlined, color: COLORS.success },
                                { title: "Productos Inactivos", value: estadisticas.productosInactivos, icon: StopOutlined, color: COLORS.danger },
                                { title: "Stock Bajo", value: estadisticas.stockBajo, icon: WarningOutlined, color: COLORS.warning },
                            ].map((stat, index) => (
                                <Col xs={24} sm={12} md={12} lg={6} key={index}>
                                    <Card 
                                        bordered={false} 
                                        hoverable 
                                        style={{ 
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                                            borderLeft: `5px solid ${stat.color}`,
                                        }}
                                    >
                                        <Statistic
                                            title={<span style={{ color: COLORS.dark, fontWeight: '500' }}>{stat.title}</span>}
                                            value={stat.value || 0}
                                            prefix={<stat.icon style={{ color: stat.color, fontSize: '24px' }} />}
                                            valueStyle={{ color: stat.color, fontWeight: 'bold' }}
                                        />
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        <Divider orientation="left" style={{ borderTop: `1px solid ${COLORS.info}` }}>
                            <Title level={2} style={{ margin: 0, color: COLORS.dark }}>
                                <LineChartOutlined style={{ marginRight: 10, color: COLORS.info }} />
                                Análisis de Distribución
                            </Title>
                        </Divider>

                        {/* Sección de Tablas y Gráficos */}
                        <Row gutter={[24, 24]} style={{ marginTop: "20px" }}>
                            {/* Productos por Categoría (Tabla) */}
                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark }}>Productos por Categoría</Title>} 
                                    bordered
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}
                                >
                                    <Table
                                        dataSource={productosPorCategoria || []}
                                        rowKey="_id"
                                        columns={categoriaColumns}
                                        pagination={{ pageSize: 5, hideOnSinglePage: true }}
                                        size="middle"
                                        style={{ marginBottom: '15px' }}
                                    />
                                </Card>
                            </Col>
                            
                            {/* Estado de Productos (Gráfico de Tarta/Donut) */}
                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark }}>Estado de Inventario</Title>} 
                                    bordered
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={productosPorEstado.map(item => ({...item, name: item.name})) || []}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                innerRadius={50}
                                                paddingAngle={5}
                                                fill="#8884d8"
                                                labelLine={false}
                                                label={CustomPieLabel} // Usamos la etiqueta personalizada para el Donut
                                            >
                                                {productosPorEstado.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${entry.name}-${index}`} 
                                                        fill={entry.name === 'Activo' ? COLORS.success : entry.name === 'Inactivo' ? COLORS.danger : COLORS.warning} 
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Card>
                            </Col>
                        </Row>

                        <Divider orientation="left" style={{ borderTop: `1px solid ${COLORS.info}`, marginTop: 40 }}>
                            <Title level={2} style={{ margin: 0, color: COLORS.dark }}>
                                <BarChartOutlined style={{ marginRight: 10, color: COLORS.info }} />
                                Comparación por Categoría
                            </Title>
                        </Divider>

                        {/* 3. Sección de Gráfico de Barras (REVISADA) */}
                        <Row gutter={[24, 24]}>
                            <Col span={24}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark }}>Distribución Detallada por Categoría</Title>} 
                                    bordered
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', marginTop: '20px' }}
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={productosPorCategoria || []} margin={{ top: 15, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            {/* Aseguramos que dataKey apunte al campo correcto: 'categoria' */}
                                            <XAxis dataKey="categoria" stroke={COLORS.dark} /> 
                                            <YAxis />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            {/* Aseguramos que dataKey apunte al campo correcto: 'cantidad' */}
                                            <Bar dataKey="cantidad" name="Cantidad de Productos" radius={[5, 5, 0, 0]} >
                                                {productosPorCategoria.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={getColorForCategoria(index)} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Card>
                            </Col>
                        </Row>
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reportes;