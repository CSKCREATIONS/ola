import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import CotizacionPreview from '../components/CotizacionPreview';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import '../cotizaciones-modal.css';

// CSS para diseño avanzado
const advancedStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .cotizaciones-container * {
    box-sizing: border-box;
  }
  
  .fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }
  
  .glassmorphism {
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
  }
`;

// Inyectar estilos una sola vez
if (!document.querySelector('#cotizaciones-advanced-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'cotizaciones-advanced-styles';
  styleSheet.textContent = advancedStyles;
  document.head.appendChild(styleSheet);
}

export default function ListaDeCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const modalRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightId, setHighlightId] = useState(null);
  const [blinkOn, setBlinkOn] = useState(false);
  const [pendingHighlightId, setPendingHighlightId] = useState(null);




  const exportarPDF = () => {
    const input = document.getElementById('tabla_cotizaciones');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('listaCotizaciones.pdf');
    });
  };


  const exportToExcel = () => {
    const table = document.getElementById('tabla_cotizaciones');
    if (!table) return;
    const workbook = XLSX.utils.table_to_book(table);
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'listaCotizaciones.xlsx');
  };


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Error', 'Sesión expirada. Vuelve a iniciar sesión.', 'warning');
      return;
    }



    const fetchData = async () => {
      try {
        // Fetch cotizaciones with better error handling
        const cotRes = await fetch('http://localhost:5000/api/cotizaciones', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        let cotData = [];
        if (cotRes.ok) {
          try {
            cotData = await cotRes.json();
            if (!Array.isArray(cotData)) {
              console.warn('Cotizaciones data is not an array:', cotData);
              cotData = [];
            }
          } catch (parseError) {
            console.error('Error parsing cotizaciones JSON:', parseError);
            cotData = [];
          }
        } else {
          console.error('Error fetching cotizaciones:', cotRes.status, cotRes.statusText);
          if (cotRes.status === 400) {
            Swal.fire('Advertencia', 'Hay algunos datos corruptos en las cotizaciones. Se mostrarán las cotizaciones válidas.', 'warning');
          }
        }

        // Fetch products
        const prodRes = await fetch('http://localhost:5000/api/products', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        let prodData = [];
        if (prodRes.ok) {
          try {
            const prodResponse = await prodRes.json();
            prodData = Array.isArray(prodResponse.data) ? prodResponse.data : [];
          } catch (parseError) {
            console.error('Error parsing products JSON:', parseError);
            prodData = [];
          }
        }

        setCotizaciones(cotData);
        setProductos(prodData);

      } catch (err) {
        console.error('Error in fetchData:', err);
        Swal.fire('Error', 'No se pudieron cargar algunos datos. La aplicación funcionará con datos limitados.', 'warning');
        // Set empty arrays to prevent crashes
        setCotizaciones([]);
        setProductos([]);
      }
    };

    fetchData();
  }, []);

  // Helper para detectar si una cotización está marcada como agendada.
  const isAgendada = (val) => {
    if (val === true || val === 1) return true;
    if (val === false || val === 0 || val === undefined || val === null) return false;
    if (typeof val === 'string') {
      const s = val.trim().toLowerCase();
      return s === 'true' || s === '1' || s === 'si' || s === 'yes' || s === 'agendada';
    }
    return Boolean(val);
  };

  // Helper para determinar si han pasado al menos 15 días desde la creación/fecha
  const isDeletable = (cot) => {
    try {
      const fechaBase = cot?.createdAt || cot?.fecha;
      if (!fechaBase) return false;
      const ageMs = Date.now() - new Date(fechaBase).getTime();
      const daysOld = Math.floor(ageMs / (24 * 60 * 60 * 1000));
      return daysOld >= 15;
    } catch (err) {
      console.error('Error computing deletable for cotizacion', err);
      return false;
    }
  };

  const handleEliminarCotizacion = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta Cotización se cancelará y no podrás revertirlo',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, mantener',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        (async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/cotizaciones/${id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (!res.ok) {
              const text = await res.text().catch(() => null);
              console.error('Error deleting cotizacion:', res.status, text);
              return Swal.fire('Error', text || 'No se pudo eliminar la cotización.', 'error');
            }

            // Si el backend confirma la eliminación, actualizar estado local
            setCotizaciones(prev => prev.filter(c => c._id !== id));
            Swal.fire('Perfecto', 'Se ha eliminado la cotización.', 'success');
          } catch (err) {
            console.error('Error deleting cotizacion:', err);
            Swal.fire('Error', 'No se pudo eliminar la cotización.', 'error');
          }
        })();
      }
    });
  };

  // Intentar eliminar: primero validar antigüedad (15 días) en el frontend
  const intentarEliminarCotizacion = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return Swal.fire('Error', 'Sesión expirada. Vuelve a iniciar sesión.', 'warning');

      const res = await fetch(`http://localhost:5000/api/cotizaciones/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.error('Error fetching cotizacion for delete check:', res.status, text);
        return Swal.fire('Error', 'No se pudo verificar la cotización antes de eliminar.', 'error');
      }

      const data = await res.json();
      const cot = data.data || data;

      // Determinar fecha base: preferir createdAt, si no existe usar fecha
      const fechaBase = cot.createdAt || cot.fecha;
      if (!fechaBase) return Swal.fire('Error', 'No se puede determinar la fecha de la cotización.', 'error');

      const now = new Date();
      const ageMs = now.getTime() - new Date(fechaBase).getTime();
      const daysOld = Math.floor(ageMs / (24 * 60 * 60 * 1000));
      const minDays = 15;

      if (daysOld < minDays) {
        const daysRemaining = minDays - daysOld;
        return Swal.fire('No permitido', `No es posible eliminar la cotización. Deben pasar al menos ${minDays} días desde su creación. Faltan ${daysRemaining} día(s).`, 'warning');
      }

      // Si cumple, proceder a llamar al handler que muestra confirmación y borra
      handleEliminarCotizacion(id);
    } catch (err) {
      console.error('Error en intentarEliminarCotizacion:', err);
      Swal.fire('Error', 'No se pudo verificar la cotización antes de eliminar.', 'error');
    }
  };

  const guardarEdicion = async () => {
    const token = localStorage.getItem('token');

    // Mostrar loading
    Swal.fire({
      title: 'Guardando cambios...',
      text: 'Por favor espera mientras se actualiza la cotización',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Calcular subtotales antes de guardar
      const cotizacionConSubtotales = {
        ...cotizacionSeleccionada,
        productos: cotizacionSeleccionada.productos?.map(p => ({
          ...p,
          subtotal: calcularSubtotalProducto(p)
        }))
      };

      const res = await fetch(`http://localhost:5000/api/cotizaciones/${cotizacionSeleccionada._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cotizacionConSubtotales)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar los cambios');
      }

      const cotizacionActualizada = await res.json();

      // Actualizar la lista local
      const nuevasCotizaciones = cotizaciones.map(c =>
        c._id === cotizacionSeleccionada._id ? {
          ...cotizacionActualizada.data || cotizacionActualizada,
          ...cotizacionConSubtotales
        } : c
      );
      setCotizaciones(nuevasCotizaciones);

      // Cerrar modal
      setModoEdicion(false);
      setCotizacionSeleccionada(null);

      // Mostrar éxito
      await Swal.fire({
        title: '¡Guardado!',
        text: 'La cotización ha sido actualizada correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error al guardar cotización:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'No se pudo guardar la cotización',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const agregarProducto = () => {
    const nuevoProducto = {
      producto: {
        id: '',
        name: ''
      },
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      subtotal: 0
    };

    const nuevosProductos = [...(cotizacionSeleccionada.productos || []), nuevoProducto];
    setCotizacionSeleccionada({
      ...cotizacionSeleccionada,
      productos: nuevosProductos
    });
  };

  const eliminarProducto = (index) => {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        const nuevosProductos = cotizacionSeleccionada.productos.filter((_, i) => i !== index);
        setCotizacionSeleccionada({
          ...cotizacionSeleccionada,
          productos: nuevosProductos
        });

        Swal.fire({
          title: 'Eliminado',
          text: 'El producto ha sido eliminado',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroEnviado, setFiltroEnviado] = useState('');

  const cotizacionesFiltradas = cotizaciones.filter(cot => {
    const coincideFecha = !filtroFecha || new Date(cot.fecha).toISOString().slice(0, 10) === filtroFecha;
    const coincideCliente = !filtroCliente || cot.cliente?.nombre?.toLowerCase().includes(filtroCliente.toLowerCase());
    const coincideEnviado = !filtroEnviado ||
      (filtroEnviado === 'Si' && cot.enviadoCorreo) ||
      (filtroEnviado === 'No' && !cot.enviadoCorreo);
    return coincideFecha && coincideCliente && coincideEnviado;
  });



  /*** PAGINACIÓN ***/
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = cotizacionesFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(cotizacionesFiltradas.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Si venimos con state desde RegistrarCotizacion: abrir formato y marcar pending highlight
  useEffect(() => {
    if (location && location.state && location.state.abrirFormato && location.state.cotizacion) {
      const cot = location.state.cotizacion;
      setCotizacionSeleccionada(cot);
      setMostrarPreview(true);

      const id = cot._id || cot.id;
      if (id) {
        // Insertar la cotización en la lista si no existe para asegurar que la fila esté renderizada
        setCotizaciones(prev => {
          try {
            if (Array.isArray(prev) && prev.find(p => p._id === id)) return prev;
            return [cot, ...prev];
          } catch (e) {
            return prev;
          }
        });

        // Marcarla como pendiente para que al cerrar el preview se produzca el titileo
        setPendingHighlightId(id);
        // Limpieza eventual del history.state para evitar reaperturas
        try { window.history.replaceState({}, document.title); } catch (e) { /* no-op */ }
      }
    }
  }, [location]);

  // Funciones de cálculo mejoradas
  const calcularSubtotalProducto = (producto) => {
    const cantidad = parseFloat(producto?.cantidad) || 0;
    const precio = parseFloat(producto?.valorUnitario) || 0;
    const descuento = parseFloat(producto?.descuento) || 0;
    return cantidad * precio * (1 - descuento / 100);
  };

  const calcularTotalDescuentos = (productos) => {
    return productos?.reduce((acc, p) => {
      const cantidad = parseFloat(p?.cantidad) || 0;
      const precio = parseFloat(p?.valorUnitario) || 0;
      const descuento = parseFloat(p?.descuento) || 0;
      return acc + (cantidad * precio * descuento / 100);
    }, 0) || 0;
  };

  const calcularTotalFinal = (productos) => {
    return productos?.reduce((acc, p) => acc + calcularSubtotalProducto(p), 0) || 0;
  };

  const subtotal = cotizacionSeleccionada?.productos?.reduce((acc, p) => {
    const cantidad = parseFloat(p?.cantidad) || 0;
    const precio = parseFloat(p?.valorUnitario) || 0;
    return acc + cantidad * precio;
  }, 0) || 0;


  const enviarCorreo = () => {
    Swal.fire('Enviado', 'Correo enviado con éxito (simulado)', 'success');
  };

  const imprimir = () => {
    const printContent = modalRef.current;
    const win = window.open('', '', 'width=800,height=600');
    win.document.write(`
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
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const abrirFormato = (cotizacion) => {
    setCotizacionSeleccionada(cotizacion);
    setModoEdicion(false);
  };

  // Cierra el preview y hace titilar la fila correspondiente por 3s
  const closePreviewAndBlink = () => {
    const cot = cotizacionSeleccionada;
    const id = cot?._id || cot?.id;
    setMostrarPreview(false);
    setCotizacionSeleccionada(null);
    if (!id) return;

    setHighlightId(id);
    setBlinkOn(true);
    let visible = true;
    const interval = setInterval(() => {
      visible = !visible;
      setBlinkOn(visible);
    }, 400);

    setTimeout(() => {
      clearInterval(interval);
      setBlinkOn(false);
      setHighlightId(null);
    }, 3000);
  };

  // Función para manejar cuando se envía un correo y actualizar el estado
  const handleEmailSent = (cotizacionId) => {
    // Actualizar el estado de la cotización en la lista
    setCotizaciones(prevCotizaciones => 
      prevCotizaciones.map(cot => 
        cot._id === cotizacionId 
          ? { ...cot, enviadoCorreo: true }
          : cot
      )
    );
    
    // También actualizar la cotización seleccionada si es la misma
    if (cotizacionSeleccionada && cotizacionSeleccionada._id === cotizacionId) {
      setCotizacionSeleccionada(prev => ({
        ...prev,
        enviadoCorreo: true
      }));
    }
  };

  const abrirEdicion = async (cotizacion) => {
    try {
      // Obtener la cotización completa con sus productos
      const response = await fetch(`http://localhost:5000/api/cotizaciones/${cotizacion._id}`);
      const cotizacionCompleta = await response.json();

      // Si no tiene productos inicializados, crear array vacío
      if (!cotizacionCompleta.productos) {
        cotizacionCompleta.productos = [];
      }

      // Asegurar que el cliente está inicializado
      if (!cotizacionCompleta.cliente) {
        cotizacionCompleta.cliente = {
          nombre: '',
          correo: '',
          telefono: '',
          ciudad: '',
          direccion: ''
        };
      }

      setCotizacionSeleccionada(cotizacionCompleta);
      setModoEdicion(true);
    } catch (error) {
      console.error('Error al cargar cotización:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cargar la información de la cotización',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };


  const limpiarHTML = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };


  return (
    <div className="cotizaciones-container">
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="contenido-modulo">
          {/* Encabezado profesional del módulo */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '15px',
            padding: '25px 30px',
            marginBottom: '30px',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '-30%',
              left: '-5%',
              width: '150px',
              height: '150px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}></div>
            
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <h3 style={{
                    color: 'white',
                    margin: '0 0 8px 0',
                    fontSize: '2rem',
                    fontWeight: '700',
                    letterSpacing: '-0.5px'
                  }}>
                    <i className="fa-solid fa-file-invoice" style={{ marginRight: '12px', fontSize: '1.8rem' }}></i>
                    Lista de Cotizaciones
                  </h3>
                  <p style={{
                    color: 'rgba(255,255,255,0.9)',
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: '400'
                  }}>
                    Gestión completa de cotizaciones comerciales
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => exportToExcel(cotizaciones)}
                    style={{
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '12px 20px', 
                      border: '2px solid rgba(255,255,255,0.3)', 
                      borderRadius: '12px', 
                      background: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontSize: '14px', 
                      fontWeight: '600', 
                      cursor: 'pointer', 
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.3)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.2)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <i className="fa-solid fa-file-excel" style={{ fontSize: '16px' }}></i>
                    <span>Exportar Excel</span>
                  </button>

                  <button
                    onClick={exportarPDF}
                    style={{
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '12px 20px', 
                      border: '2px solid rgba(255,255,255,0.3)', 
                      borderRadius: '12px', 
                      background: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontSize: '14px', 
                      fontWeight: '600', 
                      cursor: 'pointer', 
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.3)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.2)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <i className="fa-solid fa-file-pdf" style={{ fontSize: '16px' }}></i>
                    <span>Exportar PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de filtros avanzado */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '25px',
            marginBottom: '30px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: '12px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa-solid fa-filter" style={{ color: 'white', fontSize: '16px' }}></i>
                </div>
                <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1.3rem', fontWeight: '600' }}>
                  Filtros y Controles
                </h4>
              </div>
              
              <div style={{
                background: '#f8fafc',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fa-solid fa-info-circle" style={{ color: '#3b82f6', fontSize: '14px' }}></i>
                <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                  {cotizacionesFiltradas.length} cotización{cotizacionesFiltradas.length !== 1 ? 'es' : ''} encontrada{cotizacionesFiltradas.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px',
              alignItems: 'end'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#374151', 
                  fontSize: '14px', 
                  fontWeight: '600' 
                }}>
                  <i className="fa-solid fa-calendar" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                  Fecha:
                </label>
                <input 
                  type="date" 
                  value={filtroFecha} 
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    background: 'white',
                    color: '#374151',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#374151', 
                  fontSize: '14px', 
                  fontWeight: '600' 
                }}>
                  <i className="fa-solid fa-user" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                  Cliente:
                </label>
                <input 
                  type="text" 
                  placeholder="Buscar cliente..." 
                  value={filtroCliente} 
                  onChange={(e) => setFiltroCliente(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    background: 'white',
                    color: '#374151',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#374151', 
                  fontSize: '14px', 
                  fontWeight: '600' 
                }}>
                  <i className="fa-solid fa-envelope" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                  Estado de envío:
                </label>
                <select 
                  value={filtroEnviado} 
                  onChange={(e) => setFiltroEnviado(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    background: 'white',
                    color: '#374151',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  <option value="">📋 Todos</option>
                  <option value="Si">✅ Enviados</option>
                  <option value="No">❌ No enviados</option>
                </select>
              </div>
            </div>
          </div>


          {/* Tabla de cotizaciones mejorada */}
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
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '15px'
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
                  <i className="fa-solid fa-list" style={{ color: 'white', fontSize: '16px' }}></i>
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1.3rem', fontWeight: '600' }}>
                    Cotizaciones Registradas
                  </h4>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    Total: {cotizacionesFiltradas.length} cotización{cotizacionesFiltradas.length !== 1 ? 'es' : ''}
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }} id='tabla_cotizaciones'>
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
                      <i className="fa-solid fa-code" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                      CÓDIGO COTIZACIÓN
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
                      FECHA ELABORACIÓN
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
                      CLIENTE
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      <i className="fa-solid fa-envelope" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                      ENVIADO
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
                  {currentItems.map((cot, index) => (
                    <tr key={cot._id} 
                        className={highlightId === cot._id ? (blinkOn ? 'row-blink' : 'row-blink-off') : ''}
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
                      <td style={{ padding: '16px 12px', fontWeight: '600', color: '#4b5563' }}>
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <a
                          style={{ 
                            cursor: 'pointer', 
                            color: '#3b82f6', 
                            textDecoration: 'none',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'color 0.2s ease'
                          }}
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              const res = await fetch(`http://localhost:5000/api/cotizaciones/${cot._id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              if (!res.ok) throw new Error('No se pudo obtener la cotización');
                              const data = await res.json();
                              const cotizacionCompleta = data.data || data;
                              setCotizacionSeleccionada(cotizacionCompleta);
                              setMostrarPreview(true);
                            } catch (err) {
                              Swal.fire('Error', 'No se pudo cargar la cotización completa.', 'error');
                            }
                          }}
                          onMouseEnter={(e) => e.target.style.color = '#1e40af'}
                          onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
                        >
                          {cot.codigo}
                        </a>
                      </td>
                      <td style={{ padding: '16px 12px', color: '#4b5563', fontWeight: '500' }}>
                        {new Date(cot.fecha).toLocaleDateString('es-ES')}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>
                          {cot.cliente?.nombre || 'Sin nombre'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        {cot.enviadoCorreo ? (
                          <span style={{
                            background: '#dcfce7',
                            color: '#16a34a',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className="fa-solid fa-check"></i>
                            SÍ
                          </span>
                        ) : (
                          <span style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className="fa-solid fa-times"></i>
                            NO
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        {cot.agendada ? (
                          <span style={{
                            backgroundColor: '#16a34a',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            <i className="fa-solid fa-calendar-check" style={{ fontSize: '10px' }}></i>
                            AGENDADA
                          </span>
                        ) : (
                          <span style={{
                            backgroundColor: '#0ea5e9',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            <i className="fa-solid fa-clock" style={{ fontSize: '10px' }}></i>
                            PENDIENTE
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {isDeletable(cot) && (
                            <button 
                              onClick={() => intentarEliminarCotizacion(cot._id)}
                              title="Eliminar cotización"
                              style={{
                                background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
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
                          )}
                          
                          {!isAgendada(cot.agendada) && (
                            <button
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token');
                                  const res = await fetch(`http://localhost:5000/api/cotizaciones/${cot._id}`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  if (!res.ok) throw new Error('No se pudo obtener la cotización');
                                  const data = await res.json();
                                  const cotizacionCompleta = data.data || data;
                                  setCotizacionSeleccionada(cotizacionCompleta);
                                  setModoEdicion(true);
                                } catch (err) {
                                  Swal.fire('Error', 'No se pudo cargar la cotización completa.', 'error');
                                }
                              }}
                              title="Editar cotización"
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
                          )}

                          {!isAgendada(cot.agendada) && (
                            <button
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token');
                                  // Obtener cotización completa para asegurar productos y cliente
                                  const res = await fetch(`http://localhost:5000/api/cotizaciones/${cot._id}`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  if (!res.ok) throw new Error('No se pudo obtener la cotización');
                                  const data = await res.json();
                                const cotizacion = data.data || data;

                                const confirm = await Swal.fire({
                                  title: `¿Agendar la cotización '${cotizacion.codigo}' como pedido?`,
                                  icon: 'question',
                                  showCancelButton: true,
                                  confirmButtonText: 'Sí, agendar',
                                  cancelButtonText: 'No'
                                });
                                if (!confirm.isConfirmed) return;


                                const clienteId = (
                                  cotizacion?.cliente?.referencia?._id ||
                                  cotizacion?.cliente?.referencia ||
                                  cot?.cliente?._id ||
                                  cot?.cliente?.referencia?._id ||
                                  cot?.cliente?.referencia
                                );


                                // Mapear productos al formato de pedido
                                const productosPedido = (cotizacion.productos || []).map(p => {
                                  const productId = (p?.producto?.id && (p.producto.id._id || p.producto.id)) || p?.producto;
                                  if (!productId) return null;
                                  const cantidadNum = Number(p?.cantidad);
                                  const precioNum = p?.valorUnitario != null ? Number(p.valorUnitario) : Number(p?.producto?.price);
                                  return {
                                    product: productId,
                                    cantidad: Number.isFinite(cantidadNum) && cantidadNum > 0 ? cantidadNum : 1,
                                    precioUnitario: Number.isFinite(precioNum) ? precioNum : 0,
                                  };
                                }).filter(Boolean);

                                if (productosPedido.length === 0) {
                                  return Swal.fire('Error', 'La cotización no tiene productos.', 'warning');
                                }

                                // Pedir al usuario la fecha de entrega antes de crear el pedido
                                const baseDate = cotizacion.fecha ? new Date(cotizacion.fecha) : new Date();
                                const defaultDate = baseDate.toISOString().slice(0, 10); // YYYY-MM-DD
                                const { value: fechaSeleccionada } = await Swal.fire({
                                  title: 'Seleccione la fecha de entrega',
                                  input: 'date',
                                  inputLabel: 'Fecha de entrega',
                                  inputValue: defaultDate,
                                  showCancelButton: true,
                                  confirmButtonText: 'Confirmar',
                                  cancelButtonText: 'Cancelar'
                                });

                                if (!fechaSeleccionada) {
                                  // Usuario canceló la selección
                                  return;
                                }

                                const fechaEntrega = new Date(fechaSeleccionada).toISOString();

                                const crearRes = await fetch('http://localhost:5000/api/pedidos', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                  },
                                  body: JSON.stringify({
                                    cliente: clienteId,
                                    productos: productosPedido,
                                    fechaEntrega,
                                    observacion: `Agendado desde cotización ${cotizacion.codigo}`,
                                    cotizacionReferenciada: cotizacion._id,
                                    cotizacionCodigo: cotizacion.codigo
                                  })
                                });

                                if (!crearRes.ok) {
                                  const errText = await crearRes.text();
                                  throw new Error(errText || 'No se pudo agendar el pedido');
                                }

                                await crearRes.json();

                                // Actualizar el estado local de la cotización
                                setCotizaciones(prev => prev.map(c =>
                                  c._id === cot._id ? { ...c, agendada: true } : c
                                ));

                                await Swal.fire('Agendado', 'La cotización fue agendada como pedido.', 'success');
                                navigate('/PedidosAgendados');
                              } catch (error) {
                                console.error(error);
                                Swal.fire('Error', error.message || 'Hubo un problema al agendar la cotización', 'error');
                              }
                            }}
                            title="Agendar como pedido"
                            style={{
                              background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                              color: '#16a34a',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 8px rgba(22, 163, 74, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 4px rgba(22, 163, 74, 0.2)';
                            }}
                          >
                            <i className="fa-solid fa-calendar-plus"></i>
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {cotizacionesFiltradas.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '80px 20px' }}>
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
                            <i className="fa-solid fa-file-invoice" style={{ 
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
                              No hay cotizaciones disponibles
                            </h5>
                            <p style={{ 
                              color: '#9ca3af', 
                              margin: 0, 
                              fontSize: '14px',
                              lineHeight: '1.5'
                            }}>
                              No se encontraron cotizaciones con los filtros aplicados
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Paginación mejorada */}
            {totalPages > 1 && (
              <div style={{
                padding: '20px 25px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'center',
                gap: '8px'
              }}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    style={{
                      padding: '8px 16px',
                      border: currentPage === i + 1 ? '2px solid #6366f1' : '2px solid #e5e7eb',
                      borderRadius: '8px',
                      background: currentPage === i + 1 ? '#6366f1' : 'white',
                      color: currentPage === i + 1 ? 'white' : '#4b5563',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== i + 1) {
                        e.target.style.borderColor = '#6366f1';
                        e.target.style.color = '#6366f1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== i + 1) {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.color = '#4b5563';
                      }
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


      {mostrarPreview && cotizacionSeleccionada && (
        <CotizacionPreview 
          datos={cotizacionSeleccionada} 
          onClose={closePreviewAndBlink}
          onEmailSent={handleEmailSent}
        />
      )}

      {/* Modal de Edición */}
      {modoEdicion && cotizacionSeleccionada && (
        <div className="cotizacion-modal-container">
          <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModoEdicion(false);
              setCotizacionSeleccionada(null);
            }
          }}>
            <div className="modal-content-large">
              <div className="modal-header">
                <div className="header-info">
                  <h3>Editar Cotización</h3>
                  <span className="cotizacion-codigo">#{cotizacionSeleccionada.codigo}</span>
                  <span className="fecha-cotizacion">
                    <i className="fa-solid fa-calendar"></i>
                    {new Date(cotizacionSeleccionada.fecha).toLocaleDateString()}
                  </span>
                </div>
                <button className="close-button" onClick={() => { setModoEdicion(false); setCotizacionSeleccionada(null); }}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>

              <div className="modal-body">
                <div className="form-section">
                  <div className="section-title">
                    <i className="fa-solid fa-user-circle"></i>
                    <h4>Información del Cliente</h4>
                  </div>
                  <div className="form-row" style={{ display: 'flex', gap: '15px', alignItems: 'end' }}>
                    <div className="form-group" style={{ flex: '1' }}>
                      <label><i className="fa-solid fa-id-badge"></i> Nombre Completo *</label>
                      <input
                        type="text"
                        placeholder="Ingrese el nombre completo del cliente"
                        value={cotizacionSeleccionada.cliente?.nombre || ''}
                        onChange={(e) => setCotizacionSeleccionada({
                          ...cotizacionSeleccionada,
                          cliente: { ...cotizacionSeleccionada.cliente, nombre: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flex: '1' }}>
                      <label><i className="fa-solid fa-at"></i> Correo Electrónico *</label>
                      <input
                        type="email"
                        placeholder="cliente@ejemplo.com"
                        value={cotizacionSeleccionada.cliente?.correo || ''}
                        onChange={(e) => setCotizacionSeleccionada({
                          ...cotizacionSeleccionada,
                          cliente: { ...cotizacionSeleccionada.cliente, correo: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flex: '1' }}>
                      <label><i className="fa-solid fa-mobile-screen-button"></i> Teléfono</label>
                      <input
                        type="tel"
                        placeholder="+57 300 123 4567"
                        value={cotizacionSeleccionada.cliente?.telefono || ''}
                        onChange={(e) => setCotizacionSeleccionada({
                          ...cotizacionSeleccionada,
                          cliente: { ...cotizacionSeleccionada.cliente, telefono: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-group" style={{ flex: '1' }}>
                      <label><i className="fa-solid fa-map-location-dot"></i> Ciudad</label>
                      <input
                        type="text"
                        placeholder="Ciudad"
                        value={cotizacionSeleccionada.cliente?.ciudad || ''}
                        onChange={(e) => setCotizacionSeleccionada({
                          ...cotizacionSeleccionada,
                          cliente: { ...cotizacionSeleccionada.cliente, ciudad: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: '15px' }}>
                    <label><i className="fa-solid fa-location-arrow"></i> Dirección Completa</label>
                    <input
                      type="text"
                      placeholder="Calle, número, barrio, referencias adicionales"
                      value={cotizacionSeleccionada.cliente?.direccion || ''}
                      onChange={(e) => setCotizacionSeleccionada({
                        ...cotizacionSeleccionada,
                        cliente: { ...cotizacionSeleccionada.cliente, direccion: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <div className="section-title">
                    <i className="fa-solid fa-file-contract"></i>
                    <h4>Detalles de la Cotización</h4>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label><i className="fa-solid fa-file-text"></i> Descripción del Proyecto</label>
                      <textarea
                        placeholder="Detalle los servicios o productos incluidos en esta cotización..."
                        value={cotizacionSeleccionada.descripcion || ''}
                        onChange={(e) => setCotizacionSeleccionada({
                          ...cotizacionSeleccionada,
                          descripcion: e.target.value
                        })}
                        rows="4"
                      />
                    </div>
                    <div className="form-group">
                      <label><i className="fa-solid fa-hand-holding-dollar"></i> Condiciones de Pago</label>
                      <textarea
                        placeholder="Ej: 50% anticipo al firmar contrato, 50% contra entrega final..."
                        value={cotizacionSeleccionada.condicionesPago || ''}
                        onChange={(e) => setCotizacionSeleccionada({
                          ...cotizacionSeleccionada,
                          condicionesPago: e.target.value
                        })}
                        rows="4"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label><i className="fa-solid fa-envelope"></i> Estado de Envío</label>
                      <div className="checkbox-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={cotizacionSeleccionada.enviadoCorreo || false}
                            onChange={(e) => setCotizacionSeleccionada({
                              ...cotizacionSeleccionada,
                              enviadoCorreo: e.target.checked
                            })}
                          />
                          <span>Enviado por correo electrónico</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-section products-section">
                  <div className="section-header">
                    <div className="section-title">
                      <i className="fa-solid fa-shopping-cart"></i>
                      <h4>Productos y Servicios</h4>
                      <span className="productos-count">
                        {cotizacionSeleccionada.productos?.length || 0} elemento{(cotizacionSeleccionada.productos?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button className="btn-add" onClick={agregarProducto}>
                      <i className="fa-solid fa-plus-circle"></i>
                      <span>Agregar Producto</span>
                    </button>
                  </div>

                  {(!cotizacionSeleccionada.productos || cotizacionSeleccionada.productos?.length === 0) ? (
                    <div className="empty-products">
                      <i className="fa-solid fa-shopping-basket"></i>
                      <p>No hay productos agregados</p>
                      <p className="empty-subtitle">Comience agregando productos o servicios a esta cotización</p>
                    </div>
                  ) : (
                    <div className="productos-list">
                      {cotizacionSeleccionada.productos?.map((producto, index) => (
                        <div key={index} className="producto-item">
                          <div className="producto-header">
                            <span className="producto-numero">#{index + 1}</span>
                            <button
                              className="btn-remove"
                              onClick={() => eliminarProducto(index)}
                              title="Eliminar producto"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                          <div className="producto-row">
                            <div className="form-group producto-select">
                              <label><i className="fa-solid fa-box"></i> Producto *</label>
                              <select
                                value={producto.producto?.id || ''}
                                onChange={(e) => {
                                  const selectedProduct = productos.find(p => p._id === e.target.value);
                                  const nuevosProductos = [...cotizacionSeleccionada.productos];
                                  nuevosProductos[index] = {
                                    ...nuevosProductos[index],
                                    producto: {
                                      id: e.target.value,
                                      name: selectedProduct?.name || ''
                                    },
                                    valorUnitario: selectedProduct?.price || 0
                                  };
                                  setCotizacionSeleccionada({
                                    ...cotizacionSeleccionada,
                                    productos: nuevosProductos
                                  });
                                }}
                                required
                              >
                                <option value="">Seleccionar producto...</option>
                                {productos.map(prod => (
                                  <option key={prod._id} value={prod._id}>
                                    {prod.name} - ${Number(prod.price).toLocaleString()}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="form-group">
                              <label><i className="fa-solid fa-hashtag"></i> Cantidad *</label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                placeholder="1"
                                value={producto.cantidad || ''}
                                onChange={(e) => {
                                  const nuevosProductos = [...cotizacionSeleccionada.productos];
                                  nuevosProductos[index] = {
                                    ...nuevosProductos[index],
                                    cantidad: e.target.value
                                  };
                                  setCotizacionSeleccionada({
                                    ...cotizacionSeleccionada,
                                    productos: nuevosProductos
                                  });
                                }}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label><i className="fa-solid fa-dollar-sign"></i> Precio Unitario *</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={producto.valorUnitario || ''}
                                onChange={(e) => {
                                  const nuevosProductos = [...cotizacionSeleccionada.productos];
                                  nuevosProductos[index] = {
                                    ...nuevosProductos[index],
                                    valorUnitario: e.target.value
                                  };
                                  setCotizacionSeleccionada({
                                    ...cotizacionSeleccionada,
                                    productos: nuevosProductos
                                  });
                                }}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label><i className="fa-solid fa-percent"></i> Descuento (%)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0"
                                value={producto.descuento || ''}
                                onChange={(e) => {
                                  const nuevosProductos = [...cotizacionSeleccionada.productos];
                                  nuevosProductos[index] = {
                                    ...nuevosProductos[index],
                                    descuento: e.target.value
                                  };
                                  setCotizacionSeleccionada({
                                    ...cotizacionSeleccionada,
                                    productos: nuevosProductos
                                  });
                                }}
                              />
                            </div>
                          </div>
                          <div className="producto-info">
                            <div className="subtotal-producto">
                              <span>Subtotal: </span>
                              <strong>
                                ${((producto.cantidad || 0) * (producto.valorUnitario || 0) * (1 - (producto.descuento || 0) / 100)).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                              </strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="total-section">
                    <div className="total-breakdown">
                      <div className="total-row">
                        <span>Subtotal:</span>
                        <span>${subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="total-row descuentos">
                        <span>Descuentos aplicados:</span>
                        <span>
                          ${(cotizacionSeleccionada.productos?.reduce((acc, p) => {
                            const cantidad = parseFloat(p?.cantidad) || 0;
                            const precio = parseFloat(p?.valorUnitario) || 0;
                            const descuento = parseFloat(p?.descuento) || 0;
                            return acc + (cantidad * precio * descuento / 100);
                          }, 0) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="total-row total-final">
                        <span>Total Final:</span>
                        <strong>
                          ${(cotizacionSeleccionada.productos?.reduce((acc, p) => {
                            const cantidad = parseFloat(p?.cantidad) || 0;
                            const precio = parseFloat(p?.valorUnitario) || 0;
                            const descuento = parseFloat(p?.descuento) || 0;
                            return acc + (cantidad * precio * (1 - descuento / 100));
                          }, 0) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <div className="footer-info">
                  <i className="fa-solid fa-info-circle"></i>
                  <span>Los campos marcados con * son obligatorios</span>
                </div>
                <div className="footer-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      Swal.fire({
                        title: '¿Descartar cambios?',
                        text: 'Se perderán todos los cambios no guardados',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, descartar',
                        cancelButtonText: 'Continuar editando',
                        confirmButtonColor: '#dc3545'
                      }).then((result) => {
                        if (result.isConfirmed) {
                          setModoEdicion(false);
                          setCotizacionSeleccionada(null);
                        }
                      });
                    }}
                  >
                    <i className="fa-solid fa-times"></i>
                    Cancelar
                  </button>
                  <button
                    className="btn-preview"
                    onClick={() => {
                      setModoEdicion(false);
                      setMostrarPreview(true);
                    }}
                  >
                    <i className="fa-solid fa-eye"></i>
                    Vista Previa
                  </button>
                  <button
                    className="btn-save"
                    onClick={async () => {
                      // Validación básica
                      if (!cotizacionSeleccionada.cliente?.nombre || !cotizacionSeleccionada.cliente?.correo) {
                        Swal.fire('Error', 'El nombre y correo del cliente son obligatorios', 'error');
                        return;
                      }

                      if (!cotizacionSeleccionada.productos || cotizacionSeleccionada.productos.length === 0) {
                        Swal.fire('Error', 'Debe agregar al menos un producto', 'error');
                        return;
                      }

                      // Validar productos
                      const productosInvalidos = cotizacionSeleccionada.productos.some(p =>
                        !p.producto?.id || !p.cantidad || !p.valorUnitario || p.cantidad <= 0 || p.valorUnitario <= 0
                      );

                      if (productosInvalidos) {
                        Swal.fire('Error', 'Todos los productos deben tener seleccionado un item, cantidad y precio válidos', 'error');
                        return;
                      }

                      await guardarEdicion();
                    }}
                  >
                    <i className="fa-solid fa-save"></i>
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>

          {mostrarPreview && cotizacionSeleccionada && (
            <CotizacionPreview 
              datos={cotizacionSeleccionada} 
              onClose={closePreviewAndBlink}
              onEmailSent={handleEmailSent}
            />
          )
          }
          <div className="custom-footer">
            <p className="custom-footer-text">
              © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
            </p>
          </div>
        </div>
      )}

    </div >
  )
};