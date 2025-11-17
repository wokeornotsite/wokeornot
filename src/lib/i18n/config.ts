/**
 * Internationalization (i18n) Configuration
 * 
 * To enable i18n:
 * 1. npm install next-intl
 * 2. Uncomment the configuration below
 * 3. Follow setup steps in docs/I18N_SETUP.md
 */

export const locales = ['en', 'es', 'fr', 'de'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
};

// Placeholder function until next-intl is installed
export function getTranslation(locale: Locale) {
  return {
    t: (key: string) => key,
  };
}
