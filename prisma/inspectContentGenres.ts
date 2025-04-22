import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const genres = await prisma.genre.findMany({ take: 5 });
  const contentGenres = await prisma.contentGenre.findMany({ take: 5 });
  const contents = await prisma.content.findMany({ take: 20 });

  console.log('Sample genres:');
  genres.forEach(g => console.log({ id: g.id, name: g.name }));

  console.log('\nSample contentGenres:');
  contentGenres.forEach(cg => console.log({ id: cg.id, contentId: cg.contentId, genreId: cg.genreId }));

  console.log('\nSample contents:');
  contents.forEach(c => console.log({ id: c.id, title: c.title, tmdbId: c.tmdbId, contentType: c.contentType }));
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
