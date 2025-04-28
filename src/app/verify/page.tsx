"use client";
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

export default function VerifyPage() {
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
      setResendMessage('Verification email resent. Please check your inbox.');
    } catch (err: any) {
      setResendStatus('error');
      setResendMessage(
        err?.response?.data?.error || 'Failed to resend verification email. Please try again.'
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="w-full max-w-md p-8 bg-white/10 rounded-lg shadow-lg backdrop-blur">
        <h1 className="text-2xl font-bold text-center text-blue-200 mb-6">Email Verification</h1>
        <div className={`mb-4 p-3 rounded text-center ${status === 'success' ? 'bg-green-100 border-green-400 text-green-700' : status === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-yellow-100 border-yellow-400 text-yellow-700'}`}>{message}</div>
        {status === 'success' && (
          <a href="/login" className="block mt-4 text-center text-blue-500 hover:underline">Go to Login</a>
        )}
        {status === 'error' && email && (
          <div className="flex flex-col items-center mt-4">
            <button
              onClick={handleResend}
              disabled={resendStatus === 'loading'}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendStatus === 'loading' ? 'Resending...' : 'Resend Verification Email'}
            </button>
            {resendMessage && (
              <div className={`mt-2 text-sm ${resendStatus === 'sent' ? 'text-green-700' : 'text-red-700'}`}>{resendMessage}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
