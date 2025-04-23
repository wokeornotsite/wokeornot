"use client";
import React, { useState } from "react";
import ReviewSection from "./review-section";
import ReviewsTab from "./reviews-tab";

export default function ReviewTabs({ id }: { id: string }) {
  const [tab, setTab] = useState<'submit' | 'reviews'>('submit');

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="flex justify-center mb-6">
        <div className="flex bg-white rounded-xl shadow border border-blue-100 px-1 py-1 gap-1 w-full max-w-md">
          <button
            className={`flex-1 px-4 py-2 text-base font-bold rounded-xl transition-all duration-150 focus:outline-none
              ${tab === 'submit'
                ? 'text-blue-700 border-b-4 border-blue-500 bg-white'
                : 'text-gray-600 border-b-4 border-transparent hover:bg-blue-50'}`}
            onClick={() => setTab('submit')}
          >
            Submit Review
          </button>
          <button
            className={`flex-1 px-4 py-2 text-base font-bold rounded-xl transition-all duration-150 focus:outline-none
              ${tab === 'reviews'
                ? 'text-blue-700 border-b-4 border-blue-500 bg-white'
                : 'text-gray-600 border-b-4 border-transparent hover:bg-blue-50'}`}
            onClick={() => setTab('reviews')}
          >
            User Reviews
          </button>
        </div>
      </div>
      <div className="rounded-xl shadow bg-white border border-blue-100 p-0 md:p-2">
        {tab === 'submit' && <ReviewSection id={id} />}
        {tab === 'reviews' && <ReviewsTab id={id} />}
      </div>
    </div>
  );
}
