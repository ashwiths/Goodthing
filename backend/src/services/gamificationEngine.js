import UserStats from '../models/UserStats.js';
import ProductivityHistory from '../models/ProductivityHistory.js';
import Task from '../models/Task.js';

// Define the core list of achievements & badges
export const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'FIRST_TASK',
    title: 'First Step 🏆',
    sub: 'Complete your first task',
    rarity: 'common',
    xp: 50,
    icon: 'checkmark-circle',
  },
  {
    id: 'STREAK_7',
    title: 'Consistent Fire 🔥',
    sub: 'Maintain a 7-day completion streak',
    rarity: 'rare',
    xp: 150,
    icon: 'flame',
  },
  {
    id: 'STREAK_30',
    title: 'Unstoppable Force ⚡',
    sub: 'Maintain a 30-day completion streak',
    rarity: 'epic',
    xp: 300,
    icon: 'flash',
  },
  {
    id: 'HIGH_PRIORITY_MASTER',
    title: 'Apex Focus 🎯',
    sub: 'Complete 50 high-priority tasks',
    rarity: 'epic',
    xp: 250,
    icon: 'trending-up',
  },
  {
    id: 'TASK_100',
    title: 'Century Master 💯',
    sub: 'Complete 100 tasks overall',
    rarity: 'legendary',
    xp: 500,
    icon: 'ribbon',
  },
  {
    id: 'NIGHT_OWL',
    title: 'Night Owl 🌙',
    sub: 'Complete a task after midnight (12 AM - 4 AM)',
    rarity: 'rare',
    xp: 100,
    icon: 'moon',
  },
  {
    id: 'EARLY_BIRD',
    title: 'Early Bird 🌅',
    sub: 'Complete a task before 7 AM (4 AM - 7 AM)',
    rarity: 'rare',
    xp: 100,
    icon: 'sunny',
  },
  {
    id: 'PRODUCTIVITY_BEAST',
    title: 'Productivity Beast 🦁',
    sub: 'Reach a productivity score of 800+',
    rarity: 'legendary',
    xp: 400,
    icon: 'trophy',
  },
  {
    id: 'FIRST_FOCUS',
    title: 'Deep Dive 🧘‍♂️',
    sub: 'Complete your first deep work focus session',
    rarity: 'common',
    xp: 100,
    icon: 'timer',
  },
  {
    id: 'FOCUS_10',
    title: 'Monk State ⛩️',
    sub: 'Complete 10 deep work focus sessions',
    rarity: 'rare',
    xp: 200,
    icon: 'infinite',
  },
  {
    id: 'FOCUS_100',
    title: 'Master Ascended 🌀',
    sub: 'Complete 100 deep work focus sessions',
    rarity: 'legendary',
    xp: 500,
    icon: 'shield-checkmark',
  },
  {
    id: 'DEEP_WORK_MASTER',
    title: 'Deep Work Sage 🧠',
    sub: 'Complete a continuous 90-minute focus session',
    rarity: 'epic',
    xp: 300,
    icon: 'flash',
  },
  {
    id: 'NIGHT_FOCUS',
    title: 'Midnight Sanctum 🌌',
    sub: 'Complete a focus session after midnight (12 AM - 4 AM)',
    rarity: 'epic',
    xp: 250,
    icon: 'moon',
  },
  {
    id: 'CONSISTENT_MIND',
    title: 'Consistent Mind 🔋',
    sub: 'Maintain a 7-day focus session streak',
    rarity: 'epic',
    xp: 300,
    icon: 'pulse',
  }
];

// Helper to get formatted date string in YYYY-MM-DD
function getTodayDateStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper to get yesterday date string in YYYY-MM-DD
function getYesterdayDateStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Update user streak and productivity score.
 * Triggers when a task is marked completed.
 */
