const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function sendWelcomeEmail(email, name, tempPassword) {
  // Check if SMTP is configured with real credentials (not placeholders)
  const isPlaceholder = !process.env.SMTP_EMAIL || 
                        process.env.SMTP_EMAIL.includes('your-email') || 
                        !process.env.SMTP_PASSWORD || 
                        process.env.SMTP_PASSWORD.includes('your-app-password');

  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/sign-in`;

  const htmlBody = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #DFE5F3; border-radius: 8px; background-color: #FFFFFF; color: #0D0D0D;">
      <h2 style="font-family: serif; color: #557373; border-bottom: 2px solid #DFE5F3; padding-bottom: 12px; margin-top: 0;">Welcome to InfoTally</h2>
      <p>Hello ${name},</p>
      <p>We are pleased to inform you that your request to join InfoTally has been approved by the academic coordination team.</p>
      <p>You can now sign in to your workspace using the temporary login credentials below:</p>
      
      <div style="background-color: #F2EFEA; padding: 16px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Login URL:</strong> <a href="${loginUrl}" style="color: #557373;">${loginUrl}</a></p>
        <p style="margin: 0 0 8px 0;"><strong>Username:</strong> ${email}</p>
        <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="background-color: #DFE5F3; padding: 2px 6px; border-radius: 2px;">${tempPassword}</code></p>
      </div>

      <p style="color: #557373; font-weight: bold;">Important: For security reasons, please change your password immediately after signing in for the first time.</p>
      
      <p>If you have any questions or require support, please contact your administrator.</p>
      
      <hr style="border: 0; border-top: 1px solid #DFE5F3; margin: 24px 0;" />
      <p style="font-size: 11px; color: #557373; margin: 0;">InfoTally Academic Coordination Team &copy; 2026</p>
    </div>
  `;

  if (isPlaceholder) {
    console.log('\n==================================================');
    console.log('[Mailer] Nodemailer is in Mock Mode (.env has placeholders).');
    console.log(`[Mailer] TO: ${email} (${name})`);
    console.log(`[Mailer] SUBJECT: Welcome to InfoTally`);
    console.log(`[Mailer] BODY: Temporary Password is "${tempPassword}". Login URL: ${loginUrl}`);
    console.log('==================================================\n');
    return { success: true, mock: true };
  }

  // Create real transport pool
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  try {
    await transporter.sendMail({
      from: `"InfoTally" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Welcome to InfoTally',
      html: htmlBody
    });
    console.log(`[Mailer] Welcome email sent successfully to ${email}`);
    return { success: true, mock: false };
  } catch (error) {
    console.error('[Mailer] Nodemailer Send Error:', error.message);
    throw error;
  }
}

module.exports = {
  sendWelcomeEmail
};
