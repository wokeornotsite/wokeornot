import Image from 'next/image';

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
}

function ProviderGroup({ label, items }: { label: string; items: ProviderItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400 font-semibold w-12 shrink-0">{label}</span>
      {items.map((provider, index) => (
        <div key={provider.provider_id ?? index} className="relative group" title={provider.provider_name}>
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
      ))}
    </div>
  );
}

export function WatchProviders({ providers }: WatchProvidersProps) {
  const hasAny =
    (providers.flatrate && providers.flatrate.length > 0) ||
    (providers.rent && providers.rent.length > 0) ||
    (providers.buy && providers.buy.length > 0);

  if (!hasAny) return null;

  return (
    <div className="mt-4 bg-[#1e2340] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
      <h4 className="text-xs font-bold text-blue-300 tracking-wide uppercase mb-1">Where to Watch</h4>
      <ProviderGroup label="Stream:" items={providers.flatrate || []} />
      <ProviderGroup label="Rent:" items={providers.rent || []} />
      <ProviderGroup label="Buy:" items={providers.buy || []} />
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
        .
      </p>
    </div>
  );
}
