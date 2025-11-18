/**
 * Language Switcher Component (Example)
 * 
 * To activate:
 * 1. Install next-intl
 * 2. Set up middleware and i18n config
 * 3. Uncomment the code below
 * 4. Add to Navbar component
 */

/*
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n/config';

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    // Remove current locale from pathname
    const segments = pathname.split('/').filter(Boolean);
    if (locales.includes(segments[0] as Locale)) {
      segments.shift();
    }
    
    // Add new locale if not default
    const newPath = newLocale === 'en' 
      ? `/${segments.join('/')}`
      : `/${newLocale}/${segments.join('/')}`;
    
    router.push(newPath);
  };

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value as Locale)}
        className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
        aria-label="Select language"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc} className="bg-gray-900 text-white">
            {localeFlags[loc]} {localeNames[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}
*/

// Placeholder component
export function LanguageSwitcher() {
  return null;
}
