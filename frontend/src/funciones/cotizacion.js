 // Generar PDF
    async function generarPDF() {
      const { jsPDF } = window.jspdf;

      // Obtener valores del formulario
      const fecha = document.getElementById('fecha').value;
      const vendedor = document.getElementById('vendedor').value;
      const cliente = document.getElementById('cliente').value;
      const observaciones = document.getElementById('observaciones').value;
      const totalGeneral = document.getElementById('totalGeneral').textContent;

      // Dirección fija (se llena automáticamente)
      const direccion = "Calle 123 #45-67, Bogotá,colombia"; // Cambia esto por tu dirección fija si es necesario

      // Crear documento PDF
      const doc = new jsPDF();

      // Encabezado
      doc.setFontSize(20);
      doc.text("COTIZACIÓN", 105, 20, { align: "center" });

      doc.setFontSize(12);
      doc.text(`FECHA: ${fecha}`, 20, 35);
      doc.text(`VENDEDOR: ${vendedor}`, 20, 45);
      doc.text(`DIRECCIÓN: ${direccion}`, 20, 65);
      doc.text(`CLIENTE: ${cliente}`, 20, 55);

      // Tabla de productos
      const productos = [];
      document.querySelectorAll('#tablaProductos tbody tr').forEach(fila => {
        const producto = fila.querySelector('input[name="producto[]"]').value;
        const cantidad = fila.querySelector('.cantidad').value;
        const precio = fila.querySelector('.precio').value;
        const total = fila.querySelector('.total').value;

        productos.push([producto, cantidad, `$${precio}`, `$${total}`]);
      });

      // Insertar tabla en el PDF

      doc.autoTable({
        startY: 75, // 👈 bajé la tabla para que no se choque con la dirección
        head: [['PRODUCTO', 'CANTIDAD', 'PRECIO', 'SUBTOTAL']],
        body: productos,
        theme: 'grid',
        headStyles: {
          fillColor: [200, 200, 200],
          textColor: [0, 0, 0]
        }
      });

      // Obtener posición Y final de la tabla para continuar el contenido
      const finalY = doc.lastAutoTable.finalY + 10;

      // Línea divisoria
      doc.setDrawColor(0);
      doc.line(20, finalY, 190, finalY);

      // Observaciones
      doc.setFontSize(12);
      doc.text("OBSERVACIONES:", 20, finalY + 10);
      doc.text(observaciones, 20, finalY + 20, { maxWidth: 170 });

      // Total general cantidad
      doc.text(`Total: $${totalGeneral}`, 20, finalY + 40);

      // Texto adicional (debajo del total)
      doc.text("Cotizacion valida por 30 dias", 20, finalY + 60, { maxWidth: 170 });

      // Guardar PDF con nombre dinámico
      doc.save(`Cotización_${cliente}_${fecha}.pdf`);

    }