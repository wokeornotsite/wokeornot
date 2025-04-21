# WokeOrNot

WokeOrNot is a modern web app for rating the "wokeness" of movies, TV shows, and kids content. Users can register, log in, leave reviews, participate in discussions, and join a community-driven forum.

## Features
- User authentication (NextAuth, Google OAuth, email/password)
- Movies, TV Shows, Kids content sections (data from TMDb)
- Wokeness score visualization
- User reviews and comments
- Community forum (threads and discussion)
- User profile with review/comment history
- Modern UI with Tailwind CSS

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up your environment variables
Create a `.env` file in the project root with the following:

```env
DATABASE_URL="file:./dev.db" # or your preferred database connection string
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
TMDB_API_KEY=your_tmdb_api_key
```

- Get a TMDb API key at https://www.themoviedb.org/settings/api
- Set up Google OAuth credentials at https://console.developers.google.com/

### 3. Set up the database
```bash
npx prisma migrate dev --name init
```

### 4. Run the development server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

### 5. Build for production
```bash
npm run build
npm start
```

## Main Scripts
- `npm run dev` — Start the dev server
- `npm run build` — Build for production
- `npm start` — Start production server
- `npx prisma studio` — Visual DB browser

## Tech Stack
- Next.js (App Router)
- Prisma ORM
- NextAuth.js
- Tailwind CSS
- TMDb API
- React Hook Form, Zod, Axios

## Environment Variables
- `DATABASE_URL` — Prisma DB connection string
- `NEXTAUTH_SECRET` — NextAuth session secret
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `TMDB_API_KEY` — TMDb API access

## License
MIT

---

For questions or support, open an issue or contact the project maintainer.
