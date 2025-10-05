import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import '../App.css';
import Fijo from '../components/Fijo';
import NavCompras from '../components/NavCompras';

// CSS inyectado para diseño avanzado
const advancedStyles = `
  .orden-compra-advanced-table {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #e5e7eb;
  }
  
  .orden-compra-header-section {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    padding: 20px 25px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .orden-compra-table-container {
    overflow: auto;
  }
  
  .orden-compra-advanced-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  
  .orden-compra-advanced-table thead tr {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-bottom: 2px solid #e5e7eb;
  }
  
  .orden-compra-advanced-table thead th {
    padding: 16px 12px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 13px;
    letter-spacing: 0.5px;
  }
  
  .orden-compra-advanced-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }
  
  .orden-compra-advanced-table tbody tr:hover {
    background-color: #f8fafc;
  }
  
  .orden-compra-advanced-table tbody td {
    padding: 16px 12px;
    color: #4b5563;
    font-weight: 500;
  }
  
  .orden-numero-link {
    color: #6366f1;
    text-decoration: none;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
    font-weight: 600;
    display: inline-block;
  }
  
  .orden-numero-link:hover {
    background: rgba(99, 102, 241, 0.1);
    text-decoration: underline;
  }
  
  .orden-estado-pendiente {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    color: #d97706;
    border: none;
    border-radius: 8px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);
  }
  
  .orden-estado-pendiente:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(217, 119, 6, 0.3);
  }
  
  .orden-estado-completada {
    background: #dcfce7;
    color: #16a34a;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }
  
  .orden-estado-cancelada {
    background: #fee2e2;
    color: #dc2626;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }
  
  .orden-action-btn {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    color: #1e40af;
    border: none;
    border-radius: 8px;
    padding: 8px 10px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(30, 64, 175, 0.2);
    margin-right: 6px;
  }
  
  .orden-action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(30, 64, 175, 0.3);
  }
  
  .orden-action-btn.delete {
    background: linear-gradient(135deg, #fee2e2, #fecaca);
    color: #dc2626;
    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
  }
  
  .orden-action-btn.delete:hover {
    box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
  }
  
  .orden-empty-state {
    text-align: center;
    padding: 80px 20px;
  }
  
  .orden-empty-icon {
    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
    border-radius: 50%;
    padding: 25px;
    margin: 0 auto 20px auto;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

// Inyectar estilos
if (!document.getElementById('orden-compra-advanced-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'orden-compra-advanced-styles';
  styleSheet.textContent = advancedStyles;
  document.head.appendChild(styleSheet);
}

export default function OrdenCompra() {
  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productosProveedor, setProductosProveedor] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [modalDetallesVisible, setModalDetallesVisible] = useState(false);
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [errores, setErrores] = useState({});
  const [nuevaOrden, setNuevaOrden] = useState({
    productos: [],
    condicionesPago: "Contado",
    estado: 'Pendiente',
    solicitadoPor: '',
    proveedor: '',
    proveedorId: ''
  });
  const [modalConfirmacionVisible, setModalConfirmacionVisible] = useState(false);
  const [ordenAConfirmar, setOrdenAConfirmar] = useState(null);

  const [ordenEditando, setOrdenEditando] = useState({
    _id: '',
    productos: [],
    condicionesPago: "Contado",
    estado: 'Pendiente',
    solicitadoPor: '',
    proveedor: '',
    proveedorId: ''
  });

  const [productoTemp, setProductoTemp] = useState({
    producto: '',
    descripcion: '',
    cantidad: 1,
    valorUnitario: 0,
    descuento: 0,
    productoId: ''
  });

  const [productoEditando, setProductoEditando] = useState({
    producto: '',
    descripcion: '',
    cantidad: 1,
    valorUnitario: 0,
    descuento: 0,
    index: null,
    productoId: ''
  });

  // Función para obtener órdenes de compra
  const fetchOrdenes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/ordenes-compra', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setOrdenes(data.data || data);
      else Swal.fire('Error', data.message || 'No se pudieron cargar las órdenes', 'error');
    } catch {
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  };

  // Función para obtener proveedores
  const fetchProveedores = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/proveedores', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-access-token': token
        }
      });

      const data = await res.json();

      if (data.success) {
        setProveedores(data.data || data.proveedores || data);
      } else if (data.proveedores) {
        setProveedores(data.proveedores);
      } else {
        console.error('Formato de respuesta inesperado:', data);
      }
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
      console.log('Buscando productos para proveedor ID:', proveedorId);

      const token = localStorage.getItem('token');

      // Cargar TODOS los productos
      const res = await fetch('http://localhost:5000/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-access-token': token
        }
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log('Todos los productos cargados:', data);

      // Obtener el array de productos (diferentes estructuras posibles)
      let todosProductos = [];

      if (data.products) {
        todosProductos = data.products;
      } else if (data.data) {
        todosProductos = data.data;
      } else if (Array.isArray(data)) {
        todosProductos = data;
      }

      console.log('Productos extraídos:', todosProductos);

      // Filtrar productos por proveedor
      const productosFiltrados = todosProductos.filter(producto => {
        console.log('Analizando producto:', {
          nombre: producto.name,
          proveedor: producto.proveedor,
          tipo: typeof producto.proveedor
        });

        // Diferentes formas en que puede estar el proveedor
        const proveedorProducto = producto.proveedor;

        // Caso 1: proveedor es objeto con _id
        if (proveedorProducto && typeof proveedorProducto === 'object' && proveedorProducto._id) {
          const coincide = proveedorProducto._id === proveedorId;
          console.log('Caso objeto con _id:', coincide);
          return coincide;
        }
        // Caso 2: proveedor es string ID
        else if (proveedorProducto && typeof proveedorProducto === 'string') {
          const coincide = proveedorProducto === proveedorId;
          console.log('Caso string ID:', coincide);
          return coincide;
        }
        // Caso 3: proveedor es objeto con id (sin underscore)
        else if (proveedorProducto && typeof proveedorProducto === 'object' && proveedorProducto.id) {
          const coincide = proveedorProducto.id === proveedorId;
          console.log('Caso objeto con id:', coincide);
          return coincide;
        }
        // Caso 4: campo proveedorId directo
        else if (producto.proveedorId) {
          const coincide = producto.proveedorId === proveedorId;
          console.log('Caso proveedorId:', coincide);
          return coincide;
        }

        console.log('No coincide');
        return false;
      });

      console.log('Productos filtrados encontrados:', productosFiltrados);
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
    fetchOrdenes();
    fetchProveedores();

    // Debug: Ver estructura de productos
    const debugProductos = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/products', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-access-token': token
          }
        });
        const data = await res.json();
        console.log('=== ESTRUCTURA DE PRODUCTOS ===', data);

        if (data.products && data.products.length > 0) {
          console.log('=== PRIMER PRODUCTO DETALLADO ===', data.products[0]);
        }
      } catch (error) {
        console.error('Error en debug:', error);
      }
    };

    debugProductos();
  }, []);

  // Función para agregar producto desde la lista desplegable (AGREGAR)
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
      descuento: productoTemp.descuento,
      valorTotal: valorTotal,
      productoId: productoSeleccionado._id
    };

    setNuevaOrden({
      ...nuevaOrden,
      productos: [...nuevaOrden.productos, nuevoProducto]
    });

    // Resetear el formulario temporal
    setProductoTemp({
      producto: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      productoId: ''
    });

    
  };

  // Función para agregar producto en edición (EDITAR)
  const agregarProductoEdicion = () => {
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
      descuento: productoTemp.descuento,
      valorTotal: valorTotal,
      productoId: productoSeleccionado._id
    };

    setOrdenEditando({
      ...ordenEditando,
      productos: [...ordenEditando.productos, nuevoProducto]
    });

    // Resetear el formulario temporal
    setProductoTemp({
      producto: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      productoId: ''
    });

    Swal.fire({
      icon: 'success',
      title: 'Producto agregado',
      text: `${productoSeleccionado.name || productoSeleccionado.nombre} se ha agregado a la orden`,
      timer: 1500,
      showConfirmButton: false
    });
  };

  // Cuando se selecciona un proveedor (AGREGAR)
  const handleProveedorChange = async (e) => {
    const proveedorId = e.target.value;
    const proveedorSeleccionado = proveedores.find(p => p._id === proveedorId);

    setNuevaOrden({
      ...nuevaOrden,
      proveedor: proveedorSeleccionado ? proveedorSeleccionado.nombre : '',
      proveedorId: proveedorId,
      productos: [] // Limpiar productos al cambiar proveedor
    });

    setProductoTemp({
      producto: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      productoId: ''
    });

    if (proveedorId) {
      await fetchProductosPorProveedor(proveedorId);
    } else {
      setProductosProveedor([]);
    }
  };

  // Cuando se selecciona un proveedor (EDITAR)
  const handleProveedorChangeEditar = async (e) => {
    const proveedorId = e.target.value;
    const proveedorSeleccionado = proveedores.find(p => p._id === proveedorId);

    setOrdenEditando({
      ...ordenEditando,
      proveedor: proveedorSeleccionado ? proveedorSeleccionado.nombre : '',
      proveedorId: proveedorId
    });

    if (proveedorId) {
      await fetchProductosPorProveedor(proveedorId);
    } else {
      setProductosProveedor([]);
    }
  };

  // Cuando se selecciona un producto de la lista desplegable (AGREGAR)
  const handleProductoChange = (e) => {
    const productoId = e.target.value;

    if (!productoId) {
      setProductoTemp({
        producto: '',
        descripcion: '',
        cantidad: 1,
        valorUnitario: 0,
        descuento: 0,
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
        descuento: 0,
        productoId: productoSeleccionado._id
      });
    }
  };

  // Cuando se selecciona un producto de la lista desplegable (EDITAR)
  const handleProductoChangeEditar = (e) => {
    const productoId = e.target.value;

    if (!productoId) {
      setProductoTemp({
        producto: '',
        descripcion: '',
        cantidad: 1,
        valorUnitario: 0,
        descuento: 0,
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
        descuento: 0,
        productoId: productoSeleccionado._id
      });
    }
  };

  // Obtener órdenes pendientes para mostrar en la tabla
  const ordenesPendientes = ordenes.filter(orden => orden.estado === 'Pendiente');

  const verDetallesOrden = (orden) => {
    setOrdenSeleccionada(orden);
    setModalDetallesVisible(true);
  };

  const abrirModalEditar = async (orden) => {
    const proveedorEncontrado = proveedores.find(p => p.nombre === orden.proveedor);

    setOrdenEditando({
      _id: orden._id,
      numeroOrden: orden.numeroOrden,
      productos: orden.productos ? [...orden.productos] : [],
      condicionesPago: orden.condicionesPago || "Contado",
      estado: orden.estado || 'Pendiente',
      solicitadoPor: orden.solicitadoPor || '',
      proveedor: orden.proveedor || '',
      proveedorId: proveedorEncontrado ? proveedorEncontrado._id : ''
    });

    if (proveedorEncontrado) {
      await fetchProductosPorProveedor(proveedorEncontrado._id);
    }

    setModalEditarVisible(true);
  };

  const eliminarOrden = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esto eliminará la orden permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/ordenes-compra/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Eliminado', 'La orden ha sido eliminada correctamente', 'success');
        fetchOrdenes();
      } else {
        Swal.fire('Error', data.message || 'No se pudo eliminar', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  };

  // Función para verificar stock antes de completar
const verificarStockDisponible = async (productos) => {
  const verificaciones = await Promise.all(
    productos.map(async (item) => {
      const productoId = item.productoId || item.producto?._id || item.producto;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/products/${productoId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const producto = data.product || data.data || data;
        
        return {
          producto: item.producto,
          stockActual: producto.stock || 0,
          cantidadOrden: item.cantidad,
          stockDespues: (producto.stock || 0) + item.cantidad,
          suficiente: true // Siempre suficiente para órdenes de compra
        };
      } catch (error) {
        return {
          producto: item.producto,
          error: error.message,
          suficiente: false
        };
      }
    })
  );
  
  return verificaciones;
};

  // Función para marcar orden como completada - CORREGIDA
  const marcarComoCompletada = async (orden) => {
    const confirm = await Swal.fire({
      title: '¿Confirmar orden de compra?',
      text: `Esta acción completará la orden ${orden.numeroOrden} y actualizará el stock de los productos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, completar orden',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545'
    });

    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');

      // 1. Completar la orden en el backend (esto actualiza el stock)
      const resCompletar = await fetch(`http://localhost:5000/api/ordenes-compra/${orden._id}/completar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const dataCompletar = await resCompletar.json();

      if (!dataCompletar.success) {
        throw new Error(dataCompletar.message || 'No se pudo completar la orden');
      }


      // Mostrar resultado (solo una vez, ya que el backend crea la compra y elimina la orden)
      Swal.fire({
        title: '¡Éxito!',
        html: `
        <div>
          <p><strong>✅ Orden de compra completada correctamente</strong></p>
          <p><strong>Número:</strong> ${orden.numeroOrden}</p>
          <p><strong>Stock actualizado para ${orden.productos.length} producto(s)</strong></p>
          <div style="margin-top: 10px; background: #f8f9fa; padding: 10px; border-radius: 5px;">
            <strong>Productos recibidos:</strong><br>
            ${orden.productos.map(p => `• ${p.producto}: ${p.cantidad} unidades`).join('<br>')}
          </div>
        </div>
      `,
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

      // Actualizar la lista de órdenes
      fetchOrdenes();

    } catch (error) {
      console.error('Error al completar la orden:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'No se pudo completar la orden. Verifica la conexión con el servidor.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const abrirModalAgregar = () => {
    setModalAgregarVisible(true);
    setNuevaOrden({
      productos: [],
      condicionesPago: "Contado",
      estado: 'Pendiente',
      solicitadoPor: '',
      proveedor: '',
      proveedorId: ''
    });
    setProductoTemp({
      producto: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      productoId: ''
    });
    setProductosProveedor([]);
    setErrores({});
  };

  const calcularValorTotalProducto = (p) => {
    const subtotal = p.cantidad * p.valorUnitario;
    const descuento = p.descuento || 0;
    return subtotal - descuento;
  };

  const agregarProducto = () => {
    if (!productoTemp.producto || productoTemp.cantidad < 1 || productoTemp.valorUnitario < 0) {
      Swal.fire('Error', 'Los campos Producto, Cantidad y Valor Unitario son obligatorios y no pueden ser negativos.', 'error');
      return;
    }

    const valorTotal = calcularValorTotalProducto(productoTemp);
    const nuevoProducto = {
      producto: productoTemp.producto,
      descripcion: productoTemp.descripcion,
      cantidad: productoTemp.cantidad,
      valorUnitario: productoTemp.valorUnitario,
      descuento: productoTemp.descuento,
      valorTotal: valorTotal,
      productoId: productoTemp.productoId
    };

    setNuevaOrden({
      ...nuevaOrden,
      productos: [...nuevaOrden.productos, nuevoProducto]
    });

    setProductoTemp({
      producto: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      productoId: ''
    });
  };

  const eliminarProducto = (index) => {
    const nuevosProductos = [...nuevaOrden.productos];
    nuevosProductos.splice(index, 1);
    setNuevaOrden({ ...nuevaOrden, productos: nuevosProductos });
  };

  // Funciones para editar productos
  const editarProducto = (index) => {
    const producto = ordenEditando.productos[index];
    setProductoEditando({
      ...producto,
      index: index,
      productoId: producto.productoId 
    });
  };

  const actualizarProducto = () => {
    if (!productoEditando.producto || productoEditando.cantidad < 1 || productoEditando.valorUnitario < 0) {
      Swal.fire('Error', 'Los campos Producto, Cantidad y Valor Unitario son obligatorios y no pueden ser negativos.', 'error');
      return;
    }

    const valorTotal = calcularValorTotalProducto(productoEditando);
    const productoActualizado = {
      producto: productoEditando.producto,
      descripcion: productoEditando.descripcion,
      cantidad: productoEditando.cantidad,
      valorUnitario: productoEditando.valorUnitario,
      descuento: productoEditando.descuento,
      valorTotal: valorTotal,
      productoId: productoEditando.productoId 
    };

    const nuevosProductos = [...ordenEditando.productos];
    nuevosProductos[productoEditando.index] = productoActualizado;

    setOrdenEditando({
      ...ordenEditando,
      productos: nuevosProductos
    });

    setProductoEditando({
      producto: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      index: null,
      productoId: ''
    });
  };

  const eliminarProductoEdicion = (index) => {
    const nuevosProductos = ordenEditando.productos.filter((_, i) => i !== index);
    setOrdenEditando({
      ...ordenEditando,
      productos: nuevosProductos
    });
  };

  // Función para calcular totales (genérica)
  const calcularTotales = (productos) => {
    const subtotal = productos.reduce((acc, p) => acc + (p.valorTotal || 0), 0);
    const impuestos = subtotal * 0.19;
    const total = subtotal + impuestos;
    return { subtotal, impuestos, total };
  };

  // Función específica para orden existente
  const calcularTotalesOrden = (productos) => {
    const subtotal = productos.reduce((acc, p) => {
      const valorProducto = (p.cantidad || 0) * (p.valorUnitario || p.precioUnitario || 0);
      const descuento = p.descuento || 0;
      return acc + (valorProducto - descuento);
    }, 0);
    const impuestos = subtotal * 0.19;
    const total = subtotal + impuestos;
    return { subtotal, impuestos, total };
  };

  const guardarOrden = async () => {
    if (nuevaOrden.productos.length === 0) {
      Swal.fire('Error', 'Debes agregar al menos un producto.', 'error');
      return;
    }

    if (!nuevaOrden.solicitadoPor) {
      Swal.fire('Error', 'Debes ingresar quién solicita la orden.', 'error');
      return;
    }

    if (!nuevaOrden.proveedor) {
      Swal.fire('Error', 'Debes seleccionar un proveedor.', 'error');
      return;
    }

    const { subtotal, impuestos, total } = calcularTotales(nuevaOrden.productos);

    const ordenCompleta = {
      numeroOrden: `OC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      proveedor: nuevaOrden.proveedor,
      productos: nuevaOrden.productos,
      subtotal: subtotal,
      impuestos: impuestos,
      total: total,
      condicionesPago: nuevaOrden.condicionesPago,
      estado: nuevaOrden.estado,
      solicitadoPor: nuevaOrden.solicitadoPor,
      fechaOrden: new Date()
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/ordenes-compra', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ordenCompleta)
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire('¡Éxito!', 'Orden de compra creada correctamente', 'success');
        cerrarModalAgregar();
        fetchOrdenes();
      } else {
        Swal.fire('Error', data.message || 'No se pudo crear la orden', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  };

  const validarOrdenEdicion = (orden) => {
    const nuevosErrores = {};

    if (!orden.proveedor) nuevosErrores.proveedor = 'Seleccione un proveedor';
    if (!orden.solicitadoPor.trim()) nuevosErrores.solicitadoPor = 'Ingrese el solicitante';
    if (orden.productos.length === 0) nuevosErrores.productos = 'Agregue al menos un producto';

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const actualizarOrden = async () => {
    if (!validarOrdenEdicion(ordenEditando)) {
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
      return;
    }

    if (!ordenEditando.solicitadoPor) {
      Swal.fire('Error', 'Debes ingresar quién solicita la orden.', 'error');
      return;
    }

    if (!ordenEditando.proveedor) {
      Swal.fire('Error', 'Debes seleccionar un proveedor.', 'error');
      return;
    }

    const { subtotal, impuestos, total } = calcularTotales(ordenEditando.productos);

    const ordenActualizada = {
      proveedor: ordenEditando.proveedor,
      productos: ordenEditando.productos,
      subtotal: subtotal,
      impuestos: impuestos,
      total: total,
      condicionesPago: ordenEditando.condicionesPago,
      estado: ordenEditando.estado,
      solicitadoPor: ordenEditando.solicitadoPor
    };

    try {
      setCargando(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/ordenes-compra/${ordenEditando._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ordenActualizada)
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire('¡Éxito!', 'Orden de compra actualizada correctamente', 'success');
        cerrarModalEditar();
        fetchOrdenes();
      } else {
        Swal.fire('Error', data.message || 'No se pudo actualizar la orden', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    } finally {
      setCargando(false);
    }
  };

  const cerrarModalAgregar = () => {
    setModalAgregarVisible(false);
    setNuevaOrden({
      productos: [],
      condicionesPago: "Contado",
      estado: 'Pendiente',
      solicitadoPor: '',
      proveedor: '',
      proveedorId: ''
    });
    setProductoTemp({ producto: '', descripcion: '', cantidad: 1, valorUnitario: 0, descuento: 0, productoId: '' });
    setProductosProveedor([]);
    setErrores({});
  };

  const cerrarModalEditar = () => {
    setModalEditarVisible(false);
    setOrdenEditando({
      _id: '',
      productos: [],
      condicionesPago: "Contado",
      estado: 'Pendiente',
      solicitadoPor: '',
      proveedor: '',
      proveedorId: ''
    });
    setProductoEditando({
      producto: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      index: null,
      productoId: ''
    });
    setProductosProveedor([]);
    setErrores({});
  };

  const cerrarModalDetalles = () => {
    setModalDetallesVisible(false);
    setOrdenSeleccionada(null);
  };

  // Función para hacer el modal movible
  const hacerModalMovible = () => {
    const modal = document.getElementById('modalMovible');
    if (!modal) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const dragMouseDown = (e) => {
      e = e || window.event;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };

    const elementDrag = (e) => {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      modal.style.top = (modal.offsetTop - pos2) + "px";
      modal.style.left = (modal.offsetLeft - pos1) + "px";
    };

    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
    };

    const header = modal.querySelector('.modal-header-realista');
    if (header) {
      header.onmousedown = dragMouseDown;
    }
  };

  useEffect(() => {
    if (modalDetallesVisible) {
      setTimeout(hacerModalMovible, 100);
    }
  }, [modalDetallesVisible]);

  const abrirModalConfirmacion = (orden) => {
    setOrdenAConfirmar(orden);
    setModalConfirmacionVisible(true);
  };

  const confirmarCompletada = async () => {
    if (ordenAConfirmar) {
      try {
        await marcarComoCompletada(ordenAConfirmar);
        setModalConfirmacionVisible(false);
        setOrdenAConfirmar(null);
      } catch (error) {
        console.error('Error al completar la orden:', error);
      }
    }
  };

  const cancelarConfirmacion = () => {
    setModalConfirmacionVisible(false);
    setOrdenAConfirmar(null);
  };

  return (
    <div>
      <Fijo />
      <div className="content">
        <NavCompras />
        <div className="contenido-modulo">
          {/* Encabezado profesional */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '300px',
              height: '300px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              zIndex: 1
            }}></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <i className="fa-solid fa-file-invoice-dollar" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                  </div>
                  <div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '700' }}>
                      Órdenes de Compra
                    </h2>
                    <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                      Gestiona y supervisa las órdenes de compra a proveedores
                    </p>
                  </div>
                </div>
                <div>
                  <button 
                    onClick={abrirModalAgregar}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                    }}
                  >
                    <i className="fa-solid fa-plus"></i>
                    Agregar Orden de Compra
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas avanzadas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-file-invoice-dollar" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {ordenes.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Total Órdenes
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-clock" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {ordenesPendientes.length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Órdenes Pendientes
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-check-circle" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    {ordenes.filter(o => o.estado === 'Completada').length}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Órdenes Completadas
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '16px',
              padding: '25px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-dollar-sign" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                    ${ordenes.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()}
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    Valor Total Órdenes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de órdenes mejorada */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
              padding: '20px 25px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: '12px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-table" style={{ color: 'white', fontSize: '16px' }}></i>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#1f2937', fontSize: '1.3rem', fontWeight: '600' }}>
                    Lista de Órdenes de Compra
                  </h4>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    Mostrando {ordenesPendientes.length} órdenes pendientes
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-hashtag" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                      #
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-file-invoice" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                      NÚMERO ORDEN
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-truck" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                      PROVEEDOR
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-dollar-sign" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                      TOTAL
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-calendar" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                      FECHA
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-user" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                      SOLICITADO POR
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-flag" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                      ESTADO
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-cogs" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ordenesPendientes.map((orden, index) => (
                    <tr key={orden._id} 
                        style={{
                          borderBottom: '1px solid #f3f4f6',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                      <td style={{ padding: '16px 12px', fontWeight: '600', color: '#6366f1' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <button
                          onClick={() => verDetallesOrden(orden)}
                          className="orden-numero-link"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#6366f1',
                            textDecoration: 'none',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            transition: 'all 0.2s ease',
                            fontWeight: '600',
                            display: 'inline-block',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(99, 102, 241, 0.1)';
                            e.target.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'none';
                            e.target.style.textDecoration = 'none';
                          }}
                        >
                          {orden.numeroOrden}
                        </button>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{
                          background: '#fef3c7',
                          color: '#d97706',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-block'
                        }}>
                          {orden.proveedor || 'No especificado'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px', fontWeight: '600', color: '#1f2937' }}>
                        ${orden.total?.toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                        {new Date(orden.fechaOrden).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                        {orden.solicitadoPor || 'No especificado'}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        {orden.estado === 'Pendiente' ? (
                          <button
                            onClick={() => abrirModalConfirmacion(orden)}
                            style={{
                              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                              color: '#d97706',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 8px rgba(217, 119, 6, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 4px rgba(217, 119, 6, 0.2)';
                            }}
                          >
                            Pendiente
                          </button>
                        ) : (
                          <span style={{
                            background: orden.estado === 'Completada' ? '#dcfce7' : '#fee2e2',
                            color: orden.estado === 'Completada' ? '#16a34a' : '#dc2626',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'inline-block'
                          }}>
                            {orden.estado}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => abrirModalEditar(orden)}
                            title="Editar orden"
                            style={{
                              background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                              color: '#1e40af',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(30, 64, 175, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 8px rgba(30, 64, 175, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 4px rgba(30, 64, 175, 0.2)';
                            }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button 
                            onClick={() => eliminarOrden(orden._id)}
                            title="Eliminar orden"
                            style={{
                              background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                              color: '#dc2626',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.2)';
                            }}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {ordenesPendientes.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '20px'
                        }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                            borderRadius: '50%',
                            padding: '25px',
                            marginBottom: '10px'
                          }}>
                            <i className="fa-solid fa-file-invoice-dollar" style={{ 
                              fontSize: '3.5rem', 
                              color: '#9ca3af'
                            }}></i>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <h5 style={{ 
                              color: '#6b7280', 
                              margin: '0 0 12px 0',
                              fontSize: '1.2rem',
                              fontWeight: '600'
                            }}>
                              No hay órdenes pendientes
                            </h5>
                            <p style={{ 
                              color: '#9ca3af', 
                              margin: 0, 
                              fontSize: '14px',
                              lineHeight: '1.5'
                            }}>
                              No se encontraron órdenes de compra pendientes
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal para agregar nueva orden */}
          {modalAgregarVisible && (
            <div className="modal-overlay">
              <div className="modal-realista modal-lg" style={{ maxWidth: '900px' }}>
                <div className="modal-header-realista">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h5>
                      <i className="fa-solid fa-file-invoice-dollar" style={{ marginRight: '10px' }}></i>
                      Nueva Orden de Compra
                    </h5>
                    <button className="modal-close-realista" onClick={cerrarModalAgregar}>&times;</button>
                  </div>
                </div>

                <div className="modal-body" style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
                  {/* Información Básica */}
                  <div className="modal-section">
                    <h6>
                      <i className="fa-solid fa-info-circle" style={{ marginRight: '8px' }}></i>
                      Información de la Orden
                    </h6>
                    <div className="form-grid">
                      <div className="form-group-profesional">
                        <label className="form-label-profesional">Proveedor *</label>
                        <select
                          value={nuevaOrden.proveedorId || ''}
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
                        {errores.proveedor && <span style={{ color: '#e74c3c', fontSize: '0.8rem' }}>{errores.proveedor}</span>}
                      </div>

                      <div className="form-group-profesional">
                        <label className="form-label-profesional">Solicitado Por *</label>
                        <input
                          type="text"
                          value={nuevaOrden.solicitadoPor}
                          onChange={e => setNuevaOrden({ ...nuevaOrden, solicitadoPor: e.target.value })}
                          required
                          className="form-input-profesional"
                          placeholder="Nombre del solicitante"
                        />
                        {errores.solicitadoPor && <span style={{ color: '#e74c3c', fontSize: '0.8rem' }}>{errores.solicitadoPor}</span>}
                      </div>

                      <div className="form-group-profesional">
                        <label className="form-label-profesional">Condiciones de Pago</label>
                        <select
                          value={nuevaOrden.condicionesPago}
                          onChange={e => setNuevaOrden({ ...nuevaOrden, condicionesPago: e.target.value })}
                          className="form-input-profesional"
                        >
                          <option value="Contado">Contado</option>
                          <option value="Crédito 15 días">Crédito 15 días</option>
                          <option value="Crédito 30 días">Crédito 30 días</option>
                          <option value="Crédito 60 días">Crédito 60 días</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Selección de Productos */}
                  <div className="modal-section">
                    <h6>
                      <i className="fa-solid fa-cart-plus" style={{ marginRight: '8px' }}></i>
                      Agregar Productos
                    </h6>

                    {nuevaOrden.proveedorId ? (
                      <>
                        <div className="form-group-profesional">
                          <label className="form-label-profesional">
                            Producto *
                            {cargandoProductos && (
                              <small style={{ marginLeft: '10px', color: '#3498db' }}>
                                <i className="fa-solid fa-spinner fa-spin"></i> Cargando productos...
                              </small>
                            )}
                          </label>

                          <select
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
                              <i className="fa-solid fa-info-circle" style={{ marginRight: '5px' }}></i>
                              Este proveedor no tiene productos asociados. Por favor, regístrelos en el módulo de Gestión de Productos.
                            </div>
                          )}
                        </div>

                        <div className="form-grid">
                          <div className="form-group-profesional">
                            <label className="form-label-profesional">Descripción</label>
                            <input
                              value={productoTemp.descripcion}
                              onChange={e => setProductoTemp({ ...productoTemp, descripcion: e.target.value })}
                              className="form-input-profesional"
                              placeholder="Descripción del producto"
                              disabled
                            />
                          </div>

                          <div className="form-group-profesional">
                            <label className="form-label-profesional">Cantidad *</label>
                            <input
                              type="number"
                              min="1"
                              value={productoTemp.cantidad}
                              onChange={e => setProductoTemp({ ...productoTemp, cantidad: Number(e.target.value) })}
                              required
                              className="form-input-profesional"
                            />
                          </div>

                          <div className="form-group-profesional">
                            <label className="form-label-profesional">Valor Unitario *</label>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                              <input
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

                          <div className="form-group-profesional">
                            <label className="form-label-profesional">Descuento</label>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={productoTemp.descuento}
                                onChange={e => setProductoTemp({ ...productoTemp, descuento: Number(e.target.value) })}
                                className="form-input-profesional"
                                style={{ paddingLeft: '30px' }}
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
                              Agregar Producto
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
                  {nuevaOrden.productos.length > 0 && (
                    <div className="modal-section">
                      <h6>
                        <i className="fa-solid fa-list-check" style={{ marginRight: '8px' }}></i>
                        Productos en la Orden ({nuevaOrden.productos.length})
                      </h6>
                      <div className="table-responsive">
                        <table className="table-profesional">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th>Descripción</th>
                              <th>Cantidad</th>
                              <th>Valor Unit.</th>
                              <th>Descuento</th>
                              <th>Total</th>
                              <th>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {nuevaOrden.productos.map((p, i) => (
                              <tr key={i}>
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
                                  {p.descuento > 0 ? (
                                    <span style={{ color: '#e74c3c', fontWeight: '600' }}>
                                      -${p.descuento.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#95a5a6' }}>$0</span>
                                  )}
                                </td>
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
                  {nuevaOrden.productos.length > 0 && (
                    <div className="totales-destacados">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Subtotal</div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                            ${calcularTotales(nuevaOrden.productos).subtotal.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>IVA (19%)</div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                            ${calcularTotales(nuevaOrden.productos).impuestos.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Total</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f39c12' }}>
                            ${calcularTotales(nuevaOrden.productos).total.toLocaleString()}
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
                        {nuevaOrden.productos.length} producto(s) agregado(s)
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        className="btn-profesional"
                        onClick={cerrarModalAgregar}
                        style={{ background: '#95a5a6', color: 'white' }}
                      >
                        <i className="fa-solid fa-times"></i>
                        Cancelar
                      </button>
                      <button
                        className="btn-profesional btn-success-profesional"
                        onClick={guardarOrden}
                        disabled={nuevaOrden.productos.length === 0}
                      >
                        <i className="fa-solid fa-check"></i>
                        Guardar Orden
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal para editar orden */}
          {modalEditarVisible && (
            <div className="modal-overlay">
              <div className="modal-realista modal-lg" style={{ maxWidth: '900px' }}>
                <div className="modal-header-realista">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h5>
                      <i className="fa-solid fa-edit" style={{ marginRight: '10px' }}></i>
                      Editar Orden de Compra: <span style={{ color: '#f39c12' }}>{ordenEditando.numeroOrden}</span>
                    </h5>
                    <button className="modal-close-realista" onClick={cerrarModalEditar}>&times;</button>
                  </div>
                </div>

                <div className="modal-body" style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
                  {/* Información Básica */}
                  <div className="modal-section">
                    <h6>
                      <i className="fa-solid fa-info-circle" style={{ marginRight: '8px' }}></i>
                      Información de la Orden
                    </h6>
                    <div className="form-grid">
                      <div className="form-group-profesional">
                        <label className="form-label-profesional">Proveedor *</label>
                        <select
                          value={ordenEditando.proveedorId}
                          onChange={handleProveedorChangeEditar}
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
                        {errores.proveedor && <span style={{ color: '#e74c3c', fontSize: '0.8rem' }}>{errores.proveedor}</span>}
                      </div>

                      <div className="form-group-profesional">
                        <label className="form-label-profesional">Solicitado Por *</label>
                        <input
                          type="text"
                          value={ordenEditando.solicitadoPor}
                          onChange={e => setOrdenEditando({ ...ordenEditando, solicitadoPor: e.target.value })}
                          required
                          className="form-input-profesional"
                          placeholder="Nombre del solicitante"
                        />
                        {errores.solicitadoPor && <span style={{ color: '#e74c3c', fontSize: '0.8rem' }}>{errores.solicitadoPor}</span>}
                      </div>

                      <div className="form-group-profesional">
                        <label className="form-label-profesional">Condiciones de Pago</label>
                        <select
                          value={ordenEditando.condicionesPago}
                          onChange={e => setOrdenEditando({ ...ordenEditando, condicionesPago: e.target.value })}
                          className="form-input-profesional"
                        >
                          <option value="Contado">Contado</option>
                          <option value="Crédito 15 días">Crédito 15 días</option>
                          <option value="Crédito 30 días">Crédito 30 días</option>
                          <option value="Crédito 60 días">Crédito 60 días</option>
                        </select>
                      </div>

                      <div className="form-group-profesional">
                        <label className="form-label-profesional">Estado</label>
                        <div>
                          <span className={`badge-profesional ${ordenEditando.estado === 'Pendiente' ? 'badge-pendiente' : 'badge-completada'}`}>
                            {ordenEditando.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selección de Productos para Edición */}
                  <div className="modal-section">
                    <h6>
                      <i className="fa-solid fa-cart-plus" style={{ marginRight: '8px' }}></i>
                      Agregar Nuevos Productos
                    </h6>

                    {ordenEditando.proveedorId ? (
                      <>
                        <div className="form-group-profesional">
                          <label className="form-label-profesional">
                            Producto *
                            {cargandoProductos && (
                              <small style={{ marginLeft: '10px', color: '#3498db' }}>
                                <i className="fa-solid fa-spinner fa-spin"></i> Cargando productos...
                              </small>
                            )}
                          </label>

                          <select
                            value={productoTemp.productoId || ''}
                            onChange={handleProductoChangeEditar}
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
                        </div>

                        <div className="form-grid">
                          <div className="form-group-profesional">
                            <label className="form-label-profesional">Descripción</label>
                            <input
                              value={productoTemp.descripcion}
                              onChange={e => setProductoTemp({ ...productoTemp, descripcion: e.target.value })}
                              className="form-input-profesional"
                              placeholder="Descripción del producto"
                              disabled
                            />
                          </div>

                          <div className="form-group-profesional">
                            <label className="form-label-profesional">Cantidad *</label>
                            <input
                              type="number"
                              min="1"
                              value={productoTemp.cantidad}
                              onChange={e => setProductoTemp({ ...productoTemp, cantidad: Number(e.target.value) })}
                              required
                              className="form-input-profesional"
                            />
                          </div>

                          <div className="form-group-profesional">
                            <label className="form-label-profesional">Valor Unitario *</label>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                              <input
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

                          <div className="form-group-profesional">
                            <label className="form-label-profesional">Descuento</label>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={productoTemp.descuento}
                                onChange={e => setProductoTemp({ ...productoTemp, descuento: Number(e.target.value) })}
                                className="form-input-profesional"
                                style={{ paddingLeft: '30px' }}
                              />
                            </div>
                          </div>

                          <div className="form-group-profesional" style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                              className="btn-profesional btn-primary-profesional"
                              onClick={agregarProductoEdicion}
                              disabled={!productoTemp.productoId || productoTemp.cantidad < 1}
                            >
                              <i className="fa-solid fa-plus"></i>
                              Agregar Producto
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

                  {/* Lista de Productos Existente */}
                  <div className="modal-section">
                    <h6>
                      <i className="fa-solid fa-list-check" style={{ marginRight: '8px' }}></i>
                      Productos en la Orden ({ordenEditando.productos.length})
                      {errores.productos && <span style={{ color: '#e74c3c', fontSize: '0.8rem', marginLeft: '1rem' }}>{errores.productos}</span>}
                    </h6>

                    {ordenEditando.productos.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table-profesional">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th>Descripción</th>
                              <th>Cantidad</th>
                              <th>Valor Unit.</th>
                              <th>Descuento</th>
                              <th>Total</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ordenEditando.productos.map((p, i) => (
                              <tr key={i} className={productoEditando.index === i ? 'highlighted-row' : ''}>
                                <td>
                                  <strong>{p.producto}</strong>
                                  {productoEditando.index === i && (
                                    <span style={{ color: '#f39c12', marginLeft: '5px', fontSize: '0.8rem' }}>
                                      (Editando)
                                    </span>
                                  )}
                                </td>
                                <td>{p.descripcion || 'N/A'}</td>
                                <td>
                                  <span className="badge-profesional" style={{ background: '#e3f2fd', color: '#1976d2' }}>
                                    {p.cantidad}
                                  </span>
                                </td>
                                <td>${p.valorUnitario?.toLocaleString()}</td>
                                <td>
                                  {p.descuento > 0 ? (
                                    <span style={{ color: '#e74c3c', fontWeight: '600' }}>
                                      -${p.descuento?.toLocaleString() || '0'}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#95a5a6' }}>$0</span>
                                  )}
                                </td>
                                <td>
                                  <strong>${p.valorTotal?.toLocaleString()}</strong>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                                    <button
                                      className="btn-profesional btn-warning-profesional"
                                      onClick={() => editarProducto(i)}
                                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                      disabled={productoEditando.index !== null && productoEditando.index !== i}
                                    >
                                      <i className="fa-solid fa-pen"></i>
                                    </button>
                                    <button
                                      className="btn-profesional btn-danger-profesional"
                                      onClick={() => eliminarProductoEdicion(i)}
                                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                      disabled={productoEditando.index !== null}
                                    >
                                      <i className="fa-solid fa-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
                        <i className="fa-solid fa-cart-shopping" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
                        <p>No hay productos en esta orden. Agrega al menos un producto.</p>
                      </div>
                    )}
                  </div>

                  {/* Resumen de Totales */}
                  {ordenEditando.productos.length > 0 && (
                    <div className="totales-destacados">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Subtotal</div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                            ${calcularTotales(ordenEditando.productos).subtotal.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>IVA (19%)</div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                            ${calcularTotales(ordenEditando.productos).impuestos.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Total</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f39c12' }}>
                            ${calcularTotales(ordenEditando.productos).total.toLocaleString()}
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
                        {ordenEditando.productos.length} producto(s) en la orden
                      </span>
                      {ordenEditando.estado === 'Completada' && (
                        <span className="badge-profesional badge-completada" style={{ marginLeft: '1rem' }}>
                          <i className="fa-solid fa-check"></i> Completada
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        className="btn-profesional"
                        onClick={cerrarModalEditar}
                        style={{ background: '#95a5a6', color: 'white' }}
                      >
                        <i className="fa-solid fa-times"></i>
                        Cancelar
                      </button>
                      <button
                        className="btn-profesional btn-success-profesional"
                        onClick={actualizarOrden}
                        disabled={ordenEditando.productos.length === 0 || cargando}
                      >
                        {cargando ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-check"></i>
                            Actualizar Orden
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Detalles */}
          {modalDetallesVisible && ordenSeleccionada && (
            <div className="modal-overlay">
              <div
                className="modal-realista modal-md"
                style={{
                  maxWidth: '700px',
                  width: '90%',
                  position: 'fixed',
                  cursor: 'move'
                }}
                id="modalMovible"
              >
                <div className="modal-header-realista" style={{ cursor: 'move' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: '0.5rem 1rem'
                  }}>
                    <h5 style={{ margin: 0 }}>
                      <i className="fa-solid fa-file-invoice" style={{ marginRight: '10px' }}></i>
                      Orden: {ordenSeleccionada.numeroOrden}
                    </h5>
                    <button
                      className="modal-close-realista"
                      onClick={cerrarModalDetalles}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#666',
                        padding: '0',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      &times;
                    </button>
                  </div>
                </div>

                <div className="modal-body" style={{ padding: '0', maxHeight: '70vh', overflowY: 'auto' }}>
                  {/* Encabezado de la orden */}
                  <div style={{
                    background: 'linear-gradient(135deg, #2c3e50, #34495e)',
                    color: 'white',
                    padding: '1.5rem',
                    borderBottom: '3px solid #f39c12'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                          ORDEN DE COMPRA
                        </h2>
                        <p style={{ margin: '0', opacity: '0.9', fontSize: '1rem' }}>
                          N°: <strong>{ordenSeleccionada.numeroOrden}</strong>
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          background: 'rgba(255,255,255,0.1)',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                          <p style={{ margin: '0', fontSize: '0.8rem', opacity: '0.8' }}>Fecha</p>
                          <p style={{ margin: '0', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            {new Date(ordenSeleccionada.fechaOrden).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información de la orden */}
                  <div style={{ padding: '1.5rem' }}>
                    {/* Información básica */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <h6 style={{ color: '#2c3e50', marginBottom: '0.5rem', borderBottom: '1px solid #ecf0f1', paddingBottom: '0.25rem' }}>
                          <i className="fa-solid fa-truck" style={{ marginRight: '8px' }}></i>
                          Proveedor
                        </h6>
                        <p style={{ margin: '0', fontWeight: '500' }}>{ordenSeleccionada.proveedor || 'No especificado'}</p>
                      </div>

                      <div>
                        <h6 style={{ color: '#2c3e50', marginBottom: '0.5rem', borderBottom: '1px solid #ecf0f1', paddingBottom: '0.25rem' }}>
                          <i className="fa-solid fa-user" style={{ marginRight: '8px' }}></i>
                          Solicitado Por
                        </h6>
                        <p style={{ margin: '0', fontWeight: '500' }}>{ordenSeleccionada.solicitadoPor || 'No especificado'}</p>
                      </div>

                      <div>
                        <h6 style={{ color: '#2c3e50', marginBottom: '0.5rem', borderBottom: '1px solid #ecf0f1', paddingBottom: '0.25rem' }}>
                          <i className="fa-solid fa-credit-card" style={{ marginRight: '8px' }}></i>
                          Condiciones de Pago
                        </h6>
                        <p style={{ margin: '0', fontWeight: '500' }}>{ordenSeleccionada.condicionesPago || 'Contado'}</p>
                      </div>

                      <div>
                        <h6 style={{ color: '#2c3e50', marginBottom: '0.5rem', borderBottom: '1px solid #ecf0f1', paddingBottom: '0.25rem' }}>
                          <i className="fa-solid fa-flag" style={{ marginRight: '8px' }}></i>
                          Estado
                        </h6>
                        <span className={`badge ${ordenSeleccionada.estado === 'Pendiente' ? 'bg-warning' : 'bg-success'}`}>
                          {ordenSeleccionada.estado}
                        </span>
                      </div>
                    </div>

                    {/* Lista de productos */}
                    <div>
                      <h6 style={{
                        color: '#2c3e50',
                        marginBottom: '1rem',
                        borderBottom: '2px solid #3498db',
                        paddingBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <i className="fa-solid fa-boxes" style={{ marginRight: '8px' }}></i>
                        Productos ({ordenSeleccionada.productos?.length || 0})
                      </h6>

                      {ordenSeleccionada.productos && ordenSeleccionada.productos.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f8f9fa' }}>
                                <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left' }}>Producto</th>
                                <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left' }}>Descripción</th>
                                <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>Cantidad</th>
                                <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>Valor Unit.</th>
                                <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>Descuento</th>
                                <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ordenSeleccionada.productos.map((producto, index) => (
                                <tr key={index}>
                                  <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                                    <strong>{producto.producto}</strong>
                                  </td>
                                  <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                                    {producto.descripcion || 'N/A'}
                                  </td>
                                  <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                    <span className="badge bg-primary">{producto.cantidad}</span>
                                  </td>
                                  <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>
                                    ${(producto.valorUnitario || producto.precioUnitario || 0).toLocaleString()}
                                  </td>
                                  <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>
                                    ${(producto.descuento || 0).toLocaleString()}
                                  </td>
                                  <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>
                                    ${(producto.valorTotal ||
                                      ((producto.cantidad || 0) * (producto.valorUnitario || producto.precioUnitario || 0) - (producto.descuento || 0))
                                    ).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{
                          textAlign: 'center',
                          padding: '2rem',
                          color: '#7f8c8d',
                          background: '#f8f9fa',
                          borderRadius: '4px',
                          border: '1px dashed #dee2e6'
                        }}>
                          <i className="fa-solid fa-cart-shopping" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
                          <p>No hay productos en esta orden</p>
                        </div>
                      )}
                    </div>

                    {/* Totales */}
                    {ordenSeleccionada.productos && ordenSeleccionada.productos.length > 0 && (
                      <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                        borderRadius: '6px',
                        border: '1px solid #dee2e6'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Subtotal</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50' }}>
                              ${(ordenSeleccionada.subtotal || calcularTotalesOrden(ordenSeleccionada.productos).subtotal).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>IVA (19%)</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50' }}>
                              ${(ordenSeleccionada.impuestos || calcularTotalesOrden(ordenSeleccionada.productos).impuestos).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Total</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#e74c3c' }}>
                              ${(ordenSeleccionada.total || calcularTotalesOrden(ordenSeleccionada.productos).total).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer" style={{
                  padding: '1rem',
                  borderTop: '1px solid #e0e0e0',
                  background: '#f8f9fa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>
                    <i className="fa-solid fa-clock" style={{ marginRight: '5px' }}></i>
                    {new Date(ordenSeleccionada.fechaOrden).toLocaleDateString()}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => window.print()}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      <i className="fa-solid fa-print"></i>
                      Imprimir
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={cerrarModalDetalles}
                      style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.8rem'
                      }}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Confirmación */}
          {modalConfirmacionVisible && ordenAConfirmar && (
            <div className="modal-overlay">
              <div className="modal-realista modal-confirmacion"
                style={{
                  maxWidth: '500px',
                  width: '90%',
                  background: 'linear-gradient(135deg, #ffffff, #f8f9fa)'
                }}>

                <div className="modal-header-realista" style={{
                  background: 'linear-gradient(135deg, #2c3e50, #34495e)',
                  color: 'white',
                  padding: '1.5rem',
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <h5 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                      <i className="fa-solid fa-clipboard-check" style={{ marginRight: '10px' }}></i>
                      Confirmar Orden de Compra
                    </h5>
                    <button
                      className="modal-close-realista"
                      onClick={cancelarConfirmacion}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      &times;
                    </button>
                  </div>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem' }}>
                  <div style={{
                    background: 'white',
                    border: '2px dashed #e0e0e0',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <h6 style={{
                      color: '#2c3e50',
                      borderBottom: '2px solid #3498db',
                      paddingBottom: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      <i className="fa-solid fa-file-lines" style={{ marginRight: '8px' }}></i>
                      Vista Previa de la Orden
                    </h6>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '600', color: '#666' }}>Número:</span>
                        <span style={{ fontWeight: 'bold' }}>{ordenAConfirmar.numeroOrden}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '600', color: '#666' }}>Proveedor:</span>
                        <span>{ordenAConfirmar.proveedor || 'No especificado'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '600', color: '#666' }}>Total:</span>
                        <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>
                          ${ordenAConfirmar.total?.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '600', color: '#666' }}>Solicitado por:</span>
                        <span>{ordenAConfirmar.solicitadoPor || 'No especificado'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '600', color: '#666' }}>Fecha:</span>
                        <span>{new Date(ordenAConfirmar.fechaOrden).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#fffbf0',
                    border: '1px solid #ffeaa7',
                    borderRadius: '6px',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <i className="fa-solid fa-exclamation-triangle" style={{
                      color: '#f39c12',
                      fontSize: '1.5rem',
                      marginBottom: '0.5rem'
                    }}></i>
                    <p style={{ margin: '0', color: '#856404', fontWeight: '500' }}>
                      ¿Estás seguro de que deseas marcar esta orden como <strong>COMPLETADA</strong>?
                    </p>
                    <small style={{ color: '#666', display: 'block', marginTop: '0.5rem' }}>
                      Esta acción no se puede deshacer
                    </small>
                  </div>
                </div>

                <div className="modal-footer" style={{
                  padding: '1.5rem',
                  borderTop: '1px solid #e0e0e0',
                  background: '#f8f9fa',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  borderBottomLeftRadius: '10px',
                  borderBottomRightRadius: '10px'
                }}>
                  <button
                    onClick={cancelarConfirmacion}
                    className="btn-profesional"
                    style={{
                      background: '#95a5a6',
                      color: 'white',
                      padding: '0.5rem 1.5rem',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fa-solid fa-times" style={{ marginRight: '8px' }}></i>
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarCompletada}
                    className="btn-profesional btn-primary-profesional"
                    style={{
                      background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                      color: 'white',
                      padding: '0.5rem 1.5rem',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(39, 174, 96, 0.3)'
                    }}
                  >
                    <i className="fa-solid fa-check" style={{ marginRight: '8px' }}></i>
                    Marcar como Completada
                  </button>
                </div>
              </div>
            </div>
          )}
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