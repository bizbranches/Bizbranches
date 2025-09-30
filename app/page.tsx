"use client"

import { CategoriesSection } from "@/components/categories-section"
import { TopListingsSection } from "@/components/top-listings-section"
import { TopCitiesSection } from "@/components/top-cities-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { FAQSection } from "@/components/faq-section"
import { HeroSection } from "@/components/hero-section"
import { useEffect } from "react"

export default function HomePage() {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {}
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Ad below header */}
      <div className="w-full px-4 py-4">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-4083132987699578"
          data-ad-slot="3877186043"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
      
      <main>
        <HeroSection />
        <TopListingsSection />
        
        {/* Ad before category section */}
        <div className="w-full px-4 py-4">
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-4083132987699578"
            data-ad-slot="3877186043"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
        
        <CategoriesSection />
        <TopCitiesSection />
        <HowItWorksSection />
        <FAQSection />
      </main>
      
      {/* Ad above footer */}
      <div className="w-full px-4 py-4">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-4083132987699578"
          data-ad-slot="3877186043"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  )
}
