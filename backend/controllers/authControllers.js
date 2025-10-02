const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey('');


// Función para verificar permisos
const checkPermission = (userRole, allowedRoles) => {
  return allowedRoles.includes(userRole);
};

// 1. Registro de usuarios (SOLO ADMIN)
exports.signup = async (req, res) => {
  try {
    // Validación manual adicional
    if (!req.body.username || req.body.username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "El nombre de usuario es requerido",
        field: "username"
      });
    }

    // Crear instancia de usuario
    const user = new User({
      firstName: req.body.firstName.trim(),
      secondName: req.body.secondName.trim(),
      surname: req.body.surname.trim(),
      secondSurname: req.body.secondSurname.trim(),
      username: req.body.username.trim(),
      email: req.body.email.toLowerCase().trim(),
      password: req.body.password,
      role: req.body.role
    });

    // Guardar usuario en la base de datos
    const savedUser = await user.save();

    // Generar token JWT
    const token = jwt.sign(
      {
        id: savedUser._id,
        role: savedUser.role
      },
      config.secret,
      { expiresIn: config.jwtExpiration }
    );

    // Preparar respuesta sin datos sensibles
    const userData = savedUser.toObject();
    delete userData.password;

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      token: token,
      user: userData
    });

  } catch (error) {
    console.error('[AuthController] Error en registro:', error);

    // Manejo especial de errores de MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `El ${field} ya está en uso`,
        field: field
      });
    }

    // Manejo de otros errores de validación
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
      error: error.message
    });
  }
};

exports.signin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Validación básica
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Usuario o contraseña incorrectos"
      });
    }


    const user = await User.findOne({ username })
      .select('+password')
      .populate('role'); // trae el objeto de rol completo


    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // valida si en usuario esta inhabilitado 
    if (!user.enabled) {
      return res.status(403).json({
        success: false,
        message: "Usuario inhabilitado"
      });
    }

    // valida si el rol del usuario está inhabilitado
    if (!user.role.enabled) {
      return res.status(403).json({
        success: false,
        message: "Rol inhabilitado"
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas"
      });
    }


    // ✅ REGISTRA el último inicio de sesión
    user.lastLogin = new Date();
    await user.save();

    // 4. Generar token JWT


    const Role = require('../models/Role');

    // buscar el rol completo con permisos
    const roleDoc = user.role;

    if (!roleDoc) {
      return res.status(500).json({ success: false, message: "Rol no asignado correctamente al usuario" });
    }


    // generar el token con permisos
    const token = jwt.sign(
      {
        id: user._id,
        role: roleDoc.name, // usamos name, no el objeto entero
        email: user.email,
        permissions: roleDoc.permissions
      },
      config.secret,
      { expiresIn: config.jwtExpiration }
    );

    const userData = user.toObject();
    delete userData.password;
    userData.permissions = roleDoc.permissions;
    userData.mustChangePassword = user.mustChangePassword;
    userData.role = roleDoc.name; // incluir solo el nombre en el frontend



    res.status(200).json({
      success: true,
      message: "Autenticación exitosa",
      token,
      user: userData
    });

  } catch (error) {
    console.error('[AuthController] Error en login:', error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message
    });
  }
};

exports.recoverPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Correo no registrado' });
    }

    const provisionalPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(provisionalPassword, 10);

    user.password = hashedPassword;
    user.provisional = true;
    await user.save();

    const msg = {
      to: email,
      from: 'gaseosaconpan1@gmail.com', // usa el Gmail verificado
      subject: 'Recuperación de contraseña - JLA Global Company',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Recuperación de contraseña</h2>
          <p>Hola <strong>${user.firstName}</strong>,</p>
          <p>Tu contraseña provisional es:</p>
          <h3 style="color: #333; background: #f0f0f0; padding: 10px; display: inline-block;">${provisionalPassword}</h3>
          <p>Ingresa al sistema con esta contraseña y cámbiala inmediatamente.</p>
          <p>Si no solicitaste este cambio, ignora este mensaje.</p>
          <hr />
          <small>JLA Global Company</small>
        </div>
      `
    };

    await sgMail.send(msg);
    return res.status(200).json({ success: true, message: 'Correo enviado correctamente' });

  } catch (error) {
    console.error('Error al recuperar contraseña:', error);
    return res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

