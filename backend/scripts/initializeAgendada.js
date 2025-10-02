const mongoose = require('mongoose');
const Cotizacion = require('../models/cotizaciones');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
const dbConfig = require('../config/db');

async function initializeAgendadaField() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(dbConfig.url);
    console.log('✅ Connected to database');

    console.log('🔄 Updating existing cotizaciones with agendada field...');
    
    // Update all cotizaciones that don't have the agendada field
    const result = await Cotizacion.updateMany(
      { agendada: { $exists: false } },
      { 
        $set: { 
          agendada: false 
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} cotizaciones with agendada field`);

    // Show sample of updated documents
    const sampleCotizaciones = await Cotizacion.find().limit(3).select('codigo agendada');
    console.log('📋 Sample cotizaciones:');
    sampleCotizaciones.forEach(cot => {
      console.log(`  - ${cot.codigo}: agendada = ${cot.agendada}`);
    });

  } catch (error) {
    console.error('❌ Error initializing agendada field:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

initializeAgendadaField();