import Task from '../models/Task.js';
import FocusSession from '../models/FocusSession.js';
import UserStats from '../models/UserStats.js';

export const getProgressAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const offset = parseInt(req.headers['x-timezone-offset'] || '0', 10);

    // 1. Fetch task counts
    const completedTasksCount = await Task.countDocuments({ user: userId, completed: true });
    const totalTasksCount = await Task.countDocuments({ user: userId });

    // 2. Fetch UserStats for current streak
    let userStats = await UserStats.findOne({ user: userId });
    if (!userStats) {
      userStats = new UserStats({ user: userId });
      await userStats.save();
    }

    const currentStreak = userStats.currentStreak || 0;

    // 3. Fetch completed focus sessions count
    const focusSessionsCount = await FocusSession.countDocuments({
      $or: [{ userId: userId }, { user: userId }],
      completed: true
    });

    // 4. Overdue tasks count (uncompleted tasks with dueDate in the past)
    const overdueTasksCount = await Task.countDocuments({
      user: userId,
      completed: false,
      dueDate: { $lt: new Date() }
    });

    // 5. High priority completed tasks count
    const highPriorityCompletedCount = await Task.countDocuments({
      user: userId,
      completed: true,
      priority: 'High'
    });

    // Base Productivity calculation: (completed tasks / total tasks) * 100
    let baseProductivity = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

    // Enhancements:
    // - Streak bonus: +2% per day of current streak (up to +20%)
    const streakBonus = Math.min(20, currentStreak * 2);

    // - Focus sessions: +3% per focus session (up to +30%)
    const focusBonus = Math.min(30, focusSessionsCount * 3);

    // - Overdue penalty: -5% per overdue task
    const overduePenalty = overdueTasksCount * 5;

    // - High priority completion bonus: +5% per completed high priority task (up to +25%)
    const highPriorityBonus = Math.min(25, highPriorityCompletedCount * 5);

    let finalProductivity = baseProductivity + streakBonus + focusBonus + highPriorityBonus - overduePenalty;

    // Clamp between 0 and 100
    finalProductivity = Math.max(0, Math.min(100, finalProductivity));
    const productivityPercentage = Math.round(finalProductivity);

    // Total focus hours (all completed sessions, rounded to 1 decimal place)
    const totalSessions = await FocusSession.find({
      $or: [{ userId: userId }, { user: userId }],
      completed: true
    });
    const totalFocusMinutes = totalSessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    const totalFocusHours = parseFloat((totalFocusMinutes / 60).toFixed(1));

    // Today's focus duration (timezone offset-aware) in minutes
    const localMs = Date.now() - (offset * 60 * 1000);
    const localTodayStart = new Date(localMs);
    localTodayStart.setUTCHours(0, 0, 0, 0);
    const utcTodayStart = new Date(localTodayStart.getTime() + (offset * 60 * 1000));

    const todaySessions = await FocusSession.find({
      $or: [{ userId: userId }, { user: userId }],
      completed: true,
      startedAt: { $gte: utcTodayStart }
    });
    const todayFocusMinutes = Math.round(todaySessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0));

    // Compile 7-day weekly trends (Monday-Sunday or last 7 days ending today)
    const weeklyProductivityTrend = [];
    const weeklyFocusTrend = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      const dLocal = new Date(d.getTime() - (offset * 60 * 1000));
      dLocal.setUTCDate(dLocal.getUTCDate() - i);
      dLocal.setUTCHours(0, 0, 0, 0);
      
      const dayStart = new Date(dLocal.getTime() + (offset * 60 * 1000));
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      // Tasks completed on this specific day
      const dayCompleted = await Task.countDocuments({
        user: userId,
        completed: true,
        completedAt: { $gte: dayStart, $lt: dayEnd }
      });
      
      // Tasks active/total up to this day
      const dayTotal = await Task.countDocuments({
        user: userId,
        createdAt: { $lt: dayEnd }
      });

      let dayBase = dayTotal > 0 ? (dayCompleted / dayTotal) * 100 : 0;
      
      const daySessions = await FocusSession.find({
        $or: [{ userId: userId }, { user: userId }],
        completed: true,
        startedAt: { $gte: dayStart, $lt: dayEnd }
      });
      const dayFocusMins = daySessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

      let dailyProd = dayBase + (daySessions.length * 5);
      dailyProd = Math.max(0, Math.min(100, Math.round(dailyProd)));

      weeklyProductivityTrend.push(dailyProd);
      // For focus trend, we want to scale values so that they fit nicely into the chart (e.g. 0 to 100 ratio)
      // Standard bars are scaled in index.tsx using val / 100. Let's return raw focus minutes or scaled.
      // Let's return focus minutes directly, or scaled focus index.
      // In Frontend index.tsx: Bars data expects numbers (0 to 100), and charts them as height = val / 100.
      // So if focus time on a day is 60 minutes, passing 60 works well.
      weeklyFocusTrend.push(Math.round(dayFocusMins));
    }

    return res.status(200).json({
      productivityPercentage,
      totalFocusHours,
      todayFocusMinutes,
      weeklyProductivityTrend,
      weeklyFocusTrend
    });
  } catch (error) {
    console.error('[Analytics Controller] Get Progress Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve progress analytics' });
  }
};
