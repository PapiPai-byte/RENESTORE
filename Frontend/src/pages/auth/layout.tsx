// @ts-nocheck
import { Outlet } from 'react-router-dom';
import { Footer } from '@/components/common/Footer';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent isolate">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-slide-up">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
