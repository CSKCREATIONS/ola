function validatePermissions(userRole,allowedRoles){
    if(!allowedRoles.includes(userRole)){
        const error = new Error('Acceso denegado: permisos insuficientes');
        error.status = 403;
        throw error;
    }
}

module.exports = {validatePermissions};

