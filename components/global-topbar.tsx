"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Compact top filters/search bar
export function GlobalTopbar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Hide on homepage and business detail pages
  const hidden = useMemo(() => {
    if (!pathname) return false
    if (pathname === "/") return true
    if (pathname.startsWith("/business/")) return true
    return false
  }, [pathname])

  const [q, setQ] = useState<string>(searchParams.get("q") || "")
  const [city, setCity] = useState<string>(searchParams.get("city") || "all")
  const [category, setCategory] = useState<string>(searchParams.get("category") || "all")
  const [subcategory, setSubcategory] = useState<string>(searchParams.get("subcategory") || "all")

  const [categories, setCategories] = useState<Array<{ slug: string; name: string }>>([])
  const [subcategories, setSubcategories] = useState<string[]>([])

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
      <form onSubmit={apply} className="mx-auto w-[70%] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[220px]">
            <Input placeholder="Search businesses or categories..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {[
                "karachi","lahore","islamabad","rawalpindi","faisalabad","multan","peshawar","quetta","sialkot","gujranwala",
              ].map((c) => (
                <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={subcategory} onValueChange={setSubcategory} disabled={category === "all" || subcategories.length === 0}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Subcategory" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subcategories</SelectItem>
              {subcategories.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/-/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="submit" variant="default">Apply</Button>
        </div>
      </form>
    </div>
  )
}
