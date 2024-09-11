import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Head from 'next/head';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Map Projection Viewer ',
  description: 'Welcome to Map Projection Viewer!',
  //open graph stuff
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://maps.compressibleflowcalculator.com',
    siteName: 'Map Projection Viewer',
    title: 'Map Projection Viewer',
    description: 'Welcome to Map Projection Viewer!',
    images: [
      {
        url: 'https://maps.compressibleflowcalculator.com/images/3857.png',
        alt: 'Maps App',
        width: 1200,
        height: 800,
      },
    ],
    videos: [
      {
        url: 'https://maps.compressibleflowcalculator.com/videos/3857.mp4',
        width: 1200,
        height: 800,
      },
    ],
  },
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
