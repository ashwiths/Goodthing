import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { secureStorage } from '../utils/secureStorage';

// Reusable Axios instance
// Configured to automatically target the serverless Vercel production API
const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to dynamically attach the encrypted token and timezone offset
API.interceptors.request.use(
  async (config) => {
    // Safely fetch token from native hardware keychain/SecureStore
    const token = await secureStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Automatically attach timezone offset to make backend streak dates robust
    config.headers['x-timezone-offset'] = String(new Date().getTimezoneOffset());
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
