import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FormatoCotizacion.css';
import api from '../api/axiosConfig';

export default function RemisionPreview({ datos, onClose }) {
  const navigate = useNavigate();
  // Obtener usuario logueado
  const usuario = JSON.parse(localStorage.getItem('user') || '{}');
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  
  // Autocompletar información del correo para remisión
  const [correo, setCorreo] = useState(datos?.cliente?.correo || '');
  const [asunto, setAsunto] = useState(`Remisión ${datos?.numeroRemision || ''} - ${datos?.cliente?.nombre || 'Cliente'}`);
  const [mensaje, setMensaje] = useState(
    `Estimado/a ${datos?.cliente?.nombre || 'cliente'},

Esperamos se encuentre bien. Adjunto encontrará la remisión con número ${datos?.numeroRemision || ''}.

Detalles de la remisión:
- Fecha: ${datos?.fecha ? new Date(datos.fecha).toLocaleDateString('es-ES') : 'N/A'}
- Total: $${datos?.total?.toLocaleString('es-ES') || '0'}
- Productos: ${datos?.productos?.length || 0} artículos

Esta remisión confirma la entrega de los productos solicitados.

Saludos cordiales,
${usuario?.nombre || 'Equipo de ventas'}
${usuario?.email ? `\n${usuario.email}` : ''}
${usuario?.telefono ? `\nTel: ${usuario.telefono}` : ''}`
  );

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
• Fecha de entrega: ${datos?.fecha ? new Date(datos.fecha).toLocaleDateString('es-ES') : 'N/A'}
• Cliente: ${datos?.cliente?.nombre || 'N/A'}
• Correo: ${datos?.cliente?.correo || 'N/A'}
• Teléfono: ${datos?.cliente?.telefono || 'N/A'}
• Ciudad: ${datos?.cliente?.ciudad || 'N/A'}
• Estado: Entregado ✅
• Total de productos entregados: ${datos?.productos?.length || 0} artículos
• TOTAL GENERAL: $${totalFinal.toLocaleString('es-ES')}
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
🌐 Soluciones tecnológicas integrales`
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
  const numeroRemision = datos.numeroRemision || `REM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  return (
    <div className="modal-cotizacion-overlay" style={{ alignItems: 'flex-start', paddingTop: '50px', overflow: 'auto' }}>
      <div className="modal-cotizacion" style={{ maxWidth: '95vw', maxHeight: 'none', width: '900px', height: 'auto', marginBottom: '50px' }}>
        <button className="close-modal" onClick={onClose}>×</button>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className='modal-title'>Remisión {numeroRemision}</span>
          <div className="botones-cotizacion" style={{ display: 'flex', gap: '18px', justifyContent: 'center', marginBottom: '1rem' }}>
            <button className="btn-cotizacion moderno" title="Confirmar Entrega" onClick={() => {}}>
            </button>
            <button className="btn-cotizacion moderno" title="Enviar" onClick={abrirModalEnvio}>
              <i className="fa-solid fa-envelope" style={{ fontSize: '1rem', color: '#EA4335', marginRight: '6px' }}></i>
              Enviar
            </button>
            <button className="btn-cotizacion moderno" title="Imprimir" onClick={() => {
              // Método seguro de impresión sin manipular DOM
              const printContent = document.getElementById('pdf-remision-block');
              const newWindow = window.open('', '_blank');
              newWindow.document.write(`
                <html>
                  <head>
                    <title>Remisión</title>
                    <style>
                      body { font-family: Arial, sans-serif; margin: 20px; }
                      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                      th { background-color: #f2f2f2; }
                      .header { text-align: center; margin-bottom: 30px; }
                      .info-section { margin: 20px 0; }
                      .signature-section { margin-top: 50px; }
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
            }}>
              <i className="fa-solid fa-print" style={{ fontSize: '1.2rem', marginRight: '8px' }}></i>
            </button>
          </div>
        </div>

        {/* Contenido PDF debajo */}
        <div
          className="pdf-cotizacion"
          id="pdf-remision-block"
          style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
            marginTop: '0.5rem', 
            userSelect: 'none', 
            WebkitUserSelect: 'none', 
            MozUserSelect: 'none', 
            msUserSelect: 'none', 
            fontSize: '0.9rem',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}
          onCopy={e => e.preventDefault()}
        >
          <div className="cotizacion-encabezado">
            <h2 style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>REMISIÓN</h2>
          </div>

          {/* Información de envío */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ color: '#374151', marginBottom: '0.3rem', fontSize: '0.85rem' }}>ENTREGAR A:</h4>
              <div style={{ backgroundColor: '#f9fafb', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.15rem', fontSize: '0.8rem' }}>
                  {datos.cliente?.nombre || 'Cliente no especificado'}
                </p>
                <p style={{ marginBottom: '0.15rem', fontSize: '0.75rem' }}>
                  {datos.cliente?.direccion || 'Cl. 21 # 5 - 52 C19, Chía, Cundinamarca'}
                </p>
                <p style={{ marginBottom: '0.15rem', fontSize: '0.75rem' }}>
                  {datos.cliente?.ciudad || 'Ciudad no especificada'}
                </p>
                <p style={{ marginBottom: '0.15rem', fontSize: '0.75rem' }}>
                  Tel: {datos.cliente?.telefono || 'No especificado'}
                </p>
                <p style={{ fontSize: '0.75rem' }}>
                  {datos.cliente?.correo || 'Sin correo'}
                </p>
              </div>
            </div>
            
            <div style={{ flex: 1, marginLeft: '1rem' }}>
              <h4 style={{ color: '#374151', marginBottom: '0.3rem', fontSize: '0.85rem' }}>REMITE:</h4>
              <div style={{ backgroundColor: '#f9fafb', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.15rem', fontSize: '0.8rem' }}>{datos.empresa?.nombre || 'PANGEA'}</p>
                <p style={{ marginBottom: '0.15rem', fontSize: '0.75rem' }}>{datos.empresa?.direccion || ''}</p>
                <p style={{ marginBottom: '0.15rem', fontSize: '0.75rem' }}>Responsable: {usuario.firstName || ''} {usuario.surname || ''}</p>
                <p style={{ marginBottom: '0.15rem', color: '#6b7280', fontSize: '0.75rem' }}>
                  Ref. Pedido: {datos.numeroPedido || datos.codigo || 'N/A'}
                </p>
                {(datos.numeroCotizacion || datos.cotizacion?.numero) && (
                  <p style={{ marginBottom: '0.15rem', color: '#6b7280', fontSize: '0.75rem' }}>
                    Ref. Cotización: {datos.numeroCotizacion || datos.cotizacion?.numero}
                  </p>
                )}
              </div>
            </div>
          </div>

          <hr />

          {/* Información del envío */}
          {datos.observacion && (
            <div style={{ marginBottom: '0.75rem' }}>
              <h4 style={{ color: '#374151', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Observaciones:</h4>
              <div style={{ backgroundColor: '#fffbeb', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fed7aa' }}>
                <p style={{ margin: 0, fontSize: '0.75rem' }}>{datos.observacion}</p>
              </div>
            </div>
          )}

          {/* Tabla de productos */}
          <table className="tabla-cotizacion" style={{ fontSize: '0.8rem', width: '100%', marginBottom: '1rem' }}>
              <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '0.6rem', fontSize: '0.8rem' }}>Cant.</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', fontSize: '0.8rem' }}>Producto</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', fontSize: '0.8rem' }}>Descripción</th>
                <th style={{ textAlign: 'right', padding: '0.6rem', fontSize: '0.8rem' }}>Valor Unit.</th>
                <th style={{ textAlign: 'right', padding: '0.6rem', fontSize: '0.8rem' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {datos.productos && datos.productos.length > 0 ? datos.productos.map((p, idx) => {
                console.log('Producto en remisión:', p); // Debug
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.6rem', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {p.cantidad || 0}
                    </td>
                    <td style={{ padding: '0.6rem', fontSize: '0.8rem' }}>
                      {p.product?.name || p.producto?.name || p.nombre || 'Producto sin nombre'}
                    </td>
                    <td style={{ padding: '0.6rem', fontSize: '0.8rem', color: '#6b7280' }}>
                      {p.product?.description || p.descripcion || 'Sin descripción'}
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.8rem' }}>
                      ${(p.valorUnitario || p.precioUnitario || p.product?.price || 0).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      ${(() => {
                        const cantidad = parseFloat(p.cantidad) || 0;
                        const precio = parseFloat(p.valorUnitario || p.precioUnitario || p.product?.price) || 0;
                        return (cantidad * precio).toLocaleString('es-CO');
                      })()}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#6b7280' }}>
                    No hay productos disponibles
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f9fafb', fontWeight: 'bold' }}>
                <td colSpan={4} style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.9rem' }}>
                  TOTAL A ENTREGAR:
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '1rem', color: '#059669' }}>
                  ${datos.productos && datos.productos.length > 0 ? datos.productos
                    .reduce((acc, p) => {
                      const cantidad = parseFloat(p.cantidad) || 0;
                      const precio = parseFloat(p.valorUnitario || p.precioUnitario || p.product?.price) || 0;
                      return acc + (cantidad * precio);
                    }, 0)
                    .toLocaleString('es-CO') : '0'}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Sección de firmas */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '1rem', 
            paddingTop: '0.75rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ borderTop: '1px solid #374151', marginTop: '1.5rem', paddingTop: '0.3rem' }}>
                <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0 }}>ENTREGADO POR:</p>
                <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: 0 }}>
                </p>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', flex: 1, marginLeft: '1rem' }}>
              <div style={{ borderTop: '1px solid #374151', marginTop: '1.5rem', paddingTop: '0.3rem' }}>
                <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0 }}>RECIBIDO POR:</p>
                <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: 0 }}>
                </p>
              </div>
            </div>
          </div>

          {/* Términos y condiciones */}
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            backgroundColor: '#f8fafc', 
            borderRadius: '6px', 
            border: '1px solid #e2e8f0'
          }}>
            <h5 style={{ fontSize: '0.8rem', color: '#374151', marginBottom: '0.4rem' }}>TÉRMINOS Y CONDICIONES:</h5>
            <ul style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0, paddingLeft: '1rem', lineHeight: '1.3' }}>
              <li>El cliente debe verificar la mercancía al momento de la entrega</li>
              <li>Los reclamos por daños o faltantes deben realizarse en el momento de la entrega</li>
              <li>Una vez firmada la remisión, se da por aceptada la mercancía en perfectas condiciones</li>
            </ul>
          </div>
        </div>
      </div>

      {showEnviarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-cotizacion" style={{ maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
            <button className="close-modal" onClick={() => setShowEnviarModal(false)}>×</button>
            <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>
              📧 Enviar Remisión por Correo
            </h3>
            
            {/* Información de la remisión */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', marginBottom: '1rem', fontSize: '14px' }}>
              <strong>Remisión:</strong> {datos?.numeroRemision}<br/>
              <strong>Cliente:</strong> {datos?.cliente?.nombre}<br/>
              <strong>Total:</strong> ${datos?.total?.toLocaleString('es-ES')}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                📬 Correo destinatario:
              </label>
              <input 
                type="email" 
                className="cuadroTexto" 
                value={correo} 
                onChange={e => setCorreo(e.target.value)} 
                style={{ width: '100%' }}
                placeholder="correo@ejemplo.com"
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                📝 Asunto:
              </label>
              <input 
                type="text" 
                className="cuadroTexto" 
                value={asunto} 
                onChange={e => setAsunto(e.target.value)} 
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                💬 Mensaje:
              </label>
              <textarea 
                className="cuadroTexto" 
                value={mensaje} 
                onChange={e => setMensaje(e.target.value)} 
                style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
                placeholder="Escriba aquí el mensaje para el cliente..."
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn-enviar-modal" 
                style={{ flex: 1, backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' }} 
                onClick={enviarRemisionPorCorreo}
              >
                📧 Enviar Remisión
              </button>
              <button 
                className="btn-cancelar-modal" 
                style={{ flex: 1, backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' }} 
                onClick={() => setShowEnviarModal(false)}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}