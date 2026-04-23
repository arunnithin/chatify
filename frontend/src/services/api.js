import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your machine's local IP, not localhost (emulators can't reach localhost)
const BASE_URL = 'http://10.197.204.26:5001/api'; // replace with your actual LAN IP

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;