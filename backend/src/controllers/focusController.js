import FocusSession from '../models/FocusSession.js';
import FocusStats from '../models/FocusStats.js';
import FocusAchievements from '../models/FocusAchievements.js';
import UserStats from '../models/UserStats.js';
import { recalculateUserStats } from '../services/gamificationEngine.js';

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
    const { ambienceType, duration, musicType } = req.body;
    const userId = req.user.id;

    if (ambienceType) {
      const session = new FocusSession({
        userId,
        user: userId,
        ambienceType,
        musicType: ambienceType,
        startTime: new Date(),
        startedAt: new Date(),
        completed: false,
      });
      await session.save();
      return res.status(201).json(session);
    } else {
      if (!duration || duration <= 0) {
        return res.status(400).json({ error: 'Valid duration in seconds is required' });
      }
      const session = new FocusSession({
        userId,
        user: userId,
        musicType: musicType || 'lofi',
        ambienceType: musicType || 'lofi',
        duration,
        startTime: new Date(),
        startedAt: new Date(),
        completed: false,
      });
      await session.save();
      return res.status(201).json(session);
    }
  } catch (error) {
    console.error('[Focus Controller] Start Focus Error:', error);
    return res.status(500).json({ error: 'Failed to initialize focus session' });
  }
};

// ─── END SESSION ──────────────────────────────────────────────────────────────
export const endFocus = async (req, res) => {
  try {
    const { sessionId, durationMinutes, completed } = req.body;
    const userId = req.user.id;

    const session = await FocusSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.endTime = new Date();
    session.endedAt = new Date();
    session.completed = completed !== undefined ? completed : true;
    
    let dur = durationMinutes;
    if (dur === undefined || dur === null) {
      const diffMs = session.endTime - session.startTime;
      dur = diffMs / (1000 * 60);
    }
    session.durationMinutes = Math.max(0, dur);
    session.duration = Math.round(session.durationMinutes * 60);

    await session.save();

    // Call centralized recalculation to sync everything!
    const offset = parseInt(req.headers['x-timezone-offset'] || '0', 10);
    const { stats: userStats, newlyUnlocked } = await recalculateUserStats(userId, offset);

    // Sync to FocusStats (streaks/hours) - backwards compatibility
    let stats = await FocusStats.findOne({ user: userId });
    if (stats) {
      const sessionMins = Math.round(session.durationMinutes);
      stats.totalFocusHours += session.durationMinutes / 60;
      if (sessionMins > stats.longestSession) {
        stats.longestSession = sessionMins;
      }
      await stats.save();
    }

    return res.status(200).json({
      success: true,
      session,
      userStats,
      newlyUnlocked: newlyUnlocked.map(a => a.id)
    });
  } catch (error) {
    console.error('[Focus Controller] End Focus Error:', error);
    return res.status(500).json({ error: 'Failed to persist focus session' });
  }
};

// ─── COMPLETE SESSION ─────────────────────────────────────────────────────────
export const completeFocus = async (req, res) => {
  try {
    const { sessionId, completed, duration, ambientStats } = req.body;
    const userId = req.user.id;

    const session = await FocusSession.findOne({ _id: sessionId, user: userId });
    if (!session) {
      return res.status(404).json({ error: 'Focus session not found' });
    }

    session.completed = completed || false;
    session.duration = duration || session.duration;
    session.durationMinutes = Math.max(0, (duration || session.duration) / 60);
    session.endedAt = new Date();
    if (ambientStats) {
      session.ambientStats = ambientStats;
    }

    await session.save();

    // Call centralized recalculation to sync everything!
    const offset = parseInt(req.headers['x-timezone-offset'] || '0', 10);
    const { stats: userStats, newlyUnlocked } = await recalculateUserStats(userId, offset);

    // Sync to FocusStats (streaks/hours) - backwards compatibility
    let stats = await FocusStats.findOne({ user: userId });
    if (stats) {
      const sessionMins = Math.round(session.durationMinutes);
      stats.totalFocusHours += session.durationMinutes / 60;
      if (sessionMins > stats.longestSession) {
        stats.longestSession = sessionMins;
      }
      await stats.save();
    }

    return res.status(200).json({
      success: true,
      session,
      newlyUnlocked: newlyUnlocked.map(a => a.id)
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
    
    // Get new UserStats metrics
    let userStats = await UserStats.findOne({ user: userId });
    if (!userStats) {
      userStats = new UserStats({ user: userId });
      await userStats.save();
    }

    // Get legacy FocusStats streaks
    let stats = await FocusStats.findOne({ user: userId });
    if (!stats) {
      stats = new FocusStats({ user: userId });
      await stats.save();
    }

    // Dynamic reset checking for streaks
    const todayStr = getLocalDateString();
    if (stats.lastFocusDate && stats.lastFocusDate !== todayStr && !isYesterday(todayStr, stats.lastFocusDate)) {
      stats.currentStreak = 0;
      await stats.save();
    }

    // Combine both models in the return payload!
    return res.status(200).json({
      // Legacy fields
      user: userId,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      totalFocusHours: stats.totalFocusHours,
      longestSession: stats.longestSession,
      streakHistory: stats.streakHistory,
      lastFocusDate: stats.lastFocusDate,

      // New fields strictly required by UserStats Focus sync
      totalFocusMinutes: userStats.totalFocusMinutes || 0,
      longestFocusSession: userStats.longestFocusSession || 0,
      totalFocusSessions: userStats.totalFocusSessions || 0,
      ambienceBreakdown: Object.fromEntries(userStats.ambienceBreakdown || new Map())
    });
  } catch (error) {
    console.error('[Focus Controller] Get Stats Error:', error);
    return res.status(500).json({ error: 'Failed to fetch focus stats' });
  }
};

// ─── GET HISTORY ──────────────────────────────────────────────────────────────
export const getFocusHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await FocusSession.find({
      $or: [
        { user: userId },
        { userId: userId }
      ]
    })
      .sort({ startTime: -1, startedAt: -1 })
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
