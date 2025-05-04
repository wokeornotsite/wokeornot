'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { useSearchParams } from 'next/navigation';

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    // Check for verification success
    if (searchParams?.get('verified') === 'true') {
      setStatusMessage({ 
        type: 'success', 
        message: 'Your email has been verified! You can now log in.' 
      });
    }
    
    // Check for verification error
    const error = searchParams?.get('error');
    if (error) {
      setStatusMessage({ 
        type: 'error', 
        message: decodeURIComponent(error)
      });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#181824] via-[#232946] to-[#0f0f1a]">
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/10 transition-all duration-300">
        <div className="text-center">
          <h2 className="mt-6 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 drop-shadow-lg">Sign in to your account</h2>
          {/* Display verification status messages */}
          {statusMessage && (
            <div className={`mt-4 py-2 px-4 rounded-md ${statusMessage.type === 'success' ? 'bg-green-600/60 text-green-100' : 'bg-red-600/60 text-red-100'}`}>
              <p className="text-sm">{statusMessage.message}</p>
            </div>
          )}
          <p className="mt-2 text-sm text-gray-300">
            Or{' '}
            <Link href="/register" className="font-semibold text-blue-400 hover:text-pink-400 transition-colors duration-200 underline underline-offset-4">
              create a new account
            </Link>
          </p>
          <p className="mt-1 text-sm text-gray-300">
            <Link href="/forgot" className="font-semibold text-blue-400 hover:text-pink-400 transition-colors duration-200 underline underline-offset-4">
              Forgot your password?
            </Link>
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
