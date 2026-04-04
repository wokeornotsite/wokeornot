"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useAvatar } from "./AvatarContext";
import Link from "next/link";
import DateClient from "./DateClient";
import { signOut, useSession } from "next-auth/react";

// Types must match server
export type Review = {
  id: string;
  rating: number;
  text?: string;
  createdAt: string;
  likes?: number;
  dislikes?: number;
  userReaction?: 'like' | 'dislike' | null;
  content?: {
    contentType: string;
    tmdbId: number;
    title: string;
  };
  user?: {
    name?: string;
    avatar?: string;
    image?: string;
  };
};

export type Comment = {
  id: string;
  text: string;
  createdAt: string;
  content?: {
    contentType: string;
    tmdbId: number;
    title: string;
  };
};

export type UserProfileData = {
  name: string;
  email: string;
  avatar?: string;
  image?: string;
  bio?: string;
  createdAt?: string;
  reviewCount?: number;
  reviews: Review[];
  comments: Comment[];
};

const builtInAvatars = [
  "/avatars/avatar1.svg",
  "/avatars/avatar2.svg",
  "/avatars/avatar3.svg",
  "/avatars/avatar4.svg",
  "/avatars/avatar5.svg",
  "/avatars/avatar6.svg",
  "/avatars/avatar7.svg",
  "/avatars/avatar8.svg",
  "/avatars/avatar9.svg",
  "/avatars/avatar10.svg",
  "/avatars/avatar11.svg",
  "/avatars/avatar12.svg",
];

