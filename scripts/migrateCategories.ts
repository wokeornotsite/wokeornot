/**
 * migrateCategories.ts
 *
 * Safe migration script to refine the category list from 17 → 13 categories.
 *
 * Strategy:
 *  - Renames survivors in-place (preserves their ID and all existing ReviewCategory/CategoryScore records)
 *  - For merged categories: reassigns ReviewCategory records to the survivor before deleting
 *  - Creates new categories that have no predecessor
 *  - Recalculates CategoryScore for all affected content after reassignment
 *
 * Safe to run multiple times (idempotent).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration map:
 *  survivor: old name to rename → new name
 *  absorb: old names whose ReviewCategory records get reassigned to the survivor, then deleted
 *  create: new name with no predecessor (create fresh)
 */
const MIGRATIONS: Array<{
  survivor?: string;
  newName: string;
  absorb?: string[];
  create?: boolean;
}> = [
  {
    survivor: 'LGBT Representation',
    newName: 'LGBTQ+ Themes',
    absorb: ['Queer Representation', 'Gay Marriage', 'Gay Marriages', 'Drag'],
  },
  {
    survivor: 'Transgender Themes',
    newName: 'Transgender Themes', // keep as-is
  },
  {
    survivor: 'Gender Nonconformity',
    newName: 'Gender Identity',
    absorb: ['Gender Swapping', 'Gender'],
  },
  {
    survivor: 'Feminist Agenda',
    newName: 'Feminist Themes',
  },
  {
    survivor: 'Anti-Patriarchy',
    newName: 'Anti-Patriarchy', // keep as-is
  },
  {
    survivor: 'Race Swapping',
    newName: 'Race Swapping', // keep as-is
  },
  {
    survivor: 'Diversity Casting',
    newName: 'Diversity Casting',
    absorb: ['Diversity'],
  },
  {
    newName: 'Race & Ethnicity',
    absorb: ['Race'],
    create: true, // create new; absorb any legacy "Race" records into it
  },
  {
    survivor: 'Allyship',
    newName: 'Social Justice',
    absorb: ['Intersectionality', 'Equity Over Merit', 'Equity', 'Over Merit'],
  },
  {
    survivor: 'Political',
    newName: 'Political Content',
    absorb: ['Politics'],
  },
  {
    survivor: 'Environmental Agenda',
    newName: 'Environmental Messaging',
    absorb: ['Environment'],
  },
  {
    newName: 'Religion',
    absorb: ['Religion'], // absorb in case it exists; otherwise just create
    create: true,
  },
  {
    survivor: 'Other',
    newName: 'Other', // keep as-is
  },
];

