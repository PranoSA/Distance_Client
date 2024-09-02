import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Head from 'next/head';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Maps App',
  description: 'Welcome to Map Apps!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <title>Maps App </title>
        <meta name="description" content={metadata.description || ''} />
        <link rel="shortcut icon" href="/maps.svg" />
        {/* IcoMoon */}
        <link rel="icon" href="maps.svg" />
      </Head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
