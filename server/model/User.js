import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  role: {
    type: String,
    enum: ['admin', 'studio'],
    default: 'studio'
  },
  studio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Studio',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  // Fields for email verification
  emailVerified: {
    type: Boolean,
    default: true
  },
  otp: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  inviteId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  // Password reset fields
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordTokenExpiry: {
    type: Date,
    default: null
  },
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for better query performance
userSchema.index({ role: 1 });
userSchema.index({ studio: 1 });
userSchema.index({ emailVerified: 1 });
userSchema.index({ otp: 1 });

export default mongoose.model('User', userSchema);
