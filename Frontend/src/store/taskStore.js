import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api/api.js';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,

  // Helper to ensure authorization header is set
  _ensureAuthHeader: async () => {
    if (!API.defaults.headers.common['Authorization']) {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    }
  },

  // Fetch all tasks of the logged-in user
  fetchTasks: async () => {
    set({ loading: true });
    try {
      await get()._ensureAuthHeader();
      const response = await API.get('/tasks');
      
      // Update store tasks
      set({ tasks: response.data, loading: false });
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
      await get()._ensureAuthHeader();
      const response = await API.post('/tasks', taskData);
      const newTask = response.data;

      // Immutable prepend to put newest at the top
      set((state) => ({
        tasks: [newTask, ...state.tasks],
        loading: false,
      }));

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
      await get()._ensureAuthHeader();
      const response = await API.put(`/tasks/${id}`, updatedData);
      const updatedTask = response.data;

      // Immutable map update
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task._id === id ? updatedTask : task
        ),
        loading: false,
      }));

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
      await get()._ensureAuthHeader();
      const response = await API.delete(`/tasks/${id}`);

      // Immutable filter update
      set((state) => ({
        tasks: state.tasks.filter((task) => task._id !== id),
        loading: false,
      }));

      return { success: true, message: response.data.message };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.error || error.message || 'Failed to delete task';
      console.error('Delete task error:', message);
      return { success: false, message };
    }
  },
}));
