const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { verifyToken } = require('../middlewares/authJwt');
const { checkPermission } = require('../middlewares/role');

router.get('/',
  verifyToken,
  checkPermission('roles.ver'),
  roleController.getAllRoles
)

// POST api/roles - para crear rol 
// puede crear rol todo aque usuario con permiso role.crear
router.post('/',
  verifyToken,
  checkPermission('roles.crear'),
  roleController.createRole
);

//PATCH api/roles/:id/toggle-enabled  inhabilitar rol
router.patch('/:id/toggle-enabled',
  verifyToken,
  checkPermission('roles.inhabilitar'),
  roleController.toggleEnabled
);


// PATCH api/roles/:d  - editar rol
router.patch('/:id',
  verifyToken,
  checkPermission('roles.editar'),
  roleController.updateRole
);


module.exports = router;