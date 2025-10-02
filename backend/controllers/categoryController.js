const Category = require('../models/category');
const Subcategoria = require('../models/Subcategory')
const Products = require('../models/Products');



exports.createCategory = async (req, res) =>{
    try{
        const{name, description} = req.body;

        //Validacion
        if(!name || typeof name !== 'string'|| !name.trim()){
            return res.status(400).json({
                success:false,
                message:'El nombre es obligatorio y debe ser texto valido'
            });
        }
        if(!description || typeof description !== 'string' || !description.trim()){
            return res.status(400).json({
                success:false,
                message:'la descripcion es obligatoria y debe ser texto valido'
            });
        }

        const trimmedName = name.trim();
        const trimmedDesc = description.trim();

        //Verificar si ya existe la categoria
        const existingCategory = await Category.findOne({name:trimmedName});
        if(existingCategory){
        return res.status(400).json({
            success:false,
            message:'ya existe una categoria con ese nombre'
        });
        }
        const newCategory = new Category ({
            name:trimmedName,
            description:trimmedDesc
         });

        await newCategory.save();

        res.status(201).json({
            success:true,
            message:'categoria creada exitosamente',
            data:newCategory
    });
 
}catch(error){
    console.error('Error en createCategory',error);
    //Manejo especifico de error de duplicados
    if(error.code === 11000){
        return res.status(400).json({
            success:false,
            message:'Ya existe una categoria con ese nombre'
        });
    }

    res.status(500).json({
        success:false,
        message:'Error al crear categoria',
        error: error.message
    });
    }
};


exports.getCategories = async(req, res) =>{
    try{
        const categories = await Category.find().sort({createdAt:-1});
        res.status(200).json({
            success: true,
            data:categories
        });
    }catch(error){
        console.log('Error en getCategories',error);
        res.status(500).json({
            success:false,
            message:'Error al obtener categorias'
        });
    }
   
};

exports.getCategoryById = async (req,res) =>{
    try{
        const category = await Category.findById(req.params.id);
        if(!category){
            return res.status(404).json({
                success: false,
                message:' Categoria no encontrada'
            });
        }
        res.status(200).json({
            success: true,
            data: category
        });
    }catch(error){
        console.error('Error en getCategoryById',error);
        res.status(500).json({
            success:false,
            message:'Error al obtener categoria'
        });
    }
};

exports.updateCategory = async (req, res) =>{
    try{
        const{name, description} = req.body;
        const updateData = {};
        if(name){
            updateData.name = name.trim();
            // verificar si el nuevo nombre ya existe
            const existing = await Category.findOne({
                name : updateData.name,
                _id:{$ne: req.params.id}

            });
            if(existing){
                return res.status(400).json({
                    success: false,
                    message:'ya existe una categoria con ese nombre'
                });
            }
        }
        if(description){
        updateData.description = description.trim();

        }
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            {new:true, runValidators: true}
        );
        if(!updatedCategory){
            return res.status(404).json({
                success:false,
                message:'Categoria no encontrada'
            });
        }
        res.status(200).json({
            success:true,
            message:'Categoria actualizada',
            data:updatedCategory
        });
    
    }catch(error){
        console.error('Error en updateCategory',error);
        res.status(500).json({
            success:false,
            message:'Error al actualizar categoria'
        });
    }
    
};



// DESACTIVAR Categoría + Subcategorías + Productos
exports.desactivarCategoriaYRelacionados = async (req, res) => {
  const { id } = req.params;

  try {
    await Category.findByIdAndUpdate(id, { activo: false });

    const subcategorias = await Subcategoria.find({ category: id });

    for (const sub of subcategorias) {
      await Subcategoria.findByIdAndUpdate(sub._id, { activo: false });

      // CAMBIO AQUÍ 👇
      const productos = await Products.find({ subcategory: sub._id });
      console.log(`Productos encontrados para sub ${sub.name}:`, productos.length);

      const result = await Products.updateMany({ subcategory: sub._id }, { activo: false });
      console.log('Productos desactivados:', result.modifiedCount);
    }

    res.status(200).json({ message: 'Todo desactivado correctamente' });
  } catch (error) {
    console.error('Error al desactivar:', error);
    res.status(500).json({ message: 'Error al desactivar la categoría', error });
  }
};


// ACTIVAR Categoría (no activa subcategorías ni productos)
exports.activarCategoriaYRelacionados = async (req, res) => {
    const { id } = req.params;

    try {
        const categoria = await Category.findByIdAndUpdate(id, { activo: true }, { new: true });
        if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' });

        // Nota: ya no se activan automáticamente las subcategorías ni los productos asociados.
        res.status(200).json({ message: 'Categoría activada correctamente' });
    } catch (error) {
        console.error('Error al activar:', error);
        res.status(500).json({ message: 'Error al activar la categoría', error });
    }
};
