"use client";
import React, { useEffect, useState } from "react";
import UserReviewsList from "./user-reviews-list";

interface Review {
  id: string;
  user?: { name?: string };
  rating: number;
  text?: string;
  createdAt: string;
}

export default function ReviewsTab({ id }: { id: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reviews/${id}`)
      .then((res) => res.json())
      .then((data) => setReviews(data))
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
