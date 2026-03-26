"use client";
import React, { useEffect, useState } from "react";
import UserReviewsList from "./user-reviews-list";

interface Review {
  id: string;
  user?: { name?: string };
  guestName?: string;
  rating: number;
  text?: string;
  createdAt: string;
  categories?: any[];
  likes?: number;
  dislikes?: number;
  userReaction?: 'like' | 'dislike' | null;
}

interface ApiResponse {
  reviews: Review[];
  wokeReasons: any[];
  totalReviews: number;
}

export default function ReviewsTab({ id }: { id: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'helpful' | 'newest'>('helpful');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reviews/${id}`)
      .then((res) => res.json())
      .then((data: ApiResponse) => {
        console.log('Received reviews data:', data);
        if (data.reviews && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        } else {
          console.error('Invalid reviews data format:', data);
          setReviews([]);
        }
      })
      .catch(err => {
        console.error('Error fetching reviews:', err);
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">User Reviews</h2>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="reviews-sort" className="text-blue-300/70">Sort by</label>
          <select
            id="reviews-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'helpful' | 'newest')}
            className="border border-blue-400/30 rounded-lg px-2 py-1 bg-[#181824] text-white hover:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="helpful">Most helpful</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="text-blue-400 text-center py-4 animate-pulse">Loading reviews...</div>
      ) : (
        <UserReviewsList reviews={reviews} sortBy={sortBy} />
      )}
    </div>
  );
}
