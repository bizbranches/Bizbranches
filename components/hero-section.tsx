"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
// Live suggestions are fetched from API endpoints

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [businessSuggestions, setBusinessSuggestions] = useState<any[]>([])
  const [categorySuggestions, setCategorySuggestions] = useState<any[]>([])
  const [combinedSuggestions, setCombinedSuggestions] = useState<Array<{ type: 'business' | 'category'; data: any }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [headerHeight, setHeaderHeight] = useState(0)
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      const q = searchQuery.trim()
      if (q.length >= 1) {
        try {
          const params = new URLSearchParams({ q, limit: '8' })
          if (selectedCity) params.set('city', selectedCity)
          if (selectedCategory) params.set('category', selectedCategory)

          const [bRes, cRes] = await Promise.all([
            fetch(`/api/business?${params.toString()}`),
            fetch(`/api/categories?q=${encodeURIComponent(q)}&limit=6`),
          ])
          const bJson = bRes.ok ? await bRes.json() : { businesses: [] }
          const cJson = cRes.ok ? await cRes.json() : { categories: [] }

          const b = (bJson?.businesses || []) as any[]
          const c = (cJson?.categories || []) as any[]

          setBusinessSuggestions(b)
          setCategorySuggestions(c)
          const combined: Array<{ type: 'business' | 'category'; data: any }> = [
            ...b.map((x) => ({ type: 'business' as const, data: x })),
            ...c.map((x) => ({ type: 'category' as const, data: x })),
          ]
          setCombinedSuggestions(combined)
          setShowSuggestions(combined.length > 0)
          setSelectedSuggestionIndex(-1)
        } catch (e) {
          setBusinessSuggestions([])
          setCategorySuggestions([])
          setCombinedSuggestions([])
          setShowSuggestions(false)
        }
      } else {
        setBusinessSuggestions([])
        setCategorySuggestions([])
        setCombinedSuggestions([])
        setShowSuggestions(false)
      }
    }, 200)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, selectedCity, selectedCategory])

  // Measure header height to make hero exactly 100vh combined with header
  useEffect(() => {
    const measure = () => {
      const header = document.querySelector('header') as HTMLElement | null
      setHeaderHeight(header?.offsetHeight ?? 0)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || combinedSuggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev < combinedSuggestions.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : combinedSuggestions.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          const sel = combinedSuggestions[selectedSuggestionIndex]
          if (sel.type === 'business') {
            router.push(`/business/${sel.data.slug || sel.data.id}`)
          } else if (sel.type === 'category') {
            router.push(`/category/${sel.data.slug}`)
          }
        } else {
          handleSearch(e)
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }

  const handleSuggestionClick = (item: { type: 'business' | 'category'; data: any }) => {
    setShowSuggestions(false)
    if (item.type === 'business') {
      setSearchQuery(item.data.name)
      router.push(`/business/${item.data.slug || item.data.id}`)
    } else {
      setSearchQuery(item.data.name)
      router.push(`/category/${item.data.slug}`)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)

    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set("q", searchQuery.trim())
    if (selectedCity) params.set("city", selectedCity)
    if (selectedCategory) params.set("category", selectedCategory)

    router.push(`/search?${params.toString()}`)
  }

  return (
    <section
      className="relative bg-gradient-to-r from-primary/10 to-accent/10 py-24 flex items-center"
      style={{ minHeight: `calc(100vh - ${headerHeight}px)` }}
    >
      <div className="absolute inset-0 bg-[url('/pakistani-cityscape-with-modern-buildings.png')] bg-cover bg-center opacity-20"></div>

      <div className="relative container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
          Find the Best Businesses in Pakistan
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
          Discover local businesses, services, and professionals across Pakistan. Connect with trusted providers in your
          city.
        </p>

        <form onSubmit={handleSearch} className="bg-card p-6 rounded-lg shadow-lg max-w-5xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
            <div className="relative md:col-span-3">
              <Input
                ref={searchInputRef}
                placeholder="Search business name or category..."
                className="w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (searchQuery.trim() && combinedSuggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
              />

              {showSuggestions && combinedSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 z-50 bg-card border border-border rounded-md shadow-lg mt-1 max-h-80 overflow-y-auto"
                >
                  {/* Businesses */}
                  {businessSuggestions.length > 0 && (
                    <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">Businesses</div>
                  )}
                  {businessSuggestions.map((business, index) => (
                    <div
                      key={`b-${business.id}`}
                      className={`p-3 cursor-pointer border-b border-border last:border-b-0 hover:bg-muted transition-colors ${
                        index === selectedSuggestionIndex ? "bg-muted" : ""
                      }`}
                      onClick={() => handleSuggestionClick({ type: 'business', data: business })}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={business.image || business.logoUrl || "/placeholder.svg"}
                          alt={business.name}
                          className="w-10 h-10 rounded object-cover flex-shrink-0"
                        />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm text-foreground">{business.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {business.category} • {business.city.charAt(0).toUpperCase() + business.city.slice(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Categories */}
                  {categorySuggestions.length > 0 && (
                    <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">Categories</div>
                  )}
                  {categorySuggestions.map((cat, i) => {
                    const globalIndex = businessSuggestions.length + i
                    return (
                      <div
                        key={`c-${cat.slug}`}
                        className={`p-3 cursor-pointer border-b border-border last:border-b-0 hover:bg-muted transition-colors ${
                          globalIndex === selectedSuggestionIndex ? "bg-muted" : ""
                        }`}
                        onClick={() => handleSuggestionClick({ type: 'category', data: cat })}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-lg">
                            <span>{cat.icon}</span>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm text-foreground">{cat.name}</div>
                            <div className="text-xs text-muted-foreground">View category</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="karachi">Karachi</SelectItem>
                <SelectItem value="lahore">Lahore</SelectItem>
                <SelectItem value="islamabad">Islamabad</SelectItem>
                <SelectItem value="rawalpindi">Rawalpindi</SelectItem>
                <SelectItem value="faisalabad">Faisalabad</SelectItem>
                <SelectItem value="multan">Multan</SelectItem>
                <SelectItem value="peshawar">Peshawar</SelectItem>
                <SelectItem value="quetta">Quetta</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurants">Restaurants</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="automotive">Automotive</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="beauty-spa">Beauty & Spa</SelectItem>
                <SelectItem value="real-estate">Real Estate</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="legal">Legal Services</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="travel">Travel & Tourism</SelectItem>
                <SelectItem value="finance">Financial Services</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit" className="w-full">
              Search
            </Button>
          </div>
        </form>

        <Button asChild size="lg" variant="secondary">
          <Link href="/add">Add Your Business</Link>
        </Button>
      </div>
    </section>
  )
}
