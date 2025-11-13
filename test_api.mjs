// ESM test script using top-level await to verify the pedidos API
// Run with: node test_api.mjs
import fetch from 'node-fetch';

console.log('🔍 Probando conexión a la API (ESM, top-level await)...');

try {
  const response = await fetch('http://localhost:5000/api/pedidos?populate=true');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Respuesta de la API recibida');
  console.log('📊 Total de pedidos:', Array.isArray(data) ? data.length : (data?.length || 0));

  const agendados = (Array.isArray(data) ? data : []).filter(p => p.estado === 'agendado');
  console.log('📅 Pedidos agendados:', agendados.length);

  if (agendados.length > 0) {
    console.log('📋 Primer pedido agendado:');
    console.log('  - ID:', agendados[0]._id);
    console.log('  - Número:', agendados[0].numeroPedido || agendados[0].numeroOrden || 'N/A');
    console.log('  - Estado:', agendados[0].estado);
    console.log('  - Cliente:', agendados[0].cliente || agendados[0].cliente?.nombre || 'N/A');
    console.log('  - Productos:', agendados[0].productos?.length || 0);
  }
} catch (error) {
  console.error('❌ Error al probar API:', error?.message || error);
}
