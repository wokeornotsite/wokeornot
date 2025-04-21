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
      await axios.post(`/api/reviews/${id}`, { rating, text, categoryIds: selectedCategories });
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
    <div className="max-w-2xl mx-auto p-4 bg-background rounded-xl shadow border border-border mt-6">

      <h2 className="text-3xl font-extrabold mb-6 text-gray-900 tracking-tight">User Reviews</h2>
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
      {session ? (
        <form onSubmit={handleSubmit} className="mb-8 space-y-5 bg-white border-2 border-blue-300 shadow-xl rounded-2xl p-8 text-gray-900">
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
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl p-6">
        {reviews.length === 0 ? (
          <div className="text-blue-300 italic text-center py-6">No reviews yet. Be the first to share your thoughts!</div>
        ) : (
          <ul className="space-y-4">
            {reviews.map((review: Review) => (
              <li key={review.id} className="p-4 rounded-xl bg-white border border-gray-200 shadow-inner hover:scale-[1.02] hover:bg-gray-50 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: '#232946', fontWeight: 700 }}>{review.user?.name || 'Anonymous'}</span>
                  <span style={{ color: '#232946', fontSize: '0.92em', opacity: 0.8 }}>{new Date(review.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ color: '#e75480', fontWeight: 600 }}>Rating: {review.rating}/10</div>
                {review.text && <div style={{ color: '#232946', marginTop: 8 }}>{review.text}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
