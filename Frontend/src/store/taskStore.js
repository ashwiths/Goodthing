import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api/api.js';
import {
  cancelTaskReminder,
  scheduleTaskReminder,
  scheduleDeleteNotification,
  scheduleCompletionNotification,
  checkAndManageInactivityAlerts,
  scheduleStreakWarningNotification
} from '../services/notificationService';
import { useGamificationStore } from './gamificationStore';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,

  // Axios request interceptor dynamically attaches the token inside src/api/api.js

  // Fetch all tasks of the logged-in user
  fetchTasks: async () => {
    set({ loading: true });
    try {
      const response = await API.get('/tasks');
      const fetchedTasks = response.data;

      // Automatically schedule repeating reminders for all incomplete tasks on load
      const tasksWithReminders = await Promise.all(
        fetchedTasks.map(async (task) => {
          if (!task.completed) {
            const notificationId = await scheduleTaskReminder(task);
            return notificationId ? { ...task, notificationId } : task;
          }
          return task;
        })
      );
      
      // Update store tasks
      set({ tasks: tasksWithReminders, loading: false });

      // Manage productivity inactivity reminders based on fetched tasks
      await checkAndManageInactivityAlerts(tasksWithReminders);

      // Synchronize gamification engine statistics on load
      await useGamificationStore.getState().fetchGamificationStats();

      return { success: true };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.error || error.message || 'Failed to fetch tasks';
      console.error('Fetch tasks error:', message);
      return { success: false, message };
    }
  },

  // Create a new task
  createTask: async (taskData) => {
    set({ loading: true });
    try {
      const response = await API.post('/tasks', taskData);
      let newTask = response.data;

      // Automatically schedule a smart repeating reminder for the newly created task
      const notificationId = await scheduleTaskReminder(newTask);
      if (notificationId) {
        newTask = { ...newTask, notificationId };
      }

      // Immutable prepend to put newest at the top
      set((state) => ({
        tasks: [newTask, ...state.tasks],
        loading: false,
      }));

      // Re-evaluate smart productivity inactivity reminders
      await checkAndManageInactivityAlerts(get().tasks);

      // Refresh gamification stats (e.g. for pending counts)
      await useGamificationStore.getState().fetchGamificationStats();

      return { success: true, task: newTask };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.error || error.message || 'Failed to create task';
      console.error('Create task error:', message);
      return { success: false, message };
    }
  },

  // Update an existing task (e.g. toggle completion or edit fields)
  updateTask: async (id, updatedData) => {
    set({ loading: true });
    try {
      const response = await API.put(`/tasks/${id}`, updatedData);
      let updatedTask = response.data;

      // Cancel reminder + show completion notification if task is now done
      if (updatedTask.completed) {
        await cancelTaskReminder(id);
        await scheduleCompletionNotification(updatedTask.title);

        // Check if any achievements were newly unlocked and trigger global modal
        if (updatedTask.newlyUnlocked && updatedTask.newlyUnlocked.length > 0) {
          useGamificationStore.getState().setUnlockedBadgePopup(updatedTask.newlyUnlocked[0]);
        }

        // Refresh stats
        await useGamificationStore.getState().fetchGamificationStats();

        // Dynamically schedule/reschedule streak warning reminder based on updated streak count
        const streakDetails = useGamificationStore.getState().streak;
        if (streakDetails && streakDetails.currentStreak > 0) {
          await scheduleStreakWarningNotification(streakDetails.currentStreak);
        }
      } else {
        // Reschedule reminder to update content, intervals, or dates if changed
        const notificationId = await scheduleTaskReminder(updatedTask);
        if (notificationId) {
          updatedTask = { ...updatedTask, notificationId };
        }
      }

      // Immutable map update
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task._id === id ? updatedTask : task
        ),
        loading: false,
      }));

      // Re-evaluate smart productivity inactivity reminders
      await checkAndManageInactivityAlerts(get().tasks);

      return { success: true, task: updatedTask };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.error || error.message || 'Failed to update task';
      console.error('Update task error:', message);
      return { success: false, message };
    }
  },

  // Delete a task
  deleteTask: async (id) => {
    set({ loading: true });
    try {
      const response = await API.delete(`/tasks/${id}`);

      // Immutable filter update
      set((state) => ({
        tasks: state.tasks.filter((task) => task._id !== id),
        loading: false,
      }));

      // Cancel task reminders and trigger delete notification
      await cancelTaskReminder(id);
      await scheduleDeleteNotification();

      // Re-evaluate smart productivity inactivity reminders
      await checkAndManageInactivityAlerts(get().tasks);

      // Refresh gamification stats to instantly reflect task deletion in the Productivity Hub UI!
      await useGamificationStore.getState().fetchGamificationStats();

      return { success: true, message: response.data.message };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.error || error.message || 'Failed to delete task';
      console.error('Delete task error:', message);
      return { success: false, message };
    }
  },
}));
