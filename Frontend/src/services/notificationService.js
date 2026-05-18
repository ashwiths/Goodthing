import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

// NOTE: setNotificationHandler is registered in app/_layout.tsx

// ─── Permission & channel setup ───────────────────────────────────────────────
export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Notifications] Permission not granted.");
      return null;
    }

    if (Constants.expoConfig?.extra?.eas?.projectId) {
      try {
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig.extra.eas.projectId,
          })
        ).data;
        console.log("[Notifications] Expo Push Token:", token);
      } catch (e) {
        console.warn("[Notifications] Could not fetch push token:", e);
      }
    } else {
      console.log("[Notifications] No EAS projectId — local notifications only.");
    }
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7C4DFF",
    });
  }

  return token;
}

// ─── Exported Request Notification Permission Helper ────────────────────────
export async function requestNotificationPermission() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    console.log("[Notifications] Permission request response:", finalStatus);
    return finalStatus === "granted";
  } catch (error) {
    console.error("[Notifications] ❌ Request permission failed:", error);
    return false;
  }
}

// ─── Priority Intervals Helper ──────────────────────────────────────────────
export function getReminderInterval(priority) {
  const p = String(priority || "low").toLowerCase();
  if (p === "high") return 1800;    // 30 minutes
  if (p === "medium") return 3600;  // 1 hour
  return 7200;                      // 2 hours (default & low)
}

// ─── Smart Priority Task Reminder Scheduling ───────────────────────────────
export async function scheduleTaskReminder(task) {
  if (!task || !task._id) return null;
  try {
    const identifier = `reminder-${task._id}`;
    
    // Always cancel existing reminder to avoid duplicate schedules
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

    // If task is already completed, do not schedule any reminder
    if (task.completed) {
      console.log(`[Notifications] Task "${task.title}" is completed. Skipping reminder schedule.`);
      return null;
    }

    const interval = getReminderInterval(task.priority);
    const dueDateStr = task.dueDate ? ` (Due: ${new Date(task.dueDate).toLocaleDateString()})` : "";
    const priorityStr = (task.priority || "low").toUpperCase();
    const bodyStr = `Complete: ${task.title} [Priority: ${priorityStr}]${dueDateStr}`;

    console.log(`[Notifications] Scheduling repeating reminder for task "${task.title}" (Priority: ${priorityStr}) every ${interval}s`);

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: "🔔 Task Reminder",
        body: bodyStr,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: interval,
        repeats: true,
      },
    });

    console.log(`[Notifications] ✅ Repeating reminder active: "${task.title}" with id: ${identifier}`);
    return identifier;
  } catch (error) {
    console.error(`[Notifications] ❌ scheduleTaskReminder failed for task ${task?._id}:`, error);
    return null;
  }
}

// ─── Cancel a task's repeating reminder ──────────────────────────────────────
export async function cancelTaskReminder(taskId) {
  if (!taskId) return;
  try {
    const identifier = `reminder-${taskId}`;
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
    console.log(`[Notifications] ✅ Cancelled reminder for task: ${identifier}`);
  } catch (error) {
    console.error("[Notifications] ❌ Cancel failed:", error);
  }
}

// ─── Cancel All Task Notifications ───────────────────────────────────────────
export async function cancelAllTaskNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("[Notifications] ✅ Cancelled all scheduled notifications.");
  } catch (error) {
    console.error("[Notifications] ❌ cancelAllTaskNotifications failed:", error);
  }
}

// ─── One-shot local notification ──────────────────────────────────────────────
export async function scheduleTaskReminderOneShot(title, body, seconds = 2) {
  try {
    console.log(`[Notifications] One-shot "${title}" in ${seconds}s`);
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });
    console.log(`[Notifications] ✅ One-shot scheduled: "${title}"`);
  } catch (error) {
    console.error("[Notifications] ❌ One-shot failed:", error);
  }
}

// ─── Instant delete confirmation ──────────────────────────────────────────────
export async function scheduleDeleteNotification() {
  try {
    console.log("[Notifications] Scheduling delete notification...");
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Deleted 🗑️",
        body: "Your task was removed successfully.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
      },
    });
    console.log("[Notifications] ✅ Delete notification scheduled.");
  } catch (error) {
    console.error("[Notifications] ❌ Delete notification failed:", error);
  }
}

// ─── Task completion notification ─────────────────────────────────────────────
export async function scheduleCompletionNotification(taskTitle) {
  try {
    console.log(`[Notifications] Scheduling completion for "${taskTitle}"...`);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Completed ✅",
        body: `Great job! You completed: ${taskTitle}`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
      },
    });
    console.log("[Notifications] ✅ Completion notification scheduled.");
  } catch (error) {
    console.error("[Notifications] ❌ Completion notification failed:", error);
  }
}

// ─── Daily inactivity reminder ────────────────────────────────────────────────
export async function scheduleInactivityReminder() {
  try {
    const identifier = "productivity-inactivity-reminder";
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: "Stay Productive 🚀",
        body: "You still have unfinished goals waiting for you.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 86400,
        repeats: true,
      },
    });
    console.log("[Notifications] ✅ Inactivity reminder scheduled.");
  } catch (error) {
    console.error("[Notifications] ❌ Inactivity reminder failed:", error);
  }
}

// ─── Inactivity alert lifecycle ───────────────────────────────────────────────
export async function checkAndManageInactivityAlerts(tasks) {
  try {
    const incompleteCount = tasks.filter(t => !t.completed).length;
    if (incompleteCount > 0) {
      await scheduleInactivityReminder();
    } else {
      await Notifications.cancelScheduledNotificationAsync("productivity-inactivity-reminder").catch(() => {});
      console.log("[Notifications] ✅ Inactivity reminder cancelled (all done).");
    }
  } catch (error) {
    console.error("[Notifications] ❌ Inactivity lifecycle failed:", error);
  }
}

// ─── Streak warning alerts ──────────────────────────────────────────────
export async function scheduleStreakWarningNotification(currentStreak) {
  if (!currentStreak || currentStreak <= 0) return;
  try {
    const identifier = "streak-warning-reminder";
    
    // Always cancel existing warning first
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

    console.log(`[Notifications] Scheduling streak warning (current streak: ${currentStreak}) in 20 hours (72000s)...`);
    
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: "🔥 Streak in Danger! 🔥",
        body: `Don't lose your ${currentStreak}-day completion streak! Complete a task now to keep the fire burning!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 72000, // 20 hours (gives 4 hours window to complete a task before day boundary resets it)
      },
    });
    console.log("[Notifications] ✅ Streak warning scheduled.");
  } catch (error) {
    console.error("[Notifications] ❌ Streak warning scheduling failed:", error);
  }
}

export async function cancelStreakWarningNotification() {
  try {
    await Notifications.cancelScheduledNotificationAsync("streak-warning-reminder").catch(() => {});
    console.log("[Notifications] ✅ Streak warning cancelled.");
  } catch (error) {
    console.error("[Notifications] ❌ cancelStreakWarningNotification failed:", error);
  }
}