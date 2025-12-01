import React, { useEffect, useState, useCallback } from "react";
import PropTypes from 'prop-types';
import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Typography,
  Tag,
  Modal,
  Spin,
  Empty,
  Divider,
} from "antd";
import {
  GlobalOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ShoppingOutlined,
  DollarCircleOutlined,
  TableOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import api from "../api/axiosConfig";
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
  LineChart,
  Line, 
} from "recharts";
import Fijo from "../components/Fijo";
import NavCompras from "../components/NavCompras";

const { Title } = Typography;

// Paletas de color más ricas y modernas
const COLORS = {
  primary: "#007bff", // Azul vibrante (Órdenes/Proveedores)
  secondary: "#6c757d", // Gris para contraste/fondo
  success: "#28a845", // Verde para Activo/Aprobado
  danger: "#dc3545",  // Rojo para Inactivo/Rechazado
  warning: "#ffc107", // Amarillo/Naranja (Inventario)
  info: "#17a2b8",    // Turquesa (Tendencia)
  light: "#f8f9fa",
  dark: "#343a40",
};

const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.danger, COLORS.warning, COLORS.info, COLORS.secondary];
const DONUT_COLORS = [COLORS.success, COLORS.danger]; // Colores para Aprobado vs Rechazado/Generado

// Función de formato para moneda
const currencyFormatter = (value) => `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
// Función de formato para números
const numberFormatter = (value) => Number(value || 0).toLocaleString();

// Componente de Etiqueta Personalizada para el PieChart (Manteniendo la funcionalidad)
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

// Componente de Tooltip personalizado para PieChart de países
const CustomPaisTooltip = ({ payload }) => {
  if (!payload?.length) return null;
  
  const data = payload[0];
  return (
    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc', borderRadius: '4px', padding: '8px' }}>
      <p style={{ margin: 0, fontWeight: 'bold' }}>{`${data.value} proveedores`}</p>
      <p style={{ margin: 0, color: '#666' }}>{data.payload.pais}</p>
    </div>
  );
};

CustomPaisTooltip.propTypes = {
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number,
      payload: PropTypes.shape({
        pais: PropTypes.string,
      }),
    })
  ),
};

const ReportesProveedores = () => {
    const [estadisticas, setEstadisticas] = useState({});
    const [proveedoresPorPais, setProveedoresPorPais] = useState([]);
    const [proveedoresPorEstado, setProveedoresPorEstado] = useState([]);
    const [productosProveedor, setProductosProveedor] = useState([]);
    const [selectedProviderProducts, setSelectedProviderProducts] = useState([]);
    const [selectedProviderName, setSelectedProviderName] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [proveedoresRecientes, setProveedoresRecientes] = useState([]);
    const [comprasVsOrdenes, setComprasVsOrdenes] = useState(null);
    const [ordenesAprobadasVsCompras, setOrdenesAprobadasVsCompras] = useState(null);

    const fetchProductosDeProveedor = useCallback(async (id, nombre) => {
        setLoadingProducts(true);
        setSelectedProviderName(nombre);
        setIsModalVisible(true);
        setSelectedProviderProducts([]);
        try {
            const res = await api.get(`/api/reportes/productos-de-proveedor/${id}`);
            setSelectedProviderProducts(res.data?.data || res.data || []);
        } catch (error) {
            console.error("Error al obtener productos del proveedor:", error);
            setSelectedProviderProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    }, []);

    useEffect(() => {
        const fetchData = async (endpoint, setter, name) => {
            try {
                const res = await api.get(`/api/reportes/${endpoint}`);
                setter(Array.isArray(res.data?.data) ? (res.data?.data || []) : (res.data?.data || res.data || {})); 
            } catch (error) {
                console.error(`Error al obtener ${name}:`, error);
                setter(endpoint === "estadisticas-proveedores" ? {} : []);
            }
        };

        fetchData("estadisticas-proveedores", setEstadisticas, "estadísticas de proveedores");
        fetchData("proveedores-por-pais", setProveedoresPorPais, "proveedores por país");
        fetchData("proveedores-por-estado", setProveedoresPorEstado, "proveedores por estado");
        fetchData("productos-por-proveedor", setProductosProveedor, "productos por proveedor");
        fetchData("proveedores-recientes", setProveedoresRecientes, "proveedores recientes");
        
        // --- Lógica de Fetch para Reportes Financieros (Mantenida) ---
        const fetchExtraReports = async () => {
            try {
                const [comprasPeriodoRes, ordenesRes] = await Promise.all([
                    api.get('/api/reportes/compras/por-periodo'),
                    api.get('/api/ordenes-compra')
                ]);

                const comprasPeriodo = comprasPeriodoRes.data?.data || comprasPeriodoRes.data || [];
                const ordenesList = ordenesRes.data?.data || ordenesRes.data || [];
                
                const comprasMonthlyMap = {};
                for (const item of (comprasPeriodo || [])) {
                    const id = item._id || {};
                    const year = id.año || id.year || (new Date()).getFullYear();
                    const month = (id.mes || id.month || 1).toString().padStart(2, '0');
                    const period = `${year}-${month}`;
                    comprasMonthlyMap[period] = (comprasMonthlyMap[period] || 0) + (item.totalGasto || item.totalIngresos || 0);
                }

                const ordenesAll = (ordenesList || []);
                const ordenesAprobadas = ordenesAll.filter(o => o.estado === 'Completada' || o.estado === 'Aprobada');

                const totalGastoOrdenesGeneradas = ordenesAll.reduce((s, o) => s + (o.total || 0), 0);
                const totalGastoOrdenesAprobadas = ordenesAprobadas.reduce((s, o) => s + (o.total || 0), 0);

                const ordenesMonthlyMapAll = {};
                const ordenesMonthlyMapApproved = {};
                for (const o of ordenesAll) {
                    const d = o.fechaOrden ? new Date(o.fechaOrden) : new Date(o.createdAt || Date.now());
                    const period = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                    ordenesMonthlyMapAll[period] = (ordenesMonthlyMapAll[period] || 0) + (o.total || 0);

                    if (o.estado === 'Completada' || o.estado === 'Aprobada') {
                        ordenesMonthlyMapApproved[period] = (ordenesMonthlyMapApproved[period] || 0) + (o.total || 0);
                    }
                }

                const periodsAll = Array.from(new Set([...Object.keys(comprasMonthlyMap), ...Object.keys(ordenesMonthlyMapAll)])).sort((a, b) => a.localeCompare(b));
                const monthlyAll = periodsAll.map(p => ({ 
                    period: p, 
                    compras: comprasMonthlyMap[p] || 0, 
                    ordenes: ordenesMonthlyMapAll[p] || 0 
                }));

                const periodsApproved = Array.from(new Set([...Object.keys(ordenesMonthlyMapAll), ...Object.keys(ordenesMonthlyMapApproved)])).sort((a, b) => a.localeCompare(b));
                const monthlyApproved = periodsApproved.map(p => ({ 
                    period: p, 
                    ordenes: ordenesMonthlyMapAll[p] || 0, 
                    ordenesAprobadas: ordenesMonthlyMapApproved[p] || 0 
                }));
                
                setComprasVsOrdenes({ 
                    summary: { totalGasto: totalGastoOrdenesGeneradas }, 
                    monthly: monthlyAll, 
                    ordersSummary: { totalOrdenesGeneradas: ordenesAll.length, totalGastoOrdenesGeneradas } 
                });
                setOrdenesAprobadasVsCompras({ 
                    summary: { totalOrdenesGeneradas: ordenesAll.length, totalGastoOrdenesGeneradas, totalOrdenesAprobadas: ordenesAprobadas.length, totalGastoOrdenesAprobadas }, 
                    monthly: monthlyApproved 
                });
            } catch (err) {
                console.error('Error fetching extra reports', err);
                setComprasVsOrdenes(null);
                setOrdenesAprobadasVsCompras(null);
            }
        };
        fetchExtraReports();
    }, []);

    const productosProveedorColumns = [
        {
          title: "Proveedor",
          dataIndex: "nombre",
          key: "nombre",
          render: (text) => <span style={{ fontWeight: '600', color: COLORS.primary }}>{text}</span>, 
        },
        {
          title: "Productos",
          dataIndex: "totalProductos",
          key: "totalProductos",
          sorter: (a, b) => a.totalProductos - b.totalProductos,
          align: "center",
          render: (text) => <Tag color={text > 0 ? 'blue' : 'default'} style={{ fontWeight: 'bold' }}>{text}</Tag>
        },
    ];

    const selectedProviderProductsColumns = [
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        { 
            title: 'Precio', 
            dataIndex: 'price', 
            key: 'price', 
            render: (v) => <span style={{ fontWeight: 'bold', color: COLORS.success }}>{`$${v ? v.toFixed(2) : '0.00'}`}</span> 
        },
        { title: 'Stock', dataIndex: 'stock', key: 'stock', align: 'center' },
        { 
            title: 'Activo', 
            dataIndex: 'activo', 
            key: 'activo', 
            render: (a) => (
                <Tag color={a ? 'success' : 'error'}>
                    {a ? 'SI' : 'NO'}
                </Tag>
            ) 
        }
    ];

    const proveedoresRecientesColumns = [
        { title: "Nombre", dataIndex: "nombre", key: "nombre" },
        { title: "Empresa", dataIndex: "empresa", key: "empresa" },
        {
          title: "Estado",
          dataIndex: "activo",
          key: "activo",
          render: (activo) => (
            <Tag color={activo ? "success" : "error"}>
              {activo ? "ACTIVO" : "INACTIVO"}
            </Tag>
          ),
        },
    ];

    const getColorForEstado = (estado) => {
        return estado === "Activo" ? COLORS.success : COLORS.danger; 
    };

    return (
        <div>
            <Fijo />
            <div className="content">
                <NavCompras />
                <div className="max-width">
                    <div style={{ padding: "30px 20px" }}>
                        <Title level={1} style={{ marginBottom: "30px", color: COLORS.dark, borderBottom: `2px solid ${COLORS.secondary}`, paddingBottom: '10px' }}>
                            Panel de Reportes de Compras
                        </Title>

                        {/* Sección de Estadísticas Clave - Proveedores */}
                        <Row gutter={[24, 24]} style={{ marginBottom: "30px" }}>
                            {[
                                { title: "Total Proveedores", value: estadisticas.totalProveedores, icon: GlobalOutlined, color: COLORS.primary },
                                { title: "Proveedores Activos", value: estadisticas.proveedoresActivos, icon: CheckCircleOutlined, color: COLORS.success },
                                { title: "Proveedores Inactivos", value: estadisticas.proveedoresInactivos, icon: StopOutlined, color: COLORS.danger },
                                { title: "Con Productos", value: estadisticas.conProductos, icon: ShoppingOutlined, color: COLORS.warning },
                            ].map((stat) => (
                                <Col xs={24} sm={12} md={12} lg={6} key={stat.title}>
                                    <Card
                                        variant="borderless"
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
                        
                        <Divider orientation="left" style={{ borderTop: `1px solid ${COLORS.secondary}` }}>
                            <Title level={2} style={{ margin: 0, color: COLORS.dark }}>
                                <DollarCircleOutlined style={{ marginRight: 10, color: COLORS.info }} />
                                Análisis Financiero
                            </Title>
                        </Divider>

                        {/* Sección de Reportes Financieros con Gráficos de Tendencia y Comparación */}
                        <Row gutter={[24, 24]} style={{ marginTop: 24, marginBottom: 24 }}>
                            {/* Reporte 1: Compras vs Órdenes Generadas (Gráfico de LÍNEAS) */}
                            <Col xs={24} md={12}>
                                <Card 
                                    title={<Title level={4} style={{ margin: 0, color: COLORS.dark }}>Tendencia de Gasto (Compras vs Órdenes)</Title>} 
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}
                                >
                                    {comprasVsOrdenes ? (
                                        <div>
                                            <Row gutter={16} style={{ marginBottom: 16 }}>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="Gasto Total (Órdenes Generadas)"
                                                        value={comprasVsOrdenes.ordersSummary?.totalGastoOrdenesGeneradas || 0}
                                                        formatter={currencyFormatter}
                                                        prefix={<DollarCircleOutlined style={{ color: COLORS.primary }} />}
                                                        valueStyle={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 18 }}
                                                    />
                                                </Col>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="Órdenes Totales Generadas"
                                                        value={comprasVsOrdenes.ordersSummary?.totalOrdenesGeneradas || 0}
                                                        formatter={numberFormatter}
                                                        prefix={<ShoppingOutlined style={{ color: COLORS.secondary }} />}
                                                        valueStyle={{ color: COLORS.secondary, fontWeight: 'bold', fontSize: 18 }}
                                                    />
                                                </Col>
                                            </Row>
                                            
                                            {comprasVsOrdenes.monthly && comprasVsOrdenes.monthly.length > 0 ? (
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <LineChart data={comprasVsOrdenes.monthly} margin={{ top: 15, right: 30, left: 20, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis dataKey="period" />
                                                        <YAxis tickFormatter={currencyFormatter} />
                                                        <Tooltip formatter={(v) => currencyFormatter(v)} />
                                                        <Legend />
                                                        <Line type="monotone" dataKey="compras" stroke={COLORS.info} strokeWidth={2} name="Total Compras" dot={false} />
                                                        <Line type="monotone" dataKey="ordenes" stroke={COLORS.primary} strokeWidth={2} name="Órdenes Generadas" dot={false} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <Empty description="No hay datos mensuales de compras y órdenes" />
                                            )}
                                        </div>
                                    ) : (
                                        <Empty description="Reporte de Compras vs Órdenes no disponible" />
                                    )}
                                </Card>
                            </Col>

                            {/* Reporte 2: Órdenes Generadas vs Aprobadas (Gráfico de Donut y Estadísticas) */}
                            <Col xs={24} md={12}>
                                <Card 
                                    title={<Title level={4} style={{ margin: 0, color: COLORS.dark }}>Tasa de Aprobación de Órdenes</Title>} 
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}
                                >
                                    {ordenesAprobadasVsCompras ? (
                                        <Row gutter={16}>
                                            {/* Columna de Estadísticas */}
                                            <Col span={12}>
                                                <Statistic
                                                    title="Total Generadas"
                                                    value={ordenesAprobadasVsCompras.summary?.totalOrdenesGeneradas || 0}
                                                    prefix={<ShoppingOutlined style={{ color: COLORS.primary }} />}
                                                    valueStyle={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}
                                                />
                                                <Statistic
                                                    title="Total Aprobadas"
                                                    value={ordenesAprobadasVsCompras.summary?.totalOrdenesAprobadas || 0}
                                                    prefix={<CheckCircleOutlined style={{ color: COLORS.success }} />}
                                                    valueStyle={{ color: COLORS.success, fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}
                                                />
                                                <Statistic
                                                    title="Tasa de Aprobación"
                                                    value={((ordenesAprobadasVsCompras.summary?.totalOrdenesAprobadas || 0) / (ordenesAprobadasVsCompras.summary?.totalOrdenesGeneradas || 1)) * 100}
                                                    precision={2}
                                                    suffix="%"
                                                    prefix={<LineChartOutlined style={{ color: COLORS.info }} />}
                                                    valueStyle={{ color: COLORS.info, fontWeight: 'bold', fontSize: 24 }}
                                                />
                                            </Col>

                                            {/* Columna de Gráfico de Donut de Proporción */}
                                            <Col span={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 230 }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'Aprobadas', value: ordenesAprobadasVsCompras.summary?.totalOrdenesAprobadas || 0 },
                                                                { name: 'Pendientes/Rechazadas', value: (ordenesAprobadasVsCompras.summary?.totalOrdenesGeneradas || 0) - (ordenesAprobadasVsCompras.summary?.totalOrdenesAprobadas || 0) },
                                                            ]}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={80}
                                                            innerRadius={50}
                                                            paddingAngle={2}
                                                            startAngle={90}
                                                            endAngle={-270}
                                                        >
                                                            <Cell fill={DONUT_COLORS[0]} />
                                                            <Cell fill={DONUT_COLORS[1]} />
                                                        </Pie>
                                                        <Tooltip 
                                                            formatter={(value, name) => ([value, name])}
                                                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc', borderRadius: '4px' }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </Col>
                                        </Row>
                                    ) : (
                                        <Empty description="Reporte de Aprobación no disponible" style={{ padding: '50px 0' }} />
                                    )}
                                </Card>
                            </Col>
                        </Row>

                        {/* --- Sección de Gráficos de Proveedores (RE-INSERTADA) --- */}
                        
                        <Divider orientation="left" style={{ borderTop: `1px solid ${COLORS.secondary}`, marginTop: 40 }}>
                            <Title level={2} style={{ margin: 0, color: COLORS.dark }}>
                                <LineChartOutlined style={{ marginRight: 10, color: COLORS.primary }} />
                                Análisis Gráfico de Proveedores
                            </Title>
                        </Divider>

                        <Row gutter={[24, 24]} style={{ marginTop: "20px" }}>
                            {/* Proveedores por País (Gráfico de Tarta) */}
                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark }}>Distribución Geográfica</Title>} 
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={proveedoresPorPais}
                                                dataKey="cantidad"
                                                nameKey="pais"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                innerRadius={50}
                                                paddingAngle={5}
                                                fill="#8884d8"
                                                labelLine={false}
                                                label={CustomPieLabel} 
                                            >
                                                {proveedoresPorPais.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${entry.pais}-${index}`}
                                                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                        stroke={PIE_COLORS[index % PIE_COLORS.length]}
                                                        onMouseOver={(e) => e.target.style.opacity = 0.8}
                                                        onMouseOut={(e) => e.target.style.opacity = 1}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomPaisTooltip />} />
                                            <Legend 
                                                layout="horizontal" 
                                                verticalAlign="bottom" 
                                                align="center" 
                                                iconType="circle"
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Card>
                            </Col>
                            
                            {/* Estado de Proveedores (Gráfico de Barras Horizontal) */}
                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark }}>Estado de Cuentas</Title>} 
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={proveedoresPorEstado} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis type="number" stroke={COLORS.dark} />
                                            <YAxis dataKey="estado" type="category" stroke={COLORS.dark} />
                                            <Tooltip />
                                            <Bar 
                                                dataKey="cantidad" 
                                                name="Cantidad"
                                                radius={[10, 10, 0, 0]}
                                            >
                                                {proveedoresPorEstado.map((entry) => (
                                                    <Cell key={`cell-${entry.estado}`} fill={getColorForEstado(entry.estado)} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Card>
                            </Col>
                        </Row>

                        {/* --- Sección de Tablas --- */}
                        
                        <Divider orientation="left" style={{ borderTop: `1px solid ${COLORS.secondary}`, marginTop: 40 }}>
                            <Title level={2} style={{ margin: 0, color: COLORS.dark }}>
                                <TableOutlined style={{ marginRight: 10, color: COLORS.primary }} />
                                Datos Tabulares
                            </Title>
                        </Divider>

                        <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
                            {/* Productos por Proveedor (Tabla) - Interactivo */}
                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark }}>Inventario por Proveedor</Title>} 
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}
                                >
                                    <Table
                                        dataSource={productosProveedor || []}
                                        rowKey="_id"
                                        columns={productosProveedorColumns}
                                        pagination={{ pageSize: 7, hideOnSinglePage: true }} 
                                        scroll={{ y: 350 }} 
                                        size="large"
                                        rowClassName={() => 'hover-row'} 
                                        onRow={(record) => ({
                                            onClick: () => {
                                                fetchProductosDeProveedor(record._id, record.nombre);
                                            },
                                        })}
                                    />
                                    <div style={{ marginTop: 15, color: COLORS.info, fontSize: '0.9em' }}>
                                        * Haz clic en el nombre del proveedor para ver el detalle de sus productos.
                                    </div>
                                </Card>
                            </Col>
                            
                            {/* Proveedores Recientes (Tabla) */}
                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card
                                    title={<Title level={4} style={{ color: COLORS.dark }}>Últimos Proveedores Agregados</Title>}
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}
                                >
                                    <Table
                                        dataSource={proveedoresRecientes || []}
                                        rowKey="_id"
                                        columns={proveedoresRecientesColumns}
                                        pagination={{ pageSize: 7, hideOnSinglePage: true }}
                                        scroll={{ y: 350 }}
                                        size="large"
                                    />
                                </Card>
                            </Col>
                        </Row>

                        {/* Modal para Productos del Proveedor Seleccionado */}
                        <Modal
                            title={<Title level={3} style={{ margin: 0 }}>Detalle: {selectedProviderName}</Title>}
                            open={isModalVisible}
                            onCancel={() => {
                                setIsModalVisible(false);
                                setSelectedProviderProducts([]);
                                setSelectedProviderName('');
                            }}
                            footer={null}
                            width={800}
                        >
                            {(() => {
                                if (loadingProducts) {
                                    return (
                                        <div style={{ textAlign: 'center', padding: '50px' }}>
                                            <Spin size="large" tip="Cargando productos..." />
                                        </div>
                                    );
                                }
                                if (selectedProviderProducts.length > 0) {
                                    return (
                                        <Table
                                            dataSource={selectedProviderProducts}
                                            rowKey={(r) => r._id}
                                            columns={selectedProviderProductsColumns}
                                            pagination={{ pageSize: 5 }}
                                            size="middle"
                                        />
                                    );
                                }
                                return (
                                    <p style={{ padding: '20px', textAlign: 'center', color: COLORS.danger }}>
                                        El proveedor **{selectedProviderName}** no tiene productos registrados.
                                    </p>
                                );
                            })()}
                        </Modal>

                    </div>
                </div>
            </div>

            <style>{`
                .hover-row:hover {
                    background-color: ${COLORS.light} !important;
                    cursor: pointer;
                }
            `}</style>

        </div>
    );
};

export default ReportesProveedores;