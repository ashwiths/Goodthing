import mongoose from 'mongoose';

const focusAchievementsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  unlockedAchievements: [
    {
      achievementId: {
        type: String,
        required: true,
        enum: ['FIRST_FOCUS', 'FOCUS_10', 'FOCUS_100', 'DEEP_WORK_MASTER', 'NIGHT_FOCUS', 'CONSISTENT_MIND']
      },
      unlockedAt: {
        type: Date,
        default: Date.now,
      }
    }
  ]
}, {
  timestamps: true,
});

const FocusAchievements = mongoose.model('FocusAchievements', focusAchievementsSchema);
export default FocusAchievements;
