"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BusinessCard } from "@/components/business-card"
import { Button } from "@/components/ui/button"
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
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const businessesPerPage = 12

  const prettyName = categorySlug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
  const category = { name: prettyName, icon: "📦", slug: categorySlug }

  // Fetch ALL businesses for this category (paginate through API)
  useEffect(() => {
    const fetchAllBusinesses = async () => {
      try {
        setLoading(true)
        const PAGE_SIZE = 50
        // First page
        const first = await fetch(`/api/business?category=${categorySlug}&page=1&limit=${PAGE_SIZE}`)
        if (!first.ok) throw new Error("Failed to fetch businesses")
        const firstData = await first.json()
        let all: any[] = firstData.businesses || []
        const totalPages: number = firstData?.pagination?.pages || 1

        // Fetch remaining pages in sequence to avoid overloading server
        for (let p = 2; p <= totalPages; p++) {
          const res = await fetch(`/api/business?category=${categorySlug}&page=${p}&limit=${PAGE_SIZE}`)
          if (!res.ok) break
          const data = await res.json()
          all = all.concat(data.businesses || [])
        }

        setBusinesses(all)
      } catch (error) {
        console.error("Error fetching businesses:", error)
        setBusinesses([])
      } finally {
        setLoading(false)
      }
    }

    if (categorySlug) {
      fetchAllBusinesses()
    }
  }, [categorySlug])

  useEffect(() => {
    let filtered = businesses

    // Filter by city if selected
    if (selectedCity !== "all") {
      filtered = filtered.filter((business) => business.city.toLowerCase() === selectedCity.toLowerCase())
    }

    setFilteredBusinesses(filtered)
    setCurrentPage(1)
  }, [businesses, selectedCity])

  // Pagination
  const totalPages = Math.ceil(filteredBusinesses.length / businessesPerPage)
  const startIndex = (currentPage - 1) * businessesPerPage
  const currentBusinesses = filteredBusinesses.slice(startIndex, startIndex + businessesPerPage)

  // Always render; rely on API results for content. If none found, we show the existing empty state.

  return (
    <div className="min-h-screen bg-background">
      <Header />

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {currentBusinesses.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <span className="text-muted-foreground">
                  Page {currentPage} of {totalPages}
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
