import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema({
  // Backwards Compatibility Fields
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  musicType: {
    type: String,
    default: 'lofi',
  },
  duration: {
    type: Number,
    min: 0,
  },
  xpEarned: {
    type: Number,
    default: 0,
  },
  ambientStats: {
    type: Map,
    of: Number,
    default: {},
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
  },

  // Real Deep Focus Ambience Tracking Fields
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ambienceType: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  durationMinutes: {
    type: Number,
    default: 0,
    min: 0,
  },
  completed: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true, // Automatically provides createdAt and updatedAt
});

// High-speed compound indexes for query optimization
focusSessionSchema.index({ userId: 1, startTime: -1 });
focusSessionSchema.index({ user: 1, startedAt: -1 });

const FocusSession = mongoose.model('FocusSession', focusSessionSchema);
export default FocusSession;
