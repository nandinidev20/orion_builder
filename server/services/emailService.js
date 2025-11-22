// email.service.js (ESM)
import nodemailer from 'nodemailer';

/**
 * Build a nodemailer transporter.
 * If EMAIL_SERVICE is provided (e.g. "gmail"), we use that.
 * Otherwise we fall back to host/port/secure from env.
 */
function buildTransporter() {
  const {
    EMAIL_SERVICE = 'gmail',
    EMAIL_USER = "shrutigdev2@gmail.com",
    EMAIL_APP_PASSWORD = "icmsbgxothxvoirx",
    EMAIL_HOST = 'smtp.gmail.com',
    EMAIL_PORT = 587,
    EMAIL_SECURE = false,
  } = process.env;

  if (!EMAIL_USER || !EMAIL_APP_PASSWORD) {
    throw new Error('EMAIL_USER and EMAIL_APP_PASSWORD must be set in env.');
  }

  if (EMAIL_SERVICE) {
    return nodemailer.createTransport({
      service: EMAIL_SERVICE, // e.g. 'gmail', 'outlook'
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_APP_PASSWORD, // For Gmail, use an App Password
      },
    });
  }

  // Host/Port mode
  if (!EMAIL_HOST || !EMAIL_PORT) {
    throw new Error(
      'Either EMAIL_SERVICE must be set, or EMAIL_HOST and EMAIL_PORT must be provided.'
    );
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: String(EMAIL_SECURE || '').toLowerCase() === 'true', // true for 465, false for others
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_APP_PASSWORD,
    },
  });
}

const transporter = buildTransporter();

// Verify transporter configuration
export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('Email server configuration error:', error);
    return false;
  }
};

// Send verification email with OTP
export const sendVerificationEmail = async (email, otp, studioName) => {
  try {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const safeStudio = studioName || 'Our Platform';

    const mailOptions = {
      from,
      to: email,
      subject: 'Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Hello,</p>
          <p>Thank you for registering with ${safeStudio}. Please use the following OTP to verify your email address:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; letter-spacing: 3px;">
              ${String(otp)}
            </span>
          </div>
          <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
          <p>Best regards,<br>The ${safeStudio} Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, message: 'Verification email sent successfully', messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, message: 'Failed to send verification email', error: error.message };
  }
};

// Send studio invite email
export const sendStudioInviteEmail = async (email, subdomain, inviteCode, studioName) => {
  try {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const BASE_DOMAIN = process.env.SERVER_BASE_DOMAIN || 'lvh.me:5173';
    const safeStudio = studioName || 'Studio';

    const encodedEmail = encodeURIComponent(email);
    const encodedStudioName = encodeURIComponent(safeStudio);
    const inviteLink = `http://${subdomain}.${BASE_DOMAIN}/studio/accept-invite?code=${encodeURIComponent(inviteCode)}&email=${encodedEmail}&studio=${encodedStudioName}`;
    console.log(inviteLink);
    const mailOptions = {
      from,
      to: email,
      subject: `Studio Invite - ${safeStudio}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Studio Invitation</h2>
          <p>Hello,</p>
          <p>You have been invited to join <strong>${safeStudio}</strong> on our platform.</p>
          <p>Please click the link below to accept the invitation and set up your account:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
            ${inviteLink}
          </p>
          <p>This invitation is valid for 7 days. If you have any questions, please contact the studio administrator.</p>
          <p>Best regards,<br>The ${safeStudio} Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Studio invite email sent:', info.messageId);
    return { success: true, message: 'Studio invite email sent successfully', messageId: info.messageId };
  } catch (error) {
    console.error('Error sending studio invite email:', error);
    return { success: false, message: 'Failed to send studio invite email', error: error.message };
  }
};

// Send user invite email (for admin panel user invites)
export const sendUserInviteEmail = async (email, name, inviteCode) => {
  try {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const BASE_DOMAIN = process.env.SERVER_BASE_DOMAIN || 'lvh.me:5173';

    const encodedEmail = encodeURIComponent(email);
    const encodedName = encodeURIComponent(name || '');
    const inviteLink = `https://${BASE_DOMAIN}/accept-invite?code=${encodeURIComponent(inviteCode)}&email=${encodedEmail}&name=${encodedName}`;

    const mailOptions = {
      from,
      to: email,
      subject: 'Your Invitation to Join Our Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Platform Invitation</h2>
          <p>Hello ${name ? name : 'there'},</p>
          <p>You have been invited to join our platform.</p>
          <p>Please click the link below to accept the invitation and set up your account:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
            ${inviteLink}
          </p>
          <p>This invitation is valid for 7 days. If you have any questions, please contact the administrator.</p>
          <p>Best regards,<br>The Platform Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('User invite email sent:', info.messageId);
    return { success: true, message: 'User invite email sent successfully', messageId: info.messageId };
  } catch (error) {
    console.error('Error sending user invite email:', error);
    return { success: false, message: 'Failed to send user invite email', error: error.message };
  }
};

// Send resend invite email
export const sendResendInviteEmail = async (email, name,subdomain, inviteCode) => {
  try {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const BASE_DOMAIN = process.env.BASE_DOMAIN || 'apb.in';

    const encodedEmail = encodeURIComponent(email);
    const encodedName = encodeURIComponent(name || '');
    const inviteLink = `https://${BASE_DOMAIN}/accept-invite?code=${encodeURIComponent(inviteCode)}&email=${encodedEmail}&name=${encodedName}`;

    const mailOptions = {
      from,
      to: email,
      subject: 'Your Invitation Link - Reminder',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Invitation Reminder</h2>
          <p>Hello ${name ? name : 'there'},</p>
          <p>This is a reminder about your invitation to join our platform. The invitation is still valid.</p>
          <p>Please click the link below to accept the invitation and set up your account:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
            ${inviteLink}
          </p>
          <p>This invitation is valid for 7 days from the date of this email. If you have any questions, please contact the administrator.</p>
          <p>Best regards,<br>The Platform Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Resend invite email sent:', info.messageId);
    return { success: true, message: 'Resend invite email sent successfully', messageId: info.messageId };
  } catch (error) {
    console.error('Error sending resend invite email:', error);
    return { success: false, message: 'Failed to send resend invite email', error: error.message };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const BASE_DOMAIN = process.env.BASE_DOMAIN || 'apb.in';

    const resetLink = `https://${BASE_DOMAIN}/reset-password/${resetToken}`;

    const mailOptions = {
      from,
      to: email,
      subject: 'Password Reset Request - OrionArtd',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset the password for your account. If you did not make this request, you can ignore this email.</p>
          <p>To reset your password, please click the link below:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px; font-size: 12px;">
            ${resetLink}
          </p>
          <p style="color: #666; font-size: 12px;">This password reset link will expire in 1 hour for security reasons.</p>
          <p>If you did not request a password reset, please ignore this email or contact our support team if you have any concerns.</p>
          <p>Best regards,<br>The OrionArtd Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, message: 'Password reset email sent successfully', messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, message: 'Failed to send password reset email', error: error.message };
  }
};

export default {
  verifyEmailConfig,
  sendVerificationEmail,
  sendStudioInviteEmail,
  sendUserInviteEmail,
  sendResendInviteEmail,
  sendPasswordResetEmail,
};
