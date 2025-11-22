import express from 'express';
const router = express.Router();
import {
  registerStudio,
  verifyEmail,
  resendVerificationOTP,
  login,
  verifyInviteCode,
  forgotPassword,
  verifyResetToken,
  resetPassword
} from '../controler/authController.js';

// Register a new studio and user
router.post('/register', registerStudio);

// Verify email with OTP
router.post('/verify-email', verifyEmail);

// Resend verification OTP
router.post('/resend-otp', resendVerificationOTP);

// Login route
router.post('/login', login);

// Verify invite code
router.post('/verify-invite-code', verifyInviteCode);

// Forgot password - request reset token
router.post('/forgot-password', forgotPassword);

// Verify reset token
router.get('/verify-reset-token/:token', verifyResetToken);

// Reset password with token
router.post('/reset-password', resetPassword);

export default router;
