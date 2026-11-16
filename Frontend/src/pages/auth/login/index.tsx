// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/common/Loader';
import { ErrorMessage } from '@/components/common/ErrorMessage';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/user/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin/home' : '/user/home', { replace: true });
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    }
  };

  const autofillDemo = async (emailInput: string, pass: string) => {
    setEmail(emailInput);
    setPassword(pass);
    setError(null);
    try {
      const user = await login(emailInput, pass);
      navigate(user.role === 'admin' ? '/admin/home' : '/user/home', { replace: true });
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-slide-up">
      {/* Brand header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-strong mb-4 shadow-glow">
          <svg className="w-8 h-8 text-bright" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white">Welcome back</h1>
        <p className="text-white/60 mt-2 text-sm">Sign in to your ReneStore account</p>
      </div>

      <div className="glass-strong p-8">
        {error && <ErrorMessage message={error} className="mb-6" />}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? <Loader /> : 'Sign In'}
          </Button>
        </form>

        {/* Demo accounts */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs font-medium text-white/50 mb-3 text-center uppercase tracking-wider">Demo Accounts</p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => autofillDemo('admin@renestore.com', 'admin123')}
            >
              Admin
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => autofillDemo('user@renestore.com', 'user123')}
            >
              Customer
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-white/60 mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/auth/signup')}
            className="text-bright font-medium hover:text-white transition-colors"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
