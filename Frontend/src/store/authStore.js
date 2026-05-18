import { create } from 'zustand';
import { secureStorage } from '../utils/secureStorage.js';
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

      // Map to standardized user object
      const mappedUser = {
        uid: user._id,
        fullName: user.name,
        email: user.email,
        avatar: user.avatar || '',
        provider: 'email',
      };

      // Save token and user to secure keychain
      await secureStorage.setItem('token', token);
      await secureStorage.setItem('user', JSON.stringify(mappedUser));

      set({ token, user: mappedUser, loading: false });
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

      // Map to standardized user object
      const mappedUser = {
        uid: user._id,
        fullName: user.name,
        email: user.email,
        avatar: user.avatar || '',
        provider: 'email',
      };

      // Save token and user to secure keychain
      await secureStorage.setItem('token', token);
      await secureStorage.setItem('user', JSON.stringify(mappedUser));

      set({ token, user: mappedUser, loading: false });
      return { success: true, message };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.error || error.message || 'Login failed';
      return { success: false, message };
    }
  },

  // Load User Session (Auto Login / Hydration)
  loadUser: async () => {
    set({ loading: true });
    try {
      const token = await secureStorage.getItem('token');
      const userJSON = await secureStorage.getItem('user');

      if (token && userJSON) {
        const user = JSON.parse(userJSON);
        
        // Ensure all standardized properties exist
        const mappedUser = {
          uid: user.uid || user._id || '',
          fullName: user.fullName || user.name || 'Productivity Warrior',
          email: user.email || '',
          avatar: user.avatar || user.photoURL || '',
          provider: user.provider || 'email',
        };
        
        set({ token, user: mappedUser, loading: false });
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
      await secureStorage.removeItem('token');
      await secureStorage.removeItem('user');

      set({ token: null, user: null, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.message };
    }
  },
}));
