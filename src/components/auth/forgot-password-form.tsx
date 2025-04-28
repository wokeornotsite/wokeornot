'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export const ForgotPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post('/api/auth/forgot', data);
      setSuccess('If your email is registered, a password reset link has been sent.');
    } catch (err: any) {
      setError(
        err?.response?.data?.error || 'Failed to send reset email. Please try again.'
      );
    }
    setIsLoading(false);
  };

  return (
    <div className="mt-8">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{success}</div>
      )}
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-blue-200">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="appearance-none block w-full px-4 py-2 rounded-lg bg-white/20 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200 shadow-inner backdrop-blur-sm"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-pink-400">{errors.email.message}</p>
          )}
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 rounded-lg font-bold text-lg text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shadow-xl hover:from-blue-500 hover:to-pink-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="animate-pulse">Sending...</span>
            ) : (
              <span>Send Reset Link</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
