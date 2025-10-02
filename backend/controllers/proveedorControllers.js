  const Proveedor = require('../models/proveedores');
  const Product = require('../models/Products');  



  exports.getProveedores = async (req, res) => {
    try {
      const proveedores = await Proveedor.find()
        .populate('productos', 'name price stock') // Asegúrate que productos esté bien definido
        .sort({ nombre: 1 });

      res.status(200).json({
        success: true,
        proveedores
      });
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los proveedores'
      });
    }
  };


  // Obtener proveedor por ID
  exports.getProveedorById = async (req, res) => {
    try {
      const proveedor = await Proveedor.findById(req.params.id);
      if (!proveedor) return res.status(404).json({ message: 'Proveedor no encontrado' });
      res.status(200).json(proveedor);
    } catch (err) {
      res.status(500).json({ message: 'Error al obtener proveedor', error: err.message });
    }
  };

  // Crear proveedor
  exports.createProveedor = async (req, res) => {
    try {
      const nuevoProveedor = new Proveedor(req.body);
      await nuevoProveedor.save();
      res.status(201).json({ message: 'Proveedor creado exitosamente', data: nuevoProveedor });
    } catch (err) {
      res.status(400).json({ message: 'Error al crear proveedor', error: err.message });
    }
  };

  // Actualizar proveedor
  exports.updateProveedor = async (req, res) => {
    try {
      const proveedorActualizado = await Proveedor.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!proveedorActualizado) return res.status(404).json({ message: 'Proveedor no encontrado' });
      res.status(200).json({ message: 'Proveedor actualizado', data: proveedorActualizado });
    } catch (err) {
      res.status(400).json({ message: 'Error al actualizar proveedor', error: err.message });
    }
  };

  // Eliminar proveedor
  exports.deleteProveedor = async (req, res) => {
    try {
      const proveedorEliminado = await Proveedor.findByIdAndDelete(req.params.id);
      if (!proveedorEliminado) return res.status(404).json({ message: 'Proveedor no encontrado' });
      res.status(200).json({ message: 'Proveedor eliminado' });
    } catch (err) {
      res.status(500).json({ message: 'Error al eliminar proveedor', error: err.message });
    }
  };

  // Desactivar proveedor
  exports.deactivateProveedor = async (req, res) => {
    try {
      const proveedor = await Proveedor.findByIdAndUpdate(req.params.id, { activo: false }, { new: true });
      if (!proveedor) return res.status(404).json({ message: 'Proveedor no encontrado' });
      res.status(200).json({ message: 'Proveedor desactivado', data: proveedor });
    } catch (err) {
      res.status(500).json({ message: 'Error al desactivar proveedor', error: err.message });
    }
  };

  // Activar proveedor
  exports.activateProveedor = async (req, res) => {
    try {
      const proveedor = await Proveedor.findByIdAndUpdate(req.params.id, { activo: true }, { new: true });
      if (!proveedor) return res.status(404).json({ message: 'Proveedor no encontrado' });
      res.status(200).json({ message: 'Proveedor activado', data: proveedor });
    } catch (err) {
      res.status(500).json({ message: 'Error al activar proveedor', error: err.message });
    }
  };

  exports.getProveedoresActivos = async (req, res) => {
  try {
    const proveedores = await Proveedor.find({ activo: true }).sort({ nombre: 1 });
    res.status(200).json({ success: true, proveedores });
  } catch (error) {
    console.error('Error al obtener proveedores activos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener proveedores' });
  }
};
