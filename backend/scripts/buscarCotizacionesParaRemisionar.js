// Script para crear una remisión de prueba desde una cotización
const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Cotizacion = require('../models/cotizaciones');
const Cliente = require('../models/Cliente');
const User = require('../models/User');
const Products = require('../models/Products');

async function buscarCotizacionesParaRemisionar() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pangeaDB');
    console.log('✅ Conectado a MongoDB');

    // Buscar cotizaciones que NO estén remisionadas
    console.log('\n🔍 Buscando cotizaciones disponibles para remisionar...');
    const cotizacionesDisponibles = await Cotizacion.find({ 
      estado: { $ne: 'remisionado' }
    })
    .populate('cliente.referencia', 'nombre correo telefono ciudad')
    .sort({ createdAt: -1 })
    .limit(5);

    if (cotizacionesDisponibles.length > 0) {
      console.log(`✅ Se encontraron ${cotizacionesDisponibles.length} cotizaciones disponibles para remisionar:`);
      
      cotizacionesDisponibles.forEach((cotizacion, index) => {
        console.log(`\n${index + 1}. Cotización: ${cotizacion.codigo}`);
        console.log(`   - Estado: ${cotizacion.estado}`);
        console.log(`   - Cliente: ${cotizacion.cliente?.nombre || cotizacion.cliente?.referencia?.nombre}`);
        console.log(`   - Productos: ${cotizacion.productos?.length || 0}`);
        console.log(`   - Total: S/. ${cotizacion.total?.toLocaleString('es-ES') || 'N/A'}`);
        console.log(`   - Fecha: ${cotizacion.fecha ? new Date(cotizacion.fecha).toLocaleDateString('es-ES') : 'N/A'}`);
      });

      // Mostrar la primera cotización como ejemplo
      const ejemploCotizacion = cotizacionesDisponibles[0];
      console.log(`\n📋 Ejemplo de cotización lista para remisionar:`);
      console.log(`   - ID: ${ejemploCotizacion._id}`);
      console.log(`   - Código: ${ejemploCotizacion.codigo}`);
      console.log(`   - Estado actual: ${ejemploCotizacion.estado}`);
      
      if (ejemploCotizacion.productos && ejemploCotizacion.productos.length > 0) {
        console.log(`   - Productos:`);
        ejemploCotizacion.productos.forEach((prod, idx) => {
          console.log(`     ${idx + 1}. ${prod.producto?.name || prod.nombre} - Cant: ${prod.cantidad} - Precio: ${prod.valorUnitario || prod.precioUnitario}`);
        });
      }
      
    } else {
      console.log('⚠️  No se encontraron cotizaciones disponibles para remisionar');
    }

    // Estadísticas generales
    console.log('\n📊 Estadísticas de cotizaciones:');
    const totalCotizaciones = await Cotizacion.countDocuments();
    const cotizacionesRemisionadas = await Cotizacion.countDocuments({ estado: 'remisionado' });
    const cotizacionesAprobadas = await Cotizacion.countDocuments({ estado: 'aprobada' });
    
    console.log(`   - Total de cotizaciones: ${totalCotizaciones}`);
    console.log(`   - Cotizaciones remisionadas: ${cotizacionesRemisionadas}`);
    console.log(`   - Cotizaciones aprobadas: ${cotizacionesAprobadas}`);
    console.log(`   - Cotizaciones disponibles para remisionar: ${cotizacionesDisponibles.length}`);

    console.log('\n✅ Búsqueda completada');

  } catch (error) {
    console.error('❌ Error en la búsqueda:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar la búsqueda
buscarCotizacionesParaRemisionar();