async function main() {
  console.log('Starting category migration...\n');

  const affectedContentIds = new Set<string>();

  for (const migration of MIGRATIONS) {
    console.log(`\n→ Processing: "${migration.newName}"`);

    let survivorId: string | null = null;

    // Step 1: Find or create the survivor category
    if (migration.create) {
      // For "create" entries, the survivor is the new category itself
      // (may absorb old categories into it)
      const existing = await prisma.category.findUnique({ where: { name: migration.newName } });
      if (existing) {
        survivorId = existing.id;
        console.log(`  Already exists: "${migration.newName}" (${survivorId})`);
      } else {
        // Check if any of the absorb names exist to use as survivor
        if (migration.absorb?.length) {
          for (const absorbName of migration.absorb) {
            const found = await prisma.category.findUnique({ where: { name: absorbName } });
            if (found) {
              survivorId = found.id;
              // Rename it to the new name
              await prisma.category.update({
                where: { id: survivorId },
                data: { name: migration.newName },
              });
              console.log(`  Renamed "${absorbName}" → "${migration.newName}" (${survivorId})`);
              // Remove from absorb list since we already handled it
              migration.absorb = migration.absorb.filter(n => n !== absorbName);
              break;
            }
          }
        }
        if (!survivorId) {
          const created = await prisma.category.create({ data: { name: migration.newName } });
          survivorId = created.id;
          console.log(`  Created new: "${migration.newName}" (${survivorId})`);
        }
      }
    } else if (migration.survivor) {
      const found = await prisma.category.findUnique({ where: { name: migration.survivor } });
      if (found) {
        survivorId = found.id;
        if (migration.survivor !== migration.newName) {
          await prisma.category.update({
            where: { id: survivorId },
            data: { name: migration.newName },
          });
          console.log(`  Renamed "${migration.survivor}" → "${migration.newName}" (${survivorId})`);
        } else {
          console.log(`  Kept as-is: "${migration.newName}" (${survivorId})`);
        }
      } else {
        // Survivor doesn't exist — create it
        const created = await prisma.category.create({ data: { name: migration.newName } });
        survivorId = created.id;
        console.log(`  Survivor not found; created: "${migration.newName}" (${survivorId})`);
      }
    }

    if (!survivorId) {
      console.log(`  WARN: No survivorId resolved for "${migration.newName}", skipping absorb step.`);
      continue;
    }

    // Step 2: Absorb other old categories into the survivor
    for (const absorbName of migration.absorb ?? []) {
      const old = await prisma.category.findUnique({ where: { name: absorbName } });
      if (!old) {
        console.log(`  Absorb: "${absorbName}" not found in DB, skipping.`);
        continue;
      }
      console.log(`  Absorbing "${absorbName}" (${old.id}) into "${migration.newName}" (${survivorId})`);

      // Get all ReviewCategory records for the old category
      const reviewCats = await prisma.reviewCategory.findMany({
        where: { categoryId: old.id },
        include: { review: { select: { contentId: true } } },
      });

      console.log(`    Found ${reviewCats.length} ReviewCategory records to reassign.`);

      for (const rc of reviewCats) {
        // Track affected content for score recalculation
        if (rc.review?.contentId) {
          affectedContentIds.add(rc.review.contentId);
        }

        // Check if the survivor already has this review tagged
        const duplicate = await prisma.reviewCategory.findUnique({
          where: { reviewId_categoryId: { reviewId: rc.reviewId, categoryId: survivorId } },
        });

        if (duplicate) {
          // Duplicate — just delete the old record (survivor already covers it)
          await prisma.reviewCategory.delete({ where: { id: rc.id } });
        } else {
          // Reassign to survivor
          await prisma.reviewCategory.update({
            where: { id: rc.id },
            data: { categoryId: survivorId },
          });
        }
      }

      // Delete the old category (cascades any remaining ReviewCategory + CategoryScore)
      await prisma.category.delete({ where: { id: old.id } });
      console.log(`    Deleted old category "${absorbName}".`);
    }
  }

  // Step 3: Recalculate CategoryScore for all affected content
  if (affectedContentIds.size > 0) {
    console.log(`\nRecalculating CategoryScore for ${affectedContentIds.size} affected content items...`);

    for (const contentId of affectedContentIds) {
      // Get all reviews for this content
      const reviews = await prisma.review.findMany({
        where: { contentId },
        select: { id: true },
      });
      const reviewIds = reviews.map(r => r.id);

      // Count how many reviews tagged each category
      const reviewCats = await prisma.reviewCategory.findMany({
        where: { reviewId: { in: reviewIds } },
        select: { categoryId: true },
      });

      const totalReviews = reviewIds.length;
      const countByCategory: Record<string, number> = {};
      for (const rc of reviewCats) {
        countByCategory[rc.categoryId] = (countByCategory[rc.categoryId] ?? 0) + 1;
      }

      const totalTagged = Object.values(countByCategory).reduce((a, b) => a + b, 0);

      for (const [categoryId, count] of Object.entries(countByCategory)) {
        const score = totalReviews > 0 ? (count / totalReviews) * 10 : 0;
        const percentage = totalTagged > 0 ? (count / totalTagged) * 100 : 0;

        await prisma.categoryScore.upsert({
          where: { contentId_categoryId: { contentId, categoryId } },
          update: { score, count, percentage },
          create: { contentId, categoryId, score, count, percentage },
        });
      }

      console.log(`  Recalculated scores for content ${contentId}`);
    }
  }

  // Final summary
  const finalCategories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  console.log(`\nMigration complete. Final category list (${finalCategories.length}):`);
  finalCategories.forEach((c, i) => console.log(`  ${i + 1}. ${c.name}`));
}

main()
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
