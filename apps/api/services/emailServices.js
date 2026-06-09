const nodemailer = require('nodemailer');

// Email is OPTIONAL. If SMTP credentials are not configured, the app still runs
// fully — sendTaskEmail just logs the message instead of sending it. This keeps
// account creation / password reset working in demo/dev without a mailbox.
const emailConfigured = Boolean(process.env.EMAIL_USERS && process.env.EMAIL_PASSWORD);

const transporter = emailConfigured
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERS,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  : null;

if (!emailConfigured) {
  console.warn('⚠️  EMAIL_USERS / EMAIL_PASSWORD not set — emails will be logged, not sent.');
}

const sendTaskEmail = async (to, subject, text) => {
  // No-op (log only) when email isn't configured.
  if (!transporter) {
    console.log(`📭 [email skipped] to=${to} | subject="${subject}"`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USERS,
      to,
      subject,
      text
    });
    console.log('✅ Email sent to:', to, '| Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending email to', to, ':', error.message);
  }
};

module.exports = { sendTaskEmail };
