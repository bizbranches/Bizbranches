"use client"
import { Suspense } from "react"
import { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { BusinessCard } from "@/components/business-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ListBusiness = {
  id: string
  slug: string
  name: string
  category: string
  subCategory?: string
  city: string
  address: string
  description: string
  logo?: string
  logoUrl?: string
  phone?: string
  email?: string
  status?: "pending" | "approved" | "rejected"
}

type Category = { slug: string; name: string; subcategories?: Array<{ name: string; slug: string }> }

export default function CityPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const citySlug = params.slug as string
  const cityName = useMemo(() => {
    try {
      // Fallback: capitalize slug words
      return citySlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
    } catch { return citySlug }
  }, [citySlug])

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "all")
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([])
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(searchParams.get("subcategory") || "all")

  const [businesses, setBusinesses] = useState<ListBusiness[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  const [page, setPage] = useState<number>(parseInt(searchParams.get("page") || "1"))
  const limit = 12
  const [totalPages, setTotalPages] = useState<number>(1)
  const [total, setTotal] = useState<number>(0)

  // Fetch categories for filters
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories?limit=100", { cache: "no-store" })
        const data = await res.json().catch(() => ({}))
        const list: Category[] = Array.isArray(data?.categories) ? data.categories : []
        setCategories(list.map((c: any) => ({ slug: c.slug || "", name: c.name || c.slug || "", subcategories: c.subcategories || [] })))
      } catch (_) {
        setCategories([])
      }
    }
    loadCategories()
  }, [])

  // Fetch subcategories whenever category changes
  useEffect(() => {
    // keep URL in sync when category changes
    const current = new URLSearchParams(searchParams as any)
    if (selectedCategory && selectedCategory !== "all") current.set("category", selectedCategory)
    else current.delete("category")
    current.delete("page")
    router.replace(`?${current.toString()}`)

    const run = async () => {
      setSelectedSubCategory("all")
      setSubCategoryOptions([])
      const cat = selectedCategory
      if (!cat || cat === "all") return
      try {
        const res = await fetch(`/api/categories?slug=${encodeURIComponent(cat)}`, { cache: "no-store" })
        const data = await res.json().catch(() => ({}))
        const list: string[] = Array.isArray(data?.category?.subcategories)
          ? data.category.subcategories.map((s: any) => s?.slug || s?.name).filter(Boolean)
          : []
        setSubCategoryOptions(list)
      } catch (_) {
        setSubCategoryOptions([])
      }
    }
    run()
  }, [selectedCategory])

  // Fetch businesses for city + filters
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        setLoading(true)
        setError("")
        const params = new URLSearchParams()
        params.set("city", cityName)
        if (selectedCategory !== "all") params.set("category", selectedCategory)
        if (selectedSubCategory !== "all") params.set("subcategory", selectedSubCategory)
        params.set("page", String(page))
        params.set("limit", String(limit))
        const res = await fetch(`/api/business?${params.toString()}`, { cache: "no-store", signal: controller.signal })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || data?.ok === false) throw new Error(data?.error || `Failed (${res.status})`)
        const list: ListBusiness[] = Array.isArray(data?.businesses) ? data.businesses : []
        setBusinesses(list)
        const p = data?.pagination?.pages || 1
        const t = data?.pagination?.total || list.length
        setTotalPages(p)
        setTotal(t)
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        setError(e?.message || 'Failed to load')
        setBusinesses([])
        setTotalPages(1)
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [cityName, citySlug, selectedCategory, selectedSubCategory, page])

  // Sync subcategory and page changes back to URL
  useEffect(() => {
    const current = new URLSearchParams(searchParams as any)
    if (selectedSubCategory && selectedSubCategory !== "all") current.set("subcategory", selectedSubCategory)
    else current.delete("subcategory")
    if (page && page > 1) current.set("page", String(page))
    else current.delete("page")
    router.replace(`?${current.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubCategory, page])


  return (
    <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading...</div>}>
      <div className="min-h-screen bg-background">
        <main className="px-4 py-8">
          <div className="mb-8">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-foreground mb-2">Businesses in {cityName}</h1>
              <p className="text-muted-foreground">
                {loading ? "Loading..." : `${total} businesses found`}
                {selectedCategory !== "all" && (
                  <span>
                    {" "}in {categories.find((cat) => cat.slug === selectedCategory)?.name || selectedCategory}
                  </span>
                )}
                {selectedSubCategory !== "all" && (
                  <span>{" "}› {selectedSubCategory.replace(/-/g, " ")}</span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Category:</label>
                <Select
                  value={selectedCategory}
                  onValueChange={(v) => { setSelectedCategory(v); setPage(1) }}
                >
                  <SelectTrigger className="w-56">
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

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Subcategory:</label>
                <Select
                  value={selectedSubCategory}
                  onValueChange={(v) => { setSelectedSubCategory(v); setPage(1) }}
                  disabled={selectedCategory === "all" || subCategoryOptions.length === 0}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="All Subcategories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subcategories</SelectItem>
                    {subCategoryOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/-/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-center text-red-600 mb-6">{error}</div>
          )}

          {!loading && businesses.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-foreground mb-2">No businesses found</h3>
              <p className="text-muted-foreground mb-4">
                No businesses found in {cityName}
                {selectedCategory !== "all" && (
                  <span> for {categories.find((cat) => cat.slug === selectedCategory)?.name}</span>
                )}
                {selectedSubCategory !== "all" && (
                  <span> › {selectedSubCategory.replace(/-/g, " ")}</span>
                )}
                . Try changing filters.
              </p>
              <Button onClick={() => { setSelectedCategory("all"); setSelectedSubCategory("all") }} variant="outline">
                Reset Filters
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </Button>

              <span className="text-muted-foreground">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </main>
      </div>
    </Suspense>
  )
}
