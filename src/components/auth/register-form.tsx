'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    setShowVerificationNotice(false);
    try {
      // Call our registration API
      await axios.post('/api/auth/register', data);
      setShowVerificationNotice(true);
      // Do NOT auto-login until email is verified
      return;
    } catch (err: unknown) {
      let message = 'Registration failed';
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response === 'object' &&
        (err as { response?: { data?: { error?: string } } }).response?.data?.error
      ) {
        message = (err as { response: { data: { error: string } } }).response.data.error;
      }
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mt-8">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {showVerificationNotice && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
            Registration successful! Please check your email and click the verification link to activate your account.
          </div>
        )}
        {!showVerificationNotice && (
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-blue-200">
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                {...register('name')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
              {errors.name && <span className="text-red-400 text-xs">{errors.name.message}</span>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-blue-200">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
              {errors.email && <span className="text-red-400 text-xs">{errors.email.message}</span>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-blue-200">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                onChange={e => {
                  register('password').onChange(e);
                  const val = e.target.value;
                  let score = 0;
                  if (val.length >= 8) score++;
                  if (/[A-Z]/.test(val)) score++;
                  if (/[0-9]/.test(val)) score++;
                  if (/[^A-Za-z0-9]/.test(val)) score++;
                  setPasswordStrength(score);
                }}
              />
              <div className="h-2 mt-1 w-full bg-gray-200 rounded">
                <div style={{ width: `${passwordStrength * 25}%` }} className={`h-2 rounded ${passwordStrength < 2 ? 'bg-red-400' : passwordStrength < 3 ? 'bg-yellow-400' : 'bg-green-500'}`}></div>
              </div>
              <span className="text-xs text-gray-400">Password must be at least 8 characters, contain a number and an uppercase letter.</span>
              {errors.password && <span className="text-red-400 text-xs">{errors.password.message}</span>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-blue-200">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
              {errors.confirmPassword && <span className="text-red-400 text-xs">{errors.confirmPassword.message}</span>}
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 rounded-lg font-bold text-lg text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shadow-xl hover:from-blue-500 hover:to-pink-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="animate-pulse">Registering...</span>
                ) : (
                  <span>Register</span>
                )}
              </button>
            </div>
            <div className="mt-4 text-center text-sm text-gray-600">
              Already have an account? <a href="/login" className="text-red-600 hover:underline">Sign in</a>
            </div>
          </form>
        )}
        {!showVerificationNotice && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,12.151L12.545,12.151c0,1.054,0.855,1.909,1.909,1.909h3.536c-0.607,1.972-2.101,3.467-4.26,3.866 c-3.431,0.635-6.862-1.865-7.19-5.339c-0.34-3.595,2.479-6.62,6.005-6.62c1.002,0,1.946,0.246,2.777,0.679 c0.757,0.395,1.683,0.236,2.286-0.368l0,0c0.954-0.954,0.701-2.563-0.498-3.179c-1.678-0.862-3.631-1.264-5.692-1.038 c-4.583,0.502-8.31,4.226-8.812,8.809C1.873,16.981,6.972,22,13.001,22c6.587,0,11.944-5.358,11.944-11.949 c0-0.562-0.456-1.018-1.018-1.018h-9.474C13.399,9.033,12.545,9.887,12.545,12.151z" />
                </svg>
                Google
              </button>
            </div>
            <div className="mt-3 text-center text-sm text-gray-600">
              Or <a href="/login" className="text-red-600 hover:underline">Sign in with email</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
