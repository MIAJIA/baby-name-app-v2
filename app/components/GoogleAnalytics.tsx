'use client';

import Script from 'next/script';

export default function GoogleAnalytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  if (!GA_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');

          // Track message engagement
          function trackMessage(message, type, version) {
            console.log('trackMessage', message, type, version);
            gtag('event', 'message_engagement', {
              'event_category': 'engagement',
              'event_label': type,
              'value': message.length,
              'message_type': type,
              'app_version': version || 'unknown'
            });
          }

          // Track quick reply selection
          function trackQuickReply(selectedReply, version) {
            console.log('trackQuickReply', selectedReply, version);
            gtag('event', 'quick_reply_selection', {
              'event_category': 'engagement',
              'event_label': selectedReply,
              'value': 1,
              'app_version': version || 'unknown'
            });
          }

          // Make functions available globally
          window.trackMessage = trackMessage;
          window.trackQuickReply = trackQuickReply;
        `}
      </Script>
    </>
  );
} 