import type { Metadata, Viewport } from 'next'
import './globals.css'
import './inline-styles.css'
import PageTransition from '@/components/PageTransition'

export const metadata: Metadata = {
  title: 'OGMJ BRANDS — Luxury Business OS',
  description: 'Premium global business operating system for brand launches, AI automation, CRM, and enterprise growth.',
  metadataBase: new URL('https://ogmj-brands.com'),
  openGraph: {
    title: 'OGMJ BRANDS — Luxury Business OS',
    description: 'Premium global business operating system for brand launches, AI automation, CRM, and enterprise growth.',
    type: 'website',
    url: 'https://ogmj-brands.com',
    images: [
      {
        url: 'https://ogmj-brands.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OGMJ BRANDS Luxury Business OS',
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#04060A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@14..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#04060A] text-white">
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  )
}

