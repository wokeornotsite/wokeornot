'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';

export default function ForumThreadForm() {
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/forum', { title, content });
      setTitle('');
      setContent('');
      window.location.reload();
    } catch (err: unknown) {
      let message = 'Failed to create thread';
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response === 'object' &&
        (err as { response?: { data?: { error?: string } } }).response?.data?.error
      ) {
        message = (err as { response: { data: { error: string } } }).response.data.error;
      }
      setError(message);
    }
    setLoading(false);
  };

  if (!session) {
    return <div className="mb-4 text-gray-600">Sign in to start a new thread.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white rounded shadow space-y-2">
      <h2 className="text-lg font-semibold mb-2">Start a New Thread</h2>
      <div>
        <input
          type="text"
          placeholder="Thread Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border p-2 rounded w-full"
          required
        />
      </div>
      <div>
        <textarea
          placeholder="What do you want to discuss?"
          value={content}
          onChange={e => setContent(e.target.value)}
          className="border p-2 rounded w-full"
          rows={3}
          required
        />
      </div>
      <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">
        {loading ? 'Posting...' : 'Post Thread'}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
}
