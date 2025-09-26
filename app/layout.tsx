import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { GlobalTopbar } from '@/components/global-topbar'
import GlobalContainer from '@/components/global-container'

export const metadata: Metadata = {
  title: 'BizBranches',
  description: 'BizBranches - Discover and list businesses across Pakistan',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="_3hQRO7vbjKeReRG8goNUOrswAH0TPyjkEOg8ddoEgE" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Header />
        <GlobalTopbar />
        <GlobalContainer>
          {children}
        </GlobalContainer>
        <Footer />
      </body>
    </html>
  )
}
