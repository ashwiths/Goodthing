import { create } from 'zustand';
import { router } from 'expo-router';
import { secureStorage } from '../utils/secureStorage.js';
import API from '../api/api.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: false,
  savedPassword: null,

  // Signup User
  signup: async (name, email, password) => {
    set({ loading: true });
    console.log(`[Auth Store] Signup initiated for: ${email}`);
    try {
      const response = await API.post('/auth/register', { name, email, password });
      const { success, token, user, message } = response.data;

      if (!success) {
        throw new Error(message || 'Registration failed');
      }

      // Map to standardized user object
      const mappedUser = {
        uid: user._id,
        fullName: user.name,
        email: user.email,
        avatar: user.avatar || '',
        provider: 'email',
      };

      // Save token and user to secure storage
      await secureStorage.setItem('token', token);
      await secureStorage.setItem('user', JSON.stringify(mappedUser));
      await secureStorage.setItem('savedPassword', password);
      await AsyncStorage.setItem('async_saved_password', password);
      console.log('[Auth Store] Signup successful. Token saved. SavedPassword:', password);

      set({ token, user: mappedUser, savedPassword: password, loading: false });
      return { success: true, message };
    } catch (error) {
      set({ loading: false });
      console.error('[Auth Store] Signup error:', error.message);
      const message = error.response?.data?.error || error.message || 'Signup failed';
      return { success: false, message };
    }
  },

  // Login User
  login: async (email, password) => {
    set({ loading: true });
    console.log(`[Auth Store] Login initiated for: ${email}`);
    try {
      const response = await API.post('/auth/login', { email, password });
      const { success, token, user, message } = response.data;

      if (!success) {
        throw new Error(message || 'Login failed');
      }

      // Map to standardized user object
      const mappedUser = {
        uid: user._id,
        fullName: user.name,
        email: user.email,
        avatar: user.avatar || '',
        provider: 'email',
      };

      // Save token and user to secure storage
      await secureStorage.setItem('token', token);
      await secureStorage.setItem('user', JSON.stringify(mappedUser));
      await secureStorage.setItem('savedPassword', password);
      await AsyncStorage.setItem('async_saved_password', password);
      console.log('[Auth Store] Login successful. Token saved. SavedPassword:', password);

      set({ token, user: mappedUser, savedPassword: password, loading: false });
      return { success: true, message };
    } catch (error) {
      set({ loading: false });
      console.error('[Auth Store] Login error:', error.message);
      const message = error.response?.data?.error || error.message || 'Login failed';
      return { success: false, message };
    }
  },

  // Request password reset verification code
  forgotPassword: async (email) => {
    set({ loading: true });
    console.log(`[Auth Store] Requesting reset verification code for: ${email}`);
    try {
      const response = await API.post('/auth/forgot-password', { email });
      const { success, message } = response.data;

      set({ loading: false });
      return { success, message };
    } catch (error) {
      set({ loading: false });
      console.error('[Auth Store] Forgot password error:', error.message);
      const message = error.response?.data?.error || error.message || 'Failed to send reset code';
      return { success: false, message };
    }
  },

  // Verify code and update password
  resetPassword: async (email, code, password) => {
    set({ loading: true });
    console.log(`[Auth Store] Resetting password for: ${email} with code: ${code}`);
    try {
      const response = await API.post('/auth/reset-password', {
        email,
        token: code, // backend maps 'token' to the verification code
        password
      });
      const { success, message } = response.data;

      set({ loading: false });
      return { success, message };
    } catch (error) {
      set({ loading: false });
      console.error('[Auth Store] Reset password error:', error.message);
      const message = error.response?.data?.error || error.message || 'Failed to reset password';
      return { success: false, message };
    }
  },

  // Load User Session (Auto Login / Hydration)
  loadUser: async () => {
    set({ loading: true });
    try {
      const token = await secureStorage.getItem('token');
      const userJSON = await secureStorage.getItem('user');
      let savedPassword = await secureStorage.getItem('savedPassword');
      if (!savedPassword) {
        savedPassword = await AsyncStorage.getItem('async_saved_password');
      }
      console.log('[Auth Store] loadUser: retrieved savedPassword:', savedPassword);

      const isValidToken = token && token !== 'null' && token !== 'undefined' && token.trim() !== '';
      const isValidUser = userJSON && userJSON !== 'null' && userJSON !== 'undefined' && userJSON.trim() !== '';

      if (isValidToken && isValidUser) {
        try {
          const user = JSON.parse(userJSON);
          
          // Ensure all standardized properties exist
          const mappedUser = {
            uid: user.uid || user._id || '',
            fullName: user.fullName || user.name || 'Productivity Warrior',
            email: user.email || '',
            avatar: user.avatar || user.photoURL || '',
            provider: user.provider || 'email',
          };
          
          set({ token, user: mappedUser, savedPassword, loading: false });
          return { success: true };
        } catch (parseErr) {
          console.warn('[loadUser] Failed to parse cached user payload, clearing session.');
          await get().logout();
          return { success: false };
        }
      } else {
        // If storage is corrupted or has placeholder string tokens, purge them
        if (token || userJSON) {
          await get().logout();
        } else {
          set({ loading: false });
        }
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
      await secureStorage.removeItem('savedPassword');
      await AsyncStorage.removeItem('async_saved_password');

      set({ token: null, user: null, savedPassword: null, loading: false });
      
      // Auto-redirect user back to login screen on profile disconnection
      setTimeout(() => {
        router.replace('/login');
      }, 100);

      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.message };
    }
  },
}));
