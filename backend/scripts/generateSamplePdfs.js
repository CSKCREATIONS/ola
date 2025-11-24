const fs = require('fs');
const path = require('path');
const PDFService = require('../services/pdfService');

async function ensureDir(dir) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dir, { recursive: true }, (err) => (err ? reject(err) : resolve()));
  });
}

async function writeFile(filePath, buffer) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, buffer, (err) => (err ? reject(err) : resolve()));
  });
}

async function main() {
  try {
    const outDir = path.resolve(__dirname, '..', 'samples');
    await ensureDir(outDir);

    const pdfService = new PDFService();

    // Sample cotizacion object (minimal)
    const sampleCot = {
      codigo: 'COT-TEST',
      fecha: new Date().toISOString(),
      fechaString: new Date().toISOString().slice(0,10),
      cliente: { nombre: 'Cliente Demo', direccion: 'Calle Falsa 123', ciudad: 'Bogotá', telefono: '3001234567', correo: 'demo@cliente.com' },
      responsable: { firstName: 'Admin', surname: 'Demo' },
      productos: [
        { producto: { name: 'Producto A', codigo: 'PA-001' }, cantidad: 2, valorUnitario: 150.5, subtotal: 301 },
        { producto: { name: 'Producto B' }, cantidad: 1, valorUnitario: 99.99, subtotal: 99.99 }
      ],
      condicionesPago: 'Pago contra entrega',
      descripcion: 'Cotización de ejemplo generada por script',
      validez: '15 días'
    };

    console.log('Generando PDF de cotización de ejemplo...');
    const cotPdf = await pdfService.generarPDFCotizacion(sampleCot);
    const cotPath = path.join(outDir, cotPdf.filename);
    await writeFile(cotPath, cotPdf.buffer);
    console.log('✅ Guardado:', cotPath);

    // Sample pedido object (minimal)
    const samplePedido = {
      numeroPedido: 'PED-TEST',
      fecha: new Date().toISOString(),
      cliente: { nombre: 'Cliente Pedido', direccion: 'Av. Central 456', ciudad: 'Medellín', telefono: '3107654321', correo: 'pedido@cliente.com' },
      descripcion: 'Pedido de ejemplo para PDF generator',
      productos: [
        { product: { name: 'Item X' }, cantidad: 3, precioUnitario: 45.5 },
        { product: { name: 'Item Y' }, cantidad: 5, precioUnitario: 12.75 }
      ]
    };

    console.log('Generando PDF de pedido de ejemplo...');
    const pedidoPdf = await pdfService.generarPDFPedido(samplePedido, 'agendado');
    const pedidoPath = path.join(outDir, pedidoPdf.filename);
    await writeFile(pedidoPath, pedidoPdf.buffer);
    console.log('✅ Guardado:', pedidoPath);

    console.log('\nMuestras generadas en:', outDir);
    process.exit(0);
  } catch (err) {
    console.error('Error generando muestras:', err);
    process.exit(1);
  }
}

main();
