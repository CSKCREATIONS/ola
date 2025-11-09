module.exports = {
    //1.configuracion de JWT
    SECRET: process.env.JWT_SECRET || 'tu_clave_secreta_para_desarrollo',
    TOKEN_EXPIRATION: process.env.TOKEN_EXPIRATION ||'24h',

    //2. configuracion de base de datos
    DB :{
        URL: process.env.MONGODB_URI || 'mongodb://localhost:27017/pangea',
        OPTIONS :{
            useNewUrlParser:true,
            useUnifiedTopolgy: true
        }
    },

};