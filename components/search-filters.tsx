"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

export function SearchFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [city, setCity] = useState(searchParams.get("city") || "all")
  const [category, setCategory] = useState(searchParams.get("category") || "all")

  const cities = [
    "karachi",
    "lahore",
    "islamabad",
    "rawalpindi",
    "faisalabad",
    "multan",
    "peshawar",
    "quetta",
    "sialkot",
    "gujranwala",
  ]

  const categories = [
    { value: "restaurants", label: "Restaurants" },
    { value: "healthcare", label: "Healthcare" },
    { value: "education", label: "Education" },
    { value: "automotive", label: "Automotive" },
    { value: "retail", label: "Retail" },
    { value: "beauty-spa", label: "Beauty & Spa" },
    { value: "real-estate", label: "Real Estate" },
    { value: "technology", label: "Technology" },
    { value: "legal", label: "Legal Services" },
    { value: "construction", label: "Construction" },
    { value: "travel", label: "Travel & Tourism" },
    { value: "finance", label: "Financial Services" },
  ]

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (city !== "all") params.set("city", city)
    if (category !== "all") params.set("category", category)

    router.push(`/search?${params.toString()}`)
  }

  const clearFilters = () => {
    setQuery("")
    setCity("all")
    setCategory("all")
    router.push("/search")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Search</label>
          <Input placeholder="Business name or keyword..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">City</label>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger>
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((cityName) => (
                <SelectItem key={cityName} value={cityName}>
                  {cityName.charAt(0).toUpperCase() + cityName.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-2">
          <Button onClick={applyFilters} className="w-full">
            Apply Filters
          </Button>
          <Button onClick={clearFilters} variant="outline" className="w-full bg-transparent">
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
