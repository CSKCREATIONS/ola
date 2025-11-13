require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const config = require('./config');
const {MongoClient , ObjectId} =  require ('mongodb');
const dbConfig = require('./config/db.js');
// Use the explicit node: namespace to prefer the Node core module specifier
const crypto = require('node:crypto');

//Importar Rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const productRoutes = require('./routes/productRoutes');
const roleRoutes = require('./routes/roleRoutes')
const clientesRoutes = require('./routes/clientesRoutes'); // Ruta base para clientes
const proveedorRoutes = require('./routes/proveedorRoutes');
const comprasRoutes = require('./routes/comprasRoutes'); // Ruta base para compras
const cotizacionRoutes = require('./routes/cotizacionRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const ordenCompraRoutes = require('./routes/ordenCompraRoutes');
const remisionRoutes = require('./routes/remisionRoutes');


const app = express();

// Usar analizador de query simple para reducir superficie de ataque
app.set('query parser', 'simple');

// Request ID simple para correlación de logs
app.use((req, res, next) => {
    // Use crypto.randomBytes for unpredictable request IDs instead of Math.random
    const timePart = Date.now().toString(36);
    const randPart = crypto.randomBytes(4).toString('hex'); // 8 hex chars
    req.id = (timePart + randPart).toUpperCase();
    res.setHeader('X-Request-Id', req.id);
    next();
});
// Conexión directa a Mongo con fallback a localhost en desarrollo
const tryConnectMongoClient = async (primaryUrl) => {
    let url = primaryUrl;
    console.log('MongoClient URI:', url);
    const client = new MongoClient(url);
    try {
        await client.connect();
        return client;
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        if (process.env.NODE_ENV !== 'production') {
            const fallback = 'mongodb://localhost:27017/pangea';
            console.log('↩️  Intentando fallback local:', fallback);
            const clientFallback = new MongoClient(fallback);
            await clientFallback.connect();
            return clientFallback;
        }
        throw error;
    }
};

// Initialize a MongoClient connection. Keep this as an async function
// and call it to preserve CommonJS compatibility (top-level await requires ESM).
async function initMongoClient() {
    try {
        const mongoClient = await tryConnectMongoClient(dbConfig.url);
        app.set('mongoDB', mongoClient.db());
        console.log('✔ Conexión directa a MongoDB establecida');
    } catch (error) {
        console.error('❌ No fue posible establecer conexión directa a MongoDB');
    }
}

initMongoClient();

// Seguridad básica y utilidades
app.use(helmet());

// CORS configurable por entorno: CORS_ORIGINS=orig1,orig2
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: allowedOrigins.length ? true : false,
}));

// Nota Express 5: req.query es de solo lectura; evitamos asignar directamente para no romper
// Sanitización manual: body y params in-place; query en copia segura req.sanitizedQuery

// Rate limiting para /api/*
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // ajustar según necesidades
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Logging
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// Sanitización para Mongo (custom para Express 5)
app.use((req, res, next) => {
    try {
        if (req.body) req.body = mongoSanitize.sanitize(req.body);
        if (req.params) req.params = mongoSanitize.sanitize(req.params);
        if (req.query) req.sanitizedQuery = mongoSanitize.sanitize({ ...req.query });
    } catch (e) {
        console.warn('mongoSanitize middleware warning:', e.message);
    }
    next();
});

// Conexion a mongo
console.log('MongoDB URI:', dbConfig.url);
const connectMongoose = async (primaryUrl) => {
    try {
        await mongoose.connect(primaryUrl);
        console.log('✔ Mongoose conectado a MongoDB');
    } catch (err) {
        console.error('❌ Error de conexión con Mongoose:', err);
        if (process.env.NODE_ENV !== 'production') {
            const fallback = 'mongodb://localhost:27017/pangea';
            console.log('↩️  Mongoose intentando fallback local:', fallback);
            await mongoose.connect(fallback);
            console.log('✔ Mongoose conectado con fallback local');
        } else {
            throw err;
        }
    }
};
connectMongoose(dbConfig.url);

// Endpoints de salud
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});
app.get('/ready', (req, res) => {
    const state = mongoose.connection.readyState; // 1 conectado
    const ready = state === 1;
    res.status(ready ? 200 : 503).json({ ready, state });
});

//rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/clientes', clientesRoutes); // Ruta base para clientes
app.use('/api/proveedores', proveedorRoutes); // Ruta base para proveedores
app.use('/api/compras', comprasRoutes); // Ruta base para compras
app.use('/api/cotizaciones', cotizacionRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/ordenes-compra', ordenCompraRoutes);
app.use('/api/remisiones', remisionRoutes);

// 404 para rutas no encontradas
app.use((req, res, next) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } });
});

// Manejador de errores centralizado
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('❌ Error:', { id: req.id, message: err.message, stack: err.stack });
    const status = err.status || 500;
    res.status(status).json({
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message: err.message || 'Error interno del servidor',
            traceId: req.id,
        }
    });
});

//Inicio del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});