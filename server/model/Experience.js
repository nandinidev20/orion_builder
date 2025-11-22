import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  studioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Studio',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  timeLimit: {
    type: Number, // In minutes, null for no limit
    default: null
  },
  softCapacity: {
    type: Number,
    default: null
  },
  brandColor: {
    type: String,
    default: '#4f46e5' // Default indigo-600
  },
  logo: {
    type: String, // URL to the logo image
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  trackVisibility: {
    type: String,
    enum: ['show-all', 'show-current-only'],
    default: 'show-all'
  },
  tracks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track'
  }],
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
experienceSchema.index({ status: 1 });
experienceSchema.index({ startDate: 1, endDate: 1 });

// Middleware to update the updatedAt field
experienceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for checking if experience is active
experienceSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now && this.status === 'published';
});

// Virtual for duration calculation
experienceSchema.virtual('duration').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 24)); // Duration in days
});

export default mongoose.model('Experience', experienceSchema);
