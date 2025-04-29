// Plausible Analytics integration (privacy-friendly, can swap for GA if preferred)
'use client';
import Script from 'next/script';

export default function Analytics() {
  return (
    <>
      <Script
        strategy="afterInteractive"
        data-domain="wokeornot.com"
        src="https://plausible.io/js/plausible.js"
      />
    </>
  );
}
