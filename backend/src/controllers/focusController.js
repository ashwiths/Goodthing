import FocusSession from '../models/FocusSession.js';
import FocusStats from '../models/FocusStats.js';
import FocusAchievements from '../models/FocusAchievements.js';
import UserStats from '../models/UserStats.js';

// Helper to get local date string YYYY-MM-DD
function getLocalDateString() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper to check if date2 is exactly the day before date1 (YYYY-MM-DD)
function isYesterday(date1Str, date2Str) {
  if (!date1Str || !date2Str) return false;
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  const diffTime = Math.abs(d1 - d2);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// ─── START SESSION ────────────────────────────────────────────────────────────
export const startFocus = async (req, res) => {
  try {
    const { musicType, duration } = req.body;
    const userId = req.user.id;

    if (!duration || duration <= 0) {
      return res.status(400).json({ error: 'Valid duration in seconds is required' });
    }

    const session = new FocusSession({
      user: userId,
      musicType: musicType || 'lofi',
      duration,
      completed: false,
      startedAt: new Date(),
    });

    await session.save();
    return res.status(201).json(session);
  } catch (error) {
    console.error('[Focus Controller] Start Focus Error:', error);
    return res.status(500).json({ error: 'Failed to initialize focus session' });
  }
};

// ─── COMPLETE SESSION ─────────────────────────────────────────────────────────
export const completeFocus = async (req, res) => {
  try {
    const { sessionId, completed, duration } = req.body;
    const userId = req.user.id;

    const session = await FocusSession.findOne({ _id: sessionId, user: userId });
    if (!session) {
      return res.status(404).json({ error: 'Focus session not found' });
    }

    session.completed = completed || false;
    session.duration = duration || session.duration;
    session.endedAt = new Date();

    let xpEarned = 0;
    const newlyUnlocked = [];

    if (completed) {
      // 1. Award base XP
      xpEarned = 20;

      // 2. Fetch or create Focus Stats
      let stats = await FocusStats.findOne({ user: userId });
      if (!stats) {
        stats = new FocusStats({ user: userId });
      }

      // Update aggregate focus hours
      stats.totalFocusHours += (duration || session.duration) / 3600;

      // Update longest session in minutes
      const sessionMins = Math.round((duration || session.duration) / 60);
      if (sessionMins > stats.longestSession) {
        stats.longestSession = sessionMins;
      }

      // Streak tracking (YYYY-MM-DD string timezone safe)
      const todayStr = getLocalDateString();
      if (stats.lastFocusDate !== todayStr) {
        if (stats.lastFocusDate === null) {
          stats.currentStreak = 1;
        } else if (isYesterday(todayStr, stats.lastFocusDate)) {
          stats.currentStreak += 1;
        } else {
          stats.currentStreak = 1; // reset streak due to inactivity
        }

        if (stats.currentStreak > stats.longestStreak) {
          stats.longestStreak = stats.currentStreak;
        }

        stats.lastFocusDate = todayStr;
        if (!stats.streakHistory.includes(todayStr)) {
          stats.streakHistory.push(todayStr);
        }
      }

      await stats.save();

      // 3. Evaluate and unlock Achievements
      let achievements = await FocusAchievements.findOne({ user: userId });
      if (!achievements) {
        achievements = new FocusAchievements({ user: userId });
      }

      const totalCompletedCount = await FocusSession.countDocuments({ user: userId, completed: true });
      const currentUnlockedList = achievements.unlockedAchievements.map(a => a.achievementId);

      const checkUnlock = async (achievementId) => {
        if (!currentUnlockedList.includes(achievementId)) {
          achievements.unlockedAchievements.push({ achievementId });
          newlyUnlocked.push(achievementId);
          // Award bonus XP for unlocks
          xpEarned += 100;
        }
      };

      // Rules:
      // FIRST_FOCUS
      if (totalCompletedCount + 1 >= 1) {
        await checkUnlock('FIRST_FOCUS');
      }
      // FOCUS_10
      if (totalCompletedCount + 1 >= 10) {
        await checkUnlock('FOCUS_10');
      }
      // FOCUS_100
      if (totalCompletedCount + 1 >= 100) {
        await checkUnlock('FOCUS_100');
      }
      // DEEP_WORK_MASTER (session >= 90 mins i.e. 5400s)
      if (duration >= 5400) {
        await checkUnlock('DEEP_WORK_MASTER');
      }
      // NIGHT_FOCUS (completed between 12 AM and 4 AM local server hours)
      const currentHour = new Date().getHours();
      if (currentHour >= 0 && currentHour < 4) {
        await checkUnlock('NIGHT_FOCUS');
      }
      // CONSISTENT_MIND (consecutive focus days >= 7)
      if (stats.currentStreak >= 7) {
        await checkUnlock('CONSISTENT_MIND');
      }

      await achievements.save();

      // 4. Synchronize earned XP to the main gamification profile UserStats!
      let userStatsProfile = await UserStats.findOne({ user: userId });
      if (!userStatsProfile) {
        userStatsProfile = new UserStats({ user: userId });
      }

      userStatsProfile.productivityScore = Math.min(
        1000,
        userStatsProfile.productivityScore + xpEarned
      );

      // Trigger achievement or badge updates inside main profile if focus achievements unlocked
      for (const badgeId of newlyUnlocked) {
        const hasBadge = userStatsProfile.unlockedAchievements.some(a => a.achievementId === badgeId);
        if (!hasBadge) {
          userStatsProfile.unlockedAchievements.push({ achievementId: badgeId });
        }
      }

      await userStatsProfile.save();
    }

    session.xpEarned = xpEarned;
    await session.save();

    return res.status(200).json({
      success: true,
      session,
      newlyUnlocked
    });
  } catch (error) {
    console.error('[Focus Controller] Complete Focus Error:', error);
    return res.status(500).json({ error: 'Failed to record session completion' });
  }
};

// ─── GET STATS ────────────────────────────────────────────────────────────────
export const getFocusStats = async (req, res) => {
  try {
    const userId = req.user.id;
    let stats = await FocusStats.findOne({ user: userId });
    if (!stats) {
      stats = new FocusStats({ user: userId });
      await stats.save();
    }

    // Dynamic reset checking: if they haven't completed focus yesterday or today, streak drops
    const todayStr = getLocalDateString();
    if (stats.lastFocusDate && stats.lastFocusDate !== todayStr && !isYesterday(todayStr, stats.lastFocusDate)) {
      stats.currentStreak = 0;
      await stats.save();
    }

    return res.status(200).json(stats);
  } catch (error) {
    console.error('[Focus Controller] Get Stats Error:', error);
    return res.status(500).json({ error: 'Failed to fetch focus stats' });
  }
};

// ─── GET HISTORY ──────────────────────────────────────────────────────────────
export const getFocusHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await FocusSession.find({ user: userId })
      .sort({ startedAt: -1 })
      .limit(20);

    return res.status(200).json(history);
  } catch (error) {
    console.error('[Focus Controller] Get History Error:', error);
    return res.status(500).json({ error: 'Failed to fetch focus history' });
  }
};

