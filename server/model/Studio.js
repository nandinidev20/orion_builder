import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'apb.in';

// --- Subdocument: Owner History ---
const ownerHistorySchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  removedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { _id: false });

// --- Main Studio Schema ---
const studioSchema = new mongoose.Schema({
  // Studio identifier
  studioName: {
    type: String,
    trim: true,
    unique: true,
    lowercase: true,
    minlength: 3,
    maxlength: 50,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ // only lowercase letters, numbers, and dashes
  },

  // Optional display name
  name: {
    type: String,
    trim: true
  },

  // Optional password (not required)
  password: {
    type: String,
    minlength: 6,
    select: false
  },

  // Domain info
  subdomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
    validate: {
      validator: (v) => !['www', 'api', 'app'].includes(v),
      message: props => `${props.value} is a reserved subdomain.`
    }
  },

  customDomain: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v) =>
        !v || /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(v),
      message: props => `${props.value} is not a valid domain name.`
    }
  },

  // Ownership info
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  ownerEmail: {
    type: String,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },

  ownerHistory: [ownerHistorySchema],

  // Core state flags
  isOwnerReset: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  softCapacity: {
    type: Number,
    default: 100,
    min: [0, 'Capacity cannot be negative']
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash password before saving if it's modified
studioSchema.pre('save', async function(next) {
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
studioSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false; // Return false if no password is set
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// --- Indexes ---
studioSchema.index({ owner: 1 });
studioSchema.index({ studioName: 1 }, { unique: true });
studioSchema.index({ isActive: 1 });
studioSchema.index({ "ownerHistory.ownerId": 1 });

// --- Virtuals ---
studioSchema.virtual('fullSubdomainUrl').get(function () {
  return this.subdomain ? `https://${this.subdomain}.${BASE_DOMAIN}` : null;
});
/**
 * Create a new studio account (without requiring password).
 */
studioSchema.statics.createStudioAccount = async function ({ studioName, subdomain, ownerEmail }) {
  if (!studioName || !subdomain) {
    throw new Error('studioName and subdomain are required.');
  }

  const existing = await this.findOne({ studioName });
  if (existing) throw new Error('Studio name already exists.');

  const studio = new this({
    studioName,
    subdomain,
    ownerEmail,
    isActive: false
  });

  await studio.save();
  return studio;
};

/**
 * Reset ownership and archive the previous owner.
 */
studioSchema.methods.resetOwnerAccess = async function (newOwnerId, newOwnerEmail) {
  if (!newOwnerId || !newOwnerEmail) {
    throw new Error('New owner ID and email are required to reset ownership.');
  }

  if (this.owner) {
    this.ownerHistory.push({
      ownerId: this.owner,
      email: newOwnerEmail,
      removedAt: new Date()
    });
  }

  this.owner = newOwnerId;
  this.isOwnerReset = true;

  return this.save();
};

export default mongoose.model('Studio', studioSchema);
