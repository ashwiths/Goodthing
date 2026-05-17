import axios from 'axios';

// Reusable Axios instance
// Using active local IPv4 address so the React Native client (iOS/Android device) can reach it
const API = axios.create({
  baseURL: 'http://192.168.1.10:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;
