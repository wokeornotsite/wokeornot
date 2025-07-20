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
      <h2 className="text-2xl font-bold mb-4 text-gray-900 tracking-tight">User Reviews</h2>
      {loading ? (
        <div className="text-blue-400 text-center py-4 animate-pulse">Loading reviews...</div>
      ) : (
        <UserReviewsList reviews={reviews} />
      )}
    </div>
  );
}
