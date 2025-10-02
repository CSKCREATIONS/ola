const User = require('../models/User');
const Role = require('../models/Role');

const checkDuplicateUsernameOrEmail = async (req, res, next) => {
    try {
        const user = await User.findOne({
            $or: [
                { username: req.body.username },
                { email: req.body.email }
            ]
        }).exec();

        if (user) {
            return res.status(400).json({
                success: false,
                message: 'Error: Usuario o Email ya existen'
            });
        }

        next();
    } catch (err) {
        console.error('[verifySignUp] Error en checkDuplicateUsernameOrEmail:', err);
        res.status(500).json({
            success: false,
            message: 'Error al verificar credenciales',
            error: err.message
        });
    }
};

const checkRolesExisted = async (req, res, next) => {
    const roleName = req.body.role;

    if (!roleName) {
        return res.status(400).json({
            success: false,
            message: 'El campo "role" es requerido'
        });
    }

    try {
        const roleExists = await Role.findOne({ name: roleName });

        if (!roleExists) {
            return res.status(400).json({
                success: false,
                message: `Rol no encontrado: ${roleName}`
            });
        }

        next();
    } catch (err) {
        console.error('[verifySignUp] Error al verificar rol:', err);
        return res.status(500).json({
            success: false,
            message: 'Error interno al verificar rol',
            error: err.message
        });
    }
};

module.exports = {
    checkDuplicateUsernameOrEmail,
    checkRolesExisted
};
