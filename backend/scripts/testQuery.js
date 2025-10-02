const mongoose = require('mongoose');
const Cotizacion = require('../models/cotizaciones');
const Product = require('../models/Products');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
const dbConfig = require('../config/db');

async function testCotizacionQuery() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(dbConfig.url);
    console.log('✅ Connected to database');

    console.log('📋 Testing simple cotizacion query...');
    
    // Test 1: Simple find without populate
    const cotizacionesSimple = await Cotizacion.find().limit(5);
    console.log(`✅ Simple query successful: ${cotizacionesSimple.length} cotizaciones found`);

    console.log('📋 Testing populate query...');
    
    // Test 2: Query with populate and error handling
    try {
      const cotizacionesWithPopulate = await Cotizacion.find()
        .populate('cliente.referencia', 'nombre correo')
        .populate({
          path: 'productos.producto.id',
          model: 'Product',
          select: 'name price',
          options: { strictPopulate: false }
        })
        .limit(3);
      
      console.log(`✅ Populate query successful: ${cotizacionesWithPopulate.length} cotizaciones found`);
      
      // Check products in first cotization
      if (cotizacionesWithPopulate.length > 0) {
        const firstCot = cotizacionesWithPopulate[0];
        console.log(`📦 First cotization has ${firstCot.productos?.length || 0} products`);
        
        if (firstCot.productos && firstCot.productos.length > 0) {
          const firstProduct = firstCot.productos[0];
          console.log(`🛍️  First product:`, {
            id: firstProduct.producto?.id,
            name: firstProduct.producto?.name
          });
        }
      }
      
    } catch (populateError) {
      console.error('❌ Populate query failed:', populateError.message);
      
      // Fallback test
      console.log('🔄 Trying fallback query...');
      const cotizacionesFallback = await Cotizacion.find()
        .populate('cliente.referencia', 'nombre correo')
        .limit(3);
      
      console.log(`✅ Fallback query successful: ${cotizacionesFallback.length} cotizaciones found`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testCotizacionQuery();