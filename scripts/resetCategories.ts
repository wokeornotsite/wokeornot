import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  'LGBTQ+ Themes',
  'Transgender Themes',
  'Gender Identity',
  'Feminist Themes',
  'Anti-Patriarchy',
  'Race Swapping',
  'Diversity Casting',
  'Race & Ethnicity',
  'Social Justice',
  'Political Content',
  'Environmental Messaging',
  'Religion',
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
