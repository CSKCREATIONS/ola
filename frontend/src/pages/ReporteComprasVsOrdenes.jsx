import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Typography, Spin, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LineChartOutlined, TableOutlined } from '@ant-design/icons';
import api from '../api/axiosConfig';
import Fijo from '../components/Fijo';
import NavCompras from '../components/NavCompras';

const { Title } = Typography;

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

export default function ReporteComprasVsOrdenes() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]); // [{label, count, total}]
  const [monthly, setMonthly] = useState([]); // [{period, compras, ordenes}]
  const [recentCompras, setRecentCompras] = useState([]);
  const [recentOrdenes, setRecentOrdenes] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/reportes/compras-vs-ordenes');
        const payload = res.data?.data || res.data || {};

        setSummary(payload.summary || []);
        setMonthly(payload.monthly || []);
        setRecentCompras(payload.recentCompras || []);
        setRecentOrdenes(payload.recentOrdenes || []);
      } catch (err) {
        console.error('Error fetching compras-vs-ordenes report', err);
        setSummary([]);
        setMonthly([]);
        setRecentCompras([]);
        setRecentOrdenes([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const monthlyColumns = [
    { title: 'Periodo', dataIndex: 'period', key: 'period' },
    { title: 'Total Compras', dataIndex: 'compras', key: 'compras', render: v => `$${Number(v||0).toLocaleString()}` },
    { title: 'Total Órdenes', dataIndex: 'ordenes', key: 'ordenes', render: v => `$${Number(v||0).toLocaleString()}` },
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
          <Title level={2}><LineChartOutlined style={{ marginRight: 8 }} /> Reporte: Compras vs Órdenes</Title>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
          ) : (
            <>
              <Row gutter={[16,16]} style={{ marginBottom: 16 }}>
                <Col xs={24} md={12}>
                  <Card title="Resumen" bordered>
                    {summary && summary.length > 0 ? (
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-around' }}>
                        {summary.map((s, i) => (
                          <div key={s.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 700 }}>${Number(s.total||0).toLocaleString()}</div>
                            <div style={{ color: '#6b7280' }}>{s.label}</div>
                            <div style={{ fontSize: 12, marginTop: 6 }}>{s.count || 0} registros</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty description="No hay datos de resumen" />
                    )}
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card title="Distribución mensual (totales)" bordered>
                    {monthly && monthly.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={monthly} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                          <Legend />
                          <Bar dataKey="compras" name="Compras" fill={COLORS[0]} />
                          <Bar dataKey="ordenes" name="Órdenes" fill={COLORS[1]} />
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
                  <Card title={<span><TableOutlined style={{ marginRight: 8 }} />Últimas Compras</span>} bordered>
                    {recentCompras && recentCompras.length > 0 ? (
                      <Table dataSource={recentCompras} columns={compraCols} rowKey={(r) => r._id || r.numero} pagination={{ pageSize: 5 }} />
                    ) : (
                      <Empty description="No hay compras recientes" />
                    )}
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card title="Últimas Órdenes" bordered>
                    {recentOrdenes && recentOrdenes.length > 0 ? (
                      <Table dataSource={recentOrdenes} columns={ordenCols} rowKey={(r) => r._id || r.numeroOrden} pagination={{ pageSize: 5 }} />
                    ) : (
                      <Empty description="No hay órdenes recientes" />
                    )}
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
