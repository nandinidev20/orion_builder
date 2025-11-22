import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  experienceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experience',
    required: true
  },
  studioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Studio',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  metrics: {
    totalViews: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    completions: {
      type: Number,
      default: 0
    },
    avgSessionTime: {
      type: String,
      default: '0m 0s'
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },
  trackMetrics: [{
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Track',
      required: true
    },
    plays: {
      type: Number,
      default: 0
    },
    completions: {
      type: Number,
      default: 0
    },
    avgCompletionTime: {
      type: String,
      default: '0m 0s'
    }
  }],
  demographics: {
    locations: [{
      country: String,
      percentage: Number
    }],
    devices: [{
      type: {
        type: String,
        enum: ['mobile', 'desktop', 'tablet']
      },
      percentage: Number
    }],
    ageGroups: [{
      range: String,
      percentage: Number
    }]
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
analyticsSchema.index({ experienceId: 1, date: 1 });
analyticsSchema.index({ studioId: 1, date: 1 });
analyticsSchema.index({ date: 1 });

// Middleware to update the updatedAt field
analyticsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for calculating overall completion rate
analyticsSchema.virtual('calculatedCompletionRate').get(function() {
  if (this.metrics.uniqueVisitors === 0) return 0;
  return Math.round((this.metrics.completions / this.metrics.uniqueVisitors) * 100);
});

export default mongoose.model('Analytics', analyticsSchema);
