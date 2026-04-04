"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatDisplayDateTime } from '@/lib/date-utils';
import { EmptyState } from '@/components/ui/empty-state';

interface Category {
  id: string;
  name: string;
  category?: {
    name: string;
  };
}

interface Review {
  id: string;
  userId?: string | null;
  user?: { name?: string; avatar?: string; image?: string };
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
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [actionError, setActionError] = useState<string>("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

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

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditText(review.text || '');
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError('');
  };

  const saveEdit = async (reviewId: string) => {
    if (!editRating) { setEditError('Please select a rating.'); return; }
    setEditLoading(true);
    setEditError('');
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: editRating, text: editText }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || 'Failed to update review');
      }
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, rating: editRating, text: editText } : r));
      setEditingId(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update review');
    } finally {
      setEditLoading(false);
    }
  };

  if (!reviews.length) {
    return (
      <EmptyState
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
        title="No reviews yet"
        description="Be the first to rate this title and share your thoughts!"
      />
    );
  }
  return (
    <>
      {actionError && (
        <div className="bg-red-900/40 text-red-300 p-3 rounded-lg mb-4 text-sm">
          {actionError}
        </div>
      )}
      <ul className="space-y-5">
        {sortedReviews.map((review) => (
        <li key={review.id} className="rounded-2xl bg-[#232946] border border-white/10 shadow-md px-5 py-4 flex flex-col">
          <div className="flex items-center gap-3 pb-2">
            {(review.user?.avatar || review.user?.image) ? (
              <Image
                src={review.user.avatar || review.user.image!}
                alt={review.user?.name || 'User'}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                unoptimized
              />
            ) : (
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-900/50 text-blue-300 font-semibold text-base shrink-0">
                {(review.user?.name || review.guestName)?.[0]?.toUpperCase() || 'A'}
              </span>
            )}
            {review.userId ? (
              <Link
                href={`/users/${review.userId}`}
                className="font-medium text-white text-base truncate max-w-[120px] hover:text-purple-300 transition-colors"
              >
                {review.user?.name || 'Anonymous'}
              </Link>
            ) : (
              <span className="font-medium text-white text-base truncate max-w-[120px]">{review.guestName || 'Anonymous'}</span>
            )}
            <span className="bg-yellow-900/40 text-yellow-300 text-xs font-semibold rounded-full px-2 py-0.5 ml-2">
              {review.rating}/10
            </span>
            <span className="text-xs text-gray-400 font-normal ml-auto">{formatDisplayDateTime(review.createdAt)}</span>
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
                  <span key={idx} className="bg-blue-900/40 text-blue-300 text-xs rounded-full px-2 py-0.5 font-medium border border-blue-800/50">
                    {name}
                  </span>
                ))}
            </div>
          )}
          {review.text && (
            <div className="text-gray-100 text-base md:text-lg leading-relaxed whitespace-pre-line mt-1">
              {review.text}
            </div>
          )}
          {/* Like/Dislike Buttons + Edit */}
          <div className="flex items-center space-x-4 mt-3">
            <button
              onClick={() => handleReviewReaction(review.id, 'like')}
              disabled={pendingId === review.id}
              className={`flex items-center space-x-1 px-2 py-1 rounded ${review.userReaction === 'like' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'} transition-colors text-sm disabled:opacity-50`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span>{review.likes || 0}</span>
            </button>

            <button
              onClick={() => handleReviewReaction(review.id, 'dislike')}
              disabled={pendingId === review.id}
              className={`flex items-center space-x-1 px-2 py-1 rounded ${review.userReaction === 'dislike' ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'} transition-colors text-sm disabled:opacity-50`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
              </svg>
              <span>{review.dislikes || 0}</span>
            </button>

            {currentUserId && review.userId === currentUserId && editingId !== review.id && (
              <button
                onClick={() => startEdit(review)}
                className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-xs text-blue-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
            )}
          </div>

          {/* Inline Edit Form */}
          {editingId === review.id && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-blue-300 font-semibold">New rating:</span>
                <div className="flex gap-0.5">
                  {[...Array(10)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditRating(i + 1)}
                      className="text-lg leading-none transition-transform hover:scale-110"
                      style={{ color: i < editRating ? '#facc15' : '#4b5563' }}
                      aria-label={`Rate ${i + 1}`}
                    >★</button>
                  ))}
                </div>
                <span className="text-xs text-blue-300">{editRating > 0 ? `${editRating}/10` : ''}</span>
              </div>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={3}
                placeholder="Update your review text (optional)"
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#181824] border border-blue-400/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
              {editError && <p className="text-red-400 text-xs mt-1">{editError}</p>}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => saveEdit(review.id)}
                  disabled={editLoading}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
    </>
  );
}
