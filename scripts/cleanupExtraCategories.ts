import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const lgbtq = await prisma.category.findUnique({ where: { name: 'LGBTQ+ Themes' } });
  const sexuality = await prisma.category.findUnique({ where: { name: 'Sexuality' } });
  const language = await prisma.category.findUnique({ where: { name: 'Language' } });
  const violence = await prisma.category.findUnique({ where: { name: 'Violence' } });
  const other = await prisma.category.findUnique({ where: { name: 'Other' } });

  // Merge Sexuality -> LGBTQ+ Themes
  if (sexuality && lgbtq) {
    const rcs = await prisma.reviewCategory.findMany({ where: { categoryId: sexuality.id } });
    console.log(`Sexuality: ${rcs.length} records to reassign`);
    for (const rc of rcs) {
      const dup = await prisma.reviewCategory.findUnique({
        where: { reviewId_categoryId: { reviewId: rc.reviewId, categoryId: lgbtq.id } },
      });
      if (dup) await prisma.reviewCategory.delete({ where: { id: rc.id } });
      else await prisma.reviewCategory.update({ where: { id: rc.id }, data: { categoryId: lgbtq.id } });
    }
    await prisma.category.delete({ where: { id: sexuality.id } });
    console.log('Merged Sexuality -> LGBTQ+ Themes and deleted.');
  } else {
    console.log('Sexuality not found, skipping.');
  }

  // Move Language + Violence -> Other, then delete
  for (const cat of [language, violence]) {
    if (!cat) { console.log('Category not found, skipping.'); continue; }
    if (!other) { console.log('Other category not found!'); continue; }
    const rcs = await prisma.reviewCategory.findMany({ where: { categoryId: cat.id } });
    console.log(`${cat.name}: ${rcs.length} records to move -> Other`);
    for (const rc of rcs) {
      const dup = await prisma.reviewCategory.findUnique({
        where: { reviewId_categoryId: { reviewId: rc.reviewId, categoryId: other.id } },
      });
      if (dup) await prisma.reviewCategory.delete({ where: { id: rc.id } });
      else await prisma.reviewCategory.update({ where: { id: rc.id }, data: { categoryId: other.id } });
    }
    await prisma.category.delete({ where: { id: cat.id } });
    console.log(`Moved ${cat.name} -> Other and deleted.`);
  }

  const final = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  console.log(`\nFinal category list (${final.length}):`);
  final.forEach((c, i) => console.log(`  ${i + 1}. ${c.name}`));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
