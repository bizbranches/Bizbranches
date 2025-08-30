"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BusinessCard } from "@/components/business-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockBusinesses, categories, cities } from "@/lib/mock-data"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"

export default function CityPage() {
  const params = useParams()
  const citySlug = params.slug as string

  const [filteredBusinesses, setFilteredBusinesses] = useState(mockBusinesses)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const businessesPerPage = 12

  const city = cities.find((c) => c.slug === citySlug)

  useEffect(() => {
    let filtered = mockBusinesses

    // Filter by city
    if (citySlug) {
      filtered = filtered.filter((business) => business.city.toLowerCase() === citySlug.toLowerCase())
    }

    // Filter by category if selected
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (business) => business.category.toLowerCase().replace(/\s+/g, "-") === selectedCategory.toLowerCase(),
      )
    }

    setFilteredBusinesses(filtered)
    setCurrentPage(1)
  }, [citySlug, selectedCategory])

  // Pagination
  const totalPages = Math.ceil(filteredBusinesses.length / businessesPerPage)
  const startIndex = (currentPage - 1) * businessesPerPage
  const currentBusinesses = filteredBusinesses.slice(startIndex, startIndex + businessesPerPage)

  if (!city) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">City Not Found</h1>
            <p className="text-muted-foreground mb-4">The city you're looking for doesn't exist.</p>
            <Button asChild>
              <a href="/">Back to Home</a>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">Businesses in {city.name}</h1>
            <p className="text-muted-foreground">
              {filteredBusinesses.length} businesses found
              {selectedCategory !== "all" && (
                <span> in {categories.find((cat) => cat.slug === selectedCategory)?.name}</span>
              )}
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Filter by Category:</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.slug} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Business Listings */}
        {currentBusinesses.length > 0 ? (
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
              No businesses found in {city.name}
              {selectedCategory !== "all" && (
                <span> for {categories.find((cat) => cat.slug === selectedCategory)?.name}</span>
              )}
              . Try selecting a different category.
            </p>
            <Button onClick={() => setSelectedCategory("all")} variant="outline">
              Show All Categories
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
