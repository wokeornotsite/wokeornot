"use client";
import React, { useState, useCallback } from "react";
import { FaFacebook, FaTwitter, FaWhatsapp, FaReddit, FaLink, FaCheck } from "react-icons/fa";

interface SocialShareButtonsProps {
  url: string;
  title?: string;
}

const buttonClass =
  "flex items-center gap-1 px-2 py-1 rounded-md text-gray-400 font-normal text-sm bg-gray-800/60 hover:bg-gray-700/80 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-200";

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ url, title }) => {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = title ? encodeURIComponent(title) : "";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [url]);

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
        aria-label="Share on Twitter / X"
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
      <a
        href={`https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label="Share on Reddit"
      >
        <FaReddit className="w-4 h-4" />
      </a>
      <button
        className={`${buttonClass} ${copied ? "text-green-400" : ""}`}
        aria-label={copied ? "Link copied!" : "Copy link"}
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <FaCheck className="w-4 h-4" />
            <span className="text-xs">Copied!</span>
          </>
        ) : (
          <FaLink className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};
