// middleware/role.js

const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        const userPermissions = req.permissions;

        if (!userPermissions || !Array.isArray(userPermissions)) {
            return res.status(403).json({
                success: false,
                message: 'Permisos no encontrados o inválidos'
            });
        }

        if (!userPermissions.includes(requiredPermission)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para esta acción'
            });
        }

        next();
    };
};

module.exports = { checkPermission };
