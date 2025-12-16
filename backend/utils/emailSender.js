const { getGmailTransporter, enviarConGmail } = require('./gmailSender');

// Unified email sender wrapper. Use gmailSender helpers when configured; provide
// a consistent async API: sendMail(destinatario, asunto, html, attachments)
async function sendMail(destinatario, asunto, htmlContent, attachments = []) {
  if (!destinatario) throw new Error('Destinatario requerido');

  // Try the higher-level helper first (which will create transporter using OAuth2 or app-password)
  try {
    // If enviarConGmail is configured, prefer it (it will throw if not configured)
    if (typeof enviarConGmail === 'function') {
      return await enviarConGmail(destinatario, asunto, htmlContent, attachments);
    }
  } catch (err) {
    // Fallthrough to low-level transporter if enviarConGmail failed
    console.warn('emailSender: enviarConGmail fallo, intentando transporter directo:', err?.message || err);
  }

  // Fallback: try to get a transporter and send directly
  const transporter = getGmailTransporter && typeof getGmailTransporter === 'function' ? getGmailTransporter() : null;
  if (transporter) {
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || 'Pangea Sistemas'}" <${process.env.EMAIL_USER || process.env.GMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      html: htmlContent,
      attachments
    };
    return transporter.sendMail(mailOptions);
  }

  // Last resort: log and return a resolved promise to avoid crashing the caller.
  console.warn('emailSender: no hay transporter configurado — correo no enviado a:', destinatario);
  return { accepted: [], rejected: [destinatario], info: 'no-transporter' };
}

module.exports = { sendMail };
