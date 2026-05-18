import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reusable Axios instance
// Using active local IPv4 address so the React Native client (iOS/Android device) can reach it
const API = axios.create({
  baseURL: 'http://192.168.1.10:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to dynamically attach the token
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
