import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './inline-styles.css'
import PageTransition from '@/components/PageTransition'

const inter = Inter({ subsets: ['latin'] })

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
  themeColor: '#04060A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#04060A] text-white`}>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  )
}

