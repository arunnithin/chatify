import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

// Global state object
const globalState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

const listeners = new Set();

function setGlobalState(updates) {
  Object.assign(globalState, updates);
  listeners.forEach(fn => fn({ ...globalState }));
}

export default function useAuthStore() {
  const [state, setState] = useState({ ...globalState });

  useEffect(() => {
    listeners.add(setState);
    return () => listeners.delete(setState);
  }, []);

  const register = async (name, email, password) => {
    setGlobalState({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data));
      setGlobalState({ user: data, token: data.token, isLoading: false });
      return true;
    } catch (err) {
      setGlobalState({
        error: err.response?.data?.message || 'Registration failed',
        isLoading: false,
      });
      return false;
    }
  };

  const login = async (email, password) => {
    setGlobalState({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data));
      setGlobalState({ user: data, token: data.token, isLoading: false });
      return true;
    } catch (err) {
      setGlobalState({
        error: err.response?.data?.message || 'Login failed',
        isLoading: false,
      });
      return false;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setGlobalState({ user: null, token: null });
  };

  const loadUserFromStorage = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        setGlobalState({ token, user: JSON.parse(userStr) });
      }
    } catch (e) {
      console.log('Storage error:', e);
    }
  };

  return { ...state, register, login, logout, loadUserFromStorage };
}