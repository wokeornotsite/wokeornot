const AFFILIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG;

interface Props {
  title: string;
  year?: string;
}

export function AmazonAffiliateButton({ title, year }: Props) {
  if (!AFFILIATE_TAG) return null;

  const query = encodeURIComponent(year ? `${title} ${year}` : title);
  const href = `https://www.amazon.com/s?k=${query}&i=instant-video&tag=${AFFILIATE_TAG}`;

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="flex items-center justify-center gap-2 w-full bg-[#FF9900] hover:bg-[#e68a00] text-black font-bold text-sm py-2.5 px-4 rounded-lg transition-colors duration-150 shadow-md"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.699-3.182v.685zm3.186 7.705c-.209.189-.512.201-.745.074-1.047-.872-1.234-1.276-1.813-2.106-1.733 1.767-2.96 2.297-5.206 2.297-2.658 0-4.73-1.641-4.73-4.925 0-2.565 1.391-4.309 3.37-5.164 1.715-.754 4.11-.89 5.942-1.098v-.41c0-.753.06-1.642-.383-2.294-.385-.579-1.124-.819-1.776-.819-1.206 0-2.277.618-2.54 1.898-.054.285-.263.566-.549.58l-3.064-.331c-.259-.059-.548-.266-.473-.66C6.11 2.498 9.05.927 11.697.927c1.454 0 3.354.387 4.503 1.485 1.454 1.353 1.315 3.158 1.315 5.123v4.637c0 1.394.579 2.006 1.124 2.758.19.268.232.589-.01.787l-1.485 1.078z"/>
        </svg>
        Find on Amazon
      </a>
    </div>
  );
}
