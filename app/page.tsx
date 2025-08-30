import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { CategoriesSection } from "@/components/categories-section"
import { TopListingsSection } from "@/components/top-listings-section"
import { TopCitiesSection } from "@/components/top-cities-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { FAQSection } from "@/components/faq-section"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <TopListingsSection />
        <CategoriesSection />
        <TopCitiesSection />
        <HowItWorksSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
