import axios from 'axios';

// Prefer environment variable set at build time (REACT_APP_API_URL)
// Fallback: if running in browser, infer API host from window.location safely
const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5000`;
  }
  return 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Attach token automatically if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-access-token'] = token;
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;
