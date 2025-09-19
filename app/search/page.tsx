"use client"
import { Button } from "@/components/ui/button"
import BusinessListItem from "@/components/business-list-item"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [fetchedOnce, setFetchedOnce] = useState(false)

  const query = searchParams.get("q") || ""
  const city = searchParams.get("city") || ""
  const category = searchParams.get("category") || ""
  const status = searchParams.get("status") || ""
  const limit = 12

  // Sidebar filter data
  const [cities, setCities] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [categoriesList, setCategoriesList] = useState<Array<{ slug: string; name: string }>>([])
  const [showAllCities, setShowAllCities] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [query, city, category])

  // Fetch from API when filters or page change
  useEffect(() => {
    const controller = new AbortController()
    const fetchData = async () => {
      try {
        setError("")
        setIsLoading(true)
        setFetchedOnce(false)
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
        setBusinesses([])
        setTotal(0)
        setTotalPages(1)
      } finally {
        setIsLoading(false)
        setFetchedOnce(true)
      }
    }
    fetchData()
    return () => controller.abort()
  }, [query, city, category, status, currentPage])

  // Load cities and categories for sidebar filters
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [cRes, catRes] = await Promise.all([
          fetch('/api/cities', { cache: 'no-store' }),
          fetch('/api/categories?limit=200&nocache=1', { cache: 'no-store' }),
        ])
        const citiesJson = await cRes.json().catch(() => ({}))
        const categoriesJson = await catRes.json().catch(() => ({}))
        if (alive) {
          const cityList: Array<{ id: string; name: string; slug: string }> = Array.isArray(citiesJson?.cities)
            ? citiesJson.cities.map((c: any) => ({ id: String(c.id || c._id || c.slug || c.name), name: c.name, slug: c.name.toLowerCase().replace(/\s+/g, '-') }))
            : []
          setCities(cityList)
          const catList: Array<{ slug: string; name: string }> = Array.isArray(categoriesJson?.categories)
            ? categoriesJson.categories.map((x: any) => ({ slug: x.slug, name: x.name || x.slug }))
            : []
          setCategoriesList(catList)
        }
      } catch {
        if (alive) {
          setCities([])
          setCategoriesList([])
        }
      }
    })()
    return () => { alive = false }
  }, [])

  // Helpers to update URL params
  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search)
    if (value) params.set(key, value)
    else params.delete(key)
    // Reset to first page when changing filters
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  const displayedCategories = useMemo(() => (
    showAllCategories ? categoriesList : categoriesList.slice(0, 8)
  ), [categoriesList, showAllCategories])

  const displayedCities = useMemo(() => (
    showAllCities ? cities : cities.slice(0, 8)
  ), [cities, showAllCities])

  const topCities = useMemo(() => (
    displayedCities
  ), [displayedCities])

  const remainingCities = useMemo(() => (
    cities.slice(8)
  ), [cities])

  const [citySearch, setCitySearch] = useState("")

  return (
    <div className="min-h-screen bg-background">
      <main className="pl-2 md:pl-6 pr-0 py-4">
        <div className="mb-8">
          {/* <h1 className="text-3xl font-bold text-foreground mb-4">
            Search Results
            {query && <span className="text-muted-foreground"> for "{query}"</span>}
          </h1> */}
          <p className="text-muted-foreground">
            Found {total} businesses
            {city && <span> in {city.charAt(0).toUpperCase() + city.slice(1)}</span>}
            {category && <span> in {category.replace("-", " ")}</span>}
          </p>
        </div>

        {/* Layout: 15% (filters) / 70% (list) / 15% (empty) */}
        <div className="grid grid-cols-1 md:grid-cols-[15%_70%_15%] gap-6">
          {/* Sidebar - flush left */}
          <aside>
            <div className="bg-card border rounded-xl p-4">
              <h3 className="text-lg font-semibold text-foreground mb-3">Category</h3>
              <div className="space-y-2">
                {displayedCategories.map((c) => {
                  const checked = category === c.slug
                  return (
                    <label key={c.slug} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={(e) => updateParam('category', e.target.checked ? c.slug : '')}
                      />
                      <span className="text-sm text-foreground">{c.name}</span>
                    </label>
                  )
                })}
              </div>
              {categoriesList.length > 8 && (
                <button onClick={() => setShowAllCategories((v) => !v)} className="mt-3 text-sm text-primary hover:underline">
                  {showAllCategories ? 'Show Less' : `View All (${categoriesList.length - 8})`}
                </button>
              )}

              <hr className="my-6" />

              <h3 className="text-lg font-semibold text-foreground mb-3">Areas</h3>
              {/* Search other cities (on top) */}
              <input
                placeholder="Search areas..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="w-full h-9 px-3 mb-3 rounded border bg-background"
              />
              {/* Top 8 cities (filtered) */}
              <div className="space-y-2 mb-3">
                {topCities
                  .filter((ct) => {
                    const q = citySearch.trim().toLowerCase()
                    if (!q) return true
                    const slug = (ct as any).slug ? String((ct as any).slug) : String(ct.name)
                    return slug.toLowerCase().includes(q) || String(ct.name).toLowerCase().includes(q)
                  })
                  .map((ct) => {
                    const checked = city === ct.slug || city.toLowerCase() === ct.name.toLowerCase()
                    return (
                      <label key={ct.slug} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={(e) => updateParam('city', e.target.checked ? ct.slug : '')}
                        />
                        <span className="text-sm text-foreground">{ct.name}</span>
                      </label>
                    )
                  })}
              </div>
              <div className="space-y-2 max-h-60 overflow-auto pr-1">
                {remainingCities
                  .filter((ct) => {
                    const q = citySearch.trim().toLowerCase()
                    if (!q) return true
                    const slug = (ct as any).slug ? String((ct as any).slug) : String(ct.name)
                    return slug.toLowerCase().includes(q) || String(ct.name).toLowerCase().includes(q)
                  })
                  .map((ct) => {
                    const checked = city === ct.slug || city.toLowerCase() === ct.name.toLowerCase()
                    return (
                      <label key={ct.slug} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={(e) => updateParam('city', e.target.checked ? ct.slug : '')}
                        />
                        <span className="text-sm text-foreground">{ct.name}</span>
                      </label>
                    )
                  })}
                {(() => {
                  const q = citySearch.trim().toLowerCase()
                  const anyTop = topCities.some((ct) => {
                    if (!q) return true
                    const slug = (ct as any).slug ? String((ct as any).slug) : String(ct.name)
                    return slug.toLowerCase().includes(q) || String(ct.name).toLowerCase().includes(q)
                  })
                  const anyRemaining = remainingCities.some((ct) => {
                    if (!q) return true
                    const slug = (ct as any).slug ? String((ct as any).slug) : String(ct.name)
                    return slug.toLowerCase().includes(q) || String(ct.name).toLowerCase().includes(q)
                  })
                  return !anyTop && !anyRemaining ? (
                    <div className="text-xs text-muted-foreground">No matches</div>
                  ) : null
                })()}
              </div>
            </div>
          </aside>

          {/* Results - center 70% */}
          <section>
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
            ) : null}
            {!isLoading && !error && fetchedOnce && businesses.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-foreground mb-2">No businesses found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your search criteria or browse our categories.</p>
              </div>
            )}
          </section>

          {/* Right empty 15% column */}
          <div className="hidden md:block" />
        </div>
      </main>
    </div>
  )
}
