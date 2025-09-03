import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { GlobalTopbar } from '@/components/global-topbar'
import GlobalContainer from '@/components/global-container'
import { GlobalBackButton } from '@/components/global-back-button'

export const metadata: Metadata = {
  title: 'BizBranches',
  description: 'BizBranches - Discover and list businesses across Pakistan',
  // generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Header />
        <GlobalBackButton />
        <GlobalTopbar />
        <GlobalContainer>
          {children}
        </GlobalContainer>
        <Footer />
      </body>
    </html>
  )
}
