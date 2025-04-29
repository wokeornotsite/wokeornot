"use client";
import React from "react";
import { FaFacebook, FaTwitter, FaWhatsapp, FaLink } from "react-icons/fa";

interface SocialShareButtonsProps {
  url: string;
  title?: string;
}

const buttonClass =
  "flex items-center gap-1 px-2 py-1 rounded-md text-gray-400 font-normal text-sm bg-gray-800/60 hover:bg-gray-700/80 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-200";

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ url, title }) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = title ? encodeURIComponent(title) : "";

  return (
    <div className="flex gap-3 mt-4">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label="Share on Facebook"
      >
        <FaFacebook className="w-4 h-4" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label="Share on Twitter"
      >
        <FaTwitter className="w-4 h-4" />
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label="Share on WhatsApp"
      >
        <FaWhatsapp className="w-4 h-4" />
      </a>
      <button
        className={buttonClass}
        aria-label="Copy link"
        onClick={() => {
          navigator.clipboard.writeText(url);
          alert("Link copied to clipboard!");
        }}
      >
        <FaLink className="w-4 h-4" />
      </button>
    </div>
  );
};
