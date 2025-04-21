"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface EditDeleteReviewProps {
  id: string;
  initialRating: number;
  initialText?: string;
  onDeleted: () => void;
  onUpdated: (rating: number, text: string) => void;
}

export default function EditDeleteReview({ id, initialRating, initialText = "", onDeleted, onUpdated }: EditDeleteReviewProps) {
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(initialRating);
  const [text, setText] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this rating?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete review");
      onDeleted();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete review");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text }),
      });
      if (!res.ok) throw new Error("Failed to update review");
      onUpdated(rating, text);
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2">
      {editing ? (
        <form onSubmit={handleEdit} className="flex flex-col gap-2">
          <label className="text-sm text-blue-200">
            Rating:
            <input
              type="number"
              min={1}
              max={10}
              value={rating}
              onChange={e => setRating(Number(e.target.value))}
              className="ml-2 w-16 rounded px-2 py-1 border border-blue-300 bg-white/10 text-white"
              required
            />
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            className="rounded px-2 py-1 border border-blue-300 bg-white/10 text-white min-h-[60px]"
            placeholder="Add a comment (optional)"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1 rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold" disabled={loading}>Save</button>
            <button type="button" className="px-3 py-1 rounded bg-gray-400 text-white font-bold" onClick={() => setEditing(false)} disabled={loading}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded bg-gradient-to-r from-pink-400 to-blue-400 text-white font-bold" onClick={() => setEditing(true)} disabled={loading}>Edit</button>
          <button className="px-3 py-1 rounded bg-red-500 text-white font-bold" onClick={handleDelete} disabled={loading}>Delete</button>
        </div>
      )}
      {error && <div className="text-red-400 text-sm">{error}</div>}
    </div>
  );
}
