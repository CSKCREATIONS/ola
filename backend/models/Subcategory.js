const moongose = require('mongoose');
const { default: mongoose } = require('mongoose');

const subcategorySchema = new moongose.Schema({
    name:{
        type: String,
        required:[true,'El nombre es obligatorio'],
        trim:true,
        unique: true,
    },
    description:{
        type:String,
        required:[true,'La descripcion es obligatoria'],
        trim: true,
    },
    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Category',
        required:[true, 'La categoria es requerida']
    },
    activo: { type: Boolean, default: true }

},{
    timestamps: true,
    versionKey:false
});

//Manejo de errores de duplicados
subcategorySchema.post('save', function(error, doc,next){
    if(error.name === 'MongoServerError' && error.code === 11000){
        next(new Error('Ya existe una subcategoria con ese nombre'));
    } else{
        next(error);
    }
});

module.exports = mongoose.model('Subcategory', subcategorySchema);