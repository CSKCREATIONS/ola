require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const {MongoClient , ObjectId} =  require ('mongodb');

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
const ventasRoutes = require('./routes/ventasRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const ordenCompraRoutes = require('./routes/ordenCompraRoutes');
const remisionRoutes = require('./routes/remisionRoutes');


const mongoClient = new MongoClient(process.env.MONGODB_URI);
(async()=>{
    await mongoClient.connect();
    app.set('mongoDB',mongoClient.db());
    console.log('Conexion directa a mongoDB establecida');
})();
const app = express();

//Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

//Conexion a mongo
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('OK MongoDB conectado'))
.catch(err => console.error('X error de mongoDB',err));

//rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/clientes', clientesRoutes); // Ruta base para clientes
app.use('/api/ventas', ventasRoutes);
app.use('/api/proveedores', proveedorRoutes); // Ruta base para proveedores
app.use('/api/compras', comprasRoutes); // Ruta base para compras
app.use('/api/cotizaciones', cotizacionRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/ordenes-compra', ordenCompraRoutes);
app.use('/api/remisiones', remisionRoutes);

//Inicio del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});