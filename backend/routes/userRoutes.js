const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authJwt');
const { checkPermission } = require('../middlewares/role');
const { checkDuplicateUsernameOrEmail, checkRolesExisted } = require('../middlewares/verifySignUp');
const User = require('../models/User');

// Middleware de diagnóstico para todas las rutas
router.use((req, res, next) => {
  console.log('\n=== DIAGNÓSTICO DE RUTA ===');
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', {
    authorization: req.headers.authorization ? '***' + req.headers.authorization.slice(-8) : null,
    'x-access-token': req.headers['x-access-token'] ? '***' + req.headers['x-access-token'].slice(-8) : null,
    'user-agent': req.headers['user-agent']
  });
  next();
});


//  === RUTAS PARA PERFIL PROPIO ===

// PATCH /api/users/me - Actualizar su propio perfil
router.patch('/me',
  verifyToken,
  userController.updateOwnProfile
);

// PATCH /api/users/change-password - Cambiar su propia contraseña
router.patch('/change-password',
  verifyToken,
  userController.changeOwnPassword
);


//  === RUTAS DE GESTIÓN DE USUARIOS  ===

// GET /api/users - Listar usuarios
router.get('/',
  verifyToken,
  checkPermission('usuarios.ver'),
  userController.getAllUsers
);

// POST /api/users - Crear usuario
router.post('/',
  verifyToken,
  checkPermission('usuarios.crear'),
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
  userController.createUser
);


//  === RUTAS CON :id (DEBEN IR AL FINAL) ===

// GET /api/users/:id - Obtener usuario específico
router.get('/:id',
  verifyToken,
  userController.getUserById
);

// PATCH /api/users/:id - Actualizar usuario
router.patch('/:id',
  verifyToken,
  checkPermission('usuarios.editar'),
  userController.updateUser
);

// PATCH /api/users/:id/toggle-enabled - Habilitar/Inhabilitar usuario
router.patch('/:id/toggle-enabled',
  verifyToken,
  checkPermission('usuarios.inhabilitar'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { enabled } = req.body;
      const usuario = await User.findByIdAndUpdate(id, { enabled }, { new: true });
      res.json({ success: true, data: usuario });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error al cambiar el estado' });
    }
  }
);

// PATCH /api/users/:id/change-password - Cambiar contraseña de otro usuario
router.patch('/:id/change-password',
  verifyToken,
  checkPermission('usuarios.editar'),
  userController.changePassword
);

// PATCH /api/users/:id/confirm-password-change - Confirmar cambio de contraseña inicial
router.patch('/:id/confirm-password-change',
  verifyToken,
  async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.params.id, { mustChangePassword: false });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error al actualizar estado de contraseña' });
    }
  }
);

// DELETE /api/users/:id - Eliminar usuario
router.delete('/:id',
  verifyToken,
  checkPermission('usuarios.eliminar'),
  userController.deleteUser
);

module.exports = router;
