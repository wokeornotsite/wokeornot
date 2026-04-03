import Image from 'next/image';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface CastCarouselProps {
  cast: CastMember[];
}

export function CastCarousel({ cast }: CastCarouselProps) {
  if (!cast || cast.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-blue-200 mb-3">Top Cast</h3>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
        {cast.map((member) => (
          <div
            key={member.id}
            className="flex-shrink-0 flex flex-col items-center gap-2 bg-[#1e2340] border border-white/10 rounded-xl p-3 w-28 shadow"
          >
            {member.profile_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                alt={member.name}
                width={50}
                height={50}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                unoptimized
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center border-2 border-white/20 text-white font-bold text-lg select-none">
                {member.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-bold text-white text-center leading-tight line-clamp-2">
              {member.name}
            </span>
            <span className="text-xs text-gray-400 text-center leading-tight line-clamp-2">
              {member.character}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
