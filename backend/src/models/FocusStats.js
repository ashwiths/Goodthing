import mongoose from 'mongoose';

const focusStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  currentStreak: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
  },
  totalFocusHours: {
    type: Number,
    default: 0, // aggregate focus hours (stored as float)
  },
  longestSession: {
    type: Number,
    default: 0, // longest single session in minutes
  },
  streakHistory: {
    type: [String], // Array of YYYY-MM-DD focus days completed
    default: [],
  },
  lastFocusDate: {
    type: String, // YYYY-MM-DD to avoid timezone conversions
    default: null,
  }
}, {
  timestamps: true,
});

const FocusStats = mongoose.model('FocusStats', focusStatsSchema);
export default FocusStats;
