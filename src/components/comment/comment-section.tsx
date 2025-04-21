'use client';
import React, { useEffect, useState } from 'react';
// PATCH: Edit a comment
// @ts-expect-error Next.js does not export type for context
export async function PATCH(req: NextRequest, context) {
  try {
    const session = await getServerSession(authOptions as NextAuthOptions);
    if (
      !session ||
      typeof session !== 'object' ||
      !('user' in session) ||
      !session.user ||
      typeof session.user !== 'object' ||
      !('email' in session.user)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { email: string };
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { commentId, text } = await req.json();
    // Find user
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Find comment
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Not authorized to edit this comment' }, { status: 403 });
    }
    // Update comment
    const updated = await prisma.comment.update({ where: { id: commentId }, data: { text } });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    let message = 'Failed to update comment.';
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: string }).message === 'string'
    ) {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Delete a comment
// @ts-expect-error Next.js does not export type for context
export async function DELETE(req: NextRequest, context) {
  try {
    const session = await getServerSession(authOptions as NextAuthOptions);
    if (
      !session ||
      typeof session !== 'object' ||
      !('user' in session) ||
      !session.user ||
      typeof session.user !== 'object' ||
      !('email' in session.user)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { email: string };
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { commentId } = await req.json();
    // Find user
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Find comment
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 });
    }
    // Delete comment
    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    let message = 'Failed to delete comment.';
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: string }).message === 'string'
    ) {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


import axios from 'axios';
import { useSession } from 'next-auth/react';

export default function CommentSection({ id }: { id: string }) {
  const { data: session } = useSession();
  type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user?: {
    name?: string;
    email?: string;
  };
};

const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    axios.get(`/api/comments/${id}`).then(res => setComments(res.data));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`/api/comments/${id}`, { text });
      setText('');
      axios.get(`/api/comments/${id}`).then(res => setComments(res.data));
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

  // Edit handlers
  const handleEdit = (commentId: string, currentText: string) => {
    setEditingId(commentId);
    setEditText(currentText);
  };
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>, commentId: string) => {
    e.preventDefault();
    setEditLoading(true);
    setError('');
    try {
      await axios.patch(`/api/comments/${id}`, { commentId, text: editText });
      setEditingId(null);
      setEditText('');
      axios.get(`/api/comments/${id}`).then(res => setComments(res.data));
    } catch (err: unknown) {
      let message = 'Failed to update comment';
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
    setEditLoading(false);
  };
  // Delete handlers
  const handleDelete = async (commentId: string) => {
    setDeleteLoading(true);
    setError('');
    try {
      await axios.delete(`/api/comments/${id}`, { data: { commentId } });
      setDeleteId(null);
      axios.get(`/api/comments/${id}`).then(res => setComments(res.data));
    } catch (err: unknown) {
      let message = 'Failed to delete comment';
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
    setDeleteLoading(false);
  };

  const userEmail = session?.user?.email;

  return (
    <div className="max-w-2xl mx-auto p-4 bg-background rounded-xl shadow border border-border mt-6">
      <h3 className="text-2xl font-bold mb-6 text-blue-800">Comments</h3>
      {session ? (
        <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-2">
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 focus:border-blue-400 focus:ring focus:ring-blue-100 transition text-gray-800"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            placeholder="Add a comment..."
            disabled={loading}
          />
          {error && <div className="text-red-600 font-medium mb-2 animate-pulse">{error}</div>}
          <button
            type="submit"
            className="self-end bg-gradient-to-r from-blue-600 to-blue-400 text-white px-6 py-2 rounded-full shadow hover:from-blue-700 hover:to-blue-500 focus:outline-none focus:ring focus:ring-blue-200 transition disabled:opacity-60"
            disabled={loading || !text.trim()}
          >
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="mb-8 text-gray-500 italic">Sign in to comment.</div>
      )}
      <div className="space-y-6">
        {comments.map(comment => (
          <div
            key={comment.id}
            className="bg-gray-50 rounded-lg shadow-sm p-4 relative group border border-gray-200 hover:shadow-md transition"
          >
            <div className="flex items-center mb-2">
              <span className="font-semibold text-blue-700 mr-2">{comment.user?.name || 'Anonymous'}</span>
              <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</span>
            </div>
            {editingId === comment.id ? (
              <form onSubmit={e => handleEditSubmit(e, comment.id)} className="flex flex-col gap-2 mt-1">
                <textarea
                  className="w-full border border-blue-300 rounded p-2 focus:border-blue-400 focus:ring focus:ring-blue-100 transition"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  rows={2}
                  disabled={editLoading}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-1 rounded-full hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-200 transition disabled:opacity-60"
                    disabled={editLoading || !editText.trim()}
                  >
                    {editLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="bg-gray-200 text-gray-700 px-4 py-1 rounded-full hover:bg-gray-300 focus:outline-none focus:ring transition"
                    onClick={() => setEditingId(null)}
                    disabled={editLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-gray-700 mb-2 whitespace-pre-line">{comment.text}</div>
            )}
            {session && comment.user?.name === session.user?.name && editingId !== comment.id && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded focus:outline-none focus:ring"
                  onClick={() => handleEdit(comment.id, comment.text)}
                  disabled={editLoading || deleteLoading}
                >
                  Edit
                </button>
                <button
                  className="text-red-600 hover:text-red-800 px-2 py-1 rounded focus:outline-none focus:ring"
                  onClick={() => handleDelete(comment.id)}
                  disabled={editLoading || deleteLoading}
                >
                  Delete
                </button>
              </div>
            )}
            {deleteId === comment.id && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded-lg">
                <div className="bg-white p-4 rounded shadow-lg flex flex-col gap-2 items-center">
                  <div className="text-gray-800">Delete this comment?</div>
                  <div className="flex gap-2">
                    <button
                      className="bg-red-600 text-white px-4 py-1 rounded-full hover:bg-red-700 focus:outline-none focus:ring"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      className="bg-gray-200 text-gray-700 px-4 py-1 rounded-full hover:bg-gray-300 focus:outline-none focus:ring"
                      onClick={() => setDeleteId(null)}
                      disabled={deleteLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
