"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SearchFilters } from "@/components/search-filters"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

type Business = {
  id: string
  _id?: string
  slug?: string
  name: string
  category: string
  city: string
  address: string
  description: string
  logoUrl?: string
  imageUrl?: string
  phone?: string
  email?: string
  status?: "pending" | "approved" | "rejected"
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const query = searchParams.get("q") || ""
  const city = searchParams.get("city") || ""
  const category = searchParams.get("category") || ""
  const status = searchParams.get("status") || ""
  const limit = 12

  useEffect(() => {
    setCurrentPage(1)
  }, [query, city, category])

    // Fetch from API when filters or page change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const params = new URLSearchParams()
        params.set("page", String(currentPage))
        params.set("limit", String(limit))
        if (query.trim()) params.set("q", query.trim())
        if (city.trim()) params.set("city", city.trim())
        if (category.trim()) params.set("category", category.trim())
        if (status.trim()) params.set("status", status.trim())
        // Note: API defaults to approved only, which is desired for public listings

        const res = await fetch(`/api/business?${params.toString()}`, { cache: "no-store" })
        const data = await res.json()
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to fetch listings")
        const items: Business[] = (data.businesses || []).map((b: any) => ({
          id: b.id || b._id?.toString?.() || "",
          slug: b.slug,
          name: b.name,
          category: b.category,
          city: b.city,
          address: b.address,
          description: b.description,
          logoUrl: b.logoUrl,
          imageUrl: b.imageUrl,
          phone: b.phone,
          email: b.email,
          status: b.status,
        }))
        setBusinesses(items)
        setTotal(data.pagination?.total || items.length)
        setTotalPages(data.pagination?.pages || 1)
      } catch (e: any) {
        setError(e?.message || "Failed to load listings")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [query, city, category, status, currentPage])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Search Results
            {query && <span className="text-muted-foreground"> for "{query}"</span>}
          </h1>
          <p className="text-muted-foreground">
            Found {total} businesses
            {city && <span> in {city.charAt(0).toUpperCase() + city.slice(1)}</span>}
            {category && <span> in {category.replace("-", " ")}</span>}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <SearchFilters />
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {isLoading && (
              <div className="text-center text-muted-foreground py-12">Loading listings...</div>
            )}
            {error && (
              <div className="text-center text-destructive py-8">{error}</div>
            )}
            {!isLoading && !error && businesses.length > 0 ? (
              <>
                <ul className="divide-y rounded-lg border bg-card">
                  {businesses.map((b) => (
                    <li key={b.id} className="p-4 md:p-5">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-md border bg-white overflow-hidden flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={b.logoUrl || b.imageUrl || "/placeholder.svg?height=80&width=80&text=Logo"}
                            alt={`${b.name} logo`}
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground text-lg truncate">
                              <Link href={`/business/${b.slug || b.id}`}>{b.name}</Link>
                            </h3>
                            <span className="inline-flex items-center rounded bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                              {b.category}
                            </span>
                            {b.status === "pending" && (
                              <span className="inline-flex items-center rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                Approval pending
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{b.description}</p>
                          <div className="text-xs text-muted-foreground mt-2">
                            {b.city && <span className="capitalize">{b.city}</span>} {b.address && <span>• {b.address}</span>}
                          </div>
                        </div>
                        <div className="hidden md:flex flex-col items-end gap-2">
                          <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                            <Link href={`/business/${b.slug || b.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    <span className="text-muted-foreground">
                      Page {currentPage} of {totalPages} • {total} result{total !== 1 ? 's' : ''}
                    </span>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-foreground mb-2">No businesses found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or browse our categories.
                </p>
                <Button asChild>
                  <a href="/">Back to Home</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
