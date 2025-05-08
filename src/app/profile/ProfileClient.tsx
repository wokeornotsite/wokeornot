"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useAvatar } from "./AvatarContext";
import Link from "next/link";
import EditDeleteReview from "./EditDeleteReview";
import DateClient from "./DateClient";
import styles from "./profile.module.css";

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
  reviews: Review[];
  comments: Comment[];
};

const builtInAvatars = [
  "/avatars/avatar1.svg",
  "/avatars/avatar2.svg",
  "/avatars/avatar3.svg",
  "/avatars/avatar4.svg",
];

function ProfileClient({ user }: { user: UserProfileData }) {
  const { avatar, setAvatar } = useAvatar();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activityFilter, setActivityFilter] = useState("");
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [nameLoading, setNameLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

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
      
      // Update the review in state
      setReviews((prev) => 
        prev.map((r) => 
          r.id === reviewId 
            ? { ...r, likes, dislikes, userReaction } 
            : r
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
      const updated = await res.json();
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, rating: editingReviewRating, text: editingReviewText } : r)));
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


  // Avatar upload handler (calls backend)
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setAvatarFile(e.target.files[0]);
    setAvatar(URL.createObjectURL(e.target.files[0]));
    setAvatarLoading(true);
    setAvatarError("");
    const formData = new FormData();
    formData.append("avatar", e.target.files[0]);
    try {
      const res = await fetch("/api/user/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload avatar");
      setAvatar(data.image);
    } catch (err: any) {
      setAvatarError(err.message || "Failed to upload avatar");
    } finally {
      setAvatarLoading(false);
    }
  };



  // Name change handler (calls backend)
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
      setNameSuccess("Name changed successfully!");
    } catch (err: any) {
      setNameError(err.message || "Failed to change name");
    } finally {
      setNameLoading(false);
    }
  };

  // Email change handler (calls backend)
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
      setEmailSuccess("Email changed successfully!");
    } catch (err: any) {
      setEmailError(err.message || "Failed to change email");
    } finally {
      setEmailLoading(false);
    }
  };

  // Activity filter
  const filteredReviews = user.reviews.filter((r: Review) => !activityFilter || r.content?.title?.toLowerCase().includes(activityFilter.toLowerCase()));
  const filteredComments = user.comments.filter((c: Comment) => !activityFilter || c.content?.title?.toLowerCase().includes(activityFilter.toLowerCase()));

  return (<div className={styles.profileRoot}>
      {/* Sign Out Button */}
      <form action="/api/auth/signout" method="POST" style={{ position: 'absolute', right: 32, top: 32, zIndex: 10 }}>
        <button className={styles.profileButton} style={{ maxWidth: 200, padding: '0.6em 0', fontSize: '1em', background: 'linear-gradient(90deg, #e879f9 0%, #a78bfa 50%, #38bdf8 100%)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 22, height: 22, marginRight: 8, verticalAlign: 'middle', display: 'inline-block' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 12h-9m0 0l3-3m-3 3l3 3" />
          </svg>
          Sign Out
        </button>
      </form>
      <h2 className={styles.profileTitle}>Profile</h2>
      <div className={styles.profilePanels}>
        {/* Settings Panel */}
        <div className={styles.profilePanel}>
          {avatar ? (
            <Image src={avatar} alt="Profile" width={100} height={100} className={styles.avatar} unoptimized />
          ) : (
            <div className={styles.avatar}>?</div>
          )}
          {/* Name Change */}
          <form style={{ width: '100%' }} onSubmit={handleNameChange}>
            <input
              type="text"
              className={styles.profileInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={nameLoading}
            />
            <button className={styles.profileButton} type="submit" disabled={nameLoading}>
              Update Name
            </button>
            {nameError && <div style={{ color: '#f87171', fontSize: '0.98em' }}>{nameError}</div>}
            {nameSuccess && <div style={{ color: '#4ade80', fontSize: '0.98em' }}>{nameSuccess}</div>}
          </form>
          {/* Email Change */}
          <form style={{ width: '100%' }} onSubmit={handleEmailChange}>
            <input
              type="email"
              className={styles.profileInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={emailLoading}
            />
            <button className={styles.profileButton} type="submit" disabled={emailLoading}>
              Update Email
            </button>
            {emailError && <div style={{ color: '#f87171', fontSize: '0.98em' }}>{emailError}</div>}
            {emailSuccess && <div style={{ color: '#4ade80', fontSize: '0.98em' }}>{emailSuccess}</div>}
          </form>
          <hr className={styles.divider} />
          {/* Avatar upload & picker */}
          <form style={{ width: '100%' }} onSubmit={(e) => e.preventDefault()}>
            <input
              type="file"
              accept="image/*"
              className={styles.profileInput}
              style={{ background: 'transparent', color: '#a5b4fc' }}
              onChange={handleAvatarChange}
              disabled={avatarLoading}
            />
            <button className={styles.profileButton} type="submit" disabled={avatarLoading}>
              Upload Avatar
            </button>
            <button className={styles.profileButton} type="button" onClick={() => setShowAvatarPicker((v) => !v)}>
              Choose Built-in Avatar
            </button>
            {avatarError && <div style={{ color: '#f87171', fontSize: '0.98em' }}>{avatarError}</div>}
          </form>
          {showAvatarPicker && (
            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              {builtInAvatars.map((src) => (
                <button
                  key={src}
                  style={{ border: avatar === src ? '2px solid #38bdf8' : '1px solid #ccc', borderRadius: '50%', padding: 2, background: 'none' }}
                  onClick={async () => {
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
                    } catch (err: any) {
                      setAvatarError(err.message || 'Failed to set avatar');
                    } finally {
                      setAvatarLoading(false);
                      setShowAvatarPicker(false);
                    }
                  }}
                >
                  <Image src={src} alt="avatar" width={48} height={48} style={{ borderRadius: '50%' }} unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Reviews Panel */}
        <div className={styles.profilePanelWide}>
          <h3 className={styles.sectionTitle}>Your Reviews</h3>
          {filteredReviews.length ? (
            <ul className={styles.reviewList}>
              {reviews
                .filter((r) => !activityFilter || r.content?.title?.toLowerCase().includes(activityFilter.toLowerCase()))
                .map((review: Review) => (
                  <li key={review.id} className={styles.reviewCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Image src={avatar || '/avatars/default.png'} alt="avatar" width={32} height={32} style={{ borderRadius: '50%' }} unoptimized />
                      <Link href={`/${review.content?.contentType.toLowerCase()}/${review.content?.tmdbId}`} className={styles.reviewTitle}>
                        {review.content?.title}
                      </Link>
                    </div>
                    {editingReviewId === review.id ? (
  <>
    <div className={styles.flexRowCenter} style={{ marginBottom: 8 }}>
      <label className={styles.modernLabel}>
        Rating:
        <input
          type="number"
          min={1}
          max={10}
          value={editingReviewRating}
          onChange={(e) => setEditingReviewRating(Number(e.target.value))}
          className={styles.modernRatingInput}
        />
        /10
      </label>
    </div>
    <textarea
      className={styles.profileInput}
      value={editingReviewText}
      onChange={(e) => setEditingReviewText(e.target.value)}
      style={{ width: '100%', minHeight: 40, marginTop: 8 }}
    />
    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
      <button className={styles.profileButton} style={{ background: '#38bdf8', color: 'white' }} onClick={() => handleSaveEditReview(review)}>
        Save
      </button>
      <button className={styles.profileButton} style={{ background: '#a78bfa', color: 'white' }} onClick={handleCancelEditReview}>
        Cancel
      </button>
    </div>
    {reviewActionError && <div style={{ color: '#f87171', fontSize: '0.98em' }}>{reviewActionError}</div>}
  </>
) : (
  <>
    <div className={styles.reviewRating}><span style={{ color: '#f472b6', fontWeight: 700 }}>{review.rating}/10</span></div>
    {review.text && <div className={styles.reviewText}>{review.text}</div>}
    <DateClient iso={review.createdAt} className={styles.reviewDate} />
    
    {/* Like/Dislike Buttons */}
    <div className="flex items-center space-x-4 mt-2">
      <button 
        onClick={() => handleReviewReaction(review.id, 'like')}
        className={`flex items-center space-x-1 px-2 py-1 rounded ${review.userReaction === 'like' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'} transition-colors`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
        </svg>
        <span>{review.likes || 0}</span>
      </button>
      
      <button 
        onClick={() => handleReviewReaction(review.id, 'dislike')}
        className={`flex items-center space-x-1 px-2 py-1 rounded ${review.userReaction === 'dislike' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'} transition-colors`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
        </svg>
        <span>{review.dislikes || 0}</span>
      </button>
    </div>
    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
      <button
        className={styles.profileButton}
        type="button"
        style={{ borderRadius: 6, background: '#f472b6', color: 'white', fontWeight: 500 }}
        onClick={() => handleEditReview(review)}
      >Edit</button>
      <button
        className={styles.profileButton}
        type="button"
        style={{ borderRadius: 6, background: '#f87171', color: 'white', fontWeight: 500 }}
        onClick={() => handleDeleteReview(review)}
      >Delete</button>
    </div>
    {reviewActionError && <div style={{ color: '#f87171', fontSize: '0.98em' }}>{reviewActionError}</div>}
  </>
)}
                  </li>
                ))}
            </ul>
          ) : (
            <div className="text-blue-300 italic text-center py-6">No reviews yet. Go rate your first movie or show!</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileClient;
