require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const crypto = require('crypto');
const dbConfig = require('./config/db');
// 📦 Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const productRoutes = require('./routes/productRoutes');
const roleRoutes = require('./routes/roleRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');
const comprasRoutes = require('./routes/comprasRoutes');
const cotizacionRoutes = require('./routes/cotizacionRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const ordenCompraRoutes = require('./routes/ordenCompraRoutes');
const remisionRoutes = require('./routes/remisionRoutes');

// Crear aplicación Express
const app = express();

/* -------------------------------------------------------------
   🧠 Middleware global: ID de solicitud y configuración básica
------------------------------------------------------------- */
app.set('query parser', 'simple');
app.use((req, res, next) => {
    const timePart = Date.now().toString(36);
    const randPart = crypto.randomBytes(4).toString('hex');
    req.id = (timePart + randPart).toUpperCase();
    res.setHeader('X-Request-Id', req.id);
    next();
});

/* -------------------------------------------------------------
   🌐/🧩 Conexión a MongoDB y arranque de la app (envuelto en async)
------------------------------------------------------------- */

async function init() {
    console.log('MongoClient URI:', dbConfig.url);

    try {
        const mongoClient = await (async () => {
            console.log('MongoClient URI:', dbConfig.url);
            const client = new MongoClient(dbConfig.url);
            try {
                await client.connect();
                return client;
            } catch (error) {
                console.error('❌ Error conectando a MongoDB:', error);
                // Prefer throwing in production so the process can fail fast and be restarted by the orchestrator.
                if (process.env.NODE_ENV === 'production') {
                    throw error;
                } else {
                    const fallback = 'mongodb://localhost:27017/pangea';
                    console.log('↩️  Intentando fallback local:', fallback);
                    const fallbackClient = new MongoClient(fallback);
                    await fallbackClient.connect();
                    return fallbackClient;
                }
            }
        })();

        app.set('mongoDB', mongoClient.db());
        console.log('✔ Conexión directa a MongoDB establecida');
    } catch (error) {
        console.error('❌ No fue posible establecer conexión directa a MongoDB:', error.message);
    }

    console.log('Mongoose URI:', dbConfig.url);
    try {
        try {
            await mongoose.connect(dbConfig.url);
            console.log('✔ Mongoose conectado a MongoDB');
        } catch (err) {
            console.error('❌ Error de conexión con Mongoose:', err);
            // In production, don't swallow the error — fail fast.
            if (process.env.NODE_ENV === 'production') {
                throw err;
            } else {
                const fallback = 'mongodb://localhost:27017/pangea';
                console.log('↩️  Mongoose intentando fallback local:', fallback);
                await mongoose.connect(fallback);
                console.log('✔ Mongoose conectado con fallback local');
            }
        }
    } catch (error) {
        console.error('❌ No fue posible conectar Mongoose a MongoDB:', error.message);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Servidor en ejecución 👉 http://localhost:${PORT}`);
    });
}

// Start the app and handle startup errors.
init().catch(error_ => {
    console.error('Fatal error iniciando la app:', error_);
    process.exit(1);
});

/* -------------------------------------------------------------
   🦠 Seguridad, CORS, Sanitización y Logging
------------------------------------------------------------- */
app.use(helmet());

// Configurar CORS (acepta dominios desde variable de entorno)
const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

app.use(cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    // credentials should be true only when we have explicit allowed origins configured
    credentials: allowedOrigins.length > 0,
}));

// Rate limiting para evitar abuso de endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // máximo de requests
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Logging de solicitudes
app.use(morgan('dev'));

// Lectura de body JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitización para prevenir inyección de Mongo
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

/* Mongoose startup moved into init() above. */

/* -------------------------------------------------------------
   ✅ Endpoints de salud
------------------------------------------------------------- */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/ready', (req, res) => {
    const state = mongoose.connection.readyState;
    const ready = state === 1;
    res.status(ready ? 200 : 503).json({ ready, state });
});

/* -------------------------------------------------------------
   📦 Rutas principales
------------------------------------------------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/cotizaciones', cotizacionRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/ordenes-compra', ordenCompraRoutes);
app.use('/api/remisiones', remisionRoutes);

/* -------------------------------------------------------------
   ❌ Manejo de errores y rutas inexistentes
------------------------------------------------------------- */
app.use((req, res) => {
    res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' }
    });
});

app.use((err, req, res, next) => {
    console.error('❌ Error:', {
        id: req.id,
        message: err.message,
        stack: err.stack
    });
    const status = err.status || 500;
    res.status(status).json({
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message: err.message || 'Error interno del servidor',
            traceId: req.id,
        }
    });
});

/* Server start moved into init() above. */