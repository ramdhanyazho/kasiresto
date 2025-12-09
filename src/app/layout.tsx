import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zozotech POS Resto',
  description: 'POS & kasir restoran yang siap jalan di Vercel + Turso'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <div className="layout">
          <header className="header">
            <div className="brand">
              <div className="mark">ZR</div>
              <div>
                <h3>Zozotech POS Resto</h3>
                <p className="muted">Next.js + Turso · Siap dipush ke Vercel</p>
              </div>
            </div>
            <div className="chip">Realtime kasir, dapur, meja & stok</div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
