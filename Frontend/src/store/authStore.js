import { create } from 'zustand';
import { router } from 'expo-router';
import { secureStorage } from '../utils/secureStorage.js';
import API from '../api/api.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: false,

  // Signup User
  signup: async (name, email, password) => {
    set({ loading: true });
    let firebaseUser = null;
    try {
      // 1. Create Firebase Auth user first
      console.log(`[Auth Signup] [Step 1/5] Initiating Firebase user creation for: ${email}`);
      firebaseUser = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUid = firebaseUser.user.uid;
      console.log(`[Auth Signup] [Step 1/5] Firebase user created successfully. UID: ${firebaseUid}`);

      // 2. Create profile in backend MongoDB
      console.log('[Auth Signup] [Step 2/5] Sending backend profile registration request...');
      const response = await API.post('/auth/register', {
        name,
        email,
        firebaseUid,
        provider: 'firebase'
      });
      console.log(`[Auth Signup] [Step 2/5] Backend registration response received. Status: ${response.status}`, response.data);
      const { success, token, user, message } = response.data;

      if (!success) {
        throw new Error(message || 'Backend rejected registration');
      }

      // 3. Map to standardized user object
      console.log(`[Auth Signup] [Step 3/5] Parsing JWT and user profile for MongoDB ID: ${user._id}`);
      const mappedUser = {
        uid: user._id,
        fullName: user.name,
        email: user.email,
        avatar: user.avatar || '',
        provider: 'firebase',
      };

      // 4. Save token and user to secure keychain
      console.log('[Auth Signup] [Step 4/5] Storing JWT and user session in secureStorage...');
      await secureStorage.setItem('token', token);
      await secureStorage.setItem('user', JSON.stringify(mappedUser));

      // 5. Complete signup
      console.log('[Auth Signup] [Step 5/5] Signup completed successfully.');
      set({ token, user: mappedUser, loading: false });
      return { success: true, message };
    } catch (error) {
      set({ loading: false });
      console.error('[Auth Signup] Signup flow encountered an error:', error.message);

      // Rollback Firebase user if backend registration fails
      if (firebaseUser && firebaseUser.user) {
        console.warn(`[Auth Signup] Backend registration failed. Initiating rollback for Firebase UID: ${firebaseUser.user.uid}`);
        try {
          await firebaseUser.user.delete();
          console.log('🔄 Rolled back Firebase user successfully after backend signup failure.');
        } catch (rollbackErr) {
          console.error('🔥 Failed to rollback Firebase user:', rollbackErr.message);
        }
      }

      const message = error.response?.data?.error || error.message || 'Signup failed';
      return { success: false, message };
    }
  },

  // Login User
  login: async (email, password) => {
    set({ loading: true });
    console.log(`[Auth Login] [Step 1/3] Initiating Firebase authentication for: ${email}`);
    try {
      // 1. Authenticate with Firebase first
      const firebaseUser = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUid = firebaseUser.user.uid;
      console.log(`[Auth Login] [Step 1/3] Firebase authentication succeeded. UID: ${firebaseUid}`);

      // 2. Sync with MongoDB backend profile
      console.log('[Auth Login] [Step 2/3] Syncing session with MongoDB backend profile...');
      const response = await API.post('/auth/login', {
        email,
        firebaseUid,
        provider: 'firebase'
      });
      console.log(`[Auth Login] [Step 2/3] Sync response received. Status: ${response.status}`, response.data);
      const { success, token, user, message } = response.data;

      if (!success) {
        throw new Error(message || 'Backend rejected login sync');
      }

      // Map to standardized user object
      const mappedUser = {
        uid: user._id,
        fullName: user.name,
        email: user.email,
        avatar: user.avatar || '',
        provider: 'firebase',
      };

      // 3. Save token and user to secure keychain
      console.log('[Auth Login] [Step 3/3] Storing synced session in secureStorage...');
      await secureStorage.setItem('token', token);
      await secureStorage.setItem('user', JSON.stringify(mappedUser));
      console.log('[Auth Login] Login completed successfully.');

      set({ token, user: mappedUser, loading: false });
      return { success: true, message };
    } catch (error) {
      set({ loading: false });
      console.error('[Auth Login] Login flow encountered an error:', error.message);
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
          
          set({ token, user: mappedUser, loading: false });
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

      set({ token: null, user: null, loading: false });
      
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
