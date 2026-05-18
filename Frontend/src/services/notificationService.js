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
      alert("Permission for notifications not granted!");
      return;
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

// ─── One-shot local notification ──────────────────────────────────────────────
// type: 'timeInterval' is REQUIRED by this version of expo-notifications
export async function scheduleTaskReminder(title, body, seconds = 2) {
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

// ─── Repeating reminder for an incomplete task ────────────────────────────────
// ⚠️  iOS RULE: repeating timeInterval triggers MUST be >= 60 seconds.
// Using 60s for testing (change to 3600 for production)
export async function scheduleRepeatingTaskReminder(taskId, taskTitle, seconds = 60) {
  try {
    const identifier = `reminder-${taskId}`;
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

    console.log(`[Notifications] Repeating "${taskTitle}" every ${seconds}s (${identifier})`);
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: "Pending Task Reminder ⏰",
        body: `You still haven't completed: ${taskTitle}`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,       // ✅ must be >= 60 on iOS for repeating triggers
        repeats: true,
      },
    });
    console.log(`[Notifications] ✅ Repeating reminder active: "${taskTitle}"`);
    return identifier;
  } catch (error) {
    console.error("[Notifications] ❌ Repeating reminder failed:", error);
  }
}

// ─── Cancel a task's repeating reminder ──────────────────────────────────────
export async function cancelTaskReminder(taskId) {
  try {
    const identifier = `reminder-${taskId}`;
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log(`[Notifications] ✅ Cancelled: ${identifier}`);
  } catch (error) {
    console.error("[Notifications] ❌ Cancel failed:", error);
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
      await Notifications.cancelScheduledNotificationAsync("productivity-inactivity-reminder");
      console.log("[Notifications] ✅ Inactivity reminder cancelled (all done).");
    }
  } catch (error) {
    console.error("[Notifications] ❌ Inactivity lifecycle failed:", error);
  }
}