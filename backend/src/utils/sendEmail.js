import nodemailer from 'nodemailer';

/**
 * Send password reset email with verification code.
 * @param {Object} options - Sending configurations.
 * @param {string} options.email - Target recipient email address.
 * @param {string} options.code - 6-character verification code.
 */
export const sendEmail = async ({ email, code }) => {
  const isSmtpConfigured = 
    process.env.SMTP_USER && 
    process.env.SMTP_USER !== 'placeholder@gmail.com' &&
    process.env.SMTP_PASS &&
    process.env.SMTP_PASS !== 'placeholder_app_password';

  if (!isSmtpConfigured) {
    console.log('\n┌────────────────────────────────────────────────────────┐');
    console.log('│  ⚠️  SMTP MAIL SERVER IS NOT FULLY CONFIGURED           │');
    console.log('│  🔑 DEVELOPMENT AUTO-FALLBACK ACTIVATED                │');
    console.log('│                                                        │');
    console.log(`│  Reset code for ${email.padEnd(38)} │`);
    console.log(`│  Verification Code: ${code.padEnd(34)} │`);
    console.log('└────────────────────────────────────────────────────────┘\n');
    return { success: true, loggedToConsole: true };
  }

  // Create standard transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL || '"ZenForge" <noreply@zenforge.app>',
    to: email,
    subject: 'ZenForge Password Reset Verification Code 🔑',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
    body {
      margin: 0;
      padding: 0;
      font-family: 'Outfit', -apple-system, sans-serif;
      background-color: #030712;
      color: #F3F4F6;
    }
    .wrapper {
      width: 100%;
      background-color: #030712;
      padding: 40px 0;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .logo {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 1px;
      color: #ffffff;
      margin-bottom: 24px;
      display: inline-block;
      border-bottom: 2px solid #8B5CF6;
      padding-bottom: 4px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 12px;
    }
    .subtitle {
      font-size: 15px;
      color: #9CA3AF;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .code-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1.5px dashed rgba(139, 92, 246, 0.4);
      border-radius: 16px;
      padding: 20px;
      margin: 25px 0;
      display: inline-block;
      min-width: 200px;
    }
    .code-text {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #A78BFA;
      margin: 0;
      text-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
    }
    .warning {
      font-size: 12px;
      color: #6B7280;
      margin-top: 30px;
      line-height: 1.5;
    }
    .divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      margin: 30px 0;
    }
    .footer {
      font-size: 12px;
      color: #9CA3AF;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo">ZenForge</div>
      <div class="title">Reset Your Password</div>
      <div class="subtitle">
        We received a request to reset your password. Use the security verification code below to authorize this request. This code is valid for 10 minutes.
      </div>
      <div class="code-box">
        <h1 class="code-text">${code}</h1>
      </div>
      <div class="subtitle" style="margin-top: 10px; font-weight: 600; color: #ffffff;">
        If you did not request a password reset, please ignore this email.
      </div>
      <div class="divider"></div>
      <div class="footer">
        © 2026 ZenForge productivity app. Built to maximize focus.
      </div>
    </div>
  </div>
</body>
</html>
`,
  };

  await transporter.sendMail(mailOptions);
  return { success: true };
};
