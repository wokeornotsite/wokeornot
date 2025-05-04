'use client';

import { Suspense } from 'react';
import { VerifyContent } from '@/components/auth/verify-content';

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#181824] via-[#232946] to-[#0f0f1a]"><span className="text-white text-lg">Verifying...</span></div>}>
      <VerifyContent />
    </Suspense>
  );
}
