import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Seed admin user if not exists
  const adminEmail = 'admin@wokeornot.com';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin',
      password: 'admin123', // Please change this after first login!
      role: 'ADMIN',
      avatar: '/avatars/default.png',
    },
  });
  if (admin) {
    console.log(`Seeded admin user: ${adminEmail} / password: admin123`);
  }

  const categories = [
    { name: 'Diversity', description: 'Focus on diversity and inclusion' },
    { name: 'Gender', description: 'Gender representation or roles' },
    { name: 'Politics', description: 'Political themes or messages' },
    { name: 'Sexuality', description: 'LGBTQ+ topics or representation' },
    { name: 'Religion', description: 'Religious themes or representation' },
    { name: 'Race', description: 'Race and ethnicity representation' },
    { name: 'Environment', description: 'Environmental or climate topics' },
    { name: 'Violence', description: 'Depiction or discussion of violence' },
    { name: 'Language', description: 'Language or terminology used' },
    { name: 'Transgender Themes', description: 'Themes related to transgender identity or issues' },
    { name: 'Gay Marriages', description: 'Depiction or discussion of gay marriage' },
    { name: 'Race Swapping', description: 'Changing the race/ethnicity of established characters' },
    { name: 'Feminist Agenda', description: 'Themes promoting feminism or anti-patriarchy' },
    { name: 'LGBT Representation', description: 'LGBTQ+ characters or representation' },
    { name: 'Gender Nonconformity', description: 'Nontraditional gender expression or roles' },
    { name: 'Allyship', description: 'Promotion of allyship with marginalized groups' },
    { name: 'Intersectionality', description: 'Themes of interconnected social identities' },
    { name: 'Equity', description: 'Focus on equity over equality or merit' },
    { name: 'Over Merit', description: 'Equity or diversity prioritized over merit' },
    { name: 'Gender Swapping', description: 'Changing the gender of established characters' },
    { name: 'Queer Representation', description: 'Queer characters or themes' },
    { name: 'Drag', description: 'Drag performance or culture' },
    { name: 'Environmental Agenda', description: 'Environmental activism or themes' },
    { name: 'Anti-Patriarchy', description: 'Opposition to patriarchy or male dominance' },
    { name: 'Other', description: 'Other woke-related themes' },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
