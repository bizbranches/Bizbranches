import { HeroSection } from "@/components/hero-section"
import { CategoriesSection } from "@/components/categories-section"
import { TopListingsSection } from "@/components/top-listings-section"
import { TopCitiesSection } from "@/components/top-cities-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { FAQSection } from "@/components/faq-section"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <HeroSection />
        <TopListingsSection />
        <CategoriesSection />
        <TopCitiesSection />
        <HowItWorksSection />
        <FAQSection />
      </main>
    </div>
  )
}
