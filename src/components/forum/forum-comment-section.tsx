'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';

export default function ForumCommentSection({ threadId }: { threadId: string }) {
  const { data: session } = useSession();
  type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user?: {
    name?: string;
  };
};

const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`/api/forum/${threadId}/comments`).then(res => setComments(res.data));
  }, [threadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`/api/forum/${threadId}/comments`, { text });
      setText('');
      axios.get(`/api/forum/${threadId}/comments`).then(res => setComments(res.data));
    } catch (err: unknown) {
      let message = 'Failed to submit comment';
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

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4">Discussion</h2>
      {session ? (
        <form onSubmit={handleSubmit} className="mb-6 space-y-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            className="border p-2 rounded w-full"
            rows={2}
            required
          />
          <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </form>
      ) : (
        <div className="mb-4 text-gray-600">Sign in to join the discussion.</div>
      )}
      <ul className="space-y-4">
        {comments.map((comment, i) => (
          <li key={i} className="border p-4 rounded bg-white">
            <div className="font-semibold">{comment.user?.name || 'Anonymous'}</div>
            <div className="mt-1 text-gray-800">{comment.text}</div>
            <div className="text-xs text-gray-400 mt-1">{new Date(comment.createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
