import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { GlobalTopbar } from "@/components/global-topbar";
import GlobalContainer from "@/components/global-container";
import { Suspense } from "react";
import Script from "next/script";

export const metadata: Metadata = {
  title: "BizBranches",
  description: "BizBranches - Discover and list businesses across Pakistan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Google Analytics 4 (GA4) */}
        <Script
          id="ga4-script"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-53ZYC74P6Q"
        />
        <Script id="ga4-inline" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-53ZYC74P6Q');
         `}
        </Script>

        {/* ✅ Google AdSense: load once globally */}
        <Script
          id="adsbygoogle-init"
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4083132987699578"
          crossOrigin="anonymous"
        />
      </head>

      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Header />
        <Suspense fallback={null}>
          <GlobalTopbar />
        </Suspense>
        <GlobalContainer>{children}</GlobalContainer>
        <Footer />
      </body>
    </html>
  );
}
