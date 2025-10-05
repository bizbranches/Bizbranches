import BusinessDetailPage from "../business/[id]/page"
import { getModels } from "@/lib/models"
import { headers } from "next/headers"

function serializeId(doc: any): any {
  if (!doc) return doc
  if (Array.isArray(doc)) return doc.map(serializeId)
  if (typeof doc !== 'object') return doc
  // Handle Buffer, ObjectId, or objects with toJSON
  if (typeof doc.toJSON === 'function') {
    try {
      const jsonVal = doc.toJSON()
      if (typeof jsonVal === 'object') return serializeId(jsonVal)
      return jsonVal
    } catch {}
  }
  const out: any = {}
  for (const key in doc) {
    if (key === '_id') {
      out.id = String(doc._id)
      continue
    }
    const val = doc[key]
    if (val && typeof val === 'object') {
      // Buffer, ObjectId, or objects with toJSON
      if (typeof val.toJSON === 'function') {
        try {
          const jsonVal = val.toJSON()
          out[key] = typeof jsonVal === 'object' ? serializeId(jsonVal) : jsonVal
        } catch {
          out[key] = String(val)
        }
      } else {
        out[key] = serializeId(val)
      }
    } else {
      out[key] = val
    }
  }
  return out
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const models = await getModels()
  const biz = await models.businesses.findOne({ $or: [{ slug }, { id: slug }] as any })
  const b: any = serializeId(biz)

  // Resolve request domain for title formatting: domain/business-name
  const hdrs = await headers()
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "bizbranches.local"
  const domain = host.replace(/^(https?:\/\/)?/i, "").replace(/\/$/, "")

  const businessName = b?.name || slug
  const title = `${domain}/${businessName}`
  const rawDesc = typeof b?.description === "string" ? b.description : "Discover local businesses on BizBranches."
  const normalized = rawDesc.replace(/\s+/g, " ").trim()
  const description = normalized.length > 220 ? `${normalized.slice(0, 217)}...` : normalized

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  }
}

export default async function BusinessBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const models = await getModels()

  // Business
  const bizDoc = await models.businesses.findOne({ $or: [{ slug }, { id: slug }] as any })
  const business: any = serializeId(bizDoc)

  // Related (same category and city)
  let related: any[] = []
  if (business?.category) {
    const rel = await models.businesses
      .find({
        category: business.category,
        city: business.city,
        status: "approved",
        slug: { $ne: business.slug },
      } as any)
      .sort({ createdAt: -1 })
      .limit(2)
      .toArray()
    related = rel.map(serializeId)
  }

  // Reviews + aggregates
  const list = await models.reviews
    .find({ businessId: business?.id || slug } as any)
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()
  const reviews: any[] = list.map(serializeId)
  const ratingCount = reviews.length
  const ratingAvg = ratingCount
    ? reviews.reduce((sum, r: any) => sum + (Number(r.rating) || 0), 0) / ratingCount
    : 0

  return (
    <BusinessDetailPage
      initialBusiness={business}
      initialReviews={reviews}
      initialRatingAvg={ratingAvg}
      initialRatingCount={ratingCount}
      initialRelated={related}
    />
  )
}
