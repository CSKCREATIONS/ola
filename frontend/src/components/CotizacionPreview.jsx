import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';


export default function FormatoCotizacion({ datos, onClose, onEmailSent }) {
  const navigate = useNavigate();
  // Obtener usuario logueado
  const usuario = JSON.parse(localStorage.getItem('user') || '{}');
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  
  // Estados para el formulario de envío de correo
  const [correo, setCorreo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Función para abrir modal con datos actualizados
  const abrirModalEnvio = () => {
    // Calcular total dinámicamente si no existe
    const totalCalculado = datos?.productos?.reduce((total, producto) => {
      const subtotal = Number(producto.subtotal) || 0;
      return total + subtotal;
    }, 0) || 0;
    
    const totalFinal = datos?.total || totalCalculado;
    
    // Actualizar datos autocompletados cada vez que se abre el modal
    setCorreo(datos?.cliente?.correo || '');
    setAsunto(`Cotización ${datos?.codigo || ''} - ${datos?.cliente?.nombre || 'Cliente'} | ${process.env.REACT_APP_COMPANY_NAME || 'Pangea Sistemas'}`);
    setMensaje(
      `Estimado/a ${datos?.cliente?.nombre || 'cliente'},

Esperamos se encuentre muy bien. Adjunto encontrará la cotización solicitada con la siguiente información:

📋 DETALLES DE LA COTIZACIÓN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Código: ${datos?.codigo || 'N/A'}
• Fecha de emisión: ${datos?.fecha ? new Date(datos.fecha).toLocaleDateString('es-ES') : 'N/A'}
• Cliente: ${datos?.cliente?.nombre || 'N/A'}
• Correo: ${datos?.cliente?.correo || 'N/A'}
• Teléfono: ${datos?.cliente?.telefono || 'N/A'}
• Ciudad: ${datos?.cliente?.ciudad || 'N/A'}
• Estado actual: ${datos?.estado || 'Pendiente'}
• Validez de la oferta: ${datos?.validez || '15 días'}
• Total de productos: ${datos?.productos?.length || 0} artículos
• TOTAL GENERAL: $${totalFinal.toLocaleString('es-ES')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${datos?.descripcion ? `📝 DESCRIPCIÓN:
${datos.descripcion}

` : ''}${datos?.condicionesPago ? `💳 CONDICIONES DE PAGO:
${datos.condicionesPago}

` : ''}Quedamos atentos a sus comentarios y esperamos su pronta respuesta para proceder con la atención de su requerimiento.

¡Gracias por confiar en nosotros!

Saludos cordiales,

${usuario?.firstName || usuario?.nombre || 'Equipo de ventas'} ${usuario?.surname || ''}${usuario?.email ? `
📧 Correo: ${usuario.email}` : ''}${usuario?.telefono ? `
📞 Teléfono: ${usuario.telefono}` : ''}

${process.env.REACT_APP_COMPANY_NAME || 'Pangea Sistemas'}
🌐 Soluciones tecnológicas integrales`
    );
    setShowEnviarModal(true);
  };

  // Función para enviar por correo
  const enviarPorCorreo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/cotizaciones/${datos._id}/enviar-correo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cotizacionId: datos._id,
          correoDestino: correo,
          asunto: asunto,
          mensaje: mensaje
        })
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'La cotización ha sido enviada exitosamente'
        });
        setShowEnviarModal(false);
        
        // Actualizar el estado local para reflejar que fue enviado
        if (datos) {
          datos.enviadoCorreo = true;
        }
        
        // Llamar al callback para actualizar el componente padre
        if (onEmailSent) {
          onEmailSent(datos._id);
        }
      } else {
        throw new Error('Error al enviar correo');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo enviar el correo'
      });
    }
  };

  // Función para remisionar
  const remisionarCotizacion = async () => {
    try {
      const { value: formValues } = await Swal.fire({
        title: 'Remisionar Cotización',
        html: `
          <div style="text-align: left;">
            <label for="fechaEntrega">Fecha de entrega:</label>
            <input type="date" id="fechaEntrega" class="swal2-input" value="${new Date().toISOString().split('T')[0]}">
            <label for="observaciones">Observaciones:</label>
            <textarea id="observaciones" class="swal2-textarea" placeholder="Observaciones adicionales..."></textarea>
          </div>
        `,
        focusConfirm: false,
        preConfirm: () => {
          return {
            fechaEntrega: document.getElementById('fechaEntrega').value,
            observaciones: document.getElementById('observaciones').value
          }
        }
      });

      if (formValues) {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/cotizaciones/${datos._id}/remisionar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            cotizacionId: datos._id,
            fechaEntrega: formValues.fechaEntrega,
            observaciones: formValues.observaciones
          })
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Cotización remisionada',
            text: 'La cotización ha sido convertida a pedido exitosamente'
          });
          onClose();
        } else {
          throw new Error('Error al remisionar');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo remisionar la cotización'
      });
    }
  };



  // Obtener lista de productos para mostrar el nombre
  const productosLista = datos.productosLista || [];

  // Usar datos de la cotización (traídos del backend) para empresa si existen
  // Ejemplo: datos.empresa = { nombre, direccion }
  console.log("productosLista:", productosLista);

  return (


    <div className="modal-cotizacion-overlay" style={{ alignItems: 'flex-start', paddingTop: '50px', overflow: 'auto' }}>
      <div className="modal-cotizacion" style={{ maxWidth: '95vw', maxHeight: 'none', width: '900px', height: 'auto', marginBottom: '50px' }}>
        <button className="close-modal" onClick={onClose}>×</button>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className='modal-title'>
            {datos.tipo === 'pedido' ? 'Pedido Agendado' : (datos.codigo ? datos.codigo : '')}
          </span>
          <div className="botones-cotizacion" style={{ display: 'flex', gap: '18px', justifyContent: 'center', marginBottom: '1rem' }}>
            {datos.tipo !== 'pedido' && (
              <button className="btn-cotizacion moderno" title="Editar" onClick={() => { onClose(); navigate('/RegistrarCotizacion', { state: { datos } }); }}>
                <i className="fa-solid fa-pen" style={{ fontSize: '1.2rem', marginRight: '8px' }}></i>
                Editar
              </button>
            )}
            {datos.tipo !== 'pedido' && (
              <button className="btn-cotizacion moderno" title="Remisionar" onClick={remisionarCotizacion}>
                <i className="fa-solid fa-file-invoice" style={{ fontSize: '1.2rem', marginRight: '8px' }}></i>
                Remisionar
              </button>
            )}
            <button className="btn-cotizacion moderno" title="Enviar" onClick={abrirModalEnvio}>
              <i className="fa-solid fa-envelope" style={{ fontSize: '1rem', color: '#EA4335', marginRight: '6px' }}></i>
              Enviar
            </button>
            <button className="btn-cotizacion moderno" title="Imprimir" onClick={() => {
              // Método seguro de impresión sin manipular DOM
              const printContent = document.getElementById('pdf-cotizacion-block');
              const newWindow = window.open('', '_blank');
              newWindow.document.write(`
                <html>
                  <head>
                    <title>Cotización</title>
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
          id="pdf-cotizacion-block"

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
            <h2 style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>
              {datos.tipo === 'pedido' ? 'PEDIDO AGENDADO' : 'COTIZACIÓN'}
            </h2>
          </div>
          {/* Información del cliente y empresa */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ color: '#374151', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                {datos.tipo === 'pedido' ? 'ENTREGAR A:' : 'CLIENTE:'}
              </h4>
              <div style={{ backgroundColor: '#f9fafb', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.15rem', fontSize: '0.8rem' }}>
                  {datos.cliente?.nombre || 'Cliente no especificado'}
                </p>
                <p style={{ marginBottom: '0.15rem', fontSize: '0.75rem' }}>
                  {datos.cliente?.direccion || 'Dirección no especificada'}
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
              <h4 style={{ color: '#374151', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                {datos.tipo === 'pedido' ? 'REMITE:' : 'EMPRESA:'}
              </h4>
              <div style={{ backgroundColor: '#f9fafb', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.15rem', fontSize: '0.8rem' }}>
                  {datos.empresa?.nombre || 'PANGEA'}
                </p>
                <p style={{ marginBottom: '0.15rem', fontSize: '0.75rem' }}>
                  {datos.empresa?.direccion || ''}
                </p>
                <p style={{ marginBottom: '0.15rem', fontSize: '0.75rem' }}>
                  Responsable: {usuario.firstName || ''} {usuario.surname || ''}
                </p>
                {datos.codigo && (
                  <p style={{ marginBottom: '0.15rem', color: '#6b7280', fontSize: '0.75rem' }}>
                    Ref. {datos.tipo === 'pedido' ? 'Pedido' : 'Cotización'}: {datos.codigo}
                  </p>
                )}
                {datos.fechaEntrega && (
                  <p style={{ marginBottom: '0.15rem', color: '#6b7280', fontSize: '0.75rem' }}>
                    F. Entrega: {new Date(datos.fechaEntrega).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
            </div>
          </div>
          <hr />
          {/* Descripción */}
          {datos.descripcion && (
            <div style={{ marginBottom: '0.75rem' }}>
              <h4 style={{ color: '#374151', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                {datos.tipo === 'pedido' ? 'Descripción del pedido:' : 'Descripción de la cotización:'}
              </h4>
              <div style={{ backgroundColor: '#fffbeb', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fed7aa' }}>
                <div style={{ margin: 0, fontSize: '0.75rem' }} dangerouslySetInnerHTML={{ __html: datos.descripcion }} />
              </div>
              {datos.tipo === 'pedido' && datos.estadoPedido && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Estado del pedido: </span>
                  <span style={{ 
                    backgroundColor: datos.estadoPedido === 'pendiente' ? '#fef3c7' : 
                                   datos.estadoPedido === 'completado' ? '#d4edda' : '#f8d7da',
                    color: datos.estadoPedido === 'pendiente' ? '#f59e0b' : 
                           datos.estadoPedido === 'completado' ? '#155724' : '#721c24',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {datos.estadoPedido.charAt(0).toUpperCase() + datos.estadoPedido.slice(1)}
                  </span>
                </div>
              )}
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
                <th style={{ textAlign: 'right', padding: '0.6rem', fontSize: '0.8rem' }}>% Desc.</th>
                <th style={{ textAlign: 'right', padding: '0.6rem', fontSize: '0.8rem' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {datos.productos && datos.productos.length > 0 ? datos.productos.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    {p.cantidad || 0}
                  </td>
                  <td style={{ padding: '0.6rem', fontSize: '0.8rem' }}>
                    {p.producto?.name || p.nombre || 'Producto sin nombre'}
                  </td>
                  <td style={{ padding: '0.6rem', fontSize: '0.8rem', color: '#6b7280' }}>
                    {p.producto?.description || p.descripcion || 'Sin descripción'}
                  </td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.8rem' }}>
                    ${(p.valorUnitario || 0).toLocaleString('es-CO')}
                  </td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.8rem' }}>
                    {p.descuento || 0}%
                  </td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    ${(() => {
                      const cantidad = parseFloat(p.cantidad) || 0;
                      const valorUnitario = parseFloat(p.valorUnitario) || 0;
                      const descuento = parseFloat(p.descuento) || 0;
                      const subtotal = cantidad * valorUnitario * (1 - descuento / 100);

                      return subtotal.toLocaleString('es-CO');
                    })()}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#6b7280' }}>
                    No hay productos disponibles
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f9fafb', fontWeight: 'bold' }}>
                <td colSpan={5} style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.9rem' }}>
                  TOTAL {datos.tipo === 'pedido' ? 'PEDIDO' : 'COTIZACIÓN'}:
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '1rem', color: '#059669' }}>
                  ${datos.productos && datos.productos.length > 0 ? datos.productos
                    .reduce((acc, p) => {
                      const cantidad = parseFloat(p.cantidad) || 0;
                      const valorUnitario = parseFloat(p.valorUnitario) || 0;
                      const descuento = parseFloat(p.descuento) || 0;
                      const subtotal = cantidad * valorUnitario * (1 - descuento / 100);
                      return acc + subtotal;
                    }, 0)
                    .toLocaleString('es-CO') : '0'}
                </td>
              </tr>
            </tfoot>
          </table>
          {/* Condiciones de pago */}
          {datos.condicionesPago && (
            <div style={{ marginBottom: '0.75rem' }}>
              <h4 style={{ color: '#374151', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Condiciones de pago:</h4>
              <div style={{ backgroundColor: '#f0f9ff', padding: '0.5rem', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                <div style={{ margin: 0, fontSize: '0.75rem' }} dangerouslySetInnerHTML={{ __html: datos.condicionesPago }} />
              </div>
            </div>
          )}

          {/* Validez de cotización */}
          {datos.tipo !== 'pedido' && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              backgroundColor: '#f8fafc', 
              borderRadius: '6px', 
              border: '1px solid #e2e8f0'
            }}>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, textAlign: 'center', fontStyle: 'italic' }}>
                Cotización válida por 15 días
              </p>
            </div>
          )}
          {/* Mostrar cotización relacionada cuando exista */}
          {datos.cotizacionCodigo && (
            <div style={{ marginTop: '1rem', textAlign: 'right', fontSize: '0.85rem', color: '#374151' }}>
              <strong>Cotización relacionada: </strong>
              <span style={{ color: '#2563eb' }}>#{datos.cotizacionCodigo}</span>
            </div>
          )}
        </div>

      </div>

      {showEnviarModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="modal-cotizacion" style={{ maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
              <button className="close-modal" onClick={() => setShowEnviarModal(false)}>×</button>
              <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>
                📧 Enviar Cotización por Correo
              </h3>
              
              {/* Información de la cotización */}
              <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', marginBottom: '1rem', fontSize: '14px' }}>
                <strong>Cotización:</strong> {datos?.codigo}<br/>
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
                  onClick={enviarPorCorreo}
                >
                  📧 Enviar Correo
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
