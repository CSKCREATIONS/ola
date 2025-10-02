import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function AgendarVenta() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [observacion, setObservacion] = useState('');
  const [productosCotizacion, setProductosCotizacion] = useState([]);

useEffect(() => {
  const token = localStorage.getItem('token');

  const cargarDatos = async () => {
    try {
      // 1. Obtener cliente
      const clienteRes = await fetch(`http://localhost:5000/api/clientes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clienteData = await clienteRes.json();
      setCliente(clienteData);

      // 2. Si no es cliente real, actualizarlo
      if (!clienteData.esCliente) {
      await fetch(`http://localhost:5000/api/clientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ esCliente: true })
      });
    }


    } catch (err) {
      console.error('Error al cargar datos de cliente:', err);
    }
  };

  cargarDatos();
}, [id]);
 // 👈 importante que dependa de `id` para que se recargue cuando cambia


const [productosDisponibles, setProductosDisponibles] = useState([]);

useEffect(() => {
  const token = localStorage.getItem('token');
  fetch('http://localhost:5000/api/products', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      setProductosDisponibles(data.data || []);
    })
    .catch(err => console.error('Error al cargar productos:', err));
}, []);



 const handleAgendar = async () => {
  if (!fechaEntrega || productosCotizacion.length === 0) {
    Swal.fire('Campos requeridos', 'Debes tener al menos un producto y una fecha de entrega', 'warning');
    return;
  }

  const token = localStorage.getItem('token');

  const pedido = {
    cliente: id,
    productos: productosCotizacion.map(prod => ({
      product: typeof prod.producto === 'object' ? prod.producto._id : prod.producto,
      cantidad: Number(prod.cantidad),
      precioUnitario: Number(prod.valorUnitario)  // ✅ Asegurar que sea número
    })),
    fechaEntrega,
    observacion
  };



  try {
    const res = await fetch('http://localhost:5000/api/pedidos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(pedido)
    });

    if (res.ok) {
      Swal.fire('Éxito', 'Pedido agendado correctamente', 'success');
      navigate('/PedidosAgendados');
    } else {
      Swal.fire('Error', 'No se pudo agendar el pedido', 'error');
    }
  } catch (error) {
    console.error('Error al agendar pedido:', error);
    Swal.fire('Error', 'Error al agendar el pedido', 'error');
  }
};


useEffect(() => {
  const fetchUltimaCotizacion = async () => {
    if (!id || productosDisponibles.length === 0) return; // 👈 Esperar a que los productos estén cargados

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/cotizaciones/ultima?cliente=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const cotizacion = await res.json();
        console.log('✅ Cotización para cliente:', id, cotizacion);

        if (cotizacion?.productos?.length > 0) {
          const productosConPrecio = cotizacion.productos.map((p) => {
            const productoInfo = productosDisponibles.find(prod => {
              const idProducto = typeof p.producto === 'object' ? p.producto._id : p.producto;
              return prod._id === idProducto;
            });
            
            // Usar el precio de la cotización, no del producto
            const precioUnitario = p.valorUnitario || productoInfo?.price || 0;
            
            return {
              ...p,
              valorUnitario: precioUnitario,
              producto: {
                ...productoInfo,
                _id: p.producto
              }
            };
          });

          setProductosCotizacion(productosConPrecio);
        } else {
          setProductosCotizacion([]);
        }

      } else {
        setProductosCotizacion([]);
        console.warn('⚠️ No hay cotización para este cliente');
      }
    } catch (error) {
      console.error('❌ Error al traer cotización:', error);
      setProductosCotizacion([]);
    }
  };

  fetchUltimaCotizacion();
}, [id, productosDisponibles]); // 👈 Dependencias correctas


  return (
    <div>
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="contenido-modulo">
          <div className='encabezado-modulo'>
            <h3>Agendar Pedido</h3>
          </div>
          <br />

          {!cliente ? (
            <p>Cargando cliente...</p>
          ) : (
            <>
              <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Ciudad</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Fecha entrega</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><input className="cuadroTexto" value={cliente.nombre} readOnly /></td>
                  <td><input className="cuadroTexto" value={cliente.ciudad} readOnly /></td>
                  <td><input className="cuadroTexto" value={cliente.telefono} readOnly /></td>
                  <td><input className="cuadroTexto" value={cliente.correo} readOnly /></td>
                  <td><input className="cuadroTexto" type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} /></td>
                  <td><input className="cuadroTexto" value={observacion} onChange={e => setObservacion(e.target.value)} /></td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ marginTop: '20px' }}>Productos de la cotización</h3>
            <br />
            {productosCotizacion.length === 0 ? (
              <p style={{ color: 'red' }}>No hay productos disponibles para esta cotización.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                  </tr>
                </thead>
                <tbody>
                {productosCotizacion.map((prod, index) => {
                const nombreProducto = prod.producto?.name || 'Nombre no disponible';
                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td><input className="cuadroTexto" value={nombreProducto} readOnly /></td>
                    <td><input className="cuadroTexto" value={prod.cantidad} readOnly /></td>
                    <td><input className="cuadroTexto" value={prod.valorUnitario} readOnly/></td>
                  </tr>
                );
              })}

                  </tbody>
                </table>
              )}
              <br />
              <button className="btn btn-success" onClick={handleAgendar}>Agendar pedido</button>
            </>
            
          )}
          
        </div>
        
      </div>
    </div>
  );
}

