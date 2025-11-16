// services/remisionService.js
const Remision = require('../models/Remision');
const Pedido = require('../models/Pedido');
const Counter = require('../models/Counter');
const PDFService = require('./pdfService');

class RemisionService {
  constructor() {
    this.pdfService = new PDFService();
  }

  /**
   * Genera un número único de remisión usando Counter
   */
  async generarNumeroRemision() {
    const counter = await Counter.findByIdAndUpdate(
      'remision',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    return `REM-${String(counter.seq).padStart(5, '0')}`;
  }

  /**
   * Construye objeto remisión normalizado desde pedido
   * @param {Object} pedido - Pedido populado con cliente y productos
   * @param {String} numeroRemision - Número de remisión (opcional, se genera si no existe)
   * @param {Object} options - Opciones adicionales { observaciones, fechaEntrega, codigoCotizacion }
   * @returns {Object} - Objeto remisión normalizado
   */
  buildRemisionFromPedido(pedido, numeroRemision = null, options = {}) {
    const { observaciones, fechaEntrega, codigoCotizacion } = options;
    
    // Calcular cantidad total de items
    const cantidadItems = pedido.productos?.reduce((total, p) => 
      total + (Number(p.cantidad) || 0), 0) || 0;
    
    // Inferir codigoCotizacion si no se provee explícitamente
    let cotizacionCodigo = codigoCotizacion;
    if (!cotizacionCodigo && pedido.cotizacionReferenciada) {
      if (typeof pedido.cotizacionReferenciada === 'object' && pedido.cotizacionReferenciada.codigoCotizacion) {
        cotizacionCodigo = pedido.cotizacionReferenciada.codigoCotizacion;
      } else if (pedido.cotizacionCodigo) {
        cotizacionCodigo = pedido.cotizacionCodigo;
      }
    }
    
    return {
      numeroRemision: numeroRemision || pedido.numeroPedido || 'N/A',
      pedido: pedido.numeroPedido || 'N/A',
      codigoPedido: pedido.numeroPedido,
      cliente: pedido.cliente,
      nombreCliente: pedido.cliente?.nombre,
      correoCliente: pedido.cliente?.correo,
      telefonoCliente: pedido.cliente?.telefono,
      ciudadCliente: pedido.cliente?.ciudad,
      productos: pedido.productos || [],
      cantidadItems,
      observaciones: observaciones || '',
      fecha: new Date(),
      fechaRemision: new Date(),
      fechaEntrega: fechaEntrega || pedido.fechaEntrega || new Date(),
      codigoCotizacion: cotizacionCodigo || undefined,
      estado: 'emitida'
    };
  }

  /**
   * Construye objeto remisión normalizado desde cotización
   * @param {Object} cotizacion - Cotización populada con cliente y productos
   * @param {String} numeroRemision - Número de remisión (opcional, se genera si no existe)
   * @param {Object} options - Opciones adicionales { observaciones, fechaEntrega }
   * @returns {Object} - Objeto remisión normalizado
   */
  buildRemisionFromCotizacion(cotizacion, numeroRemision = null, options = {}) {
    const { observaciones, fechaEntrega } = options;
    
    const cantidadItems = cotizacion.productos?.reduce((total, p) => 
      total + (Number(p.cantidad) || 0), 0) || 0;
    
    return {
      numeroRemision: numeroRemision || cotizacion.codigo || 'N/A',
      codigoCotizacion: cotizacion.codigo,
      cliente: cotizacion.cliente,
      nombreCliente: cotizacion.cliente?.nombre || cotizacion.nombreCliente,
      correoCliente: cotizacion.cliente?.correo || cotizacion.correoCliente,
      telefonoCliente: cotizacion.cliente?.telefono || cotizacion.telefonoCliente,
      ciudadCliente: cotizacion.cliente?.ciudad || cotizacion.ciudadCliente,
      productos: cotizacion.productos || [],
      cantidadItems,
      observaciones: observaciones || '',
      fecha: new Date(),
      fechaRemision: new Date(),
      fechaEntrega: fechaEntrega || new Date(),
      estado: 'emitida'
    };
  }

  /**
   * Crea un documento Remision en la base de datos desde un pedido
   * @param {String} pedidoId - ID del pedido
   * @param {Object} options - Opciones adicionales
   * @returns {Object} - Remisión creada
   */
  async crearRemisionDesdePedido(pedidoId, options = {}) {
    const pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate('productos.product');
    
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    const numeroRemision = options.numeroRemision || await this.generarNumeroRemision();
    const remisionData = this.buildRemisionFromPedido(pedido, numeroRemision, options);
    
    const remision = new Remision({
      ...remisionData,
      pedido: pedido._id
    });

    await remision.save();
    
    // Actualizar estado del pedido si se especifica
    if (options.actualizarEstadoPedido) {
      await Pedido.findByIdAndUpdate(pedido._id, { 
        estado: options.nuevoEstadoPedido || 'entregado' 
      });
    }

    return remision;
  }

  /**
   * Genera HTML de remisión usando PDFService
   * @param {Object} remisionData - Datos de la remisión
   * @returns {String} - HTML de la remisión
   */
  generarHTMLRemision(remisionData) {
    return this.pdfService.generarHTMLRemision(remisionData);
  }

  /**
   * Genera PDF de remisión usando PDFService
   * @param {Object} remisionData - Datos de la remisión
   * @returns {Object} - { buffer, filename, contentType }
   */
  async generarPDFRemision(remisionData) {
    return await this.pdfService.generarPDFRemision(remisionData);
  }

  /**
   * Calcula el total de una remisión
   * @param {Object} remision - Objeto remisión con productos
   * @returns {Number} - Total calculado
   */
  calcularTotal(remision) {
    if (remision.total) return Number(remision.total) || 0;
    
    if (!Array.isArray(remision.productos)) return 0;
    
    return remision.productos.reduce((sum, prod) => {
      const cantidad = Number.parseFloat(prod.cantidad) || 0;
      const valorUnitario = Number.parseFloat(prod.precioUnitario || prod.valorUnitario) || 0;
      const descuento = Number.parseFloat(prod.descuento) || 0;
      return sum + (cantidad * valorUnitario * (1 - descuento / 100));
    }, 0);
  }
}

module.exports = RemisionService;
