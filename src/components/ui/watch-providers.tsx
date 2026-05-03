import Image from 'next/image';
import { getProviderUrl } from '@/lib/affiliate-links';

interface ProviderItem {
  provider_id?: number;
  provider_name: string;
  logo_path: string;
}

interface WatchProvidersProps {
  providers: {
    flatrate?: ProviderItem[];
    rent?: ProviderItem[];
    buy?: ProviderItem[];
  };
  title: string;
  year?: string;
}

function ProviderLogo({
  provider,
  title,
  year,
}: {
  provider: ProviderItem;
  title: string;
  year?: string;
}) {
  const url = provider.provider_id != null
    ? getProviderUrl(provider.provider_id, title, year)
    : null;

  const img = (
    <div className="relative group" title={provider.provider_name}>
      <Image
        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
        alt={provider.provider_name}
        width={30}
        height={30}
        className="w-8 h-8 rounded-lg object-cover border border-white/10 shadow"
        unoptimized
      />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 rounded bg-black/80 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {provider.provider_name}
      </span>
    </div>
  );

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer sponsored">
        {img}
      </a>
    );
  }
  return img;
}

function ProviderGroup({
  label,
  items,
  title,
  year,
}: {
  label: string;
  items: ProviderItem[];
  title: string;
  year?: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400 font-semibold w-12 shrink-0">{label}</span>
      {items.map((provider, index) => (
        <ProviderLogo
          key={provider.provider_id ?? index}
          provider={provider}
          title={title}
          year={year}
        />
      ))}
    </div>
  );
}

export function WatchProviders({ providers, title, year }: WatchProvidersProps) {
  const hasAny =
    (providers.flatrate && providers.flatrate.length > 0) ||
    (providers.rent && providers.rent.length > 0) ||
    (providers.buy && providers.buy.length > 0);

  if (!hasAny) return null;

  return (
    <div className="mt-4 bg-[#1e2340] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
      <h4 className="text-xs font-bold text-blue-300 tracking-wide uppercase mb-1">Where to Watch</h4>
      <ProviderGroup label="Stream:" items={providers.flatrate || []} title={title} year={year} />
      <ProviderGroup label="Rent:" items={providers.rent || []} title={title} year={year} />
      <ProviderGroup label="Buy:" items={providers.buy || []} title={title} year={year} />
      <p className="text-xs text-gray-500 mt-1">
        Streaming data provided by{' '}
        <a
          href="https://www.justwatch.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-400 transition-colors"
        >
          JustWatch
        </a>
        . Links may be affiliate links.
      </p>
    </div>
  );
}
