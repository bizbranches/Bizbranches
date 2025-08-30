import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface CategoryFooterProps {
  categorySlug: string
  categoryName: string
  categoryIcon: string
}

const categoryFooterData: Record<
  string,
  {
    bgColor: string
    accentColor: string
    title: string
    description: string
    stats: { label: string; value: string }[]
    tips: string[]
    relatedServices: string[]
  }
> = {
  restaurants: {
    bgColor: "bg-orange-50 dark:bg-orange-950",
    accentColor: "text-orange-600",
    title: "Pakistan's Food & Dining Hub",
    description:
      "Discover the best restaurants, cafes, and food experiences across Pakistan. From traditional Pakistani cuisine to international flavors.",
    stats: [
      { label: "Active Restaurants", value: "2,500+" },
      { label: "Cities Covered", value: "50+" },
      { label: "Cuisines Available", value: "25+" },
      { label: "Average Rating", value: "4.2★" },
    ],
    tips: [
      "Check restaurant hours before visiting",
      "Read recent reviews for current quality",
      "Many restaurants offer home delivery",
      "Try local specialties for authentic experience",
    ],
    relatedServices: ["Food Delivery", "Catering Services", "Event Venues", "Bakeries"],
  },
  hospitals: {
    bgColor: "bg-blue-50 dark:bg-blue-950",
    accentColor: "text-blue-600",
    title: "Healthcare Services Directory",
    description:
      "Find trusted hospitals, clinics, and healthcare providers across Pakistan. Quality medical care when you need it most.",
    stats: [
      { label: "Healthcare Facilities", value: "1,200+" },
      { label: "Specialized Clinics", value: "800+" },
      { label: "Emergency Services", value: "24/7" },
      { label: "Cities Served", value: "45+" },
    ],
    tips: [
      "Call ahead to confirm doctor availability",
      "Keep insurance information ready",
      "Emergency services available 24/7",
      "Check facility specializations before visiting",
    ],
    relatedServices: ["Pharmacies", "Diagnostic Centers", "Ambulance Services", "Medical Equipment"],
  },
  schools: {
    bgColor: "bg-green-50 dark:bg-green-950",
    accentColor: "text-green-600",
    title: "Education & Learning Centers",
    description:
      "Explore schools, colleges, and educational institutions across Pakistan. Building the future through quality education.",
    stats: [
      { label: "Educational Institutions", value: "3,000+" },
      { label: "Students Enrolled", value: "500K+" },
      { label: "Qualified Teachers", value: "25K+" },
      { label: "Success Rate", value: "85%" },
    ],
    tips: [
      "Visit schools during admission periods",
      "Check accreditation and certifications",
      "Inquire about extracurricular activities",
      "Compare fee structures and facilities",
    ],
    relatedServices: ["Tutoring Centers", "Libraries", "Sports Facilities", "Transportation"],
  },
  technology: {
    bgColor: "bg-purple-50 dark:bg-purple-950",
    accentColor: "text-purple-600",
    title: "Tech & IT Solutions Hub",
    description:
      "Connect with leading technology companies, IT services, and digital solution providers across Pakistan.",
    stats: [
      { label: "Tech Companies", value: "800+" },
      { label: "IT Professionals", value: "15K+" },
      { label: "Projects Completed", value: "10K+" },
      { label: "Client Satisfaction", value: "92%" },
    ],
    tips: [
      "Check portfolio and previous work",
      "Discuss project timelines upfront",
      "Ensure post-delivery support",
      "Compare pricing and service packages",
    ],
    relatedServices: ["Web Development", "Mobile Apps", "Digital Marketing", "Cloud Services"],
  },
  shopping: {
    bgColor: "bg-pink-50 dark:bg-pink-950",
    accentColor: "text-pink-600",
    title: "Shopping & Retail Directory",
    description: "Discover the best shopping destinations, retail stores, and marketplaces across Pakistan.",
    stats: [
      { label: "Retail Stores", value: "5,000+" },
      { label: "Shopping Centers", value: "200+" },
      { label: "Local Markets", value: "150+" },
      { label: "Brands Available", value: "500+" },
    ],
    tips: [
      "Check store hours and holiday schedules",
      "Compare prices across different stores",
      "Look for seasonal sales and discounts",
      "Verify return and exchange policies",
    ],
    relatedServices: ["Online Shopping", "Home Delivery", "Gift Wrapping", "Customer Support"],
  },
  automotive: {
    bgColor: "bg-red-50 dark:bg-red-950",
    accentColor: "text-red-600",
    title: "Automotive Services Hub",
    description: "Find trusted automotive services, car dealers, and vehicle maintenance providers across Pakistan.",
    stats: [
      { label: "Service Centers", value: "1,500+" },
      { label: "Car Dealers", value: "300+" },
      { label: "Certified Mechanics", value: "5K+" },
      { label: "Customer Rating", value: "4.1★" },
    ],
    tips: [
      "Get quotes from multiple service providers",
      "Check mechanic certifications",
      "Ask for warranty on repairs",
      "Regular maintenance saves money",
    ],
    relatedServices: ["Insurance", "Spare Parts", "Car Wash", "Towing Services"],
  },
}

