// Google Analytics (GA4) integration
'use client';
import Script from 'next/script';

export default function Analytics() {
  return (
    <>
      {/* Replace G-XXXXXXXXXX with your real Measurement ID */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-C1RWGTWZ61"
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-C1RWGTWZ61');
        `}
      </Script>
    </>
  );
}
