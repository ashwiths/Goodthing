import UserStats from '../models/UserStats.js';
import ProductivityHistory from '../models/ProductivityHistory.js';
import Task from '../models/Task.js';
import FocusSession from '../models/FocusSession.js';

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

// Helper to convert UTC date to local date string YYYY-MM-DD using timezone offset in minutes
export function getLocalDateStr(date, offsetMinutes) {
  if (!date) return '';
  const localMs = date.getTime() - (offsetMinutes * 60 * 1000);
  const localDate = new Date(localMs);
  const yyyy = localDate.getUTCFullYear();
  const mm = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(localDate.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Recalculate all user statistics timezone-safely from source MongoDB records.
 * Keeps user stats perfectly immune to exploits, deletions, or edits!
 */
export async function recalculateUserStats(userId, offsetMinutes = 0) {
  try {
    // 1. Fetch user stats document or initialize it atomically to prevent E11000 duplicate key race conditions
    const stats = await UserStats.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 2. Fetch all completed tasks
    const completedTasks = await Task.find({ user: userId, completed: true }).sort({ completedAt: 1 });
    const overdueTasksCount = await Task.countDocuments({
      user: userId,
      completed: false,
      dueDate: { $lt: new Date() }
    });

    const totalCompletedTasks = completedTasks.length;
    const totalHighPriorityCompleted = completedTasks.filter(
      (t) => t.priority && t.priority.toLowerCase() === 'high'
    ).length;

    // 3. Fetch all focus sessions (completed/ended)
    const focusSessions = await FocusSession.find({
      $or: [{ userId: userId }, { user: userId }],
      completed: true
    }).sort({ endTime: 1 });

    const totalFocusSessions = focusSessions.length;
    const totalFocusMinutes = focusSessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    const longestFocusSession = focusSessions.reduce((max, curr) => Math.max(max, curr.durationMinutes || 0), 0);

    // Compile ambience breakdown
    const ambienceBreakdown = new Map();
    focusSessions.forEach((session) => {
      const type = session.ambienceType || 'piano';
      const prev = ambienceBreakdown.get(type) || 0;
      ambienceBreakdown.set(type, prev + (session.durationMinutes || 0));
    });

    // 4. Timezone-Safe Streak Tracing
    const localCompletionDates = completedTasks.map((t) =>
      getLocalDateStr(t.completedAt || t.updatedAt || new Date(), offsetMinutes)
    );
    const uniqueDates = [...new Set(localCompletionDates)].sort();

    const todayStr = getLocalDateStr(new Date(), offsetMinutes);
    const yesterdayStr = getLocalDateStr(new Date(Date.now() - 24 * 60 * 60 * 1000), offsetMinutes);

    let currentStreak = 0;
    let checkDate = new Date();
    let checkStr = getLocalDateStr(checkDate, offsetMinutes);

    if (!uniqueDates.includes(checkStr)) {
      // Missed today, let's check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = getLocalDateStr(checkDate, offsetMinutes);

      if (!uniqueDates.includes(checkStr)) {
        // Missed today AND yesterday. Check if streak freeze shield can protect us
        if (stats.streakFreezeActive) {
          stats.streakFreezeActive = false; // consume the shield!
          console.log(`[Gamification] Streak freeze shield consumed on recalculation for user ${userId}`);
          
          // Tracing continues starting from the most recent task completed date
          if (uniqueDates.length > 0) {
            const lastDateParts = uniqueDates[uniqueDates.length - 1].split('-');
            checkDate = new Date(
              parseInt(lastDateParts[0], 10),
              parseInt(lastDateParts[1], 10) - 1,
              parseInt(lastDateParts[2], 10)
            );
            checkStr = uniqueDates[uniqueDates.length - 1];
            currentStreak = 1;
          }
        }
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    if (currentStreak > 0) {
      // Count backwards continuously for consecutive completed days
      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        checkStr = getLocalDateStr(checkDate, offsetMinutes);
        if (uniqueDates.includes(checkStr)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    const longestStreak = Math.max(stats.longestStreak || 0, currentStreak);

    // 5. XP Score Calculation Formula
    // Base Completed: +20 XP
    // High Priority Completed: +15 XP (+35 total)
    // Focus Session completed: +10 XP
    // 7-Day Streak Milestones: +50 XP (for every 7 consecutive days)
    // Overdue penalty: -10 XP
    const baseCompletionXp = totalCompletedTasks * 20;
    const priorityBonusXp = totalHighPriorityCompleted * 15;
    const focusXp = totalFocusSessions * 10;
    const streakMilestoneXp = Math.floor(currentStreak / 7) * 50;
    const overduePenaltyXp = overdueTasksCount * 10;

    const calculatedScore = baseCompletionXp + priorityBonusXp + focusXp + streakMilestoneXp - overduePenaltyXp;
    const productivityScore = Math.max(0, Math.min(1000, calculatedScore));

    // 6. Achievement & Badges Engine
    const newlyUnlocked = [];
    const now = new Date();

    for (const definition of ACHIEVEMENT_DEFINITIONS) {
      const isAlreadyUnlocked = stats.unlockedAchievements.some(
        (ach) => ach.achievementId === definition.id
      );
      if (isAlreadyUnlocked) continue;

      let isEligible = false;

      switch (definition.id) {
        case 'FIRST_TASK':
          if (totalCompletedTasks >= 1) isEligible = true;
          break;
        case 'STREAK_7':
          if (currentStreak >= 7) isEligible = true;
          break;
        case 'STREAK_30':
          if (currentStreak >= 30) isEligible = true;
          break;
        case 'HIGH_PRIORITY_MASTER':
          if (totalHighPriorityCompleted >= 50) isEligible = true;
          break;
        case 'TASK_100':
          if (totalCompletedTasks >= 100) isEligible = true;
          break;
        case 'PRODUCTIVITY_BEAST':
          if (productivityScore >= 800) isEligible = true;
          break;
        case 'NIGHT_OWL':
          // Task completed between 12 AM and 4 AM local time
          isEligible = completedTasks.some((t) => {
            const completedTime = t.completedAt || t.updatedAt || new Date();
            const localTime = new Date(completedTime.getTime() - (offsetMinutes * 60 * 1000));
            const hour = localTime.getUTCHours();
            return hour >= 0 && hour < 4;
          });
          break;
        case 'EARLY_BIRD':
          // Task completed between 4 AM and 7 AM local time
          isEligible = completedTasks.some((t) => {
            const completedTime = t.completedAt || t.updatedAt || new Date();
            const localTime = new Date(completedTime.getTime() - (offsetMinutes * 60 * 1000));
            const hour = localTime.getUTCHours();
            return hour >= 4 && hour < 7;
          });
          break;
        case 'FIRST_FOCUS':
          if (totalFocusSessions >= 1) isEligible = true;
          break;
        case 'FOCUS_10':
          if (totalFocusSessions >= 10) isEligible = true;
          break;
        case 'FOCUS_100':
          if (totalFocusSessions >= 100) isEligible = true;
          break;
        case 'DEEP_WORK_MASTER':
          // Focus session durationMinutes >= 90 mins
          if (longestFocusSession >= 90) isEligible = true;
          break;
        case 'NIGHT_FOCUS':
          // Focus session completed between 12 AM and 4 AM local time
          isEligible = focusSessions.some((s) => {
            const endTime = s.endTime || s.updatedAt || new Date();
            const localTime = new Date(endTime.getTime() - (offsetMinutes * 60 * 1000));
            const hour = localTime.getUTCHours();
            return hour >= 0 && hour < 4;
          });
          break;
        case 'CONSISTENT_MIND':
          // Focus session completed on 7 consecutive days
          if (focusSessions.length >= 7) {
            const localFocusDates = focusSessions.map((s) =>
              getLocalDateStr(s.endTime || s.updatedAt || new Date(), offsetMinutes)
            );
            const uniqueFocusDates = [...new Set(localFocusDates)].sort();
            
            let consecutiveFocusDays = 1;
            let maxConsecutive = 1;
            for (let i = 1; i < uniqueFocusDates.length; i++) {
              const d1 = new Date(uniqueFocusDates[i - 1]);
              const d2 = new Date(uniqueFocusDates[i]);
              const diffTime = Math.abs(d2 - d1);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays === 1) {
                consecutiveFocusDays++;
                maxConsecutive = Math.max(maxConsecutive, consecutiveFocusDays);
              } else if (diffDays > 1) {
                consecutiveFocusDays = 1;
              }
            }
            if (maxConsecutive >= 7) isEligible = true;
          }
          break;
      }

      if (isEligible) {
        stats.unlockedAchievements.push({
          achievementId: definition.id,
          unlockedAt: now,
        });

        stats.unlockedBadges.push({
          badgeId: definition.id,
          rarity: definition.rarity,
          unlockedAt: now,
        });

        newlyUnlocked.push(definition);
      }
    }

    // 7. Save updated statistics to UserStats
    stats.currentStreak = currentStreak;
    stats.longestStreak = longestStreak;
    stats.lastCompletedDate = uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : null;
    stats.streakHistory = uniqueDates;
    stats.totalCompletedTasks = totalCompletedTasks;
    stats.totalHighPriorityCompleted = totalHighPriorityCompleted;
    stats.totalFocusMinutes = totalFocusMinutes;
    stats.longestFocusSession = longestFocusSession;
    stats.totalFocusSessions = totalFocusSessions;
    stats.ambienceBreakdown = ambienceBreakdown;
    stats.productivityScore = productivityScore;

    await stats.save();

    // 8. Log daily productivity curve snapshot in ProductivityHistory
    await ProductivityHistory.findOneAndUpdate(
      { user: userId, date: todayStr },
      {
        $setOnInsert: { user: userId, date: todayStr },
        $set: { score: productivityScore },
        $inc: { tasksCompletedToday: uniqueDates.includes(todayStr) ? 1 : 0 }
      },
      { upsert: true, new: true }
    );

    return { stats, newlyUnlocked };
  } catch (error) {
    console.error('[GamificationEngine] ❌ Centralized recalculation error:', error);
    throw error;
  }
}

/**
 * Backward-Compatible Wrappers for existing route controllers
 */
export async function updateStreakAndScore(userId, task, offsetMinutes = 0) {
  const result = await recalculateUserStats(userId, offsetMinutes);
  return result.stats;
}

export async function checkAndUnlockAchievements(userId, task, offsetMinutes = 0) {
  const result = await recalculateUserStats(userId, offsetMinutes);
  return result.newlyUnlocked;
}