export function CategoryFooter({ categorySlug, categoryName, categoryIcon }: CategoryFooterProps) {
  const footerData = categoryFooterData[categorySlug] || {
    bgColor: "bg-gray-50 dark:bg-gray-950",
    accentColor: "text-gray-600",
    title: `${categoryName} Directory`,
    description: `Find the best ${categoryName.toLowerCase()} services across Pakistan.`,
    stats: [
      { label: "Total Businesses", value: "1,000+" },
      { label: "Cities Covered", value: "30+" },
      { label: "Customer Reviews", value: "50K+" },
      { label: "Average Rating", value: "4.0★" },
    ],
    tips: [
      "Read reviews before making decisions",
      "Compare services and pricing",
      "Check business hours and availability",
      "Contact directly for best rates",
    ],
    relatedServices: ["Consultation", "Support Services", "Maintenance", "Customer Care"],
  }

  return (
    <footer className={`${footerData.bgColor} border-t-4 border-primary`}>
      <div className="container mx-auto px-4 py-12">
        {/* Category Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <span className="text-6xl mr-4">{categoryIcon}</span>
            <div>
              <h2 className={`text-3xl font-bold ${footerData.accentColor} mb-2`}>{footerData.title}</h2>
              <p className="text-muted-foreground max-w-2xl">{footerData.description}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {footerData.stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className={`text-2xl font-bold ${footerData.accentColor} mb-2`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tips and Services */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Tips */}
          <Card>
            <CardContent className="p-6">
              <h3 className={`text-xl font-semibold ${footerData.accentColor} mb-4`}>💡 Helpful Tips</h3>
              <ul className="space-y-2">
                {footerData.tips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-sm text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Related Services */}
          <Card>
            <CardContent className="p-6">
              <h3 className={`text-xl font-semibold ${footerData.accentColor} mb-4`}>🔗 Related Services</h3>
              <div className="grid grid-cols-2 gap-2">
                {footerData.relatedServices.map((service, index) => (
                  <Button key={index} variant="outline" size="sm" className="justify-start bg-transparent">
                    {service}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Links */}
        <div className="border-t pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/" className="block text-sm text-muted-foreground hover:text-primary">
                  Home
                </Link>
                <Link href="/search" className="block text-sm text-muted-foreground hover:text-primary">
                  Search All Businesses
                </Link>
                <Link href="/add" className="block text-sm text-muted-foreground hover:text-primary">
                  Add Your Business
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <div className="space-y-2">
                <Link href="#" className="block text-sm text-muted-foreground hover:text-primary">
                  Help Center
                </Link>
                <Link href="#" className="block text-sm text-muted-foreground hover:text-primary">
                  Contact Us
                </Link>
                <Link href="#" className="block text-sm text-muted-foreground hover:text-primary">
                  Report Issue
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Connect</h4>
              <div className="space-y-2">
                <Link href="#" className="block text-sm text-muted-foreground hover:text-primary">
                  Facebook
                </Link>
                <Link href="#" className="block text-sm text-muted-foreground hover:text-primary">
                  Twitter
                </Link>
                <Link href="#" className="block text-sm text-muted-foreground hover:text-primary">
                  LinkedIn
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-8 pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              © 2024 Cition Business Directory. Connecting Pakistan's businesses with customers.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
