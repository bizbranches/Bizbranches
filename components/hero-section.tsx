"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ChevronsUpDown } from "lucide-react"
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

  // Dynamic filter options
  const [cities, setCities] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [cityOpen, setCityOpen] = useState(false)
  const [cityQuery, setCityQuery] = useState("")
  const [categoriesList, setCategoriesList] = useState<Array<{ slug: string; name: string }>>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

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

  // Load cities (from API) and categories (from Mongo via API)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setCitiesLoading(true)
        // Try sessionStorage cache first for instant open
        try {
          const raw = sessionStorage.getItem("hero:cities")
          if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed?.data)) setCities(parsed.data)
          }
        } catch {}
        const res = await fetch('/api/cities', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        const list: Array<{ id: string; name: string }> = Array.isArray(data?.cities) ? data.cities : []
        if (alive) {
          const mapped = list.map(c => ({ id: String(c.id), name: c.name, slug: c.name.toLowerCase().replace(/\s+/g, '-') }))
          setCities(mapped)
          try { sessionStorage.setItem("hero:cities", JSON.stringify({ data: mapped })) } catch {}
        }
      } catch {
        if (alive) setCities([])
      } finally {
        if (alive) setCitiesLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setCategoriesLoading(true)
        const res = await fetch('/api/categories?limit=200&nocache=1', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        const list: any[] = Array.isArray(data?.categories) ? data.categories : []
        if (alive) setCategoriesList(list.map((c: any) => ({ slug: c.slug, name: c.name || c.slug })))
      } catch {
        if (alive) setCategoriesList([])
      } finally {
        if (alive) setCategoriesLoading(false)
      }
    })()
    return () => { alive = false }
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

            <Popover open={cityOpen} onOpenChange={setCityOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between">
                  <span className="truncate">{selectedCity ? (cities.find(x => x.slug === selectedCity)?.name || selectedCity) : (citiesLoading ? "Loading cities..." : "Select City")}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Search city..." value={cityQuery} onValueChange={setCityQuery} className="h-9" />
                  <CommandEmpty>{citiesLoading ? "Loading..." : "No city found."}</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {cities
                        .filter(c => cityQuery.trim() === "" || c.name.toLowerCase().includes(cityQuery.trim().toLowerCase()))
                        .slice(0, 100)
                        .map((c) => (
                          <CommandItem key={c.id} value={c.slug} onSelect={(val) => { setSelectedCity(val); setCityOpen(false); setCityQuery("") }}>
                            {c.name}
                          </CommandItem>
                        ))}
                      <CommandItem value="" onSelect={() => { setSelectedCity(""); setCityOpen(false); setCityQuery("") }}>All Cities</CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Category"} />
              </SelectTrigger>
              <SelectContent>
                {categoriesList.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                ))}
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
