"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import ReviewSection from "./review-section";
import ReviewsTab from "./reviews-tab";

export default function ReviewTabs({ id }: { id: string }) {
  const [tab, setTab] = useState<'submit' | 'reviews'>('submit');
  const { status } = useSession();

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="flex justify-center mb-6">
        <div className="flex bg-[#232946] rounded-xl shadow border border-white/10 px-1 py-1 gap-1 w-full max-w-md">
          <button
            className={`flex-1 px-4 py-2 text-base font-bold rounded-xl transition-all duration-150 focus:outline-none
              ${tab === 'submit'
                ? 'text-blue-300 border-b-4 border-blue-400 bg-[#2a2f5a]'
                : 'text-gray-400 border-b-4 border-transparent hover:bg-white/5'}`}
            onClick={() => setTab('submit')}
          >
            Submit Review
          </button>
          <button
            className={`flex-1 px-4 py-2 text-base font-bold rounded-xl transition-all duration-150 focus:outline-none
              ${tab === 'reviews'
                ? 'text-blue-300 border-b-4 border-blue-400 bg-[#2a2f5a]'
                : 'text-gray-400 border-b-4 border-transparent hover:bg-white/5'}`}
            onClick={() => setTab('reviews')}
          >
            User Reviews
          </button>
        </div>
      </div>
      {status !== 'authenticated' && (
        <div className="text-center text-sm text-blue-300/70 mb-3">
          Sign in to unlock reactions and edit your reviews.{' '}
          <a href="/login" className="text-blue-400 hover:underline font-medium">Sign in</a>
        </div>
      )}
      <div className="rounded-xl shadow bg-[#1a1a2e] border border-white/10 p-0 md:p-2">
        {tab === 'submit' && <ReviewSection id={id} />}
        {tab === 'reviews' && <ReviewsTab id={id} />}
      </div>
    </div>
  );
}
