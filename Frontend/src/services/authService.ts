// @ts-nocheck
import api from '@/services/api';
import type { User } from '@/types';
import { mockUsers, mockTokens } from '@/lib/mock/auth';

const authService = {
  login: async (email: string, password: string) => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const user = mockUsers.find(u => u.email === email);
      if (!user) throw new Error('Invalid credentials');
      const tokens = mockTokens[email] || mockTokens['admin@renestore.com'];
      return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    }
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  register: async (name: string, email: string, password: string) => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const user = { id: Date.now(), name, email, role: 'user' };
      const tokens = { accessToken: `mock-token-${Date.now()}`, refreshToken: `mock-refresh-${Date.now()}` };
      return { user, ...tokens };
    }
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
  },
  logout: async () => {
    if (import.meta.env.VITE_USE_MOCK !== 'true') {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  me: async () => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;
      const isAdmin = token.includes('admin');
      return mockUsers.find(u => u.role === (isAdmin ? 'admin' : 'user')) || mockUsers[0];
    }
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
};

export default authService;
