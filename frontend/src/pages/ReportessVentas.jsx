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
    Empty,
    DatePicker,
    Space,
    Button
} from "antd";
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    DollarOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    LineChartOutlined,
    TableOutlined,
    FileTextOutlined,
    ReloadOutlined
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
    LineChart,
    Line
} from "recharts";
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';

const { Title } = Typography;
const { RangePicker } = DatePicker;

// Paleta de colores consistente
const COLORS = {
    primary: "#007bff",
    secondary: "#6c757d",
    success: "#28a745",
    danger: "#dc3545",
    warning: "#ffc107",
    info: "#17a2b8",
    light: "#f8f9fa",
    dark: "#343a40",
};

// Paleta para el PieChart de estados de pedidos
const PIE_STATE_COLORS = {
    'Entregado': COLORS.success,
    'Agendado': COLORS.warning,
    'Pendiente': COLORS.info,
    'Cancelado': COLORS.danger,
    'Completado': COLORS.success,
    'Otro': COLORS.secondary
};

// Función de formato para moneda
const currencyFormatter = (value) => `S/. ${Number(value || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// Función de formato para números
const numberFormatter = (value) => Number(value || 0).toLocaleString('es-PE');

// Tooltip personalizado para el PieChart
const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const data = payload[0]?.payload;
      return (
        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <p style={{ fontWeight: 'bold', margin: 0 }}>{data?.name}</p>
          <p style={{ color: COLORS.primary, margin: '5px 0 0 0' }}>{`Pedidos: ${data?.value}`}</p>
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
const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
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
        fontWeight="bold"
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
  percent: PropTypes.number,
};

const ReportessVentas = () => {
    // Estados principales
    const [estadisticas, setEstadisticas] = useState({});
    const [topClientes, setTopClientes] = useState([]);
    const [topProductos, setTopProductos] = useState([]);
    const [estadosChartData, setEstadosChartData] = useState([]);
    const [cotizaciones, setCotizaciones] = useState({});
    const [pedidosEstados, setPedidosEstados] = useState({});
    const [prospectos, setProspectos] = useState({});
    const [remisiones, setRemisiones] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estados para filtros de fecha
    const [dateRange, setDateRange] = useState(null);

    // Función helper para procesar respuestas de la API
    const procesarRespuesta = (response, setter, esArray = false) => {
        if (response.data?.success) {
            const data = response.data.data;
            if (esArray) {
                setter(Array.isArray(data) ? data : []);
            } else {
                setter(data || {});
            }
        }
    };

    // Función para cargar todos los datos
    const fetchAllData = async (desde = null, hasta = null) => {
        setLoading(true);
        setError(null);

        try {
            // Construir query params para filtros de fecha
            const queryParams = {};
            if (desde && hasta) {
                queryParams.desde = desde;
                queryParams.hasta = hasta;
            }
            const queryString = new URLSearchParams(queryParams).toString();
            const query = queryString ? `?${queryString}` : '';

            // Ejecutar todas las llamadas en paralelo
            const [
                estadisticasRes,
                topClientesRes,
                topProductosRes,
                estadosRes,
                cotizacionesRes,
                pedidosRes,
                prospectosRes,
                remisionesRes
            ] = await Promise.all([
                api.get('/api/reportes/estadisticas'),
                api.get('/api/reportes/top-clientes-compras'),
                api.get(`/api/reportes/top-productos-vendidos${query}`),
                api.get('/api/reportes/estados'),
                api.get(`/api/reportes/cotizaciones-registradas${query}`),
                api.get(`/api/reportes/pedidos-estados${query}`),
                api.get(`/api/reportes/prospectos-convertidos${query}`),
                api.get(`/api/reportes/remisiones-generadas${query}`)
            ]);

            // Procesar respuestas
            procesarRespuesta(estadisticasRes, setEstadisticas);
            procesarRespuesta(topClientesRes, setTopClientes, true);
            procesarRespuesta(topProductosRes, setTopProductos, true);
            procesarRespuesta(estadosRes, setEstadosChartData, true);
            procesarRespuesta(cotizacionesRes, setCotizaciones);
            procesarRespuesta(pedidosRes, setPedidosEstados);
            procesarRespuesta(prospectosRes, setProspectos);
            procesarRespuesta(remisionesRes, setRemisiones);

        } catch (err) {
            console.error('Error al cargar datos del reporte:', err);
            setError(err.message || 'Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Manejar cambio de rango de fechas
    const handleDateRangeChange = (dates) => {
        setDateRange(dates);
        if (dates?.[0] && dates?.[1]) {
            const desde = dates[0].format('YYYY-MM-DD');
            const hasta = dates[1].format('YYYY-MM-DD');
            fetchAllData(desde, hasta);
        } else {
            fetchAllData();
        }
    };

    // Manejar reset de filtros
    const handleResetFilters = () => {
        setDateRange(null);
        fetchAllData();
    };

    // Columnas para Top Clientes
    const clientesColumns = [
        {
            title: "Cliente",
            dataIndex: "nombre",
            key: "nombre",
            render: (text) => <span style={{ fontWeight: '600', color: COLORS.dark }}>{text || "Sin nombre"}</span>
        },
        {
            title: "Compras",
            dataIndex: "totalCompras",
            key: "totalCompras",
            align: 'center',
            render: (value) => <Tag color="blue" style={{ fontWeight: 'bold', fontSize: '13px' }}>{value || 0}</Tag>
        },
        {
            title: "Monto Total",
            dataIndex: "totalMonto",
            key: "totalMonto",
            align: 'right',
            render: (value) => <span style={{ color: COLORS.success, fontWeight: 'bold' }}>{currencyFormatter(value)}</span>
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
            title: "Cantidad Vendida",
            dataIndex: "cantidadVendida",
            key: "cantidadVendida",
            align: 'center',
            render: (value) => <Tag color="green" style={{ fontWeight: 'bold', fontSize: '13px' }}>{value || 0} uds</Tag>
        },
        {
            title: "Ingresos",
            dataIndex: "totalIngresos",
            key: "totalIngresos",
            align: 'right',
            render: (value) => <span style={{ color: COLORS.primary, fontWeight: 'bold' }}>{currencyFormatter(value)}</span>
        },
    ];

    // Formatear datos de ventas mensuales
    const ventasMensualesData = estadisticas.ventasMensuales || [];

    // --- RENDERIZADO DEL DASHBOARD ---

    if (loading) {
        return (
            <div>
                <Fijo />
                <div className="content">
                    <NavVentas />
                    <div className="max-width" style={{ padding: "50px 20px", textAlign: 'center' }}>
                        <Spin size="large" />
                        <Title level={4} style={{ marginTop: 20 }}>⏳ Cargando reportes de ventas...</Title>
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
                        {/* Título y filtros */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "30px", flexWrap: 'wrap', gap: '15px' }}>
                            <Title level={1} style={{ margin: 0, color: COLORS.dark }}>
                                📊 Panel de Reportes de Ventas
                            </Title>
                            <Space>
                                <RangePicker 
                                    value={dateRange}
                                    onChange={handleDateRangeChange}
                                    format="DD/MM/YYYY"
                                    placeholder={['Fecha inicio', 'Fecha fin']}
                                />
                                <Button 
                                    icon={<ReloadOutlined />} 
                                    onClick={handleResetFilters}
                                >
                                    Limpiar Filtros
                                </Button>
                            </Space>
                        </div>

                        {/* Manejo de Errores */}
                        {error && (
                            <div style={{ textAlign: "center", padding: "20px", backgroundColor: "#fff2f0", border: "1px solid #ffccc7", borderRadius: "6px", marginBottom: "30px" }}>
                                <Title level={4} style={{ color: COLORS.danger }}>❌ Error de Conexión</Title>
                                <p>No se pudo cargar la data: {error}</p>
                                <p>Verifica la conexión a la API.</p>
                            </div>
                        )}

                        {/* Sección de Estadísticas Clave */}
                        <Row gutter={[24, 24]} style={{ marginBottom: "40px" }}>
                            <Col xs={24} sm={12} md={12} lg={6}>
                                <Card variant="borderless" hoverable style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', borderLeft: `5px solid ${COLORS.primary}` }}>
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
                                <Card variant="borderless" hoverable style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', borderLeft: `5px solid ${COLORS.info}` }}>
                                    <Statistic
                                        title={<span style={{ color: COLORS.dark, fontWeight: '500' }}>Total Pedidos</span>}
                                        value={estadisticas.totalPedidos || 0}
                                        prefix={<ShoppingCartOutlined style={{ color: COLORS.info, fontSize: '24px' }} />}
                                        valueStyle={{ color: COLORS.info, fontWeight: 'bold' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={12} lg={6}>
                                <Card variant="borderless" hoverable style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', borderLeft: `5px solid ${COLORS.secondary}` }}>
                                    <Statistic
                                        title={<span style={{ color: COLORS.dark, fontWeight: '500' }}>Clientes Activos</span>}
                                        value={estadisticas.clientesActivos || 0}
                                        prefix={<UserOutlined style={{ color: COLORS.secondary, fontSize: '24px' }} />}
                                        valueStyle={{ color: COLORS.secondary, fontWeight: 'bold' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={12} lg={6}>
                                <Card variant="borderless" hoverable style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', borderLeft: `5px solid ${(estadisticas.crecimiento || 0) >= 0 ? COLORS.success : COLORS.danger}` }}>
                                    <Statistic
                                        title={<span style={{ color: COLORS.dark, fontWeight: '500' }}>Crecimiento</span>}
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

                        {/* Sección de Resumen de Reportes */}
                        <Row gutter={[24, 24]} style={{ marginBottom: "40px" }}>
                            <Col xs={24} sm={12} md={6} lg={6}>
                                <Card style={{ textAlign: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
                                    <FileTextOutlined style={{ fontSize: '36px', color: COLORS.primary, marginBottom: '10px' }} />
                                    <Title level={4} style={{ margin: '10px 0 5px 0' }}>{cotizaciones.resumen?.total || 0}</Title>
                                    <p style={{ margin: 0, color: COLORS.secondary }}>Cotizaciones Registradas</p>
                                    <div style={{ marginTop: '10px', fontSize: '12px' }}>
                                        <Tag color="green">Enviadas: {cotizaciones.resumen?.enviadas || 0}</Tag>
                                        <Tag color="red">No enviadas: {cotizaciones.resumen?.noEnviadas || 0}</Tag>
                                    </div>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6} lg={6}>
                                <Card style={{ textAlign: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
                                    <ShoppingCartOutlined style={{ fontSize: '36px', color: COLORS.warning, marginBottom: '10px' }} />
                                    <Title level={4} style={{ margin: '10px 0 5px 0' }}>{pedidosEstados.resumen?.agendados || 0}</Title>
                                    <p style={{ margin: 0, color: COLORS.secondary }}>Pedidos Agendados</p>
                                    <div style={{ marginTop: '10px', fontSize: '12px' }}>
                                        <Tag color="orange">Total: {pedidosEstados.resumen?.total || 0}</Tag>
                                    </div>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6} lg={6}>
                                <Card style={{ textAlign: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
                                    <UserOutlined style={{ fontSize: '36px', color: COLORS.success, marginBottom: '10px' }} />
                                    <Title level={4} style={{ margin: '10px 0 5px 0' }}>{prospectos.resumen?.convertidos || 0}</Title>
                                    <p style={{ margin: 0, color: COLORS.secondary }}>Prospectos Convertidos</p>
                                    <div style={{ marginTop: '10px', fontSize: '12px' }}>
                                        <Tag color="blue">Tasa: {prospectos.resumen?.tasaConversion || 0}%</Tag>
                                    </div>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6} lg={6}>
                                <Card style={{ textAlign: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
                                    <FileTextOutlined style={{ fontSize: '36px', color: COLORS.info, marginBottom: '10px' }} />
                                    <Title level={4} style={{ margin: '10px 0 5px 0' }}>{remisiones.resumen?.total || 0}</Title>
                                    <p style={{ margin: 0, color: COLORS.secondary }}>Remisiones Generadas</p>
                                    <div style={{ marginTop: '10px', fontSize: '12px' }}>
                                        <Tag color="cyan">{currencyFormatter(remisiones.resumen?.montoTotal || 0)}</Tag>
                                    </div>
                                </Card>
                            </Col>
                        </Row>

                        <Divider orientation="left">
                            <Title level={2} style={{ margin: 0, color: COLORS.dark }}>
                                <TableOutlined style={{ marginRight: 10, color: COLORS.primary }} />
                                Top Clientes y Productos
                            </Title>
                        </Divider>

                        {/* Sección de Tablas: Top Clientes y Top Productos */}
                        <Row gutter={[24, 24]} style={{ marginTop: "20px", marginBottom: "40px" }}>
                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark, margin: 0 }}>🏆 Top 5 Clientes con Más Compras</Title>} 
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
                                >
                                    <Table
                                        dataSource={topClientes || []}
                                        rowKey={(record, index) => record._id || index}
                                        columns={clientesColumns}
                                        pagination={false}
                                        size="middle"
                                        locale={{ emptyText: <Empty description="No hay datos de clientes" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark, margin: 0 }}>🛍️ Top 5 Productos Más Vendidos</Title>} 
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
                                >
                                    <Table
                                        dataSource={topProductos || []}
                                        rowKey={(record, index) => record.nombre || index}
                                        columns={productosColumns}
                                        pagination={false}
                                        size="middle"
                                        locale={{ emptyText: <Empty description="No hay datos de productos" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Divider orientation="left">
                            <Title level={2} style={{ margin: 0, color: COLORS.dark }}>
                                <LineChartOutlined style={{ marginRight: 10, color: COLORS.primary }} />
                                Tendencias y Distribución
                            </Title>
                        </Divider>

                        {/* Sección de Gráficos: Estado de Pedidos y Ventas Mensuales */}
                        <Row gutter={[24, 24]} style={{ marginTop: "20px", marginBottom: "40px" }}>
                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark, margin: 0 }}>📊 Distribución de Pedidos por Estado</Title>} 
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
                                >
                                    {estadosChartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={320}>
                                            <PieChart>
                                                <Pie
                                                    data={estadosChartData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={110}
                                                    innerRadius={60}
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
                                    ) : (
                                        <Empty description="No hay datos de estados de pedidos" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                    )}
                                </Card>
                            </Col>

                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark, margin: 0 }}>📈 Ventas Mensuales (Últimos 12 Meses)</Title>} 
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
                                >
                                    {ventasMensualesData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={320}>
                                            <BarChart data={ventasMensualesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis 
                                                    dataKey="mes" 
                                                    stroke={COLORS.dark}
                                                    style={{ fontSize: '12px' }}
                                                />
                                                <YAxis 
                                                    yAxisId="left" 
                                                    orientation="left" 
                                                    stroke={COLORS.success}
                                                    style={{ fontSize: '12px' }}
                                                />
                                                <YAxis 
                                                    yAxisId="right" 
                                                    orientation="right" 
                                                    stroke={COLORS.primary}
                                                    style={{ fontSize: '12px' }}
                                                    tickFormatter={(value) => `S/. ${(value / 1000).toFixed(0)}k`}
                                                />
                                                <Tooltip
                                                    formatter={(value, name) => {
                                                        if (name === 'Cantidad') {
                                                            return [`${numberFormatter(value)} ventas`, 'Cantidad de Ventas'];
                                                        } else if (name === 'Ingresos') {
                                                            return [currencyFormatter(value), 'Ingresos Totales'];
                                                        }
                                                        return [value, name];
                                                    }}
                                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                                                />
                                                <Legend />
                                                <Bar 
                                                    yAxisId="left" 
                                                    dataKey="ventas" 
                                                    fill={COLORS.success} 
                                                    name="Cantidad" 
                                                    radius={[8, 8, 0, 0]}
                                                    maxBarSize={60}
                                                />
                                                <Bar 
                                                    yAxisId="right" 
                                                    dataKey="ingresos" 
                                                    fill={COLORS.primary} 
                                                    name="Ingresos" 
                                                    radius={[8, 8, 0, 0]}
                                                    maxBarSize={60}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <Empty description="No hay datos de ventas mensuales" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                    )}
                                </Card>
                            </Col>
                        </Row>

                        {/* Gráficos adicionales de tendencias */}
                        <Row gutter={[24, 24]} style={{ marginBottom: "40px" }}>
                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark, margin: 0 }}>📋 Cotizaciones por Mes</Title>} 
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
                                >
                                    {cotizaciones.porMes && cotizaciones.porMes.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <LineChart data={cotizaciones.porMes} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="mes" style={{ fontSize: '12px' }} />
                                                <YAxis style={{ fontSize: '12px' }} />
                                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                <Legend />
                                                <Line type="monotone" dataKey="total" stroke={COLORS.primary} strokeWidth={2} name="Total" dot={{ r: 4 }} />
                                                <Line type="monotone" dataKey="enviadas" stroke={COLORS.success} strokeWidth={2} name="Enviadas" dot={{ r: 4 }} />
                                                <Line type="monotone" dataKey="noEnviadas" stroke={COLORS.danger} strokeWidth={2} name="No Enviadas" dot={{ r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <Empty description="No hay datos de cotizaciones" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                    )}
                                </Card>
                            </Col>

                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Card 
                                    title={<Title level={4} style={{ color: COLORS.dark, margin: 0 }}>💰 Remisiones por Mes</Title>} 
                                    variant="bordered"
                                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
                                >
                                    {remisiones.porMes && remisiones.porMes.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <LineChart data={remisiones.porMes} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="mes" style={{ fontSize: '12px' }} />
                                                <YAxis yAxisId="left" style={{ fontSize: '12px' }} />
                                                <YAxis yAxisId="right" orientation="right" style={{ fontSize: '12px' }} tickFormatter={(value) => `S/. ${(value / 1000).toFixed(0)}k`} />
                                                <Tooltip 
                                                    formatter={(value, name) => {
                                                        if (name === 'Monto') return [currencyFormatter(value), 'Monto Total'];
                                                        return [value, name];
                                                    }}
                                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                                                />
                                                <Legend />
                                                <Line yAxisId="left" type="monotone" dataKey="cantidad" stroke={COLORS.info} strokeWidth={2} name="Cantidad" dot={{ r: 4 }} />
                                                <Line yAxisId="right" type="monotone" dataKey="monto" stroke={COLORS.success} strokeWidth={2} name="Monto" dot={{ r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <Empty description="No hay datos de remisiones" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                    )}
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </div>
            </div>
            
            {/* Estilos personalizados */}
            <style>{`
                .ant-card-hoverable:hover {
                    transform: translateY(-2px);
                    transition: transform 0.3s, box-shadow 0.3s;
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
                }
                .ant-table-thead > tr > th {
                    background-color: #fafafa !important;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
};

export default ReportessVentas;