import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Zozotech POS Resto',
  description: 'POS & kasir restoran yang siap jalan di Vercel + Turso'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className={cn('min-h-screen bg-background font-sans antialiased', inter.className)}>
        {children}
      </body>
    </html>
  );
}
