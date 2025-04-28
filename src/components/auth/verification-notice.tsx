'use client';

import React, { useState } from 'react';
import axios from 'axios';

export const VerificationNotice = ({ email }: { email: string }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleResendVerification = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      await axios.post('/api/auth/resend-verification', { email });
      setMessage('Verification email resent. Please check your inbox.');
    } catch (err: any) {
      setMessage(
        err?.response?.data?.error || 'Failed to resend verification email. Please try again.'
      );
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 my-4 rounded">
      <p className="font-medium">Your email is not verified.</p>
      <p className="mt-1">Please check your inbox for the verification link or click below to resend.</p>
      {message && <p className="mt-2 text-sm font-medium">{message}</p>}
      <button
        onClick={handleResendVerification}
        disabled={isLoading}
        className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Sending...' : 'Resend Verification Email'}
      </button>
    </div>
  );
};
