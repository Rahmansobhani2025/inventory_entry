import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Inventory Entry',
  description: 'High-speed technical digitization dashboard with real-time video snapshot captures and Gemini AI optical stamp extractions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="bg-[#121212] text-white min-h-screen antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
