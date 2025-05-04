'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function VerifyTokenPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { token } = params;
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    const verifyEmail = async () => {
      try {
        await axios.post('/api/auth/verify', { token });
        setStatus('success');
        setMessage('Your email has been verified! You may now log in.');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(
          err?.response?.data?.error || 'Verification failed. Your token may be invalid or expired.'
        );
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="w-full max-w-md p-8 bg-white/10 rounded-lg shadow-lg backdrop-blur">
        <h1 className="text-2xl font-bold text-center text-blue-200 mb-6">Email Verification</h1>
        <div className={`mb-4 p-3 rounded text-center ${
          status === 'success' 
            ? 'bg-green-100 border-green-400 text-green-700' 
            : status === 'error' 
              ? 'bg-red-100 border-red-400 text-red-700' 
              : 'bg-yellow-100 border-yellow-400 text-yellow-700'
        }`}>
          {message}
        </div>
        {status === 'success' && (
          <p className="text-center text-blue-200">Redirecting to login page...</p>
        )}
        {status === 'error' && (
          <a href="/login" className="block mt-4 text-center text-blue-500 hover:underline">
            Go to Login
          </a>
        )}
      </div>
    </div>
  );
}
