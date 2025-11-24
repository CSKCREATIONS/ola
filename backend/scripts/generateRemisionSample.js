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

    const sampleRemision = {
      numeroRemision: 'REM-00026',
      fechaRemision: new Date().toISOString(),
      fechaEntrega: new Date().toISOString(),
      cliente: { nombre: 'Cliente Remisión', direccion: 'Calle Test 123', ciudad: 'Cali', telefono: '3005550000', correo: 'remision@cliente.com' },
      descripcion: 'Remisión de ejemplo generada por script',
      productos: [
        { product: { name: 'Producto R1' }, cantidad: 2, precioUnitario: 120.5 },
        { product: { name: 'Producto R2' }, cantidad: 1, precioUnitario: 50 }
      ]
    };

    console.log('Generando PDF de remisión de ejemplo...');
    const remPdf = await pdfService.generarPDFRemision(sampleRemision);
    const remPath = path.join(outDir, remPdf.filename);
    await writeFile(remPath, remPdf.buffer);
    console.log('✅ Guardado:', remPath);

    process.exit(0);
  } catch (err) {
    console.error('Error generando remisión:', err);
    process.exit(1);
  }
}

main();
