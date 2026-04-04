"use client";
import React from 'react';

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  className?: string;
}

export function EmptyState({ icon, title, description, actions, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-blue-900/40 flex items-center justify-center mb-4 text-blue-300">
        {icon}
      </div>
      <h3 className="text-white font-semibold text-xl mb-2">{title}</h3>
      {description && <p className="text-gray-400 text-sm mb-6 max-w-sm">{description}</p>}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {actions.map((action, i) =>
            action.href ? (
              <a
                key={i}
                href={action.href}
                className="px-5 py-2 rounded-full font-semibold text-sm bg-gradient-to-r from-pink-500 to-blue-500 text-white hover:from-blue-500 hover:to-pink-500 transition-all"
              >
                {action.label}
              </a>
            ) : (
              <button
                key={i}
                onClick={action.onClick}
                className="px-5 py-2 rounded-full font-semibold text-sm bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20"
              >
                {action.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
