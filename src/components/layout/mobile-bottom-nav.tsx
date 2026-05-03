'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Tv, Baby, Search } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/movies', label: 'Movies', Icon: Film },
  { href: '/tv-shows', label: 'TV', Icon: Tv },
  { href: '/kids', label: 'Kids', Icon: Baby },
  { href: '/search', label: 'Search', Icon: Search },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f1a]/95 backdrop-blur-xl border-t border-white/10 pb-safe"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around h-16">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors duration-150 min-w-0
                ${active
                  ? 'text-violet-400'
                  : 'text-gray-500 hover:text-gray-300 active:text-violet-400'
                }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={`h-5 w-5 transition-transform duration-150 ${active ? 'scale-110' : ''}`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-violet-400' : ''}`}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-violet-400 rounded-full" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
