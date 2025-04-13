import './globals.css';
import type { Metadata } from 'next';

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
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
} 