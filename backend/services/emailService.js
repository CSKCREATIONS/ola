// services/emailService.js
const { enviarCorreoGmail } = require('../utils/gmailSender');
const { enviarCorreoSendGrid } = require('../utils/emailSender');

class EmailService {
  /**
   * Envía correo con attachment usando Gmail primero, SendGrid como fallback
   * @param {String} destinatario - Email del destinatario
   * @param {String} asunto - Asunto del correo
   * @param {String} htmlContent - Contenido HTML del correo
   * @param {Object|null} pdfAttachment - Attachment PDF { filename, content, contentType }
   */
  async enviarCorreoConAttachment(destinatario, asunto, htmlContent, pdfAttachment = null) {
    const attachments = pdfAttachment ? [pdfAttachment] : [];
    
    try {
      console.log('📧 Intentando enviar con Gmail...');
      await enviarCorreoGmail(destinatario, asunto, htmlContent, attachments);
      console.log('✅ Correo enviado exitosamente con Gmail');
      return { success: true, provider: 'gmail' };
    } catch (error) {
      console.warn('⚠️ Gmail falló, intentando con SendGrid...', error.message);
      try {
        await enviarCorreoSendGrid(destinatario, asunto, htmlContent, attachments);
        console.log('✅ Correo enviado exitosamente con SendGrid (fallback)');
        return { success: true, provider: 'sendgrid' };
      } catch (error_) {
        console.error('❌ Ambos servicios de email fallaron');
        throw new Error(`Gmail: ${error.message}. SendGrid: ${error_.message}`);
      }
    }
  }

  /**
   * Envía correo de prueba para verificar configuración
   * @param {String} destinatario - Email de destino
   * @returns {Object} - Resultado del envío
   */
  async enviarCorreoPrueba(destinatario) {
    const asunto = 'Prueba de configuración de email - Pangea';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Prueba de Configuración de Email</h2>
        <p>Este es un email de prueba para verificar la configuración del sistema.</p>
        <p><strong>Hora de prueba:</strong> ${new Date().toLocaleString('es-CO')}</p>
        <p><strong>Estado:</strong> ✅ Email enviado exitosamente</p>
      </div>
    `;

    return await this.enviarCorreoConAttachment(destinatario, asunto, htmlContent, null);
  }

  /**
   * Prepara datos de attachment PDF
   * @param {Buffer} buffer - Buffer del PDF
   * @param {String} filename - Nombre del archivo
   * @returns {Object} - Objeto attachment
   */
  prepararAttachmentPDF(buffer, filename) {
    return {
      filename: filename || 'documento.pdf',
      content: buffer,
      contentType: 'application/pdf'
    };
  }
}

module.exports = EmailService;
