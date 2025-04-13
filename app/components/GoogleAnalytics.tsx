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
          function trackMessage(message, type) {
            gtag('event', 'message_engagement', {
              'event_category': 'engagement',
              'event_label': type,
              'value': message.length,
              'message_type': type
            });
          }

          // Track quick reply selection
          function trackQuickReply(selectedReply) {
            gtag('event', 'quick_reply_selection', {
              'event_category': 'engagement',
              'event_label': selectedReply,
              'value': 1
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