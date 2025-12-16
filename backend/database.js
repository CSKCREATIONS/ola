const mongoose = require('mongoose');
const {DB_URI} = require ('./config');

const connectDB = async () =>{
    try{
        await mongoose.connect(DB_URI,{
            userNewUrlParser: true,
            useUifiedTopology :true,
        });
        console.log('OK MongoDB conectado');
    } catch (error_) {
        console.error('database.js - Error connecting to MongoDB:', error_.message || error_);
        process.exit(1);
    }
};

module.exports = connectDB;