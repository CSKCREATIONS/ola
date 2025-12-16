// src/funciones/reportes.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/reportes'; // URL corregida para el backend

// Función para obtener categorías
export const fetchReporteCategorias = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/categorias`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

// Función para obtener productos con filtros
export const fetchReporteProductos = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = { ...filters };
    const response = await axios.get(`${API_URL}/productos`, { 
      params,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

// Función para obtener reporte consolidado
export const fetchReporteConsolidado = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/consolidado`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("📊 Datos recibidos del backend:", response.data); // <-- para depurar
    return response.data.data;
  } catch (error) {
    console.error("Error fetching consolidated report:", error);
    throw error;
  }
};

////

export const fetchVentasPorPeriodo = async (desde, hasta) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/ventas/por-periodo`, {
    params: { desde, hasta },
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

export const fetchVentasConsolidado = async (desde, hasta) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/ventas/consolidado`, {
    params: { desde, hasta },
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};


export const fetchPedidosPorEstado = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/ventas/por-estado`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};


export const fetchCotizaciones = async (desde, hasta) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/ventas/cotizaciones`, {
    params: { desde, hasta },
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

export const fetchReporteClientes = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/clientes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};



//prov
export const fetchProveedoresPorPais = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_URL}/por-pais`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.data.data;
};

export const fetchProductosPorProveedor = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_URL}/por-productos`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.data.data;
};

export const fetchProveedoresPorEstado = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_URL}/por-estado`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.data.data;
};

export const fetchProveedoresRecientes = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_URL}/recientes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.data.data;
};

// Estadísticas generales del sistema
export const fetchEstadisticasGenerales = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_URL}/estadisticas-generales`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.data.data;
};


