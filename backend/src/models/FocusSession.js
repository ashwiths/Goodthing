import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  musicType: {
    type: String,
    default: 'lofi',
  },
  duration: {
    type: Number, // duration of the session in seconds
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  xpEarned: {
    type: Number,
    default: 0,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
  }
}, {
  timestamps: true,
});

const FocusSession = mongoose.model('FocusSession', focusSessionSchema);
export default FocusSession;
