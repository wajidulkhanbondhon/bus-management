'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';
import { useApp } from '@/lib/context';

export function AnalyticsProvider() {
  const { marketingIntegrations } = useApp();
  const { gaId, pixelId, gtmId, customGaHtml, customPixelHtml, customGtmHtml } = marketingIntegrations;

  useEffect(() => {
    // Inject Custom GA HTML Script
    if (customGaHtml) {
      try {
        const range = document.createRange();
        const fragment = range.createContextualFragment(customGaHtml);
        document.head.appendChild(fragment);
      } catch (e) {
        console.error('Error injecting Custom GA script:', e);
      }
    }
    
    // Inject Custom Pixel HTML Script
    if (customPixelHtml) {
      try {
        const range = document.createRange();
        const fragment = range.createContextualFragment(customPixelHtml);
        document.head.appendChild(fragment);
      } catch (e) {
        console.error('Error injecting Custom Pixel script:', e);
      }
    }

    // Inject Custom GTM HTML Script
    if (customGtmHtml) {
      try {
        const range = document.createRange();
        const fragment = range.createContextualFragment(customGtmHtml);
        document.head.appendChild(fragment);
      } catch (e) {
        console.error('Error injecting Custom GTM script:', e);
      }
    }
  }, [customGaHtml, customPixelHtml, customGtmHtml]);

  return (
    <>
      {/* Google Tag Manager */}
      {gtmId && (
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}
        </Script>
      )}

      {/* Google Analytics */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      )}

      {/* Meta (Facebook) Pixel */}
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
