'use client';

import React from 'react';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { useSearchParams } from 'next/navigation';

export default function ResetPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="w-full max-w-md p-8 bg-white/10 rounded-lg shadow-lg backdrop-blur">
        <h1 className="text-2xl font-bold text-center text-blue-200 mb-6">Reset Password</h1>
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
