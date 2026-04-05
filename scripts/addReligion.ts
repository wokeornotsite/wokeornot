import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const r = await prisma.category.upsert({
    where: { name: 'Religion' },
    update: {},
    create: { name: 'Religion', description: 'Religious themes or representation' },
  });
  console.log('Religion category ensured:', r.id, r.name);

  const final = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  console.log(`\nFinal category list (${final.length}):`);
  final.forEach((c, i) => console.log(`  ${i + 1}. ${c.name}`));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
