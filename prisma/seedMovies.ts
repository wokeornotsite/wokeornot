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

async function main() {
  let movies: any[] = [];
  // Fetch first 3 pages (60 movies)
  for (let page = 1; page <= 3; page++) {
    const pageMovies = await fetchPopularMovies(page);
    movies = movies.concat(pageMovies);
  }

  for (const movie of movies) {
    // Upsert by tmdbId
    await prisma.content.upsert({
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
