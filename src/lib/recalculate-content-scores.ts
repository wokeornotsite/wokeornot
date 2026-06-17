import { prisma } from '@/lib/prisma';

export async function recalculateContentScores(contentId: string): Promise<void> {
  const allReviewsWithCategories = await prisma.review.findMany({
    where: { contentId, isHidden: false },
    include: { categories: true },
  });

  const categoryAggregates: Record<string, { count: number; score: number }> = {};
  for (const r of allReviewsWithCategories) {
    for (const rc of r.categories) {
      if (!categoryAggregates[rc.categoryId]) {
        categoryAggregates[rc.categoryId] = { count: 0, score: 0 };
      }
      categoryAggregates[rc.categoryId].count += 1;
      categoryAggregates[rc.categoryId].score += r.rating;
    }
  }

  const totalScore = Object.values(categoryAggregates).reduce((sum, v) => sum + v.score, 0);

  await Promise.all(
    Object.entries(categoryAggregates).map(([categoryId, { count, score }]) =>
      prisma.categoryScore.upsert({
        where: { contentId_categoryId: { contentId, categoryId } },
        update: { count, score, percentage: totalScore > 0 ? (score / totalScore) * 100 : 0 },
        create: { contentId, categoryId, count, score, percentage: totalScore > 0 ? (score / totalScore) * 100 : 0 },
      })
    )
  );

  await prisma.categoryScore.deleteMany({
    where: {
      contentId,
      categoryId: { notIn: Object.keys(categoryAggregates) },
    },
  });

  const reviewCount = allReviewsWithCategories.length;
  const wokeScore =
    reviewCount > 0
      ? allReviewsWithCategories.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;
  await prisma.content.update({ where: { id: contentId }, data: { wokeScore, reviewCount } });
}
