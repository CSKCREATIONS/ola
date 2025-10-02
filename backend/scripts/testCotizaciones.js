const axios = require('axios');

async function testCotizacionesEndpoint() {
  try {
    console.log('🧪 Testing cotizaciones endpoint...');
    
    // Test the main cotizaciones endpoint
    const response = await axios.get('http://localhost:5000/api/cotizaciones', {
      headers: {
        'Authorization': 'Bearer test-token' // You might need to adjust this
      }
    });
    
    console.log('✅ Endpoint responded successfully');
    console.log(`📊 Found ${response.data.length} cotizaciones`);
    
    // Check if any cotizations have products
    const cotizacionesWithProducts = response.data.filter(cot => 
      cot.productos && cot.productos.length > 0
    );
    
    console.log(`📦 Cotizaciones with products: ${cotizacionesWithProducts.length}`);
    
    if (cotizacionesWithProducts.length > 0) {
      const firstWithProducts = cotizacionesWithProducts[0];
      console.log('📋 Sample cotization with products:');
      console.log(`  - ID: ${firstWithProducts._id}`);
      console.log(`  - Código: ${firstWithProducts.codigo}`);
      console.log(`  - Products count: ${firstWithProducts.productos.length}`);
      
      if (firstWithProducts.productos[0]) {
        const firstProduct = firstWithProducts.productos[0];
        console.log(`  - First product: ${firstProduct.producto?.name || 'No name'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
    if (error.response) {
      console.error('📄 Response status:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    }
  }
}

testCotizacionesEndpoint();