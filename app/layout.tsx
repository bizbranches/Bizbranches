import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { GlobalTopbar } from '@/components/global-topbar'
import GlobalContainer from '@/components/global-container'
import { Suspense } from 'react'
import RouteLoaderOverlay from "@/components/route-loader-overlay"
import RouteNavigationController from "@/components/route-navigation-controller"
import Script from 'next/script'

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
      {/* Google AdSense: load once globally */}
      <Script
        id="adsbygoogle-init"
        async
        strategy="afterInteractive"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4083132987699578"
        crossOrigin="anonymous"
      />
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* Global route loader overlay and controller */}
        <RouteLoaderOverlay />
        <Suspense fallback={null}>
          <RouteNavigationController />
        </Suspense>
        <Header />
        <Suspense fallback={null}>
          <GlobalTopbar />
        </Suspense>
        <GlobalContainer>
          {children}
        </GlobalContainer>
        <Footer />
      </body>
    </html>
  )
}
