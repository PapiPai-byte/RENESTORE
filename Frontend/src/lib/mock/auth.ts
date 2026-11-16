// @ts-nocheck
export const mockUsers = [
  { id: 1, name: 'Admin User', email: 'admin@renestore.com', role: 'admin' },
  { id: 2, name: 'Regular User', email: 'user@renestore.com', role: 'user' },
];

export const mockTokens = {
  'admin@renestore.com': { accessToken: 'mock-admin-token', refreshToken: 'mock-admin-refresh' },
  'user@renestore.com': { accessToken: 'mock-user-token', refreshToken: 'mock-user-refresh' },
};
