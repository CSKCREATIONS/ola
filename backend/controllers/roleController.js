const Role = require('../models/Role');

exports.createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'Nombre del rol requerido' });
    }

    // Validación básica de permisos
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: 'Permisos deben ser un arreglo' });
    }

    const existing = await Role.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Rol ya existe' });
    }

    const newRole = new Role({ name, permissions });
    await newRole.save();

    res.status(201).json({ success: true, message: 'Rol creado', data: newRole });
  } catch (error) {
    console.error('[RoleController] Error al crear rol:', error);
    res.status(500).json({ success: false, message: 'Error interno', error: error.message });
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.status(200).json({
      success: true,
      roles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener roles', error
    });
  }
};

// En controllers/roleController.js
exports.toggleEnabled = async (req, res) => {
  try {
    const { enabled } = req.body;
    const updated = await Role.findByIdAndUpdate(
      req.params.id,
      { enabled },
      { new: true }
    );
    res.json({ success: true, role: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error actualizando el estado del rol' });
  }
};

exports.updateRole = async (req, res) => {
  const roleId = req.params.id;
  const { name, permissions } = req.body;

  if (!name || !Array.isArray(permissions)) {
    return res.status(400).json({
      success: false,
      message: 'El nombre y los permisos son requeridos.'
    });
  }

  try {
    const updatedRole = await Role.findByIdAndUpdate(
      roleId,
      { name, permissions },
      { new: true }
    );

    if (!updatedRole) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado.'
      });
    }

    res.json({
      success: true,
      message: 'Rol actualizado correctamente.',
      role: updatedRole
    });
  } catch (error) {
    console.error('[updateRole]', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar el rol.'
    });
  }
};
