import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  experienceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experience',
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  trackType: {
    type: String,
    enum: ['audio', 'video', 'text'],
    required: true,
    default: 'audio'
  },
  audioFile: {
    type: String, // URL to the audio file
    required: function() {
      return this.trackType === 'audio';
    }
  },
  videoFile: {
    type: String, // URL to the video file
    required: function() {
      return this.trackType === 'video';
    },
    default: null
  },
  textContent: {
    type: String, // Text content for text tracks
    required: function() {
      return this.trackType === 'text';
    },
    default: null
  },
  imageFile: {
    type: String, // URL to the image file (optional)
    default: null
  },
  duration: {
    type: String, // Format: "mm:ss"
    required: function() {
      return this.trackType !== 'text'; // Duration not required for text tracks
    }
  },
  progressRule: {
    type: String,
    enum: ['tap', 'code'],
    default: 'tap'
  },
  unlockCode: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        // Required only if progressRule is 'code'
        if (this.progressRule === 'code') {
          return v && v.length > 0;
        }
        return true;
      },
      message: props => `Unlock code is required when progress rule is set to 'code'`
    }
  },
  analytics: {
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
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  keyId: {
    type: String, // Encryption key identifier for this track
    default: null
  },
  hlsPath: {
    type: String, // Path to the HLS playlist file
    default: null
  },
  fileId: {
    type: String, // Unique file identifier (same as _id)
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
trackSchema.index({ experienceId: 1, order: 1 });
trackSchema.index({ title: 1 });

// Middleware to update the updatedAt field
trackSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure unlockCode is required when progressRule is 'code'
trackSchema.pre('validate', function(next) {
  if (this.progressRule === 'code' && !this.unlockCode) {
    next(new Error('Unlock code is required when progress rule is set to \'code\''));
  } else {
    next();
  }
});

export default mongoose.model('Track', trackSchema);
