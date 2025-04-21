import React from 'react';
import { CategoryScore } from '@/types';

interface WokenessBarProps {
  score: number;
  categoryScores?: CategoryScore[];
}

export const WokenessBar: React.FC<WokenessBarProps> = ({ score, categoryScores = [] }) => {
  // Normalize score to 0-100 scale for display
  const normalizedScore = Math.round((score / 10) * 100);
  
  // Sort category scores by percentage contribution (highest first)
  const sortedScores = [...categoryScores].sort((a, b) => b.percentage - a.percentage);

  // Generate a color based on the wokeness score
  // Lower scores (less woke) are green, higher scores (more woke) are red
  const getScoreColor = (score: number) => {
    if (score <= 3) return 'bg-green-500';
    if (score <= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold">Wokeness Score: {score.toFixed(1)}/10</span>
        <span className={`px-3 py-1 rounded-full text-white font-medium ${getScoreColor(score)}`}>
          {score <= 3 ? 'Not Woke' : score <= 6 ? 'Moderately Woke' : 'Very Woke'}
        </span>
      </div>
      
      {/* Main gradient bar */}
      <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden">
        {sortedScores.length > 0 ? (
          <div className="h-full flex">
            {sortedScores.map((categoryScore, index) => (
              <div
                key={categoryScore.id}
                style={{ width: `${categoryScore.percentage}%` }}
                className={`h-full ${getCategoryColor(index)}`}
                title={`${categoryScore.category?.name}: ${categoryScore.percentage.toFixed(1)}%`}
              />
            ))}
          </div>
        ) : (
          <div 
            className={`h-full ${getScoreColor(score)}`} 
            style={{ width: `${normalizedScore}%` }} 
          />
        )}
      </div>
      
      {/* Category legend */}
      {sortedScores.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {sortedScores.slice(0, 6).map((categoryScore, index) => (
            <div key={categoryScore.id} className="flex items-center text-sm">
              <div className={`w-3 h-3 rounded-full mr-2 ${getCategoryColor(index)}`} />
              <span>{categoryScore.category?.name}: {categoryScore.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to get a color for each category
const getCategoryColor = (index: number) => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-lime-500',
    'bg-emerald-500',
  ];
  
  return colors[index % colors.length];
};
