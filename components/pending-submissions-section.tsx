"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export type PendingBiz = {
  id: string
  slug?: string
  name: string
  category: string
  city: string
  address: string
  description: string
  logoUrl?: string
  imageUrl?: string
  status?: "pending" | "approved" | "rejected"
}

export function PendingSubmissionsSection() {
  const [items, setItems] = useState<PendingBiz[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        // Show latest 6 pending submissions
        const res = await fetch(`/api/business?status=pending&limit=6`, { cache: "no-store" })
        const data = await res.json()
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load pending submissions")
        const mapped: PendingBiz[] = (data.businesses || []).map((b: any) => ({
          id: b.id || b._id?.toString?.() || "",
          slug: b.slug,
          name: b.name,
          category: b.category,
          city: b.city,
          address: b.address,
          description: b.description,
          logoUrl: b.logoUrl,
          imageUrl: b.imageUrl,
          status: b.status,
        }))
        if (active) setItems(mapped)
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load pending submissions")
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  if (loading) return null
  if (error) return null
  if (!items.length) return null

  return (
    <section className="py-12 md:py-16 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Pending Approval</h2>
            <p className="text-muted-foreground">Newly submitted businesses awaiting admin review</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/search?status=pending">View all pending</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((b) => (
            <Card key={b.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-lg border bg-white overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.logoUrl || b.imageUrl || "/placeholder.svg?height=64&width=64&text=Logo"}
                      alt={`${b.name} logo`}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg truncate">{b.name}</h3>
                      <span className="inline-flex items-center rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                        Pending
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {b.category} • <span className="capitalize">{b.city}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{b.description}</p>
                    <div className="mt-3">
                      <Button asChild size="sm">
                        <Link href={`/business/${b.slug || b.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
