"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, MapPin, MessageCircle, ArrowLeft, Star, Clock, Globe, Facebook, Youtube, ArrowUpRight } from "lucide-react"
import { useParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function BusinessDetailPage() {
  const params = useParams() as { id?: string; slug?: string }
  // Support both /business/[id] (id) and clean /[slug] (slug)
  const businessId = (params.id || params.slug || "") as string
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<any[]>([])
  const [ratingAvg, setRatingAvg] = useState<number>(0)
  const [ratingCount, setRatingCount] = useState<number>(0)
  const reviewsRef = useRef<HTMLDivElement | null>(null)

  // Review dialog state
  const [openReview, setOpenReview] = useState(false)
  const [reviewerName, setReviewerName] = useState("")
  const [reviewRating, setReviewRating] = useState<number>(5)
  const [reviewComment, setReviewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  // Related businesses (same category and city)
  const [related, setRelated] = useState<any[]>([])
  const [showMore, setShowMore] = useState(false)
  // Optional linked profile info
  const [profile, setProfile] = useState<{ name?: string; title?: string; avatarUrl?: string } | null>(null)
  const { toast } = useToast()

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

  // Load linked profile if provided by business document
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfile(null)
        const username = (business as any)?.profileUsername
        if (!username) return
        const res = await fetch(`/api/profile?username=${encodeURIComponent(username)}`, { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json().catch(() => ({}))
        if (json?.ok && json?.profile) {
          setProfile({
            name: json.profile.name || undefined,
            title: json.profile.title || undefined,
            avatarUrl: json.profile.avatarUrl || undefined,
          })
        }
      } catch (e) {
        // ignore
      }
    }
    loadProfile()
  }, [business])

  const initials = (full?: string) => {
    if (!full) return "JD"
    const p = full.trim().split(/\s+/)
    const first = p[0]?.[0] || ''
    const last = p.length > 1 ? p[p.length - 1][0] : ''
    return (first + last).toUpperCase() || full.slice(0, 2).toUpperCase()
  }

  // Dynamic open hours for Bank category
  const isBankCategory = String((business as any)?.category || '').toLowerCase().includes('bank')
  const now = new Date()
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' })
  const isSunday = now.getDay() === 0
  const OPEN_HOUR = 9 // 09:00
  const CLOSE_HOUR = 17 // 05:00 PM
  const currentHourFloat = now.getHours() + now.getMinutes() / 60
  const isOpenNow = !isSunday && currentHourFloat >= OPEN_HOUR && currentHourFloat < CLOSE_HOUR

  // Fetch recently added businesses in same category and city (exclude current)
  useEffect(() => {
    const fetchRelated = async () => {
      if (!business?.category) return
      try {
        const citySlug = String(business.city || '').toLowerCase().trim().replace(/\s+/g, '-')
        const params = new URLSearchParams({ category: business.category, city: citySlug, limit: '5', status: 'approved' })
        const res = await fetch(`/api/business?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          const items = (data.businesses || []).filter((b: any) => (b.id || b._id?.toString?.()) !== (business.id || business._id?.toString?.()))
          setRelated(items.slice(0, 5))
        }
      } catch (e) {
        console.error("Error fetching related businesses", e)
      }
    }
    fetchRelated()
  }, [business])

  // Fetch reviews
  const fetchReviewsNow = async () => {
    if (!businessId) return
    try {
      const res = await fetch(`/api/reviews?businessId=${businessId}`, { cache: "no-store" })
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

  useEffect(() => {
    fetchReviewsNow()
  }, [businessId])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (e) {
        // ignore if adsbygoogle not yet available
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [businessId])

  const submitReview = async () => {
    try {
      setSubmitting(true)
      // Close modal immediately for better UX
      setOpenReview(false)
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
        // Optimistically update for instant feedback
        setReviews(prev => [{ ...payload, createdAt: new Date() }, ...prev])
        setRatingAvg(data.ratingAvg || 0)
        setRatingCount(data.ratingCount || 0)
        setReviewerName("")
        setReviewRating(5)
        setReviewComment("")
        // Smoothly scroll to reviews section right away
        try { reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }) } catch {}
        console.info("Review submitted (optimistic). Scheduling refresh…")
        // Schedule a delayed refresh to avoid read-after-write race where the new review
        // hasn't propagated to the list yet. This keeps the optimistic review visible.
        setTimeout(() => {
          fetchReviewsNow().then(() => {
            console.info("Reviews refreshed after submit.")
          })
        }, 1500)
        toast({ title: "Review submitted", description: "Thanks for your feedback!" })
      } else {
        // Keep dialog closed; show error toast
        let message = "Failed to submit review"
        try { message = await res.text() } catch {}
        toast({ title: `Error (${res.status})`, description: message, variant: "destructive" })
      }
    } catch (e) {
      console.error("Error submitting review", e)
      // Keep dialog closed; show error toast
      toast({ title: "Network error", description: "Please check your connection and try again.", variant: "destructive" })
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
      <main className="w-full px-4 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Business Not Found</h1>
          <p className="text-muted-foreground">The business you're looking for doesn't exist.</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-white overflow-x-hidden">
      {/* Ad below header */}
      <div className="w-full px-4 py-4">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-4083132987699578"
          data-ad-slot="3877186043"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-white border-b overflow-x-hidden">
        <div className="w-full px-4 md:px-8 lg:px-12 py-8">
          <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-6 min-h-[9rem] md:min-h-[11rem]">
            {/* Logo box */}
            <div className="flex-shrink-0 flex md:block justify-center">
              <div className="w-28 h-28 md:w-40 md:h-auto self-stretch rounded-xl border bg-white shadow-sm flex items-center justify-center overflow-hidden">
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

            {/* Title and meta - constrain to 60% width on desktop */}
            <div className="flex flex-col justify-center text-center md:text-left md:flex-none md:basis-[60%] md:max-w-[60%]">
              {/* Mobile: Category and Reviews on separate lines */}
              <div className="flex flex-col md:flex-row md:flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 mb-2">
                <Badge variant="secondary" className="bg-primary text-primary-foreground px-3 py-1">
                  {business.category}
                </Badge>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {ratingCount > 0 ? (
                    <>
                      <span className="font-medium">{ratingAvg.toFixed(1)}</span>
                      <span className="text-muted-foreground">({ratingCount} reviews)</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No reviews yet</span>
                  )}
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-2 md:mt-0 mb-1 leading-tight flex items-center gap-3 flex-wrap justify-center md:justify-start">
                <span className="break-words max-w-full">{business.name}</span>
                {business.status === 'pending' && (
                  <span className="inline-flex items-center rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
                    Approval pending
                  </span>
                )}
              </h1>
              <div className="flex items-start text-muted-foreground justify-center md:justify-start mb-2">
                <MapPin className="h-5 w-5 mr-2" />
                <span className="text-base md:text-lg break-words whitespace-normal">{business.address}</span>
              </div>
            </div>

            {/* Right-side profile card (matches header height) */}
            {false && (
              <div className="hidden md:block w-full md:w-72 relative">
                {/* Half-outside profile avatar at top-left corner */}
                <div className="absolute -left-10 top-0 -translate-y-1/2 z-10 w-24 h-24 rounded-full bg-muted border shadow-lg flex items-center justify-center text-xl font-semibold text-foreground overflow-hidden">
                  {profile?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatarUrl} alt={profile?.name || "Profile"} className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials(profile?.name)}</span>
                  )}
                </div>
                <Card className="self-stretch h-full shadow-sm border-rose-200/70 bg-white/80 backdrop-blur-sm rounded-xl">
                  <CardContent className="h-full p-4 pl-6 pt-12 flex flex-col items-center justify-center text-center">
                    {/* Profile name and title (fallbacks if missing) */}
                    <div className="font-semibold text-foreground">{profile?.name || "Profile"}</div>
                    <div className="text-sm text-muted-foreground mb-3">{profile?.title || "Business Representative"}</div>
                    {/* Social icons */}
                    <div className="flex items-center gap-3">
                      <a href="#" aria-label="Website" className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
                        <Globe className="h-4 w-4" />
                      </a>
                      <a href="#" aria-label="Facebook" className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition">
                        <Facebook className="h-4 w-4" />
                      </a>
                      <a href="#" aria-label="YouTube" className="p-2 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 transition">
                        <Youtube className="h-4 w-4" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Ad below business name section */}
      <div className="w-full px-4 py-4">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-4083132987699578"
          data-ad-slot="3877186043"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>

      <main className="w-full px-4 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          {/* City / Category / Subcategory breadcrumb moved here */}
          <div className="text-sm">
            {(() => {
              const city = String(business.city || "")
              const category = String(business.category || "")
              const sub = business.subCategory ? String(business.subCategory) : ""
              const catSlug = category.toLowerCase().replace(/\s+/g, "-")
              const subSlug = sub ? sub.toLowerCase().replace(/\s+/g, "-") : ""
              return (
                <div className="flex items-center gap-2 flex-wrap">
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
                <DialogClose asChild>
                  <Button onClick={submitReview} disabled={submitting || reviewComment.trim().length < 3}>Submit</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>



        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            {/* About Section (replaces image gallery) */}
            <Card className="shadow-sm border-rose-200 bg-rose-50 rounded-xl">
              <CardContent className="p-8">
                <h2 className="text-xl md:text-3xl font-bold text-foreground mb-3 md:mb-4">About {business.name}</h2>
                {(() => {
                  const desc = business.description || "No description provided yet."
                  const isLong = desc.length > 220
                  return (
                    <div className="max-w-none text-foreground">
                      <p className={`${!showMore ? 'line-clamp-4' : ''} text-sm md:text-base leading-relaxed whitespace-pre-line break-words`}> 
                        {desc}
                      </p>
                      {isLong && (
                        <button
                          type="button"
                          onClick={() => setShowMore((v) => !v)}
                          className="mt-2 text-primary text-sm md:text-base font-medium hover:underline"
                          aria-expanded={showMore}
                        >
                          {showMore ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  )
                })()}
                {/* Bank Details: show directly below description when category is Bank and fields exist */}
                {(() => {
                  const isBank = String(business.category || '').toLowerCase().includes('bank')
                  const hasAny = Boolean(business.swiftCode || business.branchCode || business.cityDialingCode || business.iban)
                  if (!isBank || !hasAny) return null
                  return (
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold text-foreground mb-4">Bank Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            className="group block p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors md:col-span-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1 overflow-x-auto">
                                <div className="text-sm text-muted-foreground">IBAN</div>
                                <div className="font-medium text-foreground underline whitespace-nowrap">{business.iban}</div>
                              </div>
                              <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </div>
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })()}

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-rose-50 rounded-lg border border-rose-200">
                    <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h4 className="font-semibold text-foreground">Open Hours</h4>
                    {isBankCategory ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground">{weekday}</div>
                        <div className="text-sm text-muted-foreground">
                          {isSunday ? 'Closed' : '09:00 AM - 05:00 PM'}
                        </div>
                        <div className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold ${isOpenNow ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {isOpenNow ? 'Open now' : 'Closed now'}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">9:00 AM - 6:00 PM</p>
                    )}
                  </div>
                  <div className="text-center p-4 bg-rose-50 rounded-lg border border-rose-200">
                    <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <h4 className="font-semibold text-foreground">Customer Rating</h4>
                    <p className="text-sm text-muted-foreground">
                      {ratingCount > 0 ? `${ratingAvg.toFixed(1)} (${ratingCount} reviews)` : 'No reviews yet'}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-rose-50 rounded-lg border border-rose-200">
                    <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h4 className="font-semibold text-foreground">City</h4>
                    <p className="text-sm text-muted-foreground">{business.city}{business.postalCode ? ` (${business.postalCode})` : ''}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ad below about section */}
            <div className="w-full px-4 py-4">
              <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-4083132987699578"
                data-ad-slot="3877186043"
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            </div>

            {/* Reviews Section moved up into left column to utilize space */}
            <Card className="shadow-sm border-rose-200 bg-rose-50 rounded-xl">
              <CardContent className="p-8" ref={reviewsRef as any}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
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
                  <div className="sm:self-auto">
                    <Button onClick={() => setOpenReview(true)} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">Leave Review</Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {reviews.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">No reviews yet.</div>
                  )}
                  {[...reviews]
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((r, idx) => (
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

          <div className="xl:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Contact Card */}
              <Card className="shadow-sm border-rose-200 bg-rose-50 rounded-xl">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-6 text-center">Get In Touch</h3>

                  <div className="space-y-4">
                    {business.phone && (
                      <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-primary/20 rounded-lg">
                              <Phone className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">Phone</p>
                              <p className="text-sm text-muted-foreground truncate">{business.phone}</p>
                              {(business.contactPerson || (business as any).contactPersonName) && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Contact: {business.contactPerson || (business as any).contactPersonName}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button size="sm" className="bg-primary hover:bg-primary/90 justify-self-end w-24 h-8 px-3 text-sm" asChild>
                            <a href={`tel:${business.phone}`}>Call</a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {business.websiteUrl && (
                      <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-slate-200 rounded-lg">
                              <Globe className="h-5 w-5 text-slate-700" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">Website</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[180px]">{business.websiteUrl}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="justify-self-end w-24 h-8 px-3 text-sm" asChild>
                            <a href={business.websiteUrl} target="_blank" rel="noopener noreferrer">Visit</a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {business.facebookUrl && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-blue-200 rounded-lg">
                              <Facebook className="h-5 w-5 text-blue-700" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">Facebook</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[180px]">{business.facebookUrl}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white justify-self-end w-24 h-8 px-3 text-sm" asChild>
                            <a href={business.facebookUrl} target="_blank" rel="noopener noreferrer">Open</a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {business.gmbUrl && (
                      <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-emerald-200 rounded-lg">
                              <MapPin className="h-5 w-5 text-emerald-700" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">Google Business</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[180px]">{business.gmbUrl}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white justify-self-end w-24 h-8 px-3 text-sm" asChild>
                            <a href={business.gmbUrl} target="_blank" rel="noopener noreferrer">Open</a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {business.youtubeUrl && (
                      <div className="p-4 bg-gradient-to-r from-rose-50 to-rose-100 rounded-xl border border-rose-200">
                        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-rose-200 rounded-lg">
                              <Youtube className="h-5 w-5 text-rose-700" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">YouTube</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[180px]">{business.youtubeUrl}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white justify-self-end w-24 h-8 px-3 text-sm" asChild>
                            <a href={business.youtubeUrl} target="_blank" rel="noopener noreferrer">Open</a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {business.whatsapp && (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-green-200 rounded-lg">
                              <MessageCircle className="h-5 w-5 text-green-700" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">WhatsApp</p>
                              <p className="text-sm text-muted-foreground">{business.whatsapp}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white justify-self-end w-24 h-8 px-3 text-sm" asChild>
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
                        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-blue-200 rounded-lg">
                              <Mail className="h-5 w-5 text-blue-700" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">Email</p>
                              <p className="text-sm text-muted-foreground">{business.email}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white justify-self-end w-24 h-8 px-3 mb-6  text-sm" asChild>
                            <a href={`mailto:${business.email}`}>Email</a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recently Added in same category and city */}
              {related.length > 0 && (
                <Card className="shadow-sm border-rose-200 bg-rose-50 rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm md:text-base text-foreground">Recently added in {business.category} in {business.city}</h4>
                    </div>
                    <div className="space-y-2">
                      {related.slice(0, 5).map((b, i) => (
                        <Link
                          key={(b.id || b._id) + '-' + i}
                          href={`/${b.slug || b.id || b._id}`}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-white/70 hover:bg-white transition-colors"
                        >
                          <div className="w-10 h-10 rounded bg-white border overflow-hidden flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={b.logoUrl || (b as any).logo || b.imageUrl || "/bank-branch.png"}
                              alt={b.name}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-foreground line-clamp-2">{b.name}</div>
                            <div className="text-xs text-muted-foreground truncate capitalize">{b.city}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

      </main>
      
      {/* Ad above footer */}
      <div className="w-full px-4 py-4">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-4083132987699578"
          data-ad-slot="3877186043"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>

    </div>
  )
}
