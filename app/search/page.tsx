"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SearchFilters } from "@/components/search-filters"
import { BusinessCard } from "@/components/business-card"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { mockBusinesses } from "@/lib/mock-data"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [filteredBusinesses, setFilteredBusinesses] = useState(mockBusinesses)
  const [currentPage, setCurrentPage] = useState(1)
  const businessesPerPage = 12

  const query = searchParams.get("q") || ""
  const city = searchParams.get("city") || ""
  const category = searchParams.get("category") || ""

  useEffect(() => {
    let filtered = mockBusinesses

    // Filter by search query
    if (query) {
      filtered = filtered.filter(
        (business) =>
          business.name.toLowerCase().includes(query.toLowerCase()) ||
          business.category.toLowerCase().includes(query.toLowerCase()) ||
          business.description.toLowerCase().includes(query.toLowerCase()),
      )
    }

    // Filter by city
    if (city) {
      filtered = filtered.filter((business) => business.city.toLowerCase() === city.toLowerCase())
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter(
        (business) => business.category.toLowerCase().replace(/\s+/g, "-") === category.toLowerCase(),
      )
    }

    setFilteredBusinesses(filtered)
    setCurrentPage(1)
  }, [query, city, category])

  // Pagination
  const totalPages = Math.ceil(filteredBusinesses.length / businessesPerPage)
  const startIndex = (currentPage - 1) * businessesPerPage
  const currentBusinesses = filteredBusinesses.slice(startIndex, startIndex + businessesPerPage)

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
            Found {filteredBusinesses.length} businesses
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
            {currentBusinesses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
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
