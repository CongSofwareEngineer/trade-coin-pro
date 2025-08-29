import type { Metadata, Viewport } from 'next'

import './globals.css'
import { META_DATA_APP } from '@/configs/app'

export const metadata: Metadata = {
  metadataBase: new URL(META_DATA_APP.url),
  title: META_DATA_APP.title,
  description: META_DATA_APP.des,
  icons: {
    icon: META_DATA_APP.icon,
    shortcut: META_DATA_APP.icon,
    apple: META_DATA_APP.icon,
  },
  applicationName: META_DATA_APP.title,
  openGraph: {
    title: META_DATA_APP.title,
    description: META_DATA_APP.des,
    images: META_DATA_APP.image,
  },
  twitter: {
    card: 'summary_large_image',
    title: META_DATA_APP.title,
    description: META_DATA_APP.des,
    images: META_DATA_APP.image,
  },

  keywords: ['nft', 'view nft', 'list nft', 'NFT'],
  bookmarks: META_DATA_APP.url,
  category: 'Web3',
}

export const viewport: Viewport = {
  themeColor: 'white',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light',
  userScalable: false,
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className={`antialiased`}>
        <main>{children}</main>
      </body>
    </html>
  )
}
