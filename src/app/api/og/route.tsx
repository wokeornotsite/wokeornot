import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Inline score-color logic (mirrors wokeness-utils.ts, safe for edge)
function getScoreColor(score: number): { bg: string; label: string } {
  if (score <= 0) return { bg: '#4b5563', label: 'Not Rated' };
  if (score <= 3) return { bg: '#10b981', label: 'Not Woke' };
  if (score <= 6) return { bg: '#f59e0b', label: 'Moderately Woke' };
  return { bg: '#ef4444', label: 'Very Woke' };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') ?? 'Untitled';
  const rawScore = searchParams.get('score');
  const score = rawScore !== null ? parseFloat(rawScore) : 0;
  const type = searchParams.get('type') ?? 'movie';

  const { bg: scoreBg, label: scoreLabel } = getScoreColor(score);
  const typeLabel =
    type === 'tv' ? 'TV Show' : type === 'kids' ? 'Kids Content' : 'Movie';

  const displayScore = score > 0 ? score.toFixed(1) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a30 40%, #232946 100%)',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Decorative background circles */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          }}
        />

        {/* WokeOrNot logo/branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '800',
              color: '#ffffff',
            }}
          >
            W
          </div>
          <span
            style={{
              fontSize: '28px',
              fontWeight: '700',
              background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitBackgroundClip: 'text',
            }}
          >
            WokeOrNot
          </span>
          <span
            style={{
              fontSize: '14px',
              color: '#9ca3af',
              marginLeft: '4px',
              padding: '2px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            {typeLabel}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 40 ? '44px' : title.length > 25 ? '52px' : '60px',
            fontWeight: '800',
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: '1.2',
            maxWidth: '900px',
            marginBottom: '40px',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}
        >
          {title}
        </div>

        {/* Score badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              background: scoreBg,
              borderRadius: '16px',
              padding: '12px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
            }}
          >
            {displayScore !== null && (
              <span
                style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  color: '#ffffff',
                }}
              >
                {displayScore}
              </span>
            )}
            {displayScore !== null && (
              <span
                style={{
                  fontSize: '18px',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: '400',
                }}
              >
                / 10
              </span>
            )}
            <span
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#ffffff',
                marginLeft: displayScore !== null ? '8px' : '0',
              }}
            >
              {scoreLabel}
            </span>
          </div>
        </div>

        {/* Wokeness bar */}
        {score > 0 && (
          <div
            style={{
              width: '480px',
              height: '10px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.1)',
              marginBottom: '40px',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            <div
              style={{
                width: `${(score / 10) * 100}%`,
                height: '100%',
                borderRadius: '10px',
                background: scoreBg,
              }}
            />
          </div>
        )}

        {/* Tagline */}
        <div
          style={{
            fontSize: '18px',
            color: '#9ca3af',
            textAlign: 'center',
          }}
        >
          Rate content on{' '}
          <span style={{ color: '#ec4899', fontWeight: '600' }}>WokeOrNot.net</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable',
      },
    }
  );
}
