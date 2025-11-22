import User from '../model/User.js';
import Studio from '../model/Studio.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from './emailService.js';

// Function to generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const registerStudio = async (studioData, logoPath) => {
  // --- Pre-flight checks ---
  // (These are good, they prevent work if we know it will fail)
  const { studioName, email, password, brandColor } = studioData;
  const existingStudio = await Studio.findOne({ name: studioName });
  if (existingStudio) {
    throw new Error('Studio name already exists');
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // --- Start transactional-like block ---
  let savedStudio = null;
  let savedUser = null;

  try {
    // 1. Prepare data
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Log OTP for development/testing purposes
    console.log(`Generated OTP for ${email}: ${otp}`);

    // 2. Create and save Studio
    const studio = new Studio({
      studioName: studioName,
      password: password, // Don't hash here - the Studio model will handle it in its pre-save hook
      subdomain: 'admin9',
      brandColor: brandColor || '#4f46e5',
      logo: logoPath,
      ownerEmail: email,
      owner: null, // Will be set next
    });
    savedStudio = await studio.save(); // <-- FIRST POTENTIAL FAILURE POINT

    // 3. Create and save User - password will be hashed by the pre-save hook in the User model
    const user = new User({
      email,
      role: 'studio',
      studio: savedStudio._id, // Reference the new studio
      otp,
      otpExpiry,
      emailVerified: false,
    });
    savedUser = await user.save(); // <-- SECOND POTENTIAL FAILURE POINT

    // 4. Update Studio with User as owner
    savedStudio.owner = savedUser._id;
    await savedStudio.save(); // <-- THIRD POTENTIAL FAILURE POINT

    // 5. Send email (only after all DB ops are successful)
    await sendVerificationEmail(email, otp, studioName);

    return {
      message: 'Studio registered successfully. Please check your email for verification OTP.',
      studioId: savedStudio._id,
      userId: savedUser._id,
    };

  } catch (error) {
    // --- Manual Rollback ---
    // If any step above failed, clean up in reverse order
    
    if (savedUser) {
      // If the user was created, delete it
      await User.findByIdAndDelete(savedUser._id);
    }
    if (savedStudio) {
      // If the studio was created, delete it
      await Studio.findByIdAndDelete(savedStudio._id);
    }

    // After cleanup, re-throw the original error
    throw new Error(`Registration failed and was rolled back: ${error.message}`);
  }
};

const verifyEmail = async (email, otp) => {
  try {
    // Find user by email and OTP
    const user = await User.findOne({ email, otp });
    if (!user) {
      throw new Error('Invalid OTP');
    }

    // Check if OTP has expired
    if (user.otpExpiry < new Date()) {
      throw new Error('OTP has expired');
    }

    // Update user to mark email as verified
    user.emailVerified = true;
    user.otp = undefined; // Clear the OTP
    user.otpExpiry = undefined; // Clear the OTP expiry
    await user.save();

    return { message: 'Email verified successfully' };

  } catch (error) {
    throw error;
 }
};

const resendVerificationOTP = async (email) => {
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    // Generate a new 6-digit OTP
    const newOtp = generateOTP();
    const newOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    // Update user with new OTP
    user.otp = newOtp;
    user.otpExpiry = newOtpExpiry;
    await user.save();

    // Get the associated studio to include in the email
    const studio = await Studio.findById(user.studio);
    if (!studio) {
      throw new Error('Associated studio not found');
    }

    // Send verification email with new OTP
    await sendVerificationEmail(email, newOtp, studio.name);

    return { message: 'Verification OTP resent successfully' };

  } catch (error) {
    throw error;
  }
};

const loginUser = async (email, password) => {
  try {
    // Find user by email, including the password field for comparison
    console.log(email);
    console.log(password);
    const user = await User.findOne({ email }).select('+password').populate('studio');
    if (!user) {
      throw new Error('Invalid email');
    }

    // Check if user account is suspended
    if (user.isActive === false) {
      throw new Error('Your account has been suspended');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new Error('Please verify your email before logging in');
    }

    const studio = await Studio.findById(user.studio).select('+password');
    if (!studio) {
      throw new Error('Associated studio not found');
    }

    // Check if studio is suspended
    if (studio.isSuspended) {
      throw new Error('Your studio account has been suspended');
    }

    console.log(studio);
    console.log(studio?.password);

    // Compare password with hashed password using the studio model's method
    const isPasswordValid = await studio.comparePassword(password);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    return {
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        studioId: user.studio._id,
        studioName: user.studio.name,
        subdomain: studio.subdomain
      }
    };

  } catch (error) {
    console.log(error);
    throw error;
  }
};

// Hash password function
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error('Error hashing password: ' + error.message);
  }
};

export { 
  registerStudio,
  verifyEmail,
  resendVerificationOTP,
  loginUser,
  hashPassword,
  generateOTP,
  generateToken
};
