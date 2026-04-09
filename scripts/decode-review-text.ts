/**
 * One-time migration: decode HTML entities from text fields that were incorrectly
 * encoded by sanitizeHTML() before being stored as plain text in MongoDB.
 *
 * Usage:
 *   Dry run (default, no DB changes):
 *     npx ts-node scripts/decode-review-text.ts
 *
 *   Apply changes:
 *     npx ts-node scripts/decode-review-text.ts --apply
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes('--apply');

// Decode HTML entities in the order that prevents double-decoding.
// &amp; must be last: e.g. user typed "&lt;" → stored as "&amp;lt;"
// → we decode &lt; first (no match in "&amp;lt;"), then &amp; → "&lt;" ✓
function decodeEntities(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function needsDecode(text: string): boolean {
  return /&#39;|&quot;|&lt;|&gt;|&amp;/.test(text);
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be written)' : 'APPLY'}\n`);

  let totalScanned = 0;
  let totalUpdated = 0;

  // --- Reviews (text + guestName) ---
  const reviews = await prisma.review.findMany({
    select: { id: true, text: true, guestName: true },
  });
  totalScanned += reviews.length;
  for (const review of reviews) {
    const updates: Record<string, string> = {};
    if (review.text && needsDecode(review.text)) {
      updates.text = decodeEntities(review.text);
      console.log(`[Review ${review.id}] text: ${JSON.stringify(review.text)} → ${JSON.stringify(updates.text)}`);
    }
    if (review.guestName && needsDecode(review.guestName)) {
      updates.guestName = decodeEntities(review.guestName);
      console.log(`[Review ${review.id}] guestName: ${JSON.stringify(review.guestName)} → ${JSON.stringify(updates.guestName)}`);
    }
    if (Object.keys(updates).length > 0) {
      totalUpdated++;
      if (!DRY_RUN) {
        await prisma.review.update({ where: { id: review.id }, data: updates });
      }
    }
  }

  // --- Comments ---
  const comments = await prisma.comment.findMany({
    select: { id: true, text: true },
  });
  totalScanned += comments.length;
  for (const comment of comments) {
    if (comment.text && needsDecode(comment.text)) {
      const decoded = decodeEntities(comment.text);
      console.log(`[Comment ${comment.id}] text: ${JSON.stringify(comment.text)} → ${JSON.stringify(decoded)}`);
      totalUpdated++;
      if (!DRY_RUN) {
        await prisma.comment.update({ where: { id: comment.id }, data: { text: decoded } });
      }
    }
  }

  // --- Users (name) ---
  const users = await prisma.user.findMany({
    select: { id: true, name: true },
  });
  totalScanned += users.length;
  for (const user of users) {
    if (user.name && needsDecode(user.name)) {
      const decoded = decodeEntities(user.name);
      console.log(`[User ${user.id}] name: ${JSON.stringify(user.name)} → ${JSON.stringify(decoded)}`);
      totalUpdated++;
      if (!DRY_RUN) {
        await prisma.user.update({ where: { id: user.id }, data: { name: decoded } });
      }
    }
  }

  // --- ForumThreads (title + content) ---
  const threads = await prisma.forumThread.findMany({
    select: { id: true, title: true, content: true },
  });
  totalScanned += threads.length;
  for (const thread of threads) {
    const updates: Record<string, string> = {};
    if (thread.title && needsDecode(thread.title)) {
      updates.title = decodeEntities(thread.title);
      console.log(`[ForumThread ${thread.id}] title: ${JSON.stringify(thread.title)} → ${JSON.stringify(updates.title)}`);
    }
    if (thread.content && needsDecode(thread.content)) {
      updates.content = decodeEntities(thread.content);
      console.log(`[ForumThread ${thread.id}] content: ${JSON.stringify(thread.content)} → ${JSON.stringify(updates.content)}`);
    }
    if (Object.keys(updates).length > 0) {
      totalUpdated++;
      if (!DRY_RUN) {
        await prisma.forumThread.update({ where: { id: thread.id }, data: updates });
      }
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Records scanned: ${totalScanned}`);
  console.log(`Records ${DRY_RUN ? 'that would be updated' : 'updated'}: ${totalUpdated}`);
  if (DRY_RUN && totalUpdated > 0) {
    console.log(`\nRun with --apply to write these changes to the database.`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
