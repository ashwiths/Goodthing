import mongoose from 'mongoose';

const userStatsSchema = new mongoose.Schema({
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
  lastCompletedDate: {
    type: String, // YYYY-MM-DD to avoid timezone conversion offsets
    default: null,
  },
  streakFreezeActive: {
    type: Boolean,
    default: false,
  },
  streakHistory: {
    type: [String], // Array of YYYY-MM-DD completion dates
    default: [],
  },
  productivityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1000,
  },
  totalCompletedTasks: {
    type: Number,
    default: 0,
  },
  totalHighPriorityCompleted: {
    type: Number,
    default: 0,
  },
  unlockedAchievements: [
    {
      achievementId: { type: String, required: true },
      unlockedAt: { type: Date, default: Date.now },
    }
  ],
  unlockedBadges: [
    {
      badgeId: { type: String, required: true },
      rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
      unlockedAt: { type: Date, default: Date.now },
    }
  ]
}, {
  timestamps: true,
});

const UserStats = mongoose.model('UserStats', userStatsSchema);
export default UserStats;
