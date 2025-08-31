"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Building, Tag, Loader2 } from "lucide-react"
import Link from "next/link"
import { useDebounce } from "@/hooks/use-debounce"

interface BusinessSuggestion {
  id: string
  name: string
  city: string
  category: string
  logoUrl?: string
  slug?: string
}

interface CategorySuggestion {
  _id: string
  name: string
  slug: string
}

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<{ businesses: BusinessSuggestion[]; categories: CategorySuggestion[] }>({ businesses: [], categories: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 500)
  const searchRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions({ businesses: [], categories: [] })
      setIsOpen(false)
      return
    }

    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        // Abort any in-flight request
        if (abortRef.current) {
          abortRef.current.abort()
        }
        const controller = new AbortController()
        abortRef.current = controller

        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}` , { signal: controller.signal })
        const data = await res.json()
        if (data.ok) {
          setSuggestions({ businesses: data.businesses || [], categories: data.categories || [] })
          setIsOpen(true)
        }
      } catch (error) {
        if ((error as any)?.name !== 'AbortError') {
          console.error("Failed to fetch search suggestions:", error)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery])

  const handleInputClick = () => {
    if (suggestions.businesses.length > 0 || suggestions.categories.length > 0) {
      setIsOpen(true)
    }
  }

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <Input
          type="text"
          placeholder="Search for businesses or categories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClick={handleInputClick}
          className="pl-10 pr-4 py-2 w-full"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        </div>
      </div>

      {isOpen && (suggestions.businesses.length > 0 || suggestions.categories.length > 0) && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-lg">
          <CardContent className="p-2">
            <ul className="space-y-1">
              {suggestions.categories.length > 0 && (
                <li className="px-2 py-1 text-xs font-semibold text-muted-foreground">CATEGORIES</li>
              )}
              {suggestions.categories.map((category) => (
                <li key={category._id}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </Link>
                </li>
              ))}

              {suggestions.businesses.length > 0 && (
                <li className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2">BUSINESSES</li>
              )}
              {suggestions.businesses.map((business) => (
                <li key={business.id}>
                  <Link
                    href={`/business/${(business as any).slug || business.id}`}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <img 
                      src={business.logoUrl || '/placeholder.svg?height=32&width=32&query=logo'}
                      alt={`${business.name} logo`}
                      className="h-8 w-8 rounded-md object-contain bg-gray-100"
                    />
                    <div>
                      <p className="text-sm font-medium">{business.name}</p>
                      <p className="text-xs text-muted-foreground">{business.city}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
