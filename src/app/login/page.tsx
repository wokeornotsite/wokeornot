'use client';

import { Suspense } from 'react';
import { LoginContent } from '@/components/auth/login-content';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#181824] via-[#232946] to-[#0f0f1a]"><span className="text-white text-lg">Loading...</span></div>}>
      <LoginContent />
    </Suspense>
  );
}
