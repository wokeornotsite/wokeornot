/**
 * Shared utility functions for wokeness scoring, colors, and labels
 * Used across the app to ensure consistent wokeness representation
 */

export type WokenessLevel = 'not-woke' | 'moderate' | 'very-woke';

/**
 * Get wokeness level classification from score
 */
export function getWokenessLevel(score: number): WokenessLevel {
  if (score <= 3) return 'not-woke';
  if (score <= 6) return 'moderate';
  return 'very-woke';
}

/**
 * Get human-readable label for wokeness score
 */
export function getWokenessLabel(score: number): string {
  const level = getWokenessLevel(score);
  
  switch (level) {
    case 'not-woke':
      return 'Not Woke';
    case 'moderate':
      return 'Moderately Woke';
    case 'very-woke':
      return 'Very Woke';
  }
}

/**
 * Get Tailwind CSS color class for wokeness score
 * Returns background gradient classes
 */
export function getWokenessBadgeColor(score: number): string {
  const level = getWokenessLevel(score);
  
  switch (level) {
    case 'not-woke':
      return 'text-white';
    case 'moderate':
      return 'text-white';
    case 'very-woke':
      return 'text-white';
  }
}

/**
 * Get background style for wokeness badge
 * Returns CSS gradient string
 */
export function getWokenessBadgeBg(score: number): string {
  const level = getWokenessLevel(score);
  
  switch (level) {
    case 'not-woke':
      return 'linear-gradient(135deg, #10b981 0%, #059669 100%)'; // green
    case 'moderate':
      return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'; // yellow/orange
    case 'very-woke':
      return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'; // red
  }
}

/**
 * Get Tailwind CSS background color class for wokeness bar
 * Used in wokeness bar component
 */
export function getWokenessBarColor(score: number): string {
  const level = getWokenessLevel(score);
  
  switch (level) {
    case 'not-woke':
      return 'bg-green-500';
    case 'moderate':
      return 'bg-yellow-500';
    case 'very-woke':
      return 'bg-red-500';
  }
}

/**
 * Get color for category badge in wokeness breakdown
 * Cycles through a palette of distinct colors
 */
export function getCategoryColor(index: number): { bg: string; text: string } {
  const colors = [
    { bg: 'bg-pink-500', text: 'text-white' },
    { bg: 'bg-purple-500', text: 'text-white' },
    { bg: 'bg-blue-500', text: 'text-white' },
    { bg: 'bg-cyan-500', text: 'text-white' },
    { bg: 'bg-teal-500', text: 'text-white' },
    { bg: 'bg-green-500', text: 'text-white' },
    { bg: 'bg-yellow-500', text: 'text-white' },
    { bg: 'bg-orange-500', text: 'text-white' },
  ];
  
  return colors[index % colors.length];
}

/**
 * Format wokeness score for display
 * Returns score to 1 decimal place
 */
export function formatWokenessScore(score: number): string {
  return score.toFixed(1);
}

/**
 * Validate wokeness score is within valid range (0-10)
 */
export function isValidWokenessScore(score: number): boolean {
  return typeof score === 'number' && score >= 0 && score <= 10 && !isNaN(score);
}

/**
 * Normalize wokeness score to percentage (0-100)
 */
export function normalizeWokenessScore(score: number): number {
  return Math.round((score / 10) * 100);
}

/**
 * Get text color class for wokeness score display
 * Used for labels and text indicators
 */
export function getWokenessTextColor(score: number): string {
  const level = getWokenessLevel(score);
  
  switch (level) {
    case 'not-woke':
      return 'text-green-600';
    case 'moderate':
      return 'text-yellow-600';
    case 'very-woke':
      return 'text-red-600';
  }
}
