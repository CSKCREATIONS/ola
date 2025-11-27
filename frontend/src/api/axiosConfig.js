/* global globalThis */
import axios from 'axios';

// Prefer runtime detection of the browser host so the client issues
// same-origin requests (avoids mixed-content and unreachable Docker hostnames).
// Fallback to the build-time env var or localhost when not running in a browser.
const getBaseURL = () => {
  if (globalThis.window?.location) {
    const { protocol, hostname, port } = globalThis.window.location;
    // Include port only when explicit and non-default for the protocol
    const hasNonDefaultPort = port && ((protocol === 'https:' && port !== '443') || (protocol === 'http:' && port !== '80'));
    const portPart = hasNonDefaultPort ? `:${port}` : '';
    return `${protocol}//${hostname}${portPart}`;
  }

  // Build-time override (kept for server-side rendering or special builds)
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;

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
