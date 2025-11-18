# Internationalization (i18n) Setup Guide

i18n infrastructure has been scaffolded but requires activation.

## Overview

The project is prepared for internationalization with:
- **Supported Languages**: English (en), Spanish (es), French (fr), German (de)
- **Library**: next-intl (recommended for Next.js 13+ App Router)
- **Translation Files**: JSON-based message files

## Setup Instructions

### 1. Install next-intl

```bash
npm install next-intl
```

### 2. Update Middleware

Create `src/middleware.ts`:

```typescript
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/lib/i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // Don't prefix default locale
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
```

### 3. Update Root Layout

Modify `src/app/layout.tsx`:

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 4. Create i18n Config File

Create `src/i18n.ts`:

```typescript
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { locales } from '@/lib/i18n/config';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`./lib/i18n/messages/${locale}.json`)).default
  };
});
```

### 5. Add Language Switcher Component

Create `src/components/ui/language-switcher.tsx`:

```typescript
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames, localeFlags } from '@/lib/i18n/config';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  return (
    <select
      value={locale}
      onChange={(e) => switchLocale(e.target.value)}
      className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeFlags[loc]} {localeNames[loc]}
        </option>
      ))}
    </select>
  );
}
```

### 6. Use Translations in Components

```typescript
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');

  return (
    <div>
      <h1>{t('appName')}</h1>
      <button>{t('save')}</button>
    </div>
  );
}
```

## Translation Files Structure

```
src/lib/i18n/messages/
├── en.json  (English - Base language)
├── es.json  (Spanish)
├── fr.json  (French - Needs completion)
└── de.json  (German - Needs completion)
```

### Translation Sections

- **common**: App-wide terms (save, cancel, etc.)
- **nav**: Navigation menu items
- **content**: Content-related terms
- **wokeness**: Wokeness level descriptions
- **search**: Search functionality
- **favorites**: Favorites feature
- **review**: Review forms and actions
- **errors**: Error messages

## Adding New Languages

1. Add locale to `src/lib/i18n/config.ts`:
   ```typescript
   export const locales = ['en', 'es', 'fr', 'de', 'pt'] as const;
   ```

2. Create new message file: `src/lib/i18n/messages/pt.json`

3. Copy structure from `en.json` and translate

4. Add locale name and flag to config:
   ```typescript
   localeNames: { pt: 'Português' }
   localeFlags: { pt: '🇵🇹' }
   ```

## Best Practices

1. **Always use translation keys**: Never hardcode text
2. **Keep keys organized**: Use nested structure (nav.home, common.save)
3. **Use variables**: `t('welcome', { name: userName })`
4. **Handle plurals**: Use next-intl's plural rules
5. **Test all languages**: Ensure UI doesn't break with longer text
6. **RTL support**: Consider right-to-left languages if needed

## Translation Tools

- **DeepL**: High-quality machine translation
- **Google Translate**: Quick translations
- **Professional services**: For marketing content
- **Crowdin/Lokalise**: Translation management platforms

## Current Translation Status

| Language | Status | Completion |
|----------|--------|------------|
| English (en) | ✅ Complete | 100% |
| Spanish (es) | ✅ Complete | 100% |
| French (fr) | ⚠️ Needs completion | 0% |
| German (de) | ⚠️ Needs completion | 0% |

## Testing i18n

1. **Local testing**: Change browser language preferences
2. **URL testing**: Visit `/es/movies`, `/fr/movies`, etc.
3. **Language switcher**: Test component in navbar
4. **Content length**: Ensure UI handles long translations (German, Finnish)
5. **Special characters**: Test accents, umlauts, etc.

## Performance Considerations

- Translations are bundled at build time
- No runtime overhead for translation lookups
- Messages are tree-shakeable
- Only used translations are included in bundle

## SEO with i18n

- Each language gets separate URLs: `/en/movies`, `/es/peliculas`
- Implement `hreflang` tags in metadata
- Create language-specific sitemaps
- Use `localePrefix` strategy for URL structure

## Future Enhancements

1. **Date/Time formatting**: Use `next-intl` formatters
2. **Number formatting**: Currency, percentages, etc.
3. **Dynamic content**: Translate TMDB API data
4. **User preferences**: Remember language choice
5. **Automatic detection**: Browser language detection

## Support

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js i18n Guide](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
