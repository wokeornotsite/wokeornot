const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG;

// Deep-link builders keyed by TMDB provider_id.
// Non-Amazon links go to each platform's search page directly.
// When affiliate tokens for other networks are added as env vars, update here.
const PROVIDER_LINKS: Record<number, (title: string, year?: string) => string> = {
  // Netflix
  8: (t) => `https://www.netflix.com/search?q=${encodeURIComponent(t)}`,
  // Amazon Prime Video
  9: (t, y) => {
    const q = encodeURIComponent(y ? `${t} ${y}` : t);
    return `https://www.amazon.com/s?k=${q}&i=instant-video${AMAZON_TAG ? `&tag=${AMAZON_TAG}` : ''}`;
  },
  // Disney+
  337: (t) => `https://www.disneyplus.com/search/${encodeURIComponent(t)}`,
  // Apple TV+
  350: (t) => `https://tv.apple.com/search?term=${encodeURIComponent(t)}`,
  // Apple iTunes (buy/rent)
  2: (t) => `https://tv.apple.com/search?term=${encodeURIComponent(t)}`,
  // Hulu
  15: (t) => `https://www.hulu.com/search?q=${encodeURIComponent(t)}`,
  // Max
  384: (t) => `https://www.max.com/search/${encodeURIComponent(t)}`,
  // Paramount+
  531: (t) => `https://www.paramountplus.com/search/?q=${encodeURIComponent(t)}`,
  // Peacock
  386: (t) => `https://www.peacocktv.com/search?q=${encodeURIComponent(t)}`,
  // Tubi
  73: (t) => `https://tubitv.com/search/${encodeURIComponent(t)}`,
  // Fandango at Home (Vudu)
  7: (t) => `https://www.vudu.com/content/movies/search?searchString=${encodeURIComponent(t)}`,
  // Google Play Movies
  3: (t) => `https://play.google.com/store/search?q=${encodeURIComponent(t)}&c=movies`,
  // YouTube Premium
  188: (t) => `https://www.youtube.com/results?search_query=${encodeURIComponent(t)}`,
  // Pluto TV
  300: (t) => `https://pluto.tv/search?q=${encodeURIComponent(t)}`,
};

export function getProviderUrl(providerId: number, title: string, year?: string): string | null {
  const builder = PROVIDER_LINKS[providerId];
  return builder ? builder(title, year) : null;
}
