const jwt = require('jsonwebtoken')
const User = require('../models/User')

exports.authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticacion requerido'
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'usuario no encontrado'
            });
        }

        req.user = user;
        next()
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'token invalido o expirado'
        });
    }
};

//middleware de autorizacion
exports.authorize = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'no tienes permiso para esta accion',
                requiredRoles: roles,
                currentRole: req.user.role
            });
        }
        next();
    };
};