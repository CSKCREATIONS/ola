const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true,'El nombre es obligatorio'],
        unique: true,
        trim:true
    },
    description:{
        type: String,
        required:[true, 'la descripcion es obligatoria'],
        trim: true
    },
    activo: { type: Boolean, default: true }

},{
    timestamps:true,
    versionKey: false

});

//Eliminar el indice problematico si existe

categorySchema.pre('save', async function(next){
    try{
        const collection = this.constructor.collection;
        const indexes = await collection.indexes();

        //Buscar y eliminar indice problematico con nombre "nombre_1"

        const problematicIndex = indexes.find(index => index.name === 'nombre_1');
        if(problematicIndex){
            await collection.dropIndex('nombre_1');
            console.log('Índice problemático eliminado: nombre_1');
        }
    }catch (err){
        //ignorar si el indice no existe
        if(!err.message.includes('Index not found')){
            return next (err);
        }
    }
    next();
});

//crear nuevo indice correcto
categorySchema.index({ name: 1 }, {
    unique:true,
    name:'name_1'//nombre explicito para el indice
});

module.exports = mongoose.model('Category',categorySchema);