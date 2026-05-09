'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

export function MobileRateButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToReview = () => {
    const el = document.getElementById('review-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToReview}
      aria-label="Rate this title"
      className="md:hidden fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold shadow-2xl shadow-pink-500/30 text-sm active:scale-95 transition-transform"
    >
      <Star className="w-4 h-4 fill-white" />
      Rate This
    </button>
  );
}
