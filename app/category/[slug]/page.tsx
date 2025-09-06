"use client"
import BusinessListItem from "@/components/business-list-item"
import { Button } from "@/components/ui/button"
// Table view removed to keep listings compact without horizontal scroll
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cities } from "@/lib/mock-data"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { CategoryFooter } from "@/components/category-footer"

export default function CategoryPage() {
  const params = useParams()
  const categorySlug = params.slug as string

  const [businesses, setBusinesses] = useState<any[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([])
  const [selectedCity, setSelectedCity] = useState("all")
  const [currentPage, setCurrentPage] = useState(1) // client-side page for UI pagination (local slice)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [apiPage, setApiPage] = useState(1)
  const [apiTotalPages, setApiTotalPages] = useState(1)
  const PAGE_SIZE = 12

  const prettyName = categorySlug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
  const category = { name: prettyName, icon: "📦", slug: categorySlug }
  // Using a unified compact list for all categories, including bank

  // Fetch only first page initially; fetch more on demand
  useEffect(() => {
    let active = true
    const fetchPage = async (page: number) => {
      try {
        setLoading(true)
        const res = await fetch(`/api/business?category=${categorySlug}&page=${page}&limit=${PAGE_SIZE}`)
        if (!res.ok) throw new Error("Failed to fetch businesses")
        const data = await res.json()
        if (!active) return
        setBusinesses(data.businesses || [])
        setApiPage(page)
        setApiTotalPages(data?.pagination?.pages || 1)
      } catch (error) {
        console.error("Error fetching businesses:", error)
        if (active) setBusinesses([])
      } finally {
        if (active) setLoading(false)
      }
    }
    if (categorySlug) fetchPage(1)
    return () => { active = false }
  }, [categorySlug])

  const loadMore = async () => {
    if (loadingMore) return
    const next = apiPage + 1
    if (next > apiTotalPages) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/business?category=${categorySlug}&page=${next}&limit=${PAGE_SIZE}`)
      if (!res.ok) throw new Error("Failed to fetch more")
      const data = await res.json()
      setBusinesses((prev) => prev.concat(data.businesses || []))
      setApiPage(next)
      setApiTotalPages(data?.pagination?.pages || apiTotalPages)
    } catch (e) {
      console.error("Load more failed", e)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    let filtered = businesses

    // Filter by city if selected
    if (selectedCity !== "all") {
      filtered = filtered.filter((business) => business.city.toLowerCase() === selectedCity.toLowerCase())
    }

    setFilteredBusinesses(filtered)
    setCurrentPage(1)
  }, [businesses, selectedCity])

  // Pagination (client-side slice over currently loaded items)
  const totalPages = Math.ceil(filteredBusinesses.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const currentBusinesses = filteredBusinesses.slice(startIndex, startIndex + PAGE_SIZE)

  // Always render; rely on API results for content. If none found, we show the existing empty state.

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-3">{category.icon}</span>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
              <p className="text-muted-foreground">
                {filteredBusinesses.length} businesses found
                {selectedCity !== "all" && (
                  <span> in {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}</span>
                )}
              </p>
            </div>
          </div>

          {/* City Filter */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Filter by City:</label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.slug} value={city.slug}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Business Listings */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading businesses...</p>
          </div>
        ) : currentBusinesses.length > 0 ? (
          <>
            <div className="mb-8 divide-y divide-gray-100 border-y">
              {currentBusinesses.map((business) => (
                <div key={business.id} className="py-4">
                  <BusinessListItem business={business} compact />
                </div>
              ))}
            </div>

            {/* Load more (server pagination) */}
            {apiPage < apiTotalPages && (
              <div className="flex justify-center items-center mt-6">
                <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-foreground mb-2">No businesses found</h3>
            <p className="text-muted-foreground mb-4">
              No businesses in this category
              {selectedCity !== "all" && <span> in {selectedCity}</span>}. Try selecting a different city.
            </p>
            <Button onClick={() => setSelectedCity("all")} variant="outline">
              Show All Cities
            </Button>
          </div>
        )}
      </main>
      <CategoryFooter categorySlug={categorySlug} categoryName={category.name} categoryIcon={category.icon} />
    </div>
  )
}
