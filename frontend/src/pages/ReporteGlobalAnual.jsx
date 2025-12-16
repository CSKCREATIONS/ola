import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Spin, Empty } from 'antd';
import api from '../api/axiosConfig';
import Fijo from '../components/Fijo';
import NavCompras from '../components/NavCompras';

const { Title } = Typography;

export default function ReporteGlobalAnual() {
  const [loading, setLoading] = useState(true);
  const [yearsData, setYearsData] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [comprasPeriodoRes, ordenesRes] = await Promise.all([
          api.get('/api/reportes/compras/por-periodo'),
          api.get('/api/ordenes-compra')
        ]);

        const comprasPeriodo = comprasPeriodoRes.data?.data || comprasPeriodoRes.data || [];
        const ordenesList = ordenesRes.data?.data || ordenesRes.data || [];

        // Aggregate compras by year
        const comprasByYear = {};
        for (const item of (comprasPeriodo || [])) {
          const id = item._id || {};
          const year = id.año || id.year || (new Date()).getFullYear();
          comprasByYear[year] = comprasByYear[year] || { comprasCount: 0, comprasTotal: 0 };
          comprasByYear[year].comprasCount += (item.totalCompras || 0);
          comprasByYear[year].comprasTotal += (item.totalGasto || item.totalIngresos || 0);
        }

        // Aggregate orders by year
        const ordenesByYear = {};
        for (const o of (ordenesList || [])) {
          const d = o.fechaOrden ? new Date(o.fechaOrden) : new Date(o.createdAt || Date.now());
          const year = d.getFullYear();
          ordenesByYear[year] = ordenesByYear[year] || { ordenesCount: 0, ordenesTotal: 0 };
          ordenesByYear[year].ordenesCount += 1;
          ordenesByYear[year].ordenesTotal += (o.total || 0);
        }

        // Merge years
        const years = Array.from(new Set([ ...Object.keys(comprasByYear), ...Object.keys(ordenesByYear) ]))
          .map(Number)
          .sort((a,b) => b - a);

        const merged = years.map(y => ({
          year: y,
          comprasCount: comprasByYear[y]?.comprasCount || 0,
          comprasTotal: comprasByYear[y]?.comprasTotal || 0,
          ordenesCount: ordenesByYear[y]?.ordenesCount || 0,
          ordenesTotal: ordenesByYear[y]?.ordenesTotal || 0
        }));

        setYearsData(merged);
      } catch (err) {
        console.error('Error fetching global annual report', err);
        setYearsData([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const cols = [
    { title: 'Año', dataIndex: 'year', key: 'year' },
    { title: 'Compras (count)', dataIndex: 'comprasCount', key: 'comprasCount' },
    { title: 'Compras (monto)', dataIndex: 'comprasTotal', key: 'comprasTotal', render: v => `$${Number(v||0).toLocaleString()}` },
    { title: 'Órdenes (count)', dataIndex: 'ordenesCount', key: 'ordenesCount' },
    { title: 'Órdenes (monto)', dataIndex: 'ordenesTotal', key: 'ordenesTotal', render: v => `$${Number(v||0).toLocaleString()}` },
  ];

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavCompras />
        <div className="max-width" style={{ padding: 24 }}>
          <Title level={2}>Reporte Global Anual</Title>
          <p>Este reporte muestra agregados por año; los totales se "reinician" por año (cada año comienza un nuevo acumulado).</p>

          {(() => {
            if (loading) {
              return <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>;
            }
            if (yearsData && yearsData.length > 0) {
              return (
                <Card variant="bordered">
                  <Table dataSource={yearsData} columns={cols} rowKey={(r) => r.year} pagination={false} />
                </Card>
              );
            }
            return <Empty description="No hay datos anuales" />;
          })()}
        </div>
      </div>
    </div>
  );
}