function ProfileClient({ user }: { user: UserProfileData }) {
  const { avatar, setAvatar } = useAvatar();
  const { update: updateSession } = useSession();
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio || "");
  const [nameLoading, setNameLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [bioError, setBioError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [bioSuccess, setBioSuccess] = useState("");

  // Review editing state
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewText, setEditingReviewText] = useState<string>("");
  const [editingReviewRating, setEditingReviewRating] = useState<number>(0);
  const [reviewActionError, setReviewActionError] = useState<string>("");

  // Reviews state
  const [reviews, setReviews] = useState(user.reviews);

  // Review handlers
  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditingReviewText(review.text || "");
    setEditingReviewRating(review.rating);
    setReviewActionError("");
  };

  // Like/Dislike handlers
  const handleReviewReaction = async (reviewId: string, reaction: 'like' | 'dislike') => {
    setReviewActionError("");
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update reaction");
      }
      const { likes, dislikes, userReaction } = await res.json();
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, likes, dislikes, userReaction } : r
        )
      );
    } catch (err: any) {
      setReviewActionError(err.message || "Failed to update reaction");
    }
  };

  const handleCancelEditReview = () => {
    setEditingReviewId(null);
    setEditingReviewText("");
    setEditingReviewRating(0);
    setReviewActionError("");
  };

  const handleSaveEditReview = async (review: Review) => {
    setReviewActionError("");
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: editingReviewRating, text: editingReviewText }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update review");
      }
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, rating: editingReviewRating, text: editingReviewText } : r
        )
      );
      setEditingReviewId(null);
      setEditingReviewText("");
      setEditingReviewRating(0);
    } catch (err: any) {
      setReviewActionError(err.message || "Failed to update review");
    }
  };

  const handleDeleteReview = async (review: Review) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    setReviewActionError("");
    try {
      const res = await fetch(`/api/reviews/${review.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete review");
      }
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (err: any) {
      setReviewActionError(err.message || "Failed to delete review");
    }
  };

  // Name change handler
  const handleNameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameLoading(true);
    setNameError("");
    setNameSuccess("");
    try {
      const res = await fetch("/api/user/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change name");
      setNameSuccess("Name updated successfully!");
    } catch (err: any) {
      setNameError(err.message || "Failed to change name");
    } finally {
      setNameLoading(false);
    }
  };

  // Email change handler
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError("");
    setEmailSuccess("");
    try {
      const res = await fetch("/api/user/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change email");
      setEmailSuccess("Email updated successfully!");
    } catch (err: any) {
      setEmailError(err.message || "Failed to change email");
    } finally {
      setEmailLoading(false);
    }
  };

  // Bio change handler
  const handleBioChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setBioLoading(true);
    setBioError("");
    setBioSuccess("");
    try {
      const res = await fetch("/api/user/bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update bio");
      setBioSuccess("Bio updated successfully!");
    } catch (err: any) {
      setBioError(err.message || "Failed to update bio");
    } finally {
      setBioLoading(false);
    }
  };

  // Built-in avatar picker handler
  const handlePickAvatar = async (src: string) => {
    setAvatarLoading(true);
    setAvatar(src);
    setAvatarError("");
    try {
      const res = await fetch('/api/user/builtin-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: src }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set avatar');
      // Refresh session so Navbar picks up the new avatar immediately
      await updateSession({ avatar: src });
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to set avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  const filteredReviews = reviews.filter(
    (r) => !activityFilter || r.content?.title?.toLowerCase().includes(activityFilter.toLowerCase())
  );

  const displayName = name || 'Anonymous';
  const initials = displayName.charAt(0).toUpperCase();

  // Format member since date
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Hero Bar */}
      <div className="bg-[#1a1a2e] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center gap-6 relative">
          {/* Avatar */}
          <div className="relative shrink-0">
            {avatar ? (
              <Image
                src={avatar}
                alt="Profile"
                width={128}
                height={128}
                className="rounded-full ring-4 ring-purple-500 object-cover"
                unoptimized
              />
            ) : (
              <div className="w-32 h-32 rounded-full ring-4 ring-purple-500 bg-[#232946] flex items-center justify-center text-4xl font-bold text-purple-300">
                {initials}
              </div>
            )}
          </div>

          {/* Name / email / stats */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent truncate">
              {displayName}
            </h1>
            <p className="text-gray-400 text-sm mt-1 truncate">{user.email}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="bg-purple-900/40 border border-purple-700/40 text-purple-300 text-xs font-semibold rounded-full px-3 py-1">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </span>
              {memberSince && (
                <span className="bg-indigo-900/40 border border-indigo-700/40 text-indigo-300 text-xs font-semibold rounded-full px-3 py-1">
                  Member since {memberSince}
                </span>
              )}
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="absolute right-4 top-4 md:relative md:right-auto md:top-auto shrink-0 flex items-center gap-2 bg-[#232946] hover:bg-[#2d2d4a] border border-white/10 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 12h-9m0 0l3-3m-3 3l3 3" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6">
        {/* Settings Card */}
        <div className="lg:w-72 shrink-0">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 space-y-6 lg:sticky lg:top-6">
            <h2 className="text-base font-semibold text-white">Account Settings</h2>

            {/* Name form */}
            <form onSubmit={handleNameChange} className="space-y-2">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={nameLoading}
                className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={nameLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                {nameLoading ? 'Saving…' : 'Update Name'}
              </button>
              {nameError && <p className="text-red-400 text-xs">{nameError}</p>}
              {nameSuccess && <p className="text-green-400 text-xs">{nameSuccess}</p>}
            </form>

            <div className="border-t border-white/10" />

            {/* Email form */}
            <form onSubmit={handleEmailChange} className="space-y-2">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={emailLoading}
                className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={emailLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                {emailLoading ? 'Saving…' : 'Update Email'}
              </button>
              {emailError && <p className="text-red-400 text-xs">{emailError}</p>}
              {emailSuccess && <p className="text-green-400 text-xs">{emailSuccess}</p>}
            </form>

            <div className="border-t border-white/10" />

            {/* Bio form */}
            <form onSubmit={handleBioChange} className="space-y-2">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Bio</label>
              <div className="relative">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={bioLoading}
                  maxLength={300}
                  rows={3}
                  placeholder="Tell the community about yourself…"
                  className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 resize-none"
                />
                <span className={`absolute bottom-2 right-2 text-xs ${bio.length >= 280 ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {bio.length}/300
                </span>
              </div>
              <button
                type="submit"
                disabled={bioLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                {bioLoading ? 'Saving…' : 'Update Bio'}
              </button>
              {bioError && <p className="text-red-400 text-xs">{bioError}</p>}
              {bioSuccess && <p className="text-green-400 text-xs">{bioSuccess}</p>}
            </form>

            <div className="border-t border-white/10" />

            {/* Avatar picker */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Choose Your Avatar</label>
              <div className="grid grid-cols-4 gap-2">
                {builtInAvatars.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => handlePickAvatar(src)}
                    disabled={avatarLoading}
                    className={`rounded-full transition-all focus:outline-none ${
                      avatar === src
                        ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-[#1a1a2e]'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={src}
                      alt="avatar option"
                      width={64}
                      height={64}
                      className="rounded-full"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
              {avatarError && <p className="text-red-400 text-xs">{avatarError}</p>}
            </div>
          </div>
        </div>

        {/* Reviews Panel */}
        <div className="flex-1 min-w-0">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
              <h2 className="text-base font-semibold text-white">
                Your Reviews
                <span className="ml-2 text-xs font-normal text-gray-400">({reviews.length})</span>
              </h2>
              <input
                type="text"
                placeholder="Filter by title…"
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="sm:ml-auto bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors w-full sm:w-48"
              />
            </div>

            {reviewActionError && (
              <div className="bg-red-900/40 text-red-300 border border-red-800/40 rounded-lg px-4 py-3 text-sm mb-4">
                {reviewActionError}
              </div>
            )}

            {filteredReviews.length === 0 ? (
              <div className="text-gray-400 italic text-center py-10">
                {activityFilter ? 'No reviews match your filter.' : 'No reviews yet. Go rate your first movie or show!'}
              </div>
            ) : (
              <ul className="space-y-4">
                {filteredReviews.map((review) => (
                  <li key={review.id} className="bg-[#232946] border border-white/10 rounded-xl p-4">
                    {/* Header row */}
                    <div className="flex items-center gap-3 mb-3">
                      {avatar ? (
                        <Image
                          src={avatar}
                          alt="avatar"
                          width={32}
                          height={32}
                          className="rounded-full object-cover border border-white/20 shrink-0"
                          unoptimized
                        />
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-900/50 text-purple-300 font-semibold text-sm shrink-0">
                          {initials}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        {review.content ? (
                          <Link
                            href={`/${{ MOVIE: 'movies', TV_SHOW: 'tv-shows', KIDS: 'kids' }[review.content.contentType] ?? 'movies'}/${review.content.tmdbId}`}
                            className="text-indigo-300 hover:text-indigo-200 font-medium text-sm truncate block transition-colors"
                          >
                            {review.content.title}
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-sm">Unknown content</span>
                        )}
                      </div>
                      <span className="shrink-0 bg-yellow-900/40 text-yellow-300 text-xs font-semibold rounded-full px-2 py-0.5">
                        {review.rating}/10
                      </span>
                    </div>

                    {/* Edit mode */}
                    {editingReviewId === review.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-400">Rating:</label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={editingReviewRating}
                            onChange={(e) => setEditingReviewRating(Number(e.target.value))}
                            className="w-16 bg-[#0f0f1a] border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
                          />
                          <span className="text-xs text-gray-400">/10</span>
                        </div>
                        <textarea
                          value={editingReviewText}
                          onChange={(e) => setEditingReviewText(e.target.value)}
                          className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 min-h-[80px] resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEditReview(review)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEditReview}
                            className="bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {review.text && (
                          <p className="text-gray-200 text-sm leading-relaxed mb-3">{review.text}</p>
                        )}
                        <DateClient iso={review.createdAt} className="text-gray-500 text-xs mb-3" />

                        <div className="flex items-center gap-3">
                          {/* Like */}
                          <button
                            onClick={() => handleReviewReaction(review.id, 'like')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                              review.userReaction === 'like'
                                ? 'bg-green-600 text-white'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                            </svg>
                            {review.likes || 0}
                          </button>
                          {/* Dislike */}
                          <button
                            onClick={() => handleReviewReaction(review.id, 'dislike')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                              review.userReaction === 'dislike'
                                ? 'bg-red-600 text-white'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                            </svg>
                            {review.dislikes || 0}
                          </button>

                          <div className="ml-auto flex gap-2">
                            <button
                              onClick={() => handleEditReview(review)}
                              className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-medium px-3 py-1 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review)}
                              className="bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-medium px-3 py-1 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileClient;
