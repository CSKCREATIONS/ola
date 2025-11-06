import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';

export default function CotizacionPreview({ datos, onClose, onEmailSent }) {
  const navigate = useNavigate();
  // Obtener usuario logueado
  const usuario = JSON.parse(localStorage.getItem('user') || '{}');
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  
  // Estados para el formulario de envío de correo
  const [correo, setCorreo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Función para formatear fecha
  const formatDate = (fecha) => {
    if (!fecha) return 'No especificada';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Función para calcular total
  const calcularTotal = () => {
    if (!datos?.productos) return 0;
    return datos.productos.reduce((total, producto) => {
      const subtotal = Number(producto.subtotal) || 0;
      return total + subtotal;
    }, 0);
  };

  // Función para abrir modal con datos actualizados
  const abrirModalEnvio = () => {
    const totalFinal = datos?.total || calcularTotal();
    
    setCorreo(datos?.cliente?.correo || '');
    setAsunto(`Cotización ${datos?.codigo || ''} - ${datos?.cliente?.nombre || 'Cliente'} | ${process.env.REACT_APP_COMPANY_NAME || 'JLA Global Company'}`);
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
• TOTAL GENERAL: S/. ${totalFinal.toLocaleString('es-ES')}
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

${process.env.REACT_APP_COMPANY_NAME || 'JLA Global Company'}
🌐 Productos de calidad`
    );
    setShowEnviarModal(true);
  };

  // Función para enviar por correo
  const enviarPorCorreo = async () => {
    try {
      const res = await api.post(`/api/cotizaciones/${datos._id}/enviar-correo`, {
        cotizacionId: datos._id,
        correoDestino: correo,
        asunto: asunto,
        mensaje: mensaje
      });

      if (res.status >= 200 && res.status < 300) {
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'La cotización ha sido enviada exitosamente',
          confirmButtonColor: '#2563eb'
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
        text: 'No se pudo enviar el correo',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  // Función para remisionar
  const remisionarCotizacion = async () => {
    try {
      const { value: formValues } = await Swal.fire({
        title: '<i class="fa-solid fa-file-invoice" style="color: #2563eb; margin-right: 12px;"></i>Remisionar Cotización',
        html: `
          <div style="text-align: left; padding: 20px; background: linear-gradient(135deg, #f8fafc, #e2e8f0); border-radius: 12px; margin: 20px 0;">
            
            <!-- Información de la cotización -->
            <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
              <h4 style="margin: 0 0 12px 0; color: #2563eb; font-size: 16px;">
                <i class="fa-solid fa-info-circle"></i> Información de la Cotización
              </h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                <p style="margin: 4px 0;"><strong>Código:</strong> ${datos?.codigo || 'N/A'}</p>
                <p style="margin: 4px 0;"><strong>Cliente:</strong> ${datos?.cliente?.nombre || 'N/A'}</p>
                <p style="margin: 4px 0;"><strong>Productos:</strong> ${datos?.productos?.length || 0} items</p>
                <p style="margin: 4px 0;"><strong>Total:</strong> S/. ${(datos?.total || 0).toLocaleString('es-ES')}</p>
              </div>
            </div>
            
            <!-- Formulario -->
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              
              <!-- Fecha de entrega -->
              <div style="margin-bottom: 20px;">
                <label for="fechaEntrega" style="display: block; margin-bottom: 8px; font-weight: bold; color: #374151; font-size: 14px;">
                  <i class="fa-solid fa-truck" style="color: #059669; margin-right: 8px;"></i>
                  Fecha de Entrega <span style="color: #ef4444;">*</span>
                </label>
                <input 
                  type="date" 
                  id="fechaEntrega" 
                  value="${new Date().toISOString().split('T')[0]}" 
                  style="
                    width: 100%; 
                    padding: 12px 16px; 
                    border: 2px solid #e5e7eb; 
                    border-radius: 8px; 
                    font-size: 14px;
                    transition: all 0.3s ease;
                    background: #f9fafb;
                  "
                  onfocus="this.style.borderColor='#2563eb'; this.style.background='white';"
                  onblur="this.style.borderColor='#e5e7eb'; this.style.background='#f9fafb';"
                >
                <small style="color: #6b7280; font-size: 12px; margin-top: 4px; display: block;">
                  Fecha en que se realizó/realizará la entrega de los productos
                </small>
              </div>
              
              <!-- Observaciones -->
              <div style="margin-bottom: 16px;">
                <label for="observaciones" style="display: block; margin-bottom: 8px; font-weight: bold; color: #374151; font-size: 14px;">
                  <i class="fa-solid fa-comment-dots" style="color: #8b5cf6; margin-right: 8px;"></i>
                  Observaciones
                </label>
                <textarea 
                  id="observaciones" 
                  placeholder="Ingrese observaciones adicionales para el pedido y la remisión..."
                  rows="4"
                  style="
                    width: 100%; 
                    padding: 12px 16px; 
                    border: 2px solid #e5e7eb; 
                    border-radius: 8px; 
                    font-size: 14px;
                    resize: vertical;
                    min-height: 100px;
                    font-family: inherit;
                    transition: all 0.3s ease;
                    background: #f9fafb;
                  "
                  onfocus="this.style.borderColor='#2563eb'; this.style.background='white';"
                  onblur="this.style.borderColor='#e5e7eb'; this.style.background='#f9fafb';"
                ></textarea>
                <small style="color: #6b7280; font-size: 12px; margin-top: 4px; display: block;">
                  Estas observaciones aparecerán tanto en el pedido como en la remisión
                </small>
              </div>
              
              <!-- Información importante -->
              <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 20px;">
                <h5 style="margin: 0 0 8px 0; color: #92400e; font-size: 14px;">
                  <i class="fa-solid fa-lightbulb"></i> ¿Qué se creará?
                </h5>
                <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 13px; line-height: 1.6;">
                  <li><strong>📋 Pedido:</strong> Se agregará a la lista de pedidos con estado "Entregado"</li>
                  <li><strong>🚚 Remisión:</strong> Se creará el documento de entrega en remisiones</li>
                  <li><strong>📄 Cotización:</strong> Se marcará como "Remisionado"</li>
                </ul>
              </div>
              
            </div>
          </div>
        `,
        icon: null,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-truck" style="margin-right: 8px;"></i>Entregar y Remisionar',
        cancelButtonText: '<i class="fa-solid fa-times" style="margin-right: 8px;"></i>Cancelar',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280',
        width: '600px',
        background: '#ffffff',
        customClass: {
          container: 'swal-remision-container',
          popup: 'swal-remision-popup',
          title: 'swal-remision-title',
          confirmButton: 'swal-remision-confirm',
          cancelButton: 'swal-remision-cancel'
        },
        didOpen: () => {
          // Agregar estilos personalizados
          const style = document.createElement('style');
          style.textContent = `
            .swal-remision-container {
              backdrop-filter: blur(4px);
            }
            .swal-remision-popup {
              border-radius: 16px !important;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            }
            .swal-remision-title {
              font-size: 24px !important;
              font-weight: 600 !important;
              color: #1e293b !important;
              margin-bottom: 8px !important;
            }
            .swal-remision-confirm {
              border-radius: 8px !important;
              padding: 12px 24px !important;
              font-weight: 600 !important;
              font-size: 14px !important;
              transition: all 0.3s ease !important;
              box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3) !important;
            }
            .swal-remision-confirm:hover {
              transform: translateY(-1px) !important;
              box-shadow: 0 6px 12px -1px rgba(37, 99, 235, 0.4) !important;
            }
            .swal-remision-cancel {
              border-radius: 8px !important;
              padding: 12px 24px !important;
              font-weight: 600 !important;
              font-size: 14px !important;
              transition: all 0.3s ease !important;
            }
            .swal-remision-cancel:hover {
              background-color: #4b5563 !important;
            }
          `;
          document.head.appendChild(style);
        },
        focusConfirm: false,
        preConfirm: () => {
          const fechaEntrega = document.getElementById('fechaEntrega').value;
          const observaciones = document.getElementById('observaciones').value;
          
          if (!fechaEntrega) {
            Swal.showValidationMessage(`
              <div style="text-align: left; color: #dc2626;">
                <i class="fa-solid fa-exclamation-circle"></i> 
                <strong>La fecha de entrega es requerida</strong>
                <br><small>Por favor seleccione una fecha para continuar</small>
              </div>
            `);
            return false;
          }
          
          // Validar que la fecha no sea anterior a hoy
          const fechaSeleccionada = new Date(fechaEntrega);
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          
          if (fechaSeleccionada < hoy) {
            Swal.showValidationMessage(`
              <div style="text-align: left; color: #dc2626;">
                <i class="fa-solid fa-calendar-xmark"></i> 
                <strong>La fecha de entrega no puede ser anterior a hoy</strong>
                <br><small>Por favor seleccione una fecha válida</small>
              </div>
            `);
            return false;
          }
          
          return {
            fechaEntrega: fechaEntrega,
            observaciones: observaciones.trim()
          }
        }
      });

      if (formValues) {
        // Mostrar loading
        Swal.fire({
          title: 'Procesando...',
          text: 'Convirtiendo cotización a pedido',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const res = await api.post(`/api/cotizaciones/${datos._id}/remisionar`, {
          cotizacionId: datos._id,
          fechaEntrega: formValues.fechaEntrega,
          observaciones: formValues.observaciones
        });

        const result = res.data || res;

        if (res.status >= 200 && res.status < 300) {
          Swal.fire({
            icon: 'success',
            title: '¡Cotización Remisionada!',
            html: `
              <div style="text-align: left; background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 15px 0;">
                <h4 style="color: #2563eb; margin-bottom: 15px;">
                  <i class="fa-solid fa-check-circle"></i> Documentos Creados Exitosamente
                </h4>
                
                <div style="background: #10b981; color: white; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
                  <strong><i class="fa-solid fa-file-invoice"></i> Pedido:</strong> ${result.numeroPedido}
                </div>
                
                <div style="background: #3b82f6; color: white; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
                  <strong><i class="fa-solid fa-truck"></i> Remisión:</strong> ${result.numeroRemision}
                </div>
                
                <p><strong>Cliente:</strong> ${datos?.cliente?.nombre}</p>
                <p><strong>Fecha de Entrega:</strong> ${new Date(formValues.fechaEntrega).toLocaleDateString('es-ES')}</p>
                <p><strong>Estado Pedido:</strong> <span style="background: #059669; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">ENTREGADO</span></p>
                <p><strong>Estado Remisión:</strong> <span style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">ACTIVA</span></p>
                ${formValues.observaciones ? `<p><strong>Observaciones:</strong> ${formValues.observaciones}</p>` : ''}
              </div>
            `,
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: '<i class="fa-solid fa-file-invoice"></i> Ver Pedidos',
            denyButtonText: '<i class="fa-solid fa-truck"></i> Ver Remisiones',
            cancelButtonText: 'Cerrar',
            confirmButtonColor: '#10b981',
            denyButtonColor: '#3b82f6'
          }).then((result) => {
            if (result.isConfirmed) {
              navigate('/PedidosEntregados'); // Asume que existe esta ruta 
            } else if (result.isDenied) {
              navigate('/ListaDeRemisiones'); // Asume que existe esta ruta
            }
          });
          
          onClose();
        } else {
          throw new Error(result.message || 'Error al remisionar');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al Remisionar',
        text: error.message || 'No se pudo convertir la cotización a pedido',
        confirmButtonColor: '#dc2626'
      });
    }
  };

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
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: 'white',
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <i className="fa-solid fa-file-lines" style={{ fontSize: '1.8rem' }}></i>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                Vista Previa - Cotización
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
                N° {datos.codigo || 'Sin código'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Botón de editar */}
            {datos.tipo !== 'pedido' && (
              <button
                onClick={() => { onClose(); navigate('/RegistrarCotizacion', { state: { datos } }); }}
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
                <i className="fa-solid fa-pen"></i>
                Editar
              </button>
            )}

            {/* Botón de remisionar */}
            {datos.tipo !== 'pedido' && (
              <button
                onClick={remisionarCotizacion}
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
                <i className="fa-solid fa-file-invoice"></i>
                Remisionar
              </button>
            )}

            {/* Botón de imprimir */}
            <button
              onClick={() => {
                const printContent = document.querySelector('.pdf-cotizacion');
                const newWindow = window.open('', '_blank');
                newWindow.document.write(`
                  <html>
                    <head>
                      <title>Cotización - ${datos.codigo}</title>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border-radius: 10px; }
                        .info-section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; font-weight: bold; }
                        .total-row { background: #dbeafe; font-weight: bold; }
                        .status-badge { background: #2563eb; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; }
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
              <i className="fa-solid fa-print" style={{ fontSize: '1.2rem', marginRight: '8px' }}></i>
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
              <i className="fa-solid fa-envelope"></i>
              Enviar
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
              <i className="fa-solid fa-times"></i>
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
          {/* Contenido de la cotización */}
          <div
            className="pdf-cotizacion"
            id="pdf-cotizacion-block"
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
            onSelectStart={e => e.preventDefault()}
          >
            <div className="header" style={{
              textAlign: 'center',
              color: 'white',
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              borderRadius: '8px',
              fontSize: '1.8rem',
              fontWeight: 'bold'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <i className="fa-solid fa-file-lines" style={{ fontSize: '2rem' }}></i>
                <div>
                  <div>COTIZACIÓN</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '0.5rem' }}>
                    N° {datos?.codigo}
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
                  borderBottom: '3px solid #2563eb', 
                  paddingBottom: '0.5rem', 
                  color: '#2563eb',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  Información del Cliente
                </h3>
                <div style={{ lineHeight: '1.8' }}>
                  <p><strong>Cliente:</strong> {datos?.cliente?.nombre}</p>
                  <p><strong>Teléfono:</strong> {datos?.cliente?.telefono}</p>
                  <p><strong>Email:</strong> {datos?.cliente?.correo}</p>
                  <p><strong>Dirección:</strong> {datos?.cliente?.direccion}</p>
                  <p><strong>Ciudad:</strong> {datos?.cliente?.ciudad}</p>
                </div>
              </div>

              <div>
                <h3 style={{ 
                  borderBottom: '3px solid #2563eb', 
                  paddingBottom: '0.5rem', 
                  color: '#2563eb',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  Detalles de la Cotización
                </h3>
                <div style={{ lineHeight: '1.8' }}>
                  <p><strong>Fecha de Emisión:</strong> {formatDate(datos?.fecha)}</p>
                  <p><strong>Fecha de Vencimiento:</strong> {formatDate(datos?.fechaVencimiento)}</p>
                  <p><strong>Validez:</strong> {datos?.validez || '15 días'}</p>
                  <p><strong>Estado:</strong> 
                    <span style={{
                      background: '#2563eb',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '15px',
                      fontSize: '0.9rem',
                      marginLeft: '0.5rem'
                    }}>
                      {datos?.estado || 'Pendiente'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Descripción si existe */}
            {datos?.descripcion && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  borderBottom: '3px solid #2563eb', 
                  paddingBottom: '0.5rem', 
                  color: '#2563eb',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  Descripción
                </h3>
                <div style={{
                  background: '#eff6ff',
                  padding: '1rem',
                  borderRadius: '8px',
                  borderLeft: '4px solid #2563eb',
                  lineHeight: '1.6'
                }}>
                  {datos.descripcion}
                </div>
              </div>
            )}

            {/* Tabla de productos */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                borderBottom: '3px solid #2563eb', 
                paddingBottom: '0.5rem', 
                color: '#2563eb',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Productos Cotizados
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
                  <tr style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Producto</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Cantidad</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Precio Unit.</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {datos?.productos && datos.productos.map((producto, index) => (
                    <tr key={index} style={{ 
                      borderBottom: '1px solid #eee',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : 'white'
                    }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 'bold', color: '#333' }}>
                          {producto.producto?.name || producto.product?.nombre || producto.nombre || 'Producto sin nombre'}
                        </div>
                        {(producto.producto?.categoria || producto.product?.categoria) && (
                          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                            {producto.producto.categoria || producto.product.categoria}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                        {producto.cantidad}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        S/. {parseFloat(producto.valorUnitario || producto.precioUnitario || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                        S/. {parseFloat(producto.subtotal || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', 
                    borderTop: '2px solid #2563eb' 
                  }}>
                    <td colSpan="3" style={{ 
                      padding: '1rem', 
                      textAlign: 'right', 
                      fontWeight: 'bold', 
                      fontSize: '1.1rem',
                      color: '#2563eb'
                    }}>
                      TOTAL:
                    </td>
                    <td style={{ 
                      padding: '1rem', 
                      textAlign: 'right', 
                      fontWeight: 'bold', 
                      fontSize: '1.3rem',
                      color: '#2563eb'
                    }}>
                      S/. {(datos?.total || calcularTotal()).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Condiciones de pago */}
            {datos?.condicionesPago && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  borderBottom: '3px solid #2563eb', 
                  paddingBottom: '0.5rem', 
                  color: '#2563eb',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  Condiciones de Pago
                </h3>
                <div style={{
                  background: '#eff6ff',
                  padding: '1rem',
                  borderRadius: '8px',
                  borderLeft: '4px solid #2563eb',
                  lineHeight: '1.6'
                }}>
                  {datos.condicionesPago}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{
              marginTop: '3rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
              borderRadius: '8px',
              textAlign: 'center',
              borderTop: '3px solid #2563eb'
            }}>
              <div style={{ 
                fontSize: '1.1rem', 
                fontWeight: 'bold', 
                color: '#2563eb',
                marginBottom: '0.5rem'
              }}>
                JLA Global Company
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Gracias por su preferencia • Cotización válida por {datos?.validez || '15 días'}
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
              <h3 style={{ marginBottom: '1rem', color: '#2563eb' }}>
                <i className="fa-solid fa-envelope" style={{ marginRight: '0.5rem' }}></i>
                Enviar Cotización por Correo
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Correo del destinatario:
                </label>
                <input
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Asunto:
                </label>
                <input
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Mensaje:
                </label>
                <textarea
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
                  onClick={enviarPorCorreo}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  <i className="fa-solid fa-envelope" style={{ marginRight: '0.5rem' }}></i>
                  Enviar Cotización
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}