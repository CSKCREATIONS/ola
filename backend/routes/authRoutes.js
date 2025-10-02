const express = require ('express');
const router = express.Router();
const authController = require('../controllers/authControllers');
const {verifySignUp} = require('../middlewares');

//importacion de verificacion
let verifyToken;
try{
    const authJwt = require('../middlewares/authJwt');
    verifyToken = authJwt.verifyToken;
    console.log('[AuthRoutes] verifyToken importando correctamente:',typeof verifyToken);
}catch(error){
    console.error('[AuthRoutes] Error al importar verifyToken', error);
    throw error;
}
//middlewares
router.use((req,res,next) =>{
    console.log('\n[AuthRoutes] peticion recibida',{
        method: req.method,
        path:req.path,
        hearder:{
            authorization:req.headers.authorization ? '***' : 'NO',
            'x-access-token':req.headers
            ['x-access-token'] ? '***' : 'NO'

        }

    });
    next();
});

//Rutas de login(sin proteccion)
router.post('/signin', authController.signin);

//Ruta de registro

router.post('/signup',
    (req,res,next) =>{
        console.log('[AuthRoutes] Middleware de verificacion de registro');
        next();
    },
    verifySignUp.checkDuplicateUsernameOrEmail,
    verifySignUp.checkRolesExisted,
    authController.signup
);

router.post('/recover-password', authController.recoverPassword);

//verificacion final de rutas
console.log('[AuthRoutes] Rutas configuradas:',router.stack.map(layer =>{
    return{
        path: layer.route?.path,
        methods: layer.route?.methods
    };
}));



module.exports = router;