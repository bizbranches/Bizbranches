import { NextRequest, NextResponse } from "next/server"
import { getModels } from "@/lib/models"
import { CreateReviewSchema } from "@/lib/schemas"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get("businessId")
    if (!businessId) {
      return NextResponse.json({ ok: false, error: "businessId is required" }, { status: 400 })
    }

    const models = await getModels()

    const reviews = await models.reviews
      .find({ businessId })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    // Aggregate
    const agg = await models.reviews.aggregate([
      { $match: { businessId } },
      { $group: { _id: "$businessId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]).toArray()

    const ratingAvg = agg[0]?.avg ?? 0
    const ratingCount = agg[0]?.count ?? 0

    return NextResponse.json({ ok: true, reviews, ratingAvg, ratingCount })
  } catch (err) {
    console.error("GET /api/reviews error", err)
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = CreateReviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { businessId, name, rating, comment } = parsed.data

    const models = await getModels()

    const doc = {
      businessId,
      name,
      rating,
      comment,
      createdAt: new Date(),
    }

    await models.reviews.insertOne(doc as any)

    // Update business aggregates atomically based on fresh aggregation
    const agg = await models.reviews.aggregate([
      { $match: { businessId } },
      { $group: { _id: "$businessId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]).toArray()

    const ratingAvg = agg[0]?.avg ?? 0
    const ratingCount = agg[0]?.count ?? 0

    await models.businesses.updateOne(
      { _id: (await import("mongodb")).ObjectId.createFromHexString(businessId) },
      { $set: { ratingAvg, ratingCount, updatedAt: new Date() } }
    ).catch(() => {}) // in case businessId is not an ObjectId string; ignore failure

    return NextResponse.json({ ok: true, review: doc, ratingAvg, ratingCount }, { status: 201 })
  } catch (err) {
    console.error("POST /api/reviews error", err)
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 })
  }
}
