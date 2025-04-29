'use client';
import React, { useEffect, useState } from 'react';
import styles from './review-section.module.css';
import axios from 'axios';
import { useSession } from 'next-auth/react';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Review {
  id: string;
  user?: { name?: string };
  rating: number;
  text?: string;
  createdAt: string;
}

export default function ReviewSection({ id }: { id: string }) {
  const { data: session } = useSession();
  const [guestName, setGuestName] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    axios.get(`/api/reviews/${id}`).then(res => setReviews(res.data));
    axios.get(`/api/reviews/${id}`).then(res => {
      const counts: { [id: string]: number } = {};
      for (const review of res.data) {
        if (review.categories && Array.isArray(review.categories)) {
          for (const cat of review.categories) {
            if (cat.categoryId) {
              counts[cat.categoryId] = (counts[cat.categoryId] || 0) + 1;
            }
          }
        }
      }
      setCategoryCounts(counts);
    });
  }, [id]);

  useEffect(() => {
    axios.get('/api/categories').then(res => setCategories(res.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (rating > 1 && selectedCategories.length === 0) {
      setError('Please select at least one category for this rating.');
      setLoading(false);
      return;
    }
    try {
      await axios.post(`/api/reviews/${id}`, { rating, text, categoryIds: selectedCategories, guestName: session ? undefined : guestName });
      setRating(0);
      setText('');
      setSelectedCategories([]);
      setSuccess('Thank you! Your review has been submitted.');
      axios.get(`/api/reviews/${id}`).then(res => setReviews(res.data));
    } catch (err: unknown) {
      let message = 'Failed to submit review';
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response === 'object' &&
        (err as { response?: { data?: { error?: string } } }).response?.data?.error
      ) {
        message = (err as { response: { data: { error: string } } }).response.data.error;
      }
      if (message === 'You have already reviewed this content.') {
        setError('You have already reviewed this title. You can only submit one review per title.');
      } else {
        setError(message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-8 mt-8 rounded-3xl shadow-xl border border-blue-200 bg-white">
      <h2 className="flex items-center justify-center gap-2 text-3xl font-extrabold mb-5 text-gray-900 tracking-tight text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="#facc15" viewBox="0 0 24 24" width="32" height="32" className="inline-block -mt-1"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
        Submit Your Review
      </h2>
      <div className="w-16 h-1 mx-auto mb-8 rounded-full bg-blue-200"></div>
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-100 border border-green-400 text-green-800 font-semibold text-center">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-400 text-red-800 font-semibold text-center">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="mb-8 space-y-6 bg-white/90 border-2 border-blue-200 shadow-lg rounded-2xl p-8 text-gray-900 relative z-10">
        {!session && (
          <div>
            <label className="block text-base font-bold mb-2 text-gray-900">Your Name <span className='font-normal'>(optional)</span></label>
            <input
              type="text"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Anonymous"
              maxLength={32}
            />
          </div>
        )}

          <div>
            <label className="block text-base font-bold mb-2 text-gray-900">Your Rating</label>
            <div className="flex items-center gap-1">
              {[...Array(10)].map((_, i) => {
                const percent = i / 9;
                const r = Math.round(255 * percent);
                const g = Math.round(180 * (1 - percent));
                const b = 80;
                const color = `rgb(${r},${g},${b})`;
                return (
                  <button
                    type="button"
                    key={i}
                    className={`text-2xl focus:outline-none transition-all duration-200 transform hover:scale-125 focus:scale-125`}
                    style={{ 
                      color: i < rating ? color : '#e5e7eb',
                      textShadow: i < rating ? '0 0 5px rgba(255,255,255,0.5)' : 'none'
                    }}
                    aria-label={`Rate ${i + 1}`}
                    onClick={() => setRating(i + 1)}
                  >
                    ★
                  </button>
                );
              })}
              <span className="ml-2 text-sm text-gray-500">{rating > 0 ? `${rating}/10` : ''}</span>
            </div>
          </div>
          <div>
            <label className="block text-base font-bold mb-2 text-gray-900">Your Review <span className='font-normal'>(optional)</span></label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              className={styles.reviewTextarea}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-base font-bold mb-2 text-gray-900">
              Categories {rating > 1 ? '(required)' : '(optional)'}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {categories.map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  className={`px-3 py-1 rounded-full border text-sm font-semibold shadow-sm transition-all duration-300
                    ${selectedCategories.includes(cat.id) 
                      ? 'bg-blue-600 text-white border-blue-700 transform scale-105 shadow-md' 
                      : 'bg-white text-blue-700 border-blue-400 hover:bg-blue-50 hover:shadow-md hover:scale-105'}
                    ${rating === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (rating === 1) return;
                    setSelectedCategories(selectedCategories.includes(cat.id)
                      ? selectedCategories.filter(id => id !== cat.id)
                      : [...selectedCategories, cat.id]);
                  }}
                  aria-pressed={selectedCategories.includes(cat.id)}
                  disabled={rating === 1}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg font-bold text-lg text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shadow-xl hover:from-blue-500 hover:to-pink-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <span className="animate-pulse">Submitting...</span> : <span>Submit Review</span>}
          </button>
        </form>
      ) : (
        <div className="mb-4 text-gray-600">Sign in to write a review.</div>
      )}
    </div>
  );
}
