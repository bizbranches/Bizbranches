import { NextRequest, NextResponse } from "next/server"
import { getModels } from "@/lib/models"

export const runtime = "nodejs"

// GET /api/categories?q=rest
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() || ""
    const limit = parseInt(searchParams.get("limit") || "10")

    const models = await getModels()

    const filter: any = { isActive: { $ne: false } }
    if (q) {
      const regex = new RegExp(q, "i")
      filter.$or = [{ name: regex }, { slug: regex }]
    }

    const categories = await models.categories
      .find(filter)
      .sort({ count: -1, name: 1 })
      .limit(limit)
      .toArray()

    return NextResponse.json({ ok: true, categories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ ok: false, error: "Failed to fetch categories" }, { status: 500 })
  }
}
