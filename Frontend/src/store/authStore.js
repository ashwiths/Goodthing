import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api/api.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: false,

  // Signup User
  signup: async (name, email, password) => {
    set({ loading: true });
    try {
      const response = await API.post('/auth/signup', { name, email, password });
      const { token, user, message } = response.data;

      // Save token and user to AsyncStorage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Attach token to default API headers for subsequent requests
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({ token, user, loading: false });
      return { success: true, message };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.error || error.message || 'Signup failed';
      return { success: false, message };
    }
  },

  // Login User
  login: async (email, password) => {
    set({ loading: true });
    try {
      const response = await API.post('/auth/login', { email, password });
      const { token, user, message } = response.data;

      // Save token and user to AsyncStorage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Attach token to default API headers for subsequent requests
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({ token, user, loading: false });
      return { success: true, message };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.error || error.message || 'Login failed';
      return { success: false, message };
    }
  },

  // Load User Session (Auto Login)
  loadUser: async () => {
    set({ loading: true });
    try {
      const token = await AsyncStorage.getItem('token');
      const userJSON = await AsyncStorage.getItem('user');

      if (token && userJSON) {
        const user = JSON.parse(userJSON);
        
        // Attach token to default API headers
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        set({ token, user, loading: false });
        return { success: true };
      } else {
        set({ loading: false });
        return { success: false };
      }
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.message };
    }
  },

  // Logout User
  logout: async () => {
    set({ loading: true });
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      // Clear default API authorization header
      delete API.defaults.headers.common['Authorization'];

      set({ token: null, user: null, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.message };
    }
  },
}));
