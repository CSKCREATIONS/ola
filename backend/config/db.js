// Centraliza la URL de conexión a MongoDB para uso en server.js y otros módulos
// Prioriza MONGODB_URI desde variables de entorno; fallback local para desarrollo

const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/pangea';

module.exports = { url };
