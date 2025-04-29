"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Verifying your email...');

  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  React.useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage('Invalid or missing verification token or email.');
      return;
    }
    axios.post('/api/auth/verify', { token, email })
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified! You may now log in.');
      })
      .catch(err => {
        setStatus('error');
        setMessage(
          err?.response?.data?.error || 'Verification failed. Your token may be invalid or expired.'
        );
      });
  }, [token, email]);

  const handleResend = async () => {
    setResendStatus('loading');
    setResendMessage('');
    try {
      await axios.post('/api/auth/resend-verification', { email });
      setResendStatus('sent');
      setResendMessage('Verification email resent!');
    } catch {
      setResendStatus('error');
      setResendMessage('Failed to resend verification email.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="w-full max-w-md p-8 bg-white/10 rounded-lg shadow-lg backdrop-blur">
        <h1 className="text-2xl font-bold text-center text-blue-200 mb-6">Email Verification</h1>
        <p className="mb-4 text-center text-white/80">{message}</p>
        {status === 'success' ? (
          <button
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold mt-4"
            onClick={() => router.push('/login')}
          >
            Go to Login
          </button>
        ) : status === 'error' ? (
          <>
            <button
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold mt-4"
              onClick={handleResend}
              disabled={resendStatus === 'loading'}
            >
              {resendStatus === 'loading' ? 'Resending...' : 'Resend Verification Email'}
            </button>
            {resendMessage && <p className="mt-2 text-center text-red-400">{resendMessage}</p>}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyPageContent />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
