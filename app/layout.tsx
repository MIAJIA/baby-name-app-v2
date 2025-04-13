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
  title: '宝宝起名助手',
  description: '为你的宝宝找个好听的名字',
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