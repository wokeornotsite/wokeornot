"use client";
import React, { useState } from "react";
import Image from "next/image";
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
  content?: {
    contentType: string;
    tmdbId: number;
    title: string;
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
  image?: string;
  reviews: Review[];
  comments: Comment[];
};

export default function ProfileClient({ user }: { user: UserProfileData }) {
  const [avatar, setAvatar] = useState(user.image || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [nameLoading, setNameLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

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

  // Password change handler (calls backend)
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");
    if (password !== password2) {
      setPasswordError("Passwords do not match");
      setPasswordLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: "", newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setPasswordSuccess("Password changed successfully!");
      setPassword("");
      setPassword2("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
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
  const filteredReviews = user.reviews.filter((r) => !activityFilter || r.content?.title?.toLowerCase().includes(activityFilter.toLowerCase()));
  const filteredComments = user.comments.filter((c) => !activityFilter || c.content?.title?.toLowerCase().includes(activityFilter.toLowerCase()));

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
            <Image src={avatar} alt="Profile" width={100} height={100} className={styles.avatar} />
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
          {/* Avatar upload */}
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
            {avatarError && <div style={{ color: '#f87171', fontSize: '0.98em' }}>{avatarError}</div>}
          </form>
          <hr className={styles.divider} />
          {/* Password change */}
          <form style={{ width: '100%' }} onSubmit={handlePasswordChange}>
            <input
              type="password"
              placeholder="New password"
              className={styles.profileInput}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={passwordLoading}
            />
            <input
              type="password"
              placeholder="Confirm password"
              className={styles.profileInput}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              disabled={passwordLoading}
            />
            <button className={styles.profileButton} type="submit" disabled={passwordLoading}>
              Change Password
            </button>
            {passwordError && <div style={{ color: '#f87171', fontSize: '0.98em' }}>{passwordError}</div>}
            {passwordSuccess && <div style={{ color: '#4ade80', fontSize: '0.98em' }}>{passwordSuccess}</div>}
          </form>
        </div>
        {/* Reviews Panel */}
        <div className={styles.profilePanelWide}>
          <h3 className={styles.sectionTitle}>Your Reviews</h3>
          {filteredReviews.length ? (
            <ul className={styles.reviewList}>
              {filteredReviews.map((review) => (
                <li key={review.id} className={styles.reviewCard}>
                  <Link href={`/${review.content?.contentType.toLowerCase()}/${review.content?.tmdbId}`} className={styles.reviewTitle}>
                    {review.content?.title}
                  </Link>
                  <div className={styles.reviewRating}>Rating: <span style={{ color: '#f472b6', fontWeight: 700 }}>{review.rating}/10</span></div>
                  {review.text && <div className={styles.reviewText}>{review.text}</div>}
                  <DateClient iso={review.createdAt} className={styles.reviewDate} />
                  <EditDeleteReview
                    id={review.id}
                    initialRating={review.rating}
                    initialText={review.text || ''}
                    onDeleted={() => window.location.reload()}
                    onUpdated={() => window.location.reload()}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-blue-300 italic text-center py-6">No reviews yet. Go rate your first movie or show!</div>
          )}
            </div>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl p-6">
              <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400">Your Comments</h3>
              {user.comments.length ? (
                <ul className={styles.reviewList}>
                  {user.comments.map((comment) => (
                    <li key={comment.id} className={styles.reviewCard}>
                      {comment.content && (
                        <Link href={`/${comment.content.contentType.toLowerCase()}/${comment.content.tmdbId}`} className={styles.reviewTitle}>
                          {comment.content.title}
                        </Link>
                      )}
                      <div className={styles.reviewText}>{comment.text}</div>
                      <DateClient iso={comment.createdAt} className={styles.reviewDate} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.reviewDate} style={{fontStyle:'italic',textAlign:'center',padding:'1.2em 0'}}>No comments yet. Join the conversation!</div>
              )}
            </div>
            {/* Activity History */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl p-6">
              <h3 className={styles.sectionTitle}>Activity History</h3>
              <ul className={styles.reviewList} style={{gap:'0.3em'}}>
                {user.reviews.slice(0, 3).map((r) => (
                  <li key={r.id} className={styles.reviewDate} style={{fontSize:'1em'}}>
                    Rated <span className="font-bold text-pink-300">{r.content?.title}</span> {r.rating}/10 on <DateClient iso={r.createdAt} className={styles.reviewDate} />
                  </li>
                ))}
                {user.comments.slice(0, 3).map((c) => (
                  <li key={c.id} className={styles.reviewDate} style={{fontSize:'1em'}}>
                    Commented on <span className="font-bold text-pink-300">{c.content?.title}</span> on <DateClient iso={c.createdAt} className={styles.reviewDate} />
                  </li>
                ))}
                {!user.reviews.length && !user.comments.length && (
                  <li className={styles.reviewDate} style={{fontStyle:'italic'}}>No activity yet.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
  );
}
