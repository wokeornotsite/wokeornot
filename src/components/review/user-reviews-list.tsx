"use client";
import React, { useMemo, useState } from "react";

interface Category {
  id: string;
  name: string;
  category?: {
    name: string;
  };
}

interface Review {
  id: string;
  user?: { name?: string };
  guestName?: string;
  rating: number;
  text?: string;
  createdAt: string;
  categories?: Category[];
  likes?: number;
  dislikes?: number;
  userReaction?: 'like' | 'dislike' | null;
}

export default function UserReviewsList({ reviews: initialReviews, sortBy = 'helpful' }: { reviews: Review[]; sortBy?: 'helpful' | 'newest' }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [actionError, setActionError] = useState<string>("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const sortedReviews = useMemo(() => {
    const arr = [...reviews];
    if (sortBy === 'newest') {
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      arr.sort((a, b) => {
        const aScore = (a.likes || 0) - (a.dislikes || 0);
        const bScore = (b.likes || 0) - (b.dislikes || 0);
        if (bScore !== aScore) return bScore - aScore;
        if ((b.likes || 0) !== (a.likes || 0)) return (b.likes || 0) - (a.likes || 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    return arr;
  }, [reviews, sortBy]);

  // Handle like/dislike button clicks
  const handleReviewReaction = async (reviewId: string, reaction: 'like' | 'dislike') => {
    setActionError("");
    setPendingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction }),
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setActionError('Please sign in to like or dislike reviews.');
          return;
        }
        const data = await res.json().catch(() => ({} as any));
        throw new Error((data as any).error || "Failed to update reaction");
      }
      
      const { likes, dislikes, userReaction } = await res.json();
      
      // Update the review in state
      setReviews((prev) => 
        prev.map((r) => 
          r.id === reviewId 
            ? { ...r, likes, dislikes, userReaction } 
            : r
        )
      );
    } catch (err: any) {
      setActionError(err.message || "Failed to update reaction");
      console.error("Error updating reaction:", err);
    } finally {
      setPendingId(null);
    }
  };

  if (!reviews.length) {
    return (
      <div className="text-blue-300 italic text-center py-6">No reviews yet. Be the first to share your thoughts!</div>
    );
  }
  return (
    <>
      {actionError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {actionError}
        </div>
      )}
      <ul className="space-y-5">
        {sortedReviews.map((review) => (
        <li key={review.id} className="rounded-2xl bg-white border border-gray-100 shadow-md px-5 py-4 flex flex-col">
          <div className="flex items-center gap-3 pb-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-semibold text-base">
              {(review.user?.name || review.guestName)?.[0]?.toUpperCase() || 'A'}
            </span>
            <span className="font-medium text-gray-900 text-base truncate max-w-[120px]">{review.user?.name || review.guestName || 'Anonymous'}</span>
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
          {/* Like/Dislike Buttons */}
          <div className="flex items-center space-x-4 mt-3">
            <button 
              onClick={() => handleReviewReaction(review.id, 'like')}
              disabled={pendingId === review.id}
              className={`flex items-center space-x-1 px-2 py-1 rounded ${review.userReaction === 'like' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors text-sm disabled:opacity-50`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span>{review.likes || 0}</span>
            </button>
            
            <button 
              onClick={() => handleReviewReaction(review.id, 'dislike')}
              disabled={pendingId === review.id}
              className={`flex items-center space-x-1 px-2 py-1 rounded ${review.userReaction === 'dislike' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors text-sm disabled:opacity-50`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
              </svg>
              <span>{review.dislikes || 0}</span>
            </button>
          </div>
        </li>
      ))}
    </ul>
    </>
  );
}
