import mongoose from 'mongoose';

const stageSchema = new mongoose.Schema({
  id: {
    type: String, // Using string ID to match frontend implementation
    required: true
  },
  position: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['audio', 'video', 'text', 'image'],
    required: true,
    default: 'video'
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    maxlength: 1000
  },
  buttonSettings: {
    type: String,
    enum: ['none', 'tap', 'code'],
    default: 'tap'
  },
  buttonName: {
    type: String,
    default: 'Tap to Unlock'
  },
  codeValue: {
    type: String,
    default: null
  },
  uploadedFile: {
    type: String, // URL or path to the original uploaded file
    default: null
  },
  hlsPath: {
    type: String, // Path to HLS manifest file (e.g., /media/hls/{fileId}/index.m3u8)
    default: null
  },
  fileId: {
    type: String, // Unique identifier for the HLS file processing
    default: null
  },
  pastedText: {
    type: String, // Text content if user pasted text
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const experienceSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  subtitle: {
    type: String,
    maxlength: 500,
    default: null
  },
  description: {
    type: String,
    maxlength: 1000
  },
  icon: {
    type: String, // URL to the icon file
    default: null
  },
  iconName: {
    type: String, // Name of the icon file
    default: null
  },

  // Studio relationship
  studioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Studio',
    required: true
  },

  // Session Settings
  startDate: {
    type: Date,
    required: function() {
      // Only required if startTime is provided
      return this.startTime && this.startTime.length > 0;
    }
  },
  startTime: {
    type: String, // Format: "HH:MM" (24-hour format)
    default: null,
    validate: {
      validator: function(v) {
        // If startTime is provided, startDate must also be provided
        if (v && v.length > 0) {
          return this.startDate !== undefined && this.startDate !== null;
        }
        return true;
      },
      message: 'Start date is required when start time is provided'
    }
  },
  endDate: {
    type: Date,
    required: function() {
      // Only required if endTime is provided
      return this.endTime && this.endTime.length > 0;
    }
  },
  endTime: {
    type: String, // Format: "HH:MM" (24-hour format)
    default: null,
    validate: {
      validator: function(v) {
        // If endTime is provided, endDate must also be provided
        if (v && v.length > 0) {
          return this.endDate !== undefined && this.endDate !== null;
        }
        return true;
      },
      message: 'End date is required when end time is provided'
    }
  },
  userTimezone: {
    type: String, // IANA timezone string (e.g., "America/New_York")
    default: 'UTC'
  },
  completionTitle: {
    type: String,
    maxlength: 200,
    default: null
  },
  completionDescription: {
    type: String,
    maxlength: 1000,
    default: null
  },

  // Styling Options
  primaryColor: {
    type: String,
    default: '#3b82f6' // Default blue
  },
  backgroundColor: {
    type: String,
    default: '#ffffff' // Default white
  },
  textColor: {
    type: String,
    default: '#000000' // Default black
  },
  buttonColor: {
    type: String,
    default: '#3b82f6' // Default blue
  },
  buttonTextColor: {
    type: String,
    default: '#ffffff' // Default white
  },
  borderColor: {
    type: String,
    default: '#d1d5db' // Default light gray
  },
  backgroundImage: {
    type: String, // URL to the background image
    default: null
  },
  fontFamily: {
    type: String,
    enum: ['sans-serif', 'serif', 'monospace', 'Arial', 'Helvetica', 'Times New Roman'],
    default: 'sans-serif'
  },
  headingSize: {
    type: String,
    enum: ['small', 'medium', 'large', 'x-large'],
    default: 'medium'
  },
  padding: {
    type: Number,
    min: 0,
    max: 100,
    default: 16
  },
  margin: {
    type: Number,
    min: 0,
    max: 100,
    default: 16
  },
  borderRadius: {
    type: Number,
    min: 0,
    max: 50,
    default: 8
  },
  borderWidth: {
    type: Number,
    min: 0,
    max: 10,
    default: 1
  },

  // Settings Configuration
  allowComments: {
    type: Boolean,
    default: false
  },
  autoPlayMedia: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  pushNotifications: {
    type: Boolean,
    default: false
  },
  passwordProtection: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    default: null
  },
  twoFactorAuth: {
    type: Boolean,
    default: false
  },
  trackInteractions: {
    type: Boolean,
    default: true
  },
  shareAnonymousData: {
    type: Boolean,
    default: false
  },

  // Player Control Settings
  showPlayPauseButton: {
    type: Boolean,
    default: true
  },
  showBackButton: {
    type: Boolean,
    default: true
  },
  showNextButton: {
    type: Boolean,
    default: true
  },
  enableLoopTracks: {
    type: Boolean,
    default: false
  },
  enableShuffleTracks: {
    type: Boolean,
    default: false
  },

  // Stage Configuration Settings
  enableStageNavigation: {
    type: Boolean,
    default: true
  },
  autoAdvanceStage: {
    type: Boolean,
    default: false
  },

  // New Media Player Settings
  playerBackgroundColor: {
    type: String,
    default: '#000000'
  },
  playerBackgroundOpacity: {
    type: Number,
    default: 0.8,
    min: 0,
    max: 1
  },
  playerControllersColor: {
    type: String,
    default: '#ffffff'
  },
  audioPlayerButtonColor: {
    type: String,
    default: '#3b82f6'
  },
  waveColor: {
    type: String,
    default: '#3b82f6'
  },
  secondaryTextColor: {
    type: String,
    default: '#6b7280'
  },

  // New Border Colors
  loadingScreenBorderColor: {
    type: String,
    default: '#d1d5db'
  },
  mediaPlayerBorderColor: {
    type: String,
    default: '#d1d5db'
  },
  mediaPlayerControlsBorderColor: {
    type: String,
    default: '#d1d5db'
  },

  // Stages Array
  stages: [stageSchema],

  // Analytics
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    avgSessionTime: {
      type: String,
      default: '0m 0s'
    }
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
experienceSchema.index({ studioId: 1 });
experienceSchema.index({ title: 1 });
experienceSchema.index({ slug: 1 });
experienceSchema.index({ startDate: 1, endDate: 1 });
experienceSchema.index({ createdAt: -1 });

// Middleware to update the updatedAt field
experienceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for calculating dynamic status based on start/end dates
experienceSchema.virtual('status').get(function() {
  const now = new Date();

  // If no dates are set, consider it scheduled
  if (!this.startDate && !this.endDate) {
    return 'scheduled';
  }

  // Check if experience has started
  if (this.startDate && now < this.startDate) {
    return 'scheduled';
  }

  // Check if experience has ended
  if (this.endDate && now > this.endDate) {
    return 'expired';
  }

  // Experience is within the active window
  return 'active';
});

// Virtual for checking if experience is active
experienceSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Virtual for checking if experience is playable (not expired)
experienceSchema.virtual('isPlayable').get(function() {
  return this.status !== 'expired';
});

// Virtual for checking if experience has started
experienceSchema.virtual('hasStarted').get(function() {
  const now = new Date();
  return !this.startDate || now >= this.startDate;
});

// Virtual for checking if experience has ended
experienceSchema.virtual('hasEnded').get(function() {
  const now = new Date();
  return this.endDate && now > this.endDate;
});

export default mongoose.model('NewExperience', experienceSchema);
