"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setError(null)
        // Try sessionStorage cache first
        const now = Date.now()
        let cached: any | null = null
        try {
          const raw = sessionStorage.getItem("categories_initial")
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed && Array.isArray(parsed.data) && typeof parsed.ts === "number" && (now - parsed.ts) < CACHE_TTL_MS) {
              cached = parsed.data
            }
          }
        } catch {}

        let data: any = null
        if (cached) {
          data = { ok: true, categories: cached }
        }
        // Always fetch a full fresh list for accuracy
        const fres = await fetch(`/api/categories?limit=200&nocache=1`, { cache: "no-store" })
        const fdata = await fres.json().catch(() => ({}))
        if (fdata?.ok && Array.isArray(fdata.categories)) {
          data = fdata
          try {
            sessionStorage.setItem("categories_initial", JSON.stringify({ ts: now, data: fdata.categories }))
          } catch {}
        }
        if (active) {
          if (data?.ok && Array.isArray(data.categories) && data.categories.length > 0) {
            const mapped = data.categories.map((c: any) => ({
              name: c.name || c.slug,
              slug: c.slug,
              count: typeof c.count === "number" ? c.count : undefined,
              image: c.imageUrl || categoryImages[c.slug],
              icon: c.icon || fallbackIcon[c.slug] || "📦",
            }))
            setCategories(mapped)
          } else {
            // No categories returned; leave list empty
            setCategories([])
          }
        }
      } catch (e: any) {
        if (active) {
          setError(e?.message || "Failed to load categories")
          setCategories([])
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [reloadKey])

  // When user expands, lazily fetch more categories once
  useEffect(() => {
    let active = true
    if (showAll && categories.length < 20 && !loading) {
      ;(async () => {
        try {
          setLoadingMore(true)
          const now = Date.now()
          // Always fetch fresh when expanding to ensure latest from admin panel
          const res = await fetch(`/api/categories?limit=200&nocache=1`, { cache: "no-store" })
          const data = await res.json()
          try {
            if (data?.ok && Array.isArray(data.categories)) {
              sessionStorage.setItem("categories_all", JSON.stringify({ ts: now, data: data.categories }))
            }
          } catch {}
          if (active && data?.ok && Array.isArray(data.categories)) {
            setCategories(
              data.categories.map((c: any) => ({
                name: c.name || c.slug,
                slug: c.slug,
                count: typeof c.count === "number" ? c.count : undefined,
                image: c.imageUrl || categoryImages[c.slug],
                icon: c.icon || fallbackIcon[c.slug] || "📦",
              })),
            )
          }
        } catch {
          // ignore errors for the lazy load
        } finally {
          setLoadingMore(false)
        }
      })()
    }
    return () => {
      active = false
    }
  }, [showAll, loading, categories.length])

  const visibleCategories = (showAll ? categories : categories.slice(0, 8))
  const title = "Browse by Category"

  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">{title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore businesses across different categories and find exactly what you're looking for.
          </p>
          {/* Empty / error state (no hardcoded categories) */}
          {!loading && categories.length === 0 && (
            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground mb-4">{error ? "Failed to load categories." : "No categories available."}</p>
              <Button variant="outline" onClick={() => { setLoading(true); setReloadKey((k) => k + 1) }}>Retry</Button>
            </div>
          )}
        </div>

        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(loading ? Array.from({ length: 8 }) : visibleCategories).map((category: any, idx: number) => (
            loading ? (
              <div key={idx} className="rounded-md border bg-white dark:bg-card">
                <div className="relative w-full h-40 bg-muted animate-pulse rounded-t-md" />
                <div className="p-4">
                  <div className="h-3.5 w-20 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ) : (
              <Link key={category.slug} href={`/category/${category.slug}`} prefetch>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-0">
                    <div className="relative h-40">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={`${category.name} category`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-3xl">{category.icon || "📦"}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 text-white">
                        <h3 className="text-lg md:text-xl font-bold">{category.name}</h3>
                        {typeof category.count === "number" && (
                          <p className="text-xs md:text-sm opacity-90">{category.count} businesses</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          ))}
          {/* Use empty 9th slot as an in-grid action when collapsed */}
          {!loading && !showAll && categories.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="group rounded-lg border bg-white dark:bg-card text-card-foreground shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="View all categories"
            >
              <div className="p-4 h-full w-full flex items-center justify-center text-center">
                <div>
                  <div className="text-xl mb-1.5 font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
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
              {loadingMore ? "Loading…" : "Show less"}
            </Button>
          </div>
        )}
        {!loading && !showAll && categories.length > 8 && (
          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              className="px-8 bg-transparent"
              onClick={() => setShowAll(true)}
            >
              View all
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
