import { Card } from "@/components/ui/card"
import Link from "next/link"

const topCities = [
  {
    name: "Karachi",
    slug: "karachi",
    businesses: 3200,
    image: "/karachi-skyline-with-modern-buildings.png",
  },
  {
    name: "Lahore",
    slug: "lahore",
    businesses: 2800,
    image: "/lahore-historical-architecture-and-modern-city.png",
  },
  {
    name: "Islamabad",
    slug: "islamabad",
    businesses: 1900,
    image: "/islamabad-capital-city-with-mountains.png",
  },
  {
    name: "Rawalpindi",
    slug: "rawalpindi",
    businesses: 1200,
    image: "/rawalpindi-bustling-commercial-area.png",
  },
  {
    name: "Faisalabad",
    slug: "faisalabad",
    businesses: 980,
    image: "/faisalabad-industrial-city-pakistan.png",
  },
  {
    name: "Multan",
    slug: "multan",
    businesses: 750,
    image: "/multan-historical-city-pakistan.png",
  },
]

export function TopCitiesSection() {
  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Top Cities</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover businesses in Pakistan's major cities and commercial hubs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topCities.map((city) => (
            <Link key={city.slug} href={`/search?city=${city.slug}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="relative h-48">
                  <img
                    src={city.image || "/placeholder.svg"}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">{city.name}</h3>
                    <p className="text-sm opacity-90">{city.businesses} businesses</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
