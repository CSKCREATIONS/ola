// Script de prueba para verificar la API de pedidos
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🔍 Probando conexión a la API...');
    
    const response = await fetch('http://localhost:5000/api/pedidos?populate=true');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Respuesta de la API recibida');
    console.log('📊 Total de pedidos:', data.length);
    
    const agendados = data.filter(p => p.estado === 'agendado');
    console.log('📅 Pedidos agendados:', agendados.length);
    
    if (agendados.length > 0) {
      console.log('📋 Primer pedido agendado:');
      console.log('  - ID:', agendados[0]._id);
      console.log('  - Número:', agendados[0].numeroPedido);
      console.log('  - Estado:', agendados[0].estado);
      console.log('  - Cliente:', agendados[0].cliente);
      console.log('  - Productos:', agendados[0].productos?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Error al probar API:', error.message);
  }
}

testAPI();