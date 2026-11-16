// @ts-nocheck
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const ProtectedRoute = ({ adminOnly = false }: { adminOnly?: boolean }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  if (adminOnly && !isAdmin) return <Navigate to="/user/home" replace />;

  return <Outlet />;
};
