const Product = require('../models/Products');
const Category = require('../models/category');
const Proveedores = require('../models/proveedores');

exports.createProduct = async(req,res) =>{
    try{
        const{name,description, price, stock, category, proveedor} = req.body;

        if(!name || !description || !price || !stock || !category || !proveedor){
            return res.status(404).json({
                success: false,
                message:'todos los campos son obligatorios'
            });
        }

        const categoryExist = await Category.findById(category);
        if(!categoryExist){
            return res.status(404).json({
                success: false,
                message:'la categoria especifica no existe'
            });
        }


        const proveedorExist = await Proveedores.findById(proveedor);
        if (!proveedorExist) {
            return res.status(404).json({
                success: false,
                message: 'El proveedor especificado no existe'
            });
        }

        const product = new Product({
            name,
            price,
            description,
            stock,
            category,
            proveedor
        });

        if (req.user?.id) {
            product.CreatedBy = req.user.id;
        }

        const savedProduct = await product.save();

        await Proveedores.findByIdAndUpdate(proveedor, {
            $push: { productos: savedProduct._id }
        });

        const productWithDetails = await Product.findById(savedProduct._id)
            .populate('category', 'name')
            .populate('proveedor');


        res.status(201).json({
            success:true,
            message:'producto creado exitosamente',
            data: productWithDetails
        });
    }catch(error){
        console.error('Error en createdProduct:',error);
        if(error.code === 11000){
            return res.status(400).json({
                success:false,
                message:'ya existe un producto con ese nombre'
            });
        }
        res.status(500).json({
            success:false,
            message:'Error al crear el producto',
            error: error.message
        });
    }
};

exports.getProducts = async (req,res) =>{
    try{
        const products = await Product.find()
            .populate('category','name') 
            .populate('proveedor', 'nombre empresa')
            .sort({createdAt: -1 });

        res.status(200).json({
            success:true,
            count: products.length,
            data:products
        });
    }catch (error){
        console.error('Error en el getProducts',error);
        res.status(500).json({
            success:false,
            message:'Error al obtener los productos'
        });
    }
};

exports.getProductById = async (req, res) =>{
    try{
        const product = await Product.findById(req.params.id)
            .populate('category','name description')
            .populate('proveedor', 'nombre empresa');

        if(!product){
            return res.status(404).json({
                success:false,
                message:'Producto no encontrado'
            });
        }

        res.status(200).json({
            success:true,
            data: product
        });
    } catch(error){
        console.error('Error en getProductById', error);
        res.status(500).json({
            success:false,
            message:'Error al obtener el producto'
        });
    }
};

exports.updateProduct = async (req,res) =>{
    try{
        const {name, description, price,stock,category, proveedor} = req.body;
        const updateData = {};

        if(name) updateData.name = name;
        if(description) updateData.description = description;
        if(price) updateData.price = price;
        if(stock) updateData.stock = stock;

        if(category){
            const categoryExist = await Category.findById(category);
            if(!categoryExist){
                return res.status(404).json({
                    success:false,
                    message:'la categoria especifica no existe'
                });
            }
            updateData.category = category;
        }

        

        if(proveedor){
            const proveedorExist = await Proveedores.findById(proveedor);
            if (!proveedorExist) {
                return res.status(404).json({
                    success: false,
                    message: 'El proveedor especificado no existe'
                });
            }
            updateData.proveedor = proveedor;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,{
                new:true,
                runValidators: true
            }
        )
        .populate('category', 'name')
        .populate('proveedor', 'nombre empresa');

        if(!updatedProduct){
            return res.status(404).json({
                success:false,
                message:'Producto no encontrado'
            });
        }

        res.status(200).json({
            success:true,
            message:'Producto actualizado exitosamente',
            data: updatedProduct
        });
    } catch(error){
        console.error('Error en updateProduct',error);
        res.status(500).json({
            success:false,
            message:'Error en actualizar el producto'
        });
    }
};



exports.deactivateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, { activo: false }, { new: true });
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json({ message: 'Producto desactivado', product });
    } catch (error) {
        res.status(500).json({ message: 'Error al desactivar producto', error });
    }
};

exports.activateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        // Obtener el producto primero para validar su categoría
        const existing = await Product.findById(id).populate('category', 'name activo');
        if (!existing) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Validar que la categoría exista y esté activa
        if (!existing.category) {
            return res.status(400).json({ message: 'El producto no tiene categoría asociada válida' });
        }
        if (existing.category.activo === false) {
            return res.status(400).json({ message: 'La categoría del producto está desactivada; no se puede activar el producto' });
        }

        // Activar el producto
        const product = await Product.findByIdAndUpdate(id, { activo: true }, { new: true })
            .populate('category', 'name')
            .populate('proveedor', 'nombre empresa');

        res.status(200).json({ message: 'Producto activado', product });
    } catch (error) {
        res.status(500).json({ message: 'Error al activar el producto', error });
    }
};


