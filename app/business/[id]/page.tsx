"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, MapPin, MessageCircle, ArrowLeft, Star, Clock, Globe, Facebook, Youtube, ArrowUpRight } from "lucide-react"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function BusinessDetailPage() {
  const params = useParams()
  const businessId = params.id as string
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<any[]>([])
  const [ratingAvg, setRatingAvg] = useState<number>(0)
  const [ratingCount, setRatingCount] = useState<number>(0)

  // Review dialog state
  const [openReview, setOpenReview] = useState(false)
  const [reviewerName, setReviewerName] = useState("")
  const [reviewRating, setReviewRating] = useState<number>(5)
  const [reviewComment, setReviewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  // Related businesses (same category)
  const [related, setRelated] = useState<any[]>([])
  const [rotateIndex, setRotateIndex] = useState(0)

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/business?id=${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setBusiness(data.business)
        }
      } catch (error) {
        console.error("Error fetching business:", error)
      } finally {
        setLoading(false)
      }
    }

    if (businessId) {
      fetchBusiness()
    }
  }, [businessId])

  // Fetch recently added businesses in same category (exclude current)
  useEffect(() => {
    const fetchRelated = async () => {
      if (!business?.category) return
      try {
        const params = new URLSearchParams({ category: business.category, limit: "12", status: "approved" })
        const res = await fetch(`/api/business?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          const items = (data.businesses || []).filter((b: any) => (b.id || b._id?.toString?.()) !== (business.id || business._id?.toString?.()))
          setRelated(items)
        }
      } catch (e) {
        console.error("Error fetching related businesses", e)
      }
    }
    fetchRelated()
  }, [business])

  // Auto-rotate visible related businesses every 4s
  useEffect(() => {
    if (!related || related.length <= 3) return
    const t = setInterval(() => {
      setRotateIndex((idx) => (idx + 1) % related.length)
    }, 4000)
    return () => clearInterval(t)
  }, [related])

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!businessId) return
      try {
        const res = await fetch(`/api/reviews?businessId=${businessId}`)
        if (res.ok) {
          const data = await res.json()
          setReviews(data.reviews || [])
          setRatingAvg(data.ratingAvg || 0)
          setRatingCount(data.ratingCount || 0)
        }
      } catch (e) {
        console.error("Error fetching reviews", e)
      }
    }
    fetchReviews()
  }, [businessId])

  const submitReview = async () => {
    try {
      setSubmitting(true)
      const payload = {
        businessId,
        name: reviewerName.trim() || "Anonymous",
        rating: reviewRating,
        comment: reviewComment.trim(),
      }
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        // Optimistically update
        setReviews(prev => [{ ...payload, createdAt: new Date() }, ...prev])
        setRatingAvg(data.ratingAvg || 0)
        setRatingCount(data.ratingCount || 0)
        setOpenReview(false)
        setReviewerName("")
        setReviewRating(5)
        setReviewComment("")
      }
    } catch (e) {
      console.error("Error submitting review", e)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading business details...</p>
        </div>
      </main>
    )
  }

  if (!business) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Business Not Found</h1>
          <p className="text-muted-foreground mb-4">The business you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">

      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-stretch gap-6 min-h-[9rem] md:min-h-[11rem]">
            {/* Logo box */}
            <div className="flex-shrink-0">
              <div className="w-36 md:w-40 self-stretch rounded-xl border bg-white shadow-sm flex items-center justify-center overflow-hidden">
                {(() => {
                  const raw = (business.logoUrl || (business as any).logo || business.imageUrl || "") as string
                  const src = (() => {
                    if (/^https?:\/\//i.test(raw)) return raw
                    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string | undefined
                    if (!raw) return "/bank-branch.png"
                    if (!cloudName) return "/bank-branch.png"
                    const cleanId = raw.replace(/\.[^/.]+$/, "")
                    return `https://res.cloudinary.com/${cloudName}/image/upload/c_fit,w_200,h_200,q_auto,f_auto/${cleanId}`
                  })()
                  // eslint-disable-next-line @next/next/no-img-element
                  return (
                    <img
                      src={src}
                      alt={`${business.name} logo`}
                      className="h-full w-full object-contain p-2"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/bank-branch.png" }}
                    />
                  )
                })()}
              </div>
            </div>

            {/* Title and meta - stretches to same height as logo box */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary" className="bg-primary text-primary-foreground px-3 py-1">
                  {business.category}
                </Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {ratingCount > 0 ? (
                    <>
                      <span className="text-sm font-medium">{ratingAvg.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">({ratingCount} reviews)</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">No reviews yet</span>
                  )}
                </div>
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-2 leading-tight flex items-center gap-3">
                <span className="truncate">{business.name}</span>
                {business.status === 'pending' && (
                  <span className="inline-flex items-center rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
                    Approval pending
                  </span>
                )}
              </h1>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-5 w-5 mr-2" />
                <span className="text-lg">{business.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          {/* City / Category / Subcategory breadcrumb moved here */}
          <div className="text-sm">
            {(() => {
              const city = String(business.city || "")
              const category = String(business.category || "")
              const sub = business.subCategory ? String(business.subCategory) : ""
              const catSlug = category.toLowerCase().replace(/\s+/g, "-")
              const subSlug = sub ? sub.toLowerCase().replace(/\s+/g, "-") : ""
              return (
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="h-7 rounded-full px-3 bg-red-100 text-red-700 hover:bg-red-200 border-transparent transition-colors">
                    <Link href={`/city/${city}`}>
                      <span className="capitalize">{city}</span>
                    </Link>
                  </Button>
                  <span className="text-muted-foreground">&gt;</span>
                  <Button asChild variant="outline" size="sm" className="h-7 rounded-full px-3 bg-red-100 text-red-700 hover:bg-red-200 border-transparent transition-colors">
                    <Link href={`/category/${catSlug}`}>
                      <span className="capitalize">{category.replace(/-/g, " ")}</span>
                    </Link>
                  </Button>
                  {sub && (
                    <>
                      <span className="text-muted-foreground">&gt;</span>
                      <Button asChild variant="outline" size="sm" className="h-7 rounded-full px-3 bg-red-100 text-red-700 hover:bg-red-200 border-transparent transition-colors">
                        <Link href={`/category/${catSlug}?subcategory=${encodeURIComponent(subSlug)}`}>
                          <span className="capitalize">{sub.replace(/-/g, " ")}</span>
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              )
            })()}
          </div>
          <Dialog open={openReview} onOpenChange={setOpenReview}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">Leave a review</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Leave a review</DialogTitle>
                <DialogDescription>Share your experience for {business.name}.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" placeholder="Optional" value={reviewerName} onChange={e => setReviewerName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setReviewRating(n)}
                        className="p-1"
                        aria-label={`Rate ${n} star`}
                      >
                        <Star className={`h-6 w-6 ${n <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      </button>
                    ))}
                    <span className="text-sm text-muted-foreground ml-1">{reviewRating} / 5</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea id="comment" placeholder="Write your review..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={4} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenReview(false)} disabled={submitting}>Cancel</Button>
                <Button onClick={submitReview} disabled={submitting || reviewComment.trim().length < 3}>Submit</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 space-y-8">
            {/* About Section (replaces image gallery) */}
            <Card className="shadow-lg border-primary/10">
              <CardContent className="p-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">About {business.name}</h2>
                <div className="prose prose-sm md:prose-base max-w-none text-foreground">
                  <p className="leading-relaxed text-balance">
                    {business.description || "No description provided yet."}
                  </p>
                </div>

                {/* Bank Details: show directly below description when category is Bank and fields exist */}
                {(() => {
                  const isBank = String(business.category || '').toLowerCase().includes('bank')
                  const hasAny = Boolean(business.swiftCode || business.branchCode || business.cityDialingCode || business.iban)
                  if (!isBank || !hasAny) return null
                  return (
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold text-foreground mb-4">Bank Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {business.swiftCode && (
                          <div className="p-4 rounded-lg border bg-muted/50">
                            <div className="text-sm text-muted-foreground">Swift Code</div>
                            <div className="font-medium text-foreground break-all">{business.swiftCode}</div>
                          </div>
                        )}
                        {business.branchCode && (
                          <div className="p-4 rounded-lg border bg-muted/50">
                            <div className="text-sm text-muted-foreground">Branch Code</div>
                            <div className="font-medium text-foreground break-all">{business.branchCode}</div>
                          </div>
                        )}
                        {business.cityDialingCode && (
                          <div className="p-4 rounded-lg border bg-muted/50">
                            <div className="text-sm text-muted-foreground">City Dialing Code</div>
                            <div className="font-medium text-foreground break-all">{business.cityDialingCode}</div>
                          </div>
                        )}
                        {business.iban && (
                          <a
                            href={(String(business.iban).startsWith("http://") || String(business.iban).startsWith("https://")) ? String(business.iban) : `https://${business.iban}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm text-muted-foreground">IBAN</div>
                                <div className="font-medium text-foreground break-all underline">{business.iban}</div>
                              </div>
                              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </div>
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })()}

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h4 className="font-semibold text-foreground">Open Hours</h4>
                    <p className="text-sm text-muted-foreground">9:00 AM - 6:00 PM</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <h4 className="font-semibold text-foreground">Customer Rating</h4>
                    <p className="text-sm text-muted-foreground">
                      {ratingCount > 0 ? `${ratingAvg.toFixed(1)} (${ratingCount} reviews)` : 'No reviews yet'}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h4 className="font-semibold text-foreground">City</h4>
                    <p className="text-sm text-muted-foreground">{business.city}{business.postalCode ? ` (${business.postalCode})` : ''}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services/Features */}
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-foreground mb-6">Services & Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    "Professional Service",
                    "Quality Guaranteed",
                    "24/7 Support",
                    "Free Consultation",
                    "Expert Team",
                    "Competitive Pricing",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm font-medium text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Contact Card */}
              <Card className="shadow-lg border-primary/20">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-6 text-center">Get In Touch</h3>

                  <div className="space-y-4">
                    {business.phone && (
                      <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-2 bg-primary/20 rounded-lg mr-3">
                              <Phone className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">Phone</p>
                              <p className="text-sm text-muted-foreground">{business.phone}</p>
                              {(business.contactPerson || (business as any).contactPersonName) && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Contact: {business.contactPerson || (business as any).contactPersonName}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
                            <a href={`tel:${business.phone}`}>Call</a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {business.websiteUrl && (
                      <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-2 bg-slate-200 rounded-lg mr-3">
                              <Globe className="h-5 w-5 text-slate-700" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">Website</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[180px]">{business.websiteUrl}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={business.websiteUrl} target="_blank" rel="noopener noreferrer">Visit</a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {business.facebookUrl && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-200 rounded-lg mr-3">
                              <Facebook className="h-5 w-5 text-blue-700" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">Facebook</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[180px]">{business.facebookUrl}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                            <a href={business.facebookUrl} target="_blank" rel="noopener noreferrer">Open</a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {business.gmbUrl && (
                      <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-2 bg-emerald-200 rounded-lg mr-3">
                              <MapPin className="h-5 w-5 text-emerald-700" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">Google Business</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[180px]">{business.gmbUrl}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                            <a href={business.gmbUrl} target="_blank" rel="noopener noreferrer">Open</a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {business.youtubeUrl && (
                      <div className="p-4 bg-gradient-to-r from-rose-50 to-rose-100 rounded-xl border border-rose-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-2 bg-rose-200 rounded-lg mr-3">
                              <Youtube className="h-5 w-5 text-rose-700" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">YouTube</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[180px]">{business.youtubeUrl}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" asChild>
                            <a href={business.youtubeUrl} target="_blank" rel="noopener noreferrer">Open</a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {business.whatsapp && (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-2 bg-green-200 rounded-lg mr-3">
                              <MessageCircle className="h-5 w-5 text-green-700" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">WhatsApp</p>
                              <p className="text-sm text-muted-foreground">{business.whatsapp}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" asChild>
                            <a
                              href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Message
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {business.email && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-200 rounded-lg mr-3">
                              <Mail className="h-5 w-5 text-blue-700" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">Email</p>
                              <p className="text-sm text-muted-foreground">{business.email}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                            <a href={`mailto:${business.email}`}>Email</a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recently Added in same category */}
              {related.length > 0 && (
                <Card className="shadow-lg border-primary/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-foreground">Recently added in {business.category}</h4>
                    </div>
                    <div className="space-y-4">
                      {(() => {
                        const visibleCount = Math.min(4, related.length)
                        const items: any[] = []
                        for (let i = 0; i < visibleCount; i++) {
                          const idx = (rotateIndex + i) % related.length
                          items.push(related[idx])
                        }
                        return items
                      })().map((b, i) => (
                        <Link key={(b.id || b._id) + '-' + i} href={`/business/${b.slug || b.id || b._id}`}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="w-12 h-12 rounded-md bg-white border overflow-hidden flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={b.logoUrl || (b as any).logo || b.imageUrl || "/bank-branch.png"} alt={b.name} className="w-full h-full object-contain p-1" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">{b.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{b.city}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions Card */}
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <h4 className="font-bold text-foreground mb-4 text-center">Explore More</h4>
                  <div className="space-y-3">
                    <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                      <Link href={`/category/${business.category.toLowerCase().replace(/\s+/g, "-")}`}>
                        Similar Businesses
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-primary text-primary hover:bg-primary/10 bg-transparent"
                      asChild
                    >
                      <Link href={`/city/${business.city}`}>
                        More in {business.city.charAt(0).toUpperCase() + business.city.slice(1)}
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/add">Add Your Business</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>

        {/* Reviews Section - match left column width, leave right empty */}
        <section className="mt-12">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
            <div className="xl:col-span-2">
              <Card className="shadow-lg border-primary/10">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground">Reviews</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        {ratingCount > 0 ? (
                          <span className="text-sm text-muted-foreground">{ratingAvg.toFixed(1)} average based on {ratingCount} review{ratingCount>1?'s':''}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No reviews yet. Be the first to review.</span>
                        )}
                      </div>
                    </div>
                    <Button onClick={() => setOpenReview(true)} className="bg-primary hover:bg-primary/90">Leave a review</Button>
                  </div>

                  <div className="space-y-6">
                    {reviews.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">No reviews yet.</div>
                    )}
                    {reviews.map((r, idx) => (
                      <div key={idx} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-foreground">{r.name || 'Anonymous'}</div>
                          <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} className={`h-4 w-4 ${n <= (r.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                          ))}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="hidden xl:block" />
          </div>
        </section>
      </main>

    </div>
  )
}
