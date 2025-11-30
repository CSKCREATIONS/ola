import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { 
    Card, 
    Col, 
    Row, 
    Statistic, 
    Table, 
    Typography, 
    Divider, 
    Spin,
    Tag,
    Empty 
} from "antd";
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    DollarOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    LineChartOutlined,
    TableOutlined,
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

// Paleta de colores consistente
const COLORS = {
    primary: "#007bff", // Azul vibrante (Ingresos/Ventas)
    secondary: "#6c757d", // Gris para contraste
    success: "#28a845", // Verde para Crecimiento/Entregado
    danger: "#dc3545",  // Rojo para Decrecimiento/Cancelado
    warning: "#ffc107", // Amarillo/Naranja (Pendiente)
    info: "#17a2b8",    // Turquesa
    light: "#f8f9fa",
    dark: "#343a40",
};

// Paleta para el PieChart de estados de pedidos
const PIE_STATE_COLORS = {
    'Entregado': COLORS.success,
    'En Proceso': COLORS.warning,
    'Pendiente': COLORS.info,
    'Cancelado': COLORS.danger,
    'Completado': COLORS.success, // Alias
    'Otro': COLORS.secondary
};

// Función de formato para moneda
const currencyFormatter = (value) => `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
// Función de formato para números
const numberFormatter = (value) => Number(value || 0).toLocaleString();

// Función Helper para el Tooltip del PieChart
const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const data = payload[0]?.payload;
      return (
        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <p style={{ fontWeight: 'bold' }}>{data?.name}</p>
          <p style={{ color: COLORS.primary }}>{`Pedidos: ${data?.value}`}</p>
        </div>
      );
    }
    return null;
  };

CustomPieTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      payload: PropTypes.shape({
        name: PropTypes.string,
        value: PropTypes.number,
      }),
    })
  ),
};

// Etiqueta personalizada para el PieChart (Donut)
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
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

CustomPieLabel.propTypes = {
  cx: PropTypes.number,
  cy: PropTypes.number,
  midAngle: PropTypes.number,
  innerRadius: PropTypes.number,
  outerRadius: PropTypes.number,
  value: PropTypes.number,
  name: PropTypes.string,
  percent: PropTypes.number,
};


const ReportessVentas = () => {
    const [estadisticas, setEstadisticas] = useState({});
    const [clientes, setClientes] = useState({});
    const [productos, setProductos] = useState({});
    const [estadosChartData, setEstadosChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setError(null);
    
            const fetchEndpoint = async (endpoint, setter, type) => {
                try {
                    const res = await api.get(`/api/reportes/${endpoint}`);
                    if (res.data?.success) {
                         // Manejar datos de arrays vs objetos
                        if (Array.isArray(res.data.data)) {
                            setter(res.data.data);
                        } else {
                            setter(res.data.data || {});
                        }
                    } else {
                        console.warn(`⚠️ Formato de respuesta inválido para ${type}:`, res.data);
                        setter(Array.isArray(res.data?.data) ? [] : {});
                    }
                } catch (error) {
                    console.error(`❌ Error al obtener ${type}:`, error);
                    setError(error.message);
                    throw error;
                }
            };
    
            try {
                // Ejecutar todas las llamadas
                await Promise.all([
                    fetchEndpoint('estadisticas', setEstadisticas, 'estadísticas'),
                    fetchEndpoint('clientes', setClientes, 'clientes'),
                    fetchEndpoint('productos', setProductos, 'productos'),
                    fetchEndpoint('estados', setEstadosChartData, 'estados de pedidos'),
                ]);
            } catch (error) {
                console.error('Error al cargar datos del reporte:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    // Columnas para Top Clientes
    const clientesColumns = [
        {
            title: "Cliente",
            dataIndex: "nombre",
            key: "nombre",
            render: (text) => <span style={{ fontWeight: '600', color: COLORS.dark }}>{text || "Sin nombre"}</span>
        },
        {
            title: "Total Compras",
            dataIndex: "totalCompras",
            key: "totalCompras",
            align: 'right',
            render: (value) => <span style={{ color: COLORS.primary, fontWeight: 'bold' }}>{currencyFormatter(value)}</span>
        },
    ];

    // Columnas para Top Productos
    const productosColumns = [
        {
            title: "Producto",
            dataIndex: "nombre",
            key: "nombre",
            render: (text) => <span style={{ fontWeight: '600', color: COLORS.dark }}>{text || "Producto sin nombre"}</span>
        },
        {
            title: "Unidades Vendidas",
            dataIndex: "cantidadVendida",
            key: "cantidadVendida",
            align: 'center',
            render: (value) => <Tag color={COLORS.success} style={{ fontWeight: 'bold' }}>{value || 0}</Tag>
        },
    ];

    // --- RENDERIZADO DEL DASHBOARD ---

    if (loading) {
        return (
            <div>
                <Fijo />
                <div className="content">
                    <NavVentas />
                    <div className="max-width" style={{ padding: "50px 20px", textAlign: 'center' }}>
                        <Spin size="large" />
                        <Title level={4} style={{ marginTop: 20 }}>⏳ Cargando datos de ventas...</Title>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Fijo />
            <div className="content">
                <NavVentas />
                <div className="max-width">
                    <div style={{ padding: "30px 20px" }}>
                        <Title level={1} style={{ marginBottom: "30px", color: COLORS.dark, borderBottom: `2px solid ${COLORS.light}`, paddingBottom: '10px' }}>
                            Panel de Reportes de Ventas
                        </Title>

                        {/* Manejo de Errores */}
                        {error && (
                            <div style={{ textAlign: "center", padding: "20px", backgroundColor: "#fff2f0", border: "1px solid #ffccc7", borderRadius: "6px", marginBottom: "30px" }}>
                                <Title level={4} style={{ color: COLORS.danger }}>❌ Error de Conexión</Title>
                                <p>No se pudo cargar la data: **{error}**</p>
                                <p>Verifica la conexión a la API.</p>
                            </div>
                        )}

                        {/* Sección de Estadísticas Clave */}
                        <Row gutter={[24, 24]} style={{ marginBottom: "40px" }}>
                            <Col xs={24} sm={12} md={12} lg={6}>
                                <Card variant="borderless" hoverable style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderLeft: `5px solid ${COLORS.primary}` }}>
                                    <Statistic
                                        title={<span style={{ color: COLORS.dark, fontWeight: '500' }}>Ventas Totales</span>}
                                        value={estadisticas.ventasTotales || 0}
                                        prefix={<DollarOutlined style={{ color: COLORS.primary, fontSize: '24px' }} />}
                                        formatter={currencyFormatter}
                                        valueStyle={{ color: COLORS.primary, fontWeight: 'bold' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={12} lg={6}>
                                <Card variant="borderless" hoverable style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderLeft: `5px solid ${COLORS.info}` }}>
                                    <Statistic
                                        title={<span style={{ color: COLORS.dark, fontWeight: '500' }}>Total Pedidos</span>}
                                        value={estadisticas.totalPedidos || 0}
                                        prefix={<ShoppingCartOutlined style={{ color: COLORS.info, fontSize: '24px' }} />}
                                        valueStyle={{ color: COLORS.info, fontWeight: 'bold' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={12} lg={6}>
                                <Card variant="borderless" hoverable style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderLeft: `5px solid ${COLORS.secondary}` }}>
                                    <Statistic
                                        title={<span style={{ color: COLORS.dark, fontWeight: '500' }}>Clientes Activos</span>}
                                        value={estadisticas.clientesActivos || 0}
                                        prefix={<UserOutlined style={{ color: COLORS.secondary, fontSize: '24px' }} />}
                                        valueStyle={{ color: COLORS.secondary, fontWeight: 'bold' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={12} lg={6}>
                                <Card variant="borderless" hoverable style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderLeft: `5px solid ${(estadisticas.crecimiento || 0) >= 0 ? COLORS.success : COLORS.danger}` }}>
                                    <Statistic
                                        title={<span style={{ color: COLORS.dark, fontWeight: '500' }}>Crecimiento (%)</span>}
                                        value={estadisticas.crecimiento || 0}
                                        precision={2}
                                        suffix="%"
                                        valueStyle={{
                                            color: (estadisticas.crecimiento || 0) >= 0 ? COLORS.success : COLORS.danger,
                                            fontWeight: 'bold',
                                        }}
                                        prefix={(estadisticas.crecimiento || 0) >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Divider orientation="left" style={{ borderTop: `1px solid ${COLORS.secondary}` }}>
                            <Title level={2} style={{ margin: 0, color: COLORS.dark }}>
                                <TableOutlined style={{ marginRight: 10, color: COLORS.primary }} />
                                Clientes y Productos Destacados
                            </Title>
                        </Divider>

                        {/* Sección de Tablas: Top Clientes y Top Productos */}
                        <Row gutter={[24, 24]} style={{ marginTop: "20px", marginBottom: "40px" }}>
                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark }}>Estado del Inventario</Title>} 
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}
                                >
                                    <Table
                                        dataSource={clientes.topClientes || []}
                                        rowKey={(record, index) => record._id || index}
                                        columns={clientesColumns}
                                        pagination={{ pageSize: 5, hideOnSinglePage: true }}
                                        scroll={{ y: 300 }}
                                        size="large"
                                        locale={{ emptyText: <Empty description="No hay datos de clientes" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark }}>Distribución de Estados</Title>} 
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}
                                >
                                    <Table
                                        dataSource={productos.topProductos || []}
                                        rowKey={(record, index) => record._id || index}
                                        columns={productosColumns}
                                        pagination={{ pageSize: 5, hideOnSinglePage: true }}
                                        scroll={{ y: 300 }}
                                        size="large"
                                        locale={{ emptyText: <Empty description="No hay datos de productos" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Divider orientation="left" style={{ borderTop: `1px solid ${COLORS.secondary}` }}>
                            <Title level={2} style={{ margin: 0, color: COLORS.dark }}>
                                <LineChartOutlined style={{ marginRight: 10, color: COLORS.primary }} />
                                Tendencias y Distribución
                            </Title>
                        </Divider>

                        {/* Sección de Gráficos: Estado de Pedidos y Ventas Mensuales */}
                        <Row gutter={[24, 24]} style={{ marginTop: "20px" }}>
                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark }}>pie-chart Distribución por Estado de Pedidos</Title>} 
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={estadosChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                innerRadius={50} // Efecto Donut
                                                paddingAngle={5}
                                                fill="#8884d8"
                                                labelLine={false}
                                                label={CustomPieLabel}
                                            >
                                                {estadosChartData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${entry.name}-${index}`} 
                                                        fill={PIE_STATE_COLORS[entry.name] || PIE_STATE_COLORS['Otro']} 
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomPieTooltip />} />
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {(estadosChartData.length === 0) && <Empty description="No hay data de estados" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                                </Card>
                            </Col>

                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark }}>bar-chart Ventas Mensuales (Ingresos y Cantidad)</Title>} 
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={estadisticas.ventasMensuales || []} margin={{ top: 15, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="mes" stroke={COLORS.dark} />
                                            <YAxis yAxisId="left" orientation="left" stroke={COLORS.success} tickFormatter={numberFormatter} /> {/* Ventas (Cantidad) */}
                                            <YAxis yAxisId="right" orientation="right" stroke={COLORS.primary} tickFormatter={currencyFormatter} /> {/* Ingresos (Moneda) */}
                                            <Tooltip
                                                formatter={(value, name) => {
                                                    if (name === 'Ventas') {
                                                        return [`${numberFormatter(value)} unidades`, 'Cantidad de Ventas'];
                                                    } else if (name === 'Ingresos') {
                                                        return [currencyFormatter(value), 'Ingresos'];
                                                    }
                                                    return [value, name];
                                                }}
                                            />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="ventas" fill={COLORS.success} name="Ventas" radius={[5, 5, 0, 0]} />
                                            <Bar yAxisId="right" dataKey="ingresos" fill={COLORS.primary} name="Ingresos" radius={[5, 5, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    {(!(estadisticas.ventasMensuales && estadisticas.ventasMensuales.length > 0)) && <Empty description="No hay data mensual" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </div>
            </div>
            
            {/* Estilo CSS opcional para hover si lo deseas, aunque AntD maneja gran parte del estilo */}
            <style>{`
                .ant-card-hoverable:hover {
                    transform: translateY(-2px);
                    transition: transform 0.3s, box-shadow 0.3s;
                }
            `}</style>
        </div>
    );
};

export default ReportessVentas;