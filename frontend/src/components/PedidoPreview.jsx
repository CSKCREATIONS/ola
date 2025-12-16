import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './FormatoCotizacion.css';
import api from '../api/axiosConfig';
import {
  getStoredUser,
} from '../utils/emailHelpers';
import sanitizeHtml from '../utils/sanitizeHtml';
import { makeCotizacionTemplate } from '../utils/emailTemplates';
import { calcularSubtotalProducto, calcularTotales } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

export default function FormatoCotizacion({ datos, onClose, onEmailSent }) {
  const navigate = useNavigate();
  // Obtener usuario logueado
  const usuario = getStoredUser();
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  
  // Función para verificar si el HTML está vacío o contiene solo etiquetas vacías
  // Uses a DOM parser when available (browser) and a linear-time fallback to avoid regex backtracking.
  const isEmptyHTML = (html) => {
    if (!html || html.trim() === '') return true;

    // If running in a browser, use innerText/textContent which is reliable and fast.
    if (typeof document !== 'undefined' && document.createElement) {
      try {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const text = (tmp.textContent || tmp.innerText || '').trim();
        return text === '';
      } catch (error_) {
        // fallthrough to safe fallback
        console.warn('isEmptyHTML: DOM parsing failed, using fallback stripper', error_);
      }
    }

    // Fallback: linear-time HTML tag stripper (no regex/backtracking)
        let inTag = false;
        let out = '';
        for (const ch of html) {
          if (ch === '<') {
            inTag = true;
            continue;
          }
          if (ch === '>') {
            inTag = false;
            continue;
          }
          if (!inTag) out += ch;
        }
        return out.trim() === '';
  };
  
  // Estados para el formulario de envío de correo
  const [correo, setCorreo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Función para abrir modal con datos actualizados
  const abrirModalEnvio = () => {
    // Calcular total dinámicamente usando helper compartido

// Fecha de emisión: usar datos.fecha si existe, si no mostrar 'N/A'

// Actualizar datos autocompletados cada vez que se abre el modal
// Usar la plantilla compartida para asunto/mensaje y prellenar el correo destinatario
    setCorreo(datos?.cliente?.correo || '');
    const { asunto: tplAsunto, mensaje: tplMensaje } = makeCotizacionTemplate(datos, usuario);
    setAsunto(tplAsunto);
    setMensaje(tplMensaje);
    setShowEnviarModal(true);
  };

  // Función para enviar por correo
  const enviarPorCorreo = async () => {
    try {
      const response = await api.post(`/api/pedidos/${datos._id}/enviar-correo`, {
        pedidoId: datos._id,
        correoDestino: correo,
        asunto: asunto,
        mensaje: mensaje
      });

      if (response && response.status >= 200 && response.status < 300) {
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'El pedido ha sido enviado exitosamente'
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



  // Obtener Inventario para mostrar el nombre
  const productosLista = datos.productosLista || [];

  // Usar datos de la cotización (traídos del backend) para empresa si existen
  // Ejemplo: datos.empresa = { nombre, direccion }
  console.log("productosLista:", productosLista);

  return (

    <div className="modal-cotizacion-overlay">
      <div className="modal-cotizacion">
        <button className="close-modal" onClick={onClose}>×</button>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className='modal-title'>{datos.codigo ? datos.codigo : ''}</span>
          <div className="botones-cotizacion" style={{ display: 'flex', gap: '18px', justifyContent: 'center', marginBottom: '1rem' }}>
            <button className="btn-cotizacion moderno" title="Editar" onClick={() => { onClose(); navigate('/RegistrarCotizacion', { state: { datos } }); }}>
              <i className="fa-solid fa-pen icon-gap" style={{ fontSize: '1.2rem' }} aria-hidden={true}></i>
              <span>Editar</span>
            </button>
            <button className="btn-cotizacion moderno" title="Remisionar" onClick={() => { }}>
              <i className="fa-solid fa-file-invoice icon-gap" style={{ fontSize: '1.2rem' }} aria-hidden={true}></i>
              <span>Remisionar</span>
            </button>
            <button className="btn-cotizacion moderno" title="Enviar" onClick={abrirModalEnvio}>
              <i className="fa-solid fa-envelope icon-gap" style={{ fontSize: '1rem', color: '#EA4335' }} aria-hidden={true}></i>
              <span>Enviar</span>
            </button>
            <button className="btn-cotizacion moderno" title="Imprimir" onClick={() => {
              // Método seguro de impresión sin manipular DOM (evita el uso de document.write)
              const printContent = document.getElementById('pdf-pedido-block');
              const newWindow = globalThis.window.open('', '_blank');
              const contentHtml = `
                <html>
                  <head>
                    <title>Pedido</title>
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
                    ${printContent ? printContent.innerHTML : ''}
                  </body>
                </html>
              `;
              try {
                if (newWindow?.document?.documentElement) {
                  // Prefer replacing the documentElement's innerHTML instead of calling document.write
                  newWindow.document.documentElement.innerHTML = contentHtml;
                } else if (newWindow?.document?.body) {
                  // Fallback: set body.innerHTML if documentElement isn't available
                  newWindow.document.body.innerHTML = contentHtml;
                } else {
                  // As a last resort, navigate the new window to a Blob URL containing the HTML
                  // This avoids using document.write (which is deprecated in some typings/environments).
                  try {
                    const blob = new Blob([contentHtml], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    newWindow.location.href = url;
                    // Revoke the object URL after a short delay to free resources
                    setTimeout(() => {
                      try {
                        if (url && typeof URL.revokeObjectURL === 'function') {
                          URL.revokeObjectURL(url);
                        }
                      } catch (error_) {
                        console.warn('Failed to revoke object URL', error_);
                      }
                    }, 5000);
                  } catch (e) {
                    // If Blob creation/navigation fails, log the error and attempt to open using a data URL as a safer fallback
                    console.warn('Blob creation/navigation failed, attempting data URL fallback', e);
                    try {
                      newWindow.location.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(contentHtml);
                    } catch (err) {
                      // Give up gracefully; the window might remain blank
                      console.warn('Unable to populate new window content via Blob or data URL', err);
                    }
                  }
                }
                newWindow?.focus();
                newWindow?.print();
                // Delay closing to allow print dialog to appear in some browsers
                setTimeout(() => { try { newWindow?.close(); } catch (e) { console.warn('Failed to close print window', e); } }, 500);
              } catch (err) {
                console.error('Error printing content', err);
                // If printing fails, ensure the window is closed gracefully
                try { newWindow?.close(); } catch (e) { console.warn('Failed to close print window', e); }
              }
            }} aria-label="Imprimir">
              <i className="fa-solid fa-print icon-gap" style={{ fontSize: '1.2rem' }} aria-hidden={true}></i>
            </button>
          </div>
        </div>

        {/* Contenido PDF debajo */}
        <div
          className="pdf-cotizacion"
          id="pdf-pedido-block"
          style={{ display: 'flex', flexDirection: 'column', background: '#fff', padding: '2rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginTop: '1rem', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', justifyContent: 'center' }}
          onCopy={e => e.preventDefault()}
        >
          <div className="cotizacion-encabezado">
            <h2>Cotizacion</h2>
            <div className="cot-fecha">
              <p style={{ fontSize: '0.7rem' }}>{datos.codigo ? datos.codigo : ''}</p>
              <p style={{ fontSize: '0.7rem' }}>{datos.fecha || ''}</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
            <div>
              <p>{datos.cliente?.nombre || ''}</p>
              <p>{datos.cliente?.direccion || ''} - {datos.cliente?.ciudad || ''}</p>
              <p> {datos.cliente?.telefono || ''}</p>
              <p> {datos.cliente?.correo || ''}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p>{datos.empresa?.nombre || ''}</p>
              <p>{datos.empresa?.direccion || ''}</p>
              <p>
                {usuario.firstName || ''} {usuario.surname || ''}
              </p>
            </div>
          </div>
          <hr />
          {!isEmptyHTML(datos.descripcion) && (
            <>
                  <div className="descripcion-cotizacion">
                    <h4>Descripción cotización</h4>
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(datos.descripcion) }} />
                  </div>
              <hr />
            </>
          )}
          <table className="tabla-cotizacion">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Valor Unitario</th>
                <th>% Descuento</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {datos.productos.map((p, idx) => (
                <tr key={p._id || p.producto?.id || p.nombre || idx}>
                  <td>{p.producto?.name || p.nombre || 'Desconocido'}</td>
                  <td>{p.descripcion}</td>
                  <td>{p.cantidad}</td>
                  <td>{p.valorUnitario}</td>
                  <td>{p.descuento}</td>
                  <td>{formatCurrency(calcularSubtotalProducto(p), { withSymbol: false })}</td>
                </tr>
              ))}
              {/* Fila de total */}
              {datos.productos.length > 0 && (
                <tr>
                  <td colSpan={4}></td>
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>Total</td>
                  <td style={{ fontWeight: 'bold' }}>
                    {formatCurrency(calcularTotales(datos.productos).total, { withSymbol: false })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <hr />
          {!isEmptyHTML(datos.condicionesPago) && (
            <>
              <div className="condiciones-pago">
                <h4>Condiciones de pago</h4>
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(datos.condicionesPago) }} />
              </div>
              <br />
            </>
          )}
          <div>Cotizacion valida por 15 dias</div>
        </div>

      </div>

      {showEnviarModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="modal-cotizacion" style={{ maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
              <button className="close-modal" onClick={() => setShowEnviarModal(false)}>×</button>
              <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>
                📧 Enviar Pedido por Correo
              </h3>
              
              {/* Información del pedido */}
              <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', marginBottom: '1rem', fontSize: '14px' }}>
                <strong>Pedido:</strong> {datos?.numeroPedido || datos?.codigo}<br/>
                <strong>Cliente:</strong> {datos?.cliente?.nombre}<br/>
                <strong>Total:</strong> {formatCurrency(calcularTotales(datos?.productos || []).total)}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="input-pedido-preview-1" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  📬 Correo destinatario:
                </label>
                <input id="input-pedido-preview-1" 
                  type="email" 
                  className="cuadroTexto" 
                  value={correo} 
                  onChange={e => setCorreo(e.target.value)} 
                  style={{ width: '100%' }}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="input-pedido-preview-2" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  📝 Asunto:
                </label>
                <input id="input-pedido-preview-2" 
                  type="text" 
                  className="cuadroTexto" 
                  value={asunto} 
                  onChange={e => setAsunto(e.target.value)} 
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="input-pedido-preview-3" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  💬 Mensaje:
                </label>
                <textarea id="input-pedido-preview-3" 
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

FormatoCotizacion.propTypes = {
  datos: PropTypes.shape({
    _id: PropTypes.string,
    numeroPedido: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    codigo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fecha: PropTypes.string,
    fechaEntrega: PropTypes.string,
    descripcion: PropTypes.string,
    condicionesPago: PropTypes.string,
    estado: PropTypes.string,
    empresa: PropTypes.shape({
      nombre: PropTypes.string,
      direccion: PropTypes.string,
    }),
    cliente: PropTypes.shape({
      nombre: PropTypes.string,
      direccion: PropTypes.string,
      ciudad: PropTypes.string,
      telefono: PropTypes.string,
      correo: PropTypes.string,
    }),
    productos: PropTypes.arrayOf(
      PropTypes.shape({
        producto: PropTypes.shape({ name: PropTypes.string }),
        nombre: PropTypes.string,
        descripcion: PropTypes.string,
        cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        valorUnitario: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        descuento: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      })
    ),
    productosLista: PropTypes.arrayOf(PropTypes.object),
    total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    enviadoCorreo: PropTypes.bool,
  }),
  onClose: PropTypes.func,
  onEmailSent: PropTypes.func,
};

FormatoCotizacion.defaultProps = {
  datos: { productos: [] },
  onClose: () => {},
  onEmailSent: null,
};

