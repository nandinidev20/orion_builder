import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const inviteSchema = new mongoose.Schema({
  email: {
    type: String,    
    required: true,
    unique: true,
    trim: true,
    lowercase: true,    
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  name: {
    type: String,
    required: false,    
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true    
  },
  inviteCodeExpiresAt: {
    type: Date,
    required: true
  },
  isInviteAccepted: {
    type: Boolean,
    required: true,
    default: false
  },
  status : {
    type: String,
    enum: ['pending', 'accepted', 'expired','invited','suspended','resended'],
    default: 'invited'
  },
  generatedInvitelink: {
    type: String,
    default: null
  },
  isSuspended: {
    type: Boolean,
    required: false,
    default: false
  },
  isResended: {
    type: Boolean,
    required: true,
    default: false
  },
  createdAt: {
    type: Date,    
    default: Date.now
  }
});

export default mongoose.model('Invite', inviteSchema);
