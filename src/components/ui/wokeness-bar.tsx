import React from 'react';
import { CategoryScore } from '@/types';
import { 
  normalizeWokenessScore, 
  formatWokenessScore, 
  getWokenessLabel, 
  getWokenessBarColor,
  getCategoryColor 
} from '@/lib/wokeness-utils';

interface WokenessBarProps {
  score: number;
  categoryScores?: CategoryScore[];
}

export const WokenessBar: React.FC<WokenessBarProps> = ({ score, categoryScores = [] }) => {
  // Normalize score to 0-100 scale for display
  const normalizedScore = normalizeWokenessScore(score);
  
  // Sort category scores by percentage contribution (highest first)
  const sortedScores = [...categoryScores].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold">Wokeness Score: {formatWokenessScore(score)}/10</span>
        <span className={`px-3 py-1 rounded-full text-white font-medium ${getWokenessBarColor(score)}`}>
          {getWokenessLabel(score)}
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
                className={`h-full ${getCategoryColor(index).bg}`}
                title={`${categoryScore.category?.name}: ${categoryScore.percentage.toFixed(1)}%`}
              />
            ))}
          </div>
        ) : (
          <div 
            className={`h-full ${getWokenessBarColor(score)}`} 
            style={{ width: `${normalizedScore}%` }} 
          />
        )}
      </div>
      
      {/* Category legend */}
      {sortedScores.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {sortedScores.slice(0, 6).map((categoryScore, index) => (
            <div key={categoryScore.id} className="flex items-center text-sm">
              <div className={`w-3 h-3 rounded-full mr-2 ${getCategoryColor(index).bg}`} />
              <span>{categoryScore.category?.name}: {categoryScore.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
