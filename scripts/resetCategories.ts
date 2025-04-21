import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  'Transgender Themes',
  'Gay Marriage',
  'Race Swapping',
  'Feminist Agenda',
  'LGBT Representation',
  'Gender Nonconformity',
  'Allyship',
  'Diversity Casting',
  'Intersectionality',
  'Equity Over Merit',
  'Gender Swapping',
  'Political',
  'Queer Representation',
  'Drag',
  'Environmental Agenda',
  'Anti-Patriarchy',
  'Other',
];

async function main() {
  // Delete all existing categories
  await prisma.category.deleteMany({});

  // Insert the new categories
  for (const name of categories) {
    await prisma.category.create({
      data: { name },
    });
  }

  console.log('Categories have been reset.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
