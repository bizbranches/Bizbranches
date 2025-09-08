"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ChevronsUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Compact top filters/search bar
export function GlobalTopbar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Hide on homepage, business detail pages, and Add Business page
  const hidden = useMemo(() => {
    if (!pathname) return false
    if (pathname === "/") return true
    if (pathname.startsWith("/business/")) return true
    if (pathname.startsWith("/add")) return true
    return false
  }, [pathname])

  const [q, setQ] = useState<string>(searchParams.get("q") || "")
  const [city, setCity] = useState<string>(searchParams.get("city") || "all")
  const [category, setCategory] = useState<string>(searchParams.get("category") || "all")
  const [subcategory, setSubcategory] = useState<string>(searchParams.get("subcategory") || "all")

  const [categories, setCategories] = useState<Array<{ slug: string; name: string }>>([])
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [citiesList, setCitiesList] = useState<Array<{ value: string; label: string }>>([])
  const [loadingCities, setLoadingCities] = useState(true)
  const [cityOpen, setCityOpen] = useState(false)
  const [cityQuery, setCityQuery] = useState("")

  // Load categories
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/categories?limit=200`, { cache: "no-store" })
        const data = await res.json().catch(() => ({}))
        const list = Array.isArray(data?.categories) ? data.categories : []
        if (alive) setCategories(list.map((c: any) => ({ slug: c.slug, name: c.name || c.slug })))
      } catch {
        if (alive) setCategories([])
      }
    })()
    return () => { alive = false }
  }, [])

  // Load cities from API (remove hardcoded list) with session cache for faster open
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoadingCities(true)
        // try session cache first
        try {
          const raw = sessionStorage.getItem("topbar:cities")
          if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed?.data)) setCitiesList(parsed.data)
          }
        } catch {}
        const res = await fetch('/api/cities', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        const list: Array<{ id: string; name: string }> = Array.isArray(data?.cities) ? data.cities : []
        if (alive) {
          const mapped = list.map(c => ({ value: c.name.toLowerCase().replace(/\s+/g, '-'), label: c.name }))
          setCitiesList(mapped)
          try { sessionStorage.setItem("topbar:cities", JSON.stringify({ data: mapped })) } catch {}
        }
      } catch {
        if (alive) setCitiesList([])
      } finally {
        if (alive) setLoadingCities(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // Load subcategories when category changes
  useEffect(() => {
    let alive = true
    ;(async () => {
      setSubcategory("all")
      setSubcategories([])
      if (!category || category === "all") return
      try {
        const res = await fetch(`/api/categories?slug=${encodeURIComponent(category)}`, { cache: "no-store" })
        const data = await res.json().catch(() => ({}))
        const list: string[] = Array.isArray(data?.category?.subcategories)
          ? data.category.subcategories.map((s: any) => s?.slug || s?.name).filter(Boolean)
          : []
        if (alive) setSubcategories(list)
      } catch {
        if (alive) setSubcategories([])
      }
    })()
    return () => { alive = false }
  }, [category])

  const apply = (e?: React.FormEvent) => {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    if (city !== "all") params.set("city", city)
    if (category !== "all") params.set("category", category)
    if (subcategory !== "all") params.set("subcategory", subcategory)

    // If on a city page, prefer staying on it
    if (pathname?.startsWith("/city/")) {
      const base = pathname
      const url = params.toString() ? `${base}?${params.toString()}` : base
      router.push(url)
    } else {
      const url = params.toString() ? `/search?${params.toString()}` : "/search"
      router.push(url)
    }
  }

  if (hidden) return null

  return (
    <div className="w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <form onSubmit={apply} className="mx-auto w-full md:w-[70%] px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-0">
            <Input placeholder="Search businesses or categories..." value={q} onChange={(e) => setQ(e.target.value)} className="w-full" />
          </div>

          <Popover open={cityOpen} onOpenChange={setCityOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="w-full sm:w-[220px] justify-between">
                <span className="truncate">{city !== "all" ? (citiesList.find(x => x.value === city)?.label || city) : (loadingCities ? "Loading cities..." : "City")}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command shouldFilter={false}>
                <CommandInput placeholder="Search city..." value={cityQuery} onValueChange={setCityQuery} className="h-9" />
                <CommandEmpty>{loadingCities ? "Loading..." : "No city found."}</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    {/* Render at most 100 items to keep it snappy */}
                    {citiesList
                      .filter(c => cityQuery.trim() === "" || c.label.toLowerCase().includes(cityQuery.trim().toLowerCase()))
                      .slice(0, 100)
                      .map((c) => (
                        <CommandItem
                          key={c.value}
                          value={c.value}
                          onSelect={(val) => { setCity(val); setCityOpen(false); setCityQuery("") }}
                        >
                          {c.label}
                        </CommandItem>
                      ))}
                    <CommandItem value="all" onSelect={() => { setCity("all"); setCityOpen(false); setCityQuery("") }}>All Cities</CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={subcategory} onValueChange={setSubcategory} disabled={category === "all" || subcategories.length === 0}>
            <SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Subcategory" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subcategories</SelectItem>
              {subcategories.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/-/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="submit" variant="default" className="w-full sm:w-auto">Apply</Button>
        </div>
      </form>
    </div>
  )
}