export async function updateStreakAndScore(userId, task) {
  try {
    let stats = await UserStats.findOne({ user: userId });
    if (!stats) {
      stats = await UserStats.create({ user: userId });
    }

    const todayStr = getTodayDateStr();
    const yesterdayStr = getYesterdayDateStr();

    // 1. Calculate Streak
    if (!stats.lastCompletedDate) {
      // First task ever
      stats.currentStreak = 1;
      stats.longestStreak = 1;
      stats.lastCompletedDate = todayStr;
      stats.streakHistory = [todayStr];
    } else if (stats.lastCompletedDate === todayStr) {
      // Already completed a task today. Streak remains, just record date
      if (!stats.streakHistory.includes(todayStr)) {
        stats.streakHistory.push(todayStr);
      }
    } else if (stats.lastCompletedDate === yesterdayStr) {
      // Completed yesterday. Streak increments!
      stats.currentStreak += 1;
      if (stats.currentStreak > stats.longestStreak) {
        stats.longestStreak = stats.currentStreak;
      }
      stats.lastCompletedDate = todayStr;
      if (!stats.streakHistory.includes(todayStr)) {
        stats.streakHistory.push(todayStr);
      }
    } else {
      // Streak broken. Check streak freeze protection
      if (stats.streakFreezeActive) {
        stats.streakFreezeActive = false; // consume freeze shield
        stats.currentStreak = 1; // reset to 1 instead of losing it entirely
        console.log(`[Gamification] Streak freeze shield consumed for user ${userId}`);
      } else {
        stats.currentStreak = 1;
      }
      stats.lastCompletedDate = todayStr;
      if (!stats.streakHistory.includes(todayStr)) {
        stats.streakHistory.push(todayStr);
      }
    }

    // 2. Increment lifetime completions
    stats.totalCompletedTasks += 1;
    if (task && task.priority && task.priority.toLowerCase() === 'high') {
      stats.totalHighPriorityCompleted += 1;
    }

    // 3. Compute Productivity Score Increase
    let scoreGain = 20; // base completion

    if (task && task.priority && task.priority.toLowerCase() === 'high') {
      scoreGain += 10; // high priority bonus
    }

    // Streak Milestones bonuses
    if (stats.currentStreak > 0 && stats.currentStreak % 7 === 0 && stats.lastCompletedDate !== stats.streakHistory[stats.streakHistory.length - 2]) {
      scoreGain += 50; // 7-day streak milestone reward
    }

    stats.productivityScore = Math.min(stats.productivityScore + scoreGain, 1000);

    await stats.save();

    // 4. Record Daily Productivity History log
    await ProductivityHistory.findOneAndUpdate(
      { user: userId, date: todayStr },
      {
        $setOnInsert: { user: userId, date: todayStr },
        $set: { score: stats.productivityScore },
        $inc: { tasksCompletedToday: 1 }
      },
      { upsert: true, new: true }
    );

    return stats;
  } catch (error) {
    console.error('[Gamification] ❌ Failed to update streak and score:', error);
    throw error;
  }
}

/**
 * Check and unlock any eligible achievements for the user.
 * Returns array of newly unlocked achievements.
 */
export async function checkAndUnlockAchievements(userId, task) {
  try {
    const stats = await UserStats.findOne({ user: userId });
    if (!stats) return [];

    const now = new Date();
    const hours = now.getHours();

    const newlyUnlocked = [];

    for (const definition of ACHIEVEMENT_DEFINITIONS) {
      // Skip if already unlocked
      const isAlreadyUnlocked = stats.unlockedAchievements.some(
        (ach) => ach.achievementId === definition.id
      );
      if (isAlreadyUnlocked) continue;

      let isEligible = false;

      switch (definition.id) {
        case 'FIRST_TASK':
          if (stats.totalCompletedTasks >= 1) {
            isEligible = true;
          }
          break;
        case 'STREAK_7':
          if (stats.currentStreak >= 7) {
            isEligible = true;
          }
          break;
        case 'STREAK_30':
          if (stats.currentStreak >= 30) {
            isEligible = true;
          }
          break;
        case 'HIGH_PRIORITY_MASTER':
          if (stats.totalHighPriorityCompleted >= 50) {
            isEligible = true;
          }
          break;
        case 'TASK_100':
          if (stats.totalCompletedTasks >= 100) {
            isEligible = true;
          }
          break;
        case 'PRODUCTIVITY_BEAST':
          if (stats.productivityScore >= 800) {
            isEligible = true;
          }
          break;
        case 'NIGHT_OWL':
          // Completed task between 12 AM (0) and 4 AM (4)
          if (hours >= 0 && hours < 4) {
            isEligible = true;
          }
          break;
        case 'EARLY_BIRD':
          // Completed task between 4 AM (4) and 7 AM (7)
          if (hours >= 4 && hours < 7) {
            isEligible = true;
          }
          break;
      }

      if (isEligible) {
        // Unlock it!
        stats.unlockedAchievements.push({
          achievementId: definition.id,
          unlockedAt: now,
        });

        stats.unlockedBadges.push({
          badgeId: definition.id,
          rarity: definition.rarity,
          unlockedAt: now,
        });

        // Award score bonus
        stats.productivityScore = Math.min(stats.productivityScore + definition.xp, 1000);

        newlyUnlocked.push(definition);
      }
    }

    if (newlyUnlocked.length > 0) {
      await stats.save();

      // Log score update in history
      const todayStr = getTodayDateStr();
      await ProductivityHistory.findOneAndUpdate(
        { user: userId, date: todayStr },
        { score: stats.productivityScore },
        { upsert: true }
      );
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('[Gamification] ❌ Failed to evaluate achievements:', error);
    return [];
  }
}
