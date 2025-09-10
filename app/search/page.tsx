"use client"
import { Button } from "@/components/ui/button"
import BusinessListItem from "@/components/business-list-item"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import FancyLoader from "@/components/fancy-loader"

type Business = {
  id: string
  _id?: string
  slug?: string
  name: string
  category: string
  city: string
  address: string
  description: string
  logo?: string
  logoUrl?: string
  logoPublicId?: string
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
    const controller = new AbortController()
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

        const res = await fetch(`/api/business?${params.toString()}`, { cache: "no-store", signal: controller.signal })
        const data = await res.json()
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to fetch listings")
        const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
        const items: Business[] = (data.businesses || []).map((b: any) => {
          const derivedLogoUrl = (!b.logoUrl && b.logoPublicId && cloud)
            ? `https://res.cloudinary.com/${cloud}/image/upload/c_fit,w_200,h_200,q_auto,f_auto/${b.logoPublicId}`
            : undefined
          return {
            id: b.id || b._id?.toString?.() || "",
            slug: b.slug,
            name: b.name,
            category: b.category,
            city: b.city,
            address: b.address,
            description: b.description,
            logo: b.logo,
            logoUrl: b.logoUrl || derivedLogoUrl,
            logoPublicId: b.logoPublicId,
            imageUrl: b.imageUrl,
            phone: b.phone,
            email: b.email,
            status: b.status,
          }
        })
        setBusinesses(items)
        setTotal(data.pagination?.total || items.length)
        setTotalPages(data.pagination?.pages || 1)
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        setError(e?.message || "Failed to load listings")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
    return () => controller.abort()
  }, [query, city, category, status, currentPage])

  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 py-8">
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
        {/* Results - full width under 70% global container */}
        <div>
          {isLoading && (
            <div className="py-16 flex items-center justify-center">
              <FancyLoader />
            </div>
          )}
          {error && (
            <div className="text-center text-destructive py-8">{error}</div>
          )}
          {!isLoading && !error && businesses.length > 0 ? (
            <>
              <div className="divide-y rounded-lg border bg-card">
                {businesses.map((b) => (
                  <div key={b.id} className="p-4 md:p-5">
                    <BusinessListItem business={b} compact />
                  </div>
                ))}
              </div>
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
              {/* Back button removed as requested */}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
