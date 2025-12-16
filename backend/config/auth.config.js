require('dotenv').config();

module.exports = {
    secret:process.env.AUTH_SECRET || "tusecretoparalostoken",
    jwtExpiration: process.env. JWT_EXPIRATION || 28800, //8 horas en segundos

    saltRounds: process.env.SALT_ROUNDS || 8

};