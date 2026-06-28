import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { LanguageProvider } from '@/hooks/use-language';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MM-BusTicket Pro - Online Bus Ticket Booking',
  description: 'Book bus tickets online with MM-BusTicket Pro. Real-time seat selection, multiple operators, and secure payments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-white`}>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