// ─── GET STREAKS ──────────────────────────────────────────────────────────────
export const getFocusStreaks = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await FocusStats.findOne({ user: userId });
    if (!stats) {
      return res.status(200).json({ currentStreak: 0, longestStreak: 0, streakHistory: [] });
    }
    return res.status(200).json({
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      streakHistory: stats.streakHistory
    });
  } catch (error) {
    console.error('[Focus Controller] Get Streaks Error:', error);
    return res.status(500).json({ error: 'Failed to fetch streaks' });
  }
};

// ─── GET ANALYTICS (7-DAY CHART) ─────────────────────────────────────────────
export const getFocusAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Aggregate sessions for the last 7 days programmatically
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sessions = await FocusSession.find({
      user: userId,
      completed: true,
      startedAt: { $gte: sevenDaysAgo }
    });

    // Populate a 7-day log structure YYYY-MM-DD
    const logs = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dayStr = `${yyyy}-${mm}-${dd}`;

      // Filter sessions matching this day
      const daySessions = sessions.filter(s => {
        const sDate = new Date(s.startedAt);
        const syyyy = sDate.getFullYear();
        const smm = String(sDate.getMonth() + 1).padStart(2, '0');
        const sdd = String(sDate.getDate()).padStart(2, '0');
        return `${syyyy}-${smm}-${sdd}` === dayStr;
      });

      const totalMins = daySessions.reduce((acc, curr) => acc + (curr.duration / 60), 0);
      const count = daySessions.length;

      logs.push({
        date: dayStr,
        focusMinutes: Math.round(totalMins),
        sessionsCount: count
      });
    }

    return res.status(200).json(logs);
  } catch (error) {
    console.error('[Focus Controller] Get Analytics Error:', error);
    return res.status(500).json({ error: 'Failed to compile focus analytics' });
  }
};
