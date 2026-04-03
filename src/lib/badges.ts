import { prisma } from '@/lib/prisma';

export const BADGE_DEFINITIONS = [
  { key: 'FIRST_REVIEW', name: 'First Review', description: 'Submitted your first review', icon: '⭐' },
  { key: 'TEN_REVIEWS', name: 'Reviewer', description: 'Submitted 10 reviews', icon: '🔟' },
  { key: 'FIFTY_REVIEWS', name: 'Prolific Reviewer', description: 'Submitted 50 reviews', icon: '🏆' },
  { key: 'FIRST_COMMENT', name: 'Commenter', description: 'Left your first comment', icon: '💬' },
  { key: 'HELPFUL_REVIEWER', name: 'Helpful Reviewer', description: 'Received 10 likes on your reviews', icon: '👍' },
] as const;

export type BadgeKey = typeof BADGE_DEFINITIONS[number]['key'];

async function awardBadge(userId: string, badgeKey: BadgeKey) {
  try {
    const badge = await prisma.badge.findUnique({ where: { key: badgeKey } });
    if (!badge) return;
    await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
  } catch {
    // Silently ignore duplicate or error
  }
}

export async function checkReviewBadges(userId: string) {
  try {
    const count = await prisma.review.count({ where: { userId, isHidden: false } });
    if (count >= 1) await awardBadge(userId, 'FIRST_REVIEW');
    if (count >= 10) await awardBadge(userId, 'TEN_REVIEWS');
    if (count >= 50) await awardBadge(userId, 'FIFTY_REVIEWS');
  } catch (e) { console.error('Badge check failed:', e); }
}

export async function checkCommentBadges(userId: string) {
  try {
    const count = await prisma.comment.count({ where: { userId, isDeleted: false } });
    if (count >= 1) await awardBadge(userId, 'FIRST_COMMENT');
  } catch (e) { console.error('Badge check failed:', e); }
}

export async function checkHelpfulBadge(reviewAuthorId: string) {
  try {
    const likeCount = await prisma.reviewReaction.count({
      where: { review: { userId: reviewAuthorId }, type: 'like' },
    });
    if (likeCount >= 10) await awardBadge(reviewAuthorId, 'HELPFUL_REVIEWER');
  } catch (e) { console.error('Badge check failed:', e); }
}
