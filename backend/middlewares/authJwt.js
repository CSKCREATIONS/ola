const User = require('../models/User');
const Role = require('../models/Role');
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

const verifyTokenFn = async (req, res, next) => {
  try {
    const token = req.headers['x-access-token'] || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(403).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const decoded = jwt.verify(token, config.secret);

    // Cargar usuario con el rol
    const user = await User.findById(decoded.id).populate('role');

    if (!user || !user.role) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o rol no encontrado'
      });
    }

    req.userId = user._id;
    req.userRole = user.role.name;
    req.permissions = user.role.permissions || [];

    console.log('[AuthJWT] Permisos asignados:', req.permissions);

    next();
  } catch (error) {
    console.error('[AuthJWT] error: ', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
      error: error.message
    });
  }
};

module.exports = { verifyToken: verifyTokenFn };
