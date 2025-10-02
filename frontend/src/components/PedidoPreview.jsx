import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FormatoCotizacion.css';

export default function FormatoCotizacion({ datos, onClose }) {
  const navigate = useNavigate();
  // Obtener usuario logueado
  const usuario = JSON.parse(localStorage.getItem('user') || '{}');
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [correo, setCorreo] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');



  // Obtener lista de productos para mostrar el nombre
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
              <i className="fa-solid fa-pen" style={{ fontSize: '1.2rem', marginRight: '8px' }}></i>
              Editar
            </button>
            <button className="btn-cotizacion moderno" title="Remisionar" onClick={() => { }}>
              <i className="fa-solid fa-file-invoice" style={{ fontSize: '1.2rem', marginRight: '8px' }}></i>
              Remisionar
            </button>
            <button className="btn-cotizacion moderno" title="Enviar" onClick={() => setShowEnviarModal(true)}>
              <i className="fa-solid fa-envelope" style={{ fontSize: '1rem', color: '#EA4335', marginRight: '6px' }}></i>
              Enviar
            </button>
            <button className="btn-cotizacion moderno" title="Imprimir" onClick={() => {
              // Método seguro de impresión sin manipular DOM
              const printContent = document.getElementById('pdf-pedido-block');
              const newWindow = window.open('', '_blank');
              newWindow.document.write(`
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
          <div className="descripcion-cotizacion">
            <h4>Descripción cotización</h4>
            <div dangerouslySetInnerHTML={{ __html: datos.descripcion }} />
          </div>
          <hr />
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
                <tr key={idx}>
                  <td>{p.producto?.name || p.nombre || 'Desconocido'}</td>
                  <td>{p.descripcion}</td>
                  <td>{p.cantidad}</td>
                  <td>{p.valorUnitario}</td>
                  <td>{p.descuento}</td>
                  <td>{
                    (() => {
                      const cantidad = parseFloat(p.cantidad) || 0;
                      const valorUnitario = parseFloat(p.valorUnitario) || 0;
                      const descuento = parseFloat(p.descuento) || 0;
                      const subtotal = cantidad * valorUnitario * (1 - descuento / 100);
                      return subtotal.toFixed(2);
                    })()
                  }</td>
                </tr>
              ))}
              {/* Fila de total */}
              {datos.productos.length > 0 && (
                <tr>
                  <td colSpan={4}></td>
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>Total</td>
                  <td style={{ fontWeight: 'bold' }}>
                    {datos.productos
                      .reduce((acc, p) => {
                        const cantidad = parseFloat(p.cantidad) || 0;
                        const valorUnitario = parseFloat(p.valorUnitario) || 0;
                        const descuento = parseFloat(p.descuento) || 0;
                        const subtotal = cantidad * valorUnitario * (1 - descuento / 100);
                        return acc + subtotal;
                      }, 0)
                      .toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <hr />
          <div className="condiciones-pago">
            <h4>Condiciones de pago</h4>
            <div dangerouslySetInnerHTML={{ __html: datos.condicionesPago }} />
          </div>
          <br />
          <div>Cotizacion valida por 15 dias</div>
        </div>

      </div>

      {showEnviarModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="modal-cotizacion" style={{ maxWidth: 400 }}>
              <button className="close-modal" onClick={() => setShowEnviarModal(false)}>×</button>
              <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Enviar cotización</h3>
              <div style={{ marginBottom: '1rem' }}>
                <label>Correo destinatario:</label>
                <input type="email" className="cuadroTexto" value={correo} onChange={e => setCorreo(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Asunto:</label>
                <input type="text" className="cuadroTexto" value={asunto} onChange={e => setAsunto(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Mensaje:</label>
                <textarea className="cuadroTexto" value={mensaje} onChange={e => setMensaje(e.target.value)} style={{ width: '100%', minHeight: '80px' }} />
              </div>
              <button className="btn-enviar-modal" style={{ width: '100%' }} onClick={() => { }}>Enviar</button>
            </div>
          </div>
        )}
    </div>
  );
}
