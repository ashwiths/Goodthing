import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isSecureAvailable = Platform.OS !== 'web';

export const secureStorage = {
  setItem: async (key, value) => {
    try {
      if (isSecureAvailable) {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (err) {
      console.warn('[SecureStorage] Write warning, falling back to AsyncStorage:', err);
      try {
        await AsyncStorage.setItem(key, value);
      } catch (innerErr) {
        console.error('[SecureStorage] Critical storage write failure:', innerErr);
      }
    }
  },

  getItem: async (key) => {
    try {
      if (isSecureAvailable) {
        return await SecureStore.getItemAsync(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (err) {
      console.warn('[SecureStorage] Read warning, falling back to AsyncStorage:', err);
      try {
        return await AsyncStorage.getItem(key);
      } catch (innerErr) {
        console.error('[SecureStorage] Critical storage read failure:', innerErr);
        return null;
      }
    }
  },

  removeItem: async (key) => {
    try {
      if (isSecureAvailable) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (err) {
      console.warn('[SecureStorage] Delete warning, falling back to AsyncStorage:', err);
      try {
        await AsyncStorage.removeItem(key);
      } catch (innerErr) {
        console.error('[SecureStorage] Critical storage delete failure:', innerErr);
      }
    }
  }
};
