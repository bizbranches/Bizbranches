"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { categories as mockCategories } from "@/lib/mock-data"

type Category = { name: string; slug: string; count?: number; icon?: string; image?: string }

// Image mapping per category slug (served from /public)
const categoryImages: Record<string, string> = {
  restaurants: "/pakistani-restaurant-interior.png",
  healthcare: "/modern-hospital.png",
  education: "/school-building-with-playground.png",
  automotive: "/car-showroom.png",
  retail: "/clothing-store-interior.png",
  "beauty-spa": "/modern-beauty-salon.png",
  "real-estate": "/real-estate-office.png",
  technology: "/modern-tech-office.png",
  legal: "/law-office.png",
  construction: "/construction-site.png",
  travel: "/travel-agency.png",
  finance: "/financial-advisor-office.png",
}

// Fallback icons by common slugs (optional, for a nicer UI when image missing)
const fallbackIcon: Record<string, string> = {
  restaurants: "🍽️",
  healthcare: "🏥",
  education: "🎓",
  automotive: "🚗",
  retail: "🛍️",
  "beauty-spa": "💄",
  "real-estate": "🏠",
  technology: "💻",
  legal: "⚖️",
  construction: "🏗️",
  travel: "✈️",
  finance: "💰",
}

export function CategoriesSection() {
  const [showAll, setShowAll] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch(`/api/categories?limit=60`, { cache: "no-store" })
        const data = await res.json()
        if (active) {
          if (data?.ok && Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(
              data.categories.map((c: any) => ({
                name: c.name || c.slug,
                slug: c.slug,
                count: typeof c.count === "number" ? c.count : undefined,
                image: c.imageUrl || categoryImages[c.slug],
                icon: c.icon || fallbackIcon[c.slug] || "📦",
              })),
            )
          } else {
            // Fallback to mock categories when API returns empty
            setCategories(
              mockCategories.map((c: any) => ({
                name: c.name,
                slug: c.slug,
                count: typeof c.count === "number" ? c.count : undefined,
                image: categoryImages[c.slug],
                icon: c.icon || fallbackIcon[c.slug] || "📦",
              })),
            )
          }
        }
      } catch {
        // On error, fallback to mock categories
        if (active) {
          setCategories(
            mockCategories.map((c: any) => ({
              name: c.name,
              slug: c.slug,
              count: typeof c.count === "number" ? c.count : undefined,
              image: categoryImages[c.slug],
              icon: c.icon || fallbackIcon[c.slug] || "📦",
            })),
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const visibleCategories = (showAll ? categories : categories.slice(0, 8))
  const title = "Browse by Category"

  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">{title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore businesses across different categories and find exactly what you're looking for.
          </p>
        </div>

        <div className="w-[90%] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {(loading ? [] : visibleCategories).map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`}>
              <Card className="cursor-pointer group bg-white dark:bg-card border hover:shadow-xl transition-transform duration-300 hover:scale-105">
                <CardContent className="p-0 text-center">
                  <div className="w-full aspect-[16/9] relative overflow-hidden rounded-t-md">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={`${category.name} category`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        priority={false}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl bg-muted">
                        {category.icon || "📦"}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-foreground mb-2">{category.name}</h3>
                    {typeof category.count === "number" && (
                      <p className="text-sm text-muted-foreground">{category.count} businesses</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {/* Use empty 9th slot as an in-grid action when collapsed */}
          {!loading && !showAll && categories.length > 8 && (
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

        {!loading && showAll && (
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
