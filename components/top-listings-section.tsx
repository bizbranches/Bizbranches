"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { categories, mockBusinesses } from "@/lib/mock-data"

type FeaturedCategoryCardProps = {
  categoryName: string
  categorySlug: string
}

function BusinessCard({ b }: { b: (typeof mockBusinesses)[number] }) {
  return (
    <Link href={`/business/${b.id}`} className="block group rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="relative">
        <Image
          src={b.image || "/placeholder.svg"}
          alt={b.name}
          width={400}
          height={200}
          className="w-full h-32 object-cover"
        />
        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">Featured</Badge>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {b.name}
          </h3>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs px-1 py-0">
            {b.category}
          </Badge>
        </div>
        <div className="flex items-center gap-1 mb-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground capitalize">{b.city}</span>
        </div>
        {b.phone && (
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate">{b.phone}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

function FeaturedCategoryCard({ categoryName, categorySlug }: FeaturedCategoryCardProps) {
  const list = useMemo(
    () => mockBusinesses.filter((b) => b.category.toLowerCase() === categoryName.toLowerCase()),
    [categoryName],
  )

  const meta = useMemo(() => categories.find((c) => c.slug === categorySlug), [categorySlug])

  const [index, setIndex] = useState(0)
  const [anim, setAnim] = useState(true)

  useEffect(() => {
    // ensure initially visible
    setAnim(true)
    if (list.length <= 1) return
    const id = setInterval(() => {
      setAnim(false)
      setIndex((i) => (i + 1) % list.length)
      // trigger a reflowed fade-in
      requestAnimationFrame(() => setAnim(true))
    }, 4000)
    return () => clearInterval(id)
  }, [list.length])

  const first = list.length > 0 ? list[index % list.length] : undefined
  const second = list.length > 0 ? list[(index + 1) % list.length] : undefined

  return (
    <Card className="h-full">
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl" aria-hidden>{meta?.icon ?? "⭐"}</span>
            <div>
              <CardTitle className="text-lg font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                {categoryName}
              </CardTitle>
              {meta?.count ? (
                <p className="text-[11px] text-muted-foreground">{meta.count} listings</p>
              ) : null}
            </div>
          </div>
          <Link
            href={`/category/${categorySlug}`}
            className="text-xs px-3 py-1 rounded-full border border-primary/30 hover:bg-primary hover:text-primary-foreground transition"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4" dir="ltr">
        {first ? (
          <div className={`transition-all duration-500 ${anim ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} key={`b1-${first.id}`}>
            <BusinessCard b={first} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No businesses yet.</p>
        )}
        {second && (
          <div className={`transition-all duration-500 ${anim ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} key={`b2-${second.id}`}>
            <BusinessCard b={second} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function TopListingsSection() {
  return (
    <section className="py-16 bg-muted/30" dir="ltr">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Our Top Listings</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover the most trusted and highly-rated businesses across Pakistan, handpicked for their excellence.
          </p>
        </div>
        {(() => {
          const desired = ["restaurants", "healthcare", "education", "automotive"]
          const featured = desired
            .map((slug) => categories.find((c) => c.slug === slug))
            .filter((c): c is typeof categories[number] => Boolean(c))

          const rows = [featured.slice(0, 2), featured.slice(2, 4)]

          return (
            <div className="space-y-8">
              {rows.map((row, idx) => (
                <div key={idx} className="w-[90%] mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {row.map((cat) => (
                      <FeaturedCategoryCard key={cat.slug} categoryName={cat.name} categorySlug={cat.slug} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

        <div className="text-center mt-12">
          <Link href="/search">
            <Button size="lg" className="px-8">
              View All Listings
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
