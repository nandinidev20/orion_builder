import User from '../model/User.js';
import Studio from '../model/Studio.js';
import Invite from '../model/invite.js';
import { generateOTP, hashPassword, loginUser } from '../services/authService.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { loggerInstance } from '../middleware/logger.js';
import { ValidationError } from '../utils/ApiError.js';
import crypto from 'crypto';

// Register a new studio and user
const registerStudio = async (req, res, next) => {
  try {
    const { email, password, studioName, subdomain } = req.body;

    // Validate required fields
    if (!email || !password || !studioName || !subdomain) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, studio name, and subdomain are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if subdomain already exists
    const existingStudio = await Studio.findOne({ subdomain });
    if (existingStudio) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new studio
    const studio = await Studio.create({
      name: studioName,
      subdomain,
      ownerEmail: email
    });

    // Create new user
    const user = await User.create({
      email,
      password: hashedPassword,
      studio: studio._id,
      role: 'studio-owner',
      username: email.split('@')[0]
    });

    // Link studio to user
    studio.owner = user._id;
    await studio.save();

    res.success({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      },
      studio: {
        id: studio._id,
        name: studio.name,
        subdomain: studio.subdomain
      }
    }, 'Studio and user registered successfully');
  } catch (error) {
    next(error);
  }
};

// Verify email with OTP
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Validate required fields
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP is valid and not expired
    if (user.verificationOTP !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update user as verified
    user.isEmailVerified = true;
    user.verificationOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.success({ user: { id: user._id, email: user.email } }, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

// Resend verification OTP
const resendVerificationOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate required field
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    user.verificationOTP = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await user.save();

    // Send OTP email
    await sendVerificationEmail(email, otp, 'Verification');

    res.success({ message: 'Verification OTP sent successfully' });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
 try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Use the service function to handle login logic
    const result = await loginUser(email, password);
    
    // Send success response with token and user data
    res.success({
      token: result.token,
      user: result.user
    }, result.message);
  } catch (error) {
    // Handle specific errors from the service
    if (error.message === 'Invalid email') {
      return res.status(404).json({
        success: false,
        message: 'Invalid email or password'
      });
    } else if (error.message === 'Invalid password') {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    } else if (error.message === 'Please verify your email before logging in') {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    } else if (error.message === 'Associated studio not found') {
      return res.status(404).json({
        success: false,
        message: 'Associated studio not found'
      });
    } else if (error.message === 'Your account has been suspended') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been suspended'
      });
    } else if (error.message === 'Your studio account has been suspended') {
      return res.status(401).json({
        success: false,
        message: 'Your studio account has been suspended'
      });
    } else {
      // Pass other errors to the global error handler
      next(error);
    }
  }
};

// Verify if an invite code is valid
const verifyInviteCode = async (req, res, next) => {
  try {
    const { code, email } = req.body;

    // Validate required fields
    if (!code) {
      return res.status(400).json({
        success: false,
        isValid: false,
        message: 'Invite code is required'
      });
    }

    // Find the invite by both code and email to ensure security
    const invite = await Invite.findOne({ 
      inviteCode: code, 
      email: email ? email.toLowerCase() : email 
    });
    
    if (!invite) {
      return res.status(404).json({
        success: false,
        isValid: false,
        message: 'Invalid invite code or email does not match invite recipient'
      });
    }

    // Check if the invite has expired
    if (invite.inviteCodeExpiresAt < new Date()) {
      // Update the invite status to expired
      invite.status = 'expired';
      await invite.save();
      return res.status(400).json({
        success: false,
        isValid: false,
        message: 'Invite code has expired'
      });
    }

    // Check if the invite has already been accepted
    if (invite.isInviteAccepted) {
      return res.status(400).json({
        success: false,
        isValid: false,
        message: 'Invite code has already been used'
      });
    }

    // Return validation result
    res.success({
      isValid: true,
      invite: {
        email: invite.email,
        name: invite.name,
        code: invite.inviteCode
      }
    }, 'Invite code verification successful');
  } catch (error) {
    next(error);
  }
};

// Forgot password - send reset token via email
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security, don't reveal if email exists
      return res.success(
        {},
        'If an account with this email exists, a password reset link has been sent.'
      );
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token and expiry (1 hour from now)
    user.resetPasswordToken = tokenHash;
    user.resetPasswordTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Send reset email
    const emailResult = await sendPasswordResetEmail(user.email, resetToken);

    if (!emailResult.success) {
      console.error('Failed to send reset email:', emailResult.error);
      // Still return success to not reveal email existence
    }

    res.success(
      {},
      'If an account with this email exists, a password reset link has been sent.'
    );
  } catch (error) {
    next(error);
  }
};

// Verify reset token
const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Reset token is required'
      });
    }

    // Hash the token to match what's in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token and check expiry
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Invalid or expired password reset link'
      });
    }

    res.success(
      { valid: true, email: user.email },
      'Reset token is valid'
    );
  } catch (error) {
    next(error);
  }
};

// Reset password with token
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, password, and password confirmation are required'
      });
    }

    // Validate password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Hash the token to match database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token and check expiry
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiry = null;
    await user.save();

    res.success(
      { email: user.email },
      'Password reset successfully. Please log in with your new password.'
    );
  } catch (error) {
    next(error);
  }
};

export {
  registerStudio,
  verifyEmail,
  resendVerificationOTP,
  login,
  verifyInviteCode,
  forgotPassword,
  verifyResetToken,
  resetPassword
};
