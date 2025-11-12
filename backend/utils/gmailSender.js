const nodemailer = require('nodemailer');

// Centralized Gmail transporter factory — returns a secure SMTPS transporter.
// Supports two modes:
//  - App Password mode: set GMAIL_USER + GMAIL_APP_PASSWORD (or EMAIL_USER / EMAIL_PASS)
//  - OAuth2 mode (recommended for production): set GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET, GMAIL_OAUTH_REFRESH_TOKEN and GMAIL_OAUTH_USER
// The function will prefer OAuth2 if the required env vars are present.
function getGmailTransporter() {
  // Prefer OAuth2 when possible
  const oauthClientId = process.env.GMAIL_OAUTH_CLIENT_ID;
  const oauthClientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET;
  const oauthRefreshToken = process.env.GMAIL_OAUTH_REFRESH_TOKEN;
  const oauthUser = process.env.GMAIL_OAUTH_USER;

  if (oauthClientId && oauthClientSecret && oauthRefreshToken && oauthUser) {
    // OAuth2 transporter
    try {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: oauthUser,
          clientId: oauthClientId,
          clientSecret: oauthClientSecret,
          refreshToken: oauthRefreshToken
        },
        // Enforce TLS
        requireTLS: true,
        tls: { minVersion: 'TLSv1.2' }
      });
    } catch (err) {
      console.error('❌ Error creando transporter OAuth2:', err?.message || err);
      // Fallthrough to App Password mode if OAuth2 fails
    }
  }

  // App Password / basic auth fallback
  const user = process.env.EMAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  try {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      requireTLS: true,
      tls: { minVersion: 'TLSv1.2' },
      connectionTimeout: 10000,
      greetingTimeout: 5000
    });
  } catch (err) {
    console.error('❌ Error creando transporter (SMTPS):', err?.message || err);
    return null;
  }
}

// Helper: send mail with Gmail transporter (tries to get transporter and send)
async function enviarConGmail(destinatario, asunto, htmlContent, attachments = []) {
  const transporter = getGmailTransporter();
  if (!transporter) throw new Error('Gmail transporter no configurado');

  const mailOptions = {
    from: `"${process.env.COMPANY_NAME || 'Pangea Sistemas'}" <${process.env.EMAIL_USER || process.env.GMAIL_USER}>`,
    to: destinatario,
    subject: asunto,
    html: htmlContent,
    attachments
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { getGmailTransporter, enviarConGmail };