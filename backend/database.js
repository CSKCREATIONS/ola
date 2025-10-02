const mongoose = require('mongoose');
const {DB_URI} = require ('./config');

const connectDB = async () =>{
    try{
        await mongoose.connect(DB_URI,{
            userNewUrlParser: true,
            useUifiedTopology :true,
        });
        console.log('OK MongoDB conectado');
    }catch(err){
        console.error('X Error de conexion  a MongoDB'), err.message;
        process.exit(1);
    }
};

module.exports = connectDB;