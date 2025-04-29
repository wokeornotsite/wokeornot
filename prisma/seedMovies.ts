import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY is not set in environment variables');
}

async function fetchPopularMovies(page = 1) {
  const url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch popular movies');
  const data = await res.json();
  return data.results as any[];
}

// --- AI SEED USER CONFIGURATION ---
const AI_SEED_EMAIL = 'ai-seed@wokeornot.net';
const AI_SEED_NAME = 'WokeOrNot AI Seed';

async function getOrCreateAISeedUser(prisma: PrismaClient) {
  let user = await prisma.user.findUnique({ where: { email: AI_SEED_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: AI_SEED_EMAIL,
        name: AI_SEED_NAME,
        role: 'USER',
      },
    });
    console.log('Created AI Seed user.');
  } else {
    console.log('AI Seed user already exists.');
  }
  return user;
}

// --- END AI SEED USER CONFIGURATION ---

async function main() {
  let movies: any[] = [];
  // Fetch first 3 pages (60 movies)
  for (let page = 1; page <= 3; page++) {
    const pageMovies = await fetchPopularMovies(page);
    movies = movies.concat(pageMovies);
  }

  const aiSeedUser = await getOrCreateAISeedUser(prisma);

  for (const movie of movies) {
    // Upsert by tmdbId
    const content = await prisma.content.upsert({
      where: { tmdbId: movie.id },
      update: {},
      create: {
        tmdbId: movie.id,
        title: movie.title,
        overview: movie.overview,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        releaseDate: movie.release_date ? new Date(movie.release_date) : null,
        contentType: 'MOVIE',
        wokeScore: 0,
        reviewCount: 0,
      },
    });
    console.log(`Upserted movie: ${movie.title}`);

    // --- AI-GENERATED REVIEW SEEDING ---
    // For deterministic seeding, use a fixed set of comments and rotate them
    const aiComments = [
      "A thought-provoking story with modern themes.",
      "Touches on social issues in a subtle way.",
      "A bold take on current cultural trends.",
      "Balances entertainment and messaging.",
      "Clearly influenced by today's social climate.",
      "Wokeness is present, but not overwhelming.",
      "A fun watch with a progressive twist.",
      "Some moments felt a bit on-the-nose.",
      "Surprisingly nuanced for the genre.",
      "A conversation starter for sure."
    ];
    // Use movie index for deterministic selection
    const comment = aiComments[movies.indexOf(movie) % aiComments.length];
    // Generate a pseudo-random but deterministic rating between 3-9
    const rating = 3 + (movies.indexOf(movie) * 2) % 7;
    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: { userId: aiSeedUser.id, contentId: content.id },
    });
    if (!existingReview) {
      await prisma.review.create({
        data: {
          userId: aiSeedUser.id,
          contentId: content.id,
          rating,
          text: comment,
        },
      });
      console.log(`Seeded AI review for: ${movie.title}`);
    }
    // --- END AI-GENERATED REVIEW SEEDING ---
  }
}

main()
  .then(() => {
    console.log('Movies seeded successfully!');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
