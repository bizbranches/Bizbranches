"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const categories = [
  { name: "Restaurants", icon: "🍽️", slug: "restaurants", count: 1250 },
  { name: "Healthcare", icon: "🏥", slug: "healthcare", count: 890 },
  { name: "Education", icon: "🎓", slug: "education", count: 650 },
  { name: "Automotive", icon: "🚗", slug: "automotive", count: 420 },
  { name: "Retail", icon: "🛍️", slug: "retail", count: 980 },
  { name: "Beauty & Spa", icon: "💄", slug: "beauty-spa", count: 340 },
  { name: "Real Estate", icon: "🏠", slug: "real-estate", count: 560 },
  { name: "Technology", icon: "💻", slug: "technology", count: 290 },
  { name: "Legal Services", icon: "⚖️", slug: "legal", count: 180 },
  { name: "Construction", icon: "🏗️", slug: "construction", count: 320 },
  { name: "Travel & Tourism", icon: "✈️", slug: "travel", count: 210 },
  { name: "Financial Services", icon: "💰", slug: "finance", count: 150 },
]

export function CategoriesSection() {
  const [showAll, setShowAll] = useState(false)
  const visibleCategories = showAll ? categories : categories.slice(0, 8)
  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Browse by Category</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore businesses across different categories and find exactly what you're looking for.
          </p>
        </div>

        <div className="w-[90%] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {visibleCategories.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`}>
              <Card className="cursor-pointer group bg-white dark:bg-card border hover:shadow-xl transition-transform duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{category.icon}</div>
                  <h3 className="font-semibold text-foreground mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count} businesses</p>
                </CardContent>
              </Card>
            </Link>
          ))}
          {/* Use empty 9th slot as an in-grid action when collapsed */}
          {!showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="group rounded-lg border bg-white dark:bg-card text-card-foreground shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="View all categories"
            >
              <div className="p-6 h-full w-full flex items-center justify-center text-center">
                <div>
                  <div className="text-2xl mb-2 font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                    View all categories
                  </div>
                  <p className="text-xs text-muted-foreground">Explore the full list</p>
                </div>
              </div>
            </button>
          )}
          </div>
        </div>

        {showAll && (
          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              className="px-8 bg-transparent"
              onClick={() => setShowAll(false)}
            >
              Show less
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
