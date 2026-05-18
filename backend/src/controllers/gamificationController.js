import UserStats from '../models/UserStats.js';
import ProductivityHistory from '../models/ProductivityHistory.js';
import { ACHIEVEMENT_DEFINITIONS } from '../services/gamificationEngine.js';

// Format YYYY-MM-DD helper
function getTodayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayDateStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Helper to determine productivity rank label based on score
function getProductivityRank(score) {
  if (score >= 900) return 'Legendary ⚡';
  if (score >= 700) return 'Productivity Beast 🦁';
  if (score >= 500) return 'Consistent 🎯';
  if (score >= 250) return 'Focused 🧠';
  return 'Beginner 🌱';
}

/**
 * @desc    Get user's current streak statistics
 * @route   GET /api/gamification/streak
 * @access  Private
 */
export const getStreak = async (req, res) => {
  try {
    let stats = await UserStats.findOne({ user: req.user._id });
    if (!stats) {
      stats = await UserStats.create({ user: req.user._id });
    }

    const todayStr = getTodayDateStr();
    const yesterdayStr = getYesterdayDateStr();

    // Stale streak cleanup check: If the last completed date was older than yesterday, reset streak to 0
    if (
      stats.lastCompletedDate &&
      stats.lastCompletedDate !== todayStr &&
      stats.lastCompletedDate !== yesterdayStr
    ) {
      if (stats.streakFreezeActive) {
        // Shield saves the streak from full reset (resets to 1 instead of 0)
        stats.streakFreezeActive = false;
        stats.currentStreak = 1;
        stats.lastCompletedDate = todayStr; // shift forward
        await stats.save();
        console.log(`[Gamification] Streak freeze shield consumed on fetch for user ${req.user._id}`);
      } else {
        stats.currentStreak = 0;
        await stats.save();
      }
    }

    res.status(200).json({
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      lastCompletedDate: stats.lastCompletedDate,
      streakFreezeActive: stats.streakFreezeActive,
      streakHistory: stats.streakHistory,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Manually trigger streak updates / buy freeze shields
 * @route   POST /api/gamification/streak/update
 * @access  Private
 */
export const updateStreak = async (req, res) => {
  try {
    let stats = await UserStats.findOne({ user: req.user._id });
    if (!stats) {
      stats = await UserStats.create({ user: req.user._id });
    }

    const { buyFreeze } = req.body;

    if (buyFreeze) {
      if (stats.streakFreezeActive) {
        return res.status(400).json({ error: 'Streak freeze shield is already active!' });
      }
      if (stats.productivityScore < 150) {
        return res.status(400).json({ error: 'Insufficient score! Requires 150 points to buy a shield.' });
      }
      stats.productivityScore -= 150;
      stats.streakFreezeActive = true;
      await stats.save();
      return res.status(200).json({ message: 'Streak Freeze purchased successfully! ❄️', stats });
    }

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Get all achievements with their unlock statuses mapped for the user
 * @route   GET /api/gamification/achievements
 * @access  Private
 */
export const getAchievements = async (req, res) => {
  try {
    let stats = await UserStats.findOne({ user: req.user._id });
    if (!stats) {
      stats = await UserStats.create({ user: req.user._id });
    }

    // Map global definitions with user's lock/unlock status
    const mappedAchievements = ACHIEVEMENT_DEFINITIONS.map((def) => {
      const unlockInfo = stats.unlockedAchievements.find(
        (ach) => ach.achievementId === def.id
      );
      return {
        ...def,
        unlocked: !!unlockInfo,
        unlockedAt: unlockInfo ? unlockInfo.unlockedAt : null,
      };
    });

    res.status(200).json(mappedAchievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Get user's productivity score details and level progression
 * @route   GET /api/gamification/productivity-score
 * @access  Private
 */
export const getProductivityScore = async (req, res) => {
  try {
    let stats = await UserStats.findOne({ user: req.user._id });
    if (!stats) {
      stats = await UserStats.create({ user: req.user._id });
    }

    // 0-1000 score maps directly to Level 1-10 (e.g. 850 score = level 8 + 50% progress to level 9)
    const score = stats.productivityScore;
    const level = Math.floor(score / 100) + 1;
    const levelProgress = score % 100; // percent progress to next level
    const rankLabel = getProductivityRank(score);

    // Fetch the user's daily productivity logs for analytics chart (last 7 logs)
    const history = await ProductivityHistory.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(7);

    res.status(200).json({
      productivityScore: score,
      level,
      levelProgress,
      rank: rankLabel,
      totalCompletedTasks: stats.totalCompletedTasks,
      totalHighPriorityCompleted: stats.totalHighPriorityCompleted,
      historyLogs: history.reverse(), // chronologically ordered Mon-Sun
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Get user's unlocked badges collection
 * @route   GET /api/gamification/badges
 * @access  Private
 */
export const getBadges = async (req, res) => {
  try {
    let stats = await UserStats.findOne({ user: req.user._id });
    if (!stats) {
      stats = await UserStats.create({ user: req.user._id });
    }

    res.status(200).json(stats.unlockedBadges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
