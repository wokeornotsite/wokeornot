#!/usr/bin/env node
/*
 One-time cleanup script to find and optionally delete reviews with malformed or orphaned contentId values.

 Usage:
   node scripts/cleanup-bad-reviews.js --dry-run      # only list
   node scripts/cleanup-bad-reviews.js --delete       # delete identified bad reviews
   node scripts/cleanup-bad-reviews.js --limit 100    # limit processed reviews

 Precautions:
 - Run on a backup or staging first.
 - Use --dry-run to verify counts before deleting.
 - This only deletes reviews whose contentId is NOT a 24-hex string or whose content no longer exists.
*/
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: true, limit: 0 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--delete') opts.dryRun = false;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--limit') {
      const v = parseInt(args[i + 1], 10);
      if (!Number.isNaN(v)) opts.limit = v;
      i++;
    }
  }
  return opts;
}

const objectIdHex = /^[a-f\d]{24}$/i;

async function main() {
  const { dryRun, limit } = parseArgs();
  console.log(`[cleanup-bad-reviews] starting. dryRun=${dryRun} limit=${limit || 'none'}`);

  // Scan reviews in batches
  const batchSize = 1000;
  let skip = 0;
  let total = 0;
  let malformed = [];
  let orphaned = [];

  while (true) {
    const batch = await prisma.review.findMany({
      select: { id: true, contentId: true },
      skip,
      take: batchSize,
      orderBy: { id: 'asc' },
    });
    if (!batch.length) break;
    skip += batch.length;

    const malformedInBatch = batch.filter(r => !r.contentId || !objectIdHex.test(r.contentId));
    malformed.push(...malformedInBatch);

    const validIds = Array.from(new Set(batch.map(r => r.contentId).filter(id => id && objectIdHex.test(id))));
    if (validIds.length) {
      const contents = await prisma.content.findMany({ select: { id: true }, where: { id: { in: validIds } } });
      const existing = new Set(contents.map(c => c.id));
      const orphanedInBatch = batch.filter(r => r.contentId && objectIdHex.test(r.contentId) && !existing.has(r.contentId));
      orphaned.push(...orphanedInBatch);
    }

    total += batch.length;
    if (limit && total >= limit) break;
  }

  // De-duplicate
  const toDeleteMap = new Map();
  for (const r of malformed) toDeleteMap.set(r.id, r);
  for (const r of orphaned) toDeleteMap.set(r.id, r);
  const toDelete = Array.from(toDeleteMap.values());

  console.log(`Scanned reviews: ${total}`);
  console.log(`Malformed contentId: ${malformed.length}`);
  console.log(`Orphaned (missing content): ${orphaned.length}`);
  console.log(`Unique reviews to delete: ${toDelete.length}`);

  if (dryRun || toDelete.length === 0) {
    console.log('Dry-run complete. No deletions performed.');
    await prisma.$disconnect();
    return;
  }

  // Delete in chunks
  const chunkSize = 200;
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += chunkSize) {
    const chunk = toDelete.slice(i, i + chunkSize);
    const ids = chunk.map(r => r.id);
    const res = await prisma.review.deleteMany({ where: { id: { in: ids } } });
    deleted += res.count || 0;
    console.log(`Deleted ${res.count} reviews...`);
  }
  console.log(`Done. Deleted ${deleted} reviews.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
