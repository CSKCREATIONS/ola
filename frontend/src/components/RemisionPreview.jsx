import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './FormatoCotizacion.css';
import api from '../api/axiosConfig';

export default function RemisionPreview({ datos, onClose }) {
  // Obtener usuario logueado con fallback
  const usuarioStorage = JSON.parse(localStorage.getItem('user') || '{}');
  const usuario = {
    firstName: usuarioStorage.firstName || 'Equipo',
    surname: usuarioStorage.surname || 'Pangea',
    email: usuarioStorage.email || 'info@pangea.com',
    telefono: usuarioStorage.telefono || '000-000-000',
    ...usuarioStorage
  };
  // Empresa desde variables de entorno con fallback
  const COMPANY_NAME = process.env.REACT_APP_COMPANY_NAME || process.env.COMPANY_NAME || 'JLA GLOBAL COMPANY';
  const COMPANY_PHONE = process.env.REACT_APP_COMPANY_PHONE || process.env.COMPANY_PHONE || '(555) 123-4567';
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [clienteResolved, setClienteResolved] = useState(null);
  // Helper: obtain a crypto object in a cross-environment safe way without using
  // restricted global identifiers (avoids ESLint `no-restricted-globals` on `self`).
  const getCrypto = () => {
    if (typeof window !== 'undefined' && window.crypto) return window.crypto;
    if (typeof global !== 'undefined' && global.crypto) return global.crypto;
    try {
      const g = new Function('return this')();
      if (g && g.crypto) return g.crypto;
    } catch (e) {
      // ignore
    }
    return null;
  };
  // Helper: secure random alphanumeric string using Web Crypto when available
  const secureRandomString = (length) => {
    const cryptoObj = getCrypto();
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const pick = (max) => {
      if (cryptoObj && cryptoObj.getRandomValues) {
        const arr = new Uint32Array(1);
        cryptoObj.getRandomValues(arr);
        return Math.floor(arr[0] / (0xFFFFFFFF + 1) * max);
      }
      return Math.floor(Math.random() * max);
    };
    let out = '';
    for (let i = 0; i < length; i++) {
      out += alphabet.charAt(pick(alphabet.length));
    }
    return out;
  };

  // Agregar datos por defecto si faltan
  const datosConDefaults = {
    numeroRemision: datos?.numeroRemision || 'REM-000',
    codigoPedido: datos?.codigoPedido || 'PED-000',
    fechaRemision: datos?.fechaRemision || new Date().toISOString(),
    estado: datos?.estado || 'activa',
    total: datos?.total || 0,
    cliente: {
      nombre: datos?.cliente?.nombre || 'Cliente de prueba',
      correo: datos?.cliente?.correo || 'cliente@ejemplo.com',
      telefono: datos?.cliente?.telefono || '123456789',
      direccion: datos?.cliente?.direccion || 'Dirección de ejemplo',
      ciudad: datos?.cliente?.ciudad || 'Ciudad de ejemplo',
      ...datos?.cliente
    },
    productos: datos?.productos?.length ? datos.productos : [
      {
        nombre: 'Producto de ejemplo',
        cantidad: 1,
        precioUnitario: 100,
        total: 100,
        descripcion: 'Descripción de ejemplo'
      }
    ],
    ...datos
  };

  // Autocompletar información del correo para remisión
  const [correo, setCorreo] = useState(datosConDefaults?.cliente?.correo || '');
  const [asunto, setAsunto] = useState(`Remisión ${datosConDefaults?.numeroRemision || ''} - ${datosConDefaults?.cliente?.nombre || 'Cliente'}`);
  const [mensaje, setMensaje] = useState(
    `Estimado/a ${datosConDefaults?.cliente?.nombre || 'cliente'},

Esperamos se encuentre bien. Adjunto encontrará la remisión con número ${datosConDefaults?.numeroRemision || ''}.

Detalles de la remisión:
- Fecha: ${datosConDefaults?.fechaRemision ? new Date(datosConDefaults.fechaRemision).toLocaleDateString('es-ES') : 'N/A'}
- Total: S/. ${datosConDefaults?.total?.toLocaleString('es-ES') || '0'}
- Productos: ${datosConDefaults?.productos?.length || 0} artículos

Esta remisión confirma la entrega de los productos solicitados.

Saludos cordiales,
${usuario?.firstName || 'Equipo'} ${usuario?.surname || 'de ventas'}
${usuario?.email ? `\n${usuario.email}` : ''}
${usuario?.telefono ? `\nTel: ${usuario.telefono}` : ''}`
  );

  // Si la remisión trae solo el ObjectId en cliente o no contiene nombre, intentar obtener el cliente poblado
  React.useEffect(() => {
    let mounted = true;
    const fetchFromCotizacion = async () => {
      try {
        // Preferir obtener la información embebida del cliente desde la cotización
        const cotRef = datos?.cotizacionReferencia;
        let cotizacionId = null;

        if (!cotRef) {
          // si no hay referencia a cotización, no hacemos fetch
          return;
        }

        if (typeof cotRef === 'string') cotizacionId = cotRef;
        else if (cotRef && typeof cotRef === 'object' && (cotRef._id || cotRef.id)) cotizacionId = cotRef._id || cotRef.id;

        if (!cotizacionId) return;

        // Llamar al endpoint de cotizaciones para obtener la cotización completa
        const res = await api.get(`/api/cotizaciones/${cotizacionId}`);
        const cotResp = (res.data && (res.data.data || res.data)) || null;
        const clienteFromCot = cotResp && (cotResp.cliente || (cotResp.data && cotResp.data.cliente));
        if (mounted && clienteFromCot) {
          // clienteFromCot puede ser un object con campos embebidos
          setClienteResolved(clienteFromCot);
          return;
        }
      } catch (err) {
        console.warn('No se pudo poblar cliente desde la cotización para remisión:', err?.message || err);
      }
    };
    fetchFromCotizacion();
    return () => { mounted = false; };
  }, [datos]);

  // Función para abrir modal con datos actualizados
  const abrirModalEnvio = () => {
    // Calcular total dinámicamente si no existe
    const totalCalculado = datos?.productos?.reduce((total, producto) => {
      const subtotal = Number(producto.total) || Number(producto.precioUnitario * producto.cantidad) || 0;
      return total + subtotal;
    }, 0) || 0;

    const totalFinal = datos?.total || totalCalculado;

    // Actualizar datos autocompletados cada vez que se abre el modal
    setCorreo(datos?.cliente?.correo || '');
    setAsunto(`Remisión ${datos?.numeroRemision || ''} - ${datos?.cliente?.nombre || 'Cliente'} | ${process.env.REACT_APP_COMPANY_NAME || 'JLA Global Company'}`);
    setMensaje(
      `Estimado/a ${datos?.cliente?.nombre || 'cliente'},

Esperamos se encuentre muy bien. Adjunto encontrará la remisión de entrega con la siguiente información:

📦 DETALLES DE LA REMISIÓN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Número de remisión: ${datos?.numeroRemision || 'N/A'}
• Fecha de remisión: ${datos?.fechaRemision ? new Date(datos.fechaRemision).toLocaleDateString('es-ES') : 'N/A'}
• Fecha de entrega: ${datos?.fechaEntrega ? new Date(datos.fechaEntrega).toLocaleDateString('es-ES') : 'N/A'}
• Cliente: ${datos?.cliente?.nombre || 'N/A'}
• Correo: ${datos?.cliente?.correo || 'N/A'}
• Teléfono: ${datos?.cliente?.telefono || 'N/A'}
• Ciudad: ${datos?.cliente?.ciudad || 'N/A'}
• Estado: ${datos?.estado || 'Entregado'} ✅
• Total de productos entregados: ${datos?.productos?.length || 0} artículos
• TOTAL GENERAL: S/. ${totalFinal.toLocaleString('es-ES')}
• Ref. Pedido: ${datos?.codigoPedido || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Esta remisión confirma oficialmente la entrega exitosa de todos los productos solicitados según las especificaciones acordadas.

${datos?.observaciones ? `📝 OBSERVACIONES:
${datos.observaciones}

` : ''}¡Gracias por confiar en nosotros y esperamos que los productos entregados cumplan con sus expectativas!

Si tiene alguna pregunta o comentario sobre la entrega, no dude en contactarnos.

Saludos cordiales,

${usuario?.firstName || usuario?.nombre || 'Equipo de entrega'} ${usuario?.surname || ''}${usuario?.email ? `
📧 Correo: ${usuario.email}` : ''}${usuario?.telefono ? `
📞 Teléfono: ${usuario.telefono}` : ''}

${process.env.REACT_APP_COMPANY_NAME || 'JLA Global Company'}
🌐 Productos de calidad`
    );
    setShowEnviarModal(true);
  };

  // Función para enviar remisión por correo
  const enviarRemisionPorCorreo = async () => {
    try {
      const response = await api.post(`/api/remisiones/${datos._id}/enviar-correo`, {
        remisionId: datos._id,
        correoDestino: correo,
        asunto: asunto,
        mensaje: mensaje
      });

      if (response && response.status >= 200 && response.status < 300) {
        const Swal = (await import('sweetalert2')).default;
        Swal.fire({
          icon: 'success',
          title: 'Remisión enviada',
          text: 'La remisión ha sido enviada exitosamente por correo'
        });
        setShowEnviarModal(false);
      } else {
        throw new Error('Error al enviar remisión');
      }
    } catch (error) {
      console.error('Error:', error);
      const Swal = (await import('sweetalert2')).default;
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo enviar la remisión por correo'
      });
    }
  };

  // Generar número de remisión si no existe
  const numeroRemision = datosConDefaults.numeroRemision || `REM-${secureRandomString(6)}`;

  // Debug: Ver qué datos están llegando
  console.log('📦 Datos de remisión recibidos:', datos);
  console.log('👥 Datos del cliente:', datos?.cliente);
  console.log('📋 Datos de productos:', datos?.productos);
  console.log('🏢 Número de remisión:', datos?.numeroRemision);
  console.log('💰 Total:', datos?.total);
  console.log('📅 Fecha remisión:', datos?.fechaRemision);
  console.log('🔄 Estado:', datos?.estado);

  return (
    <div className="modal-cotizacion-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '0',
        maxWidth: '95vw',
        maxHeight: '95vh',
        width: '1000px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
      }}>
        {/* Header del modal */}
        <div style={{
          background: 'linear-gradient(135deg, #059669, #065f46)',
          color: 'white',
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <i className="fa-solid fa-truck" style={{ fontSize: '1.8rem' }}></i>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                Remisión {numeroRemision}
              </h2>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Botón de imprimir */}
            <button
              onClick={() => {
                const printContent = document.querySelector('.pdf-remision');
                const newWindow = window.open('', '_blank');
                newWindow.document.write(`
                  <html>
                    <head>
                      <title>Remisión - ${numeroRemision}</title>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #059669, #065f46); color: white; border-radius: 10px; }
                        .info-section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background: linear-gradient(135deg, #059669, #065f46); color: white; font-weight: bold; }
                        .total-row { background: #d1fae5; font-weight: bold; }
                        .status-badge { background: #059669; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; }
                      </style>
                    </head>
                    <body>
                      ${printContent.innerHTML}
                    </body>
                  </html>
                `);
                newWindow.document.close();
                newWindow.focus();
                newWindow.print();
                newWindow.close();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              <i className="fa-solid fa-print icon-gap" style={{ fontSize: '1.2rem' }} aria-hidden={true}></i>
            </button>

            {/* Botón de enviar por correo */}
            <button
              onClick={abrirModalEnvio}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              <i className="fa-solid fa-envelope" aria-hidden={true}></i>
              <span>Enviar</span>
            </button>

            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '1.2rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              <i className="fa-solid fa-times" aria-hidden={true}></i>
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '2rem',
          backgroundColor: '#f8f9fa'
        }}>

          {/* Contenido scrolleable */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '2rem',
            backgroundColor: '#f8f9fa'
          }}>
            {/* Contenido de la remisión */}
            <div
              className="pdf-remision"
              id="pdf-remision-block"
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#fff',
                padding: '2rem',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginTop: '1rem',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
              onCopy={e => e.preventDefault()}
            >
              <div className="header" style={{
                textAlign: 'center',
                color: 'white',
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #059669, #065f46)',
                borderRadius: '8px',
                fontSize: '1.8rem',
                fontWeight: 'bold'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                  <i className="fa-solid fa-truck" style={{ fontSize: '2rem' }} aria-hidden={true}></i>
                  <div>
                    <div>REMISIÓN</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '0.5rem' }}>
                      N° {numeroRemision}
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del cliente y empresa */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                marginBottom: '2rem'
              }}>
                <div>
                  <h3 style={{
                    borderBottom: '3px solid #059669',
                    paddingBottom: '0.5rem',
                    color: '#059669',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem'
                  }}>
                    Entregar a:
                  </h3>
                  <div style={{ lineHeight: '1.8' }}>
                    <p><strong>Pedido remisionado:</strong> {datosConDefaults.codigoPedido || datosConDefaults.pedidoReferencia || 'N/A'}</p>
                    <p><strong>Cliente:</strong> {clienteResolved?.nombre || datosConDefaults.cliente?.nombre || 'Cliente no especificado'}</p>
                    <p><strong>Dirección:</strong> {clienteResolved?.direccion || datosConDefaults.cliente?.direccion || 'Dirección no especificada'}</p>
                    <p><strong>Ciudad:</strong> {clienteResolved?.ciudad || datosConDefaults.cliente?.ciudad || 'Ciudad no especificada'}</p>
                    <p><strong>Teléfono:</strong> {clienteResolved?.telefono || datosConDefaults.cliente?.telefono || 'No especificado'}</p>
                  </div>
                </div>

                <div>
                  <h3 style={{
                    borderBottom: '3px solid #059669',
                    paddingBottom: '0.5rem',
                    color: '#059669',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem'
                  }}>
                    Remite:
                  </h3>
                  <div style={{ lineHeight: '1.8' }}>
                    <p><strong>Fecha:</strong> {new Date(datosConDefaults.fechaEntrega).toLocaleDateString('es-ES')}</p>
                    <p><strong>Empresa:</strong> {datosConDefaults.empresa?.nombre || COMPANY_NAME}</p>
                    <p><strong>Dirección:</strong> {datosConDefaults.empresa?.direccion || 'Cl. 21 # 5 - 52 C19, Chía, Cundinamarca'}</p>
                    <p><strong>Teléfono:</strong> {datosConDefaults.empresa?.telefono || COMPANY_PHONE}</p>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {datos.observacion && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{
                    borderBottom: '3px solid #059669',
                    paddingBottom: '0.5rem',
                    color: '#059669',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem'
                  }}>
                    Observaciones
                  </h3>
                  <div style={{
                    background: '#ecfdf5',
                    padding: '1rem',
                    borderRadius: '8px',
                    borderLeft: '4px solid #059669',
                    lineHeight: '1.6'
                  }}>
                    {datos.observacion}
                  </div>
                </div>
              )}

              {/* Tabla de productos */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  borderBottom: '3px solid #059669',
                  paddingBottom: '0.5rem',
                  color: '#059669',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  Productos Entregados
                </h3>
                <table className="tabla-cotizacion" style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: '1rem',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #059669, #065f46)', color: 'white' }}>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Cant.</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Producto</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Descripción</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Valor Unit.</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosConDefaults.productos && datosConDefaults.productos.length > 0 ? datosConDefaults.productos.map((p, idx) => (
                      <tr key={idx} style={{
                        borderBottom: '1px solid #eee',
                        backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white'
                      }}>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                          {p.cantidad || 0}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 'bold', color: '#333' }}>
                            {p.nombre || 'Producto sin nombre'}
                          </div>
                          {p.codigo && (
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                              Código: {p.codigo}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem', color: '#666' }}>
                          {p.descripcion || 'Sin descripción'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          S/. {(p.precioUnitario || 0).toLocaleString('es-ES')}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                          S/. {(p.total || (p.cantidad * p.precioUnitario) || 0).toLocaleString('es-ES')}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                          No hay productos disponibles
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{
                      background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                      borderTop: '2px solid #059669'
                    }}>
                      <td colSpan="4" style={{
                        padding: '1rem',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        color: '#059669'
                      }}>
                        TOTAL A ENTREGAR:
                      </td>
                      <td style={{
                        padding: '1rem',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        fontSize: '1.3rem',
                        color: '#059669'
                      }}>
                        S/. {datosConDefaults.total || (datosConDefaults.productos && datosConDefaults.productos.length > 0 ? datosConDefaults.productos
                          .reduce((acc, p) => {
                            const cantidad = Number.parseFloat(p.cantidad) || 0;
                            const precio = Number.parseFloat(p.precioUnitario || p.valorUnitario || p.product?.price) || 0;
                            return acc + (cantidad * precio);
                          }, 0)
                          .toLocaleString('es-ES') : '0')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Información adicional de la remisión */}
              {(datosConDefaults.observaciones || datosConDefaults.fechaEntrega) && (
                <div style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
                  borderRadius: '8px',
                  border: '1px solid #10b981'
                }}>
                  <h4 style={{ color: '#059669', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    Información Adicional
                  </h4>
                  <div style={{ lineHeight: '1.6' }}>
                    {datosConDefaults.observaciones && (
                      <div>
                        <strong>Observaciones:</strong>
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '1rem',
                          background: 'white',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {datosConDefaults.observaciones}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sección de firmas */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '3rem',
                marginTop: '3rem',
                paddingTop: '2rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '2px solid #374151', marginTop: '3rem', paddingTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0, fontWeight: 'bold' }}>ENTREGADO POR:</p>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '2px solid #374151', marginTop: '3rem', paddingTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0, fontWeight: 'bold' }}>RECIBIDO POR:</p>
                  </div>
                </div>
              </div>

              {/* Términos y condiciones */}
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                borderRadius: '8px',
                borderTop: '3px solid #059669'
              }}>
                <h5 style={{ fontSize: '1rem', color: '#059669', marginBottom: '0.8rem', fontWeight: 'bold' }}>TÉRMINOS Y CONDICIONES:</h5>
                <ul style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0, paddingLeft: '1.5rem', lineHeight: '1.5' }}>
                  <li>El cliente debe verificar la mercancía al momento de la entrega</li>
                  <li>Los reclamos por daños o faltantes deben realizarse en el momento de la entrega</li>
                  <li>Una vez firmada la remisión, se da por aceptada la mercancía en perfectas condiciones</li>
                </ul>
              </div>

              {/* Footer */}
              <div style={{
                marginTop: '3rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                borderRadius: '8px',
                textAlign: 'center',
                borderTop: '3px solid #059669'
              }}>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#059669',
                  marginBottom: '0.5rem'
                }}>
                  JLA GLOBAL COMPANY
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Gracias por su preferencia • Remisión de entrega
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal para enviar por correo */}
        {showEnviarModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '10px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#059669' }}>
                <i className="fa-solid fa-envelope icon-gap" style={{}} aria-hidden={true}></i>
                <span>Enviar Remisión por Correo</span>
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="correo-remision-preview" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Correo del destinatario:
                </label>
                <input
                  id="correo-remision-preview"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="asunto-remision-preview" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Asunto:
                </label>
                <input
                  id="asunto-remision-preview"
                  type="text"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Asunto del correo"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="mensaje-remision-preview" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Mensaje:
                </label>
                <textarea
                  id="mensaje-remision-preview"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Escriba un mensaje personalizado..."
                  rows="8"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowEnviarModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={enviarRemisionPorCorreo}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#059669',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  <i className="fa-solid fa-envelope icon-gap" style={{}} aria-hidden={true}></i>
                  <span>Enviar Remisión</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

RemisionPreview.propTypes = {
  datos: PropTypes.shape({
    _id: PropTypes.string,
    numeroRemision: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    codigoPedido: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fechaRemision: PropTypes.string,
    fechaEntrega: PropTypes.string,
    estado: PropTypes.string,
    total: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    cliente: PropTypes.shape({
      nombre: PropTypes.string,
      correo: PropTypes.string,
      telefono: PropTypes.string,
      direccion: PropTypes.string,
      ciudad: PropTypes.string,
      documentoIdentidad: PropTypes.string
    }),
    empresa: PropTypes.shape({
      nombre: PropTypes.string,
      direccion: PropTypes.string,
      telefono: PropTypes.string
    }),
    productos: PropTypes.arrayOf(PropTypes.shape({
      nombre: PropTypes.string,
      codigo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      descripcion: PropTypes.string,
      cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      precioUnitario: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      total: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })),
    observacion: PropTypes.string,
    observaciones: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func
};

RemisionPreview.defaultProps = {
  onClose: () => { }
};