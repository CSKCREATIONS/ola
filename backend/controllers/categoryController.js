const Category = require('../models/category');
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
        // Sanitizar el ID para prevenir inyección NoSQL
        const categoryId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
        
        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: 'ID de categoría inválido'
            });
        }
        
        const category = await Category.findById(categoryId);
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

// Actualizar categoria
exports.updateCategory = async (req, res) =>{
    try{
        const{name, description, activo} = req.body;
        
        // Sanitizar el ID para prevenir inyección NoSQL
        const categoryId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
        
        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: 'ID de categoría inválido'
            });
        }
        
        const updateData = {};
        
        // Permitir actualizar el estado activo
        if(activo !== undefined){
            updateData.activo = activo;
        }
        
        if(name){
            updateData.name = name.trim();
            
            // verificar si el nuevo nombre ya existe
            const existing = await Category.findOne({
                name : updateData.name,
                _id:{$ne: categoryId}
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
            categoryId,
            updateData,
            {new:true, runValidators: true}
        );
        if(!updatedCategory){
            return res.status(404).json({
                success:false,
                message:'Categoria no encontrada'
            });
        }
        // Si se desactiva la categoría, también desactivar productos asociados (sin tocar subcategorías)
        if (updateData.activo === false) {
            try {
                const prodResult = await Products.updateMany({ category: categoryId }, { activo: false });
                console.log(`Productos desactivados por categoría ${categoryId}: ${prodResult.modifiedCount}`);
            } catch (error_) {
                console.warn('No se pudieron desactivar productos asociados a la categoría:', error_?.message || error_);
            }
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


// DESACTIVAR sólo la Categoría (sin subcategorías ni productos)
exports.desactivarCategoriaYRelacionados = async (req, res) => {
    const { id } = req.params;
    try {
        const categoryId = typeof id === 'string' ? id.trim() : '';
        if (!categoryId) {
            return res.status(400).json({ success: false, message: 'ID de categoría inválido' });
        }
        const categoria = await Category.findByIdAndUpdate(categoryId, { activo: false }, { new: true });
        if (!categoria) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        // Desactivar productos ligados a esta categoría
        try {
            const prodResult = await Products.updateMany({ category: categoryId }, { activo: false });
            console.log(`Productos desactivados por categoría ${categoryId}: ${prodResult.modifiedCount}`);
        } catch (error_) {
            console.warn('No se pudieron desactivar productos asociados a la categoría:', error_?.message || error_);
        }
        return res.status(200).json({ success: true, message: 'Categoría desactivada correctamente', data: categoria });
    } catch (error) {
        console.error('Error al desactivar categoría:', error);
        return res.status(500).json({ success: false, message: 'Error al desactivar la categoría', error: error.message });
    }
};


// ACTIVAR Categoría (no activa subcategorías ni productos)
exports.activarCategoria = async (req, res) => {
    const { id } = req.params;

    try {
        // Sanitizar el ID para prevenir inyección NoSQL
        const categoryId = typeof id === 'string' ? id.trim() : '';
        
        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: 'ID de categoría inválido'
            });
        }

        const categoria = await Category.findByIdAndUpdate(categoryId, { activo: true }, { new: true });
        if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' });

        // Activación sólo afecta la categoría.
        res.status(200).json({ message: 'Categoría activada correctamente' });
    } catch (error) {
        console.error('Error al activar:', error);
        res.status(500).json({ message: 'Error al activar la categoría', error });
    }
};
