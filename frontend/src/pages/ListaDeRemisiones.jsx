import React, { useEffect, useState } from 'react';
import Fijo from '../components/Fijo';
import NavVentas from '../components/NavVentas';
import EncabezadoModulo from '../components/EncabezadoModulo';
import RemisionPreview from '../components/RemisionPreview';
import Swal from 'sweetalert2';
import api from '../api/axiosConfig';
import * as XLSX from 'xlsx';

// CSS para animaciones y efectos avanzados
const styles = `
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
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  .remisiones-container * {
    box-sizing: border-box;
  }
  
  .fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }
  
  .glassmorphism {
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
  }
  
  .hover-lift:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.15);
  }
  
  .scroll-shadow {
    box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
  }
`;

// Inyectar estilos una sola vez
if (!document.querySelector('#remisiones-advanced-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'remisiones-advanced-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default function ListaDeRemisiones() {
  const [remisiones, setRemisiones] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [remisionSeleccionada, setRemisionSeleccionada] = useState(null);
  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    totalRemisiones: 0,
    valorTotal: 0,
    porEstado: []
  });
  const [loading, setLoading] = useState(false);

  // Cargar remisiones
  const cargarRemisiones = async (estado = 'todas') => {
    setLoading(true);
    try {
      const res = await api.get(`/api/remisiones?estado=${estado}&limite=100`);
      const data = res.data || res;
      const listaRemisiones = data.remisiones || data.data || [];
      const remisionesOrdenadas = (Array.isArray(listaRemisiones) ? listaRemisiones : []).sort((a, b) => new Date(b.createdAt || b.fechaCreacion) - new Date(a.createdAt || a.fechaCreacion));
      setRemisiones(remisionesOrdenadas);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      const res = await api.get('/api/remisiones/estadisticas');
      const data = res.data || res;
      setEstadisticas(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  useEffect(() => {
    cargarRemisiones(filtroEstado);
    cargarEstadisticas();
  }, [filtroEstado]);

  // Cambiar estado de remisión
  const cambiarEstadoRemision = async (remisionId, nuevoEstado) => {
    try {
      const { isConfirmed } = await Swal.fire({
        title: '¿Confirmar cambio de estado?',
        text: `¿Está seguro de cambiar el estado a "${nuevoEstado}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar'
      });

      if (!isConfirmed) return;

      const response = await api.patch(`/api/remisiones/${remisionId}/estado`, { estado: nuevoEstado });
      if (response.status >= 200 && response.status < 300) {
        Swal.fire({
          icon: 'success',
          title: 'Estado actualizado',
          text: 'El estado de la remisión ha sido actualizado',
          timer: 2000
        });
        cargarRemisiones(filtroEstado);
        cargarEstadisticas();
      } else {
        throw new Error('Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el estado de la remisión'
      });
    }
  };

  // Ver detalles de remisión
  const verDetalles = async (remision) => {
    try {
      console.log('🔍 Obteniendo detalles de remisión:', remision._id);
      
      const res = await api.get(`/api/remisiones/${remision._id}`);
      const remisionCompleta = res.data || res;
      setRemisionSeleccionada(remisionCompleta);
      setMostrarModalDetalles(true);
    } catch (error) {
      console.error('Error al obtener remisión:', error);
      // Fallback: usar los datos de la lista
      setRemisionSeleccionada(remision);
      setMostrarModalDetalles(true);
    }
  };

  // Eliminar remisión (solo si está cancelada)
  const eliminarRemision = async (remisionId, estado) => {
    if (estado !== 'cancelada') {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede eliminar',
        text: 'Solo se pueden eliminar remisiones canceladas'
      });
      return;
    }

    try {
      const { isConfirmed } = await Swal.fire({
        title: '¿Eliminar remisión?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        confirmButtonColor: '#d33',
        cancelButtonText: 'Cancelar'
      });

      if (!isConfirmed) return;

      const res = await api.delete(`/api/remisiones/${remisionId}`);
      if (res.status >= 200 && res.status < 300) {
        Swal.fire({
          icon: 'success',
          title: 'Remisión eliminada',
          text: 'La remisión ha sido eliminada correctamente',
          timer: 2000
        });
        cargarRemisiones(filtroEstado);
        cargarEstadisticas();
      } else {
        throw new Error('Error al eliminar remisión');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la remisión'
      });
    }
  };

  // Exportar a Excel
  const exportarExcel = () => {
    try {
      const datosExcel = remisiones.map(remision => ({
        'Número': remision.numeroRemision,
        'Cliente': remision.cliente?.nombre || 'N/A',
        'Ciudad': remision.cliente?.ciudad || 'N/A',
        'Fecha Remisión': new Date(remision.fechaRemision).toLocaleDateString('es-ES'),
        'Fecha Entrega': remision.fechaEntrega ? new Date(remision.fechaEntrega).toLocaleDateString('es-ES') : 'N/A',
        'Estado': remision.estado,
        'Cantidad Items': remision.cantidadItems || 0,
        'Cantidad Total': remision.cantidadTotal || 0,
        'Total': remision.total || 0,
        'Responsable': `${remision.responsable?.firstName || ''} ${remision.responsable?.surname || ''}`.trim() || 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Remisiones');
      
      // Ajustar ancho de columnas
      const maxWidth = 20;
      const wscols = Object.keys(datosExcel[0] || {}).map(() => ({ width: maxWidth }));
      ws['!cols'] = wscols;

      XLSX.writeFile(wb, `Remisiones_${filtroEstado}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      Swal.fire({
        icon: 'success',
        title: 'Exportación exitosa',
        text: 'Las remisiones han sido exportadas a Excel',
        timer: 2000
      });
    } catch (error) {
      console.error('Error exportando:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo exportar las remisiones'
      });
    }
  };

  // Función para obtener el color del badge según el estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activa': return '#28a745';
      case 'cerrada': return '#6c757d';
      case 'cancelada': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // Función para obtener el icono según el estado
  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'activa': return 'fa-check-circle';
      case 'cerrada': return 'fa-lock';
      case 'cancelada': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  };

  return (
    <div className="remisiones-container">
      <Fijo />
      <div className="content">
        <NavVentas />
        <div className="contenido-modulo">
          {/* Encabezado profesional del módulo */}
          <div className="encabezado-modulo" style={{
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
                    <i className="fa-solid fa-file-export" style={{ marginRight: '12px', fontSize: '1.8rem' }}></i>
                    Lista de Remisiones
                  </h3>
                  <p style={{
                    color: 'rgba(255,255,255,0.9)',
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: '400'
                  }}>
                    Gestión completa de documentos de entrega
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={exportarExcel}
                    disabled={remisiones.length === 0}
                    style={{
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '12px 20px', 
                      border: '2px solid rgba(255,255,255,0.3)', 
                      borderRadius: '12px', 
                      background: remisiones.length === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', 
                      color: remisiones.length === 0 ? 'rgba(255,255,255,0.5)' : 'white',
                      fontSize: '14px', 
                      fontWeight: '600', 
                      cursor: remisiones.length === 0 ? 'not-allowed' : 'pointer', 
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                      if (remisiones.length > 0) {
                        e.target.style.background = 'rgba(255,255,255,0.3)';
                        e.target.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (remisiones.length > 0) {
                        e.target.style.background = 'rgba(255,255,255,0.2)';
                        e.target.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <i className="fa-solid fa-file-excel" style={{ fontSize: '16px' }}></i>
                    <span>Exportar Excel</span>
                  </button>

                  <button
                    onClick={() => cargarRemisiones(filtroEstado)}
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
                    <i className="fa-solid fa-arrows-rotate" style={{ fontSize: '16px' }}></i>
                    <span>Actualizar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas avanzadas */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '25px', 
            marginBottom: '35px' 
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '25px',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
            }}
            >
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                <div>
                  <h6 style={{ margin: '0 0 12px 0', opacity: 0.9, fontSize: '14px', fontWeight: '500', letterSpacing: '0.5px' }}>
                    TOTAL REMISIONES
                  </h6>
                  <h2 style={{ 
                    margin: 0, 
                    fontWeight: '700', 
                    fontSize: '2.8rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                  }}>
                    {estadisticas.totalRemisiones}
                  </h2>
                  <p style={{ margin: '8px 0 0 0', opacity: 0.8, fontSize: '13px' }}>
                    Documentos registrados
                  </p>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}>
                  <i className="fa-solid fa-file-export" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              padding: '25px',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 8px 25px rgba(17, 153, 142, 0.4)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(17, 153, 142, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(17, 153, 142, 0.4)';
            }}
            >
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                <div>
                  <h6 style={{ margin: '0 0 12px 0', opacity: 0.9, fontSize: '14px', fontWeight: '500', letterSpacing: '0.5px' }}>
                    VALOR TOTAL
                  </h6>
                  <h2 style={{ 
                    margin: 0, 
                    fontWeight: '700', 
                    fontSize: '2.2rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                  }}>
                    ${estadisticas.valorTotal?.toLocaleString('es-CO') || '0'}
                  </h2>
                  <p style={{ margin: '8px 0 0 0', opacity: 0.8, fontSize: '13px' }}>
                    Valor en remisiones
                  </p>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}>
                  <i className="fa-solid fa-sack-dollar" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              padding: '25px',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 8px 25px rgba(79, 172, 254, 0.4)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(79, 172, 254, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(79, 172, 254, 0.4)';
            }}
            >
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                <div>
                  <h6 style={{ margin: '0 0 12px 0', opacity: 0.9, fontSize: '14px', fontWeight: '500', letterSpacing: '0.5px' }}>
                    REMISIONES ACTIVAS
                  </h6>
                  <h2 style={{ 
                    margin: 0, 
                    fontWeight: '700', 
                    fontSize: '2.8rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                  }}>
                    {estadisticas.porEstado?.find(e => e._id === 'activa')?.count || 0}
                  </h2>
                  <p style={{ margin: '8px 0 0 0', opacity: 0.8, fontSize: '13px' }}>
                    En proceso de entrega
                  </p>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              padding: '25px',
              borderRadius: '16px',
              color: '#374151',
              boxShadow: '0 8px 25px rgba(168, 237, 234, 0.4)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(168, 237, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(168, 237, 234, 0.4)';
            }}
            >
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                background: 'rgba(0,0,0,0.05)',
                borderRadius: '50%'
              }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                <div>
                  <h6 style={{ margin: '0 0 12px 0', opacity: 0.8, fontSize: '14px', fontWeight: '500', letterSpacing: '0.5px' }}>
                    REMISIONES CERRADAS
                  </h6>
                  <h2 style={{ 
                    margin: 0, 
                    fontWeight: '700', 
                    fontSize: '2.8rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                  }}>
                    {estadisticas.porEstado?.find(e => e._id === 'cerrada')?.count || 0}
                  </h2>
                  <p style={{ margin: '8px 0 0 0', opacity: 0.7, fontSize: '13px' }}>
                    Entregas completadas
                  </p>
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '20px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}>
                  <i className="fa-solid fa-lock" style={{ fontSize: '2rem' }}></i>
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
                  {remisiones.length} remisión{remisiones.length !== 1 ? 'es' : ''} encontrada{remisiones.length !== 1 ? 's' : ''}
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
                  <i className="fa-solid fa-flag" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                  Filtrar por Estado:
                </label>
                <select 
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
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
                  <option value="todas">📋 Todas las remisiones</option>
                  <option value="activa">✅ Solo activas</option>
                  <option value="cerrada">🔒 Solo cerradas</option>
                  <option value="cancelada">❌ Solo canceladas</option>
                </select>
              </div>
              
              {filtroEstado !== 'todas' && (
                <div style={{
                  background: 'linear-gradient(135deg, #e0f2fe, #b3e5fc)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #81d4fa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="fa-solid fa-filter" style={{ color: '#0277bd', fontSize: '14px' }}></i>
                  <span style={{ color: '#0277bd', fontSize: '13px', fontWeight: '600' }}>
                    Filtrando por: <strong>{filtroEstado.toUpperCase()}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tabla de remisiones mejorada */}
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
                    Remisiones Registradas
                  </h4>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    Gestión completa de documentos de entrega
                  </p>
                </div>
                {filtroEstado !== 'todas' && (
                  <div style={{
                    background: '#dbeafe',
                    color: '#1e40af',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <i className="fa-solid fa-filter" style={{ fontSize: '10px' }}></i>
                    {filtroEstado.toUpperCase()}
                  </div>
                )}
              </div>
              
              {remisiones.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}>
                  <i className="fa-solid fa-calculator" style={{ fontSize: '14px' }}></i>
                  Total: ${remisiones.reduce((sum, r) => sum + (r.total || 0), 0).toLocaleString('es-CO')}
                </div>
              )}
            </div>
            
            {loading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 20px',
                background: 'white'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  border: '5px solid #f3f3f3',
                  borderTop: '5px solid #667eea',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 25px'
                }}></div>
                <h5 style={{ color: '#6b7280', margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: '600' }}>
                  Cargando remisiones...
                </h5>
                <p style={{ color: '#9ca3af', margin: 0, fontSize: '14px' }}>
                  Por favor espera mientras obtenemos la información
                </p>
              </div>
            ) : (
              <div style={{ overflow: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }} id="tabla_remisiones">
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
                        letterSpacing: '0.5px',
                        width: '120px'
                      }}>
                        <i className="fa-solid fa-hashtag" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                        NÚMERO
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
                        textAlign: 'left', 
                        fontWeight: '600', 
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px',
                        width: '100px'
                      }}>
                        <i className="fa-solid fa-map-marker-alt" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                        CIUDAD
                      </th>
                      <th style={{ 
                        padding: '16px 12px', 
                        textAlign: 'left', 
                        fontWeight: '600', 
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px',
                        width: '120px'
                      }}>
                        <i className="fa-solid fa-calendar" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                        F. REMISIÓN
                      </th>
                      <th style={{ 
                        padding: '16px 12px', 
                        textAlign: 'left', 
                        fontWeight: '600', 
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px',
                        width: '120px'
                      }}>
                        <i className="fa-solid fa-truck" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                        F. ENTREGA
                      </th>
                      <th style={{ 
                        padding: '16px 12px', 
                        textAlign: 'left', 
                        fontWeight: '600', 
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px',
                        width: '100px'
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
                        letterSpacing: '0.5px',
                        width: '80px'
                      }}>
                        <i className="fa-solid fa-boxes" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                        ITEMS
                      </th>
                      <th style={{ 
                        padding: '16px 12px', 
                        textAlign: 'right', 
                        fontWeight: '600', 
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px',
                        width: '120px'
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
                        letterSpacing: '0.5px',
                        width: '130px'
                      }}>
                        <i className="fa-solid fa-user-tie" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                        RESPONSABLE
                      </th>
                      <th className="no-export" style={{ 
                        padding: '16px 12px', 
                        textAlign: 'center', 
                        fontWeight: '600', 
                        color: '#374151',
                        fontSize: '13px',
                        letterSpacing: '0.5px',
                        width: '140px'
                      }}>
                        <i className="fa-solid fa-cogs" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                        ACCIONES
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {remisiones.map((remision, index) => (
                      <tr key={remision._id} style={{
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.transform = 'scale(1.01)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      >
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            padding: '8px 14px',
                            borderRadius: '25px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'inline-block',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                            textAlign: 'center',
                            minWidth: '60px'
                          }}>
                            {remision.numeroRemision}
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div>
                            <div style={{ 
                              fontWeight: '600', 
                              color: '#1f2937', 
                              marginBottom: '4px',
                              fontSize: '14px'
                            }}>
                              {remision.cliente?.nombre || 'N/A'}
                            </div>
                            {remision.cliente?.correo && (
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <i className="fa-solid fa-envelope" style={{ fontSize: '10px' }}></i>
                                {remision.cliente.correo}
                              </div>
                            )}
                          </div>
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
                            {remision.cliente?.ciudad || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 12px', fontSize: '13px', color: '#4b5563', fontWeight: '500' }}>
                          {new Date(remision.fechaRemision).toLocaleDateString('es-ES')}
                        </td>
                        <td style={{ padding: '16px 12px', fontSize: '13px', color: '#4b5563', fontWeight: '500' }}>
                          {remision.fechaEntrega ? 
                            new Date(remision.fechaEntrega).toLocaleDateString('es-ES') : 
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin fecha</span>
                          }
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <span 
                            style={{ 
                              backgroundColor: getEstadoColor(remision.estado), 
                              color: 'white',
                              padding: '8px 12px',
                              borderRadius: '25px',
                              fontSize: '11px',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              boxShadow: `0 2px 8px ${getEstadoColor(remision.estado)}40`
                            }}
                          >
                            <i className={`fa-solid ${getEstadoIcon(remision.estado)}`} style={{ fontSize: '10px' }}></i>
                            {remision.estado}
                          </span>
                        </td>
                        <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                          <div>
                            <div style={{
                              background: '#dbeafe',
                              color: '#1e40af',
                              padding: '6px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              marginBottom: '4px',
                              display: 'inline-block'
                            }}>
                              {remision.cantidadItems || 0}
                            </div>
                            <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>
                              {remision.cantidadTotal || 0} uds.
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                          <div style={{ 
                            fontWeight: '700', 
                            color: '#059669', 
                            fontSize: '15px'
                          }}>
                            ${(remision.total || 0).toLocaleString('es-CO')}
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                              borderRadius: '50%',
                              padding: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <i className="fa-solid fa-user" style={{ fontSize: '10px', color: '#6b7280' }}></i>
                            </div>
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#4b5563',
                              fontWeight: '500'
                            }}>
                              {`${remision.responsable?.firstName || ''} ${remision.responsable?.surname || ''}`.trim() || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="no-export" style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => verDetalles(remision)}
                              title="Ver detalles"
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
                              <i className="fa-solid fa-eye"></i>
                            </button>
                            
                            {remision.estado === 'activa' && (
                              <>
                                <button
                                  onClick={() => cambiarEstadoRemision(remision._id, 'cerrada')}
                                  title="Cerrar remisión"
                                  style={{
                                    background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                                    color: '#4b5563',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 10px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 4px rgba(75, 85, 99, 0.2)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 8px rgba(75, 85, 99, 0.3)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 4px rgba(75, 85, 99, 0.2)';
                                  }}
                                >
                                  <i className="fa-solid fa-lock"></i>
                                </button>
                                <button
                                  onClick={() => cambiarEstadoRemision(remision._id, 'cancelada')}
                                  title="Cancelar remisión"
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
                                  <i className="fa-solid fa-times"></i>
                                </button>
                              </>
                            )}
                            
                            {remision.estado === 'cancelada' && (
                              <button
                                onClick={() => eliminarRemision(remision._id, remision.estado)}
                                title="Eliminar remisión"
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
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {remisiones.length === 0 && (
                      <tr>
                        <td colSpan="10" style={{ textAlign: 'center', padding: '80px 20px' }}>
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
                              <i className="fa-solid fa-inbox" style={{ 
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
                                No hay remisiones disponibles
                              </h5>
                              <p style={{ 
                                color: '#9ca3af', 
                                margin: 0, 
                                fontSize: '14px',
                                lineHeight: '1.5'
                              }}>
                                {filtroEstado !== 'todas' ? 
                                  `No se encontraron remisiones en estado "${filtroEstado}"` : 
                                  'No hay remisiones registradas en el sistema'
                                }
                              </p>
                              {filtroEstado !== 'todas' && (
                                <button
                                  onClick={() => setFiltroEstado('todas')}
                                  style={{
                                    marginTop: '15px',
                                    padding: '8px 16px',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                  }}
                                >
                                  Ver todas las remisiones
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de detalles */}
      {mostrarModalDetalles && remisionSeleccionada && (
        <div className="modal-overlay">
          <RemisionPreview
            datos={remisionSeleccionada}
            onClose={() => {
              setMostrarModalDetalles(false);
              setRemisionSeleccionada(null);
            }}
          />
        </div>
      )}

      <div className="custom-footer">
        <p className="custom-footer-text">
          © 2025 <span className="custom-highlight">PANGEA</span>. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
