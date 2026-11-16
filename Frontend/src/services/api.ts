// @ts-nocheck
import axios from 'axios';
import { tokenStorage } from '@/lib/utils';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 12000,
});

// Request interceptor – attach JWT
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor – handle 401 refresh flow
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = tokenStorage.getRefreshToken();
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refreshToken },
        );
        tokenStorage.setAccessToken(data.accessToken);
        tokenStorage.setRefreshToken(data.refreshToken);
        original.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        tokenStorage.clear();
        window.location.href = '/auth/login';
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
