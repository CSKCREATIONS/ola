const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
const sgMail = require('@sendgrid/mail');
const EmailService = require('../services/emailService');
const crypto = require('node:crypto');

// Helper: configura SendGrid usando la clave específica de recuperación
function ensureSendGridForRecovery() {
  try {
    const apiKey = process.env.SENDGRID_RECUPERACION;

    if (!apiKey) {
      console.warn("❌ No existe SENDGRID_RECUPERACION en el .env");
      return false;
    }

    if (!apiKey.startsWith('SG.')) {
      console.warn("❌ La API key de SENDGRID_RECUPERACION no es válida");
      return false;
    }

    sgMail.setApiKey(apiKey);
    console.log("✅ SendGrid configurado para recuperación");
    return true;

  } catch (e) {
    console.warn('⚠️ No se pudo configurar SendGrid (auth):', e.message);
    return false;
  }
}




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

    console.log('[AuthController] Intento de login:', { username, hasPassword: !!password });

    // 1. Validación básica
    if (!username || !password) {
      console.log('[AuthController] Faltan credenciales');
      return res.status(400).json({
        success: false,
        message: "Usuario o contraseña incorrectos"
      });
    }

    // Sanitizar el username para prevenir inyección NoSQL
    // Asegurarse de que username sea un string y no un objeto
    const sanitizedUsername = typeof username === 'string' ? username.trim() : '';
    
    if (!sanitizedUsername) {
      console.log('[AuthController] Username inválido');
      return res.status(400).json({
        success: false,
        message: "Usuario o contraseña incorrectos"
      });
    }

    const user = await User.findOne({ username: sanitizedUsername })
      .select('+password')
      .populate('role'); // trae el objeto de rol completo

    console.log('[AuthController] Usuario encontrado:', { 
      found: !!user, 
      username: user?.username, 
      enabled: user?.enabled,
      roleEnabled: user?.role?.enabled,
      roleName: user?.role?.name
    });

    if (!user) {
      console.log('[AuthController] Usuario no existe');
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // valida si en usuario esta inhabilitado 
    if (!user.enabled) {
      console.log('[AuthController] Usuario inhabilitado');
      return res.status(403).json({
        success: false,
        message: "Usuario inhabilitado"
      });
    }

    // valida si el rol del usuario está inhabilitado
    if (!user.role.enabled) {
      console.log('[AuthController] Rol inhabilitado');
      return res.status(403).json({
        success: false,
        message: "Rol inhabilitado"
      });
    }

    const isMatch = await user.comparePassword(password);
    console.log('[AuthController] Verificación de contraseña:', { isMatch });

    if (!isMatch) {
      console.log('[AuthController] Contraseña incorrecta');
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas"
      });
    }


    // ✅ REGISTRA el último inicio de sesión
    user.lastLogin = new Date();
    await user.save();

    // 4. Generar token JWT


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
    // Sanitizar el email para prevenir inyección NoSQL
    const sanitizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    
    if (!sanitizedEmail?.includes('@')) {
      return res.status(400).json({ success: false, message: 'Email inválido' });
    }

    const user = await User.findOne({ email: sanitizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Correo no registrado' });
    }

    // Generar contraseña provisional con RNG criptográficamente seguro
    function generateSecurePassword(length = 8) {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const pwdChars = [];
      for (let i = 0; i < length; i++) {
        // crypto.randomInt is secure and available in Node >=12.10
        const idx = crypto.randomInt(0, alphabet.length);
        pwdChars.push(alphabet[idx]);
      }
      return pwdChars.join('');
    }

    const provisionalPassword = generateSecurePassword(8);

    // Configurar SendGrid en el momento del envío
    const sgReady = ensureSendGridForRecovery();
    if (!sgReady) {
      return res.status(500).json({ success: false, message: 'Servicio de correo no configurado. Falta SENDGRID_RECUPERACION.' });
    }

    const fromEmail =  'gaseosaconpan1@gmail.com';
    const fromName = process.env.SENDGRID_FROM_NAME || 'JLA Global Company';

    const msg = {
      to: sanitizedEmail,
      from: { email: fromEmail, name: fromName },
      subject: 'Recuperación de contraseña - JLA Global Company',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Recuperación de contraseña</h2>
          <p>Hola <strong>${user.firstName || user.username}</strong>,</p>
          <p>Tu contraseña provisional es:</p>
          <h3 style="color: #333; background: #f0f0f0; padding: 10px; display: inline-block;">${provisionalPassword}</h3>
          <p>Ingresa al sistema con esta contraseña y cámbiala inmediatamente.</p>
          <p>Si no solicitaste este cambio, ignora este mensaje.</p>
          <hr />
          <small>${fromName}</small>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      // Solo si el envío por SendGrid fue exitoso, actualizamos la contraseña (plain, el pre-save la hashea)
      user.password = provisionalPassword;
      user.provisional = true; // fuerza cambio en próximo login
      user.mustChangePassword = true; // obliga cambio de contraseña
      await user.save();
      return res.status(200).json({ success: true, message: 'Correo enviado correctamente (SendGrid)' });
    } catch (sgError) {
      console.warn('SendGrid falló, intentando Gmail/emailService...', sgError?.message || sgError);
      if (sgError?.response?.body) {
        console.warn('SendGrid body:', sgError.response.body);
      }

      // Fallback: intentar con Gmail/emailService
      try {
        const emailSrv = new EmailService();
        await emailSrv.enviarCorreoConAttachment(sanitizedEmail, 'Recuperación de contraseña - JLA Global Company', msg.html, null);
        user.password = provisionalPassword; // pre-save hash
        user.provisional = true;
        user.mustChangePassword = true; // obliga cambio de contraseña
        await user.save();
        return res.status(200).json({ success: true, message: 'Correo enviado correctamente (Gmail)' });
      } catch (fallbackError) {
        console.error('Fallback de correo falló:', fallbackError?.message || fallbackError);
        // No guardamos la nueva contraseña si no se pudo enviar el correo
        return res.status(500).json({ success: false, message: 'No se pudo enviar el correo de recuperación. Intente más tarde.' });
      }
    }

  } catch (error) {
    console.error('Error al recuperar contraseña:', error);
    // Intentar capturar errores de SendGrid para dar más contexto
    if (error?.response?.body) {
      console.error('SendGrid response:', error.response.body);
    }
    return res.status(500).json({ success: false, message: 'Error del servidor al enviar el correo de recuperación' });
  }
};

