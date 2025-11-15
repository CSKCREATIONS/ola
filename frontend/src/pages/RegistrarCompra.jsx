import React, { useEffect, useState } from 'react';
/* global globalThis */
import api from '../api/axiosConfig';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavCompras from '../components/NavCompras';
import OrderDetailsHeader from '../components/OrderDetailsHeader';
import { randomString } from '../utils/secureRandom';
import { calcularTotales as calcularTotalesShared } from '../utils/calculations';

export default function RegistrarCompra() {
  const [proveedores, setProveedores] = useState([]);
  const [productosProveedor, setProductosProveedor] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [nuevaCompra, setNuevaCompra] = useState({
    productos: [],
    proveedor: '',
    proveedorId: '',
    registradoPor: ''
  });

  const [productoTemp, setProductoTemp] = useState({
    producto: '',
    descripcion: '',
    cantidad: 1,
    valorUnitario: 0,
    productoId: ''
  });

  // Función para obtener proveedores
  const fetchProveedores = async () => {
    try {
      const res = await api.get('/api/proveedores');
      const data = res.data;
      if (data.success) setProveedores(data.data || data.proveedores || data);
      else if (data.proveedores) setProveedores(data.proveedores);
      else setProveedores(data || []);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    }
  };

  // Función para obtener productos por proveedor
  const fetchProductosPorProveedor = async (proveedorId) => {
    if (!proveedorId) {
      setProductosProveedor([]);
      return;
    }

    try {
  setCargandoProductos(true);
  // Cargar TODOS los productos
      const res = await api.get('/api/products');
      const data = res.data;

      // Obtener el array de productos (diferentes estructuras posibles)
      let todosProductos = [];

      if (data.products) {
        todosProductos = data.products;
      } else if (data.data) {
        todosProductos = data.data;
      } else if (Array.isArray(data)) {
        todosProductos = data;
      }

      // Filtrar productos por proveedor
      const productosFiltrados = todosProductos.filter(producto => {
        const proveedorProducto = producto.proveedor;

        // Caso 1: proveedor es objeto con _id
        if (proveedorProducto && typeof proveedorProducto === 'object' && proveedorProducto._id) {
          return proveedorProducto._id === proveedorId;
        }
        // Caso 2: proveedor es string ID
        else if (proveedorProducto && typeof proveedorProducto === 'string') {
          return proveedorProducto === proveedorId;
        }
        // Caso 3: proveedor es objeto con id (sin underscore)
        else if (proveedorProducto && typeof proveedorProducto === 'object' && proveedorProducto.id) {
          return proveedorProducto.id === proveedorId;
        }
        // Caso 4: campo proveedorId directo
        else if (producto.proveedorId) {
          return producto.proveedorId === proveedorId;
        }

        return false;
      });

      setProductosProveedor(productosFiltrados);

    } catch (error) {
      console.error('Error al cargar productos:', error);
      Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
      setProductosProveedor([]);
    } finally {
      setCargandoProductos(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  // Cuando se selecciona un proveedor
  const handleProveedorChange = async (e) => {
    const proveedorId = e.target.value;
    const proveedorSeleccionado = proveedores.find(p => p._id === proveedorId);

    setNuevaCompra({
      ...nuevaCompra,
      proveedor: proveedorSeleccionado ? proveedorSeleccionado.nombre : '',
      proveedorId: proveedorId,
      productos: [] // Limpiar productos al cambiar proveedor
    });

    setProductoTemp({
      producto: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      productoId: ''
    });

    if (proveedorId) {
      await fetchProductosPorProveedor(proveedorId);
    } else {
      setProductosProveedor([]);
    }
  };

  // Cuando se selecciona un producto de la lista desplegable
  const handleProductoChange = (e) => {
    const productoId = e.target.value;

    if (!productoId) {
      setProductoTemp({
        producto: '',
        descripcion: '',
        cantidad: 1,
        valorUnitario: 0,
        productoId: ''
      });
      return;
    }

    const productoSeleccionado = productosProveedor.find(p => p._id === productoId);

    if (productoSeleccionado) {
      setProductoTemp({
        producto: productoSeleccionado.name || productoSeleccionado.nombre,
        descripcion: productoSeleccionado.description || productoSeleccionado.descripcion || '',
        cantidad: 1,
        valorUnitario: productoSeleccionado.price || productoSeleccionado.precio || 0,
        productoId: productoSeleccionado._id
      });
    }
  };

  // Función para agregar producto desde la lista desplegable
  const agregarProductoDesdeLista = () => {
    if (!productoTemp.productoId) {
      Swal.fire('Error', 'Por favor selecciona un producto de la lista', 'error');
      return;
    }

    const productoSeleccionado = productosProveedor.find(p => p._id === productoTemp.productoId);

    if (!productoSeleccionado) {
      Swal.fire('Error', 'Producto no encontrado', 'error');
      return;
    }

    const valorTotal = (productoSeleccionado.price || productoSeleccionado.precio || 0) * productoTemp.cantidad;

    const nuevoProducto = {
      producto: productoSeleccionado.name || productoSeleccionado.nombre,
      descripcion: productoSeleccionado.description || productoSeleccionado.descripcion || '',
      cantidad: productoTemp.cantidad,
      valorUnitario: productoSeleccionado.price || productoSeleccionado.precio || 0,
      valorTotal: valorTotal,
      productoId: productoSeleccionado._id
    };

    setNuevaCompra({
      ...nuevaCompra,
      productos: [...nuevaCompra.productos, nuevoProducto]
    });

    // Resetear el formulario temporal
    setProductoTemp({
      producto: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      productoId: ''
    });

    Swal.fire({
      icon: 'success',
      title: 'Producto agregado',
      text: `${productoSeleccionado.name || productoSeleccionado.nombre} se ha agregado a la compra`,
      timer: 1500,
      showConfirmButton: false
    });
  };

  const eliminarProducto = (index) => {
    const nuevosProductos = [...nuevaCompra.productos];
    nuevosProductos.splice(index, 1);
    setNuevaCompra({ ...nuevaCompra, productos: nuevosProductos });
  };

  // Reuse shared calcularTotales and apply IVA (19%) for purchases
  const calcularTotalesCompra = (productos) => {
    try {
      const { subtotal = 0 } = calcularTotalesShared(productos || []);
      const impuestos = Number((subtotal * 0.19).toFixed(2));
      const total = Number((subtotal + impuestos).toFixed(2));
      return { subtotal, impuestos, total };
    } catch (e) {
      console.error('Error calculando totales de compra:', e);
      return { subtotal: 0, impuestos: 0, total: 0 };
    }
  };

  // Use shared secure random helper for generating suffixes
  const generarNumeroCompra = () => {
    return `COM-${Date.now()}-${randomString(9)}`;
  };

  const guardarCompra = async () => {
    if (nuevaCompra.productos.length === 0) {
      Swal.fire('Error', 'Debes agregar al menos un producto.', 'error');
      return;
    }

    if (!nuevaCompra.registradoPor) {
      Swal.fire('Error', 'Debes ingresar quién registra la compra.', 'error');
      return;
    }

    if (!nuevaCompra.proveedor) {
      Swal.fire('Error', 'Debes seleccionar un proveedor.', 'error');
      return;
    }

    const { subtotal, impuestos, total } = calcularTotalesCompra(nuevaCompra.productos);

    const compraCompleta = {
      numeroCompra: generarNumeroCompra(),
      proveedor: nuevaCompra.proveedor,
      productos: nuevaCompra.productos,
      subtotal: subtotal,
      impuestos: impuestos,
      total: total,
      registradoPor: nuevaCompra.registradoPor,
      fecha: new Date()
    };

    try {
      const res = await api.post('/api/compras', compraCompleta);
      const data = res.data || res;

      if (data.success) {
        Swal.fire('¡Éxito!', 'Compra registrada correctamente', 'success');
        // Limpiar formulario
        setNuevaCompra({
          productos: [],
          proveedor: '',
          proveedorId: '',
          registradoPor: ''
        });
        setProductoTemp({
          producto: '',
          descripcion: '',
          cantidad: 1,
          valorUnitario: 0,
          productoId: ''
        });
        setProductosProveedor([]);
      } else {
        Swal.fire('Error', data.message || 'No se pudo registrar la compra', 'error');
      }
    } catch (error) {
      console.error('Error guardarCompra:', error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  };

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavCompras />
        <div className="contenido-modulo">
          <h3 className='titulo-profesional'>Registrar Compra</h3>
          <br />

          <div className="modal-realista modal-lg" style={{ maxWidth: '900px', position: 'relative', margin: '0 auto', background: 'white', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <OrderDetailsHeader
              iconClass="fa-solid fa-cart-plus"
              title="Nueva Compra"
              subtitle="Registrar compra sin orden de compra previa"
            />

            <div className="modal-body" style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Información Básica */}
              <div className="modal-section">
                <h6>
                  <i className="fa-solid fa-info-circle icon-gap"></i>
                  <span>Información de la Compra</span>
                </h6>
                <div className="form-grid">
                  <div className="form-group-profesional">
                    <label className="form-label-profesional" htmlFor="input-registrarCompra-proveedor">Proveedor *</label>
                    <select
                      id="input-registrarCompra-proveedor"
                      value={nuevaCompra.proveedorId || ''}
                      onChange={handleProveedorChange}
                      required
                      className="form-input-profesional"
                    >
                      <option value="">Seleccione un proveedor</option>
                      {proveedores.map(proveedor => (
                        <option key={proveedor._id} value={proveedor._id}>
                          {proveedor.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-profesional">
                    <label className="form-label-profesional" htmlFor="input-registrarCompra-registradoPor">Registrado Por *</label>
                    <input
                      id="input-registrarCompra-registradoPor"
                      type="text"
                      value={nuevaCompra.registradoPor}
                      onChange={e => setNuevaCompra({ ...nuevaCompra, registradoPor: e.target.value })}
                      required
                      className="form-input-profesional"
                      placeholder="Nombre de quien registra"
                    />
                  </div>
                </div>
              </div>

              {/* Selección de Productos */}
              <div className="modal-section">
                <h6>
                  <i className="fa-solid fa-cart-plus icon-gap"></i>
                  <span>Agregar Productos</span>
                </h6>

                {nuevaCompra.proveedorId ? (
                  <>
                    <div className="form-group-profesional">
                      <label className="form-label-profesional" htmlFor="input-registrarCompra-producto">
                        Producto *
                        {cargandoProductos && (
                          <small style={{ marginLeft: '10px', color: '#3498db' }}>
                            <i className="fa-solid fa-spinner fa-spin"></i> Cargando productos...
                          </small>
                        )}
                      </label>

                      <select
                        id="input-registrarCompra-producto"
                        value={productoTemp.productoId || ''}
                        onChange={handleProductoChange}
                        className="form-input-profesional"
                        disabled={cargandoProductos}
                      >
                        <option value="">Seleccione un producto</option>
                        {productosProveedor.length > 0 ? (
                          productosProveedor.map(producto => (
                            <option key={producto._id} value={producto._id}>
                              {producto.name || producto.nombre} -
                              ${(producto.price || producto.precio)?.toLocaleString()} -
                              Stock: {producto.stock || 'N/A'}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            {cargandoProductos ? 'Cargando...' : 'Este proveedor no tiene productos asociados'}
                          </option>
                        )}
                      </select>

                      {productosProveedor.length === 0 && !cargandoProductos && (
                        <div style={{
                          background: '#fff3cd',
                          border: '1px solid #ffeaa7',
                          borderRadius: '4px',
                          padding: '0.75rem',
                          marginTop: '0.5rem',
                          color: '#856404',
                          fontSize: '0.9rem'
                        }}>
                          <i className="fa-solid fa-info-circle icon-gap"></i>
                          <span>Este proveedor no tiene productos asociados. Por favor, regístrelos en el módulo de Gestión de Productos.</span>
                        </div>
                      )}
                    </div>

                    <div className="form-grid">
                      <div className="form-group-profesional">
                          <label className="form-label-profesional" htmlFor="input-registrarCompra-descripcion">Descripción</label>
                          <input
                            id="input-registrarCompra-descripcion"
                            value={productoTemp.descripcion}
                            onChange={e => setProductoTemp({ ...productoTemp, descripcion: e.target.value })}
                            className="form-input-profesional"
                            placeholder="Descripción del producto"
                            disabled
                          />
                        </div>

                      <div className="form-group-profesional">
                        <label className="form-label-profesional" htmlFor="input-registrarCompra-cantidad">Cantidad *</label>
                        <input
                          id="input-registrarCompra-cantidad"
                          type="number"
                          min="1"
                          value={productoTemp.cantidad}
                          onChange={e => setProductoTemp({ ...productoTemp, cantidad: Number(e.target.value) })}
                          required
                          className="form-input-profesional"
                        />
                      </div>

                      <div className="form-group-profesional">
                        <label className="form-label-profesional" htmlFor="input-registrarCompra-valorUnitario">Valor Unitario *</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                          <input
                            id="input-registrarCompra-valorUnitario"
                            type="number"
                            min="0"
                            step="0.01"
                            value={productoTemp.valorUnitario}
                            onChange={e => setProductoTemp({ ...productoTemp, valorUnitario: Number(e.target.value) })}
                            required
                            className="form-input-profesional"
                            style={{ paddingLeft: '30px' }}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="form-group-profesional" style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                          className="btn-profesional btn-primary-profesional"
                          onClick={agregarProductoDesdeLista}
                          disabled={!productoTemp.productoId || productoTemp.cantidad < 1}
                        >
                          <i className="fa-solid fa-plus"></i>
                          <span>Agregar Producto</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{
                    background: '#f8f9fa',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '1rem',
                    textAlign: 'center',
                    color: '#6c757d'
                  }}>
                    <i className="fa-solid fa-hand-pointer" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
                    <p style={{ margin: '0' }}>Seleccione un proveedor para ver sus productos disponibles</p>
                  </div>
                )}
              </div>

              {/* Lista de Productos Agregados */}
              {nuevaCompra.productos.length > 0 && (
                <div className="modal-section">
                  <h6>
                    <i className="fa-solid fa-list-check icon-gap"></i>
                    <span>Productos en la Compra ({nuevaCompra.productos.length})</span>
                  </h6>
                  <div className="table-responsive">
                    <table className="table-profesional">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Descripción</th>
                          <th>Cantidad</th>
                          <th>Valor Unit.</th>
                          <th>Total</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nuevaCompra.productos.map((p, i) => (
                          <tr key={p.productoId || p._id || p.codigo || i}>
                            <td>
                              <strong>{p.producto}</strong>
                            </td>
                            <td>{p.descripcion || 'N/A'}</td>
                            <td>
                              <span className="badge-profesional" style={{ background: '#e3f2fd', color: '#1976d2' }}>
                                {p.cantidad}
                              </span>
                            </td>
                            <td>${p.valorUnitario.toLocaleString()}</td>
                            <td>
                              <strong>${p.valorTotal.toLocaleString()}</strong>
                            </td>
                            <td>
                              <button
                                className="btn-profesional btn-danger-profesional"
                                onClick={() => eliminarProducto(i)}
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Resumen de Totales */}
              {nuevaCompra.productos.length > 0 && (
                <div className="totales-destacados">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Subtotal</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                        ${calcularTotalesCompra(nuevaCompra.productos).subtotal.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>IVA (19%)</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                        ${calcularTotalesCompra(nuevaCompra.productos).impuestos.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Total</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f39c12' }}>
                        ${calcularTotalesCompra(nuevaCompra.productos).total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '1.5rem 2rem', borderTop: '1px solid #e0e0e0', background: '#f8f9fa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                    {nuevaCompra.productos.length} producto(s) agregado(s)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    className="btn-profesional btn-success-profesional"
                    onClick={guardarCompra}
                    disabled={nuevaCompra.productos.length === 0}
                  >
                    <i className="fa-solid fa-check"></i>
                    <span>Registrar Compra</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="custom-footer">
        <p className="custom-footer-text">
          © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}