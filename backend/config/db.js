// Centraliza la URL de conexión a MongoDB para uso en server.js y otros módulos
// Prioriza variables de entorno usadas en distintos despliegues:
// - MONGODB_URI (común)
// - MONGO_URL (variable usada en docker-compose en este repo)
// Fallback: en entorno docker-compose el servicio `mongo` está disponible
// por nombre de host; fuera de Docker, intentamos localhost.

const url = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://admin:secret@mongo:27017/pangea?authSource=admin';

module.exports = { url };
