const nodemailer = require('nodemailer');

// Configuración alternativa con Gmail
const gmailTransporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD // No la contraseña normal, sino App Password
  }
});

// Función alternativa para enviar con Gmail
const enviarConGmail = async (destinatario, asunto, htmlContent) => {
  const mailOptions = {
    from: `"Pangea Sistemas" <${process.env.GMAIL_USER}>`,
    to: destinatario,
    subject: asunto,
    html: htmlContent
  };

  return await gmailTransporter.sendMail(mailOptions);
};

module.exports = { enviarConGmail };