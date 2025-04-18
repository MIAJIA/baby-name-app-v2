import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ZCOOL_KuaiLe } from 'next/font/google';
import GoogleAnalytics from './components/GoogleAnalytics';

const zcoolKuaiLe = ZCOOL_KuaiLe({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Callme-本名',
  description: ' — 如果只说一个词，你想别人怎么记住你？More than a name. A line we leave behind.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" className="h-full">
      <body className={`${zcoolKuaiLe.className} h-full`} suppressHydrationWarning>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}