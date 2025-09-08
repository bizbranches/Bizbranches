import { NextRequest, NextResponse } from "next/server"
import { getModels } from "@/lib/models"
import { CreateReviewSchema } from "@/lib/schemas"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const bizParam = (searchParams.get("businessId") || searchParams.get("business") || "").trim()
    if (!bizParam) {
      return NextResponse.json({ ok: false, error: "businessId is required" }, { status: 400 })
    }

    const models = await getModels()

    // Resolve business by _id or slug
    let business: any = null
    try {
      const { ObjectId } = await import("mongodb")
      if (ObjectId.isValid(bizParam)) {
        business = await models.businesses.findOne({ _id: new ObjectId(bizParam) })
      }
    } catch {}
    if (!business) {
      business = await models.businesses.findOne({ slug: bizParam })
    }
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 })
    }

    const businessId = String(business._id)

    const reviews = await models.reviews
      .find({ businessId }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray()

    // Recalculate aggregates from reviews to reflect any admin edits
    const agg = await models.reviews.aggregate([
      { $match: { businessId } },
      { $group: { _id: "$businessId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]).toArray()
    const calcAvg = Number((agg[0]?.avg ?? 0).toFixed(2))
    const calcCount = Number(agg[0]?.count ?? 0)

    // Best-effort sync back to business document (do not block response)
    models.businesses.updateOne(
      { _id: business._id },
      { $set: { ratingAvg: calcAvg, ratingCount: calcCount, updatedAt: new Date() } }
    ).catch(() => {})

    const out = NextResponse.json({
      ok: true,
      reviews,
      ratingAvg: calcAvg,
      ratingCount: calcCount,
    })
    out.headers.set("Cache-Control", "no-store")
    return out
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Failed to fetch reviews" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const models = await getModels()
    const json = await req.json().catch(() => ({}))

    // Accept businessId as DB id or slug; coerce rating to number
    const candidate = {
      businessId: String(json.businessId || json.business || ""),
      name: String(json.name || "").trim(),
      rating: Number(json.rating),
      comment: String(json.comment || "").trim(),
    }

    // Resolve business first
    let business: any = null
    try {
      const { ObjectId } = await import("mongodb")
      if (candidate.businessId && ObjectId.isValid(candidate.businessId)) {
        business = await models.businesses.findOne({ _id: new ObjectId(candidate.businessId) })
      }
    } catch {}
    if (!business && candidate.businessId) {
      business = await models.businesses.findOne({ slug: candidate.businessId })
    }
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 })
    }

    const parsed = CreateReviewSchema.safeParse({
      businessId: String(business._id),
      name: candidate.name,
      rating: candidate.rating,
      comment: candidate.comment,
    })
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid review", details: parsed.error.flatten() }, { status: 400 })
    }

    const doc = {
      ...parsed.data,
      createdAt: new Date(),
    }

    await models.reviews.insertOne(doc as any)

    // Update business ratingAvg and ratingCount atomically (best-effort)
    const current = await models.businesses.findOne({ _id: business._id }, { projection: { ratingAvg: 1, ratingCount: 1 } })
    const prevAvg = Number(current?.ratingAvg || 0)
    const prevCount = Number(current?.ratingCount || 0)
    const newCount = prevCount + 1
    const newAvg = Number(((prevAvg * prevCount + doc.rating) / newCount).toFixed(2))

    await models.businesses.updateOne(
      { _id: business._id },
      { $set: { ratingAvg: newAvg, ratingCount: newCount, updatedAt: new Date() } }
    )

    const out = NextResponse.json({ ok: true, ratingAvg: newAvg, ratingCount: newCount })
    out.headers.set("Cache-Control", "no-store")
    return out
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Failed to submit review" }, { status: 500 })
  }
}
