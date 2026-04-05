import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  // Seed admin user if not exists
  const adminEmail = 'admin@wokeornot.com';
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
      avatar: '/avatars/default.png',
    },
  });
  if (admin) {
    console.log('Seeded admin user. Change the password after first login.');
  }

  const categories = [
    { name: 'LGBTQ+ Themes', description: 'LGBTQ+ characters, relationships, and representation' },
    { name: 'Transgender Themes', description: 'Themes related to transgender identity or issues' },
    { name: 'Gender Identity', description: 'Gender nonconformity, gender swapping, and nontraditional gender expression' },
    { name: 'Feminist Themes', description: 'Themes promoting feminism or female empowerment' },
    { name: 'Anti-Patriarchy', description: 'Opposition to patriarchal structures or male dominance' },
    { name: 'Race Swapping', description: 'Changing the race or ethnicity of established characters' },
    { name: 'Diversity Casting', description: 'Casting choices driven by diversity considerations' },
    { name: 'Race & Ethnicity', description: 'Race and ethnicity representation and related themes' },
    { name: 'Social Justice', description: 'Social justice messaging including allyship, intersectionality, and equity themes' },
    { name: 'Political Content', description: 'Political themes, messaging, or propaganda' },
    { name: 'Environmental Messaging', description: 'Environmental activism or climate-related messaging' },
    { name: 'Religion', description: 'Religious themes or representation' },
    { name: 'Other', description: 'Other woke-related themes not covered above' },
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
