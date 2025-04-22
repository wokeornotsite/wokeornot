import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY is not set in environment variables');
}

async function fetchGenres(type: 'movie' | 'tv') {
  const url = `https://api.themoviedb.org/3/genre/${type}/list?api_key=${TMDB_API_KEY}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${type} genres`);
  const data = await res.json();
  return data.genres as { id: number; name: string }[];
}

async function main() {
  const movieGenres = await fetchGenres('movie');
  const tvGenres = await fetchGenres('tv');
  // Merge and dedupe by name
  const all = [...movieGenres, ...tvGenres];
  const unique = Array.from(new Map(all.map(g => [g.name, g])).values());

  for (const genre of unique) {
    await prisma.genre.upsert({
      where: { name: genre.name },
      update: {},
      create: { name: genre.name },
    });
    console.log(`Upserted genre: ${genre.name}`);
  }
}

main()
  .then(() => {
    console.log('Genres seeded successfully!');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
