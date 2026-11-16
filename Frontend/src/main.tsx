// @ts-nocheck
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './components/context/AuthContext';
import { CartProvider } from './components/context/CartContext';
import { ErrorBoundary, Navbar } from './components/common';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ChatWidget } from './components/features/ChatWidget';

import AuthLayout from './pages/auth/layout';
import LoginPage from './pages/auth/login';
import SignupPage from './pages/auth/signup';
import UserHome from './pages/user/home';
import UserProducts from './pages/user/products';
import CartPage from './pages/user/cart';
import CheckoutPage from './pages/user/checkout';
import AdminHome from './pages/admin/home';
import AdminProducts from './pages/admin/products';

import './styles/index.css';

/* ── Ambient background orbs ── */
const AppBackground = () => (
  <div className="glass-orbs" aria-hidden="true">
    {/* Bright — top right */}
    <div className="glass-orb" style={{ width: 520, height: 520, background: 'radial-gradient(circle, rgba(12,150,156,0.55) 0%, transparent 70%)', top: '-5%', right: '5%' }} />
    {/* Sky — bottom left */}
    <div className="glass-orb" style={{ width: 480, height: 480, background: 'radial-gradient(circle, rgba(107,163,190,0.50) 0%, transparent 70%)', bottom: '-5%', left: '5%', animationDelay: '-5s' }} />
    {/* Primary — center */}
    <div className="glass-orb" style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(10,112,117,0.45) 0%, transparent 70%)', top: '30%', left: '30%', animationDelay: '-10s' }} />
    {/* Faint amber — bottom right */}
    <div className="glass-orb" style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(227,160,8,0.25) 0%, transparent 70%)', bottom: '10%', right: '10%', animationDelay: '-15s' }} />
  </div>
);

const AppLayout = () => (
  <div className="min-h-screen flex flex-col bg-transparent isolate">
    <Navbar />
    {/* Top offset so content doesn't hide behind fixed navbar */}
    <main className="flex-grow pt-24">
      <Outlet />
    </main>
    <ChatWidget />
  </div>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <AppBackground />
        <Routes>
          <Route path="/auth" element={<AuthLayout />}>
            <Route index element={<Navigate to="login" replace />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>

          <Route element={<AppLayout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/user/home" element={<UserHome />} />
              <Route path="/user/products" element={<UserProducts />} />
              <Route path="/user/cart" element={<CartPage />} />
              <Route path="/user/checkout" element={<CheckoutPage />} />
            </Route>

            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/admin/home" element={<AdminHome />} />
              <Route path="/admin/products" element={<AdminProducts />} />
            </Route>

            <Route path="/" element={<Navigate to="/user/home" replace />} />
            <Route path="*" element={<Navigate to="/user/home" replace />} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallback={
      <div className="min-h-screen bg-transparent flex items-center justify-center p-8">
        <div className="glass-strong p-8 rounded-2xl text-center max-w-md">
          <p className="text-white text-lg font-semibold mb-2">Something went wrong.</p>
          <p className="text-white/60 text-sm">Please try refreshing the page.</p>
        </div>
      </div>
    }>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
