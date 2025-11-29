import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Typography, Spin, Empty, Statistic } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { LineChartOutlined, TableOutlined } from '@ant-design/icons';
import api from '../api/axiosConfig';
import Fijo from '../components/Fijo';
import NavCompras from '../components/NavCompras';

const { Title } = Typography;

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

export default function ReporteOrdenesAprobadasVsCompras() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null); // {totalCompras, totalOrdenesAprobadas, countCompras, countOrdenes}
  const [monthly, setMonthly] = useState([]); // [{period, compras, ordenesAprobadas}]
  const [byProvider, setByProvider] = useState([]);
  const [recentCompras, setRecentCompras] = useState([]);
  const [recentOrdenes, setRecentOrdenes] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/reportes/ordenes-aprobadas-vs-compras');
        const payload = res.data?.data || res.data || {};

        setSummary(payload.summary || null);
        setMonthly(payload.monthly || []);
        setByProvider(payload.byProvider || []);
        setRecentCompras(payload.recentCompras || []);
        setRecentOrdenes(payload.recentOrdenes || []);
      } catch (err) {
        console.error('Error fetching ordenes-aprobadas-vs-compras report', err);
        setSummary(null);
        setMonthly([]);
        setByProvider([]);
        setRecentCompras([]);
        setRecentOrdenes([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const monthlyCols = [
    { title: 'Periodo', dataIndex: 'period', key: 'period' },
    { title: 'Total Compras', dataIndex: 'compras', key: 'compras', render: v => `$${Number(v||0).toLocaleString()}` },
    { title: 'Total Órdenes Aprobadas', dataIndex: 'ordenesAprobadas', key: 'ordenesAprobadas', render: v => `$${Number(v||0).toLocaleString()}` },
  ];

  const providerCols = [
    { title: 'Proveedor', dataIndex: 'proveedor', key: 'proveedor' },
    { title: 'Total Compras', dataIndex: 'compras', key: 'compras', render: v => `$${Number(v||0).toLocaleString()}` },
    { title: 'Total Órdenes Aprobadas', dataIndex: 'ordenesAprobadas', key: 'ordenesAprobadas', render: v => `$${Number(v||0).toLocaleString()}` },
  ];

  const compraCols = [
    { title: 'N° Compra', dataIndex: 'numero', key: 'numero' },
    { title: 'Proveedor', dataIndex: 'proveedor', key: 'proveedor' },
    { title: 'Total', dataIndex: 'total', key: 'total', render: v => `$${Number(v||0).toLocaleString()}` },
    { title: 'Fecha', dataIndex: 'fecha', key: 'fecha' },
  ];

  const ordenCols = [
    { title: 'N° Orden', dataIndex: 'numeroOrden', key: 'numeroOrden' },
    { title: 'Proveedor', dataIndex: 'proveedor', key: 'proveedor' },
    { title: 'Total', dataIndex: 'total', key: 'total', render: v => `$${Number(v||0).toLocaleString()}` },
    { title: 'Fecha', dataIndex: 'fechaOrden', key: 'fechaOrden' },
  ];

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavCompras />
        <div className="max-width" style={{ padding: 24 }}>
          <Title level={2}><LineChartOutlined style={{ marginRight: 8 }} /> Reporte: Órdenes Aprobadas vs Compras</Title>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
          ) : (
            <>
              <Row gutter={[16,16]} style={{ marginBottom: 16 }}>
                <Col xs={24} md={12}>
                  <Card title="Resumen" bordered>
                    {summary ? (
                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic title="Total Compras" value={`$${Number(summary.totalCompras||0).toLocaleString()}`} />
                        </Col>
                        <Col span={12}>
                          <Statistic title="Total Órdenes Aprobadas" value={`$${Number(summary.totalOrdenesAprobadas||0).toLocaleString()}`} />
                        </Col>
                      </Row>
                    ) : (
                      <Empty description="No hay datos de resumen" />
                    )}
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card title="Distribución mensual" bordered>
                    {monthly && monthly.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={monthly} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                          <Legend />
                          <Bar dataKey="compras" name="Compras" fill={COLORS[0]} />
                          <Bar dataKey="ordenesAprobadas" name="Órdenes Aprobadas" fill={COLORS[1]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Empty description="No hay datos mensuales" />
                    )}
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16,16]}>
                <Col xs={24} lg={12}>
                  <Card title={<span><TableOutlined style={{ marginRight: 8 }} />Por Proveedor</span>} bordered>
                    {byProvider && byProvider.length > 0 ? (
                      <Table dataSource={byProvider} columns={providerCols} rowKey={(r) => r.proveedor || r._id} pagination={{ pageSize: 6 }} />
                    ) : (
                      <Empty description="No hay datos por proveedor" />
                    )}
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card title="Últimas Compras vs Órdenes" bordered>
                    <Row gutter={16}>
                      <Col span={12}>
                        {recentCompras && recentCompras.length > 0 ? (
                          <Table dataSource={recentCompras} columns={compraCols} rowKey={(r) => r._id || r.numero} pagination={{ pageSize: 5 }} />
                        ) : (
                          <Empty description="No hay compras recientes" />
                        )}
                      </Col>
                      <Col span={12}>
                        {recentOrdenes && recentOrdenes.length > 0 ? (
                          <Table dataSource={recentOrdenes} columns={ordenCols} rowKey={(r) => r._id || r.numeroOrden} pagination={{ pageSize: 5 }} />
                        ) : (
                          <Empty description="No hay órdenes recientes" />
                        )}
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
