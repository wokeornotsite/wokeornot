import React from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#181824] via-[#232946] to-[#0f0f1a]">
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/10 transition-all duration-300">
        <div className="text-center">
          <h2 className="mt-6 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 drop-shadow-lg">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-300">
            Or{' '}
            <Link href="/register" className="font-semibold text-blue-400 hover:text-pink-400 transition-colors duration-200 underline underline-offset-4">
              create a new account
            </Link>
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
