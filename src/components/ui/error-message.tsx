import React from 'react';

interface ErrorMessageProps {
  message?: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message = 'Something went wrong.', className = '' }) => (
  <div className={`bg-red-900/70 border border-red-500/60 text-red-200 p-4 rounded-xl text-center text-sm font-semibold shadow ${className}`} role="alert">
    {message}
  </div>
);
