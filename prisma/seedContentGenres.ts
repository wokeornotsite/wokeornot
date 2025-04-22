import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY is not set in environment variables');
}

async function fetchGenresForContent(tmdbId: number, type: 'movie' | 'tv') {
  const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Failed to fetch genres for ${type} ${tmdbId}`);
    return [];
  }
  const data = await res.json();
  return data.genres as { id: number; name: string }[];
}

async function main() {
  const contents = await prisma.content.findMany();
  const genres = await prisma.genre.findMany();
  const genreNameToId: Record<string, string> = {};
  for (const genre of genres) {
    genreNameToId[genre.name] = genre.id;
  }

  for (const content of contents) {
    const type = content.contentType === 'TV_SHOW' ? 'tv' : 'movie';
    const tmdbId = content.tmdbId;
    if (!tmdbId) continue;
    const tmdbGenres = await fetchGenresForContent(tmdbId, type);
    for (const tmdbGenre of tmdbGenres) {
      const genreId = genreNameToId[tmdbGenre.name];
      if (!genreId) {
        console.warn(`Genre not found in DB for TMDb genre: ${tmdbGenre.name}`);
        continue;
      }
      // Upsert ContentGenre association
      await prisma.contentGenre.upsert({
        where: {
          contentId_genreId: {
            contentId: content.id,
            genreId,
          },
        },
        update: {},
        create: {
          contentId: content.id,
          genreId,
        },
      });
      console.log(`Linked content ${content.title} to genre ${tmdbGenre.name}`);
    }
  }
}

main()
  .then(() => {
    console.log('Content-genre associations seeded successfully!');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
