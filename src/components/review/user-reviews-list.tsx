"use client";
import React from "react";

interface Category {
  id: string;
  name: string;
}

interface Review {
  id: string;
  user?: { name?: string };
  rating: number;
  text?: string;
  createdAt: string;
  categories?: Category[];
}

export default function UserReviewsList({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) {
    return (
      <div className="text-blue-300 italic text-center py-6">No reviews yet. Be the first to share your thoughts!</div>
    );
  }
  return (
    <ul className="space-y-5">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-2xl bg-white border border-gray-100 shadow-md px-5 py-4 flex flex-col">
          <div className="flex items-center gap-3 pb-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-semibold text-base">
              {review.user?.name?.[0]?.toUpperCase() || 'A'}
            </span>
            <span className="font-medium text-gray-900 text-base truncate max-w-[120px]">{review.user?.name || 'Anonymous'}</span>
            <span className="bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full px-2 py-0.5 ml-2">
              {review.rating}/10
            </span>
            <span className="text-xs text-gray-400 font-normal ml-auto">{new Date(review.createdAt).toLocaleDateString()}<span className="mx-1">•</span>{new Date(review.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          {review.categories && review.categories.some(cat =>
            (cat.name && cat.name.trim()) ||
            (cat.category && cat.category.name && cat.category.name.trim())
          ) && (
            <div className="flex flex-wrap gap-2 mb-2 mt-1">
              {review.categories
                .map(cat => cat.name || (cat.category && cat.category.name))
                .filter(name => name && name.trim())
                .map((name, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 text-xs rounded-full px-2 py-0.5 font-medium border border-blue-100">
                    {name}
                  </span>
                ))}
            </div>
          )}
          {review.text && (
            <div className="text-gray-900 text-base md:text-lg leading-relaxed whitespace-pre-line mt-1">
              {review.text}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
