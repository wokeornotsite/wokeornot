import React from 'react';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="w-full max-w-md p-8 bg-white/10 rounded-lg shadow-lg backdrop-blur">
        <h1 className="text-2xl font-bold text-center text-blue-200 mb-6">Forgot Password</h1>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